const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const app = require('./src/app');

const PORT = process.env.PORT || 5000;
const DB = process.env.MONGODB_URI;

// 🔥 Handle uncaught exceptions
process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

// ✅ CONNECT DB FIRST
mongoose.connect(DB)
  .then(() => {
    console.log('✅ DB connection successful!');

    // ✅ START SERVER AFTER DB CONNECTS
    const server = app.listen(PORT, () => {
      console.log(`🚀 App running on port ${PORT}...`);
    });

    // 🌐 INITIALIZE SOCKET.IO
    const { Server } = require('socket.io');
    const io = new Server(server, {
      cors: {
        origin: [ 'https://smart-post-ai-2-0.vercel.app', process.env.FRONTEND_URL].filter(Boolean),
        credentials: true
      }
    });

    app.set('io', io);

    io.on('connection', (socket) => {
      console.log('⚡ User connected via Socket.io:', socket.id);

      // Join a standard workspace room
      socket.on('join_workspace', (workspaceId) => {
        socket.join(workspaceId);
        console.log(`User ${socket.id} joined workspace ${workspaceId}`);
      });

      socket.on('leave_workspace', (workspaceId) => {
        socket.leave(workspaceId);
        console.log(`User ${socket.id} left workspace ${workspaceId}`);
      });

      // Typing indicators for real-time presence
      socket.on('typing_request', ({ workspaceId, userName, requestId }) => {
        socket.to(workspaceId).emit('user_typing_request', { userName, requestId });
      });

      socket.on('stop_typing_request', ({ workspaceId, userName, requestId }) => {
        socket.to(workspaceId).emit('user_stopped_typing', { userName, requestId });
      });

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
      });
    });

    // 🔥 Handle unhandled promise rejections
    process.on('unhandledRejection', err => {
      console.log('UNHANDLED REJECTION! 💥 Shutting down...');
      console.log(err.name, err.message);
      server.close(() => {
        process.exit(1);
      });
    });

  })
  .catch((err) => {
    console.error('❌ DB connection error:', err);
  });