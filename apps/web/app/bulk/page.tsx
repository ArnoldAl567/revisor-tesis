"use client";
import { useCallback, useEffect, useState } from "react";
import { bulkApi, programsApi } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import type { BulkJob, ProgramRef } from "@/lib/types";
import { useApp } from "@/lib/ThemeContext";

type EligibleAdvance = {
  id: string;
  title: string;
  status: string;
  student?: { name: string };
  program?: { name: string };
};

export default function BulkReview() {
  const { t } = useApp();
  const [advances, setAdvances] = useState<EligibleAdvance[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [job, setJob] = useState<BulkJob | null>(null);
  const [programId, setProgramId] = useState("");
  const [programs, setPrograms] = useState<ProgramRef[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadEligible = useCallback(() => {
    bulkApi
      .eligible({ programId: programId || undefined })
      .then((r) => {
        setAdvances(r.data);
        setError(r.data.length === 0 ? t("bulk.error.noEligible") : null);
      })
      .catch((e) => {
        setError(e.response?.data?.message || t("bulk.error.load"));
        setAdvances([]);
      });
  }, [programId, t]);

  useEffect(() => {
    programsApi.list().then((r) => setPrograms(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    loadEligible();
  }, [loadEligible]);

  useEffect(() => {
    if (!job?.id) return;
    const t = setInterval(() => {
      bulkApi.job(job.id).then((r) => {
        setJob(r.data);
        if (r.data.status === "COMPLETED" || r.data.status === "FAILED") {
          loadEligible();
        }
      });
    }, 3000);
    return () => clearInterval(t);
  }, [job?.id, loadEligible]);

  const toggle = (id: string) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const startBulk = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = getStoredUser();
      const res = await bulkApi.create({
        advanceIds: selected.length ? selected : undefined,
        programId: programId || undefined,
        status: "PENDING",
        createdById: user?.id ?? "coord-01",
      });
      setJob(res.data);
      if (res.data.skipped > 0) {
        setError(`${res.data.skipped} avance(s) omitidos por no tener archivo.`);
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string | string[] } } };
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(", ") : msg || t("bulk.error.start"));
    } finally {
      setLoading(false);
    }
  };

  const progress = job ? Math.round((job.processed / Math.max(job.total, 1)) * 100) : 0;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">{t("bulk.title")}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {t("bulk.subtitle")}
          </p>
        </div>
        <button
          onClick={startBulk}
          disabled={loading || advances.length === 0}
          className="bg-[#185FA5] text-white px-6 py-2 rounded-2xl font-bold text-sm disabled:opacity-50"
        >
          {loading ? t("bulk.starting") : t("bulk.start")}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          {error}
        </div>
      )}

      {job && (
        <div className="mb-8 p-6 surface border rounded-2xl">
          <p className="text-sm font-bold mb-2">
            {t("bulk.progress")} {job.status} — {job.message || ""}
          </p>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#185FA5] transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {t("bulk.processed", { processed: job.processed, total: job.total, failed: job.failed })}
          </p>
          {job.items?.some((i) => i.status === "FAILED") && (
            <ul className="mt-3 text-xs text-red-600 space-y-1">
              {job.items
                .filter((i) => i.status === "FAILED")
                .map((i) => (
                  <li key={i.id}>
                    {i.advance?.title ?? i.advanceId}: {i.error}
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}

      <div className="surface rounded-[32px] border p-6 mb-4">
        <select
          className="w-full input-premium !text-sm mb-4"
          value={programId}
          onChange={(e) => setProgramId(e.target.value)}
        >
          <option value="">{t("bulk.allPrograms")}</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setSelected(advances.map((a) => a.id))}
          className="text-xs font-bold text-slate-500"
        >
          {t("bulk.selectAll", { count: advances.length })}
        </button>
      </div>

      <div className="surface rounded-[32px] border divide-y divide-inherit">
        {advances.map((a) => (
          <label key={a.id} className="p-5 flex items-center gap-4 cursor-pointer hover:bg-slate-50/60 dark:hover:bg-white/5 transition-colors">
            <input type="checkbox" checked={selected.includes(a.id)} onChange={() => toggle(a.id)} />
            <div className="flex-1">
              <p className="font-bold text-sm">{a.title}</p>
              <p className="text-xs text-slate-400">
                {a.student?.name} · {a.program?.name}
              </p>
            </div>
            <span className="text-xs font-bold text-amber-700">{a.status}</span>
          </label>
        ))}
        {advances.length === 0 && (
          <p className="p-8 text-center text-slate-400 italic">{t("bulk.empty")}</p>
        )}
      </div>
    </div>
  );
}
