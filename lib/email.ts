import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendAttendanceNotification(to: string, studentName: string, status: string, courseName: string) {
  const subject = status === 'present' 
    ? `✅ ${studentName} is Present Today` 
    : `❌ ${studentName} is Absent Today`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
      <div style="background: #0b1f3a; color: #d4af37; padding: 20px; text-align: center;">
        <h2>Attendance Notification</h2>
      </div>
      <div style="padding: 20px; border: 1px solid #ddd;">
        <p><strong>Student:</strong> ${studentName}</p>
        <p><strong>Course:</strong> ${courseName}</p>
        <p><strong>Status:</strong> ${status === 'present' ? '✓ Present' : '✗ Absent'}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      </div>
      <div style="background: #f5f5f5; padding: 10px; text-align: center; font-size: 12px;">
        <p>This is an automated message from DIT Attendance System</p>
      </div>
    </div>
  `;

  await transporter.sendMail({ from: process.env.SMTP_FROM, to, subject, html });
}