import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Attendance from '@/lib/models/Attendance';
import Student from '@/lib/models/Student';

export async function GET() {
  try {
    await connectDB();
    
    const today = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const labels = [];
    const presentData = [];
    const absentData = [];
    const totalData = [];
    
    // Get last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);
      
      labels.push(dayNames[date.getDay()]);
      
      const present = await Attendance.countDocuments({
        date: { $gte: date, $lt: nextDay },
        status: 'present',
      });
      
      const absent = await Attendance.countDocuments({
        date: { $gte: date, $lt: nextDay },
        status: 'absent',
      });
      
      const totalStudents = await Student.countDocuments({ isActive: true });
      
      presentData.push(present);
      absentData.push(absent);
      totalData.push(totalStudents);
    }
    
    return NextResponse.json({
      labels,
      present: presentData,
      absent: absentData,
      total: totalData,
    });
    
  } catch (error) {
    console.error('Chart data error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}