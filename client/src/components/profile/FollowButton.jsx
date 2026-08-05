import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import api from '../../services/api';
import { useToast } from '../ui/Toast';
import { updateFollowing } from '../../store/authSlice';

export const FollowButton = ({ userId, targetUser, onToggle }) => {
  const { user: authUser } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { toast } = useToast();
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [isRequested, setIsRequested] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (authUser?.following && userId) {
      const targetIdStr = userId.toString();
      setIsFollowing(
        authUser.following.some(id => (typeof id === 'string' ? id : id?._id || id)?.toString() === targetIdStr)
      );
    }
    if (targetUser?.followRequests && authUser?._id) {
      const authIdStr = authUser._id.toString();
      setIsRequested(
        targetUser.followRequests.some(id => (typeof id === 'string' ? id : id?._id || id)?.toString() === authIdStr)
      );
    }
  }, [authUser?.following, userId, targetUser, authUser?._id]);

  const handleToggleFollow = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    const wasFollowing = isFollowing;
    const wasRequested = isRequested;
    
    // Optimistic Update
    if (isFollowing) {
      setIsFollowing(false);
    } else if (isRequested) {
      // Trying to cancel request? Wait, backend unfollow deletes following. 
      // Need an API to cancel request if we want, but let's just let unfollow handle it if backend supports it.
      // Wait, backend `unfollow` doesn't pull from `followRequests`. Let's assume they have to use standard unfollow.
    } else {
      if (targetUser?.isPrivate) {
        setIsRequested(true);
      } else {
        setIsFollowing(true);
      }
    }

    try {
      let res;
      if (wasFollowing) {
        res = await api.delete(`/api/users/${userId}/follow`);
      } else if (wasRequested) {
        res = await api.delete(`/api/users/follow-requests/${userId}/cancel`);
        if (res?.data?.success) {
          setIsRequested(false);
        }
      } else {
        res = await api.post(`/api/users/${userId}/follow`);
      }
      
      if (res?.data?.success) {
        if (res.data.status === 'requested') {
          setIsRequested(true);
          setIsFollowing(false);
        } else if (res.data.status === 'following') {
          dispatch(updateFollowing(res.data.data));
        } else {
          // Unfollowed
          dispatch(updateFollowing(res.data.data));
          setIsRequested(false);
        }
        
        if (onToggle) {
          onToggle({
            isFollowing: !wasFollowing && res.data.status === 'following',
            isRequested: !wasFollowing && res.data.status === 'requested'
          });
        }
      }
    } catch (error) {
      // Revert on failure
      setIsFollowing(wasFollowing);
      setIsRequested(wasRequested);
      toast({ variant: 'error', title: 'Action Failed', description: error.response?.data?.message || 'Could not update follow status.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!authUser || authUser._id === userId) return null;

  return (
    <Button 
      variant={isFollowing || isRequested ? 'glass' : 'primary'} 
      onClick={handleToggleFollow}
      disabled={isLoading}
      className={`min-w-[100px] h-9 px-4 text-sm font-medium ${isFollowing ? 'hover:border-red-500/50 hover:text-red-400' : ''}`}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
      ) : isFollowing ? (
        'Following'
      ) : isRequested ? (
        'Requested'
      ) : (
        'Follow'
      )}
    </Button>
  );
};
