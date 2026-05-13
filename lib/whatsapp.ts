/**
 * Generate WhatsApp link for parent
 * 100% FREE - No API required
 */

export function generateWhatsAppLink(phoneNumber: string, studentName: string, status: string, location: string) {
  // Clean phone number
  let cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
  
  // Handle Pakistan numbers (remove leading 0, add 92)
  if (cleanNumber.startsWith('0')) {
    cleanNumber = '92' + cleanNumber.substring(1);
  }
  
  if (!cleanNumber.startsWith('92')) {
    cleanNumber = '92' + cleanNumber;
  }
  
  const statusEmoji = status === 'present' ? '✅' : '❌';
  const statusText = status === 'present' ? 'PRESENT' : 'ABSENT';
  
  const message = `${statusEmoji} *Attendance Notification*
  
Student: ${studentName}
Status: ${statusText}
Location: ${location}
Time: ${new Date().toLocaleString()}

This is an automated message from DIT Attendance System.`;

  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${cleanNumber}?text=${encodedText}`;
}

// Generate opt-in link for parents
export function generateOptInLink(phoneNumber: string, studentName: string): string {
  let cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
  if (cleanNumber.startsWith('0')) {
    cleanNumber = '92' + cleanNumber.substring(1);
  }
  if (!cleanNumber.startsWith('92')) {
    cleanNumber = '92' + cleanNumber;
  }
  
  const message = `Hello! I would like to receive attendance notifications for my child ${studentName}.`;
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
}