// app/api/admin/face-train/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Student from '@/lib/models/Student';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET → training completion stats (students only)
export async function GET() {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();

    const studentsWithFace = await Student.countDocuments({
      faceDescriptor: { $exists: true, $ne: null },
    });

    const totalStudents = await Student.countDocuments({ isActive: true });

    return NextResponse.json({
      studentsWithFace,
      totalStudents,
      studentCompletion:
        totalStudents > 0
          ? Math.round((studentsWithFace / totalStudents) * 100)
          : 0,
    });
  } catch (error) {
    console.error('Error fetching training status:', error);
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}

// POST → retrain a single student's face
export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();

    const body = await req.json().catch(() => null);
    const id = body?.id;
    const faceDescriptor = body?.faceDescriptor;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
    }

    if (
      !Array.isArray(faceDescriptor) ||
      faceDescriptor.length === 0 ||
      !faceDescriptor.every(
        (n) => typeof n === 'number' && Number.isFinite(n)
      )
    ) {
      return NextResponse.json(
        { error: 'faceDescriptor must be a non-empty array of numbers' },
        { status: 400 }
      );
    }

    const updated = await Student.findByIdAndUpdate(
      id,
      { faceDescriptor },
      { new: true }
    ).select('_id name studentId className');

    if (!updated) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `${updated.name} face retrained successfully`,
      name: updated.name,
    });
  } catch (error) {
    console.error('Error retraining face:', error);
    return NextResponse.json({ error: 'Failed to retrain face' }, { status: 500 });
  }
}