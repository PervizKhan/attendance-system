import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('adminToken')?.value;
    
    if (!token) {
      return NextResponse.json({ 
        authenticated: false, 
        user: null 
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    
    return NextResponse.json({ 
      authenticated: true, 
      user: {
        id: (decoded as any).id,
        email: (decoded as any).email,
        role: (decoded as any).role || 'admin'
      }
    });
    
  } catch (error) {
    return NextResponse.json({ 
      authenticated: false, 
      user: null 
    });
  }
}