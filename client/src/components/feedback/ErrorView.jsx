import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "../ui/Button";

export const ErrorView = ({ 
  error, 
  resetErrorBoundary,
  title = "Something went wrong!"
}) => {
  return (
    <div className="flex min-h-[400px] w-full flex-col items-center justify-center p-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-500 dark:bg-red-500/10">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h2 className="mb-2 text-xl font-semibold text-text-primary">{title}</h2>
      {error && (
        <div className="mb-6 max-w-lg rounded-lg bg-bg-surface-hover p-4 text-left text-sm text-red-500 overflow-auto">
          <code className="break-words">{error.message || error.toString()}</code>
        </div>
      )}
      {resetErrorBoundary && (
        <Button onClick={resetErrorBoundary} variant="outline" leftIcon={<RefreshCw className="h-4 w-4" />}>
          Try again
        </Button>
      )}
    </div>
  );
};
