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

// Send attendance summary emails
async function sendAttendanceEmails() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const unsentRecords = await Attendance.find({
    date: { $gte: today, $lt: tomorrow },
    status: { $in: ['present', 'late'] },
    emailSent: false
  }).populate('studentId', 'name studentId className contactEmail');
  
  if (unsentRecords.length === 0) return { sent: 0, message: 'No new records' };
  
  const parentGroups: { [email: string]: any[] } = {};
  const recordIds: string[] = [];
  
  for (const record of unsentRecords) {
    const student = record.studentId as any;
    if (student && student.contactEmail) {
      if (!parentGroups[student.contactEmail]) {
        parentGroups[student.contactEmail] = [];
      }
      parentGroups[student.contactEmail].push({
        name: student.name,
        studentId: student.studentId,
        className: student.className,
        time: new Date(record.timeIn).toLocaleTimeString(),
        status: record.status,
      });
      recordIds.push(record._id);
    }
  }
  
  let emailCount = 0;
  for (const [email, students] of Object.entries(parentGroups)) {
    try {
      const studentsList = students.map(s => {
        const statusText = s.status === 'present' ? '✓ Present' : '⚠️ Late';
        const statusColor = s.status === 'present' ? 'green' : 'orange';
        return `
          <tr>
            <td style="padding: 8px;">${s.name}</td>
            <td style="padding: 8px;">${s.studentId}</td>
            <td style="padding: 8px;">${s.className}</td>
            <td style="padding: 8px; color: ${statusColor};">${statusText}</td>
            <td style="padding: 8px;">${s.time}</td>
          </tr>
        `;
      }).join('');
      
      await transporter.sendMail({
        from: `"Oxford Attendance" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `📋 Attendance Summary - ${new Date().toLocaleDateString()}`,
        html: `
          <h2>Attendance Notification</h2>
          <p>Your child(ren) attendance summary:</p>
          <table border="1" cellpadding="8" style="border-collapse: collapse;">
            <tr style="background: #0b1f3a; color: #d4af37;">
              <th>Name</th><th>ID</th><th>Class</th><th>Status</th><th>Time</th>
            </tr>
            ${studentsList}
           </table>
          <p>This is an automated message from Oxford Attendance System.</p>
        `,
      });
      emailCount++;
    } catch (err) { 
      console.error('Email error:', err); 
    }
  }
  
  if (recordIds.length > 0) {
    await Attendance.updateMany(
      { _id: { $in: recordIds } }, 
      { $set: { emailSent: true } }
    );
  }
  
  return { sent: emailCount, records: unsentRecords.length };
}

// Mark absent students
async function markAbsentStudents() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const allStudents = await Student.find({ isActive: true });
  const presentStudents = await Attendance.find({
    date: { $gte: today, $lt: tomorrow },
    status: { $in: ['present', 'late'] }
  }).distinct('studentId');
  
  const presentStudentIds = presentStudents.map(id => id.toString());
  const absentStudents = allStudents.filter(s => !presentStudentIds.includes(s._id.toString()));
  
  let absentCount = 0;
  for (const student of absentStudents) {
    const existingAbsent = await Attendance.findOne({
      studentId: student._id,
      date: { $gte: today }
    });
    if (!existingAbsent) {
      await Attendance.create({
        studentId: student._id,
        date: today,
        timeIn: new Date(),
        status: 'absent',
        markedBy: 'system',
        emailSent: false,
      });
      absentCount++;
    }
  }
  return { absent: absentCount, total: allStudents.length, present: presentStudentIds.length };
}

// Send absent reminders to parents
async function sendAbsentReminders() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const allStudents = await Student.find({ 
    isActive: true, 
    contactEmail: { $ne: null } 
  }).where('contactEmail').ne('');
  
  const presentStudents = await Attendance.find({
    date: { $gte: today, $lt: tomorrow },
    status: { $in: ['present', 'late'] }
  }).distinct('studentId');
  
  const presentStudentIds = presentStudents.map(id => id.toString());
  const absentStudents = allStudents.filter(s => !presentStudentIds.includes(s._id.toString()));
  
  let sentCount = 0;
  for (const student of absentStudents) {
    try {
      await transporter.sendMail({
        from: `"Oxford Attendance" <${process.env.EMAIL_USER}>`,
        to: student.contactEmail,
        subject: `⚠️ Absence Alert: ${student.name} marked ABSENT today`,
        html: `
          <div style="font-family: Arial, sans-serif;">
            <h2 style="color: #d4af37;">⚠️ Absence Notification</h2>
            <p><strong>Student:</strong> ${student.name}</p>
            <p><strong>ID:</strong> ${student.studentId}</p>
            <p><strong>Class:</strong> ${student.className}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p>Your child has been marked <strong style="color: red;">ABSENT</strong> today.</p>
            <p>If your child was present, please contact the school office.</p>
            <hr>
            <p style="font-size: 12px;">Oxford Group of Colleges - Attendance System</p>
          </div>
        `,
      });
      sentCount++;
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) { 
      console.error('Reminder error:', err); 
    }
  }
  return { sent: sentCount, absent: absentStudents.length };
}

// Main daily task handler
export async function GET() {
  try {
    await connectDB();
    console.log('⏰ Running daily tasks...', new Date().toLocaleString());
    
    // Check if today is a holiday
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const holiday = await Holiday.findOne({ 
      date: { $gte: today, $lt: tomorrow } 
    });
    
    if (holiday) {
      console.log(`📅 Today is a holiday: ${holiday.name}. Skipping daily tasks.`);
      return NextResponse.json({ 
        message: `Today is a holiday (${holiday.name})`, 
        isHoliday: true 
      });
    }
    
    // Run all daily tasks in sequence
    console.log('📊 1. Marking absent students...');
    const absentResult = await markAbsentStudents();
    
    console.log('📧 2. Sending attendance emails...');
    const emailResult = await sendAttendanceEmails();
    
    console.log('⚠️ 3. Sending absent reminders...');
    const reminderResult = await sendAbsentReminders();
    
    console.log('✅ Daily tasks completed!');
    
    return NextResponse.json({
      success: true,
      message: 'Daily tasks completed',
      absent: absentResult,
      emails: emailResult,
      reminders: reminderResult,
    });
    
  } catch (error) {
    console.error('Daily tasks error:', error);
    return NextResponse.json({ error: 'Failed to run daily tasks' }, { status: 500 });
  }
}