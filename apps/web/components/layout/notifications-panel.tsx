"use client";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { notificationsApi } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { useApp } from "@/lib/ThemeContext";

type Notification = {
  id: string; title: string; message: string;
  type: string; read: boolean;
  advanceId?: string | null; createdAt: string;
};

export function NotificationsPanel() {
  const { t } = useApp();
  const [open, setOpen]   = useState(false);
  const [items, setItems] = useState<Notification[]>([]);

  const load = () => {
    const user = getStoredUser();
    notificationsApi.list(user?.id, true).then((r) => setItems(r.data)).catch(() => {});
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  const unread = items.filter((n) => !n.read).length;

  return (
    <div className="relative px-4 mb-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="
          w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all
          text-slate-600 hover:bg-slate-200/50
          dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-slate-200
        "
      >
        <Bell size={18} />
        {t("notifications.title")}
        {unread > 0 && (
          <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="
          absolute left-4 right-4 bottom-full mb-2
          rounded-2xl shadow-lg max-h-64 overflow-y-auto z-50
          bg-white border border-slate-200
          dark:bg-slate-800 dark:border-slate-700
        ">
          {items.length === 0 && (
            <p className="p-4 text-xs text-slate-400 dark:text-slate-500">
              {t("notifications.empty")}
            </p>
          )}
          {items.map((n) => (
            <div key={n.id} className="
              p-3 text-xs last:border-0
              border-b border-slate-100 dark:border-slate-700
            ">
              <p className="font-bold text-slate-800 dark:text-slate-100">{n.title}</p>
              <p className="mt-1 text-slate-500 dark:text-slate-400">{n.message}</p>
              <button
                type="button"
                className="mt-2 font-bold text-[#185FA5] dark:text-blue-400 hover:underline"
                onClick={async () => { await notificationsApi.markRead(n.id); load(); }}
              >
                {t("notifications.markRead")}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}