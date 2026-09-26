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
    reason: { type: String, default: '' }, // error message if failed
    date: { type: Date, required: true },  // the absent day (UTC midnight of that PKT day)
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Index for the common query: today's logs, sorted by class/name.
SMSLogSchema.index({ date: 1, className: 1, studentName: 1 });

// Prevent duplicate *successful* sends for the same student on the same day.
// (Failed attempts are still allowed to be retried.)
SMSLogSchema.index(
  { studentId: 1, date: 1 },
  { unique: true, partialFilterExpression: { status: 'sent' } }
);

export default mongoose.models.SMSLog ||
  mongoose.model('SMSLog', SMSLogSchema);