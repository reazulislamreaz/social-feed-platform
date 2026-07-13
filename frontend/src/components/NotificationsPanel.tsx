import { useMemo, useState } from "react";
import { useNotifications } from "../context/NotificationContext";

type Filter = "all" | "unread";

type Props = {
  /** Compact dropdown layout under the bell */
  embedded?: boolean;
  initialFilter?: Filter;
  onOpenFullPage?: () => void;
};

export function NotificationsPanel({
  embedded = false,
  initialFilter = "all",
  onOpenFullPage,
}: Props) {
  const { items, markAllRead, markOneRead } = useNotifications();
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [menuOpen, setMenuOpen] = useState(false);

  const visible = useMemo(
    () => (filter === "unread" ? items.filter((n) => n.unread) : items),
    [filter, items],
  );

  return (
    <div
      className={
        embedded
          ? "_notifications_panel_inner"
          : "_notifications_page_card _b_radious6"
      }
      onClick={(e) => e.stopPropagation()}
    >
      <div className="_notifications_content">
        <h4 className="_notifications_content_title">Notifications</h4>
        <div className="_notification_box_right">
          <button
            type="button"
            className="_notification_box_right_link"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            aria-label="Notification options"
            aria-expanded={menuOpen}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="4" height="17" fill="none" viewBox="0 0 4 17">
              <circle cx="2" cy="2" r="2" fill="#C4C4C4" />
              <circle cx="2" cy="8" r="2" fill="#C4C4C4" />
              <circle cx="2" cy="15" r="2" fill="#C4C4C4" />
            </svg>
          </button>
          {menuOpen && (
            <div className="_notifications_drop_right" style={{ display: "block" }}>
              <ul className="_notification_list">
                <li className="_notification_item">
                  <button
                    type="button"
                    className="_notification_link"
                    onClick={() => {
                      markAllRead();
                      setMenuOpen(false);
                    }}
                  >
                    Mark as all read
                  </button>
                </li>
                <li className="_notification_item">
                  <span className="_notification_link">Notifications settings</span>
                </li>
                {onOpenFullPage && (
                  <li className="_notification_item">
                    <button
                      type="button"
                      className="_notification_link"
                      onClick={() => {
                        setMenuOpen(false);
                        onOpenFullPage();
                      }}
                    >
                      Open Notifications
                    </button>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="_notifications_drop_box">
        <div className="_notifications_drop_btn_grp">
          <button
            type="button"
            className={filter === "all" ? "_notifications_btn_link" : "_notifications_btn_link1"}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            type="button"
            className={filter === "unread" ? "_notifications_btn_link" : "_notifications_btn_link1"}
            onClick={() => setFilter("unread")}
          >
            Unread
          </button>
        </div>

        <div className="_notifications_all">
          {visible.length === 0 && (
            <p className="_notifications_empty">No notifications</p>
          )}
          {visible.map((n) => (
            <div
              key={n.id}
              className={`_notification_box${n.unread ? " _notification_unread" : ""}`}
              onClick={() => markOneRead(n.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") markOneRead(n.id);
              }}
            >
              <div className="_notification_image">
                <img src={n.avatar} alt="" className="_notify_img" />
              </div>
              <div className="_notification_txt">
                <p
                  className="_notification_para"
                  dangerouslySetInnerHTML={{ __html: n.messageHtml }}
                />
                <div className="_nitification_time">
                  <span>{n.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
