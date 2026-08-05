import { cn } from "../../utils/cn";
import { Loader2 } from "lucide-react";

export const Loader = ({ className, size = "md", ...props }) => {
  const sizes = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16"
  };

  return (
    <div className="flex items-center justify-center">
      <Loader2 
        className={cn("animate-spin text-primary-500", sizes[size], className)} 
        {...props} 
      />
    </div>
  );
};

export const Skeleton = ({ className, ...props }) => {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-border-soft", className)}
      {...props}
    />
  );
};
