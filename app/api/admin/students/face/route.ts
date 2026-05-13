import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Student from '@/lib/models/Student';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    const body = await req.json();
    console.log('Face registration request:', { studentId: body.studentId, hasDescriptor: !!body.faceDescriptor });
    
    const { studentId, faceDescriptor } = body;
    
    if (!studentId || !faceDescriptor) {
      return NextResponse.json({ error: 'Student ID and face descriptor required' }, { status: 400 });
    }
    
    // Validate that faceDescriptor is an array of 128 numbers
    if (!Array.isArray(faceDescriptor) || faceDescriptor.length !== 128) {
      return NextResponse.json({ error: 'Invalid face descriptor format. Expected 128 numbers.' }, { status: 400 });
    }
    
    const student = await Student.findByIdAndUpdate(
      studentId,
      { faceDescriptor },
      { new: true }
    );
    
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    
    console.log(`Face registered for student: ${student.name}`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Face registered successfully',
      student: { id: student._id, name: student.name }
    });
    
  } catch (error) {
    console.error('Error saving face descriptor:', error);
    return NextResponse.json({ error: 'Failed to save face descriptor' }, { status: 500 });
  }
}