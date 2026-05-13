import mongoose from 'mongoose';

const StaffAttendanceSchema = new mongoose.Schema({
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  date: { type: Date, required: true, default: Date.now },
  timeIn: { type: Date, required: true },
  timeOut: { type: Date },
  status: { type: String, enum: ['present', 'late', 'absent', 'half_day', 'leave'], default: 'present' },
  confidence: { type: Number },
  location: { type: String, default: 'main_gate' },
  markedBy: { type: String, enum: ['face', 'admin', 'teacher'], default: 'face' },
  leaveType: { type: String, enum: ['sick', 'casual', 'annual', 'emergency'], default: null },
  notes: { type: String },
  emailSent: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.models.StaffAttendance || mongoose.model('StaffAttendance', StaffAttendanceSchema);