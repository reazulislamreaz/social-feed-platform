export type AppNotification = {
  id: string;
  avatar: string;
  /** HTML-safe bold parts already marked with <span class="_notify_txt_link"> */
  messageHtml: string;
  time: string;
  unread: boolean;
};

/** Demo notifications matching Buddy Script notification mockup */
export const DEMO_NOTIFICATIONS: AppNotification[] = [
  {
    id: "1",
    avatar: "/assets/images/friend-req.png",
    messageHtml:
      '<span class="_notify_txt_link">Steve Jobs</span> posted a link in your timeline.',
    time: "42 miniutes ago",
    unread: true,
  },
  {
    id: "2",
    avatar: "/assets/images/profile-1.png",
    messageHtml:
      'An admin changed the name of the group <span class="_notify_txt_link">Freelacer usa</span> to <span class="_notify_txt_link">Freelacer usa</span>',
    time: "42 miniutes ago",
    unread: false,
  },
  {
    id: "3",
    avatar: "/assets/images/friend-req.png",
    messageHtml:
      '<span class="_notify_txt_link">Steve Jobs</span> posted a link in your timeline.',
    time: "42 miniutes ago",
    unread: false,
  },
  {
    id: "4",
    avatar: "/assets/images/profile-1.png",
    messageHtml:
      'An admin changed the name of the group <span class="_notify_txt_link">Freelacer usa</span> to <span class="_notify_txt_link">Freelacer usa</span>',
    time: "42 miniutes ago",
    unread: false,
  },
  {
    id: "5",
    avatar: "/assets/images/friend-req.png",
    messageHtml:
      '<span class="_notify_txt_link">Steve Jobs</span> posted a link in your timeline.',
    time: "42 miniutes ago",
    unread: false,
  },
  {
    id: "6",
    avatar: "/assets/images/profile-1.png",
    messageHtml:
      'An admin changed the name of the group <span class="_notify_txt_link">Freelacer usa</span> to <span class="_notify_txt_link">Freelacer usa</span>',
    time: "42 miniutes ago",
    unread: false,
  },
  {
    id: "7",
    avatar: "/assets/images/friend-req.png",
    messageHtml:
      '<span class="_notify_txt_link">Steve Jobs</span> posted a link in your timeline.',
    time: "42 miniutes ago",
    unread: true,
  },
  {
    id: "8",
    avatar: "/assets/images/profile-1.png",
    messageHtml:
      'An admin changed the name of the group <span class="_notify_txt_link">Freelacer usa</span> to <span class="_notify_txt_link">Freelacer usa</span>',
    time: "42 miniutes ago",
    unread: true,
  },
];
