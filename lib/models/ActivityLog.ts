import mongoose from 'mongoose';

const ActivityLogSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  adminName: { type: String, required: true },
  adminEmail: { type: String, required: true },
  action: { type: String, required: true },
  details: { type: String },
  targetType: { type: String, enum: ['student', 'attendance', 'admin', 'system'] },
  targetId: { type: String },
  ip: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.ActivityLog || mongoose.model('ActivityLog', ActivityLogSchema);