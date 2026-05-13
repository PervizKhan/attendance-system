import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Staff from '@/lib/models/Staff';

export async function GET() {
  try {
    await connectDB();
    const staff = await Staff.find({ isActive: true }).sort({ designation: 1, name: 1 });
    
    // Add hasFace flag to each staff member
    const staffWithFace = staff.map(s => ({
      ...s.toObject(),
      hasFace: !!(s.faceDescriptor && s.faceDescriptor.length > 0),
      faceDescriptor: undefined, // Don't send face descriptor in list
    }));
    
    return NextResponse.json(staffWithFace);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const staff = await Staff.create(body);
    return NextResponse.json(staff);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create staff' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const { id, ...updateData } = await req.json();
    const staff = await Staff.findByIdAndUpdate(id, updateData, { new: true });
    return NextResponse.json(staff);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update staff' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    await Staff.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete staff' }, { status: 500 });
  }
}