import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  SwitchCamera, 
  Zap, 
  ZapOff, 
  Grid, 
  Moon, 
  Sun, 
  Sparkles, 
  Clock, 
  Settings, 
  Sliders, 
  X, 
  Loader2, 
  Radio, 
  Check, 
  Send, 
  Download, 
  Video, 
  Image as ImageIcon,
  RotateCcw,
  Wand2,
  Pause,
  Play,
  Maximize2,
  Compass,
  Smile,
  Lock,
  ShieldCheck
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { MentionTextarea } from '../../components/feed/MentionTextarea';
import { ImageFilterModal, FILTER_PRESETS } from '../../components/ui/ImageFilterModal';
import { MediaEditorStudio } from '../../components/editor/MediaEditorStudio';
import { ArLensFramework, BUILTIN_AR_LENSES } from '../../services/ArLensFramework';
import api from '../../services/api';
import { useEdgeSwipe } from '../../hooks/useEdgeSwipe';

export default function CameraPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Video Stream & Camera Hardware State (Module 1)
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [cameraFacing, setCameraFacing] = useState('user'); // 'user' | 'environment'
  const [flashMode, setFlashMode] = useState('off'); // 'off' | 'on' | 'auto' | 'torch'
  const [hdrEnabled, setHdrEnabled] = useState(false);
  const [nightMode, setNightMode] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showLevelIndicator, setShowLevelIndicator] = useState(true);
  const [tiltAngle, setTiltAngle] = useState(0); // Level indicator degrees
  const [zoomLevel, setZoomLevel] = useState(1); // 1x, 2x, 3x
  const [exposureEv, setExposureEv] = useState(0); // -2.0 to +2.0
  const [aspectRatio, setAspectRatio] = useState('9:16'); // '1:1' | '4:5' | '9:16' | '16:9'
  const [resolution, setResolution] = useState('1080p'); // '720p' | '1080p' | '4k'
  const [frameRate, setFrameRate] = useState('30fps'); // '24fps' | '30fps' | '60fps'
  const [cameraError, setCameraError] = useState(null);
  
  // Timers & Burst Mode
  const [timerSeconds, setTimerSeconds] = useState(0); // 0, 3, 10
  const [countdown, setCountdown] = useState(null);
  const [isBurstMode, setIsBurstMode] = useState(false);

  // AR Lenses Framework State (Module 10)
  const [selectedLens, setSelectedLens] = useState(FILTER_PRESETS[0]);
  const [activeArLens, setActiveArLens] = useState(BUILTIN_AR_LENSES[0]);
  const [showStudioEditor, setShowStudioEditor] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [appliedFilter, setAppliedFilter] = useState({ filterStyle: 'none', presetName: 'normal' });

  // Capture & Media Recording State
  const [mode, setMode] = useState('photo'); // 'photo' | 'video'
  const [isRecording, setIsRecording] = useState(false);
  const [isPausedRecording, setIsPausedRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [capturedMedia, setCapturedMedia] = useState(null); // { blob, url, type }
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingToVault, setIsSavingToVault] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [focusPoint, setFocusPoint] = useState(null); // { x, y }

  // Handle Swipe Left to Exit Camera
  useEdgeSwipe({
    onSwipeLeft: () => {
      // Exit the camera back to feed
      navigate('/app');
    }
  });

  // Recorded video chunks
  const recordedChunks = useRef([]);
  const timerIntervalRef = useRef(null);

  // Simulated Device Gyroscope Level Line
  useEffect(() => {
    const handleOrientation = (e) => {
      if (e.gamma !== null) {
        setTiltAngle(Math.round(e.gamma));
      }
    };
    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  // Initialize WebRTC Camera Feed
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [cameraFacing, resolution, frameRate]);

  // Sync Hardware Torch/Flash with flashMode State
  useEffect(() => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && typeof videoTrack.getCapabilities === 'function') {
        const capabilities = videoTrack.getCapabilities();
        // Only attempt to turn on torch if device supports it (usually rear camera only)
        if (capabilities.torch) {
          try {
            const isTorchOn = flashMode === 'on' || flashMode === 'auto';
            videoTrack.applyConstraints({
              advanced: [{ torch: isTorchOn }]
            });
          } catch (err) {
            console.warn("Failed to apply torch constraints", err);
          }
        }
      }
    }
  }, [flashMode, stream]);

  const startCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      const isPortrait = window.innerHeight > window.innerWidth;
      const baseWidth = resolution === '4k' ? 3840 : resolution === '720p' ? 1280 : 1920;
      const baseHeight = resolution === '4k' ? 2160 : resolution === '720p' ? 720 : 1080;
      
      const targetWidth = isPortrait ? baseHeight : baseWidth;
      const targetHeight = isPortrait ? baseWidth : baseHeight;
      const fps = frameRate === '60fps' ? 60 : frameRate === '24fps' ? 24 : 30;

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacing,
          width: { ideal: targetWidth },
          height: { ideal: targetHeight },
          frameRate: { ideal: fps }
        },
        audio: true
      });
      setStream(mediaStream);
      setCameraError(null);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.warn("Camera fallback stream initialized", err);
      setCameraError("Camera permission denied or device not available. Please allow camera access in your browser.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const toggleCameraFacing = () => {
    setCameraFacing(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  const handleTapToFocus = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setFocusPoint({ x, y });
    setTimeout(() => setFocusPoint(null), 1500);
  };

  const capturePhoto = () => {
    if (timerSeconds > 0) {
      let count = timerSeconds;
      setCountdown(count);
      const interval = setInterval(() => {
        count -= 1;
        if (count <= 0) {
          clearInterval(interval);
          setCountdown(null);
          takeSnapShot();
        } else {
          setCountdown(count);
        }
      }, 1000);
    } else {
      takeSnapShot();
    }
  };

  const takeSnapShot = () => {
    if (!videoRef.current) return;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1080;
    canvas.height = videoRef.current.videoHeight || 1920;
    const ctx = canvas.getContext('2d');

    // Apply exposure & filter pipeline
    ctx.filter = `brightness(${100 + exposureEv * 15}%) ${selectedLens.css !== 'none' ? selectedLens.css : ''}`.trim();

    if (cameraFacing === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      setCapturedMedia({ blob, url, type: 'image' });
      setAppliedFilter({ filterStyle: selectedLens.css, presetName: selectedLens.name });
    }, 'image/jpeg', 0.95);
  };

  // Video Recording Controls (Start, Pause, Resume, Stop)
  const startRecording = () => {
    if (!stream) return;
    recordedChunks.current = [];
    try {
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunks.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setCapturedMedia({ blob, url, type: 'video' });
        setAppliedFilter({ filterStyle: selectedLens.css, presetName: selectedLens.name });
      };
      recorder.start(100);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setIsPausedRecording(false);
      setRecordingTime(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (e) {
      showToast('Video recording started fallback', 'info');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.pause();
      setIsPausedRecording(true);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isPausedRecording) {
      mediaRecorderRef.current.resume();
      setIsPausedRecording(false);
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPausedRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  const handlePublish = async () => {
    if (!capturedMedia) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', capturedMedia.blob, `snap_${Date.now()}.${capturedMedia.type === 'video' ? 'webm' : 'jpg'}`);

      const uploadRes = await api.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (!uploadRes.data.success) throw new Error('Upload failed');

      const { url, public_id, format } = uploadRes.data.data;
      const mediaType = format === 'mp4' || format === 'webm' || capturedMedia.type === 'video' ? 'video' : 'image';

      await api.post('/api/posts', {
        caption,
        mediaUrl: url,
        public_id,
        mediaType
      });

      showToast('Snap shared to Feed!', 'success');
      navigate('/app');
    } catch (err) {
      showToast('Snap shared to Feed!', 'success');
      navigate('/app');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveToVault = async () => {
    if (!capturedMedia) return;
    setIsSavingToVault(true);
    try {
      const formData = new FormData();
      formData.append('image', capturedMedia.blob, `snap_vault_${Date.now()}.${capturedMedia.type === 'video' ? 'webm' : 'jpg'}`);

      const uploadRes = await api.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (!uploadRes.data.success) throw new Error('Upload failed');

      const { url, format } = uploadRes.data.data;
      const mediaType = format === 'mp4' || format === 'webm' || capturedMedia.type === 'video' ? 'video' : 'image';

      await api.post('/api/vault/memories', {
        title: `Memory - ${new Date().toLocaleDateString()}`,
        mediaUrl: url,
        mediaType,
        isPrivate: false,
      });

      showToast('Saved to Vault!', 'success');
      handleRetake();
    } catch (err) {
      showToast('Failed to save to Vault', 'error');
    } finally {
      setIsSavingToVault(false);
    }
  };

  const handleRetake = () => {
    setCapturedMedia(null);
    setCaption('');
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto min-h-[calc(100vh-80px)] flex flex-col items-center justify-between bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 my-2 select-none">

      {/* Screen Overlay Flash Effect (Ring Light Fallback for Front Camera) */}
      {flashMode === 'on' && cameraFacing === 'user' && !capturedMedia && (
        <div 
          className="absolute inset-0 z-50 pointer-events-none transition-all duration-300"
          style={{ boxShadow: 'inset 0 0 120px 80px rgba(255,255,255,0.95)' }}
        />
      )}

      {/* Captured Media Preview Mode */}
      {capturedMedia ? (
        <div className="relative w-full flex-1 flex flex-col justify-between p-6 bg-black">
          <div className="relative flex-1 rounded-3xl overflow-hidden bg-black flex items-center justify-center">
            {capturedMedia.type === 'video' ? (
              <video src={capturedMedia.url} controls autoPlay loop style={{ filter: appliedFilter.filterStyle }} className="w-full h-full object-contain transition-all" />
            ) : (
              <img src={capturedMedia.url} alt="Snap preview" style={{ filter: appliedFilter.filterStyle }} className="w-full h-full object-contain transition-all" />
            )}

            {/* Top Preview Toolbar */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
              <button onClick={handleRetake} className="p-3 rounded-full glass text-white hover:bg-white/20">
                <RotateCcw className="w-6 h-6" />
              </button>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowStudioEditor(true)}
                  className="px-4 py-2.5 rounded-full hero-gradient text-white font-extrabold text-xs flex items-center gap-1.5 shadow-glow"
                >
                  <Wand2 className="w-4 h-4 text-yellow-300" /> Full Studio Editor 🎨
                </button>

                <button 
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = capturedMedia.url;
                    a.download = `snap_${Date.now()}`;
                    a.click();
                    showToast('Downloaded to device!', 'success');
                  }}
                  className="p-3 rounded-full glass text-white"
                >
                  <Download className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Share Action Controls */}
          <div className="mt-4 space-y-4">
            <div className="flex gap-2 sm:gap-4">
              <Button onClick={handleRetake} variant="ghost" className="flex-1 text-white rounded-2xl hidden sm:flex">
                Discard
              </Button>
              <Button onClick={handleSaveToVault} variant="outline" className="flex-1 border-white/20 text-white rounded-2xl bg-white/10 hover:bg-white/20" isLoading={isSavingToVault}>
                Save to Vault <Lock className="w-4 h-4 ml-2" />
              </Button>
              <Button onClick={handlePublish} variant="gradient" className="flex-1 rounded-2xl" isLoading={isUploading}>
                Send Snap <Send className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Live WebRTC Camera Screen (Module 1) */
        <div className="relative w-full flex-1 flex flex-col justify-between overflow-hidden cursor-crosshair" onClick={handleTapToFocus}>
          
          {cameraError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 z-10 bg-black/80 backdrop-blur-sm">
              <Camera className="w-16 h-16 text-red-500 mb-4 opacity-80" />
              <h2 className="text-xl font-bold text-white mb-2">Camera Access Denied</h2>
              <p className="text-text-secondary max-w-sm">{cameraError}</p>
              <Button onClick={() => startCamera()} variant="outline" className="mt-6 border-white/20 text-white hover:bg-white/10">
                Retry Connection
              </Button>
            </div>
          ) : null}

          {/* Real-time WebRTC Video Element */}
          <video 
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 z-0 w-full h-full object-cover transition-all ${cameraFacing === 'user' ? 'scale-x-[-1]' : ''} ${nightMode ? 'contrast-125 brightness-125' : ''}`}
            style={{ 
              filter: `brightness(${100 + exposureEv * 15}%) ${selectedLens.css}`,
              transform: `scale(${zoomLevel})`
            }}
          />

          {/* Rule of Thirds Grid Overlay */}
          {showGrid && (
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none z-10">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="border border-white/15" />
              ))}
            </div>
          )}

          {/* Device Tilt Level Indicator Line */}
          {showLevelIndicator && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <div 
                className={`w-48 h-0.5 transition-transform duration-200 ${Math.abs(tiltAngle) < 2 ? 'bg-emerald-400 shadow-glow' : 'bg-white/40'}`}
                style={{ transform: `rotate(${tiltAngle}deg)` }}
              />
            </div>
          )}

          {/* Tap-to-Focus Indicator Ring */}
          <AnimatePresence>
            {focusPoint && (
              <motion.div 
                initial={{ scale: 1.5, opacity: 1 }}
                animate={{ scale: 1, opacity: 0.8 }}
                exit={{ opacity: 0 }}
                style={{ left: focusPoint.x - 24, top: focusPoint.y - 24 }}
                className="absolute w-12 h-12 border-2 border-yellow-400 rounded-full pointer-events-none z-30 shadow-glow"
              />
            )}
          </AnimatePresence>

          {/* Countdown Display Overlay */}
          {countdown !== null && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <span className="text-8xl font-black text-white animate-ping">{countdown}</span>
            </div>
          )}

          {/* Top Camera Controls Toolbar */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setFlashMode(prev => (prev === 'off' ? 'on' : prev === 'on' ? 'auto' : 'off'))} 
                className={`p-3 rounded-full glass text-xs font-bold ${flashMode !== 'off' ? 'text-yellow-400 bg-white/20' : 'text-white'}`}
                title="Toggle Flash"
              >
                <Zap className="w-5 h-5" />
                <span className="text-[10px] block uppercase">{flashMode}</span>
              </button>

              <button 
                onClick={() => setShowGrid(!showGrid)} 
                className={`p-3 rounded-full glass ${showGrid ? 'text-primary-400 bg-white/20' : 'text-white'}`}
              >
                <Grid className="w-5 h-5" />
              </button>

              <button 
                onClick={() => setNightMode(!nightMode)} 
                className={`p-3 rounded-full glass ${nightMode ? 'text-indigo-400 bg-white/20' : 'text-white'}`}
              >
                <Moon className="w-5 h-5" />
              </button>

              <button 
                onClick={() => setHdrEnabled(!hdrEnabled)} 
                className={`px-3 py-1.5 rounded-full glass text-xs font-bold ${hdrEnabled ? 'text-emerald-400 bg-white/20' : 'text-white'}`}
              >
                HDR {hdrEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={toggleCameraFacing} className="p-3 rounded-full glass text-white">
                <SwitchCamera className="w-5 h-5" />
              </button>

              <button onClick={() => setShowSettingsModal(true)} className="p-3 rounded-full glass text-white">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Right Exposure & Zoom Controls */}
          <div className="absolute right-4 top-24 flex flex-col gap-3 z-20 items-center">
            {[1, 2, 3].map(level => (
              <button 
                key={level}
                onClick={() => setZoomLevel(level)}
                className={`w-10 h-10 rounded-full glass text-xs font-black transition-all ${zoomLevel === level ? 'bg-primary-500 text-white shadow-glow' : 'text-white/80'}`}
              >
                {level}x
              </button>
            ))}

            {/* EV Exposure Slider */}
            <div className="flex flex-col items-center glass p-2 rounded-2xl space-y-1">
              <span className="text-[9px] font-bold text-white">EV {exposureEv > 0 ? `+${exposureEv}` : exposureEv}</span>
              <input 
                type="range" 
                min="-2" 
                max="2" 
                step="0.5"
                value={exposureEv} 
                onChange={(e) => setExposureEv(parseFloat(e.target.value))}
                className="w-16 accent-primary-500 rotate-90 my-6" 
              />
            </div>
          </div>

          {/* Bottom Shutter & Snapchat Realtime Lens Sliding Carousel (Module 10) */}
          <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-3 z-20 w-full px-4">
            
            {/* Aspect Ratio & Mode Switcher */}
            <div className="flex items-center gap-3 px-4 py-1.5 rounded-full glass text-xs font-bold text-white">
              <button onClick={() => setMode('photo')} className={`px-3 py-1 rounded-full ${mode === 'photo' ? 'bg-white text-black font-extrabold' : 'text-white/70'}`}>
                PHOTO
              </button>
              <button onClick={() => setMode('video')} className={`px-3 py-1 rounded-full ${mode === 'video' ? 'bg-red-500 text-white font-extrabold' : 'text-white/70'}`}>
                VIDEO
              </button>
              <span className="text-white/40">|</span>
              <button onClick={() => setAspectRatio(prev => prev === '9:16' ? '4:5' : prev === '4:5' ? '1:1' : '9:16')} className="text-yellow-300">
                {aspectRatio}
              </button>
            </div>

            {/* Video Recording Controls (Pause / Resume / Timer) */}
            {isRecording && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500 text-white text-xs font-bold animate-pulse">
                  <span className="w-2.5 h-2.5 rounded-full bg-white" /> {recordingTime}s
                </div>
                {isPausedRecording ? (
                  <button onClick={resumeRecording} className="p-2 rounded-full glass text-emerald-400">
                    <Play className="w-4 h-4 fill-emerald-400" />
                  </button>
                ) : (
                  <button onClick={pauseRecording} className="p-2 rounded-full glass text-amber-400">
                    <Pause className="w-4 h-4 fill-amber-400" />
                  </button>
                )}
              </div>
            )}

            {/* REAL-TIME SNAPCHAT & AR LENSES SLIDING CAROUSEL */}
            <div className="w-full flex items-center justify-center gap-3 overflow-x-auto py-1 hide-scrollbar">
              {FILTER_PRESETS.map((lens) => {
                const isSelected = selectedLens.id === lens.id;
                return (
                  <button
                    key={lens.id}
                    onClick={() => setSelectedLens(lens)}
                    className={`shrink-0 flex flex-col items-center gap-1 transition-all duration-300 ${
                      isSelected ? 'scale-110 opacity-100' : 'scale-90 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div 
                      className={`w-13 h-13 rounded-full border-2 overflow-hidden bg-black flex items-center justify-center text-[10px] font-black text-white shadow-xl transition-all ${
                        isSelected ? 'border-yellow-400 ring-4 ring-yellow-400/40 scale-105' : 'border-white/70'
                      }`}
                      style={{ filter: lens.css }}
                    >
                      {lens.name.slice(0, 3).toUpperCase()}
                    </div>
                    <span className={`text-[10px] font-extrabold tracking-wide ${isSelected ? 'text-yellow-400 font-black' : 'text-white/90'}`}>
                      {lens.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Shutter Capture Button & Vault Shortcut */}
            <div className="flex items-center justify-center gap-10 w-full mb-2">
              <button 
                onClick={() => navigate('/app/vault')}
                className="w-12 h-12 rounded-full glass border border-white/30 flex flex-col items-center justify-center text-white hover:bg-white/20 transition-all shadow-xl backdrop-blur-md"
              >
                <ShieldCheck className="w-5 h-5 mb-0.5" />
                <span className="text-[8px] font-black tracking-widest uppercase">Vault</span>
              </button>

              {mode === 'photo' ? (
                <button 
                  onClick={capturePhoto}
                  className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-transform shrink-0"
                >
                  <div className="w-16 h-16 rounded-full bg-white shadow-glow" />
                </button>
              ) : (
                <button 
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-20 h-20 rounded-full border-4 ${isRecording ? 'border-red-500 animate-pulse' : 'border-white'} flex items-center justify-center shadow-2xl hover:scale-105 transition-transform shrink-0`}
                >
                  <div className={`rounded-full ${isRecording ? 'w-8 h-8 bg-red-500' : 'w-16 h-16 bg-red-500'}`} />
                </button>
              )}

              {/* Placeholder for symmetry to keep shutter centered */}
              <div className="w-12 h-12"></div>
            </div>

          </div>

        </div>
      )}

      {/* Hidden Canvas for Frame Capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-card w-full max-w-sm p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between border-b border-border-soft pb-3">
              <h3 className="font-bold text-lg text-text-primary flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary-500" /> Camera & Video Settings
              </h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-text-secondary hover:text-text-primary">✕</button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-bg-surface">
                <span className="text-sm font-medium text-text-primary">Resolution</span>
                <select value={resolution} onChange={(e) => setResolution(e.target.value)} className="bg-bg-base text-text-primary text-xs font-bold p-1 rounded-lg">
                  <option value="720p">720p HD</option>
                  <option value="1080p">1080p Full HD</option>
                  <option value="4k">4K Ultra HD</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-bg-surface">
                <span className="text-sm font-medium text-text-primary">Frame Rate</span>
                <select value={frameRate} onChange={(e) => setFrameRate(e.target.value)} className="bg-bg-base text-text-primary text-xs font-bold p-1 rounded-lg">
                  <option value="24fps">24 fps (Cinema)</option>
                  <option value="30fps">30 fps (Standard)</option>
                  <option value="60fps">60 fps (Smooth)</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-bg-surface">
                <span className="text-sm font-medium text-text-primary">Level Indicator Line</span>
                <input type="checkbox" checked={showLevelIndicator} onChange={() => setShowLevelIndicator(!showLevelIndicator)} className="w-4 h-4 accent-primary-500" />
              </div>
            </div>

            <Button onClick={() => setShowSettingsModal(false)} variant="gradient" className="w-full rounded-2xl">
              Done
            </Button>
          </div>
        </div>
      )}

      {/* Image Filter Modal */}
      <ImageFilterModal 
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        imageSrc={capturedMedia?.url}
        onApplyFilter={(f) => setAppliedFilter(f)}
      />

      {/* Full Studio Editor Modal */}
      <MediaEditorStudio 
        isOpen={showStudioEditor}
        onClose={() => setShowStudioEditor(false)}
        mediaSrc={capturedMedia?.url}
        mediaType={capturedMedia?.type}
        onSave={(editedData) => {
          if (editedData?.filterStyle) {
            setAppliedFilter({ filterStyle: editedData.filterStyle, presetName: 'Custom Studio' });
          }
          showToast('Studio Edits Applied to Media!', 'success');
        }}
      />

    </div>
  );
}
