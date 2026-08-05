import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Sparkles, User, UserPlus, Image as ImageIcon, CheckCircle, XCircle } from "lucide-react";

import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useToast } from "../../components/ui/Toast";
import api from "../../services/api";
import { loginSuccess } from "../../store/authSlice";
import { useDispatch } from "react-redux";
import { GoogleLogin } from '@react-oauth/google';

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const SignupPage = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    profilePicture: null
  });
  const [previewUrl, setPreviewUrl] = useState(null);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Username availability state
  const [usernameStatus, setUsernameStatus] = useState({ checking: false, available: null, message: "" });
  const debouncedUsername = useDebounce(formData.username, 500);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { toast } = useToast();

  // Check username availability
  useEffect(() => {
    const checkUsername = async () => {
      if (!debouncedUsername || debouncedUsername.length < 3) {
        setUsernameStatus({ checking: false, available: null, message: "" });
        return;
      }
      
      setUsernameStatus({ checking: true, available: null, message: "Checking..." });
      try {
        const res = await api.post('/api/auth/check-username', { username: debouncedUsername });
        if (res.data.available) {
          setUsernameStatus({ checking: false, available: true, message: "Username is available!" });
        } else {
          setUsernameStatus({ checking: false, available: false, message: "Username is taken." });
        }
      } catch (err) {
        setUsernameStatus({ checking: false, available: null, message: "" });
      }
    };

    checkUsername();
  }, [debouncedUsername]);

  const calculatePasswordStrength = (password) => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (password.length >= 10) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) strength += 25;
    return strength;
  };

  const strength = calculatePasswordStrength(formData.password);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ variant: "error", title: "File too large", description: "Profile picture must be under 5MB." });
        return;
      }
      setFormData(prev => ({ ...prev, profilePicture: file }));
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName) newErrors.fullName = "Full name is required";
    
    if (!formData.username) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Must be at least 3 characters";
    } else if (usernameStatus.available === false) {
      newErrors.username = "This username is already taken";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      // Create FormData if we were uploading a file, but for now we'll just send JSON
      // since the backend currently expects JSON. We can update to FormData when Cloudinary is added.
      const payload = {
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        // Profile picture handling will go here later
      };

      const response = await api.post('/api/auth/signup', payload);
      
      // Store JWT Token just in case they are considered logged in
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      }
      
      toast({ variant: "success", title: "Account Created!", description: "Redirecting to verification..." });
      
      // Redirect to OTP Verification
      navigate("/auth/otp");
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to create account. Please try again.";
      toast({ variant: "error", title: "Signup Failed", description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    try {
      const response = await api.post('/api/auth/google', {
        credential: credentialResponse.credential
      });

      const { token, user } = response.data;
      localStorage.setItem("token", token);
      dispatch(loginSuccess(user));
      
      toast({ variant: "success", title: "Welcome!", description: "Successfully signed up with Google." });
      navigate("/app", { replace: true });
    } catch (err) {
      toast({ variant: "error", title: "Google Signup Failed", description: "Could not authenticate with Google." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg-base p-4 py-12">
      
      {/* Animated Background Shapes */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none overflow-hidden hidden sm:block">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3], x: [0, 50, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[10%] -left-[10%] h-[400px] w-[400px] rounded-full bg-primary-500/30 mix-blend-screen blur-[100px] dark:mix-blend-multiply"
        />
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.5, 0.2], y: [0, -50, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -bottom-[10%] right-[10%] h-[500px] w-[500px] rounded-full bg-secondary-500/30 mix-blend-screen blur-[100px] dark:mix-blend-multiply"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[1.2rem] hero-gradient shadow-glow shadow-primary-500/40">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="hero-text text-3xl font-bold tracking-tight">Create Account</h1>
          <p className="mt-2 text-text-secondary">Join SnapGram AI today.</p>
        </div>

        {/* Hero Glassmorphism Card */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-xl border border-white/10 dark:border-white/5">
          <form onSubmit={handleSignup} className="space-y-5">
            
            {/* Profile Picture Upload */}
            <div className="flex flex-col items-center justify-center mb-6">
              <label htmlFor="avatar-upload" className="relative cursor-pointer group">
                <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-dashed border-border-soft group-hover:border-primary-500 transition-colors bg-bg-surface flex items-center justify-center relative">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-text-secondary group-hover:text-primary-500 transition-colors" />
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <span className="text-white text-xs font-medium">Upload</span>
                  </div>
                </div>
                <input 
                  id="avatar-upload" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileChange}
                />
              </label>
            </div>

            <Input
              label="Full Name"
              type="text"
              name="fullName"
              placeholder="John Doe"
              value={formData.fullName}
              onChange={handleChange}
              error={errors.fullName}
              leftIcon={<User className="h-5 w-5" />}
              className="rounded-2xl"
            />

            <div className="space-y-1">
              <Input
                label="Username"
                type="text"
                name="username"
                placeholder="johndoe"
                value={formData.username}
                onChange={handleChange}
                error={errors.username}
                leftIcon={<span className="text-text-secondary font-bold h-5 w-5 flex items-center justify-center">@</span>}
                className="rounded-2xl"
              />
              {/* Username live validation feedback */}
              {formData.username.length >= 3 && !errors.username && (
                <div className="flex items-center gap-1 text-xs px-1">
                  {usernameStatus.checking ? (
                    <span className="text-text-secondary animate-pulse">Checking availability...</span>
                  ) : usernameStatus.available === true ? (
                    <><CheckCircle className="h-3 w-3 text-green-500" /><span className="text-green-500">{usernameStatus.message}</span></>
                  ) : usernameStatus.available === false ? (
                    <><XCircle className="h-3 w-3 text-red-500" /><span className="text-red-500">{usernameStatus.message}</span></>
                  ) : null}
                </div>
              )}
            </div>

            <Input
              label="Email Address"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              leftIcon={<Mail className="h-5 w-5" />}
              className="rounded-2xl"
            />

            <div className="space-y-2">
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  leftIcon={<Lock className="h-5 w-5" />}
                  className="rounded-2xl pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[34px] p-1 text-text-secondary hover:text-text-primary focus:outline-none"
                  tabIndex="-1"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {formData.password && (
                <div className="px-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-text-secondary">Password Strength</span>
                    <span className="text-xs font-medium" style={{
                      color: strength < 50 ? '#ef4444' : strength < 75 ? '#eab308' : '#22c55e'
                    }}>
                      {strength < 50 ? 'Weak' : strength < 75 ? 'Good' : 'Strong'}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-bg-surface-hover rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${strength}%`, backgroundColor: strength < 50 ? '#ef4444' : strength < 75 ? '#eab308' : '#22c55e' }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}
            </div>

            <Input
              label="Confirm Password"
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              leftIcon={<Lock className="h-5 w-5" />}
              className="rounded-2xl"
            />

            <Button
              type="submit"
              variant="gradient"
              className="w-full h-12 rounded-xl text-lg shadow-glow shadow-primary-500/30 mt-4"
              isLoading={isLoading}
              leftIcon={!isLoading && <UserPlus className="h-5 w-5" />}
            >
              Create Account
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border-soft"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-bg-base px-4 text-text-secondary glass rounded-full py-1">Or continue with</span>
              </div>
            </div>

            <div className="flex justify-center w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  toast({ variant: "error", title: "Signup Failed", description: "Google Signup was unsuccessful." });
                }}
                theme="outline"
                size="large"
                width="100%"
                shape="rectangular"
                text="signup_with"
              />
            </div>
          </form>
        </div>

        <p className="mt-8 text-center text-sm text-text-secondary">
          Already have an account?{" "}
          <Link to="/auth/login" className="font-semibold text-primary-500 hover:text-primary-600 transition-colors">
            Log in here
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default SignupPage;
