import { Info, FileText, ShieldAlert, Code } from "lucide-react";

const AboutSettings = () => {
  return (
    <div className="space-y-8 pb-10">
      <div>
        <h2 className="text-2xl font-bold hero-text mb-2">About</h2>
        <p className="text-text-secondary">Learn more about InstaSnap AI.</p>
      </div>

      <div className="flex flex-col items-center justify-center py-6 bg-bg-surface border border-border-soft rounded-2xl shadow-sm">
        <div className="w-20 h-20 rounded-2xl hero-gradient flex items-center justify-center shadow-lg shadow-primary-500/20 mb-4">
          <Code className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-xl font-bold text-text-primary">InstaSnap AI</h3>
        <p className="text-text-secondary text-sm mt-1">Version 1.0.0 (Build 42)</p>
        <p className="text-xs text-text-tertiary mt-2 text-center max-w-xs">
          Built with React, Redux, Node.js, and MongoDB.
        </p>
      </div>

      <div className="bg-bg-surface border border-border-soft rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-text-primary border-b border-border-soft pb-2 mb-4">Legal</h3>
        
        <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-bg-surface-hover transition-colors text-left group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-bg-base text-text-secondary">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-text-primary">Terms of Service</p>
            </div>
          </div>
        </button>

        <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-bg-surface-hover transition-colors text-left group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-bg-base text-text-secondary">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-text-primary">Privacy Policy</p>
            </div>
          </div>
        </button>

        <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-bg-surface-hover transition-colors text-left group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-bg-base text-text-secondary">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-text-primary">Open Source Libraries</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default AboutSettings;
