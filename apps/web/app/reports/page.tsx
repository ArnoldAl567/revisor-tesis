"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { advancesApi, reportsApi, reviewsApi } from "@/lib/api";
import type { Advance } from "@/lib/types";
import { useApp } from "@/lib/ThemeContext";

type VersionRow = Advance & {
  aiAnalysis?: { overallScore: number; gradeConverted: number } | null;
  review?: { finalGrade: number | null } | null;
};

export default function ReportsPage() {
  const { t } = useApp();
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [groupId, setGroupId] = useState("");
  const [versions, setVersions] = useState<VersionRow[]>([]);

  useEffect(() => {
    reviewsApi.list().then((r) => setAdvances(r.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (!groupId) {
      setVersions([]);
      return;
    }
    reportsApi.versionsData(groupId).then((r) => setVersions(r.data)).catch(console.error);
  }, [groupId]);

  const groups = [...new Set(advances.map((a) => a.advanceGroupId).filter(Boolean))] as string[];

  return (
    <div className="p-10 max-w-6xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">{t("reports.title")}</h1>
      <p className="text-sm text-slate-500">{t("reports.subtitle")}</p>

      <div className="surface rounded-[28px] border p-8">
        <h2 className="font-bold mb-4">{t("reports.individual.title")}</h2>
        <ul className="divide-y">
          {advances.map((a) => (
            <li key={a.id} className="py-4 flex flex-wrap justify-between items-center gap-3">
              <div>
                <p className="font-bold text-sm">{a.title}</p>
                <p className="text-xs text-slate-400">{a.student?.name} · v{a.version}</p>
              </div>
              <div className="flex gap-2">
                <a
                  href={reportsApi.acta(a.id)}
                  target="_blank"
                  className="text-xs font-bold border px-3 py-2 rounded-xl hover:bg-slate-50/60 dark:hover:bg-white/5 transition-colors"
                >
                  {t("reports.viewHtml")}
                </a>
                <a
                  href={reportsApi.actaPdf(a.id)}
                  className="text-xs font-bold bg-[#185FA5] text-white px-3 py-2 rounded-xl"
                >
                  {t("reports.downloadPdf")}
                </a>
                <Link href={`/reviews/${a.id}`} className="text-xs font-bold text-[#185FA5] px-3 py-2">
                  {t("reports.review")}
                </Link>
              </div>
            </li>
          ))}
          {advances.length === 0 && <p className="text-slate-400 text-sm">{t("reports.empty")}</p>}
        </ul>
      </div>

      <div className="surface rounded-[28px] border p-8">
        <h2 className="font-bold mb-4">{t("reports.compare.title")}</h2>
        <select
          className="w-full input-premium !text-sm mb-4"
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
        >
          <option value="">{t("reports.compare.selectGroup")}</option>
          {groups.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        {versions.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 text-xs uppercase">
                <th className="pb-2">{t("reports.table.version")}</th>
                <th>{t("reports.table.title")}</th>
                <th>{t("reports.table.aiCompliance")}</th>
                <th>{t("reports.table.aiGrade")}</th>
                <th>{t("reports.table.humanGrade")}</th>
              </tr>
            </thead>
            <tbody>
              {versions.map((v) => (
                <tr key={v.id} className="border-t">
                  <td className="py-3 font-bold">v{v.version}</td>
                  <td>{v.title}</td>
                  <td>{v.aiAnalysis?.overallScore ?? "—"}%</td>
                  <td>{v.aiAnalysis?.gradeConverted ?? "—"}</td>
                  <td>{v.review?.finalGrade ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
