import nodemailer from 'nodemailer';

// Create transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendAttendanceEmail(
  to: string,
  studentName: string,
  studentId: string,
  className: string,
  location: string
) {
  const time = new Date().toLocaleString();
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Attendance Notification</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 500px; margin: 0 auto; padding: 20px; }
        .header { background: #0b1f3a; color: #d4af37; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
        .footer { background: #eee; padding: 10px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; }
        .status { color: #22c55e; font-weight: bold; font-size: 18px; }
        .info { margin: 10px 0; }
        .label { font-weight: bold; width: 100px; display: inline-block; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>🎓 Attendance Notification</h2>
        </div>
        <div class="content">
          <p class="status">✅ Your child has arrived at school!</p>
          <div class="info">
            <div><span class="label">Student:</span> ${studentName}</div>
            <div><span class="label">ID:</span> ${studentId}</div>
            <div><span class="label">Class:</span> ${className}</div>
            <div><span class="label">Location:</span> ${location}</div>
            <div><span class="label">Time:</span> ${time}</div>
          </div>
          <p style="margin-top: 20px; font-size: 14px; color: #666;">
            This is an automated message from your school's attendance system.
          </p>
        </div>
        <div class="footer">
          <p>DIT School Attendance System</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"School Attendance" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: `✅ Attendance: ${studentName} arrived at school`,
      html: html,
    });
    
    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error: error };
  }
}

// Test function
export async function testEmail(to: string) {
  return sendAttendanceEmail(to, 'Test Student', 'TEST001', 'Test Class', 'Test Location');
}