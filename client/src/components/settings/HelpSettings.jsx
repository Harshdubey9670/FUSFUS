import { HelpCircle, ExternalLink, Flag, MessageSquare } from "lucide-react";

const HelpSettings = () => {
  return (
    <div className="space-y-8 pb-10">
      <div>
        <h2 className="text-2xl font-bold hero-text mb-2">Help & Support</h2>
        <p className="text-text-secondary">Get assistance or find answers to your questions.</p>
      </div>

      <div className="bg-bg-surface border border-border-soft rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-text-primary border-b border-border-soft pb-2 mb-4">Support Center</h3>
        
        <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-bg-surface-hover transition-colors text-left group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-500/10 text-primary-500 group-hover:bg-primary-500 group-hover:text-white transition-colors">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-text-primary">Help Center</p>
              <p className="text-sm text-text-secondary">Find articles and answers</p>
            </div>
          </div>
          <ExternalLink className="w-5 h-5 text-text-secondary" />
        </button>

        <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-bg-surface-hover transition-colors text-left group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-text-primary">Support Inbox</p>
              <p className="text-sm text-text-secondary">Check replies from our team</p>
            </div>
          </div>
          <ExternalLink className="w-5 h-5 text-text-secondary" />
        </button>
      </div>

      <div className="bg-bg-surface border border-border-soft rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-text-primary border-b border-border-soft pb-2 mb-4">Feedback</h3>
        
        <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-bg-surface-hover transition-colors text-left group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
              <Flag className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-text-primary">Report a Problem</p>
              <p className="text-sm text-text-secondary">Let us know if something is broken</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default HelpSettings;
