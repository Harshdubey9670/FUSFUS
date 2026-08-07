import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import { Search, Edit, Circle, Loader2, Send } from 'lucide-react';
import api from '../../services/api';
import { useSocketContext } from '../../contexts/SocketContext';
import { formatDistanceToNowStrict } from 'date-fns';
import ChatDetail from '../../components/chat/ChatDetail';

const ChatPage = () => {
  const { id } = useParams();
  const { user: authUser } = useSelector(state => state.auth);
  const { onlineUsers } = useSocketContext();
  
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await api.get('/api/conversations');
        if (res.data.success) {
          setConversations(res.data.data);
        }
      } catch (error) {
        console.error("Failed to load conversations:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const lowerQuery = searchQuery.toLowerCase();
    
    return conversations.filter(conv => {
      const others = conv.participants.filter(p => p._id !== authUser?._id);
      return others.some(p => 
        p.username.toLowerCase().includes(lowerQuery) || 
        (p.fullName && p.fullName.toLowerCase().includes(lowerQuery))
      );
    });
  }, [conversations, searchQuery, authUser]);

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Sidebar: Chat List */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-border-soft bg-bg-base flex flex-col ${id ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-border-soft">
          <h1 className="text-2xl font-bold text-text-primary hero-text">Messages</h1>
          <button className="p-2 rounded-full bg-bg-surface hover:bg-bg-surface-hover text-text-primary transition-colors">
            <Edit className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input 
              type="text" 
              placeholder="Search messages..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg-surface border border-border-soft rounded-full pl-10 pr-4 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-safe-20 md:pb-0">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-text-secondary" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center p-8 text-text-secondary flex flex-col items-center">
              <p>No messages found.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {filteredConversations.map((conv) => {
                const otherParticipant = conv.participants.find(p => p._id !== authUser?._id);
                if (!otherParticipant) return null;

                const isOnline = onlineUsers?.includes(otherParticipant._id);
                const lastMsg = conv.latestMessage;
                
                let isUnread = false;
                if (lastMsg) {
                  isUnread = lastMsg.sender._id !== authUser?._id && lastMsg.status !== 'seen';
                }

                let timeStr = '';
                if (lastMsg) {
                  try {
                    timeStr = formatDistanceToNowStrict(new Date(lastMsg.createdAt), { addSuffix: false });
                    timeStr = timeStr.replace(/ seconds?/, 's').replace(/ minutes?/, 'm').replace(/ hours?/, 'h').replace(/ days?/, 'd').replace(/ months?/, 'mo').replace(/ years?/, 'y');
                  } catch (e) {
                    timeStr = '';
                  }
                }

                return (
                  <Link 
                    key={conv._id} 
                    to={`/app/chat/${conv._id}`}
                    className="flex items-center gap-3 p-4 hover:bg-bg-surface-hover transition-colors cursor-pointer group"
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-14 h-14 rounded-full overflow-hidden border border-border-soft group-hover:border-primary-500/50 transition-colors">
                        <img 
                          src={otherParticipant.profilePicture || "https://i.pravatar.cc/150"} 
                          alt={otherParticipant.username}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {isOnline && (
                        <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-green-500 border-2 border-bg-base" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className={`truncate text-[15px] ${isUnread ? 'font-bold text-text-primary' : 'font-semibold text-text-primary'}`}>
                          {otherParticipant.fullName || otherParticipant.username}
                        </h3>
                        {timeStr && (
                          <span className="text-xs text-text-secondary shrink-0 ml-2">{timeStr}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className={`truncate text-sm ${isUnread ? 'font-bold text-text-primary' : 'text-text-secondary'}`}>
                          {lastMsg ? (
                            lastMsg.isDeleted ? (
                              <span className="italic text-text-secondary/70">Message deleted</span>
                            ) : lastMsg.messageType === 'text' ? (
                              lastMsg.text
                            ) : (
                              <span className="capitalize">Sent a {lastMsg.messageType}</span>
                            )
                          ) : (
                            <span className="italic">Start a conversation</span>
                          )}
                        </p>
                        {isUnread && (
                          <Circle className="w-2.5 h-2.5 fill-primary-500 text-primary-500 shrink-0 ml-2 shadow-sm" />
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex-col bg-bg-surface border-l border-border-soft relative ${id ? 'flex' : 'hidden md:flex'}`}>
        {id ? (
          <ChatDetail />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-24 h-24 rounded-full border-2 border-text-primary flex items-center justify-center mb-4 text-text-primary bg-bg-base shadow-xl">
              <Send className="w-10 h-10 ml-2" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Your Messages</h2>
            <p className="text-text-secondary text-sm">Send private photos and messages to a friend.</p>
            <button className="mt-6 px-6 py-2 rounded-full hero-gradient text-white font-bold text-sm hover:scale-105 transition-transform shadow-lg">
              Send Message
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
