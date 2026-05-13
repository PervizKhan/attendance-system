import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendSMS(to: string, studentName: string) {
  // Format number for Pakistan
  let phone = to.replace(/[^0-9]/g, '');
  if (phone.startsWith('0')) phone = '92' + phone.substring(1);
  
  await client.messages.create({
    body: `✅ ${studentName} arrived at school at ${new Date().toLocaleTimeString()}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone,
  });
}