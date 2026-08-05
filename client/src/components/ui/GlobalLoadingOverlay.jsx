import { Loader2 } from "lucide-react";

export const GlobalLoadingOverlay = () => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-bg-base/80 backdrop-blur-sm transition-opacity">
      <Loader2 className="h-12 w-12 animate-spin text-primary-500 mb-4" />
      <h2 className="text-xl font-semibold hero-text animate-pulse">Loading SnapGram AI...</h2>
    </div>
  );
};
