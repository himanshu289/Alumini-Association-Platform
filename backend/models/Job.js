// jobModel.js
const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String, required: true },
  requirements: [{ type: String }],
  type: { type: String, enum: ['full-time', 'part-time', 'contract', 'internship'], required: true },
  postedBy: { type: String, required: true },
  postedByRole: { type: String, enum: ['alumni', 'faculty'], required: true },
  postedDate: { type: Date, required: true },
  registerLink: { type: String, required: false }, // New field for the registration link
});

module.exports = mongoose.model('Job', jobSchema);