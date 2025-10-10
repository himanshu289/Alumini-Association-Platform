const express = require('express');
const User = require('../models/User');
const Alumni = require('../models/Alumni');
const Job = require('../models/Job');
const bcrypt = require('bcryptjs');
const Event = require('../models/eventModel');
const { sendWelcomeEmail , sendOtpEmail, sendInvitationConfirmationEmail, sendInvitationReceivedEmail, sendInvitationResponseEmail} = require('./emailService');
const { sendResetEmail } = require('./sendreset_email');
const cloudinary = require('cloudinary').v2;
const jwt = require('jsonwebtoken');
const ChatMessage = require('../models/ChatMessage');
const Invitation = require('../models/Invitation');
const router = express.Router();
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Signup Route with Cloudinary Image Upload
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

// Signup Route with Duplicate Email Check for Alumni
router.post('/signup', async (req, res) => {
  const { 
    name, 
    email, 
    password, 
    role, 
    engineeringType, 
    passoutYear,
    linkedin, 
    profileImage // Base64 string from frontend
  } = req.body;

  try {
    // Check if user already exists in User collection
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Check if email is already used in Alumni collection (for alumni role)
    if (role === 'alumni') {
      const existingAlumni = await Alumni.findOne({ email });
      if (existingAlumni) {
        return res.status(400).json({ message: 'An alumni profile with this email already exists' });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Upload profile image to Cloudinary if provided
    let profileImageUrl = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'; // Default image
    if (profileImage) {
      const uploadResponse = await cloudinary.uploader.upload(profileImage, {
        folder: 'alumni_profiles',
        transformation: [{ width: 200, height: 200, crop: 'fill' }],
      });
      profileImageUrl = uploadResponse.secure_url;
    }

    // Create new user
    user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      otp,
      otpExpires,
      isVerified: false,
    });
    await user.save();

    // If role is alumni, create alumni profile
    if (role === 'alumni') {
      if (!engineeringType || !passoutYear) {
        // Rollback: Delete the user if alumni data is incomplete
        await User.findByIdAndDelete(user._id);
        return res.status(400).json({ message: 'Engineering Type and Passout Year are required' });
      }

      const alumni = new Alumni({
        name,
        email,
        engineeringType,
        passoutYear,
        linkedin: linkedin || '',
        profileImage: profileImageUrl,
        role: 'alumni',
      });
      await alumni.save();
    }

    // Send OTP email
    await sendOtpEmail(email, name, otp);

    res.status(201).json({ 
      message: 'OTP sent to your email. Please verify.',
      userId: user._id
    });
  } catch (err) {
    console.error(err);

    // Rollback: Delete the user if an error occurs (e.g., duplicate key error in Alumni)
    if (user && user._id) {
      await User.findByIdAndDelete(user._id);
    }

    if (err.code === 11000) {
      // Handle duplicate key error specifically
      return res.status(400).json({ message: 'An error occurred: Email is already in use' });
    }

    res.status(500).json({ message: 'Server error' });
  }
}); 

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'User already verified' });
    }

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    await sendWelcomeEmail(email, user.name);

    res.status(200).json({ message: 'Email verified successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email' });
    }

    if (user.role !== role) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    res.json({ 
      message: 'Login successful', 
      user: { 
        email: user.email, 
        role: user.role,
        id: user._id 
      } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'User already verified' });
    }

    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    await sendOtpEmail(email, user.name, otp);

    res.status(200).json({ message: 'New OTP sent to your email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

const SECRET_KEY = process.env.SECRET_KEY;

// Request Reset Link
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const token = jwt.sign({ email }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
    const resetUrl = `http://localhost:5173/reset-password/${token}`;

    await sendResetEmail(email, resetUrl);

    res.json({ message: 'Password reset link sent to your email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset Password
router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findOne({ email: decoded.email });

    if (!user) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password has been reset successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Invalid or expired token' });
  }
});

router.get('/get_events', async (req, res) => {
    try {
      const events = await Event.find();
      res.status(200).json(events);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch events', error });
    }
  });
  
  // Add a new event
  router.post('/post_events', async (req, res) => {
    try {
      const { title, date, location, description, type, image, createdBy='faculty' } = req.body;
      console.log(req.body);

      const newEvent = new Event({ title, date, location, description, type, image, createdBy });
      await newEvent.save();
      res.status(201).json(newEvent);
    } catch (error) {
      res.status(500).json({ message: 'Failed to add event', error });
    }
  });

  router.put('/edit_event/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { title, date, location, description, type, image, createdBy } = req.body;
  
      const updatedEvent = await Event.findByIdAndUpdate(
        id,
        { title, date, location, description, type, image, createdBy },
        { new: true, runValidators: true }
      );
  
      if (!updatedEvent) {
        return res.status(404).json({ message: 'Event not found' });
      }
  
      res.status(200).json(updatedEvent);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to update event', error });
    }
  });

  // Delete an event
router.delete('/delete_event/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedEvent = await Event.findByIdAndDelete(id);
    
    if (!deletedEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete event', error });
  }
});

// Get all jobs
router.get('/get_jobs', async (req, res) => {
  try {
    const jobs = await Job.find();
    res.status(200).json(jobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch jobs', error });
  }
});

// Add a new job
router.post('/add_jobs', async (req, res) => {
  try {
    const {
      title,
      company,
      location,
      description,
      requirements,
      type,
      postedBy,
      postedByRole,
      postedDate,
      registerLink, // Added registerLink
    } = req.body;
    const newJob = new Job({
      title,
      company,
      location,
      description,
      requirements,
      type,
      postedBy,
      postedByRole,
      postedDate,
      registerLink, // Include in the new job
    });
    await newJob.save();
    res.status(201).json(newJob);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to add job', error });
  }
});

// Update a job
router.put('/update_jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedJob = await Job.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!updatedJob) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.status(200).json(updatedJob);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update job', error });
  }
});

// Delete a job
router.delete('/delete_jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedJob = await Job.findByIdAndDelete(id);
    if (!deletedJob) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.status(200).json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete job', error });
  }
});

router.get('/get_alumni', async (req, res) => {
  try {
    const alumni = await Alumni.find().select('-__v'); // Exclude version key
    res.status(200).json(alumni);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch alumni', error: error.message });
  }
});

// Add this new route for better pagination support
router.get('/get_alumni_paginated', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const search = req.query.search || '';
    const year = req.query.year || 'all';
    const {
      name,
      passoutYear,
      engineeringType,
      companyName,
      location,
      role
    } = req.query;

    const query = {};
    
    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { engineeringType: { $regex: search, $options: 'i' } }
      ];
    }

    // Year filter
    if (year !== 'all') {
      query.passoutYear = parseInt(year);
    }

    // Name filter
    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }

    // Passout year filter
    if (passoutYear && passoutYear !== 'all') {
      query.passoutYear = parseInt(passoutYear);
    }

    // Engineering type filter
    if (engineeringType && engineeringType !== 'all') {
      query.engineeringType = engineeringType;
    }

    // Employment history filters
    if (companyName || location || role) {
      query['employmentHistory'] = {
        $elemMatch: {
          ...(companyName && { companyName: { $regex: companyName, $options: 'i' } }),
          ...(location && { companyLocation: { $regex: location, $options: 'i' } }),
          ...(role && { role: { $regex: role, $options: 'i' } })
        }
      };
    }

    const total = await Alumni.countDocuments(query);
    const alumni = await Alumni.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-__v')
      .sort({ 'employmentHistory.durationFrom': -1 }); // Sort by latest employment date

    res.status(200).json({
      alumni,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch alumni', error: error.message });
  }
});

// New endpoint to get current user details (for all roles)
router.get('/current-user', async (req, res) => {
  try {
    const { email } = req.headers; // Expect email to be sent in headers
    if (!email) {
      return res.status(401).json({ message: 'Email not provided' });
    }

    const user = await User.findOne({ email }).select('name email role _id');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get alumni profile based on logged-in user (using email from request)
router.get('/profile', async (req, res) => {
  try {
    const { email } = req.headers; // Expect email to be sent in headers
    if (!email) {
      return res.status(401).json({ message: 'Email not provided' });
    }

    const user = await User.findOne({ email });
    if (!user || user.role !== 'alumni') {
      return res.status(403).json({ message: 'Unauthorized or not an alumni' });
    }

    const alumniProfile = await Alumni.findOne({ email });
    if (!alumniProfile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.status(200).json(alumniProfile);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update alumni profile
router.put('/update_profile', async (req, res) => {
  try {
    const { email } = req.headers; // Expect email to be sent in headers
    if (!email) {
      return res.status(401).json({ message: 'Email not provided' });
    }

    const user = await User.findOne({ email });
    if (!user || user.role !== 'alumni') {
      return res.status(403).json({ message: 'Unauthorized or not an alumni' });
    }

    const {
      name,
      profileImage,
      engineeringType,
      passoutYear,
      linkedin,
      employmentHistory,
    } = req.body;

    const updatedProfile = await Alumni.findOneAndUpdate(
      { email },
      {
        name,
        profileImage,
        engineeringType,
        passoutYear,
        linkedin,
        employmentHistory,
      },
      { new: true, runValidators: true }
    );

    if (!updatedProfile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Update User collection too (if needed)
    await User.findOneAndUpdate({ email }, { name });

    res.status(200).json({ message: 'Profile updated successfully', profile: updatedProfile });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Get statistics (total jobs, alumni, events)
router.get('/get_stats', async (req, res) => {
  try {
    const totalJobs = await Job.countDocuments();
    const totalAlumni = await Alumni.countDocuments();
    const totalEvents = await Event.countDocuments();

    res.status(200).json({
      totalJobs,
      totalAlumni,
      totalEvents,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Failed to fetch statistics', error });
  }
});

// Get alumni profile by ID for viewing
router.get('/view_alumni_profile/:id', async (req, res) => {
  try {
    const alumniId = req.params.id;
    
    // Find alumni by ID and exclude sensitive information
    const alumni = await Alumni.findById(alumniId)
      .select('-__v -password') // Exclude version key and password
      .lean(); // Convert to plain JavaScript object

    if (!alumni) {
      return res.status(404).json({ message: 'Alumni not found' });
    }

    // Format dates in employment history
    if (alumni.employmentHistory) {
      alumni.employmentHistory = alumni.employmentHistory.map(emp => ({
        ...emp,
        durationFrom: emp.durationFrom ? new Date(emp.durationFrom).toISOString().split('T')[0] : '',
        durationTo: emp.durationTo ? new Date(emp.durationTo).toISOString().split('T')[0] : null,
      }));
    }

    res.status(200).json(alumni);
  } catch (error) {
    console.error('Error fetching alumni profile:', error);
    res.status(500).json({ message: 'Failed to fetch alumni profile', error: error.message });
  }
});

// Get chat history for a room
router.get('/chat/history/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const messages = await ChatMessage.find({ roomId })
      .populate('senderId', 'name email')
      .sort({ timestamp: -1 });
    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ message: 'Failed to fetch chat history', error });
  }
});

// Add this to your backend routes
router.get('/chat/unread-count/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { email } = req.headers;
    
    if (!email) {
      return res.status(401).json({ message: 'Email not provided' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Count messages in this room that are not read and not sent by current user
    const count = await ChatMessage.countDocuments({
      roomId,
      'senderId': { $ne: user._id },
      isRead: false
    });

    res.status(200).json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Failed to fetch unread count', error });
  }
});

// Get list of users for chat (alumni and faculty)
router.get('/chat/users', async (req, res) => {
  try {
    const users = await User.find({ role: { $in: ['alumni', 'faculty' , 'student'] } })
      .select('name email role _id');
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users', error });
  }
});

router.delete('/chat/delete-all', async (req, res) => {
  try {
    const email = req.headers.email;
    if (!email) {
      return res.status(401).json({ message: 'Email not provided in headers' });
    }

    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find all roomIds where this user is a participant
    const userId = user._id.toString();
    const messages = await ChatMessage.find({
      $or: [
        { 'senderId': userId },
        { 'roomId': { $regex: userId } }
      ]
    }).distinct('roomId');

    // Delete all messages from these rooms
    if (messages.length > 0) {
      await ChatMessage.deleteMany({
        roomId: { $in: messages }
      });
    }

    res.status(200).json({ 
      message: 'All chat history deleted successfully',
      deletedRooms: messages.length
    });
  } catch (error) {
    console.error('Error deleting all chat history:', error);
    res.status(500).json({ message: 'Failed to delete chat history', error: error.message });
  }
});


// Send invitation (faculty only)
// Send invitation (faculty only)
router.post('/invitations/send', async (req, res) => {
  try {
    const { email } = req.headers;
    const { receiverEmail, description } = req.body;

    // Validate inputs
    if (!receiverEmail || !description) {
      return res.status(400).json({ message: 'Receiver email and description are required' });
    }

    const sender = await User.findOne({ email });
    if (!sender || sender.role !== 'faculty') {
      return res.status(403).json({ message: 'Only faculty can send invitations' });
    }

    const receiver = await User.findOne({ email: receiverEmail, role: 'alumni' });
    if (!receiver) {
      return res.status(400).json({ message: 'Alumni not found with this email' });
    }

    // Check if there's already a pending invitation
    const existingInvitation = await Invitation.findOne({
      senderId: sender._id,
      receiverId: receiver._id,
      status: 'pending',
    });

    if (existingInvitation) {
      return res.status(400).json({ message: 'You already have a pending invitation with this alumni' });
    }

    const invitation = new Invitation({
      senderId: sender._id,
      receiverId: receiver._id,
      description,
    });

    await invitation.save();

    // Send confirmation email to the sender (faculty)
    await sendInvitationConfirmationEmail(
      sender.email,
      sender.name,
      sender.email,
      receiverEmail,
      description
    );

    // Send notification email to the receiver (alumni)
    await sendInvitationReceivedEmail(
      receiver.email,
      receiver.name,
      sender.name,
      sender.email,
      description
    );

    res.status(201).json({
      message: 'Invitation sent successfully',
      invitation: {
        ...invitation.toObject(),
        senderId: sender,
        receiverId: receiver,
      },
    });
  } catch (error) {
    console.error('Error sending invitation:', error);
    res.status(500).json({ message: 'Failed to send invitation', error: error.message });
  }
});

// Get invitations for current user
router.get('/invitations', async (req, res) => {
  try {
    const { email } = req.headers;
    if (!email) {
      return res.status(401).json({ message: 'Email not provided' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const invitations = await Invitation.find({
      $or: [
        { senderId: user._id },
        { receiverId: user._id }
      ]
    })
      .populate('senderId', 'name email role')
      .populate('receiverId', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json(invitations);
  } catch (error) {
    console.error('Error fetching invitations:', error);
    res.status(500).json({ message: 'Failed to fetch invitations', error: error.message });
  }
});

// Accept/Reject invitation (alumni only)
router.put('/invitations/:id/respond', async (req, res) => {
  try {
    const { email } = req.headers;
    const { id } = req.params;
    const { status } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const user = await User.findOne({ email });
    if (!user || user.role !== 'alumni') {
      return res.status(403).json({ message: 'Only alumni can respond to invitations' });
    }

    const invitation = await Invitation.findById(id)
      .populate('senderId', 'name email')
      .populate('receiverId', 'name email');

    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    if (invitation.receiverId._id.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to respond to this invitation' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: 'Invitation already responded' });
    }

    invitation.status = status;
    await invitation.save();

    // Send email to the sender (faculty) about the response
    await sendInvitationResponseEmail(
      invitation.senderId.email, // Sender's email
      invitation.senderId.name,  // Sender's name
      invitation.receiverId.name, // Receiver's name
      invitation.receiverId.email, // Receiver's email
      invitation.description,     // Invitation description
      status                     // Accepted or rejected
    );

    res.status(200).json({ 
      message: `Invitation ${status} successfully`, 
      invitation 
    });
  } catch (error) {
    console.error('Error updating invitation:', error);
    res.status(500).json({ message: 'Failed to update invitation', error: error.message });
  }
});

// Get alumni list for faculty to send invitations
router.get('/invitations/alumni-list', async (req, res) => {
  try {
    const { email } = req.headers;
    if (!email) {
      return res.status(401).json({ message: 'Email not provided' });
    }

    const user = await User.findOne({ email });
    if (!user || user.role !== 'faculty') {
      return res.status(403).json({ message: 'Only faculty can access alumni list' });
    }

    const alumniList = await User.find({ role: 'alumni' })
      .select('name email')
      .sort({ name: 1 });

    res.status(200).json(alumniList);
  } catch (error) {
    console.error('Error fetching alumni list:', error);
    res.status(500).json({ message: 'Failed to fetch alumni list', error: error.message });
  }
});
module.exports = router;