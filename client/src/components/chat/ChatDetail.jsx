import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  ArrowLeft, 
  MoreVertical, 
  Image as ImageIcon, 
  Smile, 
  Mic, 
  Send, 
  Loader2, 
  Check, 
  CheckCheck, 
  Camera, 
  Flame, 
  Clock, 
  ShieldAlert, 
  Grid, 
  Paperclip, 
  Phone, 
  Video, 
  X,
  Play,
  Pause
} from 'lucide-react';
import api from '../../services/api';
import { useSocketContext } from '../../contexts/SocketContext';
import EmojiPicker from 'emoji-picker-react';
import { format } from 'date-fns';
import { useToast } from '../ui/Toast';
import { SnapViewerModal } from './SnapViewerModal';

export default function ChatDetail() {
  const { id: conversationId } = useParams();
  const { user: authUser } = useSelector(state => state.auth);
  const { socket, onlineUsers } = useSocketContext();
  const { showToast } = useToast();
  
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState(null);
  
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [remoteTyping, setRemoteTyping] = useState(false);
  
  // Audio Voice Recording State
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const voiceTimerRef = useRef(null);

  // Snap & Media State
  const [activeSnap, setActiveSnap] = useState(null);
  const [showMediaGallery, setShowMediaGallery] = useState(false);
  const [showDisappearingSettings, setShowDisappearingSettings] = useState(false);
  const [disappearingMode, setDisappearingMode] = useState('24h'); // 'off', '24h', '7d'

  // Emoji Reactions
  const [reactionMenuMsgId, setReactionMenuMsgId] = useState(null);
  const [messageReactions, setMessageReactions] = useState({}); // { msgId: ['❤️', '🔥'] }

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const fetchChat = async () => {
      try {
        setLoading(true);
        const convRes = await api.get('/api/conversations');
        if (convRes.data.success) {
          const currentConv = convRes.data.data.find(c => c._id === conversationId);
          if (currentConv) {
            const partner = currentConv.participants.find(p => p._id !== authUser?._id);
            setOtherUser(partner);
          }
        }

        const msgRes = await api.get(`/api/messages/${conversationId}`);
        if (msgRes.data.success) {
          setMessages(msgRes.data.data);
        }
      } catch (error) {
        console.error("Error loading chat:", error);
      } finally {
        setLoading(false);
      }
    };
    if (conversationId) fetchChat();
  }, [conversationId, authUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, remoteTyping]);

  // Socket Event Listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      if (msg.conversation === conversationId) {
        setMessages(prev => [...prev, msg]);
      }
    };

    const handleTyping = (userId) => {
      if (otherUser && userId === otherUser._id) setRemoteTyping(true);
    };

    const handleStopTyping = (userId) => {
      if (otherUser && userId === otherUser._id) setRemoteTyping(false);
    };

    const handleMessagesSeen = ({ conversationId: id }) => {
      if (id === conversationId) {
        setMessages(prev => prev.map(msg => 
          msg.sender._id === authUser?._id && msg.status !== 'seen' ? { ...msg, status: 'seen' } : msg
        ));
      }
    };

    const handleScreenshotNotification = ({ takenBy, takenAt }) => {
      showToast(`📷 @${takenBy} took a screenshot of your snap!`, 'error');
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('typing', handleTyping);
    socket.on('stopTyping', handleStopTyping);
    socket.on('messagesSeen', handleMessagesSeen);
    socket.on('screenshotNotification', handleScreenshotNotification);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('typing', handleTyping);
      socket.off('stopTyping', handleStopTyping);
      socket.off('messagesSeen', handleMessagesSeen);
      socket.off('screenshotNotification', handleScreenshotNotification);
    };
  }, [socket, conversationId, otherUser]);

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    if (!socket || !otherUser) return;
    
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', otherUser._id);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('stopTyping', otherUser._id);
    }, 2000);
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim() || !otherUser) return;

    const text = newMessage;
    setNewMessage('');
    setShowEmojiPicker(false);
    
    if (socket && isTyping) {
      clearTimeout(typingTimeoutRef.current);
      setIsTyping(false);
      socket.emit('stopTyping', otherUser._id);
    }

    try {
      const res = await api.post(`/api/messages/${conversationId}`, { text });
      if (res.data.success) {
        setMessages(prev => [...prev, res.data.data]);
      }
    } catch (error) {
      showToast("Failed to send message", "error");
    }
  };

  // Voice Note Recorder
  const startVoiceRecording = async () => {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(audioStream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('image', audioBlob, `voice_${Date.now()}.webm`);

        try {
          const uploadRes = await api.post('/api/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          if (uploadRes.data.success) {
            const res = await api.post(`/api/messages/${conversationId}`, {
              messageType: 'voice',
              mediaUrl: uploadRes.data.data.url,
              duration: recordingSeconds
            });
            if (res.data.success) setMessages(prev => [...prev, res.data.data]);
          }
        } catch (e) {
          showToast('Failed to upload voice note', 'error');
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecordingVoice(true);
      setRecordingSeconds(0);

      voiceTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (e) {
      showToast('Microphone access denied', 'error');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecordingVoice) {
      mediaRecorderRef.current.stop();
      setIsRecordingVoice(false);
      if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
    }
  };

  const handleAddReaction = (msgId, emoji) => {
    setMessageReactions(prev => ({
      ...prev,
      [msgId]: [...(prev[msgId] || []), emoji]
    }));
    setReactionMenuMsgId(null);
  };

  const isOnline = otherUser ? onlineUsers?.includes(otherUser._id) : false;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-surface h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-bg-surface w-full relative">
      
      {/* Top Navigation Header */}
      <div className="h-16 border-b border-border-soft flex items-center justify-between px-4 bg-bg-base shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Link to="/app/chat" className="md:hidden p-2 -ml-2 text-text-primary hover:bg-bg-surface rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="relative">
            <img src={otherUser.profilePicture || "https://i.pravatar.cc/150"} alt="avatar" className="w-10 h-10 rounded-full object-cover border border-primary-500/30" />
            {isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-bg-base rounded-full" />}
          </div>
          <div>
            <h3 className="font-bold text-text-primary text-sm flex items-center gap-1">
              {otherUser.fullName || otherUser.username}
            </h3>
            <span className="text-[11px] text-text-secondary">
              {remoteTyping ? <span className="text-primary-500 font-bold animate-pulse">typing...</span> : isOnline ? 'Active Now' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Action Header Icons */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowDisappearingSettings(!showDisappearingSettings)}
            className={`p-2.5 rounded-full glass text-xs font-bold transition-colors flex items-center gap-1 ${disappearingMode !== 'off' ? 'text-primary-400 border border-primary-500/40' : 'text-text-secondary'}`}
            title="Disappearing Messages"
          >
            <Clock className="w-4 h-4" /> {disappearingMode}
          </button>
          <button onClick={() => setShowMediaGallery(true)} className="p-2.5 rounded-full hover:bg-bg-surface text-text-secondary hover:text-text-primary">
            <Grid className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Disappearing Messages Settings Bar */}
      {showDisappearingSettings && (
        <div className="bg-bg-base/90 p-3 border-b border-border-soft flex items-center justify-between text-xs text-text-secondary px-6 animate-fadeIn">
          <span>Disappearing Messages Auto-Delete:</span>
          <div className="flex items-center gap-2">
            {['off', '24h', '7d'].map(mode => (
              <button 
                key={mode} 
                onClick={() => setDisappearingMode(mode)}
                className={`px-3 py-1 rounded-full uppercase font-bold transition-all ${disappearingMode === mode ? 'bg-primary-500 text-white shadow-glow' : 'glass text-text-secondary'}`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isMine = msg.sender?._id === authUser?._id || msg.sender === authUser?._id;
          const reactions = messageReactions[msg._id] || [];

          return (
            <div key={msg._id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} group relative`}>
              
              {/* Snap Disappearing Message Bubble */}
              {msg.isSnap ? (
                <div 
                  onClick={() => setActiveSnap(msg)}
                  className={`cursor-pointer p-4 rounded-2xl flex items-center gap-3 shadow-lg border transition-all ${isMine ? 'bg-primary-500/20 border-primary-500/40 text-white' : 'glass-card border-white/10 text-white'}`}
                >
                  <div className="w-10 h-10 rounded-full hero-gradient flex items-center justify-center shadow-glow">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-text-primary">
                      {msg.isOpened ? 'Snap Opened' : 'Tap to View Snap'}
                    </h4>
                    <p className="text-xs text-text-secondary">
                      {msg.snapTimer || 10}s • {msg.viewMode === 'view_once' ? 'View Once' : 'Replay Once'}
                    </p>
                  </div>
                </div>
              ) : (
                /* Standard Message Bubble */
                <div 
                  onDoubleClick={() => setReactionMenuMsgId(msg._id)}
                  className={`max-w-[75%] p-3.5 rounded-2xl text-sm relative leading-relaxed ${
                    isMine 
                      ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-br-none shadow-glow' 
                      : 'bg-bg-base text-text-primary border border-border-soft rounded-bl-none shadow-sm'
                  }`}
                >
                  {/* Voice Note Player */}
                  {msg.messageType === 'voice' ? (
                    <div className="flex items-center gap-3 pr-2">
                      <audio src={msg.mediaUrl} controls className="h-8 max-w-[200px]" />
                      <span className="text-xs font-mono">{msg.duration || 0}s</span>
                    </div>
                  ) : (
                    <p>{msg.text}</p>
                  )}

                  {/* Reaction Badges Overlay */}
                  {reactions.length > 0 && (
                    <div className="absolute -bottom-3 right-2 bg-bg-base border border-border-soft px-2 py-0.5 rounded-full text-xs flex items-center gap-1 shadow-md">
                      {reactions.map((r, idx) => <span key={idx}>{r}</span>)}
                    </div>
                  )}
                </div>
              )}

              {/* Emoji Quick Reaction Popover Menu */}
              {reactionMenuMsgId === msg._id && (
                <div className="flex items-center gap-1.5 p-2 bg-bg-base rounded-full border border-border-soft shadow-2xl my-1 animate-scaleIn z-30">
                  {['❤️', '😂', '😮', '😢', '🔥', '👍'].map(emoji => (
                    <button key={emoji} onClick={() => handleAddReaction(msg._id, emoji)} className="hover:scale-125 transition-transform text-lg p-1">
                      {emoji}
                    </button>
                  ))}
                  <button onClick={() => setReactionMenuMsgId(null)} className="text-xs text-text-secondary px-1">✕</button>
                </div>
              )}

              {/* Timestamp & Read Receipts */}
              <div className="flex items-center gap-1 text-[10px] text-text-secondary mt-1 px-1">
                <span>{format(new Date(msg.createdAt), 'h:mm a')}</span>
                {isMine && (
                  <span>
                    {msg.status === 'seen' ? <CheckCheck className="w-3.5 h-3.5 text-blue-500 inline" /> : <Check className="w-3.5 h-3.5 text-text-secondary inline" />}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Voice Recording Active Bar */}
      {isRecordingVoice && (
        <div className="p-3 bg-red-500/10 border-t border-red-500/20 flex items-center justify-between text-xs text-red-500 px-6 animate-pulse">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4" /> Recording Voice Note... ({recordingSeconds}s)
          </div>
          <button onClick={stopVoiceRecording} className="font-bold text-white bg-red-500 px-3 py-1 rounded-full">
            Send Voice Note
          </button>
        </div>
      )}

      {/* Input Message & Controls Toolbar */}
      <form
        onSubmit={handleSendMessage}
        className="shrink-0 z-20 border-t border-border-soft bg-bg-base"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2.5">
          <button 
            type="button" 
            onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-text-secondary hover:text-text-primary rounded-full hover:bg-bg-surface shrink-0"
            aria-label="Emoji picker"
          >
            <Smile className="w-5 h-5" />
          </button>

          <button 
            type="button" 
            onClick={isRecordingVoice ? stopVoiceRecording : startVoiceRecording}
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-colors shrink-0 ${isRecordingVoice ? 'text-red-500 bg-red-500/10 animate-bounce' : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface'}`}
            aria-label={isRecordingVoice ? 'Stop recording' : 'Start voice note'}
          >
            <Mic className="w-5 h-5" />
          </button>

          <input 
            type="text" 
            placeholder="Send a chat or snap..."
            value={newMessage}
            onChange={handleInputChange}
            className="flex-1 min-w-0 py-2.5 px-4 rounded-full bg-bg-surface border border-border-soft text-sm text-text-primary focus:outline-none focus:border-primary-500 min-h-[44px]"
          />

          <button 
            type="submit" 
            disabled={!newMessage.trim()} 
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hero-gradient text-white disabled:opacity-40 shadow-glow shadow-primary-500/30 shrink-0"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="absolute bottom-20 left-2 right-2 sm:left-4 sm:right-auto z-50 shadow-2xl max-w-[350px]">
          <EmojiPicker onEmojiClick={(emoji) => setNewMessage(prev => prev + emoji.emoji)} width="100%" />
        </div>
      )}

      {/* Snap Viewer Modal */}
      {activeSnap && (
        <SnapViewerModal 
          snap={activeSnap} 
          onClose={() => setActiveSnap(null)} 
          onSnapExpired={(id) => setMessages(prev => prev.filter(m => m._id !== id))}
        />
      )}

      {/* Chat Media Gallery Drawer */}
      {showMediaGallery && (
        <div className="absolute inset-y-0 right-0 w-full sm:w-80 bg-bg-base border-l border-border-soft z-40 p-4 shadow-2xl flex flex-col">
          <div className="flex items-center justify-between border-b border-border-soft pb-3 mb-4">
            <h3 className="font-bold text-sm text-text-primary flex items-center gap-2">
              <Grid className="w-4 h-4 text-primary-500" /> Shared Media Gallery
            </h3>
            <button onClick={() => setShowMediaGallery(false)} className="text-text-secondary hover:text-text-primary min-w-[44px] min-h-[44px] flex items-center justify-center">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-2 gap-2">
            {messages.filter(m => m.mediaUrl).map((m, idx) => (
              <div key={idx} className="aspect-square rounded-xl overflow-hidden bg-black border border-white/5">
                {m.messageType === 'video' ? (
                  <video src={m.mediaUrl} className="w-full h-full object-cover" />
                ) : (
                  <img src={m.mediaUrl} alt="Shared media" className="w-full h-full object-cover" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
