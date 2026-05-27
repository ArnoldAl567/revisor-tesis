"use client";
import { LayoutDashboard, Upload, FileSearch, Layers, BarChart3, Settings, GraduationCap, FileText, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getStoredUser, clearAuth, type AuthUser } from "@/lib/auth";
import { NotificationsPanel } from "./notifications-panel";
import { useApp } from "@/lib/ThemeContext";

const menu = [
  {
    categoryKey: "sidebar.category.main",
    items: [
      { nameKey: "sidebar.item.dashboard", icon: LayoutDashboard, href: "/" },
      { nameKey: "sidebar.item.upload", icon: Upload, href: "/upload" },
      { nameKey: "sidebar.item.reviews", icon: FileSearch, href: "/reviews" },
      { nameKey: "sidebar.item.bulk", icon: Layers, href: "/bulk" },
    ],
  },
  {
    categoryKey: "sidebar.category.analytics",
    items: [
      { nameKey: "sidebar.item.reports", icon: FileText, href: "/reports" },
      { nameKey: "sidebar.item.stats", icon: BarChart3, href: "/stats" },
      { nameKey: "sidebar.item.config", icon: Settings, href: "/config" },
    ],
  },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const { t } = useApp();

  useEffect(() => { setUser(getStoredUser()); }, [pathname]);

  const initials = user?.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "MC";

  const logout = () => { clearAuth(); router.push("/login"); };

  return (
    <aside className="w-64 h-full flex flex-col flex-shrink-0 transition-colors duration-300 border-r border-inherit"
           style={{ backgroundColor: 'var(--bg-sidebar)' }}>
      <div className="p-8 flex items-center gap-3">
        <div className="bg-[#185FA5] p-2 rounded-xl text-white shadow-lg"><GraduationCap size={24} /></div>
        <div className="dark:text-white">
          <h2 className="text-[15px] font-bold tracking-tight">ThesisReview</h2>
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">v2.0 · IA Académica</p>
        </div>
      </div>

      <nav className="flex-1 px-4 overflow-y-auto">
        {menu.map((section) => (
          <div key={section.categoryKey} className="mb-6">
            <h3 className="text-[10px] font-bold uppercase tracking-widest mb-4 px-3 text-slate-400">
              {t(section.categoryKey)}
            </h3>
            <div className="space-y-1.5">
              {section.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} 
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all ${
                      active ? "sidebar-active" : "text-slate-500 hover:bg-black/5 dark:hover:bg-white/5"
                    }`}>
                    <item.icon size={18} strokeWidth={2.5} className={active ? "text-[#185FA5] dark:text-white" : "text-slate-400"} />
                    {t(item.nameKey)}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
        <NotificationsPanel />
      </nav>

      <div className="p-4 border-t border-inherit">
        <div className="flex items-center gap-3 bg-white/50 dark:bg-slate-800/50 p-3 rounded-2xl border border-inherit">
          <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-[11px] font-bold text-blue-600">{initials}</div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold truncate">{user?.name ?? "María Castillo"}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase">Coordinador</p>
          </div>
          <button onClick={logout} className="text-slate-400 hover:text-red-500 transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}