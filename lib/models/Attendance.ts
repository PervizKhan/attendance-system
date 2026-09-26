// lib/models/Attendance.ts
import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    date: { type: Date, required: true, default: Date.now },
    timeIn: { type: Date },              // ← no longer required, no default
    timeOut: { type: Date },
    status: {
      type: String,
      enum: ['present', 'absent', 'late'],
      default: 'present',
    },
    confidence: { type: Number },
    location: { type: String, default: 'school_gate' },
    markedBy: { type: String, default: 'face' },
    emailSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Attendance ||
  mongoose.model('Attendance', AttendanceSchema);