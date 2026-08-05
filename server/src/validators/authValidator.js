const { body } = require('express-validator');

exports.signupValidator = [
  body('fullName').trim().notEmpty().withMessage('Full name is required').isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
  body('username').trim().notEmpty().withMessage('Username is required').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').trim().isEmail().withMessage('Must be a valid email address').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
];

exports.loginValidator = [
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Must be a valid email address').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

exports.resetPasswordValidator = [
  body('email').trim().isEmail().withMessage('Must be a valid email address').normalizeEmail(),
  body('otp').trim().notEmpty().withMessage('OTP is required').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long'),
];

exports.forgotPasswordValidator = [
  body('email').trim().isEmail().withMessage('Must be a valid email address').normalizeEmail(),
];

exports.verifyOtpValidator = [
  body('email').trim().isEmail().withMessage('Must be a valid email address').normalizeEmail(),
  body('otp').trim().notEmpty().withMessage('OTP is required').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
];
