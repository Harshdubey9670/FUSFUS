import { forwardRef, useState } from "react";
import { cn } from "../../utils/cn";
import { User } from "lucide-react";

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-16 w-16 text-base",
  xl: "h-24 w-24 text-xl"
};

const Avatar = forwardRef(({ 
  className, 
  src, 
  alt = "Avatar", 
  size = "md",
  fallback,
  isOnline = false,
  ...props 
}, ref) => {
  const [error, setError] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        ref={ref}
        className={cn(
          "relative flex shrink-0 overflow-hidden rounded-full bg-bg-surface-hover border-2 border-bg-surface",
          sizes[size],
          className
        )}
        {...props}
      >
        {src && !error ? (
          <img
            src={src}
            alt={alt}
            onError={() => setError(true)}
            className="aspect-square h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300">
            {fallback ? fallback : <User className="h-1/2 w-1/2" />}
          </div>
        )}
      </div>
      {isOnline && (
        <span className={cn(
          "absolute bottom-0 right-0 block rounded-full bg-green-500 ring-2 ring-bg-base",
          size === 'sm' ? 'h-2 w-2' : size === 'xl' ? 'h-4 w-4' : 'h-3 w-3'
        )} />
      )}
    </div>
  );
});

Avatar.displayName = "Avatar";

export { Avatar };
