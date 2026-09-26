// app/api/cron/daily-tasks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Student from '@/lib/models/Student';
import Attendance from '@/lib/models/Attendance';
import Holiday from '@/lib/models/Holiday';
import SMSLog from '@/lib/models/SMSLog';
import { sendAbsentSMS } from '@/lib/sms';
import { getPKTDayRange, getPKTDateString, isPKTSunday } from '@/lib/date';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_SENDS_PER_RUN = 15;
const SEND_DELAY_MS = 3000;

export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    console.error('CRON_SECRET is not configured');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();

    const dateStr = getPKTDateString();
    const { start: dayStart, end: dayEnd } = getPKTDayRange(dateStr);

    if (isPKTSunday(dateStr)) {
      return NextResponse.json({ message: 'Weekly holiday', skipped: true });
    }

    const holiday = await Holiday.findOne({
      date: { $gte: dayStart, $lt: dayEnd },
    });
    if (holiday) {
      return NextResponse.json({
        message: `Holiday: ${holiday.name}`,
        skipped: true,
      });
    }

    const students = await Student.find({ isActive: true });

    const presentIds = await Attendance.find({
      date: { $gte: dayStart, $lt: dayEnd },
      status: { $in: ['present', 'late'] },
    }).distinct('studentId');

    const presentSet = new Set(presentIds.map((id) => id.toString()));
    const absentees = students.filter(
      (s) => !presentSet.has(s._id.toString())
    );

    if (absentees.length === 0) {
      return NextResponse.json({
        success: true,
        date: dateStr,
        absentees: 0,
        smsSent: 0,
        smsFailed: 0,
        smsSkipped: 0,
        done: true,
      });
    }

    // Mark absent in Attendance — no timeIn for absentees
    for (const student of absentees) {
      const existing = await Attendance.findOne({
        studentId: student._id,
        date: { $gte: dayStart, $lt: dayEnd },
      });
      if (!existing) {
        await Attendance.create({
          studentId: student._id,
          date: dayStart,
          status: 'absent',
          markedBy: 'system',
        });
      }
    }

    let sentCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    let processedThisRun = 0;
    let remaining = 0;

    for (const student of absentees) {
      const alreadySent = await SMSLog.exists({
        studentId: student._id,
        date: { $gte: dayStart, $lt: dayEnd },
        status: 'sent',
      });
      if (alreadySent) {
        skippedCount++;
        continue;
      }

      if (processedThisRun >= MAX_SENDS_PER_RUN) {
        remaining++;
        continue;
      }

      const phone = (student.parentPhone || '').trim();

      if (!phone) {
        try {
          await SMSLog.create({
            studentId: student._id,
            studentName: student.name,
            fatherName: student.fatherName || '',
            className: student.className || '',
            parentPhone: '',
            status: 'failed',
            reason: 'No phone number',
            date: dayStart,
          });
        } catch (logErr) {
          console.error('SMSLog write failed (no phone):', logErr);
        }
        failedCount++;
        processedThisRun++;
        continue;
      }

      try {
        await sendAbsentSMS(
          phone,
          student.name,
          student.fatherName || '-',
          student.className || '-'
        );

        await SMSLog.create({
          studentId: student._id,
          studentName: student.name,
          fatherName: student.fatherName || '',
          className: student.className || '',
          parentPhone: phone,
          status: 'sent',
          reason: '',
          date: dayStart,
        });
        sentCount++;
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        try {
          await SMSLog.create({
            studentId: student._id,
            studentName: student.name,
            fatherName: student.fatherName || '',
            className: student.className || '',
            parentPhone: phone,
            status: 'failed',
            reason,
            date: dayStart,
          });
        } catch (logErr) {
          console.error('SMSLog write failed:', logErr);
        }
        failedCount++;
      }

      processedThisRun++;

      if (processedThisRun < MAX_SENDS_PER_RUN) {
        await new Promise((r) => setTimeout(r, SEND_DELAY_MS));
      }
    }

    return NextResponse.json({
      success: true,
      date: dateStr,
      absentees: absentees.length,
      smsSent: sentCount,
      smsFailed: failedCount,
      smsSkipped: skippedCount,
      remaining,
      done: remaining === 0,
    });
  } catch (error) {
    console.error('Daily task error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}