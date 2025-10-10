const mongoose = require('mongoose');

const employmentHistorySchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  companyLocation: { type: String, required: true },
  role: { type: String, required: true },
  durationFrom: { type: Date, required: true },
  durationTo: { type: Date, default: null }, // null means current position
}, { _id: true });

const alumniSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  profileImage: { 
    type: String, 
    default: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png' 
  },
  engineeringType: { type: String, required: true },
  passoutYear: { type: Number, required: true },
  employmentHistory: [employmentHistorySchema],
  role: { type: String, default: 'alumni' },
  linkedin: { type: String },
}, {
  timestamps: true
});

const Alumni = mongoose.model('Alumni', alumniSchema);
module.exports = Alumni;