import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation, Navigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, Save, KeyRound } from "lucide-react";

import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useToast } from "../../components/ui/Toast";
import api from "../../services/api";
import { loginSuccess } from "../../store/authSlice";

const ResetPasswordPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showToast } = useToast();

  // If we navigated here from ForgotPassword, we'll have the email in state
  const emailFromState = location.state?.email || "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  const inputRefs = useRef([]);

  // If no email, redirect back to forgot-password
  if (!emailFromState) {
    return <Navigate to="/auth/forgot-password" replace />;
  }

  // --- OTP Logic ---
  const handleOtpChange = (index, e) => {
    const value = e.target.value;
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6).split("");
    if (pastedData.some(char => isNaN(char))) return;

    const newOtp = [...otp];
    pastedData.forEach((char, index) => {
      if (index < 6) newOtp[index] = char;
    });
    setOtp(newOtp);

    const nextEmptyIndex = newOtp.findIndex(val => val === "");
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex].focus();
    } else {
      inputRefs.current[5].focus();
    }
  };

  // --- Password Logic ---
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

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  // --- Submit Logic ---
  const handleResetPassword = async (e) => {
    e.preventDefault();
    const otpString = otp.join("");
    
    const newErrors = {};
    if (otpString.length !== 6) newErrors.otp = "Please enter all 6 digits of the OTP";
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post("/api/auth/reset-password", {
        email: emailFromState,
        otp: otpString,
        newPassword: formData.password
      });

      // Update token and Redux state with verified user
      localStorage.setItem("token", response.data.token);
      dispatch(loginSuccess(response.data.user));

      showToast("success", "Password Reset Successful!", "You have been automatically logged in.");
      
      // Redirect to feed
      navigate("/app", { replace: true });
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to reset password. Please try again.";
      showToast("error", "Error", errorMessage);
      if (errorMessage.includes("OTP")) {
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0].focus();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg-base p-4">
      
      {/* Animated Background Shapes */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3], x: [0, 30, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[10%] right-[10%] h-[400px] w-[400px] rounded-full bg-secondary-500/30 mix-blend-screen blur-[100px] dark:mix-blend-multiply"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-secondary-500/20 to-secondary-600/20 shadow-glow shadow-secondary-500/20 border border-secondary-500/30">
            <KeyRound className="h-10 w-10 text-secondary-500" />
          </div>
          <h1 className="hero-text text-3xl font-bold tracking-tight">Create New Password</h1>
          <p className="mt-2 text-text-secondary px-4">
            Enter the 6-digit code sent to <span className="font-semibold text-text-primary">{emailFromState}</span> and create a new secure password.
          </p>
        </div>

        {/* Hero Glassmorphism Card */}
        <div className="glass-card rounded-3xl p-8 shadow-xl border border-white/10 dark:border-white/5">
          <form onSubmit={handleResetPassword} className="space-y-6">
            
            {/* OTP Input Section */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-3 text-center">Verification Code</label>
              <div className="flex justify-between gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-2xl border border-border-soft bg-bg-surface-hover text-text-primary focus:border-secondary-500 focus:ring-2 focus:ring-secondary-500/30 transition-all outline-none"
                  />
                ))}
              </div>
              {errors.otp && <p className="mt-2 text-xs text-red-500 text-center">{errors.otp}</p>}
            </div>

            <div className="w-full border-t border-border-soft my-6"></div>

            {/* New Password Section */}
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="relative">
                  <Input
                    label="New Password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handlePasswordChange}
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
                  <div className="px-1 mt-1">
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
                label="Confirm New Password"
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handlePasswordChange}
                error={errors.confirmPassword}
                leftIcon={<Lock className="h-5 w-5" />}
                className="rounded-2xl"
              />
            </div>

            <Button
              type="submit"
              variant="gradient"
              className="w-full h-12 rounded-xl text-lg shadow-glow shadow-secondary-500/30 mt-2"
              isLoading={isLoading}
              leftIcon={!isLoading && <Save className="h-5 w-5" />}
            >
              Reset Password
            </Button>
          </form>
        </div>
        
        <p className="mt-8 text-center text-sm text-text-secondary">
          <Link to="/auth/login" className="font-semibold hover:text-text-primary transition-colors">
            Cancel and return to Login
          </Link>
        </p>

      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
