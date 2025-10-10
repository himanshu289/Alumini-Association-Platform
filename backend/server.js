const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const ChatMessage = require('./models/ChatMessage');
const router = require('./routes/routing');
const { scheduleMonthlyReminders } = require('./routes/scheduler');

require('dotenv').config();
console.log(process.env)

const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));

app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    secret: process.env.JWT_SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, maxAge: 3600000 },
  })
);

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.log('Error connecting to MongoDB:', err));

// Routes
app.use('/api', router);

// Socket.IO Setup
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('joinRoom', ({ roomId }) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on('sendMessage', async ({ roomId, senderId, message }) => {
    try {
      const chatMessage = new ChatMessage({
        roomId,
        senderId,
        message,
        timestamp: new Date(),
        isRead: false,
      });
      await chatMessage.save();

      const populatedMessage = await ChatMessage.findById(chatMessage._id).populate('senderId', 'name email');
      io.to(roomId).emit('receiveMessage', populatedMessage);
      console.log(`Message sent to room ${roomId}:`, populatedMessage);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  socket.on('markMessagesAsRead', async ({ roomId, messageIds }) => {
    try {
      if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
        console.log('No valid messageIds provided for marking as read');
        return;
      }

      const result = await ChatMessage.updateMany(
        { _id: { $in: messageIds }, roomId, isRead: false },
        { $set: { isRead: true } }
      );
      console.log(`Updated ${result.modifiedCount} messages as read in room ${roomId}`);

      if (result.modifiedCount > 0) {
        messageIds.forEach((messageId) => {
          io.to(roomId).emit('messageRead', { messageId });
        });
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`User disconnected: ${socket.id}, Reason: ${reason}`);
  });
});

// Initialize the monthly reminder scheduler
scheduleMonthlyReminders();

const PORT = process.env.PORT || 5000;
console.log(process.env.PORT)
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));