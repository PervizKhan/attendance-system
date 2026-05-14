import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Student from '@/lib/models/Student';
import Staff from '@/lib/models/Staff';

export const dynamic = 'force-dynamic';

// Get training status
export async function GET() {
  try {
    await connectDB();
    
    const studentsWithFace = await Student.countDocuments({
      faceDescriptor: { $exists: true, $ne: null }
    });
    
    const staffWithFace = await Staff.countDocuments({
      faceDescriptor: { $exists: true, $ne: null }
    });
    
    const totalStudents = await Student.countDocuments({ isActive: true });
    const totalStaff = await Staff.countDocuments({ isActive: true });
    
    return NextResponse.json({
      studentsWithFace,
      totalStudents,
      staffWithFace,
      totalStaff,
      studentCompletion: totalStudents > 0 ? Math.round((studentsWithFace / totalStudents) * 100) : 0,
      staffCompletion: totalStaff > 0 ? Math.round((staffWithFace / totalStaff) * 100) : 0,
    });
  } catch (error) {
    console.error('Error fetching training status:', error);
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}

// Retrain a specific student's face
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { type, id, faceDescriptor } = await req.json();
    
    if (!id || !faceDescriptor) {
      return NextResponse.json({ error: 'ID and face descriptor required' }, { status: 400 });
    }
    
    let updated;
    if (type === 'student') {
      updated = await Student.findByIdAndUpdate(
        id,
        { faceDescriptor, updatedAt: new Date() },
        { new: true }
      );
    } else if (type === 'staff') {
      updated = await Staff.findByIdAndUpdate(
        id,
        { faceDescriptor, updatedAt: new Date() },
        { new: true }
      );
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      message: `${updated?.name} face retrained successfully`,
      name: updated?.name
    });
  } catch (error) {
    console.error('Error retraining face:', error);
    return NextResponse.json({ error: 'Failed to retrain face' }, { status: 500 });
  }
}