const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOtpEmail = async (to, name, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'Verify Your Email - OTP',
    html: `
      <h3>Hello ${name},</h3>
      <p>Use this OTP to verify your email:</p>
      <h2>${otp}</h2>
      <p>Valid for 10 minutes.</p>
      <p>Best regards,<br/>The Team</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${to}`);
  } catch (error) {
    console.error('Error sending OTP email:', error);
  }
};

const sendWelcomeEmail = async (to, name) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'Welcome to Alumni Connect!',
    html: `
      <h3>Hello ${name},</h3>
      <p>Welcome aboard!</p>
      <p>We're excited to have you join our alumni community. Please take a moment to complete your profile and stay connected with your fellow alumni.</p>
      <p>Best regards,<br/>The Team</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${to}`);
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
};

const sendMonthlyProfileUpdateReminder = async (alumniList) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    bcc: alumniList.map(alumni => alumni.email).join(','),
    subject: 'Profile Update Reminder - Alumni Connect',
    html: `
      <h3>Dear Alumni,</h3>
      <p>This is a friendly reminder to keep your alumni profile up to date!</p>
      <p>Updating your profile helps us:</p>
      <ul>
        <li>Keep track of your professional journey</li>
        <li>Connect you with relevant opportunities</li>
        <li>Maintain an active and engaged alumni community</li>
      </ul>
      <p>Please take a moment to review and update your profile information, including:</p>
      <ul>
        <li>Current employment details</li>
        <li>Contact information</li>
        <li>Profile picture</li>
      </ul>
      <p>You can update your profile by logging into your account at Alumni Connect.</p>
      <p>Thank you for staying connected!</p>
      <p>Best regards,<br/>The Alumni Connect Team</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Monthly profile update reminder sent to ${alumniList.length} alumni`);
  } catch (error) {
    console.error('Error sending monthly profile update reminder:', error);
  }
};

// Invitation related email functions
const sendInvitationConfirmationEmail = async (to, senderName, senderEmail, receiverEmail, description) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'Invitation Sent Successfully',
    text: `Hello ${senderName},\n\nYou have successfully sent an invitation with the following details:\n\nSender Email: ${senderEmail}\nReceiver Email: ${receiverEmail}\nDescription: ${description}\n\nThe invitation is now pending approval from the recipient.\n\nBest regards,\nAlumni Network Team`,
    html: `
      <h3>Hello ${senderName},</h3>
      <p>You have successfully sent an invitation with the following details:</p>
      <ul>
        <li><strong>Sender Email:</strong> ${senderEmail}</li>
        <li><strong>Receiver Email:</strong> ${receiverEmail}</li>
        <li><strong>Description:</strong> ${description}</li>
      </ul>
      <p>The invitation is now pending approval from the recipient.</p>
      <p>Best regards,<br>Alumni Network Team</p>
    `,
  };
  await transporter.sendMail(mailOptions);
};

const sendInvitationReceivedEmail = async (to, receiverName, senderName, senderEmail, description) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'You’ve Received an Invitation!',
    text: `Hello ${receiverName},\n\nYou have received an invitation from ${senderName} (${senderEmail}) with the following details:\n\nDescription: ${description}\n\nPlease log in to Alumni Connect to accept or reject this invitation.\n\nBest regards,\nAlumni Network Team`,
    html: `
      <h3>Hello ${receiverName},</h3>
      <p>You have received an invitation from <strong>${senderName}</strong> (${senderEmail}) with the following details:</p>
      <p><strong>Description:</strong> ${description}</p>
      <p>Please log in to <a href="http://localhost:5173/invitations">Alumni Connect</a> to accept or reject this invitation.</p>
      <p>Best regards,<br>Alumni Network Team</p>
    `,
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log(`Invitation received email sent to ${to}`);
  } catch (error) {
    console.error('Error sending invitation received email:', error);
    throw error; // Re-throw error to handle it in the route
  }
};

// New function to notify sender about invitation response
const sendInvitationResponseEmail = async (to, senderName, receiverName, receiverEmail, description, status) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: `Invitation ${status === 'accepted' ? 'Accepted' : 'Rejected'}`,
    text: `Hello ${senderName},\n\nYour invitation to ${receiverName} (${receiverEmail}) has been ${status}.\n\nDetails:\nDescription: ${description}\n\nBest regards,\nAlumni Network Team`,
    html: `
      <h3>Hello ${senderName},</h3>
      <p>Your invitation to <strong>${receiverName}</strong> (${receiverEmail}) has been <strong>${status}</strong>.</p>
      <p><strong>Description:</strong> ${description}</p>
      <p>Best regards,<br>Alumni Network Team</p>
    `,
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log(`Invitation response email sent to ${to} with status: ${status}`);
  } catch (error) {
    console.error('Error sending invitation response email:', error);
    throw error;
  }
};

module.exports = { 
  sendOtpEmail, 
  sendWelcomeEmail,
  sendMonthlyProfileUpdateReminder,
  sendInvitationConfirmationEmail,
  sendInvitationReceivedEmail, 
  sendInvitationResponseEmail
};
