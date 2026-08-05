import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Avatar } from '../ui/Avatar';
import { FollowButton } from '../profile/FollowButton';
import api from '../../services/api';

export const SuggestedUsersSidebar = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: authUser } = useSelector(state => state.auth);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/api/users/suggested?limit=5');
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

  if (loading) return <div className="hidden lg:block w-[320px] shrink-0" />;

  return (
    <div className="hidden xl:flex flex-col w-[320px] shrink-0 sticky top-0 self-start h-full overflow-y-auto hide-scrollbar py-4 pl-4">
      {/* Current User Profile Mini */}
      {authUser && (
        <div className="flex items-center justify-between mb-6">
          <Link to="/app/profile" className="flex items-center gap-3">
            <Avatar src={authUser.profilePicture || authUser.avatar} fallback={authUser.username?.charAt(0)} className="w-12 h-12" />
            <div className="flex flex-col">
              <span className="font-bold text-text-primary text-sm leading-tight">{authUser.username}</span>
              <span className="text-text-secondary text-sm">{authUser.fullName || authUser.category}</span>
            </div>
          </Link>
          <button className="text-xs font-semibold text-primary-500 hover:text-text-primary transition-colors">
            Switch
          </button>
        </div>
      )}

      {/* Suggested Users List */}
      {users.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-secondary">Suggested for you</h3>
            <Link to="/app/explore" className="text-xs font-semibold text-text-primary hover:text-text-secondary">See All</Link>
          </div>
          <div className="space-y-4">
            {users.map(user => (
              <div key={user._id} className="flex items-center justify-between">
                <Link to={`/app/profile/${user._id}`} className="flex items-center gap-3 min-w-0">
                  <Avatar src={user.profilePicture || user.avatar} fallback={user.username?.charAt(0)} className="w-10 h-10 flex-shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-text-primary text-sm truncate">{user.username}</span>
                    <span className="text-xs text-text-secondary truncate">{user.category || 'Suggested'}</span>
                  </div>
                </Link>
                <div className="ml-3">
                  <FollowButton userId={user._id} targetUser={user} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Footer Links (Like Instagram) */}
      <div className="mt-8 text-xs text-text-secondary space-y-4">
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          <a href="#" className="hover:underline">About</a>
          <a href="#" className="hover:underline">Help</a>
          <a href="#" className="hover:underline">Press</a>
          <a href="#" className="hover:underline">API</a>
          <a href="#" className="hover:underline">Jobs</a>
          <a href="#" className="hover:underline">Privacy</a>
          <a href="#" className="hover:underline">Terms</a>
        </div>
        <p>© 2026 INSTASNAP AI</p>
      </div>
    </div>
  );
};
