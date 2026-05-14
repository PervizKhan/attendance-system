import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Student from '@/lib/models/Student';
import Attendance from '@/lib/models/Attendance';
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

async function sendAbsentReminder(parentEmail: string, studentName: string, studentId: string, className: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Absence Notification</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 500px; margin: 0 auto; padding: 20px; }
        .header { background: #0b1f3a; color: #d4af37; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px; }
        .status { color: #ef4444; font-weight: bold; font-size: 18px; }
        .info { margin: 10px 0; }
        .button { display: inline-block; padding: 10px 20px; background: #d4af37; color: #0b1f3a; text-decoration: none; border-radius: 5px; margin-top: 15px; }
        .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>⚠️ Absence Notification</h2>
        </div>
        <div class="content">
          <p>Dear Parent,</p>
          <p class="status">Your child has been marked <strong>ABSENT</strong> today.</p>
          
          <div class="info">
            <div><strong>Student:</strong> ${studentName}</div>
            <div><strong>ID:</strong> ${studentId}</div>
            <div><strong>Class:</strong> ${className}</div>
            <div><strong>Date:</strong> ${new Date().toLocaleDateString()}</div>
          </div>
          
          <p>Please ensure your child attends school regularly.</p>
          <p>If your child was present but not marked, please contact the school office.</p>
          
          <div style="text-align: center;">
            <a href="https://oxford-attendance.vercel.app/parent-attendance" class="button">View Attendance Record</a>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated message from Oxford Group of Colleges Attendance System</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"Oxford Attendance" <${process.env.EMAIL_USER}>`,
      to: parentEmail,
      subject: `⚠️ Attendance Alert: ${studentName} marked ABSENT today`,
      html,
    });
    console.log(`✅ Absent reminder sent to ${parentEmail} for ${studentName}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send absent reminder to ${parentEmail}:`, error);
    return false;
  }
}

export async function GET() {
  try {
    await connectDB();
    
    console.log('⏰ Running absent reminder check...', new Date().toLocaleTimeString());
    
    // Check if today is a holiday
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const holiday = await Holiday.findOne({
      date: { $gte: today, $lt: tomorrow }
    });
    
    if (holiday) {
      console.log(`📅 Today is a holiday (${holiday.name}). No absent reminders will be sent.`);
      return NextResponse.json({ 
        message: `Today is a holiday (${holiday.name})`, 
        isHoliday: true,
        sent: 0 
      });
    }
    
    // Get all active students
    const allStudents = await Student.find({ isActive: true, contactEmail: { $nin: [null, ''] } });
    
    // Get students who already marked attendance today (present or late)
    const presentStudents = await Attendance.find({
      date: { $gte: today, $lt: tomorrow },
      status: { $in: ['present', 'late'] }
    }).distinct('studentId');
    
    const presentStudentIds = presentStudents.map(id => id.toString());
    
    // Find absent students (not marked present/late)
    const absentStudents = allStudents.filter(
      s => !presentStudentIds.includes(s._id.toString())
    );
    
    console.log(`📊 Total students: ${allStudents.length}`);
    console.log(`✅ Present/Late: ${presentStudentIds.length}`);
    console.log(`❌ Absent: ${absentStudents.length}`);
    
    // Send reminders to parents of absent students
    let sentCount = 0;
    let failedCount = 0;
    
    for (const student of absentStudents) {
      const success = await sendAbsentReminder(
        student.contactEmail,
        student.name,
        student.studentId,
        student.className
      );
      
      if (success) {
        sentCount++;
      } else {
        failedCount++;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`📧 Absent reminders sent: ${sentCount}, Failed: ${failedCount}`);
    
    return NextResponse.json({
      success: true,
      message: 'Absent reminders sent',
      totalStudents: allStudents.length,
      present: presentStudentIds.length,
      absent: absentStudents.length,
      remindersSent: sentCount,
      failed: failedCount,
    });
    
  } catch (error) {
    console.error('Absent reminder error:', error);
    return NextResponse.json({ error: 'Failed to send absent reminders' }, { status: 500 });
  }
}