const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
};

// Helper to generate 6 digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
exports.signup = async (req, res, next) => {
  try {
    const { fullName, username, email, password } = req.body;

    // Check for existing user
    const userExists = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (userExists) {
      const isEmail = userExists.email === email;
      return res.status(400).json({
        success: false,
        message: `${isEmail ? 'Email' : 'Username'} is already in use`
      });
    }

    // Generate initial OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Create user
    const user = await User.create({
      fullName,
      username,
      email,
      password,
      otp,
      otpExpires
    });

    // Generate temporary token for OTP step
    const token = generateToken(user._id);

    // Development only: Send OTP in response
    console.log(`[DEV ONLY] OTP for ${email} is ${otp}`);

    res.status(201).json({
      success: true,
      token,
      message: 'Account created successfully. Please verify your OTP.',
      devOtp: otp, // Sending it back for easy frontend testing
      user: {
        _id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public (needs email or id)
exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'User is already verified' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    // Verification successful
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Generate a fresh token now that they are verified
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Account verified successfully',
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
exports.resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'User is already verified' });
    }

    // Generate new OTP
    const newOtp = generateOTP();
    user.otp = newOtp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    console.log(`[DEV ONLY] New OTP for ${email} is ${newOtp}`);

    res.status(200).json({
      success: true,
      message: 'A new OTP has been sent',
      devOtp: newOtp
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check if username is available
// @route   POST /api/auth/check-username
// @access  Public
exports.checkUsername = async (req, res, next) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ success: false, message: 'Username is required' });
    }

    const user = await User.findOne({ username });
    
    if (user) {
      return res.status(200).json({ success: true, available: false });
    }
    
    return res.status(200).json({ success: true, available: true });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Note: In a real app, you might want to prevent login if !user.isVerified
    // For now, we'll let them login but you could check user.isVerified here.

    const token = generateToken(user._id);

    // Track session
    const deviceString = req.headers['user-agent'] || 'Unknown Device';
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'Unknown IP';
    
    user.sessions.push({
      token,
      deviceString,
      ip,
      lastActive: Date.now()
    });
    
    // Keep only last 10 sessions to prevent array from growing infinitely
    if (user.sessions.length > 10) {
      user.sessions.shift();
    }
    
    await user.save();

    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot Password (Generate OTP)
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      // Even if user doesn't exist, we send success to prevent email enumeration
      return res.status(200).json({ success: true, message: 'If that email exists, an OTP has been sent' });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    console.log(`[DEV ONLY] Password Reset OTP for ${email} is ${otp}`);

    res.status(200).json({
      success: true,
      message: 'If that email exists, an OTP has been sent',
      devOtp: otp
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset Password (using OTP)
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide email, OTP, and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    // OTP matches and hasn't expired. Update password.
    user.password = newPassword;
    user.otp = undefined;
    user.otpExpires = undefined;
    
    // If they were unverified, verifying their password via OTP implies email ownership
    user.isVerified = true; 

    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully',
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Auth with Google
// @route   POST /api/auth/google
// @access  Public
exports.googleAuth = async (req, res, next) => {
  try {
    const { credential } = req.body;
    
    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google credential missing' });
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Check if user exists
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      // If user exists but doesn't have googleId (signed up with email before), link them
      if (!user.googleId) {
        user.googleId = googleId;
        user.isVerified = true;
        if (!user.profilePicture && picture) {
           user.profilePicture = picture;
        }
        await user.save();
      }
    } else {
      // Create new user
      // Generate a username from name
      let baseUsername = name.replace(/\s+/g, '').toLowerCase();
      // Make sure username is unique
      let username = baseUsername;
      let counter = 1;
      while (await User.findOne({ username })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      user = await User.create({
        fullName: name,
        username,
        email,
        googleId,
        profilePicture: picture,
        isVerified: true
      });
    }

    const token = generateToken(user._id);

    // Track session
    const deviceString = req.headers['user-agent'] || 'Unknown Device';
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'Unknown IP';
    
    user.sessions.push({
      token,
      deviceString,
      ip,
      lastActive: Date.now()
    });
    
    // Keep only last 10 sessions to prevent array from growing infinitely
    if (user.sessions.length > 10) {
      user.sessions.shift();
    }
    
    await user.save();

    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(401).json({ success: false, message: 'Invalid Google Token' });
  }
};

// @desc    Change password (authenticated)
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user._id).select('+password');
    
    // If they signed up with Google, they might not have a password
    if (user.googleId && !user.password) {
       return res.status(400).json({ success: false, message: 'You signed up with Google. Please use forgot password if you want to set a password.' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect current password' });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all active sessions
// @route   GET /api/auth/sessions
// @access  Private
exports.getSessions = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.status(200).json({
      success: true,
      data: user.sessions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout a specific session
// @route   DELETE /api/auth/sessions/:sessionId
// @access  Private
exports.logoutSession = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    user.sessions = user.sessions.filter(session => session._id.toString() !== req.params.sessionId);
    await user.save();
    
    res.status(200).json({ success: true, message: 'Session logged out' });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout all sessions except current
// @route   DELETE /api/auth/sessions
// @access  Private
exports.logoutAllSessions = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const currentToken = req.headers.authorization.split(' ')[1];
    
    user.sessions = user.sessions.filter(session => session.token === currentToken);
    await user.save();
    
    res.status(200).json({ success: true, message: 'Logged out of all other devices' });
  } catch (error) {
    next(error);
  }
};
