import { useEffect, useRef, useState, type KeyboardEvent, type RefObject } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LikeButton } from "./LikeButton";
import { CommentsSkeleton } from "./FeedSkeleton";
import { assetUrl, getErrorMessage } from "../services/api";
import * as api from "../services/endpoints";
import type { Author, Comment, LikeTargetType, Post, Reply } from "../types";
import { useAuth } from "../context/AuthContext";
import { displayName, timeAgo, timeAgoShort } from "../utils/format";

const REACT_AVATARS = [
  "/assets/images/react_img1.png",
  "/assets/images/react_img2.png",
  "/assets/images/react_img3.png",
  "/assets/images/react_img4.png",
  "/assets/images/react_img5.png",
];

const MicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16">
    <path
      fill="#000"
      fillOpacity=".46"
      fillRule="evenodd"
      d="M13.167 6.534a.5.5 0 01.5.5c0 3.061-2.35 5.582-5.333 5.837V14.5a.5.5 0 01-1 0v-1.629C4.35 12.616 2 10.096 2 7.034a.5.5 0 011 0c0 2.679 2.168 4.859 4.833 4.859 2.666 0 4.834-2.18 4.834-4.86a.5.5 0 01.5-.5zM7.833.667a3.218 3.218 0 013.208 3.22v3.126c0 1.775-1.439 3.22-3.208 3.22a3.218 3.218 0 01-3.208-3.22V3.887c0-1.776 1.44-3.22 3.208-3.22zm0 1a2.217 2.217 0 00-2.208 2.22v3.126c0 1.223.991 2.22 2.208 2.22a2.217 2.217 0 002.208-2.22V3.887c0-1.224-.99-2.22-2.208-2.22z"
      clipRule="evenodd"
    />
  </svg>
);

const ImageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16">
    <path
      fill="#000"
      fillOpacity=".46"
      fillRule="evenodd"
      d="M10.867 1.333c2.257 0 3.774 1.581 3.774 3.933v5.435c0 2.352-1.517 3.932-3.774 3.932H5.101c-2.254 0-3.767-1.58-3.767-3.932V5.266c0-2.352 1.513-3.933 3.767-3.933h5.766zm0 1H5.101c-1.681 0-2.767 1.152-2.767 2.933v5.435c0 1.782 1.086 2.932 2.767 2.932h5.766c1.685 0 2.774-1.15 2.774-2.932V5.266c0-1.781-1.089-2.933-2.774-2.933zm.426 5.733l.017.015.013.013.009.008.037.037c.12.12.453.46 1.443 1.477a.5.5 0 11-.716.697S10.73 8.91 10.633 8.816a.614.614 0 00-.433-.118.622.622 0 00-.421.225c-1.55 1.88-1.568 1.897-1.594 1.922a1.456 1.456 0 01-2.057-.021s-.62-.63-.63-.642c-.155-.143-.43-.134-.594.04l-1.02 1.076a.498.498 0 01-.707.018.499.499 0 01-.018-.706l1.018-1.075c.54-.573 1.45-.6 2.025-.06l.639.647c.178.18.467.184.646.008l1.519-1.843a1.618 1.618 0 011.098-.584c.433-.038.854.088 1.19.363zM5.706 4.42c.921 0 1.67.75 1.67 1.67 0 .92-.75 1.67-1.67 1.67-.92 0-1.67-.75-1.67-1.67 0-.921.75-1.67 1.67-1.67zm0 1a.67.67 0 10.001 1.34.67.67 0 00-.002-1.34z"
      clipRule="evenodd"
    />
  </svg>
);

const ThumbsUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="8" fill="#1890FF" />
    <path
      fill="#fff"
      d="M10.4 7.2H9.05V4.85c0-.58-.36-.95-.9-.95-.5 0-.72.4-.85.78L6.4 7.2H5.2c-.44 0-.8.36-.8.8v3.6c0 .44.36.8.8.8h5.2c.38 0 .7-.27.78-.64l.72-3.2c.1-.46-.24-.96-.7-.96zM5.2 12h-.4V7.2h.4V12z"
    />
  </svg>
);

const HeartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="8" fill="#F25268" />
    <path
      fill="#fff"
      d="M8 11.6s-3.2-1.98-3.2-4.05A1.85 1.85 0 018 5.85a1.85 1.85 0 013.2 1.7C11.2 9.62 8 11.6 8 11.6z"
    />
  </svg>
);

function useTargetLike(
  targetType: LikeTargetType,
  targetId: string,
  liked: boolean,
  count: number,
  likers: Author[],
) {
  const qc = useQueryClient();
  const [localLiked, setLocalLiked] = useState(liked);
  const [localCount, setLocalCount] = useState(count);
  const [localLikers, setLocalLikers] = useState(likers);

  useEffect(() => {
    setLocalLiked(liked);
    setLocalCount(count);
    setLocalLikers(likers);
  }, [liked, count, likers]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (localLiked) return api.removeLike(targetType, targetId);
      return api.addLike(targetType, targetId);
    },
    onSuccess: (data) => {
      setLocalLiked(data.liked);
      setLocalCount(data.likeCount);
      setLocalLikers(data.likers ?? []);
      void qc.invalidateQueries({ queryKey: ["feed"] });
      void qc.invalidateQueries({ queryKey: ["comments"] });
    },
  });

  return {
    liked: localLiked,
    count: localCount,
    likers: localLikers,
    pending: mutation.isPending,
    toggle: () => mutation.mutate(),
  };
}

function CommentComposer({
  value,
  onChange,
  onSubmit,
  pending,
  error,
  inputRef,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  pending?: boolean;
  error?: string | null;
  inputRef?: RefObject<HTMLTextAreaElement | null>;
  autoFocus?: boolean;
}) {
  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !pending) onSubmit();
    }
  }

  return (
    <div className="_feed_inner_comment_box">
      <form
        className="_feed_inner_comment_box_form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!value.trim() || pending) return;
          onSubmit();
        }}
      >
        <div className="_feed_inner_comment_box_content">
          <div className="_feed_inner_comment_box_content_image">
            <img src="/assets/images/comment_img.png" alt="" className="_comment_img" />
          </div>
          <div className="_feed_inner_comment_box_content_txt">
            <textarea
              ref={inputRef}
              className="form-control _comment_textarea"
              placeholder="Write a comment"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={onKeyDown}
              autoFocus={autoFocus}
              rows={1}
            />
          </div>
        </div>
        <div className="_feed_inner_comment_box_icon">
          <button
            type="submit"
            className="_feed_inner_comment_box_icon_btn"
            disabled={pending}
            aria-label="Submit comment"
          >
            <MicIcon />
          </button>
          <button type="button" className="_feed_inner_comment_box_icon_btn" aria-label="Add image">
            <ImageIcon />
          </button>
        </div>
      </form>
      {error && <p className="_form_error">{error}</p>}
    </div>
  );
}

function ReactionPill({
  count,
  showHeart = true,
  onClick,
  title,
}: {
  count: number;
  showHeart?: boolean;
  onClick?: () => void;
  title?: string;
}) {
  if (count <= 0) return null;
  return (
    <div
      className="_total_reactions"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") onClick?.();
      }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      title={title || "See who liked"}
    >
      <div className="_total_react">
        <span className="_reaction_like">
          <ThumbsUpIcon />
        </span>
        {showHeart && (
          <span className="_reaction_heart">
            <HeartIcon />
          </span>
        )}
      </div>
      <span className="_total">{count}</span>
    </div>
  );
}

function ReplyBlock({ reply }: { reply: Reply }) {
  const like = useTargetLike("REPLY", reply.id, reply.likedByMe, reply.likeCount, reply.likers);

  return (
    <div className="_comment_main">
      <div className="_comment_image">
        <span className="_comment_image_link">
          <img src="/assets/images/txt_img.png" alt="" className="_comment_img1" />
        </span>
      </div>
      <div className="_comment_area">
        <div className="_comment_details">
          <div className="_comment_details_top">
            <div className="_comment_name">
              <h4 className="_comment_name_title">{displayName(reply.author)}</h4>
            </div>
          </div>
          <div className="_comment_status">
            <p className="_comment_status_text">
              <span>{reply.content}</span>
            </p>
          </div>
          <ReactionPill
            count={like.count}
            showHeart={false}
            onClick={like.toggle}
            title={like.likers.map(displayName).join(", ")}
          />
          <div className="_comment_reply">
            <div className="_comment_reply_num">
              <ul className="_comment_reply_list">
                <li>
                  <span
                    role="button"
                    tabIndex={0}
                    className={like.liked ? "_liked_active" : undefined}
                    onClick={() => like.toggle()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") like.toggle();
                    }}
                    title={like.likers.map(displayName).join(", ") || "Like"}
                  >
                    Like.
                  </span>
                </li>
                <li>
                  <span>Share</span>
                </li>
                <li>
                  <span className="_time_link">{timeAgoShort(reply.createdAt)}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommentBlock({ comment, postId }: { comment: Comment; postId: string }) {
  const [text, setText] = useState("");
  const [replyFocused, setReplyFocused] = useState(false);
  const replyRef = useRef<HTMLTextAreaElement>(null);
  const qc = useQueryClient();
  const like = useTargetLike(
    "COMMENT",
    comment.id,
    comment.likedByMe,
    comment.likeCount,
    comment.likers,
  );

  const replyMutation = useMutation({
    mutationFn: () => api.createReply(comment.id, text.trim()),
    onSuccess: () => {
      setText("");
      void qc.invalidateQueries({ queryKey: ["comments", postId] });
      void qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  function focusReply() {
    setReplyFocused(true);
    requestAnimationFrame(() => replyRef.current?.focus());
  }

  return (
    <div className="_comment_main">
      <div className="_comment_image">
        <span className="_comment_image_link">
          <img src="/assets/images/txt_img.png" alt="" className="_comment_img1" />
        </span>
      </div>
      <div className="_comment_area">
        <div className="_comment_details">
          <div className="_comment_details_top">
            <div className="_comment_name">
              <h4 className="_comment_name_title">{displayName(comment.author)}</h4>
            </div>
          </div>
          <div className="_comment_status">
            <p className="_comment_status_text">
              <span>{comment.content}</span>
            </p>
          </div>
          <ReactionPill
            count={like.count}
            onClick={like.toggle}
            title={
              like.likers.length
                ? `Liked by ${like.likers.map(displayName).join(", ")}`
                : "Like this comment"
            }
          />
          <div className="_comment_reply">
            <div className="_comment_reply_num">
              <ul className="_comment_reply_list">
                <li>
                  <span
                    role="button"
                    tabIndex={0}
                    className={like.liked ? "_liked_active" : undefined}
                    onClick={() => like.toggle()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") like.toggle();
                    }}
                    title={
                      like.likers.length
                        ? `Liked by ${like.likers.map(displayName).join(", ")}`
                        : "Like"
                    }
                  >
                    Like.
                  </span>
                </li>
                <li>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={focusReply}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") focusReply();
                    }}
                  >
                    Reply.
                  </span>
                </li>
                <li>
                  <span>Share</span>
                </li>
                <li>
                  <span className="_time_link">{timeAgoShort(comment.createdAt)}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {comment.replies.map((reply) => (
          <ReplyBlock key={reply.id} reply={reply} />
        ))}

        <CommentComposer
          value={text}
          onChange={setText}
          onSubmit={() => replyMutation.mutate()}
          pending={replyMutation.isPending}
          error={replyMutation.isError ? getErrorMessage(replyMutation.error) : null}
          inputRef={replyRef}
          autoFocus={replyFocused}
        />
      </div>
    </div>
  );
}

function PostMenu({
  isOwner,
  onDelete,
  onClose,
}: {
  isOwner: boolean;
  onDelete: () => void;
  onClose: () => void;
}) {
  return (
    <div className="_feed_timeline_dropdown _timeline_dropdown show">
      <ul className="_feed_timeline_dropdown_list">
        <li className="_feed_timeline_dropdown_item">
          <a href="#0" className="_feed_timeline_dropdown_link" onClick={(e) => { e.preventDefault(); onClose(); }}>
            <span>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 18 18">
                <path stroke="#1890FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M14.25 15.75L9 12l-5.25 3.75v-12a1.5 1.5 0 011.5-1.5h7.5a1.5 1.5 0 011.5 1.5v12z" />
              </svg>
            </span>
            Save Post
          </a>
        </li>
        <li className="_feed_timeline_dropdown_item">
          <a href="#0" className="_feed_timeline_dropdown_link" onClick={(e) => { e.preventDefault(); onClose(); }}>
            <span>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="22" fill="none" viewBox="0 0 20 22">
                <path fill="#377DFF" fillRule="evenodd" d="M7.547 19.55c.533.59 1.218.915 1.93.915.714 0 1.403-.324 1.938-.916a.777.777 0 011.09-.056c.318.284.344.77.058 1.084-.832.917-1.927 1.423-3.086 1.423h-.002c-1.155-.001-2.248-.506-3.077-1.424a.762.762 0 01.057-1.083.774.774 0 011.092.057zM9.527 0c4.58 0 7.657 3.543 7.657 6.85 0 1.702.436 2.424.899 3.19.457.754.976 1.612.976 3.233-.36 4.14-4.713 4.478-9.531 4.478-4.818 0-9.172-.337-9.528-4.413-.003-1.686.515-2.544.973-3.299l.161-.27c.398-.679.737-1.417.737-2.918C1.871 3.543 4.948 0 9.528 0zm0 1.535c-3.6 0-6.11 2.802-6.11 5.316 0 2.127-.595 3.11-1.12 3.978-.422.697-.755 1.247-.755 2.444.173 1.93 1.455 2.944 7.986 2.944 6.494 0 7.817-1.06 7.988-3.01-.003-1.13-.336-1.681-.757-2.378-.526-.868-1.12-1.851-1.12-3.978 0-2.514-2.51-5.316-6.111-5.316z" clipRule="evenodd" />
              </svg>
            </span>
            Turn On Notification
          </a>
        </li>
        <li className="_feed_timeline_dropdown_item">
          <a href="#0" className="_feed_timeline_dropdown_link" onClick={(e) => { e.preventDefault(); onClose(); }}>
            <span>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 18 18">
                <path stroke="#1890FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M14.25 2.25H3.75a1.5 1.5 0 00-1.5 1.5v10.5a1.5 1.5 0 001.5 1.5h10.5a1.5 1.5 0 001.5-1.5V3.75a1.5 1.5 0 00-1.5-1.5zM6.75 6.75l4.5 4.5M11.25 6.75l-4.5 4.5" />
              </svg>
            </span>
            Hide
          </a>
        </li>
        {isOwner && (
          <li className="_feed_timeline_dropdown_item">
            <a
              href="#0"
              className="_feed_timeline_dropdown_link"
              onClick={(e) => {
                e.preventDefault();
                if (confirm("Delete this post?")) onDelete();
                onClose();
              }}
            >
              <span>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 18 18">
                  <path stroke="#1890FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M14.25 2.25H3.75a1.5 1.5 0 00-1.5 1.5v10.5a1.5 1.5 0 001.5 1.5h10.5a1.5 1.5 0 001.5-1.5V3.75a1.5 1.5 0 00-1.5-1.5zM6.75 6.75l4.5 4.5M11.25 6.75l-4.5 4.5" />
                </svg>
              </span>
              Delete Post
            </a>
          </li>
        )}
      </ul>
    </div>
  );
}

function PostReactsRow({
  likeCount,
  commentCount,
  onFocusComment,
  onShowLikers,
}: {
  likeCount: number;
  commentCount: number;
  onFocusComment: () => void;
  onShowLikers: () => void;
}) {
  const badge = likeCount > 9 ? "9+" : String(Math.max(likeCount, 0));
  const showStack = likeCount > 0;
  const avatars = showStack
    ? REACT_AVATARS.slice(0, Math.min(5, Math.max(3, Math.min(likeCount, 5))))
    : [];

  return (
    <div className="_feed_inner_timeline_total_reacts _padd_r24 _padd_l24 _mar_b26">
      <div
        className="_feed_inner_timeline_total_reacts_image"
        onClick={onShowLikers}
        onKeyDown={(e) => {
          if (e.key === "Enter") onShowLikers();
        }}
        role="button"
        tabIndex={0}
        title="See who liked"
      >
        {avatars.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            className={i === 0 ? "_react_img1" : i < 3 ? "_react_img" : "_react_img _rect_img_mbl_none"}
          />
        ))}
        {showStack && <p className="_feed_inner_timeline_total_reacts_para">{badge}</p>}
      </div>
      <div className="_feed_inner_timeline_total_reacts_txt">
        <p className="_feed_inner_timeline_total_reacts_para1">
          <a
            href="#0"
            onClick={(e) => {
              e.preventDefault();
              onFocusComment();
            }}
          >
            <span>{commentCount}</span> Comment
          </a>
        </p>
        <p className="_feed_inner_timeline_total_reacts_para2">
          <span>122</span> Share
        </p>
      </div>
    </div>
  );
}

export function PostCard({ post }: { post: Post }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [commentText, setCommentText] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLikers, setShowLikers] = useState(false);
  const commentRef = useRef<HTMLTextAreaElement>(null);
  const image = assetUrl(post.imageUrl) ?? "/assets/images/timeline_img.png";

  const comments = useInfiniteQuery({
    queryKey: ["comments", post.id],
    queryFn: ({ pageParam }) =>
      api.fetchComments(post.id, { cursor: pageParam, limit: 20 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const createComment = useMutation({
    mutationFn: () => api.createComment(post.id, commentText.trim()),
    onSuccess: () => {
      setCommentText("");
      void qc.invalidateQueries({ queryKey: ["comments", post.id] });
      void qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const del = useMutation({
    mutationFn: () => api.deletePost(post.id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["feed"] }),
  });

  const commentItems = comments.data?.pages.flatMap((p) => p.items) ?? [];
  const isOwner = user?.id === post.author.id;
  const likerNames = post.likers.slice(0, 3).map(displayName).join(", ");

  return (
    <div className="_feed_inner_timeline_post_area _b_radious6 _padd_b24 _padd_t24 _mar_b16">
      <div className="_feed_inner_timeline_content _padd_r24 _padd_l24">
        <div className="_feed_inner_timeline_post_top">
          <div className="_feed_inner_timeline_post_box">
            <div className="_feed_inner_timeline_post_box_image">
              <img src="/assets/images/post_img.png" alt="" className="_post_img" />
            </div>
            <div className="_feed_inner_timeline_post_box_txt">
              <h4 className="_feed_inner_timeline_post_box_title">{displayName(post.author)}</h4>
              <p className="_feed_inner_timeline_post_box_para">
                {timeAgo(post.createdAt)} .{" "}
                <a href="#0">{post.visibility === "PUBLIC" ? "Public" : "Private"}</a>
              </p>
            </div>
          </div>

          <div className="_feed_inner_timeline_post_box_dropdown">
            <div className="_feed_timeline_post_dropdown">
              <button
                type="button"
                className="_feed_timeline_post_dropdown_link"
                onClick={() => setMenuOpen((v) => !v)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="4" height="17" fill="none" viewBox="0 0 4 17">
                  <circle cx="2" cy="2" r="2" fill="#C4C4C4" />
                  <circle cx="2" cy="8" r="2" fill="#C4C4C4" />
                  <circle cx="2" cy="15" r="2" fill="#C4C4C4" />
                </svg>
              </button>
            </div>
            {menuOpen && (
              <PostMenu
                isOwner={isOwner}
                onDelete={() => del.mutate()}
                onClose={() => setMenuOpen(false)}
              />
            )}
          </div>
        </div>

        <h4 className="_feed_inner_timeline_post_title" style={{ whiteSpace: "pre-wrap" }}>
          {post.content}
        </h4>
        <div className="_feed_inner_timeline_image">
          <img src={image} alt="" className="_time_img" />
        </div>
      </div>

      <PostReactsRow
        likeCount={post.likeCount}
        commentCount={post.commentCount}
        onFocusComment={() => commentRef.current?.focus()}
        onShowLikers={() => setShowLikers((v) => !v)}
      />

      {showLikers && post.likers.length > 0 && (
        <div className="_likers_list _padd_r24 _padd_l24 _mar_b12">
          Liked by {likerNames}
          {post.likeCount > 3 ? ` and ${post.likeCount - 3} others` : ""}
        </div>
      )}

      <div className="_feed_inner_timeline_reaction">
        <LikeButton
          targetType="POST"
          targetId={post.id}
          liked={post.likedByMe}
          count={post.likeCount}
          likers={post.likers}
          showLikers={false}
        />
        <button
          type="button"
          className="_feed_inner_timeline_reaction_comment _feed_reaction"
          onClick={() => commentRef.current?.focus()}
        >
          <span className="_feed_inner_timeline_reaction_link">
            <span>
              <svg className="_reaction_svg" xmlns="http://www.w3.org/2000/svg" width="21" height="21" fill="none" viewBox="0 0 21 21">
                <path stroke="#000" d="M1 10.5c0-.464 0-.696.009-.893A9 9 0 019.607 1.01C9.804 1 10.036 1 10.5 1v0c.464 0 .696 0 .893.009a9 9 0 018.598 8.598c.009.197.009.429.009.893v6.046c0 1.36 0 2.041-.317 2.535a2 2 0 01-.602.602c-.494.317-1.174.317-2.535.317H10.5c-.464 0-.696 0-.893-.009a9 9 0 01-8.598-8.598C1 11.196 1 10.964 1 10.5v0z" />
                <path stroke="#000" strokeLinecap="round" strokeLinejoin="round" d="M6.938 9.313h7.125M10.5 14.063h3.563" />
              </svg>
              Comment
            </span>
          </span>
        </button>
        <button type="button" className="_feed_inner_timeline_reaction_share _feed_reaction">
          <span className="_feed_inner_timeline_reaction_link">
            <span>
              <svg className="_reaction_svg" xmlns="http://www.w3.org/2000/svg" width="24" height="21" fill="none" viewBox="0 0 24 21">
                <path stroke="#000" strokeLinejoin="round" d="M23 10.5L12.917 1v5.429C3.267 6.429 1 13.258 1 20c2.785-3.52 5.248-5.429 11.917-5.429V20L23 10.5z" />
              </svg>
              Share
            </span>
          </span>
        </button>
      </div>

      <div className="_feed_inner_timeline_cooment_area">
        <CommentComposer
          value={commentText}
          onChange={setCommentText}
          onSubmit={() => createComment.mutate()}
          pending={createComment.isPending}
          error={createComment.isError ? getErrorMessage(createComment.error) : null}
          inputRef={commentRef}
        />
      </div>

      <div className="_timline_comment_main">
        {comments.isLoading && <CommentsSkeleton />}
        {!comments.isLoading && (comments.hasNextPage || commentItems.length > 1) && (
          <div className="_previous_comment">
            <button
              type="button"
              className="_previous_comment_txt"
              onClick={() => {
                if (comments.hasNextPage) void comments.fetchNextPage();
              }}
            >
              {comments.hasNextPage
                ? `View ${Math.max(commentItems.length, 4)} previous comments`
                : `View ${Math.max(0, post.commentCount - 1)} previous comments`}
            </button>
          </div>
        )}
        {commentItems.map((c) => (
          <CommentBlock key={c.id} comment={c} postId={post.id} />
        ))}
      </div>
    </div>
  );
}
