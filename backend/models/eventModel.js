const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['reunion', 'workshop', 'networking', 'other'],
    required: true,
  },
  image: {
    type: String,
    default: '',
  },
  createdBy: {
    type: String,
    required: true,
    default: 'faculty', // Corrected typo from 'facilty' to 'faculty'
  },
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;