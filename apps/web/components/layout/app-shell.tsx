"use client";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import ThemeLanguageToggle from "@/components/ThemeLanguageToggle";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/login") return <>{children}</>;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex justify-end items-center px-8 py-3 h-16 border-b border-inherit opacity-70">
          <ThemeLanguageToggle />
        </div>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}