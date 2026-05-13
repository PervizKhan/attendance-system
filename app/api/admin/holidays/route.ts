import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Holiday from '@/lib/models/Holiday';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const holidays = await Holiday.find().sort({ date: 1 });
    return NextResponse.json(holidays);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch holidays' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const holiday = await Holiday.create(body);
    return NextResponse.json(holiday);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create holiday' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    await Holiday.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete holiday' }, { status: 500 });
  }
}