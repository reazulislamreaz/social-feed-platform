import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEMO_NOTIFICATIONS, type AppNotification } from "../data/notifications";

type NotificationContextValue = {
  items: AppNotification[];
  unreadCount: number;
  markAllRead: () => void;
  markOneRead: (id: string) => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<AppNotification[]>(DEMO_NOTIFICATIONS);

  const markAllRead = useCallback(() => {
    setItems((prev) => prev.map((n) => ({ ...n, unread: false })));
  }, []);

  const markOneRead = useCallback((id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
  }, []);

  const unreadCount = useMemo(() => items.filter((n) => n.unread).length, [items]);

  const value = useMemo(
    () => ({ items, unreadCount, markAllRead, markOneRead }),
    [items, unreadCount, markAllRead, markOneRead],
  );

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
