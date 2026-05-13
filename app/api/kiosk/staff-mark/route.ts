import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import StaffAttendance from '@/lib/models/StaffAttendance';
import Staff from '@/lib/models/Staff';
import Holiday from '@/lib/models/Holiday';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendStaffNotification(email: string, staffName: string, status: string, time: string) {
  const statusText = status === 'present' ? '✓ Present' : status === 'late' ? '⚠️ Late' : '✗ Absent';
  const statusColor = status === 'present' ? 'green' : status === 'late' ? 'orange' : 'red';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
      <div style="background: #0b1f3a; color: #d4af37; padding: 20px; text-align: center;">
        <h2>👨‍🏫 Staff Attendance Notification</h2>
      </div>
      <div style="padding: 20px; border: 1px solid #ddd;">
        <p><strong>Staff:</strong> ${staffName}</p>
        <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${statusText}</span></p>
        <p><strong>Time:</strong> ${time}</p>
      </div>
      <div style="background: #f5f5f5; padding: 10px; text-align: center; font-size: 12px;">
        <p>This is an automated message from DIT School Attendance System</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `👨‍🏫 Staff Attendance: ${staffName} - ${statusText}`,
      html,
    });
    console.log(`Email sent to ${email}`);
  } catch (error) {
    console.error('Email error:', error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    const { staffId, confidence, location } = await req.json();
    
    if (!staffId) {
      return NextResponse.json({ error: 'Staff ID required' }, { status: 400 });
    }
    
    // Check if today is a holiday
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const holiday = await Holiday.findOne({
      date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
    });
    
    if (holiday) {
      return NextResponse.json({ 
        success: false, 
        message: `Today is a holiday (${holiday.name}). No attendance required.`,
        isHoliday: true
      }, { status: 200 });
    }
    
    // Check if already marked today
    const existing = await StaffAttendance.findOne({
      staffId,
      date: { $gte: today }
    });
    
    if (existing) {
      return NextResponse.json({ 
        success: false, 
        message: 'Attendance already marked today',
        alreadyMarked: true,
        status: existing.status
      }, { status: 200 });
    }
    
    // Get staff details
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    }
    
    // Check if staff is late (after 8:30 AM for morning shift)
    const now = new Date();
    const cutoffTime = new Date();
    cutoffTime.setHours(8, 30, 0, 0);
    const isLate = now > cutoffTime;
    const status = isLate ? 'late' : 'present';
    
    // Create attendance record
    const attendance = await StaffAttendance.create({
      staffId,
      date: today,
      timeIn: now,
      confidence: confidence || 0.95,
      status: status,
      location: location || 'main_gate',
      markedBy: 'face',
      emailSent: false
    });
    
    console.log(`✅ ${status.toUpperCase()} marked for ${staff.name} (${staff.designation}) at ${now.toLocaleTimeString()}`);
    
    // Send email notification if staff has email
    if (staff.email) {
      await sendStaffNotification(staff.email, staff.name, status, now.toLocaleTimeString());
    }
    
    return NextResponse.json({
      success: true,
      message: `Attendance marked for ${staff.name}${isLate ? ' (Late)' : ''}`,
      status: status,
      staff: {
        name: staff.name,
        staffId: staff.staffId,
        designation: staff.designation,
        email: staff.email
      },
      attendance: {
        time: attendance.timeIn,
        confidence: attendance.confidence,
        status: attendance.status
      }
    });
    
  } catch (error) {
    console.error('Error marking staff attendance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}