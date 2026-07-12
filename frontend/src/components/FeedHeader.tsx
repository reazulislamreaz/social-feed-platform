import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { NotificationsPanel } from "./NotificationsPanel";
import navHtml from "../design/nav.html?raw";

/**
 * Buddy Script navbar with React wiring for notifications popup,
 * profile dropdown, and logout.
 */
export function FeedHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifyMount, setNotifyMount] = useState<HTMLElement | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const name = `${user?.firstName ?? "Dylan"} ${user?.lastName ?? "Field"}`.trim();
  const onNotificationsPage = location.pathname === "/notifications";

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    root.querySelectorAll("._header_nav_para, ._nav_dropdown_title").forEach((el) => {
      el.textContent = name;
    });

    root.querySelectorAll('a[href="feed.html"]').forEach((a) => {
      a.setAttribute("href", "/");
    });

    const counts = root.querySelectorAll("._counting");
    if (counts[0]) counts[0].textContent = "6";
    if (counts[1]) counts[1].textContent = "2";

    const drop = root.querySelector("#_notify_drop") as HTMLElement | null;
    if (drop) {
      drop.innerHTML = "";
      setNotifyMount(drop);
    }

    const brand = root.querySelector(".navbar-brand");
    if (brand) brand.setAttribute("href", "/");
  }, [name]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const notifyDrop = root.querySelector("#_notify_drop");
    const profileDrop = root.querySelector("#_prfoile_drop");
    notifyDrop?.classList.toggle("show", notifyOpen);
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

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const notifyBtn = root.querySelector("#_notify_btn");
    const profileBtn = root.querySelector("#_profile_drop_show_btn");

    const onNotify = (e: Event) => {
      const t = e.target as HTMLElement;
      if (t.closest("#_notify_drop")) return;
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
      const root = rootRef.current;
      if (!root?.contains(e.target as Node)) {
        setNotifyOpen(false);
        setProfileOpen(false);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setNotifyOpen(false);
        setProfileOpen(false);
      }
    };

    const timer = window.setTimeout(() => {
      document.addEventListener("click", onDocClick);
    }, 0);
    document.addEventListener("keydown", onKey);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [notifyOpen, profileOpen]);

  return (
    <div ref={rootRef} className="_header_react_root">
      <Link to="/" className="visually-hidden">
        Home
      </Link>
      <div dangerouslySetInnerHTML={{ __html: navHtml }} />
      {notifyMount &&
        notifyOpen &&
        createPortal(
          <NotificationsPanel
            embedded
            onOpenFullPage={() => {
              setNotifyOpen(false);
              navigate("/notifications");
            }}
          />,
          notifyMount,
        )}
    </div>
  );
}
