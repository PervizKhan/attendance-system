import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Student from '@/lib/models/Student';
import Attendance from '@/lib/models/Attendance';

export async function POST() {
  try {
    await connectDB();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cutoffTime = new Date();
    cutoffTime.setHours(9, 0, 0, 0); // 9:00 AM cutoff
    
    // Get all active students
    const allStudents = await Student.find({ isActive: true });
    
    // Get students who already marked attendance today
    const presentRecords = await Attendance.find({
      date: { $gte: today },
      status: 'present'
    });
    
    const presentStudentIds = presentRecords.map(r => r.studentId.toString());
    
    // Find absent students
    const absentStudents = allStudents.filter(
      s => !presentStudentIds.includes(s._id.toString())
    );
    
    // Mark absent for those who haven't checked in
    let absentCount = 0;
    for (const student of absentStudents) {
      // Check if already marked absent today
      const existingAbsent = await Attendance.findOne({
        studentId: student._id,
        date: { $gte: today },
        status: 'absent'
      });
      
      if (!existingAbsent) {
        await Attendance.create({
          studentId: student._id,
          date: today,
          timeIn: cutoffTime,
          status: 'absent',
          markedBy: 'system',
          location: 'auto_marked',
          confidence: 0,
        });
        absentCount++;
      }
    }
    
    return NextResponse.json({
      success: true,
      total: allStudents.length,
      present: presentStudentIds.length,
      absent: absentCount,
      message: `Marked ${absentCount} students as absent`
    });
    
  } catch (error) {
    console.error('Error marking absent:', error);
    return NextResponse.json({ error: 'Failed to mark absent students' }, { status: 500 });
  }
}