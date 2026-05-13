import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Student from '@/lib/models/Student';

export async function POST(req: NextRequest) {
  await connectDB();
  const { studentId, faceDescriptor } = await req.json();
  await Student.findByIdAndUpdate(studentId, { faceDescriptor });
  return NextResponse.json({ success: true });
}