import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Student from '@/lib/models/Student';
import Attendance from '@/lib/models/Attendance';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');
    
    if (!phone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
    }
    
    // Clean phone number
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.substring(1);
    }
    
    // Find student by parent phone number
    const student = await Student.findOne({ 
      $or: [
        { parentPhone: { $regex: cleanPhone, $options: 'i' } },
        { parentPhone: { $regex: `0${cleanPhone}`, $options: 'i' } },
        { parentPhone: { $regex: `92${cleanPhone}`, $options: 'i' } },
        { contactPhone: { $regex: cleanPhone, $options: 'i' } },
        { contactPhone: { $regex: `0${cleanPhone}`, $options: 'i' } }
      ]
    });
    
    if (!student) {
      return NextResponse.json({ error: 'Student not found with this WhatsApp number' }, { status: 404 });
    }
    
    // Get attendance records (last 30 days)
    const attendance = await Attendance.find({ 
      studentId: student._id 
    }).sort({ date: -1 }).limit(30);
    
    return NextResponse.json({
      student: {
        name: student.name,
        studentId: student.studentId,
        className: student.className,  // ✅ Added className
        fatherName: student.fatherName,
        parentPhone: student.parentPhone,
        contactEmail: student.contactEmail,
      },
      attendance: attendance.map(a => ({
        date: a.date,
        time: a.timeIn,
        status: a.status,
        className: student.className,  // ✅ Added className to each record
      })),
    });
    
  } catch (error) {
    console.error('Parent API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}