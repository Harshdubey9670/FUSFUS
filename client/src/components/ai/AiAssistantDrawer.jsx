import { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, RefreshCw, Image as ImageIcon, Share2, Download, PlusSquare } from 'lucide-react';
import { chatAssistant, generateImage } from '../../services/aiService';
import api from '../../services/api';
import { trackEvent } from '../../utils/analytics';
import { useNavigate } from 'react-router-dom';

export const AiAssistantDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! I am your SnapGram AI Copilot.\n\nTip: You can now ask me to generate images! Start your message with "/image" or "Generate an image of...".' }
  ]);
  const navigate = useNavigate();

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    const query = input.trim();
    if (!query || loading) return;

    const newMessages = [...messages, { sender: 'user', text: query }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const isImageRequest = query.toLowerCase().startsWith('/image') || query.toLowerCase().includes('generate an image') || query.toLowerCase().includes('create an image');
      
      if (isImageRequest) {
        const cleanPrompt = query.replace('/image', '').trim() || "A beautiful cinematic shot";
        const res = await generateImage(cleanPrompt);
        if (res.success) {
           setMessages([...newMessages, { sender: 'bot', imageUrl: res.data.url, prompt: res.data.prompt }]);
        } else {
           throw new Error("Failed to generate");
        }
      } else {
        const context = window.location.pathname.startsWith('/app/chat') ? '(User is currently viewing a Chat)' : '';
        const res = await chatAssistant(`${context} ${query}`);
        setMessages([...newMessages, { sender: 'bot', text: res.data.reply }]);
      }
    } catch (err) {
      setMessages([...newMessages, { sender: 'bot', text: 'Sorry, I encountered an issue generating a response. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleShareToChat = async (imageUrl) => {
    // Check if user is currently in a chat
    const match = window.location.pathname.match(/\/app\/chat\/([a-zA-Z0-9_]+)/);
    if (match && match[1]) {
      const chatId = match[1];
      try {
        await api.post(`/api/messages/${chatId}`, {
           messageType: 'image',
           mediaUrl: imageUrl
        });
        trackEvent('ai_image_shared', 'chat');
        // Close AI drawer so they can see the chat
        setIsOpen(false);
      } catch (err) {
        alert("Failed to share to chat");
      }
    } else {
      alert("Please open a specific chat to share this image directly!");
    }
  };

  const handleCreatePost = (imageUrl, prompt) => {
    trackEvent('ai_image_shared', 'post');
    // Navigate to post creation page passing the image URL as state
    // Note: We are simulating this by redirecting with a query param for simplicity in this demo
    setIsOpen(false);
    alert("Image ready! In a full implementation, this would navigate to the Create Post screen pre-filled with this image.");
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-[88px] md:bottom-6 right-4 md:right-6 z-50 p-3.5 bg-gradient-to-r from-primary-500 via-purple-600 to-pink-500 text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center gap-2 font-bold text-xs"
        aria-label="AI Copilot Assistant"
      >
        <Sparkles className="w-5 h-5 animate-pulse" />
        <span className="hidden md:inline">AI Copilot</span>
      </button>

      {/* Floating Drawer Modal */}
      {isOpen && (
        <div className="fixed bottom-[140px] md:bottom-20 right-4 md:right-6 z-50 w-[calc(100vw-32px)] md:w-96 h-[500px] bg-bg-surface border border-border-soft rounded-3xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl animate-fade-in">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-primary-600 to-purple-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <span className="font-extrabold text-sm">SnapGram AI Copilot</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:opacity-80">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-bg-base">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2 text-xs ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'bot' && (
                  <div className="w-7 h-7 bg-primary-500/20 text-primary-500 rounded-full flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                
                {m.imageUrl ? (
                  // AI Generated Image Bubble
                  <div className="flex flex-col gap-2 max-w-[85%]">
                    <div className="rounded-2xl overflow-hidden border border-border-soft bg-bg-surface shadow-sm">
                      <img src={m.imageUrl} alt={m.prompt} className="w-full h-auto object-cover" />
                      <div className="p-2.5">
                        <p className="text-[10px] text-text-secondary italic mb-2 line-clamp-2">"{m.prompt}"</p>
                        
                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-1.5">
                          <button 
                            onClick={() => handleShareToChat(m.imageUrl)}
                            className="flex items-center justify-center gap-1.5 py-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                          >
                            <Send className="w-3 h-3" />
                            <span className="font-semibold text-[10px]">Send to Chat</span>
                          </button>
                          <button 
                            onClick={() => handleCreatePost(m.imageUrl, m.prompt)}
                            className="flex items-center justify-center gap-1.5 py-1.5 bg-bg-base border border-border-soft text-text-primary rounded-lg hover:bg-bg-surface-hover transition-colors"
                          >
                            <PlusSquare className="w-3 h-3" />
                            <span className="font-semibold text-[10px]">Create Post</span>
                          </button>
                          <a 
                            href={m.imageUrl}
                            download
                            target="_blank"
                            rel="noreferrer"
                            className="col-span-2 flex items-center justify-center gap-1.5 py-1.5 bg-bg-base border border-border-soft text-text-primary rounded-lg hover:bg-bg-surface-hover transition-colors mt-0.5"
                          >
                            <Download className="w-3 h-3" />
                            <span className="font-semibold text-[10px]">Save to Device</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Text Bubble
                  <div
                    className={`p-3 rounded-2xl max-w-[80%] leading-relaxed whitespace-pre-wrap ${
                      m.sender === 'user'
                        ? 'bg-primary-500 text-white font-medium rounded-tr-none'
                        : 'bg-bg-surface text-text-primary border border-border-soft rounded-tl-none shadow-sm'
                    }`}
                  >
                    {m.text}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-text-secondary pl-9">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary-500" />
                <span>AI is generating...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Box */}
          <form onSubmit={handleSend} className="p-3 bg-bg-surface border-t border-border-soft flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask AI or type '/image a cat'..."
              className="flex-1 px-3 py-2.5 bg-bg-base border border-border-soft rounded-xl text-xs outline-none focus:border-primary-500 placeholder:text-text-secondary/60"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl disabled:opacity-40 transition-all shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
