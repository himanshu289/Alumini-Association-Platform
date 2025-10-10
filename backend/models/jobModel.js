import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String, required: true },
  requirements: [{ type: String, required: true }],
  postedBy: { type: String, required: true },
  postedDate: { type: Date, default: Date.now },
  type: { type: String, enum: ['full-time', 'part-time', 'contract', 'internship'], required: true },
});

const Job = mongoose.model('Job', jobSchema);
export default Job;
