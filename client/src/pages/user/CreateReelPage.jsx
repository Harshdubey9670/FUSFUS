import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud,
  Video,
  X,
  Loader2,
  ArrowLeft,
  Music2,
  Image as ImageIcon,
  CheckCircle2,
  Film,
  Sparkles,
  Sliders,
  Play,
  Pause,
  Clock,
  Mic,
  Scissors,
  Wand2,
  Users,
  ShieldAlert,
  Save,
  Calendar,
  Layers
} from "lucide-react";
import api from "../../services/api";
import { useToast } from "../../components/ui/Toast";

/* ─── Filters CSS Mapping ─────────────────────────────────────────────────── */
const FILTER_PRESETS = [
  { id: "none", name: "Normal", filter: "none" },
  { id: "vintage", name: "Vintage", filter: "sepia(0.4) contrast(1.1) brightness(0.9)" },
  { id: "cyberpunk", name: "Cyberpunk", filter: "hue-rotate(180deg) saturate(1.8) contrast(1.2)" },
  { id: "cinematic", name: "Cinematic", filter: "contrast(1.3) saturate(0.85) brightness(0.95)" },
  { id: "bw", name: "B & W", filter: "grayscale(1) contrast(1.2)" },
  { id: "warm", name: "Warm Glow", filter: "sepia(0.2) saturate(1.4) hue-rotate(-10deg)" },
  { id: "neon", name: "Neon", filter: "saturate(2) contrast(1.4) brightness(1.1)" }
];

export default function CreateReelPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const videoInputRef = useRef(null);
  const videoPreviewRef = useRef(null);

  // Step: 0 = Pick Video, 1 = Edit Studio, 2 = Details & Publish
  const [step, setStep] = useState(0);

  // Video File
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Editing Metadata Controls
  const [speed, setSpeed] = useState(1.0);
  const [selectedFilter, setSelectedFilter] = useState("none");
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [voiceoverActive, setVoiceoverActive] = useState(false);

  // Music & AI Captions
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [musicLibrary, setMusicLibrary] = useState([]);
  const [selectedMusic, setSelectedMusic] = useState(null);

  const [aiCaptions, setAiCaptions] = useState([]);
  const [generatingCaptions, setGeneratingCaptions] = useState(false);
  const [captionStyle, setCaptionStyle] = useState("Pop");

  // Publish / Details state
  const [caption, setCaption] = useState("");
  const [collaborators, setCollaborators] = useState("");
  const [publishStatus, setPublishStatus] = useState("published"); // published, draft, scheduled
  const [scheduledAt, setScheduledAt] = useState("");
  const [downloadAllowed, setDownloadAllowed] = useState(false); // Download prevention default
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Music Library on mount
  useEffect(() => {
    api.get("/api/reels/music-library")
      .then((res) => setMusicLibrary(res.data.data))
      .catch(() => console.error("Failed to load music library"));
  }, []);

  // Handle Video Pick
  const handleVideoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Please select a valid video file.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoPreview(previewUrl);
    setStep(1);
  };

  // Video Metadata Loaded
  const handleLoadedMetadata = () => {
    if (videoPreviewRef.current) {
      const dur = Math.floor(videoPreviewRef.current.duration);
      setVideoDuration(dur);
      setTrimEnd(dur);
    }
  };

  // Generate AI Captions
  const handleGenerateCaptions = async () => {
    setGeneratingCaptions(true);
    try {
      const res = await api.post("/api/reels/generate-captions", { captionStyle });
      setAiCaptions(res.data.data.captions);
      toast.success("AI Captions generated successfully!");
    } catch (err) {
      toast.error("Failed to generate AI captions.");
    } finally {
      setGeneratingCaptions(false);
    }
  };

  // Submit Reel
  const handleSubmitReel = async () => {
    if (!videoFile) return;

    setIsSubmitting(true);
    try {
      // 1. Upload Video
      const formData = new FormData();
      formData.append("file", videoFile);
      const uploadRes = await api.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      // 2. Create Reel Document
      const payload = {
        caption,
        video: {
          url: uploadRes.data.url,
          public_id: uploadRes.data.public_id,
          duration: videoDuration
        },
        music: selectedMusic ? { title: selectedMusic.title, artist: selectedMusic.artist, audioUrl: selectedMusic.audioUrl } : {},
        status: publishStatus,
        scheduledAt: publishStatus === "scheduled" ? scheduledAt : undefined,
        downloadAllowed,
        collaborators: collaborators ? collaborators.split(",").map((c) => c.trim()) : [],
        editingMetadata: {
          speed,
          filter: selectedFilter,
          trimStart,
          trimEnd,
          voiceoverUrl: voiceoverActive ? "recorded_audio_stream" : ""
        },
        aiCaptions
      };

      await api.post("/api/reels", payload);
      toast.success(publishStatus === "draft" ? "Reel saved as Draft!" : publishStatus === "scheduled" ? "Reel scheduled!" : "Reel published!");
      navigate("/app/reels");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to publish Reel.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base text-text-primary p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-border-soft pb-4">
        <button
          onClick={() => (step > 0 ? setStep(step - 1) : navigate(-1))}
          className="flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-center gap-2">
          <Film className="w-6 h-6 text-primary-500" />
          <h1 className="text-xl font-black bg-gradient-to-r from-primary-500 to-purple-500 bg-clip-text text-transparent">
            Reels Creator Studio
          </h1>
        </div>

        {step === 1 && (
          <button
            onClick={() => setStep(2)}
            className="px-4 py-2 bg-primary-600 text-white font-bold text-sm rounded-xl hover:bg-primary-500 transition-all shadow-md"
          >
            Next: Details
          </button>
        )}
      </div>

      {/* STEP 0: Select Video */}
      {step === 0 && (
        <div className="flex flex-col items-center justify-center p-12 bg-bg-surface rounded-3xl border-2 border-dashed border-border-soft space-y-6 min-h-[60vh] text-center">
          <div className="w-20 h-20 bg-primary-500/10 rounded-full flex items-center justify-center text-primary-500 animate-pulse">
            <UploadCloud className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Select Video for Reel</h2>
            <p className="text-sm text-text-secondary mt-1">MP4, MOV or WebM files up to 100MB</p>
          </div>

          <input
            type="file"
            ref={videoInputRef}
            onChange={handleVideoChange}
            accept="video/*"
            className="hidden"
          />

          <button
            onClick={() => videoInputRef.current?.click()}
            className="px-8 py-3.5 bg-gradient-to-r from-primary-500 to-purple-600 text-white font-extrabold text-sm rounded-2xl shadow-xl hover:scale-105 transition-all"
          >
            Choose Video File
          </button>
        </div>
      )}

      {/* STEP 1: Video Editing Studio */}
      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Live Video Preview Box */}
          <div className="md:col-span-7 flex flex-col items-center justify-center bg-black rounded-3xl overflow-hidden relative shadow-2xl min-h-[500px]">
            <video
              ref={videoPreviewRef}
              src={videoPreview}
              autoPlay
              loop
              onLoadedMetadata={handleLoadedMetadata}
              className="max-h-[550px] w-full object-contain transition-all"
              style={{
                filter: FILTER_PRESETS.find((f) => f.id === selectedFilter)?.filter,
                playbackRate: speed
              }}
            />

            {/* AI Captions Overlay Display */}
            {aiCaptions.length > 0 && (
              <div className="absolute bottom-16 left-6 right-6 text-center z-20 pointer-events-none">
                <span className="px-4 py-2 bg-black/80 text-yellow-300 font-extrabold text-sm rounded-xl shadow-lg border border-yellow-300/30">
                  {aiCaptions[0].text}
                </span>
              </div>
            )}

            {/* Control Bar Overlay */}
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs font-bold z-20">
              {speed}x Speed
            </div>
          </div>

          {/* Right Toolbar & Effects Control */}
          <div className="md:col-span-5 space-y-6">
            {/* 1. Music Selector */}
            <div className="p-4 bg-bg-surface rounded-2xl border border-border-soft space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm flex items-center gap-2">
                  <Music2 className="w-4 h-4 text-purple-500" />
                  Audio & Music
                </span>
                <button
                  onClick={() => setShowMusicModal(true)}
                  className="text-xs font-bold text-primary-500 hover:underline"
                >
                  {selectedMusic ? "Change Track" : "+ Add Music"}
                </button>
              </div>
              {selectedMusic && (
                <div className="p-3 bg-bg-base rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold">{selectedMusic.title}</p>
                    <p className="text-[10px] text-text-secondary">{selectedMusic.artist}</p>
                  </div>
                  <button onClick={() => setSelectedMusic(null)} className="text-xs text-rose-500">Remove</button>
                </div>
              )}
            </div>

            {/* 2. Speed Controls */}
            <div className="p-4 bg-bg-surface rounded-2xl border border-border-soft space-y-3">
              <span className="font-bold text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-500" />
                Playback Speed
              </span>
              <div className="grid grid-cols-5 gap-2">
                {[0.5, 1.0, 1.5, 2.0, 3.0].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`py-2 rounded-xl text-xs font-extrabold transition-all ${
                      speed === s
                        ? "bg-primary-500 text-white shadow-md"
                        : "bg-bg-base text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Filters & Effects Preset */}
            <div className="p-4 bg-bg-surface rounded-2xl border border-border-soft space-y-3">
              <span className="font-bold text-sm flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-amber-500" />
                Visual Filters
              </span>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {FILTER_PRESETS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFilter(f.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedFilter === f.id
                        ? "bg-amber-500/20 text-amber-500 border border-amber-500/40"
                        : "bg-bg-base text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. AI Captions Generator */}
            <div className="p-4 bg-bg-surface rounded-2xl border border-border-soft space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  AI Auto Captions
                </span>
                <button
                  onClick={handleGenerateCaptions}
                  disabled={generatingCaptions}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  {generatingCaptions ? "Generating..." : "Generate AI Captions"}
                </button>
              </div>
            </div>

            {/* 5. Voiceover Toggle */}
            <div className="p-4 bg-bg-surface rounded-2xl border border-border-soft flex items-center justify-between">
              <span className="font-bold text-sm flex items-center gap-2">
                <Mic className="w-4 h-4 text-rose-500" />
                Voiceover Audio
              </span>
              <button
                onClick={() => setVoiceoverActive(!voiceoverActive)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  voiceoverActive ? "bg-rose-500 text-white" : "bg-bg-base text-text-secondary"
                }`}
              >
                {voiceoverActive ? "Voiceover Active" : "Record Voiceover"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Details & Publishing */}
      {step === 2 && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="p-6 bg-bg-surface rounded-3xl border border-border-soft space-y-5 shadow-lg">
            <h2 className="font-bold text-lg">Reel Publishing Details</h2>

            {/* Caption */}
            <div>
              <label className="text-xs font-bold text-text-secondary block mb-1">Caption & Hashtags</label>
              <textarea
                rows={4}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption... Use #hashtags"
                className="w-full p-4 bg-bg-base border border-border-soft rounded-2xl text-sm outline-none focus:border-primary-500"
              />
            </div>

            {/* Collaborators */}
            <div>
              <label className="text-xs font-bold text-text-secondary block mb-1">Invite Collaborators (Usernames separated by comma)</label>
              <div className="flex items-center gap-2 px-3 py-2 bg-bg-base border border-border-soft rounded-2xl">
                <Users className="w-4 h-4 text-text-secondary" />
                <input
                  type="text"
                  value={collaborators}
                  onChange={(e) => setCollaborators(e.target.value)}
                  placeholder="alex_dev, sarah_design"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
            </div>

            {/* Status Option */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "published", label: "Publish Now", icon: Film },
                { id: "draft", label: "Save Draft", icon: Save },
                { id: "scheduled", label: "Schedule", icon: Calendar }
              ].map((st) => {
                const Icon = st.icon;
                return (
                  <button
                    key={st.id}
                    onClick={() => setPublishStatus(st.id)}
                    className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-2 transition-all ${
                      publishStatus === st.id
                        ? "border-primary-500 bg-primary-500/10 text-primary-500"
                        : "border-border-soft bg-bg-base text-text-secondary"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {st.label}
                  </button>
                );
              })}
            </div>

            {/* Scheduled Date Picker */}
            {publishStatus === "scheduled" && (
              <div>
                <label className="text-xs font-bold text-text-secondary block mb-1">Release Date & Time</label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full p-3 bg-bg-base border border-border-soft rounded-xl text-sm outline-none"
                />
              </div>
            )}

            {/* DRM Download Protection Architecture Toggle */}
            <div className="p-4 bg-bg-base rounded-2xl border border-border-soft flex items-center justify-between">
              <div>
                <span className="font-bold text-sm flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-emerald-500" />
                  Download Protection (DRM Architecture)
                </span>
                <p className="text-[11px] text-text-secondary mt-0.5">Prevent viewers from downloading or ripping your original video.</p>
              </div>
              <input
                type="checkbox"
                checked={!downloadAllowed}
                onChange={(e) => setDownloadAllowed(!e.target.checked)}
                className="w-5 h-5 accent-primary-500 cursor-pointer"
              />
            </div>

            <button
              onClick={handleSubmitReel}
              disabled={isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-primary-500 to-purple-600 text-white font-extrabold text-base rounded-2xl shadow-xl hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Processing Video..." : publishStatus === "draft" ? "Save Draft" : publishStatus === "scheduled" ? "Schedule Reel" : "Share Reel Now"}
            </button>
          </div>
        </div>
      )}

      {/* Music Library Selection Modal */}
      {showMusicModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-surface p-6 rounded-3xl border border-border-soft max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Music2 className="w-5 h-5 text-purple-500" />
                Trending Music Library
              </h3>
              <button onClick={() => setShowMusicModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {musicLibrary.map((track) => (
                <div
                  key={track.id}
                  onClick={() => {
                    setSelectedMusic(track);
                    setShowMusicModal(false);
                  }}
                  className="p-3 bg-bg-base hover:bg-primary-500/10 rounded-2xl border border-border-soft cursor-pointer flex items-center justify-between transition-all"
                >
                  <div>
                    <p className="font-bold text-sm">{track.title}</p>
                    <p className="text-xs text-text-secondary">{track.artist}</p>
                  </div>
                  <span className="text-xs text-purple-500 font-bold">{track.duration}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
