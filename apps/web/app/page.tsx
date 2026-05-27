"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { dashboardApi, programsApi } from "@/lib/api";
import { useApp } from "@/lib/ThemeContext";
import type { ProgramRef, DashboardOverview } from "@/lib/types";

export default function DashboardPage() {
  const { t, locale, language } = useApp();
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [programs, setPrograms] = useState<ProgramRef[]>([]);
  const [programId, setProgramId] = useState("");
  const [status, setStatus] = useState("");
  const [minScore, setMinScore] = useState("");
  const [maxScore, setMaxScore] = useState("");

  useEffect(() => {
    programsApi.list().then(r => setPrograms(r.data)).catch(console.error);
  }, []);

  useEffect(() => {
    const params: any = {};
    if (programId) params.programId = programId;
    if (status) params.status = status;
    if (minScore) params.minScore = minScore;
    if (maxScore) params.maxScore = maxScore;
    dashboardApi.overview(params).then(r => setData(r.data)).catch(console.error);
  }, [programId, status, minScore, maxScore]);

  const k = data?.kpis;

  return (
    <div className="p-10 max-w-7xl mx-auto">
      <header className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-black">{t("dashboard.title")}</h1>
          <div className="mt-4 flex gap-2">
            <select className="input-premium" value={programId} onChange={(e) => setProgramId(e.target.value)}>
              <option value="">{t("dashboard.todosPrograms")}</option>
              {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select className="input-premium" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">{t("dashboard.todosEstados")}</option>
              <option value="PENDING">{t("dashboard.status.pending")}</option>
              <option value="IN_HUMAN_REVIEW">{t("dashboard.status.inHumanReview")}</option>
            </select>
            <input type="number" placeholder={t("dashboard.filter.min")} className="input-premium w-24" value={minScore} onChange={(e) => setMinScore(e.target.value)} />
            <input type="number" placeholder={t("dashboard.filter.max")} className="input-premium w-24" value={maxScore} onChange={(e) => setMaxScore(e.target.value)} />
          </div>
        </div>
        <Link href="/upload" className="bg-[#185FA5] text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-transform hover:scale-105">
          + {t("dashboard.nuevoAvance")}
        </Link>
      </header>

      {/* 6 KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5 mb-10">
        {[
          { label: t("dashboard.pendientes"), val: k?.pending ?? "20" },
          { label: t("dashboard.revisados"), val: k?.reviewed ?? "10" },
          { label: t("dashboard.concordanciaIA"), val: k?.iaHumanConcordance != null ? `${k.iaHumanConcordance}%` : "85%" },
          { label: t("dashboard.notaPromIA"), val: k?.avgAiGrade ?? "12.2" },
          { label: t("dashboard.rechazados"), val: k?.rejected ?? "1" },
          { label: t("dashboard.notaHumana"), val: k?.avgHumanGrade ?? "11.7" },
        ].map((kpi, i) => (
          <div key={i} className="card-professional p-7">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">{kpi.label}</p>
            <p className="text-4xl font-black">{kpi.val}</p>
          </div>
        ))}
      </div>

      {/* Alerta Roja con Alumnos Seleccionables */}
      {(k?.lowComplianceCount ?? 0) > 0 && (
        <div className="mb-10 p-6 rounded-[24px] bg-[#fff1f1] border border-[#fee2e2] dark:bg-[#450a0a] dark:border-[#7f1d1d]">
          <p className="text-sm font-bold mb-4 text-red-700 dark:text-red-300">
            {k?.lowComplianceCount} {t("dashboard.alertLow")} {"<"} 60%
          </p>
          <div className="space-y-3">
            {(data?.alerts || []).map((a: any) => (
              <Link key={a.id} href={`/reviews/${a.id}`} className="flex justify-between text-[13px] font-bold text-red-800/80 dark:text-red-300/80 hover:underline transition-all">
                <span>{a.title} — <span className="opacity-60">{a.student}</span></span>
                <span>{a.score}%</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Avances Recientes Seleccionables */}
        <div className="lg:col-span-2 card-professional overflow-hidden">
          <div className="p-6 border-b border-inherit bg-slate-50/10 font-bold text-sm">
            {t("dashboard.avancesRecientes")}
          </div>
          <div className="divide-y divide-inherit">
            {(data?.recentAdvances || []).map((a: any) => (
              <Link key={a.id} href={`/reviews/${a.id}`} className="p-6 flex items-center gap-5 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                <div className="flex-1">
                  <p className="text-[14px] font-bold group-hover:text-blue-600 transition-colors">{a.title}</p>
                  <p className="text-[11px] font-bold text-slate-400 uppercase mt-1">{a.student} · {a.program}</p>
                </div>
                <span className="text-[10px] font-extrabold px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase tracking-tighter">
                  {a.status}
                </span>
                <span className={`font-black text-sm ${a.overallScore < 60 ? "text-red-600" : "text-green-600"}`}>{a.overallScore}%</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Actividad Reciente Completa */}
        <div className="card-professional p-8">
          <h3 className="font-bold text-sm mb-8 uppercase tracking-widest opacity-50">{t("dashboard.actividadReciente")}</h3>
          <div className="space-y-8">
            {(data?.timeline || []).map((t_item: any) => (
              <div key={t_item.id}>
                <p className="text-[13px] font-semibold leading-snug">{t_item.message}</p>
                <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">
                  {new Date(t_item.createdAt).toLocaleString(locale)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}