import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { NotificationsPanel } from "./NotificationsPanel";
import navHtml from "../design/nav.html?raw";

/**
 * Buddy Script navbar — bell opens notifications (fixed portal, no CSS clip).
 */
export function FeedHeader() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const name = `${user?.firstName ?? "Dylan"} ${user?.lastName ?? "Field"}`.trim();
  const onNotificationsPage = location.pathname === "/notifications";
  const badge = unreadCount > 9 ? "9+" : String(unreadCount);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    root.querySelectorAll("._header_nav_para, ._nav_dropdown_title").forEach((el) => {
      el.textContent = name;
    });

    root.querySelectorAll('a[href="feed.html"]').forEach((a) => {
      a.setAttribute("href", "/");
    });

    const brand = root.querySelector(".navbar-brand");
    if (brand) brand.setAttribute("href", "/");

    // Empty the static HTML shell — React owns the panel
    const drop = root.querySelector("#_notify_drop") as HTMLElement | null;
    if (drop) {
      drop.innerHTML = "";
      drop.style.display = "none";
    }
  }, [name]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const counts = root.querySelectorAll("._counting");
    if (counts[0]) {
      const el = counts[0] as HTMLElement;
      if (unreadCount > 0) {
        el.textContent = badge;
        el.style.display = "";
      } else {
        el.textContent = "";
        el.style.display = "none";
      }
    }
    if (counts[1]) (counts[1] as HTMLElement).textContent = "2";
  }, [unreadCount, badge]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const profileDrop = root.querySelector("#_prfoile_drop");
    profileDrop?.classList.toggle("show", profileOpen);

    const notifyBtn = root.querySelector("#_notify_btn");
    const homeLink = root.querySelector("li._header_nav_item:first-child ._header_nav_link");

    if (onNotificationsPage || notifyOpen) {
      homeLink?.classList.remove("_header_nav_link_active");
      notifyBtn?.classList.add("_header_nav_link_active");
    } else {
      notifyBtn?.classList.remove("_header_nav_link_active");
      homeLink?.classList.add("_header_nav_link_active");
    }
  }, [notifyOpen, profileOpen, onNotificationsPage]);

  useLayoutEffect(() => {
    if (!notifyOpen) {
      setCoords(null);
      return;
    }

    const update = () => {
      const bell = rootRef.current?.querySelector("#_notify_btn");
      if (!bell) return;
      const rect = bell.getBoundingClientRect();
      const width = Math.min(400, window.innerWidth - 24);
      let left = rect.right - width + 12;
      left = Math.max(12, Math.min(left, window.innerWidth - width - 12));
      setCoords({ top: rect.bottom + 6, left });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [notifyOpen]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const notifyBtn = root.querySelector("#_notify_btn");
    const profileBtn = root.querySelector("#_profile_drop_show_btn");

    const onNotify = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      setNotifyOpen((v) => !v);
      setProfileOpen(false);
    };

    const onProfile = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      setProfileOpen((v) => !v);
      setNotifyOpen(false);
    };

    notifyBtn?.addEventListener("click", onNotify);
    profileBtn?.addEventListener("click", onProfile);

    const logoutLinks = Array.from(root.querySelectorAll("._nav_dropdown_link")).filter((a) =>
      a.textContent?.includes("Log Out"),
    );
    const onLogout = (e: Event) => {
      e.preventDefault();
      void logout();
    };
    logoutLinks.forEach((a) => a.addEventListener("click", onLogout));

    return () => {
      notifyBtn?.removeEventListener("click", onNotify);
      profileBtn?.removeEventListener("click", onProfile);
      logoutLinks.forEach((a) => a.removeEventListener("click", onLogout));
    };
  }, [logout]);

  useEffect(() => {
    if (!notifyOpen && !profileOpen) return;

    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      const t = e.target as HTMLElement;
      if (t.closest?.("#_notify_btn") || t.closest?.("#_profile_drop_show_btn")) return;
      setNotifyOpen(false);
      setProfileOpen(false);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setNotifyOpen(false);
        setProfileOpen(false);
      }
    };

    const timer = window.setTimeout(() => {
      document.addEventListener("mousedown", onDocClick);
    }, 0);
    document.addEventListener("keydown", onKey);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [notifyOpen, profileOpen]);

  const panelWidth = Math.min(400, typeof window !== "undefined" ? window.innerWidth - 24 : 400);

  return (
    <div ref={rootRef} className="_header_react_root">
      <Link to="/" className="visually-hidden">
        Home
      </Link>
      <div dangerouslySetInnerHTML={{ __html: navHtml }} />

      {notifyOpen &&
        coords &&
        createPortal(
          <div
            ref={panelRef}
            className="_notify_portal_panel"
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              width: panelWidth,
              maxHeight: "min(520px, calc(100vh - 80px))",
              overflowY: "auto",
              overflowX: "hidden",
              zIndex: 10000,
              background: "#fff",
              borderRadius: 8,
              boxShadow: "0 8px 24px rgba(149, 157, 165, 0.2)",
              padding: "16px 0 8px",
            }}
            role="dialog"
            aria-label="Notifications"
          >
            <NotificationsPanel
              embedded
              onOpenFullPage={() => {
                setNotifyOpen(false);
                navigate("/notifications");
              }}
            />
          </div>,
          document.body,
        )}
    </div>
  );
}
