import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Bell, Loader2, AtSign, Heart, UserPlus, MessageCircle, CheckCheck, Send, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar } from "../../components/ui/Avatar";
import { clearUnreadCount } from "../../store/authSlice";
import api from "../../services/api";

const notificationIcon = (type) => {
  switch (type) {
    case "mention":  return <AtSign className="w-4 h-4 text-sky-400" />;
    case "tag":      return <AtSign className="w-4 h-4 text-sky-400" />;
    case "like":     return <Heart className="w-4 h-4 text-red-400 fill-red-400" />;
    case "follow":   
    case "accept_request":
    case "follow_request": return <UserPlus className="w-4 h-4 text-green-400" />;
    case "comment":  
    case "reply":    return <MessageCircle className="w-4 h-4 text-primary-500" />;
    case "story_reply": 
    case "story":
    case "reel":     return <Send className="w-4 h-4 text-primary-500" />;
    case "save":     return <Heart className="w-4 h-4 text-yellow-400 fill-yellow-400" />;
    case "system":   return <Bell className="w-4 h-4 text-primary-500" />;
    default:         return <Bell className="w-4 h-4 text-text-secondary" />;
  }
};

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
};

// Group notifications of the same type on the same post
const groupNotifications = (notifications) => {
  const grouped = [];
  
  notifications.forEach(notif => {
    // We only group likes, comments, mentions that share the exact same post.
    // Follows could be grouped by type alone, but usually we just want to group post-related ones.
    const canGroup = notif.post?._id && ["like", "comment", "mention"].includes(notif.type);
    
    if (!canGroup) {
      grouped.push({ ...notif, senders: [notif.sender], _id: notif._id });
      return;
    }

    // Check if the very last grouped item matches this one
    const lastGroup = grouped[grouped.length - 1];
    if (lastGroup && lastGroup.type === notif.type && lastGroup.post?._id === notif.post?._id) {
      // It matches, add sender if not already in the group (avoid duplicates if user liked twice somehow)
      if (!lastGroup.senders.some(s => s._id === notif.sender._id)) {
        lastGroup.senders.push(notif.sender);
      }
      // If any of the grouped notifs are unread, mark the group as unread
      if (!notif.read) lastGroup.read = false;
      // Keep the most recent timestamp (assuming they are sorted desc, so lastGroup already has it)
      // Store all IDs so we can mark them all as read or delete them together if needed
      if (!lastGroup.ids) lastGroup.ids = [lastGroup._id];
      lastGroup.ids.push(notif._id);
    } else {
      // Doesn't match, start new group
      grouped.push({ ...notif, senders: [notif.sender], ids: [notif._id] });
    }
  });

  return grouped;
};

// Format grouped text
const formatGroupedText = (senders, type) => {
  const count = senders.length;
  let names = "";
  
  if (count === 1) {
    names = <Link to={`/app/profile/${senders[0]?._id}`} className="font-bold hover:underline">{senders[0]?.username}</Link>;
  } else if (count === 2) {
    names = (
      <>
        <Link to={`/app/profile/${senders[0]?._id}`} className="font-bold hover:underline">{senders[0]?.username}</Link>
        {" and "}
        <Link to={`/app/profile/${senders[1]?._id}`} className="font-bold hover:underline">{senders[1]?.username}</Link>
      </>
    );
  } else {
    names = (
      <>
        <Link to={`/app/profile/${senders[0]?._id}`} className="font-bold hover:underline">{senders[0]?.username}</Link>
        {", "}
        <Link to={`/app/profile/${senders[1]?._id}`} className="font-bold hover:underline">{senders[1]?.username}</Link>
        {` and ${count - 2} other${count - 2 > 1 ? 's' : ''}`}
      </>
    );
  }

  let action = "";
  switch (type) {
    case "mention": action = "mentioned you in a post"; break;
    case "tag": action = "tagged you in a post"; break;
    case "like": action = "liked your post"; break;
    case "follow": action = "started following you"; break;
    case "follow_request": action = "requested to follow you"; break;
    case "accept_request": action = "accepted your follow request"; break;
    case "comment": action = "commented on your post"; break;
    case "reply": action = "replied to your comment"; break;
    case "story_reply": action = "replied to your story"; break;
    case "story": action = "mentioned you in their story"; break;
    case "reel": action = "shared a reel with you"; break;
    case "save": action = "saved your post"; break;
    case "system": action = "System update:"; break;
    default: action = "sent you a notification"; break;
  }

  return <span>{names} {action}</span>;
};


const NotificationsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [followRequests, setFollowRequests] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Pagination / Infinite Scroll
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);
  
  const observer = useRef();
  const lastNotificationRef = useCallback(node => {
    if (loading || fetchingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, fetchingMore, hasMore]);

  // Initial fetch
  useEffect(() => {
    dispatch(clearUnreadCount());
    fetchNotifications(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch more when page changes
  useEffect(() => {
    if (page > 1) {
      fetchNotifications(page);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const fetchFollowRequests = async () => {
    try {
      const res = await api.get('/api/users/follow-requests');
      if (res.data.success) {
        setFollowRequests(res.data.data);
      }
    } catch (e) {
      console.error("Failed to fetch follow requests", e);
    }
  };

  const handleAcceptRequest = async (id) => {
    try {
      await api.post(`/api/users/follow-requests/${id}/accept`);
      setFollowRequests(prev => prev.filter(r => r._id !== id));
    } catch (e) {
      console.error("Failed to accept request", e);
    }
  };

  const handleDeclineRequest = async (id) => {
    try {
      await api.post(`/api/users/follow-requests/${id}/decline`);
      setFollowRequests(prev => prev.filter(r => r._id !== id));
    } catch (e) {
      console.error("Failed to decline request", e);
    }
  };

  const fetchNotifications = async (pageNum) => {
    pageNum === 1 ? setLoading(true) : setFetchingMore(true);
    try {
      if (pageNum === 1) {
        fetchFollowRequests();
      }
      const res = await api.get(`/api/notifications?page=${pageNum}&limit=15`);
      if (res.data.success) {
        if (pageNum === 1) {
          setNotifications(res.data.data);
        } else {
          setNotifications(prev => [...prev, ...res.data.data]);
        }
        setUnreadCount(res.data.unreadCount);
        setHasMore(res.data.pagination.hasMore);
      }
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    } finally {
      setLoading(false);
      setFetchingMore(false);
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    setMarkingRead(true);
    try {
      await api.put("/api/notifications/read-all");
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error("Failed to mark notifications as read", e);
    } finally {
      setMarkingRead(false);
    }
  };

  const handleMarkOneRead = async (e, id) => {
    e.stopPropagation();
    try {
      await api.put(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error("Failed to mark as read", e);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await api.delete(`/api/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (e) {
      console.error("Failed to delete notification", e);
    }
  };

  const handleNotificationClick = async (notif) => {
    // If grouped, we just mark the primary one as read for now, or all of them if we mapped them
    const idsToMark = notif.ids || [notif._id];
    
    if (!notif.read) {
      // Optimistically update
      setNotifications(prev => prev.map(n => idsToMark.includes(n._id) ? { ...n, read: true } : n));
      // Mark read in background
      Promise.all(idsToMark.map(id => api.put(`/api/notifications/${id}/read`))).catch(()=>console.error('Failed to mark read'));
    }

    // Navigate
    if (notif.post) {
      // We don't have a specific single post page built yet, so go to user's profile where post is or explore
      navigate(`/app/profile/${notif.sender._id}`); 
    } else if (notif.type === "follow") {
      navigate(`/app/profile/${notif.sender._id}`);
    }
  };

  const groupedNotifications = groupNotifications(notifications);

  return (
    <div className="w-full max-w-2xl mx-auto pt-3 sm:pt-4 pb-safe-20 lg:pb-8 px-0 sm:px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 sticky top-[4.5rem] md:top-4 z-10 bg-bg-base/80 backdrop-blur-xl pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl hero-gradient">
            <Bell className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-xs text-primary-500 font-medium">{unreadCount} unread</p>
            )}
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingRead}
            className="flex items-center gap-1.5 text-sm font-semibold text-primary-500 hover:text-primary-400 transition-colors disabled:opacity-50 bg-primary-500/10 px-3 py-1.5 rounded-full"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {/* Follow Requests Section */}
      {followRequests.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-3 px-2">Follow Requests</h2>
          <div className="glass-card divide-y divide-border-soft rounded-2xl overflow-hidden shadow-sm">
            {followRequests.map(req => (
              <div key={req._id} className="flex items-center justify-between p-4 bg-bg-surface-hover">
                <Link to={`/app/profile/${req._id}`} className="flex items-center gap-3">
                  <Avatar src={req.profilePicture || req.avatar} fallback={req.username.charAt(0)} className="w-10 h-10 border-2 border-bg-surface" />
                  <div>
                    <p className="font-bold text-text-primary text-sm">{req.username}</p>
                    <p className="text-xs text-text-secondary">{req.fullName || 'Requested to follow you'}</p>
                  </div>
                </Link>
                <div className="flex gap-2">
                  <button onClick={() => handleAcceptRequest(req._id)} className="px-4 py-1.5 bg-primary-500 text-white text-sm font-semibold rounded-lg hover:bg-primary-600 transition-colors">
                    Confirm
                  </button>
                  <button onClick={() => handleDeclineRequest(req._id)} className="px-4 py-1.5 bg-bg-surface border border-border-soft text-text-primary text-sm font-semibold rounded-lg hover:bg-bg-surface-hover transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {loading && page === 1 ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : groupedNotifications.length === 0 ? (
        <div className="text-center py-24 bg-bg-surface rounded-2xl border border-border-soft">
          <Bell className="w-12 h-12 text-text-secondary mx-auto mb-3" />
          <p className="font-semibold text-text-primary">No notifications yet</p>
          <p className="text-sm text-text-secondary mt-1">When someone interacts with you, it'll show up here.</p>
        </div>
      ) : (
        <div className="glass-card divide-y divide-border-soft rounded-2xl overflow-hidden shadow-sm">
          <AnimatePresence initial={false}>
            {groupedNotifications.map((group, index) => {
              const isLast = index === groupedNotifications.length - 1;
              const senders = group.senders;

              return (
                <motion.div
                  key={group._id} // Using primary ID as key
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  ref={isLast ? lastNotificationRef : null}
                  onClick={() => handleNotificationClick(group)}
                  className={`group relative flex items-center gap-4 p-4 transition-colors cursor-pointer ${!group.read ? "bg-primary-500/5 hover:bg-primary-500/10" : "hover:bg-bg-surface-hover"}`}
                >
                  {/* Stacked Avatars */}
                  <div className="relative flex-shrink-0 w-12 h-12">
                    {senders.slice(0, 2).map((sender, i) => (
                      <div 
                        key={sender?._id || i} 
                        className={`absolute rounded-full overflow-hidden border-2 border-bg-base bg-bg-surface ${i === 0 ? 'w-10 h-10 bottom-0 left-0 z-10' : 'w-8 h-8 top-0 right-0 z-0'}`}
                      >
                        <Avatar src={sender?.profilePicture || sender?.avatar} fallback={sender?.username?.charAt(0) || 'S'} className="w-full h-full rounded-full" />
                      </div>
                    ))}
                    {/* Badge Icon */}
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-bg-base flex items-center justify-center shadow-sm z-20">
                      {notificationIcon(group.type)}
                    </div>
                  </div>

                  {/* Text Body */}
                  <div className="flex-1 min-w-0 pr-12">
                    <p className="text-sm text-text-primary leading-snug">
                      {formatGroupedText(senders, group.type)}
                    </p>
                    {group.type === 'story_reply' && group.message && (
                      <p className="text-sm text-text-secondary mt-1 italic border-l-2 border-border-soft pl-2 truncate">"{group.message}"</p>
                    )}
                    <p className="text-xs text-text-secondary mt-1">{timeAgo(group.createdAt)}</p>
                  </div>

                  {/* Right side interactions (Post Thumb / Unread Dot / Trash) */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Post thumbnail */}
                    {group.post?.media?.[0]?.url && (
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden border border-border-soft">
                        <img src={group.post.media[0].url} alt="Post" className="w-full h-full object-cover" />
                      </div>
                    )}

                    {/* Unread Dot - clickable to mark read */}
                    {!group.read && (
                      <button 
                        onClick={(e) => handleMarkOneRead(e, group._id)}
                        className="w-3 h-3 rounded-full bg-primary-500 hover:scale-125 transition-transform"
                        title="Mark as read"
                      />
                    )}

                    {/* Delete button (shows on hover in desktop, visible on mobile) */}
                    <button
                      onClick={(e) => handleDelete(e, group._id)}
                      className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors opacity-0 md:group-hover:opacity-100 focus:opacity-100"
                      title="Delete notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {fetchingMore && (
            <div className="py-4 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
