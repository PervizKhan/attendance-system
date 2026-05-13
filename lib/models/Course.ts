import mongoose from 'mongoose';

const CourseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  className: { type: String, required: true },                  // Which class this course belongs to
  teacher: { type: String },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.Course || mongoose.model('Course', CourseSchema);