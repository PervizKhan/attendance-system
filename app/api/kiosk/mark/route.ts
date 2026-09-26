// app/api/kiosk/mark/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Attendance from '@/lib/models/Attendance';
import Student from '@/lib/models/Student';
import Holiday from '@/lib/models/Holiday';
import { getPKTDayRange } from '@/lib/date';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { studentId, confidence, location } = await req.json();

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
    }

    // PKT day range
    const { start: dayStart, end: dayEnd } = getPKTDayRange();

    // Holiday check
    const holiday = await Holiday.findOne({
      date: { $gte: dayStart, $lt: dayEnd },
    });

    if (holiday) {
      return NextResponse.json(
        {
          success: false,
          message: `Today is a holiday (${holiday.name}). No attendance required.`,
          isHoliday: true,
          holidayName: holiday.name,
        },
        { status: 200 }
      );
    }

    // Already marked today?
    const existing = await Attendance.findOne({
      studentId,
      date: { $gte: dayStart, $lt: dayEnd },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: 'Attendance already marked today',
          alreadyMarked: true,
          status: existing.status,
        },
        { status: 200 }
      );
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Late check (after 8:30 AM PKT)
    const now = new Date();
    // PKT "now" as if it were the server's local time, for hour/minute comparison
    const pktNow = new Date(now.getTime() + 5 * 60 * 60 * 1000);
    const pktHour = pktNow.getUTCHours();
    const pktMinute = pktNow.getUTCMinutes();
    const isLate = pktHour > 8 || (pktHour === 8 && pktMinute > 30);
    const status = isLate ? 'late' : 'present';

    const attendance = await Attendance.create({
      studentId,
      date: dayStart,
      timeIn: now,
      confidence: confidence || 0.95,
      status,
      location: location || 'school_gate',
      markedBy: 'face',
    });

    const statusMessage = isLate ? '⚠️ Marked as LATE' : '✅ Present';
    console.log(
      `${statusMessage} for ${student.name} at ${pktNow.toISOString().slice(11, 19)} PKT`
    );

    return NextResponse.json({
      success: true,
      message: `Attendance marked for ${student.name}${isLate ? ' (Late)' : ''}`,
      status,
      isLate,
      student: {
        name: student.name,
        studentId: student.studentId,
        className: student.className,
      },
      attendance: {
        time: attendance.timeIn,
        confidence: attendance.confidence,
        status: attendance.status,
      },
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}