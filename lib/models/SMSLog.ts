// lib/models/SMSLog.ts
import mongoose from 'mongoose';

const SMSLogSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    studentName: { type: String, required: true },
    fatherName: { type: String, default: '' },
    className: { type: String, default: '' },
    parentPhone: { type: String, default: '' },
    status: { type: String, enum: ['sent', 'failed'], required: true },
    reason: { type: String, default: '' },
    date: { type: Date, required: true },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

SMSLogSchema.index({ date: 1, className: 1, studentName: 1 });
SMSLogSchema.index(
  { studentId: 1, date: 1 },
  { unique: true, partialFilterExpression: { status: 'sent' } }
);

export default mongoose.models.SMSLog ||
  mongoose.model('SMSLog', SMSLogSchema);