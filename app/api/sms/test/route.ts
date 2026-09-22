import { NextResponse } from 'next/server';
import { sendAbsentSMS } from '@/lib/sms';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await sendAbsentSMS(
      '+923349149580',   // parent phone
      'Ali Raza',        // student name
      'Muhammad Raza',   // father name
      'Class 9'          // class (optional)
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}