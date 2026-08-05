import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Loader2, Search, ArrowLeft, Users, X, UserPlus, Sparkles, Star, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { cn } from '../../utils/cn';

export default function NetworkPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser } = useSelector((state) => state.auth);
  const { toast } = useToast();

  const isOwner = authUser?._id === id || !id;
  const targetUserId = id || authUser?._id;

  const [activeTab, setActiveTab] = useState("followers"); // followers, following, quickadd, mutuals
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Quick Add Recommendations State
  const [quickAddList, setQuickAddList] = useState([]);

  useEffect(() => {
    fetchNetworkData();
  }, [activeTab, targetUserId]);

  const fetchNetworkData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'followers') {
        const res = await api.get(`/api/users/${targetUserId}/followers`);
        if (res.data.success) setUsers(res.data.data || []);
      } else if (activeTab === 'following') {
        const res = await api.get(`/api/users/${targetUserId}/following`);
        if (res.data.success) setUsers(res.data.data || []);
      } else if (activeTab === 'quickadd') {
        // Quick Add Recommendations (Based on mutual friends & interests)
        const res = await api.get(`/api/users/recommendations/quick-add`);
        if (res.data.success) setQuickAddList(res.data.data || []);
      } else if (activeTab === 'mutuals') {
        const res = await api.get(`/api/users/${targetUserId}/mutual-followers`);
        if (res.data.success) setUsers(res.data.data || []);
      }
    } catch (err) {
      console.error("Network fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdd = async (userId) => {
    try {
      await api.post(`/api/users/${userId}/follow`);
      toast({ variant: 'success', title: 'Friend Request Sent!', description: 'Added user to your Snapchat network.' });
      setQuickAddList(prev => prev.filter(u => u._id !== userId));
    } catch (err) {
      toast({ variant: 'error', title: 'Failed to add friend' });
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto pb-20 pt-4 px-4 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between glass-card p-4 rounded-2xl border border-white/10">
        <button onClick={() => navigate(-1)} className="text-text-secondary hover:text-text-primary transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-text-primary hero-text">Friends & Network</h1>
        <div className="w-6" />
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex justify-center gap-2 border-b border-border-soft pb-2 overflow-x-auto scrollbar-none">
        {[
          { id: 'followers', label: 'Friends' },
          { id: 'following', label: 'Following' },
          { id: 'quickadd', label: '⚡ Quick Add', isHighlight: true },
          { id: 'mutuals', label: 'Mutual Friends' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? tab.isHighlight ? 'hero-gradient text-white shadow-glow' : 'bg-primary-500/10 text-primary-400 border border-primary-500/30'
                : 'text-text-secondary hover:bg-bg-surface'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Quick Add Recommendations View */}
      {activeTab === 'quickadd' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-text-primary flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary-500" /> Snapchat Quick Add
            </h3>
            <span className="text-xs text-text-secondary">Based on mutual friends & interests</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickAddList.map((usr) => (
              <div key={usr._id} className="p-4 rounded-2xl glass-card border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar src={usr.profilePicture} className="w-12 h-12 border border-primary-500" />
                  <div>
                    <h4 className="font-bold text-sm text-text-primary">@{usr.username}</h4>
                    <p className="text-xs text-text-secondary truncate">{usr.fullName || 'Suggested Creator'}</p>
                    <span className="text-[10px] text-primary-400 font-semibold">✨ {usr.mutualCount || 3} Mutual Friends</span>
                  </div>
                </div>
                <button 
                  onClick={() => handleQuickAdd(usr._id)}
                  className="px-4 py-2 rounded-xl hero-gradient text-white font-bold text-xs shadow-glow hover:scale-105 transition-transform"
                >
                  + Add
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Standard Friends List */
        <div className="space-y-3">
          {loading ? (
            <div className="py-20 text-center text-text-secondary">Loading friends network...</div>
          ) : (
            users.map((usr) => (
              <div key={usr._id} className="p-4 rounded-2xl glass-card border border-white/10 flex items-center justify-between">
                <Link to={`/app/profile/${usr._id}`} className="flex items-center gap-3">
                  <Avatar src={usr.profilePicture} className="w-12 h-12 border border-primary-500" />
                  <div>
                    <h4 className="font-bold text-sm text-text-primary">@{usr.username}</h4>
                    <p className="text-xs text-text-secondary">{usr.fullName || 'InstaSnap User'}</p>
                  </div>
                </Link>
                <Link to={`/app/chat/${usr._id}`} className="px-4 py-2 rounded-xl glass text-xs font-bold text-primary-400 border border-primary-500/30">
                  Chat / Snap
                </Link>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
}
