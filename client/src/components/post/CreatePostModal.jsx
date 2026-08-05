import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, UploadCloud, Image as ImageIcon, Video, Loader2, ChevronRight, ChevronLeft, MapPin, Settings } from "lucide-react";
import { cn } from "../../utils/cn";
import { useToast } from "../ui/Toast";
import api from "../../services/api";

export const CreatePostModal = ({ isOpen, onClose }) => {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [hideLikes, setHideLikes] = useState(false);
  
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  const fileInputRef = useRef(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Check for drafts
      const draft = localStorage.getItem("postDraft");
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          setCaption(parsed.caption || "");
          setLocation(parsed.location || "");
          setCommentsEnabled(parsed.commentsEnabled ?? true);
          setHideLikes(parsed.hideLikes ?? false);
        } catch (e) {}
      }
    } else {
      document.body.style.overflow = "unset";
      setTimeout(() => {
        setFiles([]);
        previews.forEach(p => URL.revokeObjectURL(p.url));
        setPreviews([]);
        setCaption("");
        setLocation("");
        setIsLoading(false);
        setUploadProgress(0);
        setCurrentIndex(0);
        setShowSettings(false);
      }, 300);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (typeof document === "undefined") return null;

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFiles = (selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'];
    
    const newFiles = Array.from(selectedFiles).filter(file => {
      if (!validTypes.includes(file.type)) {
        showToast(`Invalid file type: ${file.name}`, "error");
        return false;
      }
      if (file.size > 50 * 1024 * 1024) {
        showToast(`File too large: ${file.name}`, "error");
        return false;
      }
      return true;
    });

    if (newFiles.length === 0) return;

    // Limit to 10 files (Instagram max)
    const combinedFiles = [...files, ...newFiles].slice(0, 10);
    setFiles(combinedFiles);

    const newPreviews = newFiles.map(file => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' : 'image',
      altText: ""
    }));
    
    setPreviews(prev => [...prev, ...newPreviews].slice(0, 10));
    
    if (previews.length === 0) {
      setCurrentIndex(0);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const handleFileSelect = (e) => {
    processFiles(e.target.files);
  };

  const removeMedia = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
    if (currentIndex >= previews.length - 1 && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const updateAltText = (text) => {
    setPreviews(prev => prev.map((p, i) => i === currentIndex ? { ...p, altText: text } : p));
  };

  const saveDraft = () => {
    localStorage.setItem("postDraft", JSON.stringify({
      caption, location, commentsEnabled, hideLikes
    }));
    showToast("Draft saved successfully!", "success");
  };

  const handleSubmit = async () => {
    if (files.length === 0 && !caption.trim()) {
      showToast("Please provide an image, video, or caption.", "error");
      return;
    }

    try {
      setIsLoading(true);
      let mediaData = [];

      if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const formData = new FormData();
          formData.append('image', files[i]);

          const uploadRes = await api.post('/api/upload', formData, {
            onUploadProgress: (progressEvent) => {
              const baseProgress = (i / files.length) * 90;
              const currentFileProgress = (progressEvent.loaded * 100) / progressEvent.total;
              setUploadProgress(baseProgress + (currentFileProgress / files.length) * 0.9);
            }
          });

          if (uploadRes.data.success) {
            const { url, public_id, resource_type } = uploadRes.data.data;
            mediaData.push({
              url,
              public_id,
              type: resource_type === 'video' ? 'video' : 'image',
              altText: previews[i].altText || ""
            });
          } else {
            throw new Error(`Failed to upload media item ${i+1}`);
          }
        }
      }

      setUploadProgress(95);

      const postRes = await api.post('/api/posts', {
        caption,
        location,
        mediaData,
        status: 'published',
        settings: {
          commentsEnabled,
          hideLikes,
          sharingEnabled: true
        }
      });

      if (postRes.data.success) {
        setUploadProgress(100);
        showToast("Post created successfully!", "success");
        localStorage.removeItem("postDraft");
        window.dispatchEvent(new Event('postCreated'));
        onClose();
      }
    } catch (error) {
      console.error("Post creation error:", error);
      showToast(error.response?.data?.message || "Failed to create post", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center md:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={!isLoading ? onClose : undefined}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
            className={cn(
              "glass-card relative z-[101] w-full h-full md:h-auto md:max-w-4xl overflow-hidden md:rounded-3xl shadow-2xl flex flex-col bg-bg-base md:bg-bg-base/90"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-soft shrink-0">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="p-2 -ml-2 text-text-primary hover:bg-bg-surface rounded-full transition-colors disabled:opacity-50"
              >
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-lg font-bold text-text-primary">Create new post</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={saveDraft}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-full bg-bg-surface hover:bg-bg-surface-hover text-text-primary font-medium text-sm transition-colors disabled:opacity-50"
                >
                  Save Draft
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isLoading || (files.length === 0 && !caption.trim())}
                  className="px-4 py-1.5 rounded-full hero-gradient text-white font-bold hover:scale-105 transition-transform disabled:opacity-50 flex items-center justify-center min-w-[80px]"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Share"}
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-y-auto md:overflow-hidden md:h-[600px]">
              
              {/* Media Section */}
              <div className="w-full md:w-[60%] border-b md:border-b-0 md:border-r border-border-soft flex flex-col shrink-0 min-h-[45vw] md:min-h-0 bg-bg-surface/50 relative overflow-hidden" style={{ maxHeight: '60vw' }}>
                {previews.length === 0 ? (
                  <div
                    className={cn(
                      "flex-1 flex flex-col items-center justify-center p-6 text-center transition-colors relative h-full",
                      isDragging ? "bg-primary-500/10" : ""
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="absolute inset-4 border-2 border-dashed border-border-soft rounded-2xl pointer-events-none" />
                    <div className="flex gap-2 mb-4 text-text-secondary">
                      <ImageIcon className="w-12 h-12" strokeWidth={1.5} />
                      <Video className="w-12 h-12" strokeWidth={1.5} />
                    </div>
                    <p className="text-lg text-text-primary font-medium mb-1">Drag photos and videos here</p>
                    <p className="text-sm text-text-secondary mb-6">Supports JPG, PNG, MP4 (Up to 10 items)</p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-2.5 rounded-full hero-gradient text-white font-bold hover:scale-105 transition-transform shadow-lg"
                    >
                      Select from computer
                    </button>
                  </div>
                ) : (
                  <div className="relative w-full h-full flex flex-col bg-black/5 group">
                    <div className="flex-1 relative flex items-center justify-center">
                      {previews[currentIndex].type === 'image' ? (
                        <img src={previews[currentIndex].url} alt="Preview" className="w-full h-full object-contain" />
                      ) : (
                        <video src={previews[currentIndex].url} controls className="w-full h-full object-contain" />
                      )}
                      
                      {!isLoading && (
                        <button
                          onClick={() => removeMedia(currentIndex)}
                          className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100 z-10"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}

                      {/* Carousel Navigation */}
                      {previews.length > 1 && (
                        <>
                          {currentIndex > 0 && (
                            <button 
                              onClick={() => setCurrentIndex(c => c - 1)}
                              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/80 transition shadow-lg"
                            >
                              <ChevronLeft className="w-6 h-6" />
                            </button>
                          )}
                          {currentIndex < previews.length - 1 && (
                            <button 
                              onClick={() => setCurrentIndex(c => c + 1)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/80 transition shadow-lg"
                            >
                              <ChevronRight className="w-6 h-6" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                    
                    {/* Media Thumbnails */}
                    <div className="h-20 bg-bg-base/80 border-t border-border-soft p-2 flex items-center gap-2 overflow-x-auto">
                      {previews.map((p, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentIndex(i)}
                          className={cn(
                            "relative shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-colors",
                            currentIndex === i ? "border-primary-500" : "border-transparent opacity-60 hover:opacity-100"
                          )}
                        >
                          {p.type === 'image' ? (
                            <img src={p.url} className="w-full h-full object-cover" />
                          ) : (
                            <video src={p.url} className="w-full h-full object-cover" />
                          )}
                        </button>
                      ))}
                      {previews.length < 10 && (
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="shrink-0 w-16 h-16 rounded-md border-2 border-dashed border-border-soft flex items-center justify-center text-text-secondary hover:border-primary-500 hover:text-primary-500 transition-colors"
                        >
                          <UploadCloud className="w-6 h-6" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
                  onChange={handleFileSelect}
                />

                {/* Upload Progress Overlay */}
                {isLoading && uploadProgress > 0 && (
                  <div className="absolute inset-0 bg-bg-base/80 flex flex-col items-center justify-center z-20 p-8 backdrop-blur-sm">
                    <Loader2 className="w-10 h-10 animate-spin text-primary-500 mb-4" />
                    <div className="w-full max-w-[200px] h-2 bg-bg-surface rounded-full overflow-hidden">
                      <div 
                        className="h-full hero-gradient transition-all duration-300 ease-out"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="mt-2 text-sm font-medium text-text-secondary">{Math.round(uploadProgress)}%</p>
                  </div>
                )}
              </div>

              {/* Caption & Settings Section */}
              <div className="flex-1 flex flex-col md:min-h-[300px] bg-bg-base overflow-y-auto no-scrollbar">
                <div className="p-4 border-b border-border-soft">
                  <textarea
                    className="w-full h-32 resize-none bg-transparent outline-none text-text-primary text-[15px] placeholder:text-text-secondary"
                    placeholder="Write a caption... Add #hashtags to trend!"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    disabled={isLoading}
                    maxLength={2200}
                  />
                  <div className="text-right mt-2 shrink-0 flex justify-between items-center">
                    <button className="text-xl">😊</button>
                    <span className={cn(
                      "text-xs font-medium",
                      caption.length >= 2200 ? "text-red-500" : "text-text-secondary"
                    )}>
                      {caption.length} / 2200
                    </span>
                  </div>
                </div>

                {/* Location */}
                <div className="p-4 border-b border-border-soft flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-text-secondary" />
                  <input 
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Add location"
                    className="flex-1 bg-transparent outline-none text-text-primary placeholder:text-text-secondary"
                  />
                </div>

                {/* Alt Text (For current media) */}
                {previews.length > 0 && (
                  <div className="p-4 border-b border-border-soft">
                    <label className="text-sm font-medium text-text-primary block mb-2">Alt text for current {previews[currentIndex].type}</label>
                    <input 
                      type="text"
                      value={previews[currentIndex].altText || ""}
                      onChange={(e) => updateAltText(e.target.value)}
                      placeholder="Write alt text..."
                      maxLength={200}
                      className="w-full bg-bg-surface px-3 py-2 rounded-lg outline-none text-text-primary focus:ring-1 focus:ring-primary-500 transition-shadow text-sm"
                    />
                  </div>
                )}

                {/* Advanced Settings Accordion */}
                <div className="p-4 mb-10">
                  <button 
                    onClick={() => setShowSettings(!showSettings)}
                    className="w-full flex items-center justify-between text-text-primary font-medium py-2"
                  >
                    <span className="flex items-center gap-2">
                      <Settings className="w-5 h-5 text-text-secondary" />
                      Advanced settings
                    </span>
                    {showSettings ? <ChevronLeft className="w-5 h-5 -rotate-90" /> : <ChevronRight className="w-5 h-5" />}
                  </button>
                  
                  <AnimatePresence>
                    {showSettings && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mt-4 space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-text-primary text-sm font-medium">Turn off commenting</p>
                            <p className="text-text-secondary text-xs mt-1">You can change this later.</p>
                          </div>
                          <button
                            onClick={() => setCommentsEnabled(!commentsEnabled)}
                            className={cn(
                              "w-11 h-6 rounded-full transition-colors relative",
                              !commentsEnabled ? "bg-primary-500" : "bg-bg-surface-hover"
                            )}
                          >
                            <div className={cn(
                              "w-4 h-4 rounded-full bg-white absolute top-1 transition-all",
                              !commentsEnabled ? "left-6" : "left-1"
                            )} />
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-text-primary text-sm font-medium">Hide like and view counts</p>
                            <p className="text-text-secondary text-xs mt-1">Only you will see the total number.</p>
                          </div>
                          <button
                            onClick={() => setHideLikes(!hideLikes)}
                            className={cn(
                              "w-11 h-6 rounded-full transition-colors relative",
                              hideLikes ? "bg-primary-500" : "bg-bg-surface-hover"
                            )}
                          >
                            <div className={cn(
                              "w-4 h-4 rounded-full bg-white absolute top-1 transition-all",
                              hideLikes ? "left-6" : "left-1"
                            )} />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
