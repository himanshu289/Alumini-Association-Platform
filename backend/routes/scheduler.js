const Alumni = require('../models/Alumni');
const { sendMonthlyProfileUpdateReminder } = require('./emailService');

// Function to check and send monthly reminders
const checkAndSendMonthlyReminders = async () => {
  const today = new Date();
  
  // Check if it's the first day of the month
  if (today.getDate() === 1) {
    try {
      // Get all alumni emails
      con
      const alumniList = await Alumni.find({}, 'email name');
      if (alumniList.length > 0) {
        await sendMonthlyProfileUpdateReminder(alumniList);
        console.log('Monthly profile update reminders sent successfully');
      }
    } catch (error) {
      console.error('Error in monthly reminder scheduler:', error);
    }
  }
};

// Schedule the check to run daily
const scheduleMonthlyReminders = () => {
  // Run immediately when the server starts
  checkAndSendMonthlyReminders();
  
  // Then schedule to run daily at midnight
  setInterval(checkAndSendMonthlyReminders, 24 * 60 * 60 * 1000);
};

module.exports = { scheduleMonthlyReminders }; 