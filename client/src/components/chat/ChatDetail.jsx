import { useState, useEffect, useRef, useCallback } from 'react';
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
import { format, formatDistanceToNow } from 'date-fns';
import { useToast } from '../ui/Toast';
import { SnapViewerModal } from './SnapViewerModal';
import { ConversationPresenceAvatar } from './ConversationPresenceAvatar';
import MessageBubble from './MessageBubble';
import { ImageViewerModal } from './ImageViewerModal';

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
  const [isOtherUserPresent, setIsOtherUserPresent] = useState(false);
  
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
  
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [activeImage, setActiveImage] = useState(null);

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
    if (!socket || !conversationId) return;

    // Join conversation room for presence
    socket.emit('joinConversation', conversationId);

    const handleNewMessage = (msg) => {
      const msgConvId = typeof msg.conversation === 'object' ? (msg.conversation._id || msg.conversation.toString()) : msg.conversation;
      if (msgConvId === conversationId) {
        setMessages(prev => {
          // Socket Deduping: only check clientMessageId if it exists
          if (prev.some(m => m._id === msg._id || (msg.clientMessageId && m.clientMessageId === msg.clientMessageId))) return prev;
          return [...prev, msg];
        });
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

    const handleChatScreenshotNotification = ({ takenBy }) => {
      showToast(`📷 @${takenBy} took a screenshot of this chat!`, 'error');
    };

    const handlePresenceUpdate = (userIds) => {
      if (otherUser && userIds.includes(otherUser._id)) {
        setIsOtherUserPresent(true);
      } else {
        setIsOtherUserPresent(false);
      }
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('typing', handleTyping);
    socket.on('stopTyping', handleStopTyping);
    socket.on('messagesSeen', handleMessagesSeen);
    socket.on('screenshotNotification', handleScreenshotNotification);
    socket.on('chatScreenshotNotification', handleChatScreenshotNotification);
    socket.on('conversationPresenceUpdate', handlePresenceUpdate);

    return () => {
      socket.emit('leaveConversation', conversationId);
      socket.off('newMessage', handleNewMessage);
      socket.off('typing', handleTyping);
      socket.off('stopTyping', handleStopTyping);
      socket.off('messagesSeen', handleMessagesSeen);
      socket.off('screenshotNotification', handleScreenshotNotification);
      socket.off('chatScreenshotNotification', handleChatScreenshotNotification);
      socket.off('conversationPresenceUpdate', handlePresenceUpdate);
    };
  }, [socket, conversationId, otherUser]);

  // Global Chat Screenshot Detection
  useEffect(() => {
    if (!socket || !otherUser) return;

    const handleKeyDown = (e) => {
      const isMacScreenshot = e.metaKey && e.shiftKey && ['3', '4', '5', 's'].includes(e.key.toLowerCase());
      if (e.key === 'PrintScreen' || isMacScreenshot) {
        // Assuming user has screenshot detection enabled if they are chatting,
        // (Realistically we would check user settings here, but sending the event is safe)
        socket.emit('chatScreenshot', { conversationId, receiverId: otherUser._id });
        showToast("Screenshot captured! Sender may be notified.", "warning");
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        socket.emit('chatScreenshot', { conversationId, receiverId: otherUser._id });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [socket, otherUser, conversationId]);

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

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if ((!newMessage.trim() && selectedFiles.length === 0) || !otherUser) return;

    const text = newMessage;
    const currentFiles = [...selectedFiles];
    
    setNewMessage('');
    setSelectedFiles([]);
    setShowEmojiPicker(false);
    
    if (socket && isTyping) {
      clearTimeout(typingTimeoutRef.current);
      setIsTyping(false);
      socket.emit('stopTyping', otherUser._id);
    }

    // Handle File Uploads first if any
    let uploadedMediaUrl = null;
    let messageType = 'text';

    if (currentFiles.length > 0) {
      setIsUploading(true);
      const file = currentFiles[0]; // For simplicity, handle one file per message for now
      const formData = new FormData();
      formData.append('image', file); // the backend expects 'image' for upload route

      if (file.type.startsWith('image/')) messageType = 'image';
      else if (file.type.startsWith('video/')) messageType = 'video';
      else messageType = 'file';

      try {
        const uploadRes = await api.post('/api/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (uploadRes.data.success) {
          uploadedMediaUrl = uploadRes.data.url;
        }
      } catch (err) {
        console.error("Upload error", err);
        showToast("Failed to upload file", "error");
        setIsUploading(false);
        return; // Stop if upload fails
      }
      setIsUploading(false);
    }

    // Optimistic UI update
    const clientMessageId = `temp-${Date.now()}`;
    const optimisticMessage = {
      _id: clientMessageId,
      clientMessageId,
      conversation: conversationId,
      sender: authUser,
      text,
      mediaUrl: uploadedMediaUrl,
      messageType,
      status: 'sending',
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const res = await api.post(`/api/messages/${conversationId}`, { 
        text, 
        mediaUrl: uploadedMediaUrl, 
        messageType,
        clientMessageId
      });
      if (res.data.success) {
        // Replace optimistic message with real message
        setMessages(prev => prev.map(m => m.clientMessageId === clientMessageId ? res.data.data : m));
      }
    } catch (error) {
      showToast("Failed to send message", "error");
      setMessages(prev => prev.map(m => m.clientMessageId === clientMessageId ? { ...m, status: 'failed' } : m));
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

  const handleAddReaction = useCallback((msgId, emoji) => {
    setMessageReactions(prev => ({
      ...prev,
      [msgId]: [...(prev[msgId] || []), emoji]
    }));
    setReactionMenuMsgId(null);
  }, []);

  const isOnline = otherUser ? onlineUsers?.includes(otherUser._id) : false;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-surface h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-bg-surface w-full relative overflow-hidden">
      
      {/* Top Navigation Header */}
      <div className="h-16 border-b border-border-soft flex items-center justify-between px-4 bg-bg-base shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Link to="/app/chat" className="md:hidden p-2 -ml-2 text-text-primary hover:bg-bg-surface rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Link to={`/app/profile/${otherUser?._id}`} className="relative group shrink-0">
            <img src={otherUser?.profilePicture || "https://i.pravatar.cc/150"} alt="avatar" className="w-10 h-10 rounded-full object-cover border border-primary-500/30 group-hover:opacity-80 transition-opacity" />
            {isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-bg-base rounded-full" />}
          </Link>
          <div>
            <Link to={`/app/profile/${otherUser?._id}`} className="font-bold text-text-primary text-sm flex items-center gap-1 hover:underline">
              {otherUser?.fullName || otherUser?.username}
            </Link>
            <span className="text-[11px] text-text-secondary flex items-center h-4">
              {remoteTyping ? (
                <span className="text-primary-500 font-bold flex items-center gap-0.5">
                  <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                </span>
              ) : isOnline ? (
                'Active Now'
              ) : (
                otherUser?.lastSeen ? `Active ${formatDistanceToNow(new Date(otherUser.lastSeen))} ago` : 'Offline'
              )}
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
        {messages.map((msg) => (
          <MessageBubble 
            key={msg.clientMessageId || msg._id}
            msg={msg}
            isMine={
              msg.sender?._id?.toString() === authUser?._id?.toString() || 
              msg.sender?.toString() === authUser?._id?.toString() ||
              msg.sender === authUser?._id
            }
            reactions={messageReactions[msg._id] || []}
            reactionMenuMsgId={reactionMenuMsgId}
            setReactionMenuMsgId={setReactionMenuMsgId}
            handleAddReaction={handleAddReaction}
            setActiveSnap={setActiveSnap}
            onImageClick={setActiveImage}
          />
        ))}
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


      {/* Media Staging Area */}
      {selectedFiles.length > 0 && (
        <div className="bg-bg-surface border-t border-border-soft p-3 flex gap-3 overflow-x-auto">
          {selectedFiles.map((file, idx) => (
            <div key={idx} className="relative shrink-0">
              <div className="w-16 h-16 bg-bg-base border border-border-soft rounded-lg flex items-center justify-center text-xs overflow-hidden">
                {file.type.startsWith('image/') ? (
                  <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="preview" />
                ) : file.type.startsWith('video/') ? (
                  <Video className="w-6 h-6 text-primary-500" />
                ) : (
                  <span className="truncate max-w-[50px] p-1">{file.name}</span>
                )}
              </div>
              <button 
                type="button"
                onClick={() => removeSelectedFile(idx)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:scale-110 transition-transform"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Message & Controls Toolbar */}
      <form
        onSubmit={handleSendMessage}
        className="shrink-0 z-20 border-t border-border-soft bg-bg-base relative"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Snapchat-Style Real-time Presence Avatar */}
        <div className="absolute bottom-full left-0 w-full pointer-events-none">
          <ConversationPresenceAvatar 
            otherUser={otherUser} 
            isPresent={isOtherUserPresent} 
            isTyping={remoteTyping} 
          />
        </div>
        {isUploading && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-bg-surface overflow-hidden">
            <div className="h-full bg-primary-500 animate-pulse w-full"></div>
          </div>
        )}
        <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2.5">
          <label className="min-w-[44px] min-h-[44px] flex items-center justify-center text-text-secondary hover:text-text-primary rounded-full hover:bg-bg-surface shrink-0 cursor-pointer">
            <Paperclip className="w-5 h-5" />
            <input 
              type="file" 
              multiple 
              className="hidden" 
              onChange={handleFileSelect}
              accept="image/*,video/*,.pdf,.doc,.docx,.txt"
            />
          </label>

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
            disabled={(!newMessage.trim() && selectedFiles.length === 0) || isUploading} 
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hero-gradient text-white disabled:opacity-40 shadow-glow shadow-primary-500/30 shrink-0"
            aria-label="Send message"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
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

      {/* Full Screen Image Viewer Modal */}
      <ImageViewerModal src={activeImage} onClose={() => setActiveImage(null)} />
    </div>
  );
}
