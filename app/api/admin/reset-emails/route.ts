import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Attendance from '@/lib/models/Attendance';

export async function POST() {
  await connectDB();
  
  // Reset emailSent flag for today's attendance (testing only)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const result = await Attendance.updateMany(
    { date: { $gte: today }, emailSent: true },
    { $set: { emailSent: false } }
  );
  
  return NextResponse.json({ 
    message: `Reset ${result.modifiedCount} attendance records`,
    modifiedCount: result.modifiedCount 
  });
}