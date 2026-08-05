export const FeedSkeleton = () => {
  return (
    <div className="space-y-6">
      {[1, 2].map((i) => (
        <div key={i} className="glass-card rounded-2xl sm:rounded-3xl overflow-hidden border border-border-soft animate-pulse">
          {/* Header */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-bg-surface-hover" />
              <div className="space-y-2">
                <div className="h-4 w-24 bg-bg-surface-hover rounded" />
                <div className="h-3 w-16 bg-bg-surface-hover rounded" />
              </div>
            </div>
            <div className="w-6 h-6 bg-bg-surface-hover rounded-full" />
          </div>
          
          {/* Image */}
          <div className="w-full aspect-square bg-bg-surface-hover" />
          
          {/* Actions */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-4">
                <div className="w-6 h-6 bg-bg-surface-hover rounded" />
                <div className="w-6 h-6 bg-bg-surface-hover rounded" />
                <div className="w-6 h-6 bg-bg-surface-hover rounded" />
              </div>
              <div className="w-6 h-6 bg-bg-surface-hover rounded" />
            </div>
            <div className="h-4 w-1/4 bg-bg-surface-hover rounded mb-2" />
            <div className="h-3 w-3/4 bg-bg-surface-hover rounded mb-1" />
            <div className="h-3 w-1/2 bg-bg-surface-hover rounded" />
          </div>
        </div>
      ))}
    </div>
  );
};
