import { connectDB } from '@/lib/db';
import ActivityLog from '@/lib/models/ActivityLog';

export async function logActivity(
  adminId: string,
  adminName: string,
  adminEmail: string,
  action: string,
  details?: string,
  targetType?: string,
  targetId?: string
) {
  try {
    await connectDB();
    await ActivityLog.create({
      adminId,
      adminName,
      adminEmail,
      action,
      details,
      targetType,
      targetId,
      ip: 'server',
    });
    console.log(`📝 Logged: ${action} by ${adminName}`);
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}