import { NextResponse, NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Student from '@/lib/models/Student';
import Attendance from '@/lib/models/Attendance';
import Admin from '@/lib/models/Admin';
import Holiday from '@/lib/models/Holiday';

export async function GET() {
  try {
    await connectDB();
    
    const backup = {
      timestamp: new Date().toISOString(),
      students: await Student.find({}),
      attendance: await Attendance.find({}),
      admins: await Admin.find({}).select('-password'),
      holidays: await Holiday.find({}),
    };
    
    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename=backup_${new Date().toISOString().split('T')[0]}.json`,
      },
    });
  } catch (error) {
    console.error('Backup error:', error);
    return NextResponse.json({ error: 'Backup failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const backup = await req.json();
    
    // Restore logic (be careful with this)
    // This would clear existing data and restore from backup
    
    return NextResponse.json({ success: true, message: 'Restore completed (simulated)' });
  } catch (error) {
    return NextResponse.json({ error: 'Restore failed' }, { status: 500 });
  }
}