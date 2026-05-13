import mongoose from 'mongoose';

const StaffSchema = new mongoose.Schema({
  staffId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  fatherName: { type: String },
  designation: { type: String, required: true }, // Teacher, Accountant, Principal, Admin, Staff
  department: { type: String }, // Computer Science, Mathematics, Admin, etc.
  qualification: { type: String },
  phone: { type: String },
  email: { type: String, required: true },
  cnic: { type: String },
  address: { type: String },
  joiningDate: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  shift: { type: String, enum: ['morning', 'evening'], default: 'morning' },
  faceDescriptor: { type: [Number], default: null },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.models.Staff || mongoose.model('Staff', StaffSchema);