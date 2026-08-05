import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '../ui/Avatar';
import { FollowButton } from '../profile/FollowButton';
import api from '../../services/api';

export const SuggestedUsersCarousel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/api/users/suggested?limit=10');
        if (res.data.success) {
          setUsers(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch suggested users', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (loading || users.length === 0) return null;

  return (
    <div className="py-4 border-b border-border-soft mb-6 md:hidden">
      <div className="flex items-center justify-between px-4 mb-3">
        <h3 className="text-sm font-semibold text-text-primary">Suggested for you</h3>
        <Link to="/app/explore" className="text-xs font-semibold text-primary-500 hover:text-primary-400">See all</Link>
      </div>
      <div className="flex overflow-x-auto hide-scrollbar gap-3 px-4 pb-4">
        {users.map(user => (
          <div key={user._id} className="min-w-[150px] max-w-[150px] flex-shrink-0 glass-card border border-border-soft rounded-xl p-4 flex flex-col items-center text-center">
            <Link to={`/app/profile/${user._id}`} className="flex flex-col items-center">
              <Avatar src={user.profilePicture || user.avatar} fallback={user.username?.charAt(0)} className="w-16 h-16 mb-3" />
              <span className="font-semibold text-text-primary text-sm truncate w-full">{user.username}</span>
              <span className="text-xs text-text-secondary truncate w-full mb-3">{user.category || 'Suggested'}</span>
            </Link>
            <div className="w-full">
              <FollowButton userId={user._id} targetUser={user} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
