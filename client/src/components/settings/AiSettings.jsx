import { useSelector, useDispatch } from "react-redux";
import { updateSettings, optimisticUpdateSetting } from "../../store/authSlice";
import { useToast } from "../ui/Toast";
import { SettingToggle } from "./SettingToggle";
import { Sparkles, Bot, BrainCircuit } from "lucide-react";

const AiSettings = () => {
  const { settings } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const { toast } = useToast();

  const handleUpdate = async (category, key, value) => {
    const updates = { [category]: { [key]: value } };
    dispatch(optimisticUpdateSetting(updates));
    
    try {
      await dispatch(updateSettings(updates)).unwrap();
    } catch (error) {
      toast({ variant: "error", title: "Error", description: "Failed to update AI setting" });
    }
  };

  const aiEnabled = settings?.ai?.enableAiFeatures ?? true;

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h2 className="text-2xl font-bold hero-text mb-2 flex items-center gap-2">
          <Sparkles className="text-primary-500 w-6 h-6" /> AI Features
        </h2>
        <p className="text-text-secondary">Supercharge your experience with NovaVerse artificial intelligence.</p>
      </div>

      <div className="bg-bg-surface border border-primary-500/20 rounded-2xl p-4 sm:p-6 shadow-sm shadow-primary-500/5 space-y-4">
        
        <div className="flex items-start gap-4 p-4 rounded-xl bg-primary-500/10 border border-primary-500/20 mb-6">
          <div className="p-2 bg-primary-500 rounded-lg text-white">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-text-primary">Global AI Toggle</h3>
            <p className="text-sm text-text-secondary mb-3">Turn all generative AI features on or off at once.</p>
            <SettingToggle 
              label="Enable AI Features" 
              checked={aiEnabled}
              onChange={(val) => handleUpdate('ai', 'enableAiFeatures', val)}
            />
          </div>
        </div>
        
        <div className={`transition-opacity duration-300 space-y-2 ${!aiEnabled ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          <h3 className="text-lg font-bold text-text-primary border-b border-border-soft pb-2 mb-4 flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-secondary-500" /> Capabilities
          </h3>
          
          <SettingToggle 
            label="AI Caption Generator" 
            description="Get smart caption suggestions based on your image analysis."
            checked={settings?.ai?.aiCaptionGenerator ?? true}
            onChange={(val) => handleUpdate('ai', 'aiCaptionGenerator', val)}
          />
          
          <SettingToggle 
            label="Smart Recommendations" 
            description="Use AI to analyze your behavior and suggest better content."
            checked={settings?.ai?.aiRecommendations ?? true}
            onChange={(val) => handleUpdate('ai', 'aiRecommendations', val)}
          />

          <SettingToggle 
            label="AI Memories & Highlights" 
            description="Automatically generate yearly highlight videos and memory recaps."
            checked={settings?.ai?.aiMemories ?? true}
            onChange={(val) => handleUpdate('ai', 'aiMemories', val)}
          />
        </div>
      </div>
    </div>
  );
};

export default AiSettings;
