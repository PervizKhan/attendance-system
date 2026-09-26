// app/api/admin/students/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Student from '@/lib/models/Student';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// ---------- GET: list students ----------
export async function GET() {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();

    const students = await Student.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    const studentsWithFace = students.map((s) => {
      const { faceDescriptor, ...rest } = s as any;
      return {
        ...rest,
        _id: String(s._id),
        hasFace: Array.isArray(faceDescriptor) && faceDescriptor.length > 0,
      };
    });

    return NextResponse.json(studentsWithFace);
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}

// ---------- POST: create student ----------
export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const required = ['studentId', 'name', 'fatherName', 'className', 'parentPhone'];
    const missing = required.filter((k) => !body[k] || String(body[k]).trim() === '');
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    const student = await Student.create({
      studentId: String(body.studentId).trim(),
      rollNo: body.rollNo || '',
      name: String(body.name).trim(),
      fatherName: String(body.fatherName).trim(),
      className: String(body.className).trim(),
      address: body.address || '',
      parentPhone: String(body.parentPhone).trim(),
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      student: {
        _id: String(student._id),
        studentId: student.studentId,
        name: student.name,
        fatherName: student.fatherName,
        className: student.className,
        parentPhone: student.parentPhone,
      },
    });
  } catch (error: any) {
    console.error('Error creating student:', error);
    if (error?.code === 11000) {
      return NextResponse.json(
        { error: 'A student with this ID already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Failed to create student' }, { status: 500 });
  }
}

// ---------- PUT: update student ----------
export async function PUT(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();

    const body = await req.json().catch(() => null);
    if (!body || !body.id) {
      return NextResponse.json({ error: 'Student id required' }, { status: 400 });
    }

    // Whitelist updatable fields — no mass assignment
    const allowed = ['name', 'fatherName', 'className', 'studentId', 'rollNo', 'address', 'parentPhone'];
    const updateData: Record<string, any> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) {
        updateData[key] = typeof body[key] === 'string' ? body[key].trim() : body[key];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const student = await Student.findByIdAndUpdate(body.id, updateData, {
      new: true,
      runValidators: true,
    }).select('_id studentId name fatherName className parentPhone address');

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, student });
  } catch (error: any) {
    console.error('Error updating student:', error);
    if (error?.code === 11000) {
      return NextResponse.json(
        { error: 'A student with this ID already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

// ---------- DELETE: remove student ----------
export async function DELETE(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
    }

    const deleted = await Student.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 });
  }
}