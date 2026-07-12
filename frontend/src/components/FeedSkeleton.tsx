/** Skeleton placeholders matching Buddy Script middle-feed cards */
export function FeedSkeleton() {
  return (
    <div className="_feed_skeleton" aria-busy="true" aria-label="Loading feed">
      <div className="_feed_skeleton_stories _b_radious6 _mar_b16">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="_feed_skeleton_story _skel_pulse" />
        ))}
      </div>

      <div className="_feed_inner_text_area _b_radious6 _padd_b24 _padd_t24 _padd_r24 _padd_l24 _mar_b16">
        <div className="_feed_skeleton_create">
          <div className="_skel_avatar _skel_pulse" />
          <div className="_skel_line _skel_pulse" style={{ flex: 1, height: 48 }} />
        </div>
        <div className="_feed_skeleton_create_actions">
          <div className="_skel_chip _skel_pulse" />
          <div className="_skel_chip _skel_pulse" />
          <div className="_skel_chip _skel_pulse" />
          <div className="_skel_chip _skel_pulse" />
          <div className="_skel_btn _skel_pulse" />
        </div>
      </div>

      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="_feed_inner_timeline_post_area _b_radious6 _padd_b24 _padd_t24 _mar_b16"
        >
          <div className="_padd_r24 _padd_l24">
            <div className="_feed_skeleton_post_top">
              <div className="_skel_avatar _skel_pulse" />
              <div style={{ flex: 1 }}>
                <div className="_skel_line _skel_pulse" style={{ width: "40%", height: 14, marginBottom: 8 }} />
                <div className="_skel_line _skel_pulse" style={{ width: "28%", height: 12 }} />
              </div>
            </div>
            <div className="skel_line _skel_pulse" style={{ width: "70%", height: 16, margin: "16px 0" }} />
            <div className="_skel_media _skel_pulse" />
            <div className="_feed_skeleton_reacts">
              <div className="skel_line _skel_pulse" style={{ width: 80, height: 24 }} />
              <div className="skel_line _skel_pulse" style={{ width: 120, height: 14 }} />
            </div>
          </div>
          <div className="_feed_skeleton_reaction _skel_pulse" />
        </div>
      ))}
    </div>
  );
}

export function CommentsSkeleton() {
  return (
    <div className="_feed_skeleton_comments _padd_l24 _padd_r24">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="_feed_skeleton_comment">
          <div className="_skel_avatar _skel_avatar_sm _skel_pulse" />
          <div style={{ flex: 1 }}>
            <div className="_skel_bubble _skel_pulse" />
            <div className="skel_line _skel_pulse" style={{ width: "35%", height: 10, marginTop: 8 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
