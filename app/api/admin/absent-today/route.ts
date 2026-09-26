// app/api/admin/absent-today/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import SMSLog from '@/lib/models/SMSLog';
import { getPKTDayRange, getPKTDateString } from '@/lib/date';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date') || getPKTDateString();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return NextResponse.json(
        { error: 'Invalid date format (expected YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    let dayStart: Date;
    let dayEnd: Date;
    try {
      ({ start: dayStart, end: dayEnd } = getPKTDayRange(dateParam));
    } catch {
      return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
    }

    const logs = await SMSLog.find({
      date: { $gte: dayStart, $lt: dayEnd },
    })
      .sort({ className: 1, studentName: 1 })
      .lean();

    const sent = logs.filter((l) => l.status === 'sent');
    const failed = logs.filter((l) => l.status === 'failed');

    return NextResponse.json({
      date: dateParam,
      totalAbsent: logs.length,
      sentCount: sent.length,
      failedCount: failed.length,
      sent: sent.map((l) => ({
        _id: String(l._id),
        studentId: String(l.studentId),
        studentName: l.studentName,
        fatherName: l.fatherName,
        className: l.className,
        parentPhone: l.parentPhone,
        sentAt: l.sentAt,
      })),
      failed: failed.map((l) => ({
        _id: String(l._id),
        studentId: String(l.studentId),
        studentName: l.studentName,
        fatherName: l.fatherName,
        className: l.className,
        parentPhone: l.parentPhone,
        reason: l.reason,
      })),
    });
  } catch (error) {
    console.error('Absent-today error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}