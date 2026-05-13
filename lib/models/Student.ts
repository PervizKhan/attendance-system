import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },   // e.g., BC190200651
  rollNo: { type: String },                                     // Optional
  name: { type: String, required: true },
  fatherName: { type: String, required: true },
  className: { type: String, required: true },                  // e.g., "10th Grade", "BS CS 3rd"
  address: { type: String },
  contactEmail: { type: String, required: true },               // Parent/Guardian email
  contactPhone: { type: String },                               // Optional for SMS
  faceDescriptor: { type: [Number], default: null },
  parentPhone: { type: String },
  notificationMethod: { type: String, enum: ['email', 'sms', 'both'], default: 'email' },            // 128 numbers from face-api
  isActive: { type: Boolean, default: true },
  registeredAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.models.Student || mongoose.model('Student', StudentSchema);