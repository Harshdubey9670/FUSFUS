import React from 'react';
import { Camera, Check, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';

const MessageBubble = ({ 
  msg, 
  isMine, 
  reactions, 
  reactionMenuMsgId, 
  setReactionMenuMsgId, 
  handleAddReaction, 
  setActiveSnap,
  onImageClick 
}) => {
  return (
    <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} group relative`}>
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
          } ${msg.status === 'sending' ? 'opacity-70 grayscale' : ''}`}
        >
          {/* Media Attachments */}
          {msg.messageType === 'image' && msg.mediaUrl && (
            <img 
              src={msg.mediaUrl} 
              alt="attachment" 
              onClick={() => onImageClick && onImageClick(msg.mediaUrl)}
              className="max-w-[200px] sm:max-w-[250px] rounded-xl mb-2 cursor-pointer border border-white/10 hover:opacity-90 transition-opacity" 
            />
          )}
          
          {msg.messageType === 'video' && msg.mediaUrl && (
            <video 
              src={msg.mediaUrl} 
              controls 
              className="max-w-[200px] sm:max-w-[250px] rounded-xl mb-2 bg-black/20" 
            />
          )}

          {msg.messageType === 'file' && msg.mediaUrl && (
            <a 
              href={msg.mediaUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2 rounded-lg bg-black/10 hover:bg-black/20 transition-colors mb-2 text-sm underline font-medium"
            >
              📄 Download File
            </a>
          )}

          {/* Voice Note Player */}
          {msg.messageType === 'voice' ? (
            <div className="flex items-center gap-3 pr-2">
              <audio src={msg.mediaUrl} controls className="h-8 max-w-[200px]" />
              <span className="text-xs font-mono">{msg.duration || 0}s</span>
            </div>
          ) : (
            msg.text && <p>{msg.text}</p>
          )}

          {/* Reaction Badges Overlay */}
          {reactions && reactions.length > 0 && (
            <div className="absolute -bottom-3 right-2 bg-bg-base border border-border-soft px-2 py-0.5 rounded-full text-xs flex items-center gap-1 shadow-md z-10">
              {reactions.map((r, idx) => <span key={idx}>{r}</span>)}
            </div>
          )}
        </div>
      )}

      {/* Emoji Quick Reaction Popover Menu */}
      {reactionMenuMsgId === msg._id && (
        <div className="flex items-center gap-1.5 p-2 bg-bg-base rounded-full border border-border-soft shadow-2xl my-1 animate-scaleIn z-30 relative">
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
        <span>{format(new Date(msg.createdAt || Date.now()), 'h:mm a')}</span>
        {isMine && (
          <span>
            {msg.status === 'sending' ? (
              <span className="animate-pulse">...</span>
            ) : msg.status === 'seen' ? (
              <CheckCheck className="w-3.5 h-3.5 text-blue-500 inline" />
            ) : (
              <Check className="w-3.5 h-3.5 text-text-secondary inline" />
            )}
          </span>
        )}
      </div>
    </div>
  );
};

export default React.memo(MessageBubble);
