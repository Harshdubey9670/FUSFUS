import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";

import { StoriesRow } from "../../components/feed/StoriesRow";
import { StoryViewer } from "../../components/feed/StoryViewer";
import { PostCard } from "../../components/feed/PostCard";
import { FeedSkeleton } from "../../components/feed/FeedSkeleton";
import { SuggestedUsersCarousel } from "../../components/user/SuggestedUsersCarousel";
import { SuggestedUsersSidebar } from "../../components/user/SuggestedUsersSidebar";
import { getActiveStreams } from "../../services/liveService";
import api from "../../services/api";

const FeedPage = () => {
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [liveStreams, setLiveStreams] = useState([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Ref for the feed's own scroll container (the <main> in UserLayout)
  const feedScrollRef = useRef(null);

  // Infinite Scroll — observe the last post element
  const observer = useRef();
  const lastPostElementRef = useCallback((node) => {
    if (isLoading || isFetchingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    }, {
      // Use the main scroll container as the root so IntersectionObserver works with overflow-y-auto
      root: document.getElementById('main-feed-scroll'),
      rootMargin: '200px',
    });
    if (node) observer.current.observe(node);
  }, [isLoading, isFetchingMore, hasMore]);

  const fetchData = async (pageNum = 1, isRefresh = false) => {
    try {
      if (pageNum === 1 && !isRefresh) setIsLoading(true);
      if (pageNum > 1) setIsFetchingMore(true);

      const [postsRes, storiesRes, liveRes] = await Promise.all([
        api.get(`/api/posts/feed?page=${pageNum}&limit=5`),
        pageNum === 1 ? api.get('/api/stories') : Promise.resolve(null),
        pageNum === 1 ? getActiveStreams() : Promise.resolve(null)
      ]);

      if (storiesRes) setStories(storiesRes.data.data);
      if (liveRes) setLiveStreams(liveRes.data);

      const newPosts = postsRes.data.data;
      setHasMore(postsRes.data.pagination.hasMore);

      if (isRefresh || pageNum === 1) {
        setPosts(newPosts);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
      }
    } catch (error) {
      console.error("Failed to fetch feed:", error);
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => { fetchData(page); }, [page]);

  // Pull to Refresh — check scroll position of the main container, not window
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const handleTouchStart = (e) => setTouchStart(e.targetTouches[0].clientY);
  const handleTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientY);
  const handleTouchEnd = () => {
    const mainEl = document.getElementById('main-feed-scroll');
    const scrollTop = mainEl ? mainEl.scrollTop : 0;
    if (touchStart - touchEnd < -100 && scrollTop === 0) {
      setIsRefreshing(true);
      setPage(1);
      fetchData(1, true);
    }
  };

  return (
    // Layout: center feed column + fixed right sidebar
    // Both sit inside the overflow-y-auto <main> from UserLayout
    <div
      className="w-full flex justify-center lg:gap-6 xl:gap-8"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Center feed column — scrolls with main container ── */}
      <div className="flex-1 min-w-0 max-w-[500px] w-full mx-auto pt-2 sm:pt-4 pb-4 px-0">

        {/* Pull to refresh indicator */}
        {isRefreshing && (
          <div className="flex justify-center py-3">
            <Loader2 className="h-5 w-5 text-primary-500 animate-spin" />
          </div>
        )}

        {/* Stories Row */}
        <div className="mb-3 sm:mb-4">
          <StoriesRow
            stories={stories}
            liveStreams={liveStreams}
            isLoading={isLoading && page === 1}
            onStoryClick={(index) => setActiveStoryIndex(index)}
          />
        </div>

        {/* Story Viewer */}
        {activeStoryIndex !== null && (
          <StoryViewer
            stories={stories}
            initialUserIndex={activeStoryIndex}
            onClose={() => setActiveStoryIndex(null)}
          />
        )}

        {/* Suggested Users Carousel (mobile / tablet) */}
        <SuggestedUsersCarousel />

        {/* Feed Posts */}
        <div className="space-y-4 sm:space-y-6">
          {isLoading && page === 1 ? (
            <FeedSkeleton />
          ) : (
            posts.map((post, index) => {
              if (posts.length === index + 1) {
                return (
                  <div ref={lastPostElementRef} key={post._id}>
                    <PostCard post={post} />
                  </div>
                );
              }
              return <PostCard key={post._id} post={post} />;
            })
          )}

          {/* Empty State */}
          {!isLoading && posts.length === 0 && (
            <div className="text-center py-16 px-4">
              <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-2">Welcome to InstaSnap AI</h3>
              <p className="text-text-secondary text-sm">When you follow people, you'll see their photos and videos here.</p>
            </div>
          )}

          {/* Loading More */}
          {isFetchingMore && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 text-primary-500 animate-spin" />
            </div>
          )}

          {/* End of Feed */}
          {!hasMore && posts.length > 0 && (
            <div className="text-center py-8">
              <p className="text-text-secondary font-medium text-sm">You've caught up!</p>
              <p className="text-xs text-text-secondary mt-1">You've seen all new posts.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Right Sidebar — sticky within scroll container, only on xl+ ── */}
      <SuggestedUsersSidebar />
    </div>
  );
};

export default FeedPage;
