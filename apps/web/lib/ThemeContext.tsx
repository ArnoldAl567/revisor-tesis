"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const translations = {
  es: {
    "dashboard.title": "Dashboard general",
    "dashboard.todosPrograms": "Todos los programas",
    "dashboard.todosEstados": "Todos los estados",
    "dashboard.nuevoAvance": "Nuevo avance",
    "dashboard.pendientes": "PENDIENTES",
    "dashboard.revisados": "REVISADOS",
    "dashboard.concordanciaIA": "CONCORDANCIA IA",
    "dashboard.notaPromIA": "NOTA PROM. IA",
    "dashboard.rechazados": "RECHAZADOS",
    "dashboard.notaHumana": "NOTA HUMANA",
    "dashboard.alertLow": "avance(s) con cumplimiento IA",
    "dashboard.avancesRecientes": "Avances recientes",
    "dashboard.actividadReciente": "Actividad reciente",
    "toggle.darkMode": "Modo oscuro",
    "toggle.lightMode": "Modo claro",

    "common.loading": "Cargando...",

    "sidebar.category.main": "PRINCIPAL",
    "sidebar.category.analytics": "ANÁLISIS",
    "sidebar.item.dashboard": "Dashboard",
    "sidebar.item.upload": "Cargar avance",
    "sidebar.item.reviews": "Revisar avance",
    "sidebar.item.bulk": "Revisión por lotes",
    "sidebar.item.reports": "Reportes",
    "sidebar.item.stats": "Estadísticas",
    "sidebar.item.config": "Configuración",

    "notifications.title": "Notificaciones",
    "notifications.empty": "Sin notificaciones nuevas",
    "notifications.markRead": "Marcar leída",

    "reviews.list.title": "Revisar avances",
    "reviews.list.subtitle": "Módulo 6: revisión humana + evaluación IA.",
    "reviews.list.allPrograms": "Todos los programas",
    "reviews.list.empty": "No hay avances con análisis IA aún.",

    "review.detail.compare": "comparativo",
    "review.detail.actaHtml": "Acta HTML",
    "review.detail.actaPdf": "Acta PDF",
    "review.detail.tab.ia": "Evaluación IA",
    "review.detail.tab.human": "Mi revisión",
    "review.detail.aiFix": "Corrección:",
    "review.detail.aiRecommendation": "Recomendación:",
    "review.detail.aiFindingsDecisionTitle": "Hallazgos IA — decisión del asesor",
    "review.detail.noFindings": "Sin hallazgos IA.",
    "review.detail.decision.accept": "Aceptar",
    "review.detail.decision.modify": "Modificar",
    "review.detail.decision.reject": "Descartar",
    "review.detail.rubricTitle": "Rúbrica (pre-llenada por IA)",
    "review.detail.finalGradePlaceholder": "Nota final (0–{maxGrade})",
    "review.detail.status.inHumanReview": "En revisión humana",
    "review.detail.status.observed": "Observado",
    "review.detail.status.approved": "Aprobado",
    "review.detail.status.rejected": "Rechazado",
    "review.detail.humanCommentPlaceholder": "Comentario del asesor",
    "review.detail.saveHuman": "Guardar revisión humana",
    "review.detail.annotationsTitle": "Anotaciones en documento",
    "review.detail.annotation.newComment": "Nuevo comentario",
    "review.detail.annotation.page": "Página",
    "review.detail.annotation.add": "+ Añadir anotación",

    "bulk.title": "Revisión por lotes",
    "bulk.subtitle": "Analiza varios avances pendientes con IA (requiere Redis activo).",
    "bulk.start": "Iniciar análisis IA masivo",
    "bulk.starting": "Iniciando…",
    "bulk.error.noEligible": "No hay avances pendientes listos para análisis.",
    "bulk.error.load": "Error al cargar avances",
    "bulk.error.start": "Error al iniciar el lote",
    "bulk.progress": "Progreso del lote:",
    "bulk.processed": "{processed}/{total} procesados · {failed} fallidos",
    "bulk.allPrograms": "Todos los programas",
    "bulk.selectAll": "Seleccionar todos ({count})",
    "bulk.empty": "No hay avances pendientes para analizar.",

    "reports.title": "Reportes y exportación",
    "reports.subtitle": "Actas de revisión (HTML/PDF) y comparativo de versiones.",
    "reports.individual.title": "Actas individuales",
    "reports.viewHtml": "Ver HTML",
    "reports.downloadPdf": "Descargar PDF",
    "reports.review": "Revisar",
    "reports.empty": "No hay avances con análisis IA.",
    "reports.compare.title": "Comparativo de versiones",
    "reports.compare.selectGroup": "Seleccione un grupo de versiones",
    "reports.table.version": "Versión",
    "reports.table.title": "Título",
    "reports.table.aiCompliance": "Cumplimiento IA",
    "reports.table.aiGrade": "Nota IA",
    "reports.table.humanGrade": "Nota humana",

    "stats.title": "Estadísticas",
    "stats.allPrograms": "Todos los programas",
    "stats.exportCsv": "Exportar CSV",
    "stats.chart.scoreDist": "Distribución de notas IA",
    "stats.chart.reviewStatus": "Estados de revisión",
    "stats.chart.byMonth": "Avances por mes",
    "stats.chart.concordance": "Concordancia IA vs. humano",
    "stats.chart.advisorLoad": "Carga por asesor",
    "stats.chart.radar": "Radar de cumplimiento por dimensión",
    "stats.dim.structure": "Estructura",
    "stats.dim.content": "Contenido",
    "stats.dim.form": "Forma",
    "stats.dim.originality": "Originalidad",
    "stats.axis.ai": "Nota IA",
    "stats.axis.human": "Nota humana",

    "config.title": "Configuración",
    "config.institutionScale.title": "Escala de calificación institucional",
    "config.institutionScale.maxGrade": "Nota máxima",
    "config.institutionScale.scale": "Escala",
    "config.institutionScale.save": "Guardar escala",
    "config.template.newTitle": "Nuevo patrón institucional",
    "config.template.name": "Nombre",
    "config.template.version": "Versión",
    "config.template.upload": "Subir y extraer estructura",
    "config.template.loaded": "Patrón cargado y estructura extraída con IA",
    "config.institution.saved": "Configuración institucional guardada",
    "config.error.upload": "Error al cargar",
    "config.patternsByProgram": "Patrones por programa",
    "config.editRubric": "Editar rúbrica",
    "config.active": "Activo",
    "config.inactive": "Inactivo",
    "config.activate": "Activar",
    "config.rubricEditor": "Editor de rúbrica (JSON)",
    "config.rubricSaved": "Rúbrica actualizada",
    "config.rubricInvalidJson": "JSON de rúbrica inválido",
    "config.rubricSave": "Guardar rúbrica",

    "login.subtitle": "Inicie sesión con su cuenta institucional",
    "login.error.default": "Error al iniciar sesión",
    "login.email": "Correo",
    "login.password": "Contraseña",
    "login.signin": "Iniciar sesión",
    "login.signingIn": "Entrando…",
    "login.demo": "Demo: coord@test.com · asesor@test.com · alumno@test.com — clave Thesis123!",

    "upload.title": "Cargar nuevo avance",
    "upload.pipeline.title": "Pipeline de análisis IA — flujo automático",
    "upload.pipeline.analysis": "Análisis IA",
    "upload.field.program": "Programa",
    "upload.field.template": "Patrón activo",
    "upload.field.student": "Estudiante",
    "upload.field.aiEngine": "Motor de IA",
    "upload.placeholder.advanceType": "Tipo de avance (ej. Capítulo 2)",
    "upload.placeholder.groupId": "ID grupo (opcional, nueva versión)",
    "upload.dropzone.empty": "Arrastre o haga clic para cargar",
    "upload.dropzone.help": "Word (.docx) o PDF · máx. 50 MB",
    "upload.submit": "Enviar para análisis IA",
    "upload.results.title": "Versiones del avance / Resultados",
    "upload.results.analyzedWith": "Analizado con {provider} · {model}",
    "upload.results.finalGrade": "Calificación Final",
    "upload.results.compliance": "Cumplimiento",
    "upload.results.executiveSummary": "Resumen Ejecutivo",
    "upload.results.findings": "Hallazgos",
    "upload.results.empty": "Los resultados aparecerán aquí después del análisis...",
    "upload.error.apiOffline": "No se pudo conectar con la API en http://localhost:3001. Abre otra terminal, entra a apps/api y ejecuta: npm run start:dev",
    "upload.error.noProviders": "Configura OPENAI_API_KEY o GEMINI_API_KEY en apps/api/.env",
    "upload.error.noTemplate": "Seleccione un patrón institucional activo",
    "upload.error.default": "Error en el análisis. Revisa la consola y las API keys.",

    "dashboard.status.pending": "Pendiente",
    "dashboard.status.inHumanReview": "En revisión",
    "dashboard.filter.min": "Mín %",
    "dashboard.filter.max": "Máx %",
  }
  ,
  en: {
    "dashboard.title": "General dashboard",
    "dashboard.todosPrograms": "All programs",
    "dashboard.todosEstados": "All statuses",
    "dashboard.nuevoAvance": "New submission",
    "dashboard.pendientes": "PENDING",
    "dashboard.revisados": "REVIEWED",
    "dashboard.concordanciaIA": "AI AGREEMENT",
    "dashboard.notaPromIA": "AVG. AI GRADE",
    "dashboard.rechazados": "REJECTED",
    "dashboard.notaHumana": "HUMAN GRADE",
    "dashboard.alertLow": "submission(s) with AI compliance",
    "dashboard.avancesRecientes": "Recent submissions",
    "dashboard.actividadReciente": "Recent activity",
    "toggle.darkMode": "Dark mode",
    "toggle.lightMode": "Light mode",

    "common.loading": "Loading...",

    "sidebar.category.main": "MAIN",
    "sidebar.category.analytics": "ANALYTICS",
    "sidebar.item.dashboard": "Dashboard",
    "sidebar.item.upload": "Upload submission",
    "sidebar.item.reviews": "Review submissions",
    "sidebar.item.bulk": "Bulk review",
    "sidebar.item.reports": "Reports",
    "sidebar.item.stats": "Statistics",
    "sidebar.item.config": "Settings",

    "notifications.title": "Notifications",
    "notifications.empty": "No new notifications",
    "notifications.markRead": "Mark as read",

    "reviews.list.title": "Review submissions",
    "reviews.list.subtitle": "Module 6: human review + AI evaluation.",
    "reviews.list.allPrograms": "All programs",
    "reviews.list.empty": "No submissions with AI analysis yet.",

    "review.detail.compare": "comparison",
    "review.detail.actaHtml": "Review report (HTML)",
    "review.detail.actaPdf": "Review report (PDF)",
    "review.detail.tab.ia": "AI evaluation",
    "review.detail.tab.human": "My review",
    "review.detail.aiFix": "Fix:",
    "review.detail.aiRecommendation": "Recommendation:",
    "review.detail.aiFindingsDecisionTitle": "AI findings — advisor decision",
    "review.detail.noFindings": "No AI findings.",
    "review.detail.decision.accept": "Accept",
    "review.detail.decision.modify": "Modify",
    "review.detail.decision.reject": "Dismiss",
    "review.detail.rubricTitle": "Rubric (pre-filled by AI)",
    "review.detail.finalGradePlaceholder": "Final grade (0–{maxGrade})",
    "review.detail.status.inHumanReview": "In human review",
    "review.detail.status.observed": "Observed",
    "review.detail.status.approved": "Approved",
    "review.detail.status.rejected": "Rejected",
    "review.detail.humanCommentPlaceholder": "Advisor comment",
    "review.detail.saveHuman": "Save human review",
    "review.detail.annotationsTitle": "Document annotations",
    "review.detail.annotation.newComment": "New comment",
    "review.detail.annotation.page": "Page",
    "review.detail.annotation.add": "+ Add annotation",

    "bulk.title": "Bulk review",
    "bulk.subtitle": "Analyze multiple pending submissions with AI (requires Redis running).",
    "bulk.start": "Start bulk AI analysis",
    "bulk.starting": "Starting…",
    "bulk.error.noEligible": "No pending submissions ready for analysis.",
    "bulk.error.load": "Failed to load submissions",
    "bulk.error.start": "Failed to start bulk job",
    "bulk.progress": "Bulk progress:",
    "bulk.processed": "{processed}/{total} processed · {failed} failed",
    "bulk.allPrograms": "All programs",
    "bulk.selectAll": "Select all ({count})",
    "bulk.empty": "No pending submissions to analyze.",

    "reports.title": "Reports & export",
    "reports.subtitle": "Review reports (HTML/PDF) and version comparison.",
    "reports.individual.title": "Individual reports",
    "reports.viewHtml": "View HTML",
    "reports.downloadPdf": "Download PDF",
    "reports.review": "Review",
    "reports.empty": "No submissions with AI analysis.",
    "reports.compare.title": "Version comparison",
    "reports.compare.selectGroup": "Select a version group",
    "reports.table.version": "Version",
    "reports.table.title": "Title",
    "reports.table.aiCompliance": "AI compliance",
    "reports.table.aiGrade": "AI grade",
    "reports.table.humanGrade": "Human grade",

    "stats.title": "Statistics",
    "stats.allPrograms": "All programs",
    "stats.exportCsv": "Export CSV",
    "stats.chart.scoreDist": "AI grade distribution",
    "stats.chart.reviewStatus": "Review statuses",
    "stats.chart.byMonth": "Submissions per month",
    "stats.chart.concordance": "AI vs. human agreement",
    "stats.chart.advisorLoad": "Advisor workload",
    "stats.chart.radar": "Compliance radar by dimension",
    "stats.dim.structure": "Structure",
    "stats.dim.content": "Content",
    "stats.dim.form": "Style",
    "stats.dim.originality": "Originality",
    "stats.axis.ai": "AI grade",
    "stats.axis.human": "Human grade",

    "config.title": "Settings",
    "config.institutionScale.title": "Institution grading scale",
    "config.institutionScale.maxGrade": "Max grade",
    "config.institutionScale.scale": "Scale",
    "config.institutionScale.save": "Save scale",
    "config.template.newTitle": "New institutional template",
    "config.template.name": "Name",
    "config.template.version": "Version",
    "config.template.upload": "Upload and extract structure",
    "config.template.loaded": "Template uploaded and structure extracted with AI",
    "config.institution.saved": "Institution settings saved",
    "config.error.upload": "Upload failed",
    "config.patternsByProgram": "Templates by program",
    "config.editRubric": "Edit rubric",
    "config.active": "Active",
    "config.inactive": "Inactive",
    "config.activate": "Activate",
    "config.rubricEditor": "Rubric editor (JSON)",
    "config.rubricSaved": "Rubric updated",
    "config.rubricInvalidJson": "Invalid rubric JSON",
    "config.rubricSave": "Save rubric",

    "login.subtitle": "Sign in with your institutional account",
    "login.error.default": "Sign-in failed",
    "login.email": "Email",
    "login.password": "Password",
    "login.signin": "Sign in",
    "login.signingIn": "Signing in…",
    "login.demo": "Demo: coord@test.com · asesor@test.com · alumno@test.com — password Thesis123!",

    "upload.title": "Upload new submission",
    "upload.pipeline.title": "AI analysis pipeline — automated flow",
    "upload.pipeline.analysis": "AI analysis",
    "upload.field.program": "Program",
    "upload.field.template": "Active template",
    "upload.field.student": "Student",
    "upload.field.aiEngine": "AI engine",
    "upload.placeholder.advanceType": "Submission type (e.g. Chapter 2)",
    "upload.placeholder.groupId": "Group ID (optional, new version)",
    "upload.dropzone.empty": "Drag or click to upload",
    "upload.dropzone.help": "Word (.docx) or PDF · max 50 MB",
    "upload.submit": "Send for AI analysis",
    "upload.results.title": "Submission versions / Results",
    "upload.results.analyzedWith": "Analyzed with {provider} · {model}",
    "upload.results.finalGrade": "Final grade",
    "upload.results.compliance": "Compliance",
    "upload.results.executiveSummary": "Executive summary",
    "upload.results.findings": "Findings",
    "upload.results.empty": "Results will appear here after analysis...",
    "upload.error.apiOffline": "Could not connect to the API at http://localhost:3001. Open another terminal, go to apps/api and run: npm run start:dev",
    "upload.error.noProviders": "Set OPENAI_API_KEY or GEMINI_API_KEY in apps/api/.env",
    "upload.error.noTemplate": "Select an active institutional template",
    "upload.error.default": "Analysis error. Check console and API keys.",

    "dashboard.status.pending": "Pending",
    "dashboard.status.inHumanReview": "In review",
    "dashboard.filter.min": "Min %",
    "dashboard.filter.max": "Max %",
  },
};

type Theme = "light" | "dark";
type Language = "es" | "en";

type AppContextValue = {
  theme: Theme;
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  locale: string;
};

const ThemeContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [language, setLanguage] = useState<Language>("es");

  useEffect(() => {
    const saved = localStorage.getItem("theme") || "light";
    const nextTheme = (saved === "dark" ? "dark" : "light") as Theme;
    setTheme(nextTheme);
    if (saved === "dark") document.documentElement.classList.add("dark");
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark");
  };

  useEffect(() => {
    const saved = localStorage.getItem("language") || "es";
    const nextLang = (saved === "en" ? "en" : "es") as Language;
    setLanguage(nextLang);
  }, []);

  useEffect(() => {
    localStorage.setItem("language", language);
    document.documentElement.lang = language;
  }, [language]);

  const toggleLanguage = () => setLanguage((prev) => (prev === "es" ? "en" : "es"));

  const locale = useMemo(() => (language === "es" ? "es-ES" : "en-US"), [language]);

  const t = (key: string, vars?: Record<string, string | number>) => {
    const raw = (translations as Record<string, Record<string, string>>)[language]?.[key] ??
      (translations as Record<string, Record<string, string>>).es?.[key] ??
      key;

    if (!vars) return raw;
    return raw.replace(/\{(\w+)\}/g, (_, k: string) => (vars[k] != null ? String(vars[k]) : `{${k}}`));
  };

  const value = useMemo<AppContextValue>(
    () => ({ theme, toggleTheme, language, setLanguage, toggleLanguage, t, locale }),
    [theme, language, locale],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
export const useApp = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};