import nodemailer from 'nodemailer';
import twilio from 'twilio';

// Email Setup
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// SMS Setup (Twilio)
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

// Parent Contact Info
interface ParentContact {
  email: string;
  phone?: string; // e.g., "+923001234567"
  preferredMethod: 'email' | 'sms' | 'both';
}

/**
 * Send notification via preferred method
 */
export async function sendAttendanceNotification(
  parent: ParentContact,
  studentName: string,
  status: 'present' | 'absent',
  location: string
) {
  const subject = status === 'present' 
    ? `✅ ${studentName} is Present` 
    : `❌ ${studentName} is Absent`;
  
  const message = status === 'present'
    ? `Your child ${studentName} has been marked PRESENT at ${location} on ${new Date().toLocaleString()}`
    : `Your child ${studentName} has been marked ABSENT on ${new Date().toLocaleString()}. Please contact the school.`;

  const results = [];

  // Send Email
  if (parent.preferredMethod === 'email' || parent.preferredMethod === 'both') {
    const emailResult = await sendEmail(parent.email, subject, message);
    results.push({ method: 'email', success: emailResult });
  }

  // Send SMS
  if ((parent.preferredMethod === 'sms' || parent.preferredMethod === 'both') && parent.phone) {
    const smsResult = await sendSMS(parent.phone, message);
    results.push({ method: 'sms', success: smsResult });
  }

  return results;
}

// Send Email
async function sendEmail(to: string, subject: string, message: string) {
  try {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <div style="background: #0b1f3a; color: #d4af37; padding: 20px; text-align: center;">
          <h2>Attendance Notification</h2>
        </div>
        <div style="padding: 20px; border: 1px solid #ddd;">
          <p>${message}</p>
          <hr />
          <p style="font-size: 12px; color: #666;">DIT Attendance System</p>
        </div>
      </div>
    `;

    await emailTransporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
    });
    
    console.log(`✅ Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
}

// Send SMS
async function sendSMS(to: string, message: string) {
  if (!twilioClient) {
    console.log('SMS not configured - missing Twilio credentials');
    return false;
  }

  try {
    // Format phone number (ensure it has country code)
    let formattedNumber = to;
    if (!to.startsWith('+')) {
      formattedNumber = `+92${to}`; // Pakistan country code
    }

    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedNumber,
    });
    
    console.log(`✅ SMS sent to ${to}: ${result.sid}`);
    return true;
  } catch (error) {
    console.error('SMS error:', error);
    return false;
  }
}