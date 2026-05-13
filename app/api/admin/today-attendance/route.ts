import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Attendance from '@/lib/models/Attendance';
import Student from '@/lib/models/Student';


export async function GET() {
  try {
    await connectDB();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const attendance = await Attendance.find({
      date: { $gte: today, $lt: tomorrow }
    }).populate('studentId', 'name className studentId');
    
    const formatted = attendance.map(a => ({
      id: a._id,
      studentName: (a.studentId as any)?.name || 'Unknown',
      studentId: (a.studentId as any)?.studentId || 'N/A',
      className: (a.studentId as any)?.className || 'N/A',
      time: a.timeIn,
      confidence: a.confidence,
    }));
    
    return NextResponse.json({ 
      success: true, 
      total: formatted.length,
      recent: formatted 
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json({ success: false, total: 0, recent: [] }, { status: 500 });
  }
}