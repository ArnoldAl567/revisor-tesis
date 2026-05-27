"use client";
import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { advancesApi, programsApi, templatesApi } from "@/lib/api";
import type { ProgramRef, ThesisTemplate } from "@/lib/types";
import { useApp } from "@/lib/ThemeContext";

export default function ConfigPage() {
  const { t } = useApp();
  const [templates, setTemplates] = useState<ThesisTemplate[]>([]);
  const [programs, setPrograms] = useState<ProgramRef[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({ programId: "", name: "Patrón Institucional", version: "1.0" });
  const [msg, setMsg] = useState("");
  const [institution, setInstitution] = useState({ maxGrade: 20, gradeScale: "0-20" });
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [rubricJson, setRubricJson] = useState("");

  const load = () => {
    programsApi.list().then((r) => {
      setPrograms(r.data);
      if (!form.programId && r.data[0]) setForm((f) => ({ ...f, programId: r.data[0].id }));
    });
    templatesApi.list().then((r) => setTemplates(r.data));
    advancesApi.institutionConfig().then((r) => setInstitution(r.data)).catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const upload = async () => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("programId", form.programId);
    fd.append("name", form.name);
    fd.append("version", form.version);
    try {
      await templatesApi.upload(fd);
      setMsg(t("config.template.loaded"));
      load();
    } catch (e: unknown) {
      let m = t("config.error.upload");
      if (isAxiosError(e)) {
        const data = e.response?.data as { message?: string } | undefined;
        if (data?.message) m = data.message;
      }
      setMsg(m);
    }
  };

  const saveInstitution = async () => {
    await advancesApi.updateInstitutionConfig(institution);
    setMsg(t("config.institution.saved"));
  };

  const loadRubric = async (id: string) => {
    setSelectedTemplate(id);
    const res = await templatesApi.one(id);
    setRubricJson(JSON.stringify(res.data.rubric ?? {}, null, 2));
  };

  const saveRubric = async () => {
    try {
      const rubric = JSON.parse(rubricJson);
      await templatesApi.updateRubric(selectedTemplate, rubric);
      setMsg(t("config.rubricSaved"));
      load();
    } catch {
      setMsg(t("config.rubricInvalidJson"));
    }
  };

  return (
    <div className="p-10 max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">{t("config.title")}</h1>

      <div className="surface rounded-[28px] border p-8 space-y-4">
        <h2 className="font-bold">{t("config.institutionScale.title")}</h2>
        <div className="flex gap-4 flex-wrap">
          <label className="text-sm">
            {t("config.institutionScale.maxGrade")}
            <input
              type="number"
              className="block w-24 input-premium mt-1"
              value={institution.maxGrade}
              onChange={(e) => setInstitution({ ...institution, maxGrade: Number(e.target.value) })}
            />
          </label>
          <label className="text-sm">
            {t("config.institutionScale.scale")}
            <input
              className="block w-32 input-premium mt-1"
              value={institution.gradeScale}
              onChange={(e) => setInstitution({ ...institution, gradeScale: e.target.value })}
            />
          </label>
        </div>
        <button type="button" onClick={saveInstitution} className="bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-bold">
          {t("config.institutionScale.save")}
        </button>
      </div>

      <div className="surface rounded-[28px] border p-8 space-y-4">
        <h2 className="font-bold">{t("config.template.newTitle")}</h2>
        <select
          className="w-full input-premium !text-sm"
          value={form.programId}
          onChange={(e) => setForm({ ...form, programId: e.target.value })}
        >
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <input
          className="w-full input-premium !text-sm"
          placeholder={t("config.template.name")}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          className="w-full input-premium !text-sm"
          placeholder={t("config.template.version")}
          value={form.version}
          onChange={(e) => setForm({ ...form, version: e.target.value })}
        />
        <input type="file" accept=".pdf,.docx" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <button type="button" onClick={upload} className="bg-[#185FA5] text-white px-6 py-3 rounded-2xl font-bold text-sm">
          {t("config.template.upload")}
        </button>
        {msg && <p className="text-sm text-slate-600">{msg}</p>}
      </div>

      <div className="surface rounded-[28px] border p-8">
        <h2 className="font-bold mb-4">{t("config.patternsByProgram")}</h2>
        <ul className="space-y-3">
          {templates.map((tpl) => (
            <li key={tpl.id} className="p-4 border rounded-2xl flex justify-between items-center gap-4 flex-wrap">
              <div>
                <p className="font-bold text-sm">
                  {tpl.name} v{tpl.version}
                </p>
                <p className="text-xs text-slate-400">{tpl.program?.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => loadRubric(tpl.id)} className="text-xs font-bold muted border px-3 py-1 rounded-lg hover:bg-slate-50/60 dark:hover:bg-white/5 transition-colors">
                  {t("config.editRubric")}
                </button>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-full ${tpl.isActive ? "bg-green-50 text-green-700" : "bg-slate-100"}`}
                >
                  {tpl.isActive ? t("config.active") : t("config.inactive")}
                </span>
                {!tpl.isActive && (
                  <button
                    type="button"
                    onClick={async () => {
                      await templatesApi.activate(tpl.id);
                      load();
                    }}
                    className="text-xs font-bold text-[#185FA5] border px-3 py-1 rounded-lg"
                  >
                    {t("config.activate")}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {selectedTemplate && (
        <div className="surface rounded-[28px] border p-8 space-y-3">
          <h2 className="font-bold">{t("config.rubricEditor")}</h2>
          <textarea
            className="w-full input-premium !font-mono !text-xs h-48"
            value={rubricJson}
            onChange={(e) => setRubricJson(e.target.value)}
          />
          <button type="button" onClick={saveRubric} className="bg-[#185FA5] text-white px-4 py-2 rounded-xl text-sm font-bold">
            {t("config.rubricSave")}
          </button>
        </div>
      )}
    </div>
  );
}
