"use client";
import { useApp } from "@/lib/ThemeContext";

export default function ThemeLanguageToggle() {
  const { theme, toggleTheme, language, toggleLanguage, t } = useApp();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleLanguage}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-extrabold bg-[#1e293b] text-white shadow-sm hover:scale-105 transition-all"
      >
        <span className="opacity-60">🌐</span>
        <span>{language === "es" ? "ES" : "EN"}</span>
      </button>

      <button
        onClick={toggleTheme}
        className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-extrabold shadow-sm active:scale-95 transition-all border ${
          theme === 'light' ? "bg-white text-slate-800 border-slate-200" : "bg-slate-800 text-white border-slate-700"
        }`}
      >
        <span>{theme === "light" ? `🌙 ${t("toggle.darkMode")}` : `☀️ ${t("toggle.lightMode")}`}</span>
      </button>
    </div>
  );
}