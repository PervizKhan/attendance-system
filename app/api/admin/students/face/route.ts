// app/api/admin/students/face/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Student from '@/lib/models/Student';
import { requireAdmin } from '@/lib/auth';

const DESCRIPTOR_LENGTH = 128;

export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();

    const body = await req.json().catch(() => null);
    const studentId = body?.studentId;
    const faceDescriptor = body?.faceDescriptor;

    if (!studentId || typeof studentId !== 'string') {
      return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
    }

    if (
      !Array.isArray(faceDescriptor) ||
      faceDescriptor.length !== DESCRIPTOR_LENGTH ||
      !faceDescriptor.every((n) => typeof n === 'number' && Number.isFinite(n))
    ) {
      return NextResponse.json(
        { error: `Invalid face descriptor format. Expected ${DESCRIPTOR_LENGTH} numbers.` },
        { status: 400 }
      );
    }

    const student = await Student.findByIdAndUpdate(
      studentId,
      { faceDescriptor },
      { new: true }
    ).select('_id name');

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    console.log(`Face registered for student: ${student.name}`);

    return NextResponse.json({
      success: true,
      message: 'Face registered successfully',
      student: { id: student._id, name: student.name },
    });
  } catch (error) {
    console.error('Error saving face descriptor:', error);
    return NextResponse.json({ error: 'Failed to save face descriptor' }, { status: 500 });
  }
}