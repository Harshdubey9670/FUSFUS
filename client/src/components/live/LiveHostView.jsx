import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useSocket } from '../../contexts/SocketContext';
import { startLiveStream, endLiveStream } from '../../services/liveService';
import { LiveChat } from './LiveChat';
import { LiveLikes } from './LiveLikes';
import { X, Users, Video, Mic, MicOff, VideoOff, Settings } from 'lucide-react';

export const LiveHostView = () => {
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const { socket } = useSocket();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const peersRef = useRef({}); // Store peer connections
  
  const [streamId, setStreamId] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  useEffect(() => {
    // 1. Get user media
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Camera access denied or unavailable", error);
        alert("Camera access is required to go live.");
        navigate('/app');
      }
    };
    initCamera();

    return () => {
      // Cleanup camera
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      // End stream if component unmounts
      if (streamId) {
        handleEndStream();
      }
    };
  }, []);

  useEffect(() => {
    if (!socket || !isLive || !streamId) return;

    // WebRTC Signaling Logic (Host side)
    const handleViewerJoined = async ({ viewerId }) => {
      setViewerCount(prev => prev + 1);
      
      // Create new peer connection for this viewer (Mesh topology)
      const peer = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      peersRef.current[viewerId] = peer;

      // Add local stream tracks to peer
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          peer.addTrack(track, streamRef.current);
        });
      }

      peer.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('webrtc-ice-candidate', {
            target: viewerId,
            candidate: event.candidate,
            streamId
          });
        }
      };

      try {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit('webrtc-offer', {
          target: viewerId,
          offer,
          streamId
        });
      } catch (e) {
        console.error("Error creating offer", e);
      }
    };

    const handleViewerLeft = ({ viewerId }) => {
      setViewerCount(prev => Math.max(0, prev - 1));
      if (peersRef.current[viewerId]) {
        peersRef.current[viewerId].close();
        delete peersRef.current[viewerId];
      }
    };

    const handleAnswer = async ({ caller, answer }) => {
      const peer = peersRef.current[caller];
      if (peer) {
        await peer.setRemoteDescription(new RTCSessionDescription(answer));
      }
    };

    const handleIceCandidate = async ({ caller, candidate }) => {
      const peer = peersRef.current[caller];
      if (peer) {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };

    socket.on('viewer-joined', handleViewerJoined);
    socket.on('viewer-left', handleViewerLeft);
    socket.on('webrtc-answer', handleAnswer);
    socket.on('webrtc-ice-candidate', handleIceCandidate);

    return () => {
      socket.off('viewer-joined', handleViewerJoined);
      socket.off('viewer-left', handleViewerLeft);
      socket.off('webrtc-answer', handleAnswer);
      socket.off('webrtc-ice-candidate', handleIceCandidate);
    };
  }, [socket, isLive, streamId]);

  const handleGoLive = async () => {
    try {
      const data = await startLiveStream(`${user.username}'s Live Stream`);
      setStreamId(data.data._id);
      setIsLive(true);
      if (socket) {
        socket.emit('join-live', { streamId: data.data._id }); // Host joins their own room to receive chat
      }
    } catch (error) {
      console.error("Failed to start stream", error);
      alert("Failed to start stream");
    }
  };

  const handleEndStream = async () => {
    if (streamId) {
      await endLiveStream(streamId);
      if (socket) {
        socket.emit('leave-live', { streamId });
      }
    }
    
    Object.values(peersRef.current).forEach(peer => peer.close());
    peersRef.current = {};
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    navigate('/app');
  };

  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(t => t.enabled = !t.enabled);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(t => t.enabled = !t.enabled);
      setIsVideoOff(!isVideoOff);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col font-sans">
      {/* Video Background */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted // Mute local playback to avoid echo
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }} // Mirror effect
      />

      {/* Top Overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5">
            {isLive ? (
              <>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-white text-sm font-bold tracking-wide">LIVE</span>
                <span className="text-white/60 text-xs ml-1 font-mono">00:00</span>
              </>
            ) : (
              <span className="text-white/80 text-sm font-semibold">PREVIEW</span>
            )}
          </div>
          {isLive && (
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5">
              <Users className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-bold">{viewerCount}</span>
            </div>
          )}
        </div>
        
        <button 
          onClick={handleEndStream}
          className="p-2 bg-black/40 hover:bg-red-500/80 backdrop-blur-md rounded-full text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Middle/Bottom Content */}
      {isLive ? (
        <>
          <LiveChat streamId={streamId} isHost={true} />
          <LiveLikes streamId={streamId} isHost={true} />
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
          <div className="bg-black/40 backdrop-blur-xl p-8 rounded-3xl flex flex-col items-center pointer-events-auto shadow-2xl border border-white/10">
            <div className="w-20 h-20 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
              <Video className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-white text-2xl font-bold mb-2 tracking-tight">Ready to go live?</h2>
            <p className="text-white/70 text-center max-w-xs mb-8 text-sm">
              Your followers will be notified when you start your live stream.
            </p>
            <button
              onClick={handleGoLive}
              className="w-full bg-gradient-to-r from-primary-500 to-purple-600 hover:from-primary-600 hover:to-purple-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-primary-500/25 active:scale-95"
            >
              Go Live Now
            </button>
          </div>
        </div>
      )}

      {/* Host Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between z-20 pb-safe">
        <div className="flex items-center gap-4">
          <button onClick={toggleMute} className={`p-4 rounded-full backdrop-blur-md transition-all ${isMuted ? 'bg-red-500/80 text-white' : 'bg-black/40 text-white hover:bg-black/60'}`}>
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
          <button onClick={toggleVideo} className={`p-4 rounded-full backdrop-blur-md transition-all ${isVideoOff ? 'bg-red-500/80 text-white' : 'bg-black/40 text-white hover:bg-black/60'}`}>
            {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </button>
        </div>
        <button className="p-4 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white transition-all">
          <Settings className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
