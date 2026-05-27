import {
  AdvanceStatus,
  BulkJobStatus,
  Prisma,
  PrismaClient,
  ReviewStatus,
  Role,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const PASSWORD = 'Thesis123!';

const defaultSchema = {
  sections: [
    { name: 'Introducción', required: true, suggestedPages: 8 },
    { name: 'Marco teórico', required: true, suggestedPages: 15 },
    { name: 'Metodología', required: true, suggestedPages: 10 },
    { name: 'Resultados', required: true, suggestedPages: 12 },
    { name: 'Conclusiones', required: true, suggestedPages: 5 },
    { name: 'Bibliografía', required: true },
  ],
  citationStyle: 'APA 7',
  indexRequired: true,
};

const defaultRubric = {
  sections: [
    { name: 'Estructura', weight: 30, criteria: ['Índice', 'Orden de secciones', 'Numeración'] },
    { name: 'Contenido', weight: 40, criteria: ['Objetivos', 'Metodología', 'Citas'] },
    { name: 'Forma', weight: 20, criteria: ['Extensión', 'Redacción académica'] },
    { name: 'Originalidad', weight: 10, criteria: ['Coherencia interna'] },
  ],
};

const educacionSchema = {
  ...defaultSchema,
  sections: [
    { name: 'Planteamiento del problema', required: true, suggestedPages: 6 },
    { name: 'Marco teórico-pedagógico', required: true, suggestedPages: 12 },
    { name: 'Diseño metodológico', required: true, suggestedPages: 8 },
    { name: 'Análisis de datos', required: true, suggestedPages: 10 },
    { name: 'Propuesta de intervención', required: true, suggestedPages: 8 },
    { name: 'Referencias', required: true },
  ],
};

function sampleFindings(severity: 'CRITICAL' | 'MAJOR' | 'MINOR' | 'SUGGESTION' = 'MAJOR') {
  return [
    {
      section: 'Metodología',
      severity,
      type: 'CONTENT',
      description: 'La descripción del diseño muestral no especifica criterios de inclusión/exclusión.',
      fix: 'Añada un apartado con población, muestra, muestreo y técnicas de recolección.',
      pageApprox: 18,
      example:
        'La población estuvo conformada por 120 docentes; la muestra intencionada incluyó 35 participantes según criterios de experiencia mínima de cinco años.',
      recommendation: 'Revise manuales de metodología cuantitativa o cualitativa según su enfoque.',
    },
    {
      section: 'Bibliografía',
      severity: 'MINOR',
      type: 'FORM',
      description: 'Algunas referencias no siguen el estilo APA 7 de forma consistente.',
      fix: 'Uniforme mayúsculas en títulos de revistas y DOI cuando exista.',
      pageApprox: 42,
      example: 'García, A. (2023). Título del artículo. Nombre de la Revista, 12(3), 45–60. https://doi.org/10.xxxx',
      recommendation: 'Use Zotero o Mendeley con estilo APA 7.',
    },
  ];
}

function aiAnalysisPayload(overallScore: number, maxGrade = 20) {
  const gradeConverted = Math.round((overallScore / 100) * maxGrade * 100) / 100;
  return {
    overallScore,
    gradeConverted,
    executiveSummary: `El documento presenta un cumplimiento del ${overallScore}%. Se observan fortalezas en la estructura general y oportunidades de mejora en profundidad metodológica y citación. Priorice corregir hallazgos de severidad mayor antes de la siguiente versión.`,
    findings: sampleFindings(overallScore < 60 ? 'CRITICAL' : 'MAJOR'),
    structureScore: Math.min(100, overallScore + 5),
    contentScore: Math.max(0, overallScore - 8),
    formScore: Math.min(100, overallScore + 2),
    originalityScore: Math.max(0, overallScore - 5),
    aiProvider: 'gemini',
    aiModel: 'gemini-2.5-flash',
    missingSections: overallScore < 70 ? ['Anexos', 'Glosario'] : [],
    semanticNotes:
      'La introducción plantea objetivos alineados con la metodología, aunque los resultados podrían explicitar mejor el vínculo con la pregunta de investigación.',
  };
}

async function main() {
  const hashedPassword = await bcrypt.hash(PASSWORD, 10);

  await prisma.institutionConfig.upsert({
    where: { id: 'default' },
    update: {
      maxGrade: 20,
      gradeScale: '0-20',
      weights: { structure: 30, content: 40, form: 20, originality: 10 },
    },
    create: {
      id: 'default',
      maxGrade: 20,
      gradeScale: '0-20',
      weights: { structure: 30, content: 40, form: 20, originality: 10 },
    },
  });

  const programs = [
    { id: 'prog-01', name: 'Maestría en Ingeniería de Sistemas' },
    { id: 'prog-02', name: 'Maestría en Educación' },
    { id: 'prog-03', name: 'Maestría en Derecho' },
    { id: 'prog-04', name: 'Maestría en Administración de Empresas' },
    { id: 'prog-05', name: 'Especialización en Ciencia de Datos' },
  ];

  for (const p of programs) {
    await prisma.program.upsert({
      where: { id: p.id },
      update: { name: p.name },
      create: p,
    });
  }

  const templates: Array<Prisma.ThesisTemplateCreateInput & { id: string }> = [
    {
      id: 'temp-01',
      program: { connect: { id: 'prog-01' } },
      name: 'Patrón Institucional Ingeniería 2025',
      version: '1.0',
      fileKey: 'seed/patron-ingenieria-v1.docx',
      fileType: 'docx',
      extractedSchema: defaultSchema,
      rubric: defaultRubric,
      isActive: true,
    },
    {
      id: 'temp-02',
      program: { connect: { id: 'prog-01' } },
      name: 'Patrón Institucional Ingeniería 2025',
      version: '2.0',
      fileKey: 'seed/patron-ingenieria-v2.docx',
      fileType: 'docx',
      extractedSchema: defaultSchema,
      rubric: defaultRubric,
      isActive: false,
    },
    {
      id: 'temp-03',
      program: { connect: { id: 'prog-02' } },
      name: 'Patrón Educación 2025',
      version: '1.0',
      fileKey: 'seed/patron-educacion.docx',
      fileType: 'docx',
      extractedSchema: educacionSchema,
      rubric: defaultRubric,
      isActive: true,
    },
    {
      id: 'temp-04',
      program: { connect: { id: 'prog-03' } },
      name: 'Patrón Derecho — Tesis jurídica',
      version: '1.0',
      fileKey: 'seed/patron-derecho.pdf',
      fileType: 'pdf',
      extractedSchema: {
        ...defaultSchema,
        citationStyle: 'Chicago',
        sections: [
          { name: 'Introducción', required: true },
          { name: 'Marco jurídico', required: true },
          { name: 'Análisis de caso', required: true },
          { name: 'Conclusiones', required: true },
          { name: 'Jurisprudencia y doctrina', required: true },
        ],
      },
      rubric: defaultRubric,
      isActive: true,
    },
    {
      id: 'temp-05',
      program: { connect: { id: 'prog-04' } },
      name: 'Patrón Administración 2025',
      version: '1.0',
      fileKey: 'seed/patron-admin.docx',
      fileType: 'docx',
      extractedSchema: defaultSchema,
      rubric: defaultRubric,
      isActive: true,
    },
    {
      id: 'temp-06',
      program: { connect: { id: 'prog-05' } },
      name: 'Patrón Ciencia de Datos',
      version: '1.0',
      fileKey: 'seed/patron-datos.docx',
      fileType: 'docx',
      extractedSchema: defaultSchema,
      rubric: defaultRubric,
      isActive: true,
    },
  ];

  for (const t of templates) {
    const { id, ...data } = t;
    await prisma.thesisTemplate.upsert({
      where: { id },
      update: {
        name: data.name,
        version: data.version,
        extractedSchema: data.extractedSchema as Prisma.InputJsonValue,
        rubric: data.rubric as Prisma.InputJsonValue,
        isActive: data.isActive,
      },
      create: { id, ...data },
    });
  }

  const users: Array<{
    id: string;
    email: string;
    name: string;
    role: Role;
    programId: string | null;
  }> = [
    { id: 'std-01', email: 'alumno@test.com', name: 'Juan Alumno', role: 'STUDENT', programId: 'prog-01' },
    { id: 'std-02', email: 'maria.gomez@test.com', name: 'María Gómez', role: 'STUDENT', programId: 'prog-01' },
    { id: 'std-03', email: 'carlos.rios@test.com', name: 'Carlos Ríos', role: 'STUDENT', programId: 'prog-01' },
    { id: 'std-04', email: 'laura.mendez@test.com', name: 'Laura Méndez', role: 'STUDENT', programId: 'prog-02' },
    { id: 'std-05', email: 'pedro.soto@test.com', name: 'Pedro Soto', role: 'STUDENT', programId: 'prog-02' },
    { id: 'std-06', email: 'ana.torres@test.com', name: 'Ana Torres', role: 'STUDENT', programId: 'prog-03' },
    { id: 'std-07', email: 'diego.vargas@test.com', name: 'Diego Vargas', role: 'STUDENT', programId: 'prog-04' },
    { id: 'std-08', email: 'sofia.nunez@test.com', name: 'Sofía Núñez', role: 'STUDENT', programId: 'prog-05' },
    { id: 'adv-01', email: 'asesor@test.com', name: 'Dr. Roberto Pérez', role: 'ADVISOR', programId: 'prog-01' },
    { id: 'adv-02', email: 'dra.silva@test.com', name: 'Dra. Elena Silva', role: 'ADVISOR', programId: 'prog-02' },
    { id: 'adv-03', email: 'dr.morales@test.com', name: 'Dr. Luis Morales', role: 'ADVISOR', programId: 'prog-03' },
    { id: 'adv-04', email: 'dra.castro@test.com', name: 'Dra. Patricia Castro', role: 'ADVISOR', programId: 'prog-04' },
    { id: 'coord-01', email: 'coord@test.com', name: 'María Castillo', role: 'COORDINATOR', programId: 'prog-01' },
    { id: 'coord-02', email: 'coord.educacion@test.com', name: 'Jorge Ramírez', role: 'COORDINATOR', programId: 'prog-02' },
    { id: 'admin-01', email: 'admin@test.com', name: 'Administrador Sistema', role: 'ADMIN', programId: null },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, programId: u.programId, passwordHash: hashedPassword },
      create: { ...u, passwordHash: hashedPassword },
    });
  }

  type AdvanceSeed = {
    id: string;
    advanceGroupId: string;
    studentId: string;
    programId: string;
    templateId: string;
    title: string;
    advanceType: string;
    version: number;
    status: AdvanceStatus;
    overallScore?: number;
    daysAgo: number;
    review?: { finalGrade: number; status: ReviewStatus; comment: string };
    pendingOnly?: boolean;
  };

  const advancesData: AdvanceSeed[] = [
    {
      id: 'adv-seed-001',
      advanceGroupId: 'grp-juan-cap1',
      studentId: 'std-01',
      programId: 'prog-01',
      templateId: 'temp-01',
      title: 'Plataforma de gestión de tesis con IA',
      advanceType: 'Capítulo 1',
      version: 1,
      status: 'APPROVED',
      overallScore: 78,
      daysAgo: 45,
      review: { finalGrade: 16.5, status: 'SUBMITTED', comment: 'Buen planteamiento; ajustar objetivos específicos.' },
    },
    {
      id: 'adv-seed-002',
      advanceGroupId: 'grp-juan-cap1',
      studentId: 'std-01',
      programId: 'prog-01',
      templateId: 'temp-01',
      title: 'Plataforma de gestión de tesis con IA',
      advanceType: 'Capítulo 1',
      version: 2,
      status: 'APPROVED',
      overallScore: 86,
      daysAgo: 30,
      review: { finalGrade: 17.2, status: 'SUBMITTED', comment: 'Mejora notable respecto a v1.' },
    },
    {
      id: 'adv-seed-003',
      advanceGroupId: 'grp-juan-cap2',
      studentId: 'std-01',
      programId: 'prog-01',
      templateId: 'temp-01',
      title: 'Marco teórico — Revisión sistemática',
      advanceType: 'Capítulo 2',
      version: 1,
      status: 'IN_HUMAN_REVIEW',
      overallScore: 72,
      daysAgo: 12,
    },
    {
      id: 'adv-seed-004',
      advanceGroupId: 'grp-maria-cap1',
      studentId: 'std-02',
      programId: 'prog-01',
      templateId: 'temp-01',
      title: 'Ciberseguridad en APIs REST',
      advanceType: 'Capítulo 1',
      version: 1,
      status: 'OBSERVED',
      overallScore: 58,
      daysAgo: 20,
      review: { finalGrade: 11.5, status: 'SUBMITTED', comment: 'Reforzar marco teórico y citas recientes.' },
    },
    {
      id: 'adv-seed-005',
      advanceGroupId: 'grp-maria-cap1',
      studentId: 'std-02',
      programId: 'prog-01',
      templateId: 'temp-01',
      title: 'Ciberseguridad en APIs REST',
      advanceType: 'Capítulo 1',
      version: 2,
      status: 'AI_COMPLETE',
      overallScore: 65,
      daysAgo: 8,
    },
    {
      id: 'adv-seed-006',
      advanceGroupId: 'grp-carlos-met',
      studentId: 'std-03',
      programId: 'prog-01',
      templateId: 'temp-01',
      title: 'Metodología — Microservicios en la nube',
      advanceType: 'Metodología',
      version: 1,
      status: 'REJECTED',
      overallScore: 42,
      daysAgo: 25,
      review: { finalGrade: 8.0, status: 'SUBMITTED', comment: 'No cumple estructura mínima; rehacer diseño metodológico.' },
    },
    {
      id: 'adv-seed-007',
      advanceGroupId: 'grp-laura-edu',
      studentId: 'std-04',
      programId: 'prog-02',
      templateId: 'temp-03',
      title: 'Innovación pedagógica en aula virtual',
      advanceType: 'Capítulo 1',
      version: 1,
      status: 'APPROVED',
      overallScore: 81,
      daysAgo: 35,
      review: { finalGrade: 16.8, status: 'SUBMITTED', comment: 'Excelente contextualización.' },
    },
    {
      id: 'adv-seed-008',
      advanceGroupId: 'grp-laura-edu',
      studentId: 'std-04',
      programId: 'prog-02',
      templateId: 'temp-03',
      title: 'Innovación pedagógica en aula virtual',
      advanceType: 'Capítulo 2',
      version: 1,
      status: 'IN_HUMAN_REVIEW',
      overallScore: 74,
      daysAgo: 14,
    },
    {
      id: 'adv-seed-009',
      advanceGroupId: 'grp-pedro-edu',
      studentId: 'std-05',
      programId: 'prog-02',
      templateId: 'temp-03',
      title: 'Evaluación por competencias en básica',
      advanceType: 'Propuesta de investigación',
      version: 1,
      status: 'AI_COMPLETE',
      overallScore: 55,
      daysAgo: 6,
    },
    {
      id: 'adv-seed-010',
      advanceGroupId: 'grp-ana-der',
      studentId: 'std-06',
      programId: 'prog-03',
      templateId: 'temp-04',
      title: 'Responsabilidad civil en contratos digitales',
      advanceType: 'Capítulo 1',
      version: 1,
      status: 'OBSERVED',
      overallScore: 68,
      daysAgo: 18,
      review: { finalGrade: 13.5, status: 'SUBMITTED', comment: 'Ampliar jurisprudencia nacional.' },
    },
    {
      id: 'adv-seed-011',
      advanceGroupId: 'grp-diego-adm',
      studentId: 'std-07',
      programId: 'prog-04',
      templateId: 'temp-05',
      title: 'Gestión del talento en PYMEs',
      advanceType: 'Capítulo 1',
      version: 1,
      status: 'APPROVED',
      overallScore: 88,
      daysAgo: 40,
      review: { finalGrade: 17.6, status: 'SUBMITTED', comment: 'Trabajo sólido y bien citado.' },
    },
    {
      id: 'adv-seed-012',
      advanceGroupId: 'grp-sofia-datos',
      studentId: 'std-08',
      programId: 'prog-05',
      templateId: 'temp-06',
      title: 'Modelos predictivos para deserción estudiantil',
      advanceType: 'Capítulo 1',
      version: 1,
      status: 'AI_COMPLETE',
      overallScore: 91,
      daysAgo: 5,
    },
    {
      id: 'adv-seed-013',
      advanceGroupId: 'grp-carlos-pend',
      studentId: 'std-03',
      programId: 'prog-01',
      templateId: 'temp-01',
      title: 'Resultados preliminares — Microservicios',
      advanceType: 'Resultados',
      version: 1,
      status: 'PENDING',
      daysAgo: 2,
      pendingOnly: true,
    },
    {
      id: 'adv-seed-014',
      advanceGroupId: 'grp-maria-pend',
      studentId: 'std-02',
      programId: 'prog-01',
      templateId: 'temp-01',
      title: 'Borrador Capítulo 2 — APIs REST',
      advanceType: 'Capítulo 2',
      version: 1,
      status: 'PENDING',
      daysAgo: 1,
      pendingOnly: true,
    },
    {
      id: 'adv-seed-015',
      advanceGroupId: 'grp-pedro-pend',
      studentId: 'std-05',
      programId: 'prog-02',
      templateId: 'temp-03',
      title: 'Instrumentos de recolección',
      advanceType: 'Anexos',
      version: 1,
      status: 'PENDING',
      daysAgo: 0,
      pendingOnly: true,
    },
    {
      id: 'adv-seed-016',
      advanceGroupId: 'grp-sofia-v2',
      studentId: 'std-08',
      programId: 'prog-05',
      templateId: 'temp-06',
      title: 'Modelos predictivos — versión revisada',
      advanceType: 'Capítulo 1',
      version: 2,
      status: 'AI_ANALYZING',
      daysAgo: 0,
      pendingOnly: true,
    },
  ];

  const daysAgoDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
  };

  for (const a of advancesData) {
    const createdAt = daysAgoDate(a.daysAgo);
    await prisma.advance.upsert({
      where: { id: a.id },
      update: {
        title: a.title,
        status: a.status,
        version: a.version,
        advanceGroupId: a.advanceGroupId,
      },
      create: {
        id: a.id,
        advanceGroupId: a.advanceGroupId,
        studentId: a.studentId,
        programId: a.programId,
        templateId: a.templateId,
        title: a.title,
        advanceType: a.advanceType,
        version: a.version,
        fileKey: `seed/${a.id}.pdf`,
        fileType: 'pdf',
        fileSizeBytes: 1_200_000 + a.version * 100_000,
        pageCount: 25 + a.version * 5,
        authorMeta: { title: a.title, author: users.find((u) => u.id === a.studentId)?.name },
        status: a.status,
        createdAt,
        updatedAt: createdAt,
      },
    });

    if (!a.pendingOnly && a.overallScore != null) {
      const ai = aiAnalysisPayload(a.overallScore);
      await prisma.aIAnalysis.upsert({
        where: { advanceId: a.id },
        update: {
          overallScore: ai.overallScore,
          gradeConverted: ai.gradeConverted,
          executiveSummary: ai.executiveSummary,
          findings: ai.findings as Prisma.InputJsonValue,
          structureScore: ai.structureScore,
          contentScore: ai.contentScore,
          formScore: ai.formScore,
          originalityScore: ai.originalityScore,
          aiProvider: ai.aiProvider,
          aiModel: ai.aiModel,
          missingSections: ai.missingSections as Prisma.InputJsonValue,
          semanticNotes: ai.semanticNotes,
        },
        create: {
          advanceId: a.id,
          ...ai,
          findings: ai.findings as Prisma.InputJsonValue,
          missingSections: ai.missingSections as Prisma.InputJsonValue,
        },
      });
    }

    if (a.review) {
      const reviewerId =
        a.programId === 'prog-02'
          ? 'adv-02'
          : a.programId === 'prog-03'
            ? 'adv-03'
            : a.programId === 'prog-04'
              ? 'adv-04'
              : 'adv-01';
      await prisma.review.upsert({
        where: { advanceId: a.id },
        update: {
          finalGrade: a.review.finalGrade,
          humanComment: a.review.comment,
          status: a.review.status,
          findingDecisions: [
            { index: 0, action: 'accept' },
            { index: 1, action: 'modify', note: 'Corregir en próxima versión' },
          ] as Prisma.InputJsonValue,
          checklist: defaultRubric.sections.map((s, i) => ({
            name: s.name,
            weight: s.weight,
            score: Math.round(a.overallScore! * (s.weight / 100)) + (i % 2 === 0 ? 2 : -2),
          })) as Prisma.InputJsonValue,
        },
        create: {
          advanceId: a.id,
          reviewerId,
          finalGrade: a.review.finalGrade,
          humanComment: a.review.comment,
          status: a.review.status,
          findingDecisions: [{ index: 0, action: 'accept' }] as Prisma.InputJsonValue,
          checklist: defaultRubric.sections.map((s) => ({
            name: s.name,
            weight: s.weight,
            score: Math.round((a.overallScore ?? 70) * (s.weight / 100)),
          })) as Prisma.InputJsonValue,
        },
      });
    }
  }

  const annotations = [
    { id: 'ann-01', advanceId: 'adv-seed-003', authorId: 'adv-01', page: 12, content: 'Clarificar la pregunta de investigación en el primer párrafo.' },
    { id: 'ann-02', advanceId: 'adv-seed-003', authorId: 'adv-01', page: 24, content: 'Falta citar autores clave del último quinquenio.' },
    { id: 'ann-03', advanceId: 'adv-seed-008', authorId: 'adv-02', page: 8, content: 'Buen enlace entre teoría y práctica docente.' },
    { id: 'ann-04', advanceId: 'adv-seed-010', authorId: 'adv-03', page: 15, content: 'Incluir sentencia de la Corte Constitucional sobre el tema.' },
  ];

  for (const ann of annotations) {
    await prisma.annotation.upsert({
      where: { id: ann.id },
      update: { content: ann.content },
      create: ann,
    });
  }

  const activities = [
    { type: 'ADVANCE_UPLOAD', message: 'Avance "Plataforma de gestión de tesis" v1 cargado', userId: 'std-01', advanceId: 'adv-seed-001', daysAgo: 45 },
    { type: 'AI_ANALYSIS_DONE', message: 'Análisis IA completado (78%)', advanceId: 'adv-seed-001', daysAgo: 44 },
    { type: 'REVIEW_UPDATED', message: 'Revisión humana — Aprobado Cap. 1', userId: 'adv-01', advanceId: 'adv-seed-001', daysAgo: 40 },
    { type: 'ADVANCE_UPLOAD', message: 'Avance "Ciberseguridad en APIs REST" v2 cargado', userId: 'std-02', advanceId: 'adv-seed-005', daysAgo: 8 },
    { type: 'AI_ANALYSIS_DONE', message: 'Análisis IA completado (65%)', advanceId: 'adv-seed-005', daysAgo: 7 },
    { type: 'TEMPLATE_UPLOAD', message: 'Patrón Educación 2025 cargado', userId: 'coord-02', daysAgo: 60 },
    { type: 'ADVANCE_UPLOAD', message: 'Borrador Capítulo 2 pendiente de análisis', userId: 'std-02', advanceId: 'adv-seed-014', daysAgo: 1 },
    { type: 'REVIEW_UPDATED', message: 'Observaciones registradas — Derecho', userId: 'adv-03', advanceId: 'adv-seed-010', daysAgo: 15 },
    { type: 'AI_ANALYSIS_DONE', message: 'Análisis IA completado (91%)', advanceId: 'adv-seed-012', daysAgo: 4 },
    { type: 'ADVANCE_UPLOAD', message: 'Modelos predictivos v2 en cola', userId: 'std-08', advanceId: 'adv-seed-016', daysAgo: 0 },
  ];

  for (let i = 0; i < activities.length; i++) {
    const act = activities[i];
    const id = `act-seed-${String(i + 1).padStart(3, '0')}`;
    await prisma.activityLog.upsert({
      where: { id },
      update: { message: act.message },
      create: {
        id,
        type: act.type,
        message: act.message,
        userId: act.userId,
        advanceId: act.advanceId,
        createdAt: daysAgoDate(act.daysAgo),
      },
    });
  }

  const notifications = [
    {
      id: 'notif-01',
      userId: 'coord-01',
      title: 'Alerta de bajo cumplimiento',
      message: 'El avance "Ciberseguridad en APIs REST" tiene 58% de cumplimiento IA',
      type: 'alert',
      advanceId: 'adv-seed-004',
      read: false,
      daysAgo: 19,
    },
    {
      id: 'notif-02',
      userId: 'adv-01',
      title: 'Nuevo avance para revisar',
      message: 'Marco teórico — Revisión sistemática listo para revisión humana',
      type: 'info',
      advanceId: 'adv-seed-003',
      read: false,
      daysAgo: 11,
    },
    {
      id: 'notif-03',
      userId: 'adv-02',
      title: 'Alerta de bajo cumplimiento',
      message: 'Evaluación por competencias: 55% cumplimiento IA',
      type: 'alert',
      advanceId: 'adv-seed-009',
      read: true,
      daysAgo: 5,
    },
    {
      id: 'notif-04',
      userId: 'coord-01',
      title: 'Lote masivo completado',
      message: 'Procesados 8 avances del programa Ingeniería',
      type: 'info',
      read: true,
      daysAgo: 3,
    },
    {
      id: 'notif-05',
      userId: 'std-02',
      title: 'Revisión registrada',
      message: 'Su asesor dejó observaciones en Capítulo 1',
      type: 'info',
      advanceId: 'adv-seed-004',
      read: false,
      daysAgo: 18,
    },
  ];

  for (const n of notifications) {
    await prisma.notification.upsert({
      where: { id: n.id },
      update: { read: n.read },
      create: {
        id: n.id,
        userId: n.userId,
        title: n.title,
        message: n.message,
        type: n.type,
        advanceId: n.advanceId,
        read: n.read,
        createdAt: daysAgoDate(n.daysAgo),
      },
    });
  }

  await prisma.bulkJob.upsert({
    where: { id: 'bulk-01' },
    update: {
      status: BulkJobStatus.COMPLETED,
      total: 5,
      processed: 5,
      failed: 0,
    },
    create: {
      id: 'bulk-01',
      status: BulkJobStatus.COMPLETED,
      total: 5,
      processed: 5,
      failed: 0,
      programId: 'prog-01',
      createdById: 'coord-01',
      createdAt: daysAgoDate(7),
      items: {
        create: [
          { id: 'bitem-01', advanceId: 'adv-seed-001', status: 'COMPLETED' },
          { id: 'bitem-02', advanceId: 'adv-seed-002', status: 'COMPLETED' },
          { id: 'bitem-03', advanceId: 'adv-seed-003', status: 'COMPLETED' },
          { id: 'bitem-04', advanceId: 'adv-seed-004', status: 'COMPLETED' },
          { id: 'bitem-05', advanceId: 'adv-seed-006', status: 'COMPLETED' },
        ],
      },
    },
  });

  await prisma.bulkJob.upsert({
    where: { id: 'bulk-02' },
    update: { status: BulkJobStatus.PROCESSING, total: 3, processed: 1, failed: 0 },
    create: {
      id: 'bulk-02',
      status: BulkJobStatus.PROCESSING,
      total: 3,
      processed: 1,
      failed: 0,
      programId: 'prog-02',
      createdById: 'coord-02',
      createdAt: daysAgoDate(1),
      items: {
        create: [
          { id: 'bitem-06', advanceId: 'adv-seed-007', status: 'COMPLETED' },
          { id: 'bitem-07', advanceId: 'adv-seed-008', status: 'PENDING' },
          { id: 'bitem-08', advanceId: 'adv-seed-009', status: 'PENDING' },
        ],
      },
    },
  });

  const counts = {
    programs: await prisma.program.count(),
    users: await prisma.user.count(),
    templates: await prisma.thesisTemplate.count(),
    advances: await prisma.advance.count(),
    aiAnalyses: await prisma.aIAnalysis.count(),
    reviews: await prisma.review.count(),
    annotations: await prisma.annotation.count(),
    activities: await prisma.activityLog.count(),
    notifications: await prisma.notification.count(),
    bulkJobs: await prisma.bulkJob.count(),
  };

  console.log('Seed completado:', counts);
  console.log('Contraseña de todos los usuarios:', PASSWORD);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
