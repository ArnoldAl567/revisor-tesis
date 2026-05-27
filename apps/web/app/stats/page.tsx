"use client";
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
} from "recharts";
import { programsApi, statsApi } from "@/lib/api";
import type { ProgramRef, StatsAnalytics } from "@/lib/types";
import { useApp } from "@/lib/ThemeContext";

const COLORS = ["#185FA5", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"];

export default function StatsPage() {
  const { t } = useApp();
  const [data, setData] = useState<StatsAnalytics | null>(null);
  const [programs, setPrograms] = useState<ProgramRef[]>([]);
  const [programId, setProgramId] = useState("");

  useEffect(() => {
    programsApi.list().then((r) => setPrograms(r.data)).catch(console.error);
  }, []);

  useEffect(() => {
    statsApi.analytics(programId || undefined).then((r) => setData(r.data)).catch(console.error);
  }, [programId]);

  const radar = data?.radar
    ? [
        { dim: t("stats.dim.structure"), val: data.radar.structure },
        { dim: t("stats.dim.content"), val: data.radar.content },
        { dim: t("stats.dim.form"), val: data.radar.form },
        { dim: t("stats.dim.originality"), val: data.radar.originality },
      ]
    : [];

  const advisorData =
    data?.advisorLoad?.map((a) => ({
      name: (a as { name?: string }).name ?? a.reviewerId.slice(0, 8),
      carga: a._count.id,
    })) ?? [];

  return (
    <div className="p-10 space-y-10 max-w-6xl mx-auto">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-bold">{t("stats.title")}</h1>
        <div className="flex gap-3 items-center">
          <select
            className="input-premium !text-sm"
            value={programId}
            onChange={(e) => setProgramId(e.target.value)}
          >
            <option value="">{t("stats.allPrograms")}</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <a href={statsApi.csv(programId || undefined)} className="text-sm font-bold border px-4 py-2 rounded-xl hover:bg-slate-50/60 dark:hover:bg-white/5 transition-colors">
            {t("stats.exportCsv")}
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="surface p-8 rounded-[32px] border h-[380px]">
          <h3 className="font-bold text-xs uppercase text-slate-500 mb-6">{t("stats.chart.scoreDist")}</h3>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={data?.scoreDistribution ?? []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#185FA5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="surface p-8 rounded-[32px] border h-[380px]">
          <h3 className="font-bold text-xs uppercase text-slate-500 mb-6">{t("stats.chart.reviewStatus")}</h3>
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Pie data={data?.byStatus ?? []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {(data?.byStatus ?? []).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="surface p-8 rounded-[32px] border h-[380px]">
          <h3 className="font-bold text-xs uppercase text-slate-500 mb-6">{t("stats.chart.byMonth")}</h3>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={data?.byMonth ?? []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#185FA5" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="surface p-8 rounded-[32px] border h-[380px]">
          <h3 className="font-bold text-xs uppercase text-slate-500 mb-6">{t("stats.chart.concordance")}</h3>
          <ResponsiveContainer width="100%" height="85%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" dataKey="ia" name={t("stats.axis.ai")} />
              <YAxis type="number" dataKey="human" name={t("stats.axis.human")} />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <Scatter data={data?.iaHumanConcordance ?? []} fill="#10b981" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="surface p-8 rounded-[32px] border h-[380px]">
          <h3 className="font-bold text-xs uppercase text-slate-500 mb-6">{t("stats.chart.advisorLoad")}</h3>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={advisorData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={80} />
              <Tooltip />
              <Bar dataKey="carga" fill="#f59e0b" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="surface p-8 rounded-[32px] border h-[380px]">
          <h3 className="font-bold text-xs uppercase text-slate-500 mb-6">{t("stats.chart.radar")}</h3>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={radar}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="dim" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="val" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
