import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";

export const SplashScreen = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate a minimum splash screen display time of 2.5 seconds
    const timer = setTimeout(() => {
      const token = localStorage.getItem("token"); // Check for JWT
      
      if (token) {
        navigate("/app", { replace: true }); // equivalent to /feed in our routing
      } else {
        navigate("/auth/login", { replace: true });
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-bg-base overflow-hidden">
      
      {/* Background Animated Gradients */}
      <div className="absolute inset-0 z-0 opacity-50">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] -left-[10%] h-[60vh] w-[60vw] rounded-full bg-primary-500/30 mix-blend-screen blur-[100px] dark:mix-blend-multiply"
        />
        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-[20%] -right-[10%] h-[60vh] w-[60vw] rounded-full bg-secondary-500/30 mix-blend-screen blur-[100px] dark:mix-blend-multiply"
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Animated Logo */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", bounce: 0.5, duration: 1 }}
          className="mb-6 flex h-24 w-24 items-center justify-center rounded-[2rem] hero-gradient shadow-glow shadow-primary-500/50"
        >
          <Sparkles className="h-12 w-12 text-white" />
        </motion.div>

        {/* App Name */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="flex flex-col items-center"
        >
          <h1 className="hero-text text-4xl font-black tracking-tight mb-8">SnapGram AI</h1>
          
          {/* Beautiful Loading Indicator */}
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
            <span className="text-sm font-medium text-text-secondary tracking-widest uppercase animate-pulse">
              Initializing
            </span>
          </div>
        </motion.div>
      </div>

    </div>
  );
};
