import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Attendance from '@/lib/models/Attendance';
import Student from '@/lib/models/Student';
import Holiday from '@/lib/models/Holiday';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    const { studentId, confidence, location } = await req.json();
    
    if (!studentId) {
      return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
    }
    
    // Check if today is a holiday
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const holiday = await Holiday.findOne({
      date: { $gte: today, $lt: tomorrow }
    });
    
    if (holiday) {
      return NextResponse.json({ 
        success: false, 
        message: `Today is a holiday (${holiday.name}). No attendance required.`,
        isHoliday: true,
        holidayName: holiday.name
      }, { status: 200 });
    }
    
    // Check if already marked today
    const existing = await Attendance.findOne({
      studentId,
      date: { $gte: today }
    });
    
    if (existing) {
      return NextResponse.json({ 
        success: false,
        message: 'Attendance already marked today',
        alreadyMarked: true,
        status: existing.status
      }, { status: 200 });
    }
    
    // Get student
    const student = await Student.findById(studentId);
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    
    // Check if student is late (after 8:30 AM)
    const now = new Date();
    const cutoffTime = new Date();
    cutoffTime.setHours(8, 30, 0, 0); // 8:30 AM cutoff
    
    const isLate = now > cutoffTime;
    const status = isLate ? 'late' : 'present';
    
    // Create attendance record
    const attendance = await Attendance.create({
      studentId,
      date: today,
      timeIn: now,
      confidence: confidence || 0.95,
      status: status,
      location: location || 'school_gate',
      emailSent: false
    });
    
    const statusMessage = status === 'late' ? '⚠️ Marked as LATE' : '✅ Present';
    console.log(`${statusMessage} for ${student.name} at ${now.toLocaleTimeString()}`);
    
    return NextResponse.json({
      success: true,
      message: `Attendance marked for ${student.name}${status === 'late' ? ' (Late)' : ''}`,
      status: status,
      isLate: isLate,
      student: {
        name: student.name,
        studentId: student.studentId,
        className: student.className,
        email: student.contactEmail
      },
      attendance: {
        time: attendance.timeIn,
        confidence: attendance.confidence,
        status: attendance.status
      }
    });
    
  } catch (error) {
    console.error('Error marking attendance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}