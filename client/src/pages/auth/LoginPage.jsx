import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Sparkles, LogIn } from "lucide-react";

import { loginSuccess } from "../../store/authSlice";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useToast } from "../../components/ui/Toast";
import api from "../../services/api";
import { GoogleLogin } from '@react-oauth/google';

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: "", password: "", rememberMe: false });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      // Connect to Node.js Login API
      const response = await api.post('/api/auth/login', {
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe
      });

      const { token, user } = response.data;
      
      // Store JWT Token
      localStorage.setItem("token", token);
      
      // Update Redux state
      dispatch(loginSuccess(user));
      
      toast({ variant: "success", title: "Welcome back!", description: "Successfully logged in." });
      
      // Redirect to Feed or intended destination
      const destination = location.state?.from?.pathname || "/app";
      navigate(destination, { replace: true });
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to connect to the server. Please try again.";
      toast({ variant: "error", title: "Login Failed", description: errorMessage });
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
      
      toast({ variant: "success", title: "Welcome back!", description: "Successfully logged in with Google." });
      const destination = location.state?.from?.pathname || "/app";
      navigate(destination, { replace: true });
    } catch (err) {
      toast({ variant: "error", title: "Google Login Failed", description: "Could not authenticate with Google." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg-base p-4">
      
      {/* Animated Background Shapes — hidden on tiny screens to prevent overflow */}
      <div className="absolute inset-0 z-0 opacity-40 hidden sm:block">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3], x: [0, 50, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -left-[10%] h-[500px] w-[500px] rounded-full bg-primary-500/30 mix-blend-screen blur-[100px] dark:mix-blend-multiply"
        />
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.5, 0.2], y: [0, -50, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-[10%] -right-[10%] h-[600px] w-[600px] rounded-full bg-secondary-500/30 mix-blend-screen blur-[100px] dark:mix-blend-multiply"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[1.5rem] hero-gradient shadow-glow shadow-primary-500/40">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <h1 className="hero-text text-3xl font-bold tracking-tight">Welcome Back</h1>
          <p className="mt-2 text-text-secondary">Enter your details to access your account.</p>
        </div>

        {/* Hero Glassmorphism Card */}
        <div className="glass-card rounded-3xl p-5 sm:p-8 shadow-xl border border-white/10 dark:border-white/5">
          <form onSubmit={handleLogin} className="space-y-6">
            
            <div className="space-y-4">
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
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-border-soft text-primary-500 focus:ring-primary-500 bg-bg-surface-hover cursor-pointer"
                />
                <span className="text-text-secondary select-none">Remember me</span>
              </label>
              <Link to="/auth/forgot-password" className="font-medium text-primary-500 hover:text-primary-600 transition-colors">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="gradient"
              className="w-full h-12 rounded-xl text-lg shadow-glow shadow-primary-500/30"
              isLoading={isLoading}
              leftIcon={!isLoading && <LogIn className="h-5 w-5" />}
            >
              Sign In
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
                  toast({ variant: "error", title: "Login Failed", description: "Google Login was unsuccessful." });
                }}
                theme="outline"
                size="large"
                shape="rectangular"
                text="signin_with"
              />
            </div>
          </form>
        </div>

        <p className="mt-8 text-center text-sm text-text-secondary">
          Don't have an account?{" "}
          <Link to="/auth/signup" className="font-semibold text-primary-500 hover:text-primary-600 transition-colors">
            Create an account
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
