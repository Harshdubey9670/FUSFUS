import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { 
  Sparkles, 
  Plus, 
  Eye, 
  Heart, 
  Send, 
  X, 
  Clock, 
  Archive, 
  Layers, 
  Sliders, 
  Type, 
  Palette, 
  Smile, 
  RotateCw, 
  Crop, 
  Check, 
  ShieldAlert, 
  BarChart2, 
  Flame,
  Wand2,
  Image as ImageIcon
} from "lucide-react";
import api from "../../services/api";
import { useToast } from "../../components/ui/Toast";

export default function StoriesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: authUser } = useSelector(state => state.auth);

  // Stories Feed & Viewing State
  const [storyGroups, setStoryGroups] = useState([]);
  const [activeGroupIndex, setActiveGroupIndex] = useState(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Interactive Story Reply & Viewers Modal
  const [replyText, setReplyText] = useState("");
  const [showViewersModal, setShowViewersModal] = useState(false);
  const [activeTab, setActiveTab] = useState("feed"); // 'feed', 'editor', 'archive'
  
  // Module 7: Camera Editor / Lenses & Filters State
  const [editorFile, setEditorFile] = useState(null);
  const [editorPreview, setEditorPreview] = useState("");
  const [activeFilter, setActiveFilter] = useState("normal");
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blur, setBlur] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [overlayText, setOverlayText] = useState("");
  const [textColor, setTextColor] = useState("#ffffff");
  const [selectedSticker, setSelectedSticker] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // Archive & Highlights State
  const [archivedStories, setArchivedStories] = useState([]);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/stories');
      if (res.data.success) {
        setStoryGroups(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load stories", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchArchive = async () => {
    try {
      const res = await api.get('/api/stories/archive');
      if (res.data.success) {
        setArchivedStories(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load archive", err);
    }
  };

  // Story Navigation
  const handleNextStory = () => {
    const currentGroup = storyGroups[activeGroupIndex];
    if (!currentGroup) return;

    if (activeStoryIndex < currentGroup.stories.length - 1) {
      setActiveStoryIndex(prev => prev + 1);
    } else if (activeGroupIndex < storyGroups.length - 1) {
      setActiveGroupIndex(prev => prev + 1);
      setActiveStoryIndex(0);
    } else {
      setActiveGroupIndex(null);
    }
  };

  const handlePrevStory = () => {
    if (activeStoryIndex > 0) {
      setActiveStoryIndex(prev => prev - 1);
    } else if (activeGroupIndex > 0) {
      setActiveGroupIndex(prev => prev - 1);
      const prevGroup = storyGroups[activeGroupIndex - 1];
      setActiveStoryIndex(prevGroup.stories.length - 1);
    }
  };

  const handleSendStoryReply = async () => {
    if (!replyText.trim() || activeGroupIndex === null) return;
    const currentStory = storyGroups[activeGroupIndex]?.stories[activeStoryIndex];
    if (!currentStory) return;

    try {
      await api.post(`/api/stories/${currentStory._id}/reply`, { message: replyText });
      toast({ variant: 'success', title: 'Reply Sent!', description: `Replied to @${storyGroups[activeGroupIndex].user.username}` });
      setReplyText("");
    } catch (e) {
      toast({ variant: 'error', title: 'Failed to send reply' });
    }
  };

  // Filter Styles Map (Module 7)
  const getFilterCSS = () => {
    let filterString = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px) `;
    switch (activeFilter) {
      case 'vintage': filterString += 'sepia(60%) hue-rotate(-20deg)'; break;
      case 'cyberpunk': filterString += 'hue-rotate(180deg) saturate(200%)'; break;
      case 'mono': filterString += 'grayscale(100%)'; break;
      case 'warm': filterString += 'sepia(30%) brightness(105%)'; break;
      case 'cool': filterString += 'hue-rotate(30deg) saturate(120%)'; break;
      default: break;
    }
    return filterString;
  };

  // Publish Filtered Story
  const handlePublishStory = async () => {
    if (!editorFile && !editorPreview) return;
    setIsPublishing(true);

    try {
      let mediaUrl = editorPreview;
      if (editorFile) {
        const formData = new FormData();
        formData.append('image', editorFile);
        const uploadRes = await api.post('/api/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (uploadRes.data.success) {
          mediaUrl = uploadRes.data.data.url;
        }
      }

      await api.post('/api/stories', {
        media: [{ url: mediaUrl, type: 'image' }],
        stickers: overlayText ? [{ text: overlayText, color: textColor }] : []
      });

      toast({ variant: 'success', title: 'Story Posted!', description: 'Your story is live for 24 hours.' });
      setActiveTab('feed');
      fetchStories();
    } catch (e) {
      toast({ variant: 'error', title: 'Failed to post story' });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base text-text-primary p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-soft pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-primary-500 bg-primary-500/10 p-1.5 rounded-xl animate-pulse" />
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight hero-text">
              Stories & Lenses Studio
            </h1>
          </div>
          <p className="text-text-secondary text-sm mt-1">
            24-hour disappearing stories, AR filter presets, camera editor, story analytics, and archives.
          </p>
        </div>

        {/* Tab Actions */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveTab('feed')}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'feed' ? 'bg-primary-500 text-white shadow-glow' : 'glass text-text-secondary'}`}
          >
            Stories Feed
          </button>
          <button 
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'editor' ? 'bg-primary-500 text-white shadow-glow' : 'glass text-text-secondary'}`}
          >
            <Wand2 className="w-4 h-4" /> Camera Editor
          </button>
          <button 
            onClick={() => { setActiveTab('archive'); fetchArchive(); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'archive' ? 'bg-primary-500 text-white shadow-glow' : 'glass text-text-secondary'}`}
          >
            <Archive className="w-4 h-4" /> Archive
          </button>
        </div>
      </div>

      {/* TAB 1: STORIES FEED */}
      {activeTab === 'feed' && (
        <div className="space-y-6">
          <h2 className="font-bold text-lg text-text-primary flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-500" /> Active 24h Stories
          </h2>

          {loading ? (
            <div className="py-20 text-center text-text-secondary">Loading stories...</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {/* Add Story Card */}
              <div 
                onClick={() => setActiveTab('editor')}
                className="aspect-[9/16] rounded-3xl glass-card border-2 border-dashed border-primary-500/50 flex flex-col items-center justify-center p-4 cursor-pointer hover:scale-105 transition-transform"
              >
                <div className="w-12 h-12 rounded-full hero-gradient flex items-center justify-center text-white mb-2 shadow-glow">
                  <Plus className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-white text-center">Add Story</span>
              </div>

              {/* Story Group Cards */}
              {storyGroups.map((group, idx) => (
                <div 
                  key={idx}
                  onClick={() => { setActiveGroupIndex(idx); setActiveStoryIndex(0); }}
                  className="aspect-[9/16] rounded-3xl overflow-hidden relative glass-card border border-white/10 cursor-pointer group hover:border-primary-500/80 transition-all shadow-lg"
                >
                  <img src={group.stories[0]?.media[0]?.url} alt="Story" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 p-3 flex flex-col justify-between">
                    <div className="flex items-center gap-2">
                      <img src={group.user?.profilePicture || "https://i.pravatar.cc/150"} alt="avatar" className="w-8 h-8 rounded-full border-2 border-primary-500 object-cover" />
                      <span className="text-xs font-bold text-white truncate">@{group.user?.username}</span>
                    </div>
                    <span className="text-[10px] text-white/80 font-bold bg-black/40 px-2 py-1 rounded-full w-fit">
                      {group.stories.length} {group.stories.length === 1 ? 'story' : 'stories'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CAMERA EDITOR & LENSES (MODULE 7) */}
      {activeTab === 'editor' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left / Middle: Live Canvas Preview */}
          <div className="lg:col-span-2 flex flex-col items-center">
            <div className="relative w-full max-w-sm aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl bg-black border border-white/10 flex items-center justify-center">
              {editorPreview ? (
                <img 
                  src={editorPreview} 
                  alt="Editor canvas" 
                  style={{ filter: getFilterCSS(), transform: `rotate(${rotation}deg)` }}
                  className="w-full h-full object-cover transition-all"
                />
              ) : (
                <label className="flex flex-col items-center justify-center cursor-pointer p-6 text-center">
                  <ImageIcon className="w-12 h-12 text-primary-500 mb-2 animate-bounce" />
                  <span className="text-sm font-bold text-white">Select Photo / Video for Story</span>
                  <input 
                    type="file" 
                    accept="image/*,video/*" 
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setEditorFile(e.target.files[0]);
                        setEditorPreview(URL.createObjectURL(e.target.files[0]));
                      }
                    }} 
                  />
                </label>
              )}

              {/* Canvas Overlay Text */}
              {overlayText && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-black/60 backdrop-blur-sm pointer-events-none">
                  <span style={{ color: textColor }} className="text-lg font-black tracking-wide drop-shadow-md">
                    {overlayText}
                  </span>
                </div>
              )}
            </div>

            <button 
              onClick={handlePublishStory}
              disabled={!editorPreview || isPublishing}
              className="mt-6 px-8 py-3 hero-gradient text-white rounded-2xl font-extrabold shadow-glow disabled:opacity-50 flex items-center gap-2"
            >
              {isPublishing ? 'Publishing Story...' : 'Publish to Story'} <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Right: Filter Presets & Adjustment Controls */}
          <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-6">
            <h3 className="font-bold text-lg text-text-primary flex items-center gap-2">
              <Sliders className="w-5 h-5 text-primary-500" /> Filter Presets & Lenses
            </h3>

            {/* Filter Presets Grid */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-secondary">Preset Filter</label>
              <div className="grid grid-cols-4 gap-2">
                {['normal', 'vintage', 'cyberpunk', 'mono', 'warm', 'cool'].map(f => (
                  <button 
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={`py-2 text-xs font-bold capitalize rounded-xl transition-all ${activeFilter === f ? 'bg-primary-500 text-white shadow-glow' : 'glass text-text-secondary'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Fine Adjustments Sliders */}
            <div className="space-y-4 pt-2">
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
            </div>

            {/* Text Overlay Tool */}
            <div className="space-y-2 pt-2 border-t border-border-soft">
              <label className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
                <Type className="w-4 h-4 text-primary-500" /> Text Overlay
              </label>
              <input 
                type="text" 
                placeholder="Type story text overlay..." 
                value={overlayText}
                onChange={(e) => setOverlayText(e.target.value)}
                className="w-full p-3 rounded-xl bg-bg-surface border border-border-soft text-sm text-text-primary"
              />
            </div>
          </div>

        </div>
      )}

      {/* FULL-SCREEN STORY VIEWER MODAL */}
      {activeGroupIndex !== null && storyGroups[activeGroupIndex] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-sm aspect-[9/16] max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl bg-black flex flex-col justify-between">
            
            {/* Top Progress Bars & User Info */}
            <div className="p-4 bg-gradient-to-b from-black/80 to-transparent z-20 space-y-3">
              <div className="flex gap-1">
                {storyGroups[activeGroupIndex].stories.map((_, i) => (
                  <div key={i} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                    <div className={`h-full bg-white transition-all ${i < activeStoryIndex ? 'w-full' : i === activeStoryIndex ? 'w-full animate-pulse' : 'w-0'}`} />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={storyGroups[activeGroupIndex].user?.profilePicture || "https://i.pravatar.cc/150"} alt="avatar" className="w-9 h-9 rounded-full object-cover border border-primary-500" />
                  <span className="text-xs font-bold text-white">@{storyGroups[activeGroupIndex].user?.username}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => setShowViewersModal(true)} className="p-2 rounded-full glass text-white text-xs font-bold flex items-center gap-1">
                    <Eye className="w-4 h-4" /> Viewers
                  </button>
                  <button onClick={() => setActiveGroupIndex(null)} className="p-2 rounded-full glass text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Main Media Feed */}
            <div className="absolute inset-0 flex items-center justify-center">
              <img 
                src={storyGroups[activeGroupIndex].stories[activeStoryIndex]?.media[0]?.url} 
                alt="Story content" 
                className="w-full h-full object-contain" 
              />

              {/* Tap Left / Right Controls */}
              <div onClick={handlePrevStory} className="absolute left-0 top-0 bottom-0 w-1/3 z-10 cursor-pointer" />
              <div onClick={handleNextStory} className="absolute right-0 top-0 bottom-0 w-1/3 z-10 cursor-pointer" />
            </div>

            {/* Bottom Story Reply Bar */}
            <div className="p-4 bg-gradient-to-t from-black/90 to-transparent z-20 flex items-center gap-2">
              <input 
                type="text" 
                placeholder="Send a story reply..." 
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendStoryReply()}
                className="flex-1 py-2 px-4 rounded-full bg-white/10 text-white placeholder-white/60 text-xs border border-white/20 focus:outline-none"
              />
              <button onClick={handleSendStoryReply} className="p-2.5 rounded-full hero-gradient text-white">
                <Send className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
