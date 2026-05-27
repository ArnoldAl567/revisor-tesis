"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { advancesApi, reportsApi, reviewsApi } from "@/lib/api";
import { getStoredUser, reviewerIdForRole } from "@/lib/auth";
import { DocumentPdfViewer } from "@/components/reviews/document-pdf-viewer";
import type { Advance, AiFinding, ChecklistItem, FindingDecision } from "@/lib/types";
import { useApp } from "@/lib/ThemeContext";

export default function ReviewDetailPage() {
  const { t } = useApp();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Advance | null>(null);
  const [tab, setTab] = useState<"ia" | "human">("ia");
  const [maxGrade, setMaxGrade] = useState(20);
  const [human, setHuman] = useState({ finalGrade: "", humanComment: "", advanceStatus: "IN_HUMAN_REVIEW" });
  const [decisions, setDecisions] = useState<FindingDecision[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [annotation, setAnnotation] = useState({ content: "", page: "" });
  const [versions, setVersions] = useState<Advance[]>([]);

  const reload = () => {
    if (!id) return;
    reviewsApi.one(id).then((r) => {
      setData(r.data);
      const rev = r.data.review;
      if (rev?.finalGrade != null) setHuman((h) => ({ ...h, finalGrade: String(rev.finalGrade) }));
      if (rev?.humanComment) setHuman((h) => ({ ...h, humanComment: rev.humanComment ?? "" }));
      if (rev?.findingDecisions) setDecisions(rev.findingDecisions as FindingDecision[]);
      if (rev?.checklist?.length) setChecklist(rev.checklist as ChecklistItem[]);
      else if (r.data.template?.rubric?.sections) {
        setChecklist(
          (r.data.template.rubric.sections as ChecklistItem[]).map((s) => ({
            ...s,
            score: s.score ?? Math.round((r.data.aiAnalysis?.overallScore ?? 0) * (s.weight / 100)),
          })),
        );
      }
      if (r.data.advanceGroupId) {
        reviewsApi.versions(r.data.advanceGroupId).then((v) => setVersions(v.data));
      }
    });
  };

  useEffect(() => {
    reload();
    advancesApi.institutionConfig().then((r) => setMaxGrade(r.data.maxGrade ?? 20)).catch(() => {});
  }, [id]);

  const findings: AiFinding[] = useMemo(() => {
    const raw = data?.aiAnalysis?.findings;
    return Array.isArray(raw) ? raw : [];
  }, [data]);

  const setDecision = (index: number, action: FindingDecision['action'], note?: string) => {
    setDecisions((prev) => {
      const next = [...prev.filter((d) => d.index !== index), { index, action, note }];
      return next;
    });
  };

  const save = async () => {
    await reviewsApi.save(id, {
      reviewerId: reviewerIdForRole(getStoredUser()),
      finalGrade: human.finalGrade ? Number(human.finalGrade) : undefined,
      humanComment: human.humanComment,
      advanceStatus: human.advanceStatus,
      findingDecisions: decisions,
      checklist,
      status: "SUBMITTED",
    });
    reload();
  };

  const addAnnotation = async () => {
    if (!annotation.content.trim()) return;
    await reviewsApi.annotate(id, {
      authorId: reviewerIdForRole(getStoredUser()),
      content: annotation.content,
      page: annotation.page ? Number(annotation.page) : undefined,
    });
    setAnnotation({ content: "", page: "" });
    reload();
  };

  if (!data) return <div className="p-10">{t("common.loading")}</div>;
  const ia = data.aiAnalysis;

  return (
    <div className="p-6 h-[calc(100vh-0px)] flex flex-col">
      <header className="mb-4 flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">{data.title}</h1>
          <p className="text-xs text-slate-500">
            {data.student?.name} · v{data.version} · {data.status}
          </p>
          {versions.length > 1 && (
            <p className="text-xs text-slate-400 mt-1">
              Versiones:{" "}
              {versions.map((v, i) => (
                <span key={v.id}>
                  {i > 0 && " → "}
                  <Link href={`/reviews/${v.id}`} className={v.id === id ? "font-bold text-[#185FA5]" : "underline"}>
                    v{v.version}
                    {v.aiAnalysis ? ` (${v.aiAnalysis.overallScore}%)` : ""}
                  </Link>
                </span>
              ))}
              {data.advanceGroupId && (
                <a href={reportsApi.versions(data.advanceGroupId)} target="_blank" className="ml-2 text-[#185FA5] font-bold">
                  {t("review.detail.compare")}
                </a>
              )}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <a href={reportsApi.acta(id)} target="_blank" className="text-sm font-bold text-[#185FA5] border px-4 py-2 rounded-xl">
            {t("review.detail.actaHtml")}
          </a>
          <a href={reportsApi.actaPdf(id)} className="text-sm font-bold bg-[#185FA5] text-white px-4 py-2 rounded-xl">
            {t("review.detail.actaPdf")}
          </a>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        <div className="bg-slate-100 dark:bg-white/5 rounded-2xl border overflow-hidden flex flex-col min-h-[500px]">
          <DocumentPdfViewer advanceId={id} title={data.title} />
        </div>

        <div className="surface rounded-2xl border flex flex-col min-h-0">
          <div className="flex border-b">
            <button
              onClick={() => setTab("ia")}
              className={`flex-1 py-3 text-sm font-bold ${tab === "ia" ? "border-b-2 border-[#185FA5] text-[#185FA5]" : "text-slate-400"}`}
            >
              {t("review.detail.tab.ia")}
            </button>
            <button
              onClick={() => setTab("human")}
              className={`flex-1 py-3 text-sm font-bold ${tab === "human" ? "border-b-2 border-[#185FA5] text-[#185FA5]" : "text-slate-400"}`}
            >
              {t("review.detail.tab.human")}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {tab === "ia" && ia && (
              <div className="space-y-4">
                <p className="text-2xl font-bold text-green-700">
                  {ia.gradeConverted} / {maxGrade} · {ia.overallScore}%
                </p>
                <p className="text-sm muted">{ia.executiveSummary}</p>
                {findings.map((f, i) => (
                  <div key={i} className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl text-sm border dark:border-white/10">
                    <span className="text-[10px] font-bold text-orange-600">
                      {f.severity} · {f.section}
                      {f.pageApprox != null ? ` · pág. ~${f.pageApprox}` : ""}
                    </span>
                    <p className="mt-1">{f.description}</p>
                    {f.fix && (
                      <p className="mt-2 text-xs muted">
                        <strong>{t("review.detail.aiFix")}</strong> {f.fix}
                      </p>
                    )}
                    {f.example && <p className="mt-1 text-xs italic muted">{f.example}</p>}
                    {f.recommendation && (
                      <p className="mt-1 text-xs text-blue-700">
                        <strong>{t("review.detail.aiRecommendation")}</strong> {f.recommendation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
            {tab === "human" && (
              <div className="space-y-5">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">{t("review.detail.aiFindingsDecisionTitle")}</h4>
                  {findings.length === 0 && <p className="text-sm text-slate-400">{t("review.detail.noFindings")}</p>}
                  {findings.map((f, i) => {
                    const d = decisions.find((x) => x.index === i);
                    return (
                      <div key={i} className="mb-3 p-3 border rounded-xl text-sm">
                        <p className="font-medium">{f.section}: {f.description.slice(0, 120)}…</p>
                        <div className="flex gap-2 mt-2">
                          {(["accept", "modify", "reject"] as const).map((action) => (
                            <button
                              key={action}
                              type="button"
                              onClick={() => setDecision(i, action)}
                              className={`text-xs px-2 py-1 rounded-lg border ${
                                d?.action === action ? "bg-[#185FA5] text-white border-[#185FA5]" : "surface"
                              }`}
                            >
                              {action === "accept"
                                ? t("review.detail.decision.accept")
                                : action === "modify"
                                  ? t("review.detail.decision.modify")
                                  : t("review.detail.decision.reject")}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">{t("review.detail.rubricTitle")}</h4>
                  {checklist.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 mb-2 text-sm">
                      <span className="flex-1">{item.name} ({item.weight}%)</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        className="w-16 input-premium !text-sm !px-2 !py-1 !rounded-lg"
                        value={item.score ?? ""}
                        onChange={(e) => {
                          const score = Number(e.target.value);
                          setChecklist((c) => c.map((x, j) => (j === idx ? { ...x, score } : x)));
                        }}
                      />
                    </div>
                  ))}
                </div>

                <input
                  type="number"
                  placeholder={t("review.detail.finalGradePlaceholder", { maxGrade })}
                  className="w-full input-premium !text-sm"
                  value={human.finalGrade}
                  onChange={(e) => setHuman({ ...human, finalGrade: e.target.value })}
                />
                <select
                  className="w-full input-premium !text-sm"
                  value={human.advanceStatus}
                  onChange={(e) => setHuman({ ...human, advanceStatus: e.target.value })}
                >
                  <option value="IN_HUMAN_REVIEW">{t("review.detail.status.inHumanReview")}</option>
                  <option value="OBSERVED">{t("review.detail.status.observed")}</option>
                  <option value="APPROVED">{t("review.detail.status.approved")}</option>
                  <option value="REJECTED">{t("review.detail.status.rejected")}</option>
                </select>
                <textarea
                  className="w-full input-premium !text-sm !p-3 h-24"
                  placeholder={t("review.detail.humanCommentPlaceholder")}
                  value={human.humanComment}
                  onChange={(e) => setHuman({ ...human, humanComment: e.target.value })}
                />
                <button onClick={save} className="w-full bg-[#185FA5] text-white py-3 rounded-xl font-bold">
                  {t("review.detail.saveHuman")}
                </button>

                <div className="pt-4 border-t">
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">{t("review.detail.annotationsTitle")}</h4>
                  {(data.annotations ?? []).map((a) => (
                    <div key={a.id} className="text-xs mb-2 p-2 bg-slate-50 dark:bg-white/5 rounded-lg">
                      {a.page != null && <span className="font-bold">Pág. {a.page}: </span>}
                      {a.content}
                    </div>
                  ))}
                  <textarea
                    className="w-full input-premium !text-sm h-16 mt-2"
                    placeholder={t("review.detail.annotation.newComment")}
                    value={annotation.content}
                    onChange={(e) => setAnnotation({ ...annotation, content: e.target.value })}
                  />
                  <input
                    type="number"
                    placeholder={t("review.detail.annotation.page")}
                    className="w-full input-premium !text-sm mt-2"
                    value={annotation.page}
                    onChange={(e) => setAnnotation({ ...annotation, page: e.target.value })}
                  />
                  <button onClick={addAnnotation} className="mt-2 text-sm font-bold text-[#185FA5]">
                    {t("review.detail.annotation.add")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
