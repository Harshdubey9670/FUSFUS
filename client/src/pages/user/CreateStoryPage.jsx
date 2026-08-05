import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  UploadCloud, 
  Image as ImageIcon, 
  Video, 
  X, 
  ArrowLeft, 
  Sparkles, 
  Music2, 
  Smile, 
  HelpCircle, 
  Vote, 
  Clock, 
  Link as LinkIcon, 
  AtSign, 
  MapPin, 
  Wand2, 
  Calendar, 
  Archive, 
  Send 
} from "lucide-react";
import api from "../../services/api";
import { useToast } from "../../components/ui/Toast";

export default function CreateStoryPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  // Media state
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [mediaType, setMediaType] = useState("image");
  const [isUploading, setIsUploading] = useState(false);

  // Sticker & Music State
  const [activeStickers, setActiveStickers] = useState([]);
  const [showStickerDrawer, setShowStickerDrawer] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState(null);

  // AI Story Generator Modal
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [generatingAi, setGeneratingAi] = useState(false);

  // Publishing & Scheduling State
  const [publishStatus, setPublishStatus] = useState("published"); // published, scheduled
  const [scheduledAt, setScheduledAt] = useState("");
  const [isArchived, setIsArchived] = useState(true);

  // Handle File Selection
  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/") && !selectedFile.type.startsWith("video/")) {
      toast.error("Please select an image or video.");
      return;
    }

    setFile(selectedFile);
    setMediaType(selectedFile.type.startsWith("video/") ? "video" : "image");

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(selectedFile);
  };

  // Add Sticker to Canvas
  const handleAddSticker = (type) => {
    let stickerData = {};
    if (type === 'poll') stickerData = { question: 'Vote below!', optionA: 'Yes 🔥', optionB: 'No ❄️' };
    if (type === 'question') stickerData = { prompt: 'Ask me a question...' };
    if (type === 'quiz') stickerData = { question: 'Best framework?', options: ['React', 'Vue', 'Next.js'] };
    if (type === 'countdown') stickerData = { title: 'Big Announcement!', targetDate: '2026-12-31' };
    if (type === 'link') stickerData = { url: 'https://snapgram.ai', label: 'Visit Website' };
    if (type === 'mention') stickerData = { handle: '@snapgram_official' };
    if (type === 'location') stickerData = { location: 'San Francisco, CA' };
    if (type === 'gif') stickerData = { url: 'https://media.giphy.com/media/3o7TKsjRrfIPjeiVyM/giphy.gif' };

    setActiveStickers([...activeStickers, { id: Date.now(), type, data: stickerData, position: { x: 50, y: 50 } }]);
    setShowStickerDrawer(false);
  };

  // Generate AI Story
  const handleGenerateAiStory = async (e) => {
    e.preventDefault();
    if (!aiPrompt) return;
    setGeneratingAi(true);

    try {
      const res = await api.post("/api/stories/ai-generate", { prompt: aiPrompt });
      setPreview(res.data.data.mediaUrl);
      setMediaType("image");
      setShowAiModal(false);
      setAiPrompt("");
      toast.success("AI Story Background Generated!");
    } catch (err) {
      toast.error("Failed to generate AI story.");
    } finally {
      setGeneratingAi(false);
    }
  };

  // Submit Story
  const handleShareStory = async () => {
    if (!preview && !file) {
      toast.error("Please add media or an AI background to share.");
      return;
    }

    setIsUploading(true);
    try {
      let finalMediaUrl = preview;

      // If physical file selected, upload to backend
      if (file) {
        const formData = new FormData();
        formData.append("image", file);
        const uploadRes = await api.post("/api/upload", formData);
        finalMediaUrl = uploadRes.data.url;
      }

      const payload = {
        media: [{ url: finalMediaUrl, type: mediaType }],
        stickers: activeStickers,
        music: selectedMusic || {},
        status: publishStatus,
        scheduledAt: publishStatus === "scheduled" ? scheduledAt : undefined,
        isArchived
      };

      await api.post("/api/stories", payload);
      toast.success(publishStatus === "scheduled" ? "Story scheduled!" : "Story added to your feed!");
      navigate("/app");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post story.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base text-text-primary p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-border-soft pb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <h1 className="text-xl font-black bg-gradient-to-r from-primary-500 to-purple-500 bg-clip-text text-transparent">
          Stories Studio
        </h1>

        <button
          onClick={handleShareStory}
          disabled={isUploading || (!file && !preview)}
          className="px-5 py-2 bg-primary-600 hover:bg-primary-500 text-white font-bold text-sm rounded-xl transition-all shadow-md disabled:opacity-40"
        >
          {isUploading ? "Publishing..." : "Share Story"}
        </button>
      </div>

      {/* Main Canvas & Toolbar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Story Canvas Box */}
        <div className="md:col-span-7 bg-black rounded-3xl overflow-hidden relative shadow-2xl min-h-[550px] flex items-center justify-center border border-white/10">
          {preview ? (
            mediaType === "video" ? (
              <video src={preview} autoPlay loop playsInline className="w-full h-full object-cover" />
            ) : (
              <img src={preview} alt="Story Preview" className="w-full h-full object-cover" />
            )
          ) : (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-4 cursor-pointer text-text-secondary p-8 text-center"
            >
              <UploadCloud className="w-12 h-12 text-primary-500 animate-bounce" />
              <div>
                <p className="font-bold text-white text-base">Click to Upload Media</p>
                <p className="text-xs text-white/60 mt-1">Photos, Videos, or generate with AI</p>
              </div>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,video/*"
            className="hidden"
          />

          {/* Interactive Stickers Overlay */}
          {activeStickers.map((st) => (
            <div
              key={st.id}
              className="absolute p-3 bg-black/75 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl z-20 pointer-events-auto cursor-move text-white max-w-[220px]"
              style={{ left: `${st.position.x}%`, top: `${st.position.y}%`, transform: 'translate(-50%, -50%)' }}
            >
              {st.type === 'poll' && (
                <div className="text-center space-y-2 text-xs">
                  <p className="font-bold text-yellow-300">{st.data.question}</p>
                  <div className="grid grid-cols-2 gap-1.5 font-bold">
                    <span className="p-1.5 bg-white/20 rounded-lg">{st.data.optionA}</span>
                    <span className="p-1.5 bg-white/20 rounded-lg">{st.data.optionB}</span>
                  </div>
                </div>
              )}

              {st.type === 'question' && (
                <div className="text-center space-y-1.5 text-xs">
                  <p className="font-bold text-blue-300">{st.data.prompt}</p>
                  <div className="p-2 bg-white/10 rounded-xl text-white/60 text-[10px]">Type something...</div>
                </div>
              )}

              {st.type === 'countdown' && (
                <div className="text-center space-y-1 text-xs">
                  <p className="font-extrabold uppercase tracking-wider text-rose-400">{st.data.title}</p>
                  <div className="text-lg font-black font-mono">00 : 42 : 19</div>
                </div>
              )}

              {st.type === 'link' && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>{st.data.label}</span>
                </div>
              )}

              {st.type === 'mention' && (
                <div className="font-extrabold text-xs text-primary-400 flex items-center gap-1">
                  <AtSign className="w-3.5 h-3.5" />
                  {st.data.handle}
                </div>
              )}

              {st.type === 'location' && (
                <div className="font-bold text-xs text-amber-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {st.data.location}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Story Controls Toolbar */}
        <div className="md:col-span-5 space-y-4">
          {/* AI Generator Button */}
          <button
            onClick={() => setShowAiModal(true)}
            className="w-full p-4 bg-gradient-to-r from-purple-600 via-primary-500 to-pink-500 text-white font-extrabold text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 hover:brightness-110 transition-all"
          >
            <Wand2 className="w-5 h-5" />
            Generate Story Background with AI
          </button>

          {/* Sticker Overlay Drawer */}
          <div className="p-4 bg-bg-surface rounded-2xl border border-border-soft space-y-3">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Smile className="w-4 h-4 text-yellow-500" />
              Interactive Story Stickers
            </h3>
            <div className="grid grid-cols-4 gap-2 text-xs font-bold">
              {[
                { type: 'poll', label: 'Poll', icon: Vote, color: 'text-yellow-500' },
                { type: 'question', label: 'Question', icon: HelpCircle, color: 'text-blue-500' },
                { type: 'countdown', label: 'Timer', icon: Clock, color: 'text-rose-500' },
                { type: 'link', label: 'Link', icon: LinkIcon, color: 'text-emerald-500' },
                { type: 'mention', label: 'Mention', icon: AtSign, color: 'text-primary-500' },
                { type: 'location', label: 'Location', icon: MapPin, color: 'text-amber-500' },
              ].map((st) => {
                const Icon = st.icon;
                return (
                  <button
                    key={st.type}
                    onClick={() => handleAddSticker(st.type)}
                    className="p-3 bg-bg-base hover:bg-bg-surface-hover rounded-xl border border-border-soft flex flex-col items-center gap-1 transition-all"
                  >
                    <Icon className={`w-5 h-5 ${st.color}`} />
                    <span>{st.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Options: Scheduling & Archiving */}
          <div className="p-4 bg-bg-surface rounded-2xl border border-border-soft space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm flex items-center gap-2">
                <Archive className="w-4 h-4 text-emerald-500" />
                Auto-Archive Story after 24h
              </span>
              <input
                type="checkbox"
                checked={isArchived}
                onChange={(e) => setIsArchived(e.target.checked)}
                className="w-5 h-5 accent-primary-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-text-secondary block mb-1">Schedule Story</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => {
                  setScheduledAt(e.target.value);
                  setPublishStatus(e.target.value ? "scheduled" : "published");
                }}
                className="w-full p-3 bg-bg-base border border-border-soft rounded-xl text-xs outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* AI Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-surface p-6 rounded-3xl border border-border-soft max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-purple-500" />
                AI Story Background Generator
              </h3>
              <button onClick={() => setShowAiModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateAiStory} className="space-y-4">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe prompt: e.g. Cyberpunk Tokyo street neon"
                className="w-full p-3 bg-bg-base border border-border-soft rounded-xl text-sm outline-none"
                required
              />

              <button
                type="submit"
                disabled={generatingAi}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50"
              >
                {generatingAi ? "Generating..." : "Generate AI Image"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
