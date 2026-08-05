import { useState, useEffect } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import api from '../../services/api';

export const StoryHighlightsRow = ({ userId, isOwnProfile }) => {
  const [highlights, setHighlights] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (!userId) return;
    api.get(`/api/stories/highlights/${userId}`)
      .then((res) => setHighlights(res.data.data))
      .catch(() => console.error("Failed to load story highlights"));
  }, [userId]);

  const handleCreateHighlight = async (e) => {
    e.preventDefault();
    if (!title) return;
    try {
      const res = await api.post('/api/stories/highlights', {
        title,
        coverImage: 'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?q=80&w=400&auto=format&fit=crop',
        stories: ['66a1b2c3d4e5f67890123456'] // Placeholder mock story ID
      });
      setHighlights([...highlights, res.data.data]);
      setTitle('');
      setShowCreateModal(false);
    } catch (err) {
      alert('Failed to create highlight');
    }
  };

  return (
    <div className="py-4 border-b border-border-soft space-y-3">
      <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none">
        {/* Add New Highlight (Owner Only) */}
        {isOwnProfile && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
          >
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-border-soft group-hover:border-primary-500 flex items-center justify-center bg-bg-surface transition-all">
              <Plus className="w-6 h-6 text-text-secondary group-hover:text-primary-500" />
            </div>
            <span className="text-xs font-semibold text-text-secondary">New</span>
          </button>
        )}

        {/* Existing Highlights */}
        {highlights.map((item) => (
          <div key={item._id} className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group">
            <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-primary-500 to-purple-500 group-hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-full border-2 border-bg-base overflow-hidden">
                <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover" />
              </div>
            </div>
            <span className="text-xs font-semibold max-w-[70px] truncate">{item.title}</span>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-surface p-6 rounded-3xl border border-border-soft max-w-sm w-full space-y-4">
            <h3 className="font-bold text-lg">New Story Highlight</h3>
            <form onSubmit={handleCreateHighlight} className="space-y-4">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Highlight Name (e.g. Summer '26)"
                className="w-full p-3 bg-bg-base border border-border-soft rounded-xl text-sm outline-none"
                required
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-bold text-sm rounded-xl transition-all"
              >
                Create Highlight
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
