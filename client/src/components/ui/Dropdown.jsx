import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../utils/cn";

export const Dropdown = ({ 
  trigger, 
  children, 
  align = "right",
  className 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn(
              "absolute z-50 mt-2 min-w-[200px] rounded-xl glass-card p-1 shadow-soft",
              align === "right" ? "right-0 origin-top-right" : "left-0 origin-top-left",
              className
            )}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const DropdownItem = ({ children, onClick, className, danger }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center rounded-lg px-3 py-2 text-sm transition-colors focus:outline-none",
        danger 
          ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10" 
          : "text-text-primary hover:bg-bg-surface-hover",
        className
      )}
    >
      {children}
    </button>
  );
};

export const DropdownSeparator = () => (
  <div className="my-1 h-px bg-border-soft" />
);
