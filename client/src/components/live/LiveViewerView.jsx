import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { getStream } from '../../services/liveService';
import { LiveChat } from './LiveChat';
import { LiveLikes } from './LiveLikes';
import { X, Users, Wifi, AlertTriangle } from 'lucide-react';
import { Avatar } from '../ui/Avatar';

export const LiveViewerView = () => {
  const { id: streamId } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const videoRef = useRef(null);
  const peerRef = useRef(null);
  
  const [streamInfo, setStreamInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewerCount, setViewerCount] = useState(1);
  const [quality, setQuality] = useState('good'); // good, poor, disconnected

  useEffect(() => {
    const fetchStream = async () => {
      try {
        const data = await getStream(streamId);
        if (data.data.status !== 'live') {
          setError('This live stream has ended.');
        } else {
          setStreamInfo(data.data);
        }
      } catch (err) {
        setError('Stream not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchStream();
  }, [streamId]);

  useEffect(() => {
    if (!socket || !streamInfo || error) return;

    // WebRTC Signaling Logic (Viewer side)
    const initPeer = () => {
      const peer = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      peerRef.current = peer;

      peer.ontrack = (event) => {
        if (videoRef.current) {
          videoRef.current.srcObject = event.streams[0];
          setQuality('good');
        }
      };

      peer.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('webrtc-ice-candidate', {
            target: streamInfo.host._id, // Send to host
            candidate: event.candidate,
            streamId
          });
        }
      };

      peer.oniceconnectionstatechange = () => {
        if (peer.iceConnectionState === 'disconnected' || peer.iceConnectionState === 'failed') {
          setQuality('disconnected');
        } else if (peer.iceConnectionState === 'checking') {
          setQuality('poor');
        }
      };
      
      return peer;
    };

    const handleOffer = async ({ caller, offer }) => {
      const peer = peerRef.current || initPeer();
      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit('webrtc-answer', {
        target: caller,
        answer,
        streamId
      });
    };

    const handleIceCandidate = async ({ candidate }) => {
      if (peerRef.current) {
        try {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("Error adding ice candidate", e);
        }
      }
    };

    socket.on('webrtc-offer', handleOffer);
    socket.on('webrtc-ice-candidate', handleIceCandidate);

    // Join room to tell host we are here (so host sends offer)
    socket.emit('join-live', { streamId });
    setQuality('poor'); // Initial connecting state

    return () => {
      socket.off('webrtc-offer', handleOffer);
      socket.off('webrtc-ice-candidate', handleIceCandidate);
      socket.emit('leave-live', { streamId });
      if (peerRef.current) {
        peerRef.current.close();
      }
    };
  }, [socket, streamInfo, error, streamId]);

  const handleClose = () => {
    navigate('/app');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
        <h2 className="text-white text-xl font-bold mb-6">{error}</h2>
        <button onClick={handleClose} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col font-sans">
      {/* Video Stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }}
      />
      
      {/* Connecting Overlay */}
      {quality !== 'good' && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 backdrop-blur-sm">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4" />
            <p className="text-white/80 font-medium">Connecting to stream...</p>
          </div>
        </div>
      )}

      {/* Top Overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-full pl-1 pr-3 py-1">
            <Avatar src={streamInfo.host.profilePicture || streamInfo.host.avatar} className="w-8 h-8 border border-white/20" />
            <div className="flex flex-col">
              <span className="text-white text-sm font-bold leading-tight">{streamInfo.host.username}</span>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-white/80 text-[10px] font-bold uppercase tracking-wider">LIVE</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5">
            <Users className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-bold">{viewerCount}</span>
          </div>

          <div className={`p-1.5 rounded-full backdrop-blur-md ${quality === 'good' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
            <Wifi className="w-4 h-4" />
          </div>
        </div>
        
        <button 
          onClick={handleClose}
          className="p-2 bg-black/40 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Interactive Elements */}
      <LiveChat streamId={streamId} isHost={false} />
      <LiveLikes streamId={streamId} isHost={false} />
      
    </div>
  );
};
