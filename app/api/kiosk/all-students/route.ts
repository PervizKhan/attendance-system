import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Student from '@/lib/models/Student';

export async function GET() {
  try {
    await connectDB();
    
    // Get ONLY students with face descriptors registered
    const students = await Student.find({ 
      isActive: true,
      faceDescriptor: { $exists: true, $ne: null }
    }).select('_id studentId name className faceDescriptor contactEmail');
    
    // Convert faceDescriptor from number array if needed
    const formattedStudents = students.map(s => ({
      _id: s._id.toString(),
      studentId: s.studentId,
      name: s.name,
      className: s.className,
      faceDescriptor: s.faceDescriptor,
      contactEmail: s.contactEmail,
    }));
    
    console.log(`Kiosk API: Returning ${formattedStudents.length} students with registered faces`);
    
    return NextResponse.json(formattedStudents);
  } catch (error) {
    console.error('Error fetching students for kiosk:', error);
    return NextResponse.json([], { status: 500 });
  }
}