import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Student from '@/lib/models/Student';


// 🔑 FORCE DYNAMIC - NO CACHING
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    await connectDB();
    
    const students = await Student.find({ 
      isActive: true,
      faceDescriptor: { $exists: true, $ne: null }
    }).select('_id studentId name className faceDescriptor contactEmail');
    
    console.log(`✅ Kiosk API: Found ${students.length} students with faces`);
    
    const formattedStudents = students.map(s => ({
      _id: s._id.toString(),
      studentId: s.studentId,
      name: s.name,
      className: s.className,
      faceDescriptor: s.faceDescriptor,
      contactEmail: s.contactEmail,
    }));
    
    return NextResponse.json(formattedStudents);
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json([], { status: 500 });
  }
}