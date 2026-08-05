import { useState } from 'react';
import { Sparkles, Sliders, Check, RotateCcw, X, Wand2 } from 'lucide-react';
import { Button } from './Button';

// Complete Instagram & Snapchat Preset Filters List
export const FILTER_PRESETS = [
  { id: 'normal', name: 'Normal', css: 'none' },
  { id: 'clarendon', name: 'Clarendon', css: 'contrast(120%) brightness(125%) saturate(135%)' },
  { id: 'gingham', name: 'Gingham', css: 'hue-rotate(-10deg) brightness(105%) contrast(90%)' },
  { id: 'moon', name: 'Moon B&W', css: 'grayscale(100%) contrast(140%) brightness(110%)' },
  { id: 'lark', name: 'Lark', css: 'saturate(140%) contrast(110%) brightness(110%)' },
  { id: 'reyes', name: 'Reyes', css: 'sepia(35%) brightness(110%) contrast(85%)' },
  { id: 'juno', name: 'Juno', css: 'contrast(115%) saturate(150%) hue-rotate(-10deg)' },
  { id: 'slumber', name: 'Slumber', css: 'saturate(66%) sepia(35%) contrast(85%)' },
  { id: 'cyberpunk', name: 'Cyberpunk', css: 'hue-rotate(180deg) saturate(220%) contrast(130%)' },
  { id: 'golden', name: 'Golden Hour', css: 'sepia(50%) contrast(110%) saturate(160%)' },
  { id: 'noir', name: 'Noir', css: 'grayscale(100%) contrast(180%)' },
  { id: 'vivid', name: 'Vivid Pop', css: 'saturate(200%) contrast(115%)' },
  { id: 'vintage', name: 'Retro Vintage', css: 'sepia(60%) hue-rotate(-20deg) contrast(110%)' },
];

export function ImageFilterModal({ isOpen, onClose, imageSrc, onApplyFilter }) {
  const [selectedPreset, setSelectedPreset] = useState('normal');
  const [activeTab, setActiveTab] = useState('presets'); // 'presets' | 'custom'

  // Custom Adjustment Sliders
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [sepia, setSepia] = useState(0);
  const [hue, setHue] = useState(0);
  const [blur, setBlur] = useState(0);

  if (!isOpen) return null;

  const getComputedFilterCSS = () => {
    if (activeTab === 'presets') {
      const preset = FILTER_PRESETS.find(p => p.id === selectedPreset);
      return preset ? preset.css : 'none';
    }
    return `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) sepia(${sepia}%) hue-rotate(${hue}deg) blur(${blur}px)`;
  };

  const handleReset = () => {
    setSelectedPreset('normal');
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setSepia(0);
    setHue(0);
    setBlur(0);
  };

  const handleApply = () => {
    onApplyFilter({
      filterStyle: getComputedFilterCSS(),
      presetName: selectedPreset,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass-card w-full max-w-2xl rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-border-soft flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-primary-500 animate-pulse" />
            <h3 className="font-extrabold text-lg text-text-primary hero-text">
              Instagram & Snapchat Photo Filters
            </h3>
          </div>
          
          <button onClick={onClose} className="p-2 rounded-full hover:bg-bg-surface text-text-secondary">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          
          {/* Left: Image Canvas Preview */}
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-white/10 shadow-inner">
            <img 
              src={imageSrc} 
              alt="Filter Preview"
              style={{ filter: getComputedFilterCSS() }}
              className="w-full h-full object-cover transition-all duration-300"
            />
          </div>

          {/* Right: Presets & Custom Tuning Tabs */}
          <div className="flex flex-col h-full space-y-4">
            
            {/* Tab Switcher */}
            <div className="flex bg-bg-surface p-1 rounded-xl border border-border-soft">
              <button 
                onClick={() => setActiveTab('presets')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'presets' ? 'bg-primary-500 text-white shadow-glow' : 'text-text-secondary'}`}
              >
                Presets ({FILTER_PRESETS.length})
              </button>
              <button 
                onClick={() => setActiveTab('custom')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'custom' ? 'bg-primary-500 text-white shadow-glow' : 'text-text-secondary'}`}
              >
                Custom Tuning
              </button>
            </div>

            {/* TAB 1: PRESETS GRID */}
            {activeTab === 'presets' ? (
              <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-1">
                {FILTER_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setSelectedPreset(preset.id)}
                    className={`flex flex-col items-center p-2 rounded-xl border text-center transition-all ${selectedPreset === preset.id ? 'border-primary-500 bg-primary-500/10 shadow-glow' : 'border-border-soft glass hover:bg-bg-surface'}`}
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-black mb-1">
                      <img src={imageSrc} alt={preset.name} style={{ filter: preset.css }} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[10px] font-bold text-text-primary truncate w-full">{preset.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              /* TAB 2: CUSTOM ADJUSTMENT SLIDERS */
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                <div>
                  <div className="flex justify-between text-xs text-text-secondary mb-1">
                    <span>Brightness</span><span>{brightness}%</span>
                  </div>
                  <input type="range" min="50" max="150" value={brightness} onChange={(e) => setBrightness(e.target.value)} className="w-full accent-primary-500" />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-text-secondary mb-1">
                    <span>Contrast</span><span>{contrast}%</span>
                  </div>
                  <input type="range" min="50" max="150" value={contrast} onChange={(e) => setContrast(e.target.value)} className="w-full accent-primary-500" />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-text-secondary mb-1">
                    <span>Saturation</span><span>{saturation}%</span>
                  </div>
                  <input type="range" min="0" max="200" value={saturation} onChange={(e) => setSaturation(e.target.value)} className="w-full accent-primary-500" />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-text-secondary mb-1">
                    <span>Sepia Warmth</span><span>{sepia}%</span>
                  </div>
                  <input type="range" min="0" max="100" value={sepia} onChange={(e) => setSepia(e.target.value)} className="w-full accent-primary-500" />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-text-secondary mb-1">
                    <span>Hue Rotate</span><span>{hue}°</span>
                  </div>
                  <input type="range" min="-180" max="180" value={hue} onChange={(e) => setHue(e.target.value)} className="w-full accent-primary-500" />
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex gap-2 pt-2 border-t border-border-soft">
              <button onClick={handleReset} className="p-2.5 rounded-xl glass text-text-secondary hover:text-text-primary">
                <RotateCcw className="w-4 h-4" />
              </button>
              <Button onClick={handleApply} variant="gradient" className="flex-1 rounded-xl font-bold text-xs">
                Apply Filter <Check className="w-4 h-4 ml-1" />
              </Button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
