import { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, User, RefreshCw } from 'lucide-react';
import { chatAssistant } from '../../services/aiService';

export const AiAssistantDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! I am your SnapGram AI Copilot. How can I help you optimize your content today?' }
  ]);

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
      const res = await chatAssistant(query);
      setMessages([...newMessages, { sender: 'bot', text: res.data.reply }]);
    } catch (err) {
      setMessages([...newMessages, { sender: 'bot', text: 'Sorry, I encountered an issue generating a response. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-3.5 bg-gradient-to-r from-primary-500 via-purple-600 to-pink-500 text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center gap-2 font-bold text-xs"
        aria-label="AI Copilot Assistant"
      >
        <Sparkles className="w-5 h-5 animate-pulse" />
        <span className="hidden md:inline">AI Copilot</span>
      </button>

      {/* Floating Drawer Modal */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 w-80 md:w-96 h-[480px] bg-bg-surface border border-border-soft rounded-3xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl animate-fade-in">
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
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-bg-base">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2 text-xs ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'bot' && (
                  <div className="w-7 h-7 bg-primary-500/20 text-primary-500 rounded-full flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`p-3 rounded-2xl max-w-[80%] leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-primary-500 text-white font-medium rounded-tr-none'
                      : 'bg-bg-surface text-text-primary border border-border-soft rounded-tl-none shadow-sm'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary-500" />
                <span>AI is thinking...</span>
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
              placeholder="Ask AI for ideas, captions..."
              className="flex-1 px-3 py-2 bg-bg-base border border-border-soft rounded-xl text-xs outline-none focus:border-primary-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl disabled:opacity-40 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
