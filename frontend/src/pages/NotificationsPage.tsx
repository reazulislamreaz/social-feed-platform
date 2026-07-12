import { FeedShell } from "../components/FeedShell";
import { LeftSidebar } from "../components/LeftSidebar";
import { NotificationsPanel } from "../components/NotificationsPanel";

/** Full notifications page — same UI as the header dropdown panel */
export function NotificationsPage() {
  return (
    <FeedShell left={<LeftSidebar />}>
      <div className="_notifications_page_wrap">
        <NotificationsPanel />
      </div>
    </FeedShell>
  );
}
