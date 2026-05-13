import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Admin from '@/lib/models/Admin';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    const { name, email, password, secretKey } = await req.json();
    
    // Verify secret key
    if (secretKey !== process.env.ADMIN_SETUP_KEY) {
      return NextResponse.json({ error: 'Invalid setup key' }, { status: 401 });
    }
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne();
    if (existingAdmin) {
      return NextResponse.json({ error: 'Admin already exists' }, { status: 400 });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create admin
    const admin = await Admin.create({
      name,
      email,
      password: hashedPassword,
      role: 'super_admin',
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Admin created successfully',
      admin: { name: admin.name, email: admin.email }
    });
    
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({ error: 'Setup failed' }, { status: 500 });
  }
}