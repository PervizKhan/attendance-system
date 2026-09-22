import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Student from '@/lib/models/Student';
import Attendance from '@/lib/models/Attendance';
import Holiday from '@/lib/models/Holiday';
import { sendAbsentSMS } from '@/lib/sms';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Weekly holidays — change if your school's off day is different
// 0 = Sunday, 1 = Monday, 2 = Tuesday, ..., 6 = Saturday
const WEEKLY_HOLIDAYS: number[] = [0]; // Sunday only

export async function GET() {
  try {
    await connectDB();
    console.log('Daily tasks started:', new Date().toISOString());

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // ─── Check 1: Weekly holiday (Sunday) ───
    const dayOfWeek = today.getDay();
    if (WEEKLY_HOLIDAYS.includes(dayOfWeek)) {
      console.log('Today is a weekly holiday. Skipping.');
      return NextResponse.json({
        message: 'Weekly holiday',
        isWeeklyHoliday: true,
      });
    }

    // ─── Check 2: Declared holiday in database ───
    const holiday = await Holiday.findOne({
      date: { $gte: today, $lt: tomorrow },
    });
    if (holiday) {
      console.log(`Declared holiday today: ${holiday.name}. Skipping.`);
      return NextResponse.json({
        message: `Holiday: ${holiday.name}`,
        isHoliday: true,
      });
    }

    // ─── Proceed with normal flow ───
    const students = await Student.find({
      isActive: true,
      parentPhone: { $nin: [null, ''] },
    });

    const presentIds = await Attendance.find({
      date: { $gte: today, $lt: tomorrow },
      status: { $in: ['present', 'late'] },
    }).distinct('studentId');

    const presentSet = new Set(presentIds.map((id) => id.toString()));

    const absentees = students.filter(
      (s) => !presentSet.has(s._id.toString())
    );

    // Mark absent
    let marked = 0;
    for (const student of absentees) {
      const existing = await Attendance.findOne({
        studentId: student._id,
        date: { $gte: today },
      });
      if (!existing) {
        await Attendance.create({
          studentId: student._id,
          date: today,
          timeIn: new Date(),
          status: 'absent',
          markedBy: 'system',
        });
        marked++;
      }
    }

    // Send SMS
    let sent = 0;
    let failed = 0;
    for (const student of absentees) {
      try {
        await sendAbsentSMS(
          student.parentPhone,
          student.name,
          student.fatherName || '-',
          student.className
        );
        sent++;
      } catch (err) {
        failed++;
        console.error(`SMS failed for ${student.name}:`, err);
      }
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    return NextResponse.json({
      success: true,
      date: today.toISOString().split('T')[0],
      totalStudents: students.length,
      present: presentSet.size,
      absentees: absentees.length,
      marked,
      smsSent: sent,
      smsFailed: failed,
    });
  } catch (error) {
    console.error('Daily task error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}