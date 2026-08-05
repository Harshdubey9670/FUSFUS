import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Eye, 
  TrendingUp, 
  Users, 
  Clock, 
  Download, 
  Trash2, 
  Archive, 
  Film, 
  Image as ImageIcon, 
  Video, 
  Layers, 
  Calendar, 
  FileText, 
  CheckSquare, 
  Square,
  Sparkles,
  Heart,
  MessageCircle,
  Bookmark,
  Share2
} from 'lucide-react';
import { 
  getOverviewStats, 
  getInsights, 
  getAudienceAnalytics, 
  getContentPerformance, 
  getDraftsAndScheduled, 
  bulkContentAction, 
  downloadAnalyticsReport 
} from '../../services/creatorService';

export default function CreatorStudioPage() {
  const [activeTab, setActiveTab] = useState('overview'); // overview, content, audience, manager
  const [timeframe, setTimeframe] = useState('30d');
  const [loading, setLoading] = useState(true);

  // Data states
  const [overview, setOverview] = useState(null);
  const [insights, setInsights] = useState([]);
  const [audience, setAudience] = useState(null);
  const [content, setContent] = useState({ posts: [], reels: [], stories: [] });
  const [draftsAndScheduled, setDraftsAndScheduled] = useState({ drafts: [], scheduled: [] });

  // Content manager selection
  const [contentTypeFilter, setContentTypeFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    fetchData();
  }, [timeframe, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const [ovData, insData] = await Promise.all([
          getOverviewStats(timeframe),
          getInsights(timeframe)
        ]);
        setOverview(ovData.data.summary);
        setInsights(insData.data.timeSeries);
      } else if (activeTab === 'content') {
        const cntData = await getContentPerformance(contentTypeFilter);
        setContent(cntData.data);
      } else if (activeTab === 'audience') {
        const audData = await getAudienceAnalytics();
        setAudience(audData.data);
      } else if (activeTab === 'manager') {
        const mgrData = await getDraftsAndScheduled();
        setDraftsAndScheduled(mgrData.data);
      }
    } catch (err) {
      console.error('Failed to load Creator Studio data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (items) => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(item => item.id));
    }
  };

  const handleToggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to ${action} ${selectedIds.length} items?`)) return;

    try {
      await bulkContentAction({ action, ids: selectedIds, contentType: 'post' });
      setSelectedIds([]);
      fetchData();
    } catch (err) {
      alert('Bulk action failed');
    }
  };

  return (
    <div className="min-h-screen bg-bg-base text-text-primary p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-soft pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-primary-500 animate-pulse" />
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 bg-clip-text text-transparent">
              Creator Studio
            </h1>
          </div>
          <p className="text-text-secondary text-sm mt-1">
            Analyze audience reach, content performance, manage drafts, and scheduled releases.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-3">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-3 py-2 bg-bg-surface border border-border-soft rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last 1 Year</option>
          </select>

          <button
            onClick={downloadAnalyticsReport}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border-soft overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'overview', label: 'Dashboard', icon: BarChart3 },
          { id: 'content', label: 'Content Insights', icon: Film },
          { id: 'audience', label: 'Audience Analytics', icon: Users },
          { id: 'manager', label: 'Drafts & Scheduled', icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-primary-500/10 text-primary-500 border border-primary-500/30 font-semibold'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-bg-surface rounded-2xl border border-border-soft"></div>
          ))}
        </div>
      ) : (
        <>
          {/* TAB 1: OVERVIEW / DASHBOARD */}
          {activeTab === 'overview' && overview && (
            <div className="space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                <div className="p-5 bg-bg-surface rounded-2xl border border-border-soft shadow-sm space-y-2 hover:border-primary-500/50 transition-all">
                  <div className="flex items-center justify-between text-text-secondary">
                    <span className="text-xs font-semibold uppercase tracking-wider">Estimated Reach</span>
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="text-3xl font-extrabold">{overview.reach.toLocaleString()}</div>
                  <p className="text-xs text-emerald-500 font-medium">+14.2% vs previous {timeframe}</p>
                </div>

                <div className="p-5 bg-bg-surface rounded-2xl border border-border-soft shadow-sm space-y-2 hover:border-primary-500/50 transition-all">
                  <div className="flex items-center justify-between text-text-secondary">
                    <span className="text-xs font-semibold uppercase tracking-wider">Impressions</span>
                    <Eye className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="text-3xl font-extrabold">{overview.impressions.toLocaleString()}</div>
                  <p className="text-xs text-blue-500 font-medium">+18.6% vs previous {timeframe}</p>
                </div>

                <div className="p-5 bg-bg-surface rounded-2xl border border-border-soft shadow-sm space-y-2 hover:border-primary-500/50 transition-all">
                  <div className="flex items-center justify-between text-text-secondary">
                    <span className="text-xs font-semibold uppercase tracking-wider">Watch Time</span>
                    <Clock className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="text-3xl font-extrabold">{overview.watchTimeHours} hrs</div>
                  <p className="text-xs text-purple-500 font-medium">+9.4% video retention</p>
                </div>

                <div className="p-5 bg-bg-surface rounded-2xl border border-border-soft shadow-sm space-y-2 hover:border-primary-500/50 transition-all">
                  <div className="flex items-center justify-between text-text-secondary">
                    <span className="text-xs font-semibold uppercase tracking-wider">Profile Visits</span>
                    <Users className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="text-3xl font-extrabold">{overview.profileVisits.toLocaleString()}</div>
                  <p className="text-xs text-amber-500 font-medium">+22.1% conversion rate</p>
                </div>
              </div>

              {/* Time-Series Chart Visualization (Bar Chart Representation) */}
              <div className="p-6 bg-bg-surface rounded-2xl border border-border-soft space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg">Performance Trajectory</h3>
                  <span className="text-xs text-text-secondary font-medium">Daily Reach & Impressions</span>
                </div>

                <div className="h-48 flex items-end gap-2 pt-6">
                  {insights.slice(-14).map((item, idx) => {
                    const maxVal = Math.max(...insights.map(i => i.impressions || 1));
                    const heightPercent = Math.max(15, Math.floor((item.impressions / maxVal) * 100));
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                        <div 
                          className="w-full bg-gradient-to-t from-primary-600 to-secondary-400 rounded-t-md transition-all group-hover:brightness-125 relative"
                          style={{ height: `${heightPercent}%` }}
                        >
                          <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 text-white text-[10px] py-0.5 px-1.5 rounded whitespace-nowrap transition-opacity pointer-events-none z-10">
                            {item.impressions}
                          </div>
                        </div>
                        <span className="text-[10px] text-text-secondary rotate-45 md:rotate-0">{item.date.slice(5)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONTENT INSIGHTS */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                {['all', 'posts', 'reels', 'stories'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setContentTypeFilter(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                      contentTypeFilter === t
                        ? 'bg-primary-500 text-white'
                        : 'bg-bg-surface text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Grid of items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {[...content.posts, ...content.reels, ...content.stories].map((item) => (
                  <div key={item.id} className="bg-bg-surface rounded-2xl border border-border-soft overflow-hidden group hover:border-primary-500/50 transition-all flex flex-col justify-between">
                    <div className="relative aspect-video bg-black/20 overflow-hidden">
                      {item.mediaUrl ? (
                        <img src={item.mediaUrl} alt="Content media" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-text-secondary">
                          <ImageIcon className="w-8 h-8" />
                        </div>
                      )}
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold rounded uppercase">
                        {item.contentType}
                      </span>
                    </div>

                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                      <p className="text-xs line-clamp-2 text-text-secondary font-medium">
                        {item.caption || 'No caption'}
                      </p>

                      <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border-soft text-center text-xs">
                        <div>
                          <Heart className="w-3.5 h-3.5 mx-auto text-rose-500 mb-1" />
                          <span className="font-bold">{item.likesCount ?? item.viewersCount ?? 0}</span>
                        </div>
                        <div>
                          <MessageCircle className="w-3.5 h-3.5 mx-auto text-blue-500 mb-1" />
                          <span className="font-bold">{item.commentsCount ?? 0}</span>
                        </div>
                        <div>
                          <Bookmark className="w-3.5 h-3.5 mx-auto text-amber-500 mb-1" />
                          <span className="font-bold">{item.savesCount ?? item.sharesCount ?? 0}</span>
                        </div>
                        <div>
                          <Eye className="w-3.5 h-3.5 mx-auto text-emerald-500 mb-1" />
                          <span className="font-bold">{item.impressions ?? item.viewsCount ?? 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: AUDIENCE ANALYTICS */}
          {activeTab === 'audience' && audience && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Gender Ratio */}
              <div className="p-6 bg-bg-surface rounded-2xl border border-border-soft space-y-4">
                <h3 className="font-bold text-lg">Gender Breakdown</h3>
                <div className="space-y-3">
                  {audience.genderBreakdown.map((g) => (
                    <div key={g.gender} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>{g.gender}</span>
                        <span>{g.percentage}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-bg-base rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary-500 rounded-full" 
                          style={{ width: `${g.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Age Distribution */}
              <div className="p-6 bg-bg-surface rounded-2xl border border-border-soft space-y-4">
                <h3 className="font-bold text-lg">Age Distribution</h3>
                <div className="space-y-3">
                  {audience.ageDistribution.map((a) => (
                    <div key={a.range} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>{a.range} years</span>
                        <span>{a.percentage}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-bg-base rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-secondary-500 rounded-full" 
                          style={{ width: `${a.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Locations */}
              <div className="p-6 bg-bg-surface rounded-2xl border border-border-soft space-y-4">
                <h3 className="font-bold text-lg">Top Locations</h3>
                <div className="space-y-3">
                  {audience.topLocations.map((l) => (
                    <div key={l.location} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>{l.location}</span>
                        <span>{l.percentage}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-bg-base rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full" 
                          style={{ width: `${l.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Hours */}
              <div className="p-6 bg-bg-surface rounded-2xl border border-border-soft space-y-4">
                <h3 className="font-bold text-lg">Most Active Times</h3>
                <div className="h-36 flex items-end gap-3 pt-4">
                  {audience.peakActiveHours.map((h) => (
                    <div key={h.hour} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <div 
                        className="w-full bg-amber-500/80 rounded-t-md hover:bg-amber-400 transition-colors"
                        style={{ height: `${h.activity}%` }}
                      ></div>
                      <span className="text-[10px] text-text-secondary font-medium">{h.hour}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CONTENT MANAGER (DRAFTS & SCHEDULED) */}
          {activeTab === 'manager' && (
            <div className="space-y-6">
              {/* Bulk action toolbar */}
              <div className="p-4 bg-bg-surface rounded-2xl border border-border-soft flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    {selectedIds.length} items selected
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleBulkAction('archive')}
                    disabled={selectedIds.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl text-xs font-semibold disabled:opacity-50 hover:bg-amber-500/20 transition-all"
                  >
                    <Archive className="w-4 h-4" />
                    Archive
                  </button>
                  <button
                    onClick={() => handleBulkAction('delete')}
                    disabled={selectedIds.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl text-xs font-semibold disabled:opacity-50 hover:bg-rose-500/20 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>

              {/* Drafts Section */}
              <div className="space-y-3">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary-500" />
                  Drafts ({draftsAndScheduled.drafts.length})
                </h3>

                {draftsAndScheduled.drafts.length === 0 ? (
                  <p className="text-sm text-text-secondary">No drafts saved.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {draftsAndScheduled.drafts.map((draft) => {
                      const isSelected = selectedIds.includes(draft.id);
                      return (
                        <div 
                          key={draft.id}
                          onClick={() => handleToggleSelect(draft.id)}
                          className={`p-4 bg-bg-surface rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${
                            isSelected ? 'border-primary-500 bg-primary-500/5' : 'border-border-soft hover:border-primary-500/40'
                          }`}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-primary-500 shrink-0" />
                          ) : (
                            <Square className="w-5 h-5 text-text-secondary shrink-0" />
                          )}
                          <div className="w-12 h-12 bg-bg-base rounded-xl overflow-hidden shrink-0">
                            {draft.mediaUrl && <img src={draft.mediaUrl} alt="" className="w-full h-full object-cover" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{draft.caption || 'Untitled Draft'}</p>
                            <p className="text-xs text-text-secondary">Updated {new Date(draft.updatedAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Scheduled Posts Section */}
              <div className="space-y-3 pt-6 border-t border-border-soft">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-secondary-500" />
                  Scheduled Content ({draftsAndScheduled.scheduled.length})
                </h3>

                {draftsAndScheduled.scheduled.length === 0 ? (
                  <p className="text-sm text-text-secondary">No content currently scheduled.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {draftsAndScheduled.scheduled.map((sch) => {
                      const isSelected = selectedIds.includes(sch.id);
                      return (
                        <div 
                          key={sch.id}
                          onClick={() => handleToggleSelect(sch.id)}
                          className={`p-4 bg-bg-surface rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${
                            isSelected ? 'border-secondary-500 bg-secondary-500/5' : 'border-border-soft hover:border-secondary-500/40'
                          }`}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-secondary-500 shrink-0" />
                          ) : (
                            <Square className="w-5 h-5 text-text-secondary shrink-0" />
                          )}
                          <div className="w-12 h-12 bg-bg-base rounded-xl overflow-hidden shrink-0">
                            {sch.mediaUrl && <img src={sch.mediaUrl} alt="" className="w-full h-full object-cover" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{sch.caption || 'Scheduled post'}</p>
                            <p className="text-xs text-secondary-500 font-medium">Releases: {new Date(sch.scheduledAt).toLocaleString()}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
