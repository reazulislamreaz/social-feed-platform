import { useInfiniteQuery } from "@tanstack/react-query";
import { CreatePost } from "../components/CreatePost";
import { FeedShell } from "../components/FeedShell";
import { FeedSkeleton } from "../components/FeedSkeleton";
import { LeftSidebar } from "../components/LeftSidebar";
import { PostCard } from "../components/PostCard";
import { RightSidebar } from "../components/RightSidebar";
import { StoriesStrip } from "../components/StoriesStrip";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../services/api";
import * as api from "../services/endpoints";

export function FeedPage() {
  const { user } = useAuth();

  const feed = useInfiniteQuery({
    queryKey: ["feed", user?.id],
    queryFn: ({ pageParam }) => api.fetchFeed({ cursor: pageParam, limit: 20 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const posts = feed.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <FeedShell left={<LeftSidebar />} right={<RightSidebar />}>
      {feed.isLoading ? (
        <FeedSkeleton />
      ) : (
        <>
          <StoriesStrip />
          <CreatePost />

          {feed.isError && <p className="_form_error">{getErrorMessage(feed.error)}</p>}

          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}

          {posts.length === 0 && !feed.isError && (
            <p className="text-center text-muted _padd_t24">No posts yet. Create the first one.</p>
          )}

          {feed.hasNextPage && (
            <div className="text-center _padd_t16 _padd_b24">
              <button
                type="button"
                className="_feed_inner_text_area_btn_link"
                disabled={feed.isFetchingNextPage}
                onClick={() => void feed.fetchNextPage()}
              >
                {feed.isFetchingNextPage ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </FeedShell>
  );
}
