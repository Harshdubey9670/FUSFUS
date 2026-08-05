import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { cn } from "../../utils/cn";

export const ContextMenu = ({ children, menuItems, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleContextMenu = (e) => {
    e.preventDefault();
    setIsOpen(true);
    setPosition({ x: e.pageX, y: e.pageY });
  };

  return (
    <div onContextMenu={handleContextMenu} className={className}>
      {children}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              style={{ top: position.y, left: position.x }}
              className="absolute z-[100] min-w-[200px] rounded-xl glass-card p-1 shadow-2xl"
            >
              {menuItems.map((item, index) => {
                if (item.separator) {
                  return <div key={`sep-${index}`} className="my-1 h-px bg-border-soft" />;
                }
                return (
                  <button
                    key={index}
                    onClick={() => {
                      item.onClick?.();
                      setIsOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center rounded-lg px-3 py-2 text-sm transition-colors",
                      item.danger
                        ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                        : "text-text-primary hover:bg-bg-surface-hover"
                    )}
                  >
                    {item.icon && <span className="mr-2 h-4 w-4">{item.icon}</span>}
                    {item.label}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
