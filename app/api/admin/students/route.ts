import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Student from '@/lib/models/Student';

export async function GET() {
  try {
    await connectDB();
    const students = await Student.find({ isActive: true }).sort({ createdAt: -1 });
    
    // Add hasFace flag without exposing descriptor
    const studentsWithFace = students.map(s => ({
      ...s.toObject(),
      hasFace: !!s.faceDescriptor && s.faceDescriptor.length > 0,
      faceDescriptor: undefined, // Don't send face descriptor in list
    }));
    
    return NextResponse.json(studentsWithFace);
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    
    const student = await Student.create({
      studentId: body.studentId,
      rollNo: body.rollNo,
      name: body.name,
      fatherName: body.fatherName,
      className: body.className,
      address: body.address,
      contactEmail: body.contactEmail,
      contactPhone: body.contactPhone,
      parentPhone: body.parentPhone,  // ← Add this
      isActive: true,
    });
    
    return NextResponse.json(student);
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json({ error: 'Failed to create student' }, { status: 500 });
  }
}


export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { id, ...updateData } = body;
    
    const student = await Student.findByIdAndUpdate(id, updateData, { new: true });
    return NextResponse.json(student);
  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
    }
    
    await Student.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 });
  }
}