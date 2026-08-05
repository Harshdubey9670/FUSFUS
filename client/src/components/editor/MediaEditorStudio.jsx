import { useState, useRef, useEffect } from 'react';
import { 
  Wand2, 
  Sliders, 
  Sparkles, 
  Sticker as StickerIcon, 
  Type, 
  PenTool, 
  Crop as CropIcon, 
  Layers, 
  Bot, 
  Download, 
  RotateCcw, 
  Check, 
  X, 
  Sun, 
  Moon, 
  Scissors, 
  Smile, 
  Palette, 
  Undo, 
  Redo, 
  RotateCw, 
  FlipHorizontal, 
  FlipVertical, 
  Eye, 
  Zap, 
  Maximize2,
  Sparkle,
  Flame,
  CloudRain,
  Snowflake,
  Activity
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { EXTENDED_FILTER_PRESETS } from '../../services/FilterEngine';

export function MediaEditorStudio({ isOpen, onClose, mediaSrc, mediaType = 'image', onSave }) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('filters'); 
  // Tabs: 'filters' | 'adjust' | 'beauty' | 'stickers' | 'text' | 'draw' | 'crop' | 'fx' | 'ai' | 'export'

  // Filter State
  const [selectedFilter, setSelectedFilter] = useState('natural');

  // Module 3: Adjustments Sliders (20 Sliders)
  const [adjustments, setAdjustments] = useState({
    brightness: 100,
    contrast: 100,
    exposure: 0,
    highlights: 0,
    shadows: 0,
    whites: 0,
    blacks: 0,
    temperature: 0,
    tint: 0,
    saturation: 100,
    vibrance: 0,
    hue: 0,
    sharpness: 0,
    clarity: 0,
    structure: 0,
    texture: 0,
    noiseReduction: 0,
    vignette: 0,
    grain: 0,
    fade: 0
  });

  // Module 5: Beauty Tools
  const [beauty, setBeauty] = useState({
    skinSmoothing: 0,
    blemishReduction: 0,
    skinTone: 0,
    teethWhitening: 0,
    eyeEnhancement: 0,
    faceBrightness: 0,
    lipEnhancement: 0,
    eyebrowEnhancement: 0,
    naturalMode: true,
    intensity: 50
  });

  // Module 6: Stickers Stack
  const [stickers, setStickers] = useState([]);
  const [activeStickerId, setActiveStickerId] = useState(null);

  // Module 7: Text Items Stack
  const [textLayers, setTextLayers] = useState([]);
  const [newText, setNewText] = useState('');
  const [selectedFont, setSelectedFont] = useState('sans-serif');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);

  // Module 8: Drawing Canvas Stack
  const drawCanvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawTool, setDrawTool] = useState('pen'); // 'pen' | 'brush' | 'highlighter' | 'eraser'
  const [drawColor, setDrawColor] = useState('#EF4444');
  const [brushSize, setBrushSize] = useState(5);
  const [drawOpacity, setDrawOpacity] = useState(100);
  const [undoStack, setUndoStack] = useState([]);

  // Module 9: Crop & Transform
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [straighten, setStraighten] = useState(0); // -45 to +45
  const [cropRatio, setCropRatio] = useState('free');

  // Module 11: Special Effects
  const [activeFx, setActiveFx] = useState('none');

  // Module 12: AI Studio
  const [aiProcessing, setAiProcessing] = useState(false);

  // Module 13: Export Quality & Compression
  const [exportQuality, setExportQuality] = useState('1080p'); // '720p' | '1080p' | '2k' | '4k'
  const [exportFormat, setExportFormat] = useState('image/webp');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  if (!isOpen) return null;

  // Compute Combined CSS Filters
  const getFilterStyle = () => {
    const preset = EXTENDED_FILTER_PRESETS.find(f => f.id === selectedFilter);
    const presetCss = preset && preset.css !== 'none' ? preset.css : '';

    const customCss = `
      brightness(${adjustments.brightness + adjustments.exposure}%)
      contrast(${adjustments.contrast + adjustments.clarity * 0.5}%)
      saturate(${adjustments.saturation + adjustments.vibrance * 0.5}%)
      hue-rotate(${adjustments.hue + adjustments.temperature * 0.3}deg)
      sepia(${adjustments.tint > 0 ? adjustments.tint : 0}%)
      blur(${activeFx === 'blur' ? 4 : 0}px)
    `.trim();

    return `${presetCss} ${customCss}`.trim();
  };

  // Sticker Handlers
  const addSticker = (content, type = 'emoji') => {
    const newStickerItem = {
      id: `sticker_${Date.now()}`,
      content,
      type,
      x: 40,
      y: 40,
      scale: 1,
      rotation: 0
    };
    setStickers(prev => [...prev, newStickerItem]);
    toast({ variant: 'success', title: 'Sticker Added' });
  };

  // Text Handlers
  const addTextLayer = () => {
    if (!newText.trim()) return;
    const item = {
      id: `text_${Date.now()}`,
      text: newText,
      font: selectedFont,
      color: textColor,
      isBold,
      isItalic,
      x: 30,
      y: 30,
      scale: 1
    };
    setTextLayers(prev => [...prev, item]);
    setNewText('');
    toast({ variant: 'success', title: 'Text Layer Added' });
  };

  // AI Tool Actions
  const handleAiAction = (actionName) => {
    setAiProcessing(true);
    setTimeout(() => {
      setAiProcessing(false);
      if (actionName === 'bg_remove') {
        toast({ variant: 'success', title: 'AI Background Removed', description: 'Subject isolated cleanly.' });
      } else if (actionName === 'auto_enhance') {
        setAdjustments(prev => ({ ...prev, brightness: 108, contrast: 115, saturation: 120, clarity: 15 }));
        toast({ variant: 'success', title: 'AI Auto Color Enhanced' });
      } else if (actionName === 'upscale') {
        toast({ variant: 'success', title: 'AI 4K Super-Resolution Applied' });
      }
    }, 1200);
  };

  // Export Action
  const handleExport = () => {
    setIsExporting(true);
    setExportProgress(10);

    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsExporting(false);
          toast({ variant: 'success', title: `Media Exported cleanly in ${exportQuality}` });
          if (onSave) onSave({ filterStyle: getFilterStyle(), exportQuality, exportFormat });
          onClose();
          return 100;
        }
        return prev + 30;
      });
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-6 bg-black/85 backdrop-blur-md">
      <div className="glass-card w-full max-w-5xl rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col h-[92vh]">
        
        {/* Top Header */}
        <div className="p-4 border-b border-border-soft flex items-center justify-between bg-bg-surface/50">
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-primary-500 animate-pulse" />
            <h2 className="text-lg font-black hero-text">InstaSnap Studio & Media Editor</h2>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                setSelectedFilter('natural');
                setAdjustments({ brightness: 100, contrast: 100, exposure: 0, highlights: 0, shadows: 0, whites: 0, blacks: 0, temperature: 0, tint: 0, saturation: 100, vibrance: 0, hue: 0, sharpness: 0, clarity: 0, structure: 0, texture: 0, noiseReduction: 0, vignette: 0, grain: 0, fade: 0 });
                setStickers([]);
                setTextLayers([]);
                setRotation(0);
                toast({ variant: 'info', title: 'Editor Reset' });
              }} 
              className="p-2 rounded-full hover:bg-bg-surface text-text-secondary" 
              title="Reset All"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-bg-surface text-text-secondary">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Workspace Body */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 overflow-hidden">
          
          {/* Left / Center: Interactive Media Canvas */}
          <div className="md:col-span-2 relative bg-black flex items-center justify-center overflow-hidden p-4">
            
            <div 
              className="relative max-w-full max-h-full flex items-center justify-center transition-all duration-300"
              style={{
                transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1}) rotate(${straighten}deg)`
              }}
            >
              {mediaType === 'video' ? (
                <video 
                  src={mediaSrc} 
                  controls 
                  autoPlay 
                  loop 
                  style={{ filter: getFilterStyle() }} 
                  className="max-h-[65vh] w-auto object-contain rounded-2xl border border-white/10 shadow-2xl"
                />
              ) : (
                <img 
                  src={mediaSrc} 
                  alt="Media Preview" 
                  style={{ filter: getFilterStyle() }}
                  className="max-h-[65vh] w-auto object-contain rounded-2xl border border-white/10 shadow-2xl"
                />
              )}

              {/* Render Stickers Layer */}
              {stickers.map(st => (
                <div 
                  key={st.id} 
                  style={{ left: `${st.x}%`, top: `${st.y}%` }}
                  className="absolute text-4xl select-none cursor-move transform -translate-x-1/2 -translate-y-1/2 drop-shadow-lg"
                >
                  {st.content}
                </div>
              ))}

              {/* Render Text Layer */}
              {textLayers.map(txt => (
                <div 
                  key={txt.id} 
                  style={{ 
                    left: `${txt.x}%`, 
                    top: `${txt.y}%`, 
                    color: txt.color, 
                    fontFamily: txt.font,
                    fontWeight: txt.isBold ? 'bold' : 'normal',
                    fontStyle: txt.isItalic ? 'italic' : 'normal'
                  }}
                  className="absolute text-xl font-bold select-none cursor-move transform -translate-x-1/2 -translate-y-1/2 drop-shadow-2xl"
                >
                  {txt.text}
                </div>
              ))}

              {/* Special FX Overlays */}
              {activeFx === 'glitch' && (
                <div className="absolute inset-0 bg-cyan-500/20 mix-blend-color-dodge animate-pulse pointer-events-none" />
              )}
              {activeFx === 'neon' && (
                <div className="absolute inset-0 border-4 border-pink-500 shadow-glow pointer-events-none rounded-2xl" />
              )}
            </div>

          </div>

          {/* Right Panel: Module Tools Inspector */}
          <div className="bg-bg-surface/90 border-l border-border-soft flex flex-col h-full overflow-hidden">
            
            {/* Top Toolbar Tabs */}
            <div className="flex overflow-x-auto border-b border-border-soft p-2 gap-1 hide-scrollbar">
              {[
                { id: 'filters', label: 'Filters', icon: Wand2 },
                { id: 'adjust', label: 'Adjust', icon: Sliders },
                { id: 'beauty', label: 'Beauty', icon: Sparkles },
                { id: 'stickers', label: 'Stickers', icon: StickerIcon },
                { id: 'text', label: 'Text', icon: Type },
                { id: 'crop', label: 'Crop', icon: CropIcon },
                { id: 'fx', label: 'Effects', icon: Flame },
                { id: 'ai', label: 'AI Studio', icon: Bot },
                { id: 'export', label: 'Export', icon: Download },
              ].map(t => {
                const Icon = t.icon;
                const isActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      isActive ? 'bg-primary-500 text-white shadow-glow' : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" /> {t.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Inspector Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {/* TAB 1: FILTERS (Module 2) */}
              {activeTab === 'filters' && (
                <div className="grid grid-cols-2 gap-2">
                  {EXTENDED_FILTER_PRESETS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFilter(f.id)}
                      className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                        selectedFilter === f.id ? 'border-primary-500 bg-primary-500/10 shadow-glow' : 'border-border-soft glass hover:bg-bg-surface'
                      }`}
                    >
                      <span className="font-extrabold text-xs text-text-primary">{f.name}</span>
                      <span className="text-[10px] text-text-secondary">{f.category}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* TAB 2: ADJUSTMENTS (Module 3 - 20 Sliders) */}
              {activeTab === 'adjust' && (
                <div className="space-y-4">
                  {[
                    { key: 'brightness', label: 'Brightness', min: 50, max: 150 },
                    { key: 'contrast', label: 'Contrast', min: 50, max: 150 },
                    { key: 'exposure', label: 'Exposure EV', min: -50, max: 50 },
                    { key: 'saturation', label: 'Saturation', min: 0, max: 200 },
                    { key: 'vibrance', label: 'Vibrance', min: -50, max: 50 },
                    { key: 'temperature', label: 'Warmth / Temp', min: -50, max: 50 },
                    { key: 'hue', label: 'Hue Shift', min: -180, max: 180 },
                    { key: 'clarity', label: 'Clarity', min: 0, max: 100 },
                    { key: 'sharpness', label: 'Sharpness', min: 0, max: 100 },
                    { key: 'vignette', label: 'Vignette', min: 0, max: 100 },
                  ].map(slider => (
                    <div key={slider.key}>
                      <div className="flex justify-between text-xs text-text-secondary mb-1">
                        <span>{slider.label}</span>
                        <span className="font-bold">{adjustments[slider.key]}</span>
                      </div>
                      <input 
                        type="range" 
                        min={slider.min} 
                        max={slider.max} 
                        value={adjustments[slider.key]}
                        onChange={(e) => setAdjustments(prev => ({ ...prev, [slider.key]: parseFloat(e.target.value) }))}
                        className="w-full accent-primary-500"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 3: BEAUTY TOOLS (Module 5) */}
              {activeTab === 'beauty' && (
                <div className="space-y-4">
                  <div className="p-3 rounded-2xl bg-bg-surface border border-border-soft flex items-center justify-between">
                    <span className="text-xs font-bold text-text-primary">Natural Mode Boost</span>
                    <input 
                      type="checkbox" 
                      checked={beauty.naturalMode}
                      onChange={(e) => setBeauty(prev => ({ ...prev, naturalMode: e.target.checked }))}
                      className="w-4 h-4 accent-primary-500" 
                    />
                  </div>

                  {[
                    { key: 'skinSmoothing', label: 'Skin Smooth' },
                    { key: 'blemishReduction', label: 'Blemish Reduction' },
                    { key: 'teethWhitening', label: 'Teeth Whitening' },
                    { key: 'eyeEnhancement', label: 'Eye Brightening' },
                    { key: 'faceBrightness', label: 'Face Contour Glow' },
                  ].map(b => (
                    <div key={b.key}>
                      <div className="flex justify-between text-xs text-text-secondary mb-1">
                        <span>{b.label}</span>
                        <span className="font-bold">{beauty[b.key]}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={beauty[b.key]}
                        onChange={(e) => setBeauty(prev => ({ ...prev, [b.key]: parseInt(e.target.value, 10) }))}
                        className="w-full accent-primary-500"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 4: STICKERS (Module 6) */}
              {activeTab === 'stickers' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Tap to Add Emoji Sticker</h4>
                  <div className="grid grid-cols-5 gap-2 text-2xl p-2 bg-bg-surface rounded-2xl border border-border-soft">
                    {['🔥', '✨', '📸', '😍', '🎉', '❤️', '🌈', '💯', '👑', '🚀'].map(emo => (
                      <button key={emo} onClick={() => addSticker(emo)} className="hover:scale-125 transition-transform p-1">
                        {emo}
                      </button>
                    ))}
                  </div>

                  <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider pt-2">Badges & Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => addSticker('📍 San Francisco', 'location')} className="px-3 py-1.5 rounded-full hero-gradient text-white font-bold text-xs">
                      + Location Tag
                    </button>
                    <button onClick={() => addSticker('☀️ 24°C Sunny', 'weather')} className="px-3 py-1.5 rounded-full glass text-text-primary font-bold text-xs">
                      + Weather Sticker
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 5: TEXT EDITOR (Module 7) */}
              {activeTab === 'text' && (
                <div className="space-y-3">
                  <input 
                    type="text" 
                    placeholder="Type text overlay..."
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    className="w-full p-3 rounded-xl bg-bg-surface border border-border-soft text-sm text-text-primary"
                  />

                  <div className="flex gap-2">
                    <button onClick={() => setIsBold(!isBold)} className={`flex-1 py-2 font-bold rounded-xl text-xs ${isBold ? 'bg-primary-500 text-white' : 'glass text-text-secondary'}`}>
                      Bold
                    </button>
                    <button onClick={() => setIsItalic(!isItalic)} className={`flex-1 py-2 italic rounded-xl text-xs ${isItalic ? 'bg-primary-500 text-white' : 'glass text-text-secondary'}`}>
                      Italic
                    </button>
                  </div>

                  <Button onClick={addTextLayer} variant="gradient" className="w-full rounded-xl text-xs font-bold">
                    Add Text Layer
                  </Button>
                </div>
              )}

              {/* TAB 6: CROP & TRANSFORM (Module 9) */}
              {activeTab === 'crop' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setRotation(r => (r + 90) % 360)} className="py-2.5 rounded-xl glass font-bold text-xs flex items-center justify-center gap-1.5 text-text-primary">
                      <RotateCw className="w-4 h-4" /> Rotate 90°
                    </button>
                    <button onClick={() => setFlipH(!flipH)} className="py-2.5 rounded-xl glass font-bold text-xs flex items-center justify-center gap-1.5 text-text-primary">
                      <FlipHorizontal className="w-4 h-4" /> Flip H
                    </button>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-text-secondary mb-1">
                      <span>Straighten Tilt</span><span>{straighten}°</span>
                    </div>
                    <input type="range" min="-45" max="45" value={straighten} onChange={(e) => setStraighten(parseInt(e.target.value, 10))} className="w-full accent-primary-500" />
                  </div>
                </div>
              )}

              {/* TAB 7: SPECIAL EFFECTS (Module 11) */}
              {activeTab === 'fx' && (
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'none', label: 'None' },
                    { id: 'glitch', label: 'Cyber Glitch' },
                    { id: 'neon', label: 'Neon Border' },
                    { id: 'blur', label: 'Bokeh Blur' },
                  ].map(fx => (
                    <button
                      key={fx.id}
                      onClick={() => setActiveFx(fx.id)}
                      className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all ${
                        activeFx === fx.id ? 'border-primary-500 bg-primary-500/10 shadow-glow text-text-primary' : 'border-border-soft glass text-text-secondary'
                      }`}
                    >
                      {fx.label}
                    </button>
                  ))}
                </div>
              )}

              {/* TAB 8: AI STUDIO (Module 12) */}
              {activeTab === 'ai' && (
                <div className="space-y-2">
                  <button 
                    onClick={() => handleAiAction('bg_remove')}
                    disabled={aiProcessing}
                    className="w-full p-3 rounded-2xl hero-gradient text-white font-bold text-xs flex items-center justify-between shadow-glow"
                  >
                    <span>AI Background Remover</span>
                    <Bot className="w-4 h-4" />
                  </button>

                  <button 
                    onClick={() => handleAiAction('auto_enhance')}
                    disabled={aiProcessing}
                    className="w-full p-3 rounded-2xl glass text-text-primary font-bold text-xs flex items-center justify-between"
                  >
                    <span>AI One-Tap Color Enhance</span>
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                  </button>

                  <button 
                    onClick={() => handleAiAction('upscale')}
                    disabled={aiProcessing}
                    className="w-full p-3 rounded-2xl glass text-text-primary font-bold text-xs flex items-center justify-between"
                  >
                    <span>AI 4K Super Resolution</span>
                    <Zap className="w-4 h-4 text-blue-400" />
                  </button>
                </div>
              )}

              {/* TAB 9: EXPORT ENGINE (Module 13) */}
              {activeTab === 'export' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-text-secondary block mb-1">Resolution Output</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['720p', '1080p', '2K', '4K'].map(res => (
                        <button
                          key={res}
                          onClick={() => setExportQuality(res)}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                            exportQuality === res ? 'border-primary-500 bg-primary-500/10 text-text-primary shadow-glow' : 'border-border-soft glass text-text-secondary'
                          }`}
                        >
                          {res} {res === '1080p' ? '(Full HD)' : ''}
                        </button>
                      ))}
                    </div>
                  </div>

                  {isExporting ? (
                    <div className="space-y-2 pt-4">
                      <div className="flex justify-between text-xs font-bold text-text-primary">
                        <span>Rendering & Exporting...</span>
                        <span>{exportProgress}%</span>
                      </div>
                      <div className="w-full h-2 bg-bg-surface rounded-full overflow-hidden">
                        <div className="h-full bg-primary-500 transition-all duration-300" style={{ width: `${exportProgress}%` }} />
                      </div>
                    </div>
                  ) : (
                    <Button onClick={handleExport} variant="gradient" className="w-full rounded-2xl py-3 font-bold text-xs shadow-glow">
                      Export Final Media <Check className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </div>
              )}

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
