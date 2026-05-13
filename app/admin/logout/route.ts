import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  
  // Delete the admin token cookie
  cookieStore.set('adminToken', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });
  
  return NextResponse.json({ success: true });
}