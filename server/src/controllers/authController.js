const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const User = require('../models/userModel');
const Workspace = require('../models/workspaceModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const sendEmail = require('../utils/email');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production'
  };

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: { user }
  });
};

const registerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

exports.register = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });

  // Generate verification token
  const verificationToken = newUser.createEmailVerificationToken();
  await newUser.save({ validateBeforeSave: false });

  // Create default workspace for user
  await Workspace.create({ name: 'My Workspace', owner: newUser._id });

  // Send verification email
  const frontendUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : (process.env.FRONTEND_URL || 'https://smart-post-ai-gilt.vercel.app');
  const verifyUrl = `${frontendUrl}/verify-email/${verificationToken}`;

  const message = `Welcome to SmartPost AI! Please verify your email address by clicking this link:\n\n${verifyUrl}\n\n`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; margin: 0; padding: 0; color: #e2e8f0; }
        .wrapper { background-color: #0b0f19; padding: 40px 15px; }
        .container { max-width: 600px; margin: 0 auto; background-color: #1e293b; border: 1px solid #334155; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .header { background: radial-gradient(circle at top left, #10b981 0%, #064e3b 100%); padding: 40px 30px; text-align: center; border-bottom: 1px solid #047857; }
        .header-logo { color: #ffffff; font-size: 32px; font-weight: 900; letter-spacing: -1px; margin: 0; text-shadow: 0 2px 10px rgba(0,0,0,0.3); }
        .header-logo span { color: #a7f3d0; font-weight: 400; }
        .content { padding: 40px 30px; }
        .content h2 { color: #f8fafc; font-size: 22px; margin-top: 0; font-weight: 700; }
        .content p { color: #cbd5e1; line-height: 1.7; font-size: 15px; }
        .button-container { text-align: center; margin: 40px 0; }
        .button { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block; border: 1px solid #34d399; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4); }
        .footer { background-color: #0f172a; padding: 25px 30px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #1e293b; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <h1 class="header-logo">SmartPost <span>AI</span></h1>
          </div>
          <div class="content">
            <h2>Welcome, ${newUser.name}!</h2>
            <p>We are thrilled to have you! To get started exploring our advanced API testing capabilities, please verify your email address securely below.</p>
            <div class="button-container">
              <a href="${verifyUrl}" class="button">Verify Email Address</a>
            </div>
            <p style="font-size: 13px; color: #94a3b8; margin-top: 30px;">If you didn't create an account, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} SmartPost AI Automation. All rights reserved.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await sendEmail({
      email: newUser.email,
      subject: 'Verify your SmartPost AI account',
      message,
      html
    });

    res.status(201).json({
      status: 'success',
      message: 'Registration successful! Verification email sent.'
    });
  } catch (err) {
    console.error("SendGrid Verification Error: ", err);
    newUser.emailVerificationToken = undefined;
    newUser.emailVerificationExpires = undefined;
    await newUser.save({ validateBeforeSave: false });

    return next(new AppError('There was an error sending the verification email. Try again later!', 500));
  }
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password');
  
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) Deny login if email is not verified
  if (!user.isEmailVerified) {
    return next(new AppError('Please verify your email address to log in.', 401));
  }

  // 4) If everything ok, send token to client
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please log in to get access.', 401));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(new AppError('The user belonging to this token does no longer exist.', 401));
  }

  req.user = currentUser;
  next();
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with that email address.', 404));
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  const frontendUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : (process.env.FRONTEND_URL || 'https://smart-post-ai-gilt.vercel.app');
  const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

  const message = `Forgot your password? Click the link below to reset your password:\n\n${resetUrl}\n\nIf you didn't forget your password, please ignore this email!`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; margin: 0; padding: 0; color: #e2e8f0; }
        .wrapper { background-color: #0b0f19; padding: 40px 15px; }
        .container { max-width: 600px; margin: 0 auto; background-color: #1e293b; border: 1px solid #334155; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .header { background: radial-gradient(circle at top left, #8b5cf6 0%, #4c1d95 100%); padding: 40px 30px; text-align: center; border-bottom: 1px solid #7c3aed; }
        .header-logo { color: #ffffff; font-size: 32px; font-weight: 900; letter-spacing: -1px; margin: 0; text-shadow: 0 2px 10px rgba(0,0,0,0.3); }
        .header-logo span { color: #ddd6fe; font-weight: 400; }
        .content { padding: 40px 30px; }
        .content h2 { color: #f8fafc; font-size: 22px; margin-top: 0; font-weight: 700; }
        .content p { color: #cbd5e1; line-height: 1.7; font-size: 15px; }
        .button-container { text-align: center; margin: 40px 0; }
        .button { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block; border: 1px solid #a78bfa; box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4); }
        .footer { background-color: #0f172a; padding: 25px 30px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #1e293b; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <h1 class="header-logo">SmartPost <span>AI</span></h1>
          </div>
          <div class="content">
            <h2>Password Reset Request</h2>
            <p>Hi <strong>${user.name}</strong>,</p>
            <p>We received a request to reset the password associated with your SmartPost AI account. If you made this request, you can securely configure a new password by clicking the button below:</p>
            <div class="button-container">
              <a href="${resetUrl}" class="button">Reset My Password</a>
            </div>
            <p style="font-size: 13px; color: #94a3b8; margin-top: 30px;">If you didn't request a password reset, you can safely ignore this email. Your active credentials remain completely secure. This link will expire automatically in 10 minutes.</p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} SmartPost AI Automation. All rights reserved.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message,
      html
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    });
  } catch (err) {
    console.error("SendGrid Error: ", err);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('There was an error sending the email. Try again later!', 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({ 
    passwordResetToken: hashedToken, 
    passwordResetExpires: { $gt: Date.now() } 
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  
  // Also validate payload
  if (!req.body.password || req.body.password.length < 8) {
    return next(new AppError('Password must be at least 8 characters long.', 400));
  }

user.password = req.body.password;
user.passwordConfirm = req.body.password; // 🔥 FIX

user.passwordResetToken = undefined;
user.passwordResetExpires = undefined;

await user.save();

  // 3) Log the user in, send JWT
  createSendToken(user, 200, res);
});

exports.verifyEmail = catchAsync(async (req, res, next) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() }
  });

  if (!user) {
    return next(new AppError('Verification link is invalid or has expired.', 400));
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  // Optionally log them in immediately upon verification, or just tell them to login.
  // We'll return success and the frontend can push them to login.
  res.status(200).json({
    status: 'success',
    message: 'Email has been verified successfully!'
  });
});

exports.deleteAccount = catchAsync(async (req, res, next) => {
  await User.findByIdAndDelete(req.user.id);
  res.cookie('jwt', 'loggedout', { 
    expires: new Date(Date.now() + 10 * 1000), 
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
  res.status(204).json({ status: 'success', data: null });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password) {
    return next(new AppError('This route is not for password updates.', 400));
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = {};
  const allowedFields = ['name', 'bio', 'company', 'title'];
  Object.keys(req.body).forEach(el => {
    if (allowedFields.includes(el)) filteredBody[el] = req.body[el];
  });

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    data: { user: updatedUser }
  });
});
