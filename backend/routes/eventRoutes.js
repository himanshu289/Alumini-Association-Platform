const express = require('express');
const Event = require('../models/eventModel');
const router = express.Router();

// Fetch all events
router.get('/get_events', async (req, res) => {
  try {
    const events = await Event.find();
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch events', error });
  }
});

// Add a new event
router.post('/events', async (req, res) => {
  try {
    const { title, date, location, description, type, image, createdBy } = req.body;
    console.log(req.body);
    
    const newEvent = new Event({ title, date, location, description, type, image, createdBy });
    await newEvent.save();
    res.status(201).json(newEvent);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add event', error });
  }
});

module.exports = router;