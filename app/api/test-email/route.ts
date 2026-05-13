import { NextResponse } from 'next/server';
import { testEmail } from '@/lib/email';

export async function GET() {
  const result = await testEmail('pervizkhan4@gmail.com'); // Replace with your email
  return NextResponse.json(result);
}