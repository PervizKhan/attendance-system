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
export const maxDuration = 3000000; // 50 minutes, to allow for many SMS sends

const SEND_DELAY_MS = 300000; // 5 minutes between SMS attempts to avoid rate limits

export async function GET(req: NextRequest) {
  // --- Auth: require CRON_SECRET ---
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

    // Weekly holiday check (Sunday in PKT)
    if (isPKTSunday(dateStr)) {
      return NextResponse.json({ message: 'Weekly holiday', skipped: true });
    }

    // Declared holiday check
    const holiday = await Holiday.findOne({
      date: { $gte: dayStart, $lt: dayEnd },
    });
    if (holiday) {
      return NextResponse.json({
        message: `Holiday: ${holiday.name}`,
        skipped: true,
      });
    }

    // Active students
    const students = await Student.find({ isActive: true });

    // Who is present or late today
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
      });
    }

    // Mark absent in Attendance (idempotent — only create if not already recorded)
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

    // Send SMS + log — skip students already successfully notified today
    let sentCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    for (const student of absentees) {
      // Idempotency: skip if a successful send already exists for today
      const alreadySent = await SMSLog.exists({
        studentId: student._id,
        date: { $gte: dayStart, $lt: dayEnd },
        status: 'sent',
      });
      if (alreadySent) {
        skippedCount++;
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

      // Rate limit between attempts (real sends or failures)
      await new Promise((r) => setTimeout(r, SEND_DELAY_MS));
    }

    return NextResponse.json({
      success: true,
      date: dateStr,
      absentees: absentees.length,
      smsSent: sentCount,
      smsFailed: failedCount,
      smsSkipped: skippedCount,
    });
  } catch (error) {
    console.error('Daily task error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}