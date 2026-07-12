import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import * as api from "../services/endpoints";
import type { Author, LikeTargetType } from "../types";
import { displayName } from "../utils/format";

type Props = {
  targetType: LikeTargetType;
  targetId: string;
  liked: boolean;
  count: number;
  likers: Author[];
  compact?: boolean;
  /** When false, only the reaction button is rendered (design reaction bar). */
  showLikers?: boolean;
};

function formatLikers(likers: Author[], count: number) {
  if (count === 0) return "No likes yet";
  const names = likers.slice(0, 3).map(displayName).join(", ");
  if (count <= 3) return `Liked by ${names}`;
  return `Liked by ${names} and ${count - Math.min(3, likers.length)} others`;
}

export function LikeButton({
  targetType,
  targetId,
  liked,
  count,
  likers,
  compact = false,
  showLikers = true,
}: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showAll, setShowAll] = useState(false);
  const [localLikers, setLocalLikers] = useState(likers);
  const [localCount, setLocalCount] = useState(count);
  const [localLiked, setLocalLiked] = useState(liked);

  useEffect(() => {
    setLocalLikers(likers);
    setLocalCount(count);
    setLocalLiked(liked);
  }, [likers, count, liked]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (localLiked) return api.removeLike(targetType, targetId);
      return api.addLike(targetType, targetId);
    },
    onMutate: () => {
      const snapshot = {
        liked: localLiked,
        count: localCount,
        likers: localLikers,
      };
      const nextLiked = !localLiked;

      setLocalLiked(nextLiked);
      setLocalCount((c) => Math.max(0, c + (nextLiked ? 1 : -1)));

      if (user) {
        setLocalLikers((list) => {
          if (nextLiked) {
            const me = {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
            };
            return [me, ...list.filter((u) => u.id !== user.id)].slice(0, 8);
          }
          return list.filter((u) => u.id !== user.id);
        });
      }

      return snapshot;
    },
    onError: (_err, _vars, snapshot) => {
      if (!snapshot) return;
      setLocalLiked(snapshot.liked);
      setLocalCount(snapshot.count);
      setLocalLikers(snapshot.likers);
    },
    onSuccess: (data) => {
      setLocalLiked(data.liked);
      setLocalCount(data.likeCount);
      setLocalLikers(data.likers ?? []);
      void qc.invalidateQueries({ queryKey: ["feed"] });
      void qc.invalidateQueries({ queryKey: ["comments"] });
    },
  });

  if (compact) {
    return (
      <span
        role="button"
        tabIndex={0}
        className={localLiked ? "_liked_active" : undefined}
        onClick={() => {
          if (!mutation.isPending) mutation.mutate();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !mutation.isPending) mutation.mutate();
        }}
        title={formatLikers(localLikers, localCount)}
      >
        Like.
      </span>
    );
  }

  const button = (
    <button
      type="button"
      className={`_feed_inner_timeline_reaction_emoji _feed_reaction${
        localLiked ? " _feed_reaction_active" : ""
      }`}
      disabled={mutation.isPending}
      onClick={() => mutation.mutate()}
      title={formatLikers(localLikers, localCount)}
    >
      <span className="_feed_inner_timeline_reaction_link">
        <span>
          <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" fill="none" viewBox="0 0 19 19">
            <path fill="#FFCC4D" d="M9.5 19a9.5 9.5 0 100-19 9.5 9.5 0 000 19z" />
            <path
              fill="#664500"
              d="M9.5 11.083c-1.912 0-3.181-.222-4.75-.527-.358-.07-1.056 0-1.056 1.055 0 2.111 2.425 4.75 5.806 4.75 3.38 0 5.805-2.639 5.805-4.75 0-1.055-.697-1.125-1.055-1.055-1.57.305-2.838.527-4.75.527z"
            />
            <path
              fill="#fff"
              d="M4.75 11.611s1.583.528 4.75.528 4.75-.528 4.75-.528-1.056 2.111-4.75 2.111-4.75-2.11-4.75-2.11z"
            />
            <path
              fill="#664500"
              d="M6.333 8.972c.729 0 1.32-.827 1.32-1.847s-.591-1.847-1.32-1.847c-.729 0-1.32.827-1.32 1.847s.591 1.847 1.32 1.847zM12.667 8.972c.729 0 1.32-.827 1.32-1.847s-.591-1.847-1.32-1.847c-.729 0-1.32.827-1.32 1.847s.591 1.847 1.32 1.847z"
            />
          </svg>
          Haha
        </span>
      </span>
    </button>
  );

  if (!showLikers) return button;

  return (
    <>
      {button}
      <div className="_likers_list _likers_inline">
        <button type="button" onClick={() => setShowAll((v) => !v)}>
          {formatLikers(localLikers, localCount)}
        </button>
        {showAll && localLikers.length > 0 && (
          <ul>
            {localLikers.map((u) => (
              <li key={u.id}>{displayName(u)}</li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
