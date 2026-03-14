import { useState, useEffect, useCallback } from "react";
import { Bell, Check, CheckCheck, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Notification {
  id: string;
  type: string;
  title: string;
  description: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("admin_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

function typeIcon(type: string): string {
  switch (type) {
    case "discovery_call": return "📞";
    case "email_capture": return "📧";
    case "new_subscriber": return "🎉";
    case "cancellation": return "⚠️";
    case "retainer_checkin": return "📅";
    default: return "🔔";
  }
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications", { headers: authHeaders() });
      if (res.ok) {
        setNotifications(await res.json());
      }
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    await fetch(`/api/admin/notifications/${id}/read`, {
      method: "POST",
      headers: authHeaders(),
    });
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await fetch("/api/admin/notifications/read-all", {
      method: "POST",
      headers: authHeaders(),
    });
  };

  const handleNotificationClick = (notif: Notification) => {
    if (!notif.read) {
      markRead(notif.id);
    }
    if (notif.link) {
      window.location.href = notif.link;
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative text-neutral-400 hover:text-neutral-100">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0 bg-neutral-900 border-neutral-700">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
          <h3 className="font-semibold text-sm text-neutral-100">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllRead}
              className="text-xs text-neutral-400 hover:text-neutral-100 h-auto py-1 px-2"
            >
              <CheckCheck className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-neutral-500 text-sm">
              No notifications yet
            </div>
          ) : (
            <div className="divide-y divide-neutral-800">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleNotificationClick(notif)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleNotificationClick(notif); }}
                  className={`w-full text-left px-4 py-3 hover:bg-neutral-800/50 transition-colors flex gap-3 cursor-pointer ${
                    !notif.read ? "bg-neutral-800/30" : ""
                  }`}
                >
                  <span className="text-lg flex-shrink-0 mt-0.5">{typeIcon(notif.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium truncate ${!notif.read ? "text-neutral-100" : "text-neutral-400"}`}>
                        {notif.title}
                      </span>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{notif.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-neutral-600">{timeAgo(notif.createdAt)}</span>
                      {notif.link && (
                        <ExternalLink className="w-3 h-3 text-neutral-600" />
                      )}
                    </div>
                  </div>
                  {!notif.read && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        markRead(notif.id);
                      }}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); markRead(notif.id); } }}
                      className="flex-shrink-0 mt-1 text-neutral-600 hover:text-neutral-300 transition-colors"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
