import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

export const ThemeToggle = ({ className }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={toggleTheme}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center rounded-full glass-card hover:bg-bg-surface-hover text-text-primary transition-colors",
        className
      )}
      aria-label="Toggle theme"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </motion.button>
  );
};
