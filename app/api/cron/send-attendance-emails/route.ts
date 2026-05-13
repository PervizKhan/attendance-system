import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Attendance from '@/lib/models/Attendance';
import Student from '@/lib/models/Student';
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

export async function GET() {
  try {
    await connectDB();
    
    console.log('🔍 Checking for unsent attendance records...', new Date().toLocaleTimeString());
    
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Check if today is a holiday
    const holiday = await Holiday.findOne({
      date: { $gte: today, $lt: tomorrow }
    });
    
    if (holiday) {
      console.log(`📅 Today is a holiday: ${holiday.name}. No emails will be sent.`);
      return NextResponse.json({ 
        message: `Today is a holiday (${holiday.name})`, 
        isHoliday: true,
        holidayName: holiday.name,
        count: 0 
      });
    }
    
    // Find attendance records that haven't been emailed yet (include 'late' status too)
    const unsentRecords = await Attendance.find({
      date: { $gte: today, $lt: tomorrow },
      status: { $in: ['present', 'late'] },
      emailSent: false
    }).populate('studentId', 'name studentId className contactEmail');
    
    if (unsentRecords.length === 0) {
      console.log('📭 No unsent attendance records found');
      return NextResponse.json({ message: 'No new records', count: 0 });
    }
    
    console.log(`📊 Found ${unsentRecords.length} unsent attendance records`);
    
    // Group by parent email
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
    
    // Send emails
    let emailCount = 0;
    for (const [email, students] of Object.entries(parentGroups)) {
      try {
        const studentsList = students.map(s => {
          let statusText = '';
          let statusColor = '';
          
          if (s.status === 'present') {
            statusText = '✓ Present';
            statusColor = 'green';
          } else if (s.status === 'late') {
            statusText = '⚠️ Late';
            statusColor = 'orange';
          } else {
            statusText = '✗ Absent';
            statusColor = 'red';
          }
          
          return `
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 8px;">${s.name}</td>
              <td style="padding: 8px;">${s.studentId}</td>
              <td style="padding: 8px;">${s.className}</td>
              <td style="padding: 8px; color: ${statusColor}; font-weight: bold;">${statusText}</td>
              <td style="padding: 8px;">${s.time}</td>
            </tr>
          `;
        }).join('');
        
        // Count late arrivals for this parent
        const lateCount = students.filter(s => s.status === 'late').length;
        const lateMessage = lateCount > 0 
          ? `<p style="color: orange; margin-top: 10px;"><strong>⚠️ Note:</strong> ${lateCount} student(s) arrived late (after 8:30 AM)</p>`
          : '';
        
        await transporter.sendMail({
          from: `"School Attendance" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: `📋 Attendance Alert - ${new Date().toLocaleDateString()}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #0b1f3a; color: #d4af37; padding: 15px; text-align: center;">
                <h2>🎓 Attendance Notification</h2>
              </div>
              <div style="padding: 20px; border: 1px solid #ddd;">
                <p>Dear Parent,</p>
                <p>Your child(ren) have been marked:</p>
                <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                  <thead>
                    <tr style="background: #0b1f3a; color: white;">
                      <th style="padding: 8px;">Name</th>
                      <th style="padding: 8px;">ID</th>
                      <th style="padding: 8px;">Class</th>
                      <th style="padding: 8px;">Status</th>
                      <th style="padding: 8px;">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${studentsList}
                  </tbody>
                </table>
                ${lateMessage}
                <p style="font-size: 12px; color: #666; margin-top: 20px;">
                  This is an automated message from DIT School Attendance System.
                </p>
              </div>
              <div style="background: #f5f5f5; padding: 10px; text-align: center; font-size: 11px;">
                <p>For queries, please contact the school office.</p>
              </div>
            </div>
          `,
        });
        emailCount++;
        console.log(`✅ Email sent to ${email} for ${students.length} student(s) (${lateCount} late)`);
      } catch (err) {
        console.error(`❌ Failed to send to ${email}:`, err);
      }
    }
    
    // Mark records as emailed
    if (recordIds.length > 0) {
      await Attendance.updateMany(
        { _id: { $in: recordIds } },
        { $set: { emailSent: true } }
      );
      console.log(`✅ Marked ${recordIds.length} records as emailed`);
    }
    
    return NextResponse.json({
      success: true,
      found: unsentRecords.length,
      sent: emailCount,
      markedEmailed: recordIds.length,
      lateCount: unsentRecords.filter(r => (r as any).status === 'late').length,
    });
    
  } catch (error) {
    console.error('Batch email error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}