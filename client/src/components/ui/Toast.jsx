import { createContext, useContext, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "../../utils/cn";

const ToastContext = createContext(null);

let toastId = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback(({ title, description, variant = "default", duration = 5000 }) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, title, description, variant }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Backwards compatibility helper for older components that used showToast(variant, title, description) or showToast(title, variant)
  const showToast = useCallback((arg1, arg2, arg3) => {
    const validVariants = ["success", "error", "info", "warning", "default"];
    if (validVariants.includes(arg1)) {
      toast({ variant: arg1, title: arg2, description: arg3 });
    } else if (validVariants.includes(arg2)) {
      toast({ variant: arg2, title: arg1 });
    } else {
      toast({ title: arg1, description: arg2 });
    }
  }, [toast]);

  return (
    <ToastContext.Provider value={{ toast, showToast }}>
      {children}
      {typeof document !== "undefined" && createPortal(
        <div className="fixed bottom-0 right-0 z-[100] flex flex-col gap-2 p-4 md:max-w-[420px]">
          <AnimatePresence>
            {toasts.map((t) => (
              <ToastItem key={t.id} toast={t} onRemove={() => removeToast(t.id)} />
            ))}
          </AnimatePresence>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};

const ToastItem = ({ toast, onRemove }) => {
  const icons = {
    default: <Info className="h-5 w-5 text-primary-500" />,
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    error: <AlertCircle className="h-5 w-5 text-red-500" />,
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className="glass-card flex w-full items-start gap-3 rounded-xl p-4 shadow-xl"
    >
      <div className="mt-0.5 shrink-0">{icons[toast.variant] || icons.default}</div>
      <div className="flex-1 space-y-1">
        {toast.title && <h3 className="text-sm font-semibold text-text-primary">{toast.title}</h3>}
        {toast.description && <p className="text-sm text-text-secondary">{toast.description}</p>}
      </div>
      <button
        onClick={onRemove}
        className="shrink-0 rounded-full p-1 text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
};
