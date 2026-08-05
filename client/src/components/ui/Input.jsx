import { forwardRef } from "react";
import { cn } from "../../utils/cn";

const Input = forwardRef(({ 
  className, 
  type = "text",
  error,
  leftIcon,
  rightIcon,
  ...props 
}, ref) => {
  return (
    <div className="relative w-full">
      {leftIcon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
          {leftIcon}
        </div>
      )}
      <input
        type={type}
        className={cn(
          "design-input flex h-11 w-full rounded-xl px-3 py-2 text-sm placeholder:text-text-secondary disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none",
          leftIcon && "pl-10",
          rightIcon && "pr-10",
          error && "border-red-500 focus:ring-red-500",
          className
        )}
        ref={ref}
        {...props}
      />
      {rightIcon && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary">
          {rightIcon}
        </div>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
});

Input.displayName = "Input";

export { Input };
