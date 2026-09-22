import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
  rollNo: { type: String },
  name: { type: String, required: true },
  fatherName: { type: String, required: true },
  className: { type: String, required: true },
  address: { type: String },
  contactEmail: { type: String, default: '' },   // now optional
  contactPhone: { type: String },
  parentPhone: { type: String, required: true }, // now required for SMS
  notificationMethod: { type: String, enum: ['sms', 'both'], default: 'sms' },
  faceDescriptor: { type: [Number], default: null },
  isActive: { type: Boolean, default: true },
  registeredAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.models.Student || mongoose.model('Student', StudentSchema);