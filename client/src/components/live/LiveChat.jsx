import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useSocket } from "../../contexts/SocketContext";
import { Send } from "lucide-react";

export const LiveChat = ({ streamId, isHost }) => {
  const { socket } = useSocket();
  const { user } = useSelector((state) => state.auth);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      setMessages((prev) => [...prev, message]);
    };

    socket.on('live-chat-message', handleNewMessage);

    return () => {
      socket.off('live-chat-message', handleNewMessage);
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || !socket) return;

    // Emit live chat event to server
    socket.emit('live-chat-message', { streamId, text });

    setInputText("");
  };

  return (
    <div className="absolute bottom-20 left-4 right-4 max-w-sm h-72 flex flex-col pointer-events-auto z-40">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col justify-end space-y-2 mb-3">
        {messages.map((msg, idx) => (
          <div key={idx} className="flex flex-col animate-fade-in">
            <div className="inline-flex items-start bg-black/60 backdrop-blur-md rounded-2xl px-3 py-1.5 w-fit max-w-[90%] border border-white/10 shadow-lg">
              <span className="font-bold text-primary-400 mr-2 text-xs">
                {msg.user?.username || msg.username || user?.username || "Viewer"}
              </span>
              <span className="text-white text-xs break-words">{msg.text}</span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Comment Input Box */}
      <form onSubmit={handleSend} className="relative flex items-center gap-2">
        <input
          type="text"
          placeholder="Add a comment..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 bg-black/60 backdrop-blur-md text-white placeholder-white/60 border border-white/30 rounded-full px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/80 shadow-lg"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2.5 bg-gradient-to-r from-primary-500 to-purple-600 rounded-full text-white disabled:opacity-40 transition-all flex-shrink-0 shadow-lg active:scale-95"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
