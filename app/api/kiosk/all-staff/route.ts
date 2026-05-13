import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Staff from '@/lib/models/Staff';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const staff = await Staff.find({ 
      isActive: true,
      faceDescriptor: { $exists: true, $ne: null }
    }).select('_id staffId name designation shift faceDescriptor email');
    
    return NextResponse.json(staff);
  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json([], { status: 500 });
  }
}