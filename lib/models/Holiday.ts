import mongoose from 'mongoose';

const HolidaySchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  type: { type: String, enum: ['public', 'school', 'exam', 'emergency'], default: 'public' },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Holiday || mongoose.model('Holiday', HolidaySchema);