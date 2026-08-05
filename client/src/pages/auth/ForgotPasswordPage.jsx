import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, KeyRound, ArrowRight } from "lucide-react";

import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useToast } from "../../components/ui/Toast";
import api from "../../services/api";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSendCode = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError("Email is required");
      return;
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/api/auth/forgot-password", { email });
      
      showToast("success", "Code Sent", "If the email exists, a reset code was sent.");
      
      // Navigate to Reset Password page, passing the email so they don't have to type it again
      navigate("/auth/reset-password", { state: { email } });
      
    } catch (err) {
      // Even on failure, we might not want to reveal if an email exists or not,
      // but in case of server errors, we can show a toast.
      const errorMessage = err.response?.data?.message || "Something went wrong. Please try again.";
      showToast("error", "Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg-base p-4">
      
      {/* Animated Background Shapes */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3], x: [0, -30, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -left-[10%] h-[500px] w-[500px] rounded-full bg-primary-500/30 mix-blend-screen blur-[100px] dark:mix-blend-multiply"
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
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-primary-500/20 to-primary-600/20 shadow-glow shadow-primary-500/20 border border-primary-500/30">
            <KeyRound className="h-10 w-10 text-primary-500" />
          </div>
          <h1 className="hero-text text-3xl font-bold tracking-tight">Forgot Password?</h1>
          <p className="mt-2 text-text-secondary px-4">
            No worries! Enter your email address and we'll send you a 6-digit code to reset it.
          </p>
        </div>

        {/* Hero Glassmorphism Card */}
        <div className="glass-card rounded-3xl p-8 shadow-xl border border-white/10 dark:border-white/5">
          <form onSubmit={handleSendCode} className="space-y-6">
            
            <Input
              label="Email Address"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError("");
              }}
              error={error}
              leftIcon={<Mail className="h-5 w-5" />}
              className="rounded-2xl"
              autoFocus
            />

            <Button
              type="submit"
              variant="gradient"
              className="w-full h-12 rounded-xl text-lg shadow-glow shadow-primary-500/30"
              isLoading={isLoading}
              rightIcon={!isLoading && <ArrowRight className="h-5 w-5" />}
            >
              Send Reset Code
            </Button>
          </form>
        </div>
        
        <p className="mt-8 text-center text-sm text-text-secondary">
          Remember your password?{" "}
          <Link to="/auth/login" className="font-semibold text-primary-500 hover:text-primary-600 transition-colors">
            Log in here
          </Link>
        </p>

      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
