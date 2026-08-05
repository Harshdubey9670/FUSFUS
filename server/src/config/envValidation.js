/**
 * Production Environment Variable Validator
 * Validates essential environment variables on server boot to prevent silent runtime failures.
 */

const requiredEnvVars = [
  'MONGO_URI',
  'JWT_SECRET',
];

const optionalEnvVars = [
  'PORT',
  'NODE_ENV',
  'CLIENT_URL',
  'CLOUDINARY_URL',
  'REDIS_URL',
  'SENTRY_DSN'
];

exports.validateEnv = () => {
  const missing = [];

  requiredEnvVars.forEach((varName) => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  if (missing.length > 0) {
    console.error('❌ [FATAL] Missing required environment variables:', missing.join(', '));
    console.error('Please configure these variables in server/.env before starting production server.');
    // In strict production, fail fast
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  } else {
    console.log('✅ [ENV] Production environment variables validated successfully.');
  }

  // Set default fallbacks if missing
  process.env.PORT = process.env.PORT || '5000';
  process.env.NODE_ENV = process.env.NODE_ENV || 'development';
};
