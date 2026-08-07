import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Heart, 
  MessageCircle, 
  Grid, 
  Bookmark, 
  PlaySquare, 
  Settings, 
  Edit3, 
  Link as LinkIcon, 
  Lock, 
  Archive, 
  Pin, 
  MoreHorizontal,
  Tag
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { EditProfileModal } from '../../components/profile/EditProfileModal';
import { FollowButton } from '../../components/profile/FollowButton';
import { UserOptionsModal } from '../../components/profile/UserOptionsModal';
import { StoryHighlightsRow } from '../../components/profile/StoryHighlightsRow';
import { trackEvent } from '../../utils/analytics';
import { cn } from '../../utils/cn';

const ProfilePage = () => {
  const { id } = useParams();
  const { user: authUser } = useSelector((state) => state.auth);
  
  const targetUserId = id || authUser?._id;
  
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [activeTab, setActiveTab] = useState('posts'); 
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!targetUserId) return;
      setLoading(true);
      try {
        const response = await api.get(`/api/users/${targetUserId}`);
        if (response.data.success) {
          const profileData = response.data.data;
          setProfile(profileData);
          if (profileData._id !== authUser?._id) {
            trackEvent('profile_visit', profileData._id, { username: profileData.username });
          }
        }
      } catch (error) {
        showToast('Failed to load profile', 'error');
      } finally {
        setLoading(false);
      }
    };

    const fetchPosts = async () => {
      if (!targetUserId) return;
      setLoadingPosts(true);
      try {
        let endpoint = `/api/posts/user/${targetUserId}?status=${activeTab === 'archive' ? 'archived' : 'published'}`;
        if (activeTab === 'saved') {
          endpoint = `/api/users/saved-posts`;
        }

        const response = await api.get(endpoint);
        if (response.data.success) {
          const fetchedData = response.data.data.posts || response.data.data || [];
          setPosts(fetchedData);
        }
      } catch (error) {
        console.error('Failed to load posts for profile tab', error);
      } finally {
        setLoadingPosts(false);
      }
    };

    fetchProfile();
    fetchPosts();

    const savedPos = sessionStorage.getItem('profile_scroll_pos');
    if (savedPos) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedPos, 10));
      }, 200);
    }

    const handlePostCreated = () => {
      fetchPosts();
    };
    
    window.addEventListener('postCreated', handlePostCreated);
    return () => window.removeEventListener('postCreated', handlePostCreated);
  }, [targetUserId, authUser, activeTab, showToast]);

  const handleProfileUpdated = (updatedData) => {
    setProfile(prev => ({ ...prev, ...updatedData }));
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto mt-8 animate-pulse space-y-8">
        <div className="h-48 w-full bg-bg-surface rounded-b-3xl" />
        <div className="flex gap-8 items-start p-6">
          <div className="w-32 h-32 rounded-full bg-bg-surface-hover -mt-20 border-4 border-bg-base relative z-10" />
          <div className="flex-1 space-y-4">
            <div className="h-8 bg-bg-surface-hover rounded w-1/3" />
            <div className="flex gap-6">
              <div className="h-4 bg-bg-surface-hover rounded w-16" />
              <div className="h-4 bg-bg-surface-hover rounded w-16" />
              <div className="h-4 bg-bg-surface-hover rounded w-16" />
            </div>
            <div className="h-4 bg-bg-surface-hover rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <div className="text-center mt-20 text-text-secondary">Profile not found.</div>;
  }

  const isOwner = profile._id === authUser?._id;
  const isFollowing = authUser?.following?.includes(profile._id);
  const isLocked = profile.isPrivate && !isOwner && !isFollowing;

  // Single distinct tab array with unique icons
  const tabs = [
    { id: 'posts', label: 'Posts', icon: Grid },
    { id: 'reels', label: 'Reels', icon: PlaySquare },
    { id: 'tagged', label: 'Tagged', icon: Tag },
  ];

  if (isOwner) {
    tabs.push({ id: 'saved', label: 'Saved', icon: Bookmark });
    tabs.push({ id: 'archive', label: 'Archive', icon: Archive });
  }

  const displayedPosts = posts.filter(post => {
    if (activeTab === 'reels') return post.media?.[0]?.type === 'video';
    return true; 
  });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl mx-auto pb-20">
      
      {/* Cover Photo */}
      <div className="w-full h-24 sm:h-36 md:h-52 bg-bg-surface border-b border-border-soft overflow-hidden md:rounded-b-3xl relative">
        {profile.coverPhoto ? (
          <img src={profile.coverPhoto} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full hero-gradient opacity-20" />
        )}
      </div>

      {/* Header Section */}
      <div className="flex flex-col px-3 sm:px-6 md:px-10 mb-3 sm:mb-6 relative z-10">
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-3 sm:gap-5 md:gap-8 -mt-12 sm:-mt-16 md:-mt-24 mb-3 sm:mb-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-full p-1 hero-gradient bg-bg-base">
              <Avatar 
                src={profile.avatar || profile.profilePicture} 
                alt={profile.username} 
                className="w-full h-full border-[3px] sm:border-[4px] border-bg-base object-cover"
                fallback={profile.username?.charAt(0).toUpperCase()}
              />
            </div>
          </div>

          {/* User Info & Stats */}
          <div className="flex-1 flex flex-col items-center md:items-start pt-1 md:pt-28 w-full min-w-0">
            <div className="flex flex-col md:flex-row items-center md:gap-4 mb-3 sm:mb-5 w-full">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-text-primary flex items-center gap-2 flex-wrap justify-center md:justify-start">
                {profile.username}
                {profile.isVerified && <img src="/verified-badge.png" className="w-4 h-4 sm:w-5 sm:h-5" alt="Verified" />}
                {profile.isPrivate && <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-text-secondary" />}
              </h1>
              
              <div className="flex gap-2 mt-3 md:mt-0 w-full sm:w-auto justify-center md:justify-start">
                {isOwner ? (
                  <>
                    <Button variant="secondary" onClick={() => setIsEditModalOpen(true)} className="h-9 font-semibold text-sm flex-1 sm:flex-none">
                      Edit profile
                    </Button>
                    <Button variant="ghost" className="h-9 w-9 p-0 shrink-0" onClick={() => navigate('/app/settings')}>
                      <Settings className="w-5 h-5" />
                    </Button>
                  </>
                ) : (
                  <>
                    <FollowButton 
                      userId={profile._id} 
                      targetUser={profile}
                      onToggle={({ isFollowing }) => {
                        setProfile(prev => {
                          const newFollowers = isFollowing 
                            ? [...(prev.followers || []), authUser._id]
                            : (prev.followers || []).filter(id => id !== authUser._id);
                          return { ...prev, followers: newFollowers };
                        });
                      }} 
                    />
                    <Button variant="secondary" className="h-9 font-semibold text-sm px-3" onClick={() => setIsOptionsModalOpen(true)}>
                      <MoreHorizontal className="w-5 h-5" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex justify-around sm:justify-start gap-4 sm:gap-8 md:gap-10 w-full mb-3 sm:mb-4">
              <div className="text-center md:text-left">
                <span className="font-semibold text-text-primary text-sm sm:text-base">{posts.length}</span>
                <span className="text-text-secondary text-xs sm:text-sm ml-1">posts</span>
              </div>
              <Link to={`/app/profile/${profile._id}/followers`} className="text-center md:text-left hover:opacity-80 transition-opacity">
                <span className="font-semibold text-text-primary text-sm sm:text-base">{profile.followers?.length || 0}</span>
                <span className="text-text-secondary text-xs sm:text-sm ml-1">followers</span>
              </Link>
              <Link to={`/app/profile/${profile._id}/following`} className="text-center md:text-left hover:opacity-80 transition-opacity">
                <span className="font-semibold text-text-primary text-sm sm:text-base">{profile.following?.length || 0}</span>
                <span className="text-text-secondary text-xs sm:text-sm ml-1">following</span>
              </Link>
            </div>
            
            {/* Bio */}
            <div className="text-center md:text-left w-full max-w-lg">
              <h2 className="font-semibold text-text-primary text-sm md:text-base">
                {profile.fullName}
                {profile.pronouns && <span className="text-text-secondary font-normal ml-2 text-sm">{profile.pronouns}</span>}
              </h2>
              {profile.category && <p className="text-text-secondary text-sm mb-1">{profile.category}</p>}
              {profile.bio && <p className="text-text-primary whitespace-pre-wrap text-sm mt-1">{profile.bio}</p>}
              <StoryHighlightsRow userId={profile._id} isOwnProfile={isOwner} />
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center md:justify-start gap-1 text-primary-500 hover:text-primary-400 font-medium text-sm mt-2 transition-colors">
                  <LinkIcon className="w-3.5 h-3.5" />
                  {profile.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Tabs */}
      {!isLocked && (
        <div className="border-t border-border-soft">
          <div className="flex justify-center md:gap-12 gap-2 overflow-x-auto hide-scrollbar px-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 py-4 px-2 text-xs font-semibold tracking-widest uppercase transition-colors relative whitespace-nowrap shrink-0",
                    isActive ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{tab.label}</span>
                  {isActive && (
                    <motion.div layoutId="profileTabIndicator" className="absolute top-0 left-0 right-0 h-[1px] bg-primary-500 shadow-glow" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Posts Grid */}
          <div className="mt-4">
            {isLocked ? (
              <div className="py-16 text-center text-text-secondary flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-bg-surface-hover flex items-center justify-center mb-4">
                  <Lock className="w-8 h-8 text-text-secondary" />
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2">This account is private</h3>
                <p className="text-text-secondary text-sm max-w-sm">Follow to see their photos and videos.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 md:gap-4 px-1 md:px-0">
                {loadingPosts ? (
                  [1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="aspect-square bg-bg-surface-hover rounded-md md:rounded-xl animate-pulse" />
                  ))
                ) : displayedPosts.length > 0 ? (
                  displayedPosts.map(post => (
                    <Link 
                      key={post._id} 
                      to={`/app/post/${post._id}`} 
                      state={{ source: 'profile', userId: targetUserId }}
                      onClick={() => sessionStorage.setItem('profile_scroll_pos', window.scrollY.toString())}
                      className="aspect-square bg-bg-surface rounded-md md:rounded-xl relative overflow-hidden group cursor-pointer block"
                    >
                      {post.media && post.media.length > 0 && post.media[0].type === 'image' ? (
                        <img src={post.media[0].url} alt="Post" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : post.media && post.media.length > 0 && post.media[0].type === 'video' ? (
                        <video src={post.media[0].url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full bg-bg-surface-hover flex items-center justify-center text-text-secondary">No media</div>
                      )}
                      
                      {post.isPinned && (
                        <div className="absolute top-2 right-2 text-white bg-black/40 p-1 rounded-full backdrop-blur-sm z-10">
                          <Pin className="w-4 h-4 fill-white" />
                        </div>
                      )}
                      
                      {post.media && post.media.length > 1 && !post.isPinned && (
                        <div className="absolute top-2 right-2 text-white bg-black/40 p-1 rounded-full backdrop-blur-sm z-10">
                          <Grid className="w-4 h-4 fill-white" />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 z-20">
                        <div className="flex items-center gap-2 text-white font-semibold">
                          <Heart className="w-5 h-5 fill-white" />
                          <span>{post.settings?.hideLikes ? '-' : (post.likes?.length || 0)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white font-semibold">
                          <MessageCircle className="w-5 h-5 fill-white" />
                          <span>{post.comments?.length || 0}</span>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="col-span-3 py-16 text-center text-text-secondary border border-dashed border-border-soft rounded-2xl glass-card mx-2">
                    <Grid className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{activeTab === 'saved' ? 'No saved posts yet' : 'Nothing to show here yet'}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <EditProfileModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        user={profile}
        onProfileUpdated={handleProfileUpdated}
      />
      
      {profile && (
        <UserOptionsModal 
          isOpen={isOptionsModalOpen}
          onClose={() => setIsOptionsModalOpen(false)}
          user={profile}
          onActionComplete={() => {}}
        />
      )}
    </motion.div>
  );
};

export default ProfilePage;
