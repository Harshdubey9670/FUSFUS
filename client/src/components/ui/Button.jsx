import { forwardRef } from "react";
import { cn } from "../../utils/cn";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const variants = {
  primary: "bg-primary-500 text-white hover:bg-primary-600 shadow-soft",
  secondary: "bg-secondary-500 text-white hover:bg-secondary-600 shadow-soft",
  outline: "border-2 border-primary-500 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20",
  ghost: "text-text-primary hover:bg-bg-surface-hover",
  glass: "glass text-text-primary hover:bg-glass-bg/80",
  gradient: "hero-gradient text-white hover:opacity-90 shadow-soft",
  ai: "ai-gradient text-white shadow-glow hover:shadow-glow-pink",
};

const sizes = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm font-medium",
  lg: "h-12 px-8 text-base font-medium",
  icon: "h-10 w-10 justify-center",
};

const Button = forwardRef(({ 
  className, 
  variant = "primary", 
  size = "md", 
  isLoading = false, 
  leftIcon,
  rightIcon,
  children, 
  disabled,
  ...props 
}, ref) => {
  return (
    <motion.button
      whileTap={{ scale: disabled || isLoading ? 1 : 0.95 }}
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </motion.button>
  );
});

Button.displayName = "Button";

export { Button };
