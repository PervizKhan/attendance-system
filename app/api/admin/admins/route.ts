import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Admin from '@/lib/models/Admin';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

// Get all admins
export async function GET() {
  try {
    await connectDB();
    const admins = await Admin.find().select('-password').sort({ createdAt: -1 });
    return NextResponse.json(admins);
  } catch (error) {
    console.error('Error fetching admins:', error);
    return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 });
  }
}

// Create new admin
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { name, email, password, role } = await req.json();
    
    // Check if admin exists
    const existing = await Admin.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: 'Admin already exists' }, { status: 400 });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const admin = await Admin.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'admin',
    });
    
    return NextResponse.json({ 
      success: true, 
      admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role }
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    return NextResponse.json({ error: 'Failed to create admin' }, { status: 500 });
  }
}

// Update admin
export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const { id, name, email, role, password } = await req.json();
    
    const updateData: any = { name, email, role };
    if (password && password.length > 0) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    
    const admin = await Admin.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
    
    return NextResponse.json({ success: true, admin });
  } catch (error) {
    console.error('Error updating admin:', error);
    return NextResponse.json({ error: 'Failed to update admin' }, { status: 500 });
  }
}

// Delete admin
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    // Prevent deleting the last super admin
    const adminCount = await Admin.countDocuments();
    if (adminCount <= 1) {
      return NextResponse.json({ error: 'Cannot delete the last admin' }, { status: 400 });
    }
    
    await Admin.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting admin:', error);
    return NextResponse.json({ error: 'Failed to delete admin' }, { status: 500 });
  }
}