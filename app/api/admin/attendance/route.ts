import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Attendance from '@/lib/models/Attendance';
import Student from '@/lib/models/Student';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'today';
    
    // Set date range based on filter
    const now = new Date();
    let startDate: Date;
    
    switch (filter) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'yesterday':
        startDate = new Date(now.setDate(now.getDate() - 1));
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      default:
        startDate = new Date(now.setHours(0, 0, 0, 0));
    }
    
    const attendance = await Attendance.find({
      date: { $gte: startDate },
      status: 'present',
    }).populate('studentId', 'name studentId className').sort({ date: -1 });
    
    const records = attendance.map(a => ({
      id: a._id,
      studentName: (a.studentId as any)?.name || 'Unknown',
      studentId: (a.studentId as any)?.studentId || 'N/A',
      className: (a.studentId as any)?.className || 'N/A',
      time: a.timeIn,
      date: a.date,
      confidence: a.confidence || 0.95,
      status: a.status,
    }));
    
    return NextResponse.json({ records, count: records.length });
    
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json({ records: [], error: 'Failed to fetch' }, { status: 500 });
  }
}