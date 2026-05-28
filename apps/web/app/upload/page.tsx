"use client";
import { useEffect, useMemo, useState } from "react";
import { Upload, ArrowRight, Check, Loader2 } from "lucide-react";
import { isAxiosError } from "axios";
import { API_URL, advancesApi, programsApi, templatesApi, usersApi } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import type { AiFinding, ProgramRef, ThesisTemplate, UploadPipelineResponse } from "@/lib/types";
import { useApp } from "@/lib/ThemeContext";

type UserRef = { id: string; name: string; email: string };

type AiProvider = { id: string; label: string; model: string };

export default function UploadPage() {
  const { t } = useApp();
  const [file, setFile] = useState<File | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<UploadPipelineResponse | null>(null);
  const [providers, setProviders] = useState<AiProvider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [programs, setPrograms] = useState<ProgramRef[]>([]);
  const [templates, setTemplates] = useState<ThesisTemplate[]>([]);
  const [students, setStudents] = useState<UserRef[]>([]);
  const [form, setForm] = useState({
    programId: "",
    templateId: "",
    studentId: "",
    advanceType: "Capítulo 1",
    title: "",
    advanceGroupId: "",
  });

  useEffect(() => {
    programsApi.list().then((r) => {
      setPrograms(r.data);
      if (r.data[0]) setForm((f) => ({ ...f, programId: r.data[0].id }));
    });
    const user = getStoredUser();
    if (user?.role === "STUDENT") {
      setForm((f) => ({ ...f, studentId: user.id }));
    } else {
      usersApi.list({ role: "STUDENT" }).then((r) => {
        setStudents(r.data);
        if (r.data[0]) setForm((f) => ({ ...f, studentId: r.data[0].id }));
      });
    }
    advancesApi
      .providers()
      .then((res) => {
        setProviders(res.data);
        if (res.data.length > 0) setSelectedProvider(res.data[0].id);
        if (res.data.length === 0) setError(t("upload.error.noProviders"));
      })
      .catch((err) => {
        console.error(err);
        setError(
          t("upload.error.apiOffline", { apiUrl: API_URL }),
        );
      })
      .finally(() => {
        setLoadingProviders(false);
      });
  }, []);

  const activeProvider = providers.find((p) => p.id === selectedProvider);
  const submitDisabled = !file || isProcessing || loadingProviders || providers.length === 0;
  const submitHint = loadingProviders
    ? t("upload.status.loadingProviders")
    : providers.length === 0
      ? t("upload.error.noProviders")
      : !file
        ? t("upload.status.selectFile")
        : null;

  const steps = useMemo(() => {
    const analysisLabel = activeProvider
      ? `Análisis ${activeProvider.label}`
      : t("upload.pipeline.analysis");
    return ["Carga Word/PDF", "Extracción de texto", "Cola de análisis", "Evaluación IA", analysisLabel, "Reporte IA"];
  }, [activeProvider, t]);

  useEffect(() => {
    if (!form.programId) return;
    templatesApi.list(form.programId).then((r) => {
      const active = r.data.filter((t: ThesisTemplate) => t.isActive);
      setTemplates(active.length ? active : r.data);
      const first = (active[0] ?? r.data[0]) as ThesisTemplate | undefined;
      if (first) setForm((f) => ({ ...f, templateId: first.id }));
    });
  }, [form.programId]);

  const handleUpload = async () => {
    if (!file) return;
    if (providers.length === 0) {
      setError(t("upload.error.noProviders"));
      return;
    }

    if (!form.templateId) {
      setError(t("upload.error.noTemplate"));
      return;
    }

    setIsProcessing(true);
    setResult(null);
    setError(null);
    setCurrentStep(1);

    const progressInterval = setInterval(() => {
      setCurrentStep((prev) => (prev < 5 ? prev + 1 : prev));
    }, 2000);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("studentId", form.studentId || "std-01");
    formData.append("templateId", form.templateId);
    formData.append("advanceType", form.advanceType);
    formData.append("title", form.title || file.name);
    if (form.advanceGroupId) formData.append("advanceGroupId", form.advanceGroupId);
    formData.append("provider", selectedProvider);
    formData.append("sync", "true");

    try {
      const response = await advancesApi.upload(formData);
      clearInterval(progressInterval);
      setCurrentStep(6);
      setResult(response.data);
    } catch (err: unknown) {
      clearInterval(progressInterval);
      setCurrentStep(1);
      let message = t("upload.error.default");
      if (isAxiosError(err)) {
        const data = err.response?.data as { message?: string | string[] } | undefined;
        if (data?.message) {
          message = Array.isArray(data.message) ? data.message.join(", ") : String(data.message);
        }
      }
      setError(message);
      console.error("Error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const advance = result?.result;
  const analysis = advance?.aiAnalysis;

  return (
    <div className="p-10 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">{t("upload.title")}</h1>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="card-professional p-10 mb-10 relative">
        <h2 className="text-center text-sm font-bold text-slate-500 mb-10 italic">
          {t("upload.pipeline.title")}
        </h2>
        <div className="flex justify-between relative max-w-4xl mx-auto">
          <div className="absolute top-5 left-0 w-full h-[2px] bg-slate-100 dark:bg-white/10"></div>
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center z-10 w-24">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-700 ${
                  currentStep > i + 1
                    ? "bg-blue-600 border-blue-600 text-white"
                    : currentStep === i + 1
                      ? "surface border-blue-600 text-blue-600 ring-4 ring-blue-50 dark:ring-white/10 font-bold"
                      : "surface border-inherit text-slate-300 dark:text-white/30"
                }`}
              >
                {currentStep > i + 1 ? <Check size={18} /> : i + 1}
              </div>
              <p
                className={`text-[9px] text-center mt-3 font-bold uppercase tracking-tighter ${
                  currentStep === i + 1 ? "text-slate-800 dark:text-white" : "text-slate-400"
                }`}
              >
                {step}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <div className="card-professional p-5 space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase">{t("upload.field.program")}</label>
            <select
              className="w-full input-premium"
              value={form.programId}
              onChange={(e) => setForm({ ...form, programId: e.target.value })}
            >
              {programs.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <label className="text-[10px] font-bold text-slate-400 uppercase">{t("upload.field.template")}</label>
            <select
              className="w-full input-premium"
              value={form.templateId}
              onChange={(e) => setForm({ ...form, templateId: e.target.value })}
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name} v{t.version}</option>
              ))}
            </select>
            {students.length > 0 && (
              <>
                <label className="text-[10px] font-bold text-slate-400 uppercase">{t("upload.field.student")}</label>
                <select
                  className="w-full input-premium"
                  value={form.studentId}
                  onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </>
            )}
            <input
              className="w-full input-premium"
              placeholder={t("upload.placeholder.advanceType")}
              value={form.advanceType}
              onChange={(e) => setForm({ ...form, advanceType: e.target.value })}
            />
            <input
              className="w-full input-premium"
              placeholder={t("upload.placeholder.groupId")}
              value={form.advanceGroupId}
              onChange={(e) => setForm({ ...form, advanceGroupId: e.target.value })}
            />
          </div>
          {providers.length > 0 && (
            <div className="card-professional p-5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                {t("upload.field.aiEngine")}
              </label>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                disabled={isProcessing}
                className="w-full input-premium"
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label} ({p.model})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div
            className={`border-2 border-dashed rounded-[32px] p-12 text-center transition-all ${
              file ? "border-blue-400 bg-blue-50/30 dark:bg-white/5" : "border-inherit surface"
            }`}
          >
            <input
              type="file"
              id="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <label htmlFor="file" className="cursor-pointer flex flex-col items-center">
              <div className="bg-blue-50 p-4 rounded-2xl mb-4">
                <Upload className="text-blue-600" />
              </div>
              <p className="font-bold text-sm text-slate-700 dark:text-white">
                {file ? file.name : t("upload.dropzone.empty")}
              </p>
              <p className="text-[10px] text-slate-400 mt-2">{t("upload.dropzone.help")}</p>
            </label>
          </div>

          <button
            onClick={handleUpload}
            disabled={submitDisabled}
            className="w-full surface border py-4 rounded-[24px] font-bold flex items-center justify-center gap-2 hover:bg-slate-50/60 dark:hover:bg-white/5 disabled:opacity-50 transition-all shadow-sm"
          >
            {isProcessing ? <Loader2 className="animate-spin" /> : t("upload.submit")}{" "}
            <ArrowRight size={18} />
          </button>
          {submitHint && !isProcessing && (
            <p className="text-[11px] text-center text-slate-500 dark:text-white/50 font-semibold">
              {submitHint}
            </p>
          )}
        </div>

        <div className="lg:col-span-2 card-professional p-8">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
            {t("upload.results.title")}
          </h3>
          {analysis ? (
            <div className="space-y-6 animate-in fade-in duration-700">
              {result?.provider && (
                <p className="text-[10px] font-bold text-blue-600 uppercase">
                  {t("upload.results.analyzedWith", { provider: result.provider, model: result.model ?? "" })}
                </p>
              )}
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-2xl border border-green-100">
                <div>
                  <p className="text-xs font-bold text-green-600 uppercase">{t("upload.results.finalGrade")}</p>
                  <p className="text-3xl font-bold text-green-700">
                    {analysis.gradeConverted} / 20
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-green-600 uppercase">{t("upload.results.compliance")}</p>
                  <p className="text-2xl font-bold text-green-700">{analysis.overallScore}%</p>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white mb-2">{t("upload.results.executiveSummary")}</h4>
                <p className="text-sm muted leading-relaxed">
                  {analysis.executiveSummary}
                </p>
              </div>
              {Array.isArray(analysis.findings) && analysis.findings.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white mb-3">{t("upload.results.findings")}</h4>
                  <ul className="space-y-3">
                    {analysis.findings.slice(0, 5).map((f: AiFinding, idx: number) => (
                      <li
                        key={idx}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm dark:bg-white/5 dark:border-white/10"
                      >
                        <span className="text-[10px] font-bold text-orange-600 uppercase">
                          {f.severity} · {f.section}
                        </span>
                        <p className="mt-1">{f.description}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-slate-300 italic">
              <p>{t("upload.results.empty")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
