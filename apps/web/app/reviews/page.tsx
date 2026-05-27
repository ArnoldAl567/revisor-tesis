"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { programsApi, reviewsApi } from "@/lib/api";
import type { Advance, ProgramRef } from "@/lib/types";
import { useApp } from "@/lib/ThemeContext";

export default function ReviewsListPage() {
  const { t } = useApp();
  const [items, setItems] = useState<Advance[]>([]);
  const [programId, setProgramId] = useState("");
  const [programs, setPrograms] = useState<ProgramRef[]>([]);

  useEffect(() => {
    programsApi.list().then((r) => setPrograms(r.data)).catch(console.error);
  }, []);

  useEffect(() => {
    const params = programId ? { programId } : undefined;
    reviewsApi.list(params).then((r) => setItems(r.data)).catch(console.error);
  }, [programId]);

  return (
    <div className="p-10 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("reviews.list.title")}</h1>
          <p className="text-sm text-slate-500">{t("reviews.list.subtitle")}</p>
        </div>
        <select className="input-premium !text-sm" value={programId} onChange={(e) => setProgramId(e.target.value)}>
          <option value="">{t("reviews.list.allPrograms")}</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
      <div className="space-y-3">
        {items.map((a) => (
          <Link key={a.id} href={`/reviews/${a.id}`} className="block surface border rounded-2xl p-5 hover:bg-slate-50/60 dark:hover:bg-white/5 transition-colors">
            <div className="flex justify-between">
              <div>
                <p className="font-bold">{a.title}</p>
                <p className="text-xs text-slate-400">{a.student?.name} · {a.program?.name}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-500">{a.status}</p>
                {a.aiAnalysis && <p className="text-lg font-bold text-[#185FA5]">{a.aiAnalysis.overallScore}%</p>}
              </div>
            </div>
          </Link>
        ))}
        {items.length === 0 && <p className="text-slate-400 italic">{t("reviews.list.empty")}</p>}
      </div>
    </div>
  );
}
