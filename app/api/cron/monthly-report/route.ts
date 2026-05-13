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

async function sendMonthlyReport(parentEmail: string, studentName: string, month: string, stats: any, recordsHtml: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Monthly Attendance Report</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background: #0b1f3a; color: #d4af37; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { padding: 20px; border: 1px solid #ddd; border-top: none; }
        .summary { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th { background: #0b1f3a; color: white; padding: 8px; text-align: left; }
        td { padding: 8px; border-bottom: 1px solid #ddd; }
        .present { color: green; font-weight: bold; }
        .late { color: orange; font-weight: bold; }
        .absent { color: red; font-weight: bold; }
        .holiday { color: gray; }
        .footer { background: #f5f5f5; padding: 10px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>📊 Monthly Attendance Report</h2>
        </div>
        <div class="content">
          <p><strong>Student:</strong> ${studentName}</p>
          <p><strong>Month:</strong> ${month}</p>
          
          <div class="summary">
            <strong>📈 Summary:</strong><br/>
            📅 Total School Days: ${stats.total}<br/>
            ✅ Present: ${stats.present} (${stats.presentRate}%)<br/>
            ⚠️ Late: ${stats.late}<br/>
            ❌ Absent: ${stats.absent} (${stats.absentRate}%)<br/>
            🎉 Holidays: ${stats.holidays}
          </div>
          
          <table>
            <thead>
              <tr><th>Date</th><th>Status</th><th>Remarks</th></tr>
            </thead>
            <tbody>
              ${recordsHtml}
            </tbody>
          </table>
        </div>
        <div class="footer">
          <p>This is an automated monthly report from DIT School Attendance System.</p>
          <p style="font-size: 11px;">Please contact school office for any queries.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"DIT School" <${process.env.EMAIL_USER}>`,
      to: parentEmail,
      subject: `📊 Monthly Attendance Report - ${studentName} (${month})`,
      html,
    });
    console.log(`✅ Monthly report sent to ${parentEmail} for ${studentName}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send monthly report to ${parentEmail}:`, error);
    return false;
  }
}

export async function GET() {
  try {
    await connectDB();
    
    console.log('📊 Starting monthly report generation...');
    
    // Get last month
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const monthStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
    const monthEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
    const monthName = monthStart.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    console.log(`📅 Generating report for: ${monthName}`);
    console.log(`📅 Date range: ${monthStart.toISOString().split('T')[0]} to ${monthEnd.toISOString().split('T')[0]}`);
    
    // Get holidays in this month
    const holidays = await Holiday.find({
      date: { $gte: monthStart, $lte: monthEnd }
    });
    const holidayDates = holidays.map(h => h.date.toISOString().split('T')[0]);
    console.log(`🎉 Holidays in this month: ${holidayDates.length}`);
    
    // Get all active students with email
    const students = await Student.find({ 
      isActive: true, 
      contactEmail: { $nin: [null, ''] } 
    });
    
    console.log(`👨‍🎓 Total students with email: ${students.length}`);
    
    let sentCount = 0;
    let failedCount = 0;
    
    for (const student of students) {
      // Get attendance records for the month
      const attendanceRecords = await Attendance.find({
        studentId: student._id,
        date: { $gte: monthStart, $lte: monthEnd }
      });
      
      // Create map of attendance by date
      const dailyMap = new Map();
      attendanceRecords.forEach(r => {
        const dateStr = r.date.toISOString().split('T')[0];
        dailyMap.set(dateStr, { status: r.status, time: r.timeIn });
      });
      
      let present = 0, late = 0, absent = 0, holidaysCount = 0;
      const recordsHtml = [];
      
      // Loop through each day of the month
      for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const isHoliday = holidayDates.includes(dateStr);
        
        if (isHoliday) {
          holidaysCount++;
          recordsHtml.push(`
            <tr>
              <td>${dateStr}</td>
              <td class="holiday">📅 Holiday</td>
              <td class="holiday">${holidays.find(h => h.date.toISOString().split('T')[0] === dateStr)?.name || 'School Holiday'}</td>
            </td>
          `);
        } else {
          const record = dailyMap.get(dateStr);
          if (record) {
            if (record.status === 'present') {
              present++;
              recordsHtml.push(`
                <tr>
                  <td>${dateStr}</td>
                  <td class="present">✓ Present</td>
                  <td>Arrived at ${new Date(record.time).toLocaleTimeString()}</td>
                </tr>
              `);
            } else if (record.status === 'late') {
              late++;
              recordsHtml.push(`
                <tr>
                  <td>${dateStr}</td>
                  <td class="late">⚠️ Late</td>
                  <td>Arrived at ${new Date(record.time).toLocaleTimeString()} (after 8:30 AM)</td>
                <tr>
              `);
            }
          } else {
            absent++;
            recordsHtml.push(`
              <tr>
                <td>${dateStr}</td>
                <td class="absent">✗ Absent</td>
                <td>No record found</td>
              </tr>
            `);
          }
        }
      }
      
      const total = present + late + absent;
      const presentRate = total > 0 ? Math.round((present / total) * 100) : 0;
      const absentRate = total > 0 ? Math.round((absent / total) * 100) : 0;
      
      const success = await sendMonthlyReport(student.contactEmail, student.name, monthName, {
        total, present, late, absent, holidaysCount, presentRate, absentRate
      }, recordsHtml.join(''));
      
      if (success) {
        sentCount++;
      } else {
        failedCount++;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`📊 Monthly report completed: ${sentCount} sent, ${failedCount} failed`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Monthly reports sent',
      month: monthName,
      totalStudents: students.length,
      sent: sentCount,
      failed: failedCount
    });
    
  } catch (error) {
    console.error('Monthly report error:', error);
    return NextResponse.json({ error: 'Failed to send monthly reports' }, { status: 500 });
  }
}