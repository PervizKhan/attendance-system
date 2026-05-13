import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Staff from '@/lib/models/Staff';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { staffId, faceDescriptor } = await req.json();
    
    if (!staffId || !faceDescriptor) {
      return NextResponse.json({ error: 'Staff ID and face descriptor required' }, { status: 400 });
    }
    
    const staff = await Staff.findByIdAndUpdate(
      staffId,
      { faceDescriptor },
      { new: true }
    );
    
    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    }
    
    console.log(`Face registered for staff: ${staff.name} (${staff.designation})`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Face registered successfully',
      staff: { name: staff.name, staffId: staff.staffId }
    });
  } catch (error) {
    console.error('Error saving face descriptor:', error);
    return NextResponse.json({ error: 'Failed to save face' }, { status: 500 });
  }
}