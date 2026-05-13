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
    await ActivityLog.create({
      adminId,
      adminName,
      adminEmail,
      action,
      details,
      targetType,
      targetId,
      ip: 'server', // You can add real IP if needed
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}