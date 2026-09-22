// lib/sms.ts

// ─────────────────────────────────────────────
// 1. Configuration (read from .env.local)
// ─────────────────────────────────────────────
const GATEWAY_URL = process.env.SMS_GATEWAY_URL;
const GATEWAY_USER = process.env.SMS_GATEWAY_USER;
const GATEWAY_PASS = process.env.SMS_GATEWAY_PASS;

// ─────────────────────────────────────────────
// 2. Helper: formatPK
//    Converts 0334 9149580 → 923349149580
// ─────────────────────────────────────────────
function formatPK(to: string): string {
  let p = (to || '').replace(/[^0-9]/g, '');
  if (p.startsWith('0')) p = '92' + p.substring(1);
  if (!p.startsWith('92')) p = '92' + p;
  return p;
}

// ─────────────────────────────────────────────
// 3. Helper: sendRaw
//    Actually sends the SMS via the gateway
// ─────────────────────────────────────────────
async function sendRaw(phone: string, message: string) {
  if (!GATEWAY_URL || !GATEWAY_USER || !GATEWAY_PASS) {
    throw new Error('SMS gateway not configured');
  }

  const auth = Buffer.from(`${GATEWAY_USER}:${GATEWAY_PASS}`).toString('base64');

  const res = await fetch(GATEWAY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`,
    },
    body: JSON.stringify({
      textMessage: { text: message },
      phoneNumbers: ['+' + phone],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gateway ${res.status}: ${text}`);
  }

  const data = await res.json();
  console.log(`SMS queued for ${phone}`, data.id);
  return data;
}

// ─────────────────────────────────────────────
// 4. Public function: sendAbsentSMS
//    The only one used from outside this file
// ─────────────────────────────────────────────
export async function sendAbsentSMS(
  parentPhone: string,
  studentName: string,
  fatherName: string,
  studentClass?: string,
  date?: string,
  time?: string
): Promise<void> {
  const phone = formatPK(parentPhone);

  const d = date || new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).replace(/ /g, '-');

  const t = time || new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const message =
    `OXFORD PUBLIC SCHOOL & COLLEGE\n` +
    `Babozi Kaly, TSD Dara, Kohat\n` +
    `----------------------------------\n\n` +
    `ABSENCE NOTIFICATION\n\n` +
    `Assalam-o-Alaikum,\n\n` +
    `Dear Parent,\n\n` +
    `Your child has been marked ABSENT today.\n\n` +
    `Student : ${studentName}\n` +
    `Father  : ${fatherName}\n` +
    `Class   : ${studentClass || '-'}\n` +
    `Date    : ${d}\n` +
    `Time    : ${t}\n\n` +
    `----------------------------------\n` +
    `Oxford Public School & College\n` +
    `"Excellence in Education"`;

  await sendRaw(phone, message);
}