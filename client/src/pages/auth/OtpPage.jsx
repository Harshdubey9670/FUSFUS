import { useState, useRef, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { ShieldCheck, RefreshCw, CheckCircle2 } from "lucide-react";

import { Button } from "../../components/ui/Button";
import { useToast } from "../../components/ui/Toast";
import api from "../../services/api";
import { loginSuccess } from "../../store/authSlice";

const OtpPage = () => {
  // Pull the unverified user from Redux if they just signed up,
  // or we could require them to have an email in state.
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Redirect if no user data is available to verify
  // But wait, what if they just loaded this page directly? We should probably redirect to login.
  // For safety, let's just make sure user?.email exists
  useEffect(() => {
    if (!user?.email) {
      // If we don't know who is verifying, send them to login
      navigate("/auth/login", { replace: true });
    }
  }, [user, navigate]);

  // Countdown timer logic
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (index, e) => {
    const value = e.target.value;
    if (isNaN(value)) return; // Only allow numbers

    const newOtp = [...otp];
    // Take the last character in case they type quickly
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      // Auto move to previous input on backspace
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6).split("");
    if (pastedData.some(char => isNaN(char))) return; // Ensure all pasted characters are numbers

    const newOtp = [...otp];
    pastedData.forEach((char, index) => {
      if (index < 6) newOtp[index] = char;
    });
    setOtp(newOtp);

    // Focus the next empty input or the last one
    const nextEmptyIndex = newOtp.findIndex(val => val === "");
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex].focus();
    } else {
      inputRefs.current[5].focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpString = otp.join("");
    
    if (otpString.length !== 6) {
      showToast("error", "Incomplete OTP", "Please enter all 6 digits.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post("/api/auth/verify-otp", {
        email: user.email,
        otp: otpString
      });

      // Update token and Redux state with verified user
      localStorage.setItem("token", response.data.token);
      dispatch(loginSuccess(response.data.user));

      showToast("success", "Verification Successful!", "Your account is now active.");
      
      // Redirect to Profile Setup
      navigate("/auth/profile-setup", { replace: true });
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Invalid OTP. Please try again.";
      showToast("error", "Verification Failed", errorMessage);
      // Clear inputs on error for easy re-entry
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0].focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    
    setIsResending(true);
    try {
      await api.post("/api/auth/resend-otp", { email: user.email });
      setTimer(60); // Reset timer
      showToast("success", "OTP Sent", "A new verification code has been sent to your email.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0].focus();
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to resend OTP.";
      showToast("error", "Failed", errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  if (!user?.email) return null; // Prevent flash before redirect

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg-base p-4">
      
      {/* Animated Background Shapes */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[20%] right-[20%] h-[400px] w-[400px] rounded-full bg-primary-500/30 mix-blend-screen blur-[100px] dark:mix-blend-multiply"
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
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-primary-500/20 to-primary-600/20 shadow-glow shadow-primary-500/20 border border-primary-500/30">
            <ShieldCheck className="h-10 w-10 text-primary-500" />
          </div>
          <h1 className="hero-text text-3xl font-bold tracking-tight">Verify Account</h1>
          <p className="mt-2 text-text-secondary px-4">
            We've sent a 6-digit code to <br/>
            <span className="font-semibold text-text-primary">{user?.email}</span>
          </p>
        </div>

        {/* Hero Glassmorphism Card */}
        <div className="glass-card rounded-3xl p-8 shadow-xl border border-white/10 dark:border-white/5">
          <form onSubmit={handleVerify} className="space-y-8">
            
            <div className="flex justify-between gap-2 sm:gap-3" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-2xl border border-border-soft bg-bg-surface-hover text-text-primary focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 transition-all outline-none"
                />
              ))}
            </div>

            <Button
              type="submit"
              variant="gradient"
              className="w-full h-12 rounded-xl text-lg shadow-glow shadow-primary-500/30"
              isLoading={isLoading}
              leftIcon={!isLoading && <CheckCircle2 className="h-5 w-5" />}
              disabled={otp.join("").length !== 6}
            >
              Verify Code
            </Button>

            <div className="flex flex-col items-center justify-center space-y-4 pt-2">
              <p className="text-sm text-text-secondary flex items-center gap-2">
                Didn't receive the code?
              </p>
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResend}
                disabled={timer > 0 || isResending}
                isLoading={isResending}
                leftIcon={timer === 0 && !isResending && <RefreshCw className="h-4 w-4" />}
                className={timer > 0 ? "text-text-secondary cursor-not-allowed" : "text-primary-500 hover:text-primary-600"}
              >
                {timer > 0 ? `Resend code in ${timer}s` : "Resend OTP"}
              </Button>
            </div>
          </form>
        </div>
        
        <p className="mt-8 text-center text-sm text-text-secondary">
          <button 
            onClick={() => navigate("/auth/login", { replace: true })}
            className="font-semibold hover:text-text-primary transition-colors"
          >
            Back to Login
          </button>
        </p>

      </motion.div>
    </div>
  );
};

export default OtpPage;
