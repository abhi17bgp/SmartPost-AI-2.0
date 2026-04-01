const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();

// Middlewares
app.use(cors({
  origin: [ 'https://smart-post-ai-2-0.vercel.app'].filter(Boolean),
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const authRouter = require('./routes/authRoutes');
const workspaceRouter = require('./routes/workspaceRoutes');
const collectionRouter = require('./routes/collectionRoutes');
const requestRouter = require('./routes/requestRoutes');
const historyRouter = require('./routes/historyRoutes');
const aiRouter = require('./routes/aiRoutes');

// Routes
app.use('/api/auth', authRouter);
app.use('/api/workspaces', workspaceRouter);
app.use('/api/collections', collectionRouter);
app.use('/api/requests', requestRouter);
app.use('/api/history', historyRouter);
app.use('/api/ai', aiRouter);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'API is running' });
});

const proxyController = require('./controllers/proxyController');
const authController = require('./controllers/authController');

// Proxy route for bypassing CORS in API tool
app.post('/api/proxy', authController.protect, proxyController.proxyRequest);

// Catch-all unhandled routes
app.use((req, res, next) => {
  res.status(404).json({
    status: 'fail',
    message: `Can't find ${req.originalUrl} on this server!`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  let message = err.message;

  // Handle MongoDB Duplicate Key (Code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    if (field === 'email') {
      message = "This email is already registered. Please log in instead.";
    } else {
      message = `This ${field} is already taken. Please use a different one.`;
    }
    err.statusCode = 400;
  }

  // Handle Mongoose Validation Errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(el => el.message);
    message = `Invalid input: ${errors.join('. ')}`;
    err.statusCode = 400;
  }

  // Handle JWT Errors
  if (err.name === 'JsonWebTokenError') {
    message = 'Invalid session. Please log in again!';
    err.statusCode = 401;
  }
  if (err.name === 'TokenExpiredError') {
    message = 'Your session has expired. Please log in again!';
    err.statusCode = 401;
  }

  res.status(err.statusCode).json({
    status: err.status,
    message: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

module.exports = app;
