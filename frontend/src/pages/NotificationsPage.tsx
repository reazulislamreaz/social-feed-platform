import { FeedShell } from "../components/FeedShell";
import { NotificationsPanel } from "../components/NotificationsPanel";

/** Full notifications page — same panel UI as the header dropdown */
export function NotificationsPage() {
  return (
    <FeedShell>
      <div className="_notifications_page_wrap">
        <NotificationsPanel />
      </div>
    </FeedShell>
  );
}
