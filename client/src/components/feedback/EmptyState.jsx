import { cn } from "../../utils/cn";
import { FolderSearch } from "lucide-react";
import { Button } from "../ui/Button";

export const EmptyState = ({ 
  icon: Icon = FolderSearch, 
  title = "No results found", 
  description = "There are currently no items to display here.",
  actionLabel,
  onAction,
  className 
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-bg-surface-hover">
        <Icon className="h-10 w-10 text-text-secondary" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-text-primary">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-text-secondary">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="outline">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
