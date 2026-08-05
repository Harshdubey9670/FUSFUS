import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "../ui/Button";

export const NotFound404 = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative mb-8"
      >
        <h1 className="hero-text text-[150px] font-black leading-none opacity-20 dark:opacity-10">
          404
        </h1>
        <div className="absolute inset-0 flex items-center justify-center">
          <h2 className="text-3xl font-bold text-text-primary md:text-5xl">Page not found</h2>
        </div>
      </motion.div>
      
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mb-8 max-w-md text-text-secondary"
      >
        Oops! The page you are looking for might have been removed, had its name
        changed, or is temporarily unavailable.
      </motion.p>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="flex flex-col gap-4 sm:flex-row"
      >
        <Button onClick={() => navigate(-1)} variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
          Go Back
        </Button>
        <Button onClick={() => navigate("/")} variant="gradient" leftIcon={<Home className="h-4 w-4" />}>
          Back to Home
        </Button>
      </motion.div>
    </div>
  );
};
