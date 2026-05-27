import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AdvanceStatus, Prisma } from '@prisma/client';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { AiAnalysisService } from '../ai-analysis/ai-analysis.service';
import { StorageService } from '../storage/storage.service';
import { ActivityService } from '../activity/activity.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DocumentPreviewService } from '../documents/document-preview.service';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (buffer: Buffer) => Promise<{ text: string; numpages?: number; info?: { Title?: string; Author?: string } }>;

const MAX_FILE_BYTES = 50 * 1024 * 1024;

@Injectable()
export class AdvancesService {
  private readonly logger = new Logger(AdvancesService.name);

  constructor(
    private prisma: PrismaService,
    private aiService: AiAnalysisService,
    private storage: StorageService,
    private activity: ActivityService,
    private notifications: NotificationsService,
    private documentPreview: DocumentPreviewService,
    @InjectQueue('advance-analysis') private analysisQueue: Queue,
  ) {}

  getAiProviders() {
    return this.aiService.getAvailableProviders();
  }

  private detectFileType(file: Express.Multer.File): 'pdf' | 'docx' {
    if (file.size > MAX_FILE_BYTES) {
      throw new BadRequestException('El archivo supera el máximo de 50 MB');
    }
    if (file.mimetype.includes('pdf') || file.originalname.toLowerCase().endsWith('.pdf')) return 'pdf';
    if (
      file.mimetype.includes('word') ||
      file.mimetype.includes('document') ||
      file.originalname.toLowerCase().endsWith('.docx')
    ) {
      return 'docx';
    }
    throw new BadRequestException('Solo se permiten archivos PDF o DOCX');
  }

  private async extractMetadata(buffer: Buffer, fileType: 'pdf' | 'docx', originalName: string) {
    if (fileType === 'pdf') {
      const data = await pdfParse(buffer);
      return {
        pageCount: data.numpages ?? null,
        authorMeta: {
          title: data.info?.Title ?? originalName,
          author: data.info?.Author ?? null,
        },
      };
    }
    return { pageCount: null, authorMeta: { title: originalName } };
  }

  async getInstitutionConfig() {
    let config = await this.prisma.institutionConfig.findUnique({ where: { id: 'default' } });
    if (!config) {
      config = await this.prisma.institutionConfig.create({ data: { id: 'default' } });
    }
    return config;
  }

  async updateInstitutionConfig(data: { maxGrade?: number; gradeScale?: string; weights?: unknown }) {
    return this.prisma.institutionConfig.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...data, weights: data.weights as never },
      update: {
        ...(data.maxGrade != null ? { maxGrade: data.maxGrade } : {}),
        ...(data.gradeScale ? { gradeScale: data.gradeScale } : {}),
        ...(data.weights ? { weights: data.weights as never } : {}),
      },
    });
  }

  async uploadAndEnqueue(file: Express.Multer.File, body: Record<string, string>) {
    const fileType = this.detectFileType(file);
    const fileKey = this.storage.saveFile(file.buffer, file.originalname);
    const meta = await this.extractMetadata(file.buffer, fileType, file.originalname);

    const template = body.templateId
      ? await this.prisma.thesisTemplate.findUnique({ where: { id: body.templateId } })
      : await this.prisma.thesisTemplate.findFirst({ where: { isActive: true } });

    if (!template) throw new BadRequestException('No hay plantilla institucional activa');

    const studentId = body.studentId || 'std-01';
    const advanceGroupId = body.advanceGroupId || undefined;
    let version = 1;

    if (advanceGroupId) {
      const last = await this.prisma.advance.findFirst({
        where: { advanceGroupId },
        orderBy: { version: 'desc' },
      });
      version = (last?.version ?? 0) + 1;
    }

    const groupId = advanceGroupId || `grp-${Date.now()}`;

    const advance = await this.prisma.advance.create({
      data: {
        advanceGroupId: groupId,
        studentId,
        templateId: template.id,
        programId: template.programId,
        title: body.title || file.originalname,
        advanceType: body.advanceType || 'Capítulo 1',
        version,
        fileKey,
        fileType,
        fileSizeBytes: file.size,
        pageCount: meta.pageCount ?? undefined,
        authorMeta: meta.authorMeta as Prisma.InputJsonValue,
        status: AdvanceStatus.PENDING,
      },
    });

    await this.analysisQueue.add('analyze', {
      advanceId: advance.id,
      provider: body.provider,
    });

    await this.prisma.advance.update({
      where: { id: advance.id },
      data: { status: AdvanceStatus.AI_ANALYZING },
    });

    await this.activity.log('ADVANCE_UPLOAD', `Avance "${advance.title}" v${version} cargado`, {
      advanceId: advance.id,
      userId: studentId,
    });

    if (fileType === 'docx') {
      void this.documentPreview
        .ensurePreviewPdf(fileKey, fileType)
        .catch((err) => this.logger.warn(`Vista previa PDF no generada para ${advance.id}`, err));
    }

    return { advance, queued: true, message: 'Avance encolado para análisis IA' };
  }

  /** Texto de demostración cuando el seed no tiene archivo físico en uploads/ */
  buildSyntheticThesisText(advance: { title: string; advanceType: string; authorMeta?: unknown }) {
    const author =
      typeof advance.authorMeta === 'object' &&
      advance.authorMeta &&
      'author' in advance.authorMeta &&
      typeof (advance.authorMeta as { author?: string }).author === 'string'
        ? (advance.authorMeta as { author: string }).author
        : 'Estudiante';
    return `
TÍTULO: ${advance.title}
TIPO DE AVANCE: ${advance.advanceType}
AUTOR: ${author}

1. INTRODUCCIÓN
Este trabajo presenta el planteamiento del problema y los objetivos general y específicos de la investigación.
Se contextualiza el tema en el marco académico institucional y se justifica la relevancia del estudio.

2. MARCO TEÓRICO
Se revisan autores fundamentales y se establecen las categorías analíticas que orientan el estudio.
Las referencias incluyen literatura reciente en el área, aunque algunas citas requieren uniformar el estilo APA.

3. METODOLOGÍA
El diseño de investigación combina enfoques que permiten responder a los objetivos planteados.
Se describen población, muestra, técnicas de recolección y procedimientos de análisis de datos.

4. RESULTADOS
Los hallazgos preliminares muestran tendencias alineadas con la hipótesis de trabajo.
Se presentan tablas y figuras que requieren mejorar la interpretación narrativa en el texto.

5. CONCLUSIONES
Se cumplen parcialmente los objetivos específicos y se proponen líneas de trabajo futuro.
Se recomienda ampliar la bibliografía y profundizar el análisis en la siguiente versión.

6. BIBLIOGRAFÍA
Referencias académicas de ejemplo en formato APA 7 para fines de demostración del sistema.
`.trim();
  }

  async extractAdvanceText(advance: {
    fileKey: string;
    fileType: string;
    title: string;
    advanceType: string;
    authorMeta?: unknown;
  }): Promise<string> {
    if (this.storage.fileExists(advance.fileKey)) {
      const filePath = this.storage.getFilePath(advance.fileKey);
      const buffer = await import('fs').then((fs) => fs.promises.readFile(filePath));
      return this.aiService.extractText(buffer, advance.fileType as 'pdf' | 'docx');
    }
    if (advance.fileKey.startsWith('seed/')) {
      this.logger.warn(`Usando texto sintético para ${advance.fileKey} (archivo demo del seed)`);
      return this.buildSyntheticThesisText(advance);
    }
    throw new BadRequestException(
      'Archivo no encontrado en almacenamiento. Vuelva a subir el documento desde Cargar avance.',
    );
  }

  async runAnalysisForAdvance(advanceId: string, provider?: string) {
    const advance = await this.prisma.advance.findUnique({
      where: { id: advanceId },
      include: { template: true },
    });
    if (!advance) throw new NotFoundException('Avance no encontrado');

    const rawText = await this.extractAdvanceText(advance);
    const config = await this.getInstitutionConfig();
    const maxGrade = config.maxGrade;
    const weights = config.weights as {
      structure?: number;
      content?: number;
      form?: number;
      originality?: number;
    };
    const normalizedWeights = {
      structure: weights?.structure ?? 30,
      content: weights?.content ?? 40,
      form: weights?.form ?? 20,
      originality: weights?.originality ?? 10,
    };

    const { result: analysis, provider: usedProvider, model } = await this.aiService.analyzeWithIA(
      rawText,
      advance.template.extractedSchema,
      provider,
      maxGrade,
      advance.template.rubric,
      normalizedWeights,
    );

    const gradeConverted = this.aiService.computeGrade(analysis.overallScore, maxGrade);

    await this.prisma.aIAnalysis.upsert({
      where: { advanceId },
      create: {
        advanceId,
        overallScore: analysis.overallScore,
        gradeConverted,
        executiveSummary: analysis.executiveSummary,
        findings: JSON.parse(JSON.stringify(analysis.findings)) as Prisma.InputJsonValue,
        structureScore: analysis.structureScore ?? 0,
        contentScore: analysis.contentScore ?? 0,
        formScore: analysis.formScore ?? 0,
        originalityScore: analysis.originalityScore ?? 0,
        aiProvider: usedProvider,
        aiModel: model,
        missingSections: (analysis.missingSections ?? []) as Prisma.InputJsonValue,
        semanticNotes: analysis.semanticNotes,
      },
      update: {
        overallScore: analysis.overallScore,
        gradeConverted,
        executiveSummary: analysis.executiveSummary,
        findings: JSON.parse(JSON.stringify(analysis.findings)) as Prisma.InputJsonValue,
        structureScore: analysis.structureScore ?? 0,
        contentScore: analysis.contentScore ?? 0,
        formScore: analysis.formScore ?? 0,
        originalityScore: analysis.originalityScore ?? 0,
        aiProvider: usedProvider,
        aiModel: model,
        missingSections: (analysis.missingSections ?? []) as Prisma.InputJsonValue,
        semanticNotes: analysis.semanticNotes,
      },
    });

    await this.prisma.advance.update({
      where: { id: advanceId },
      data: { status: AdvanceStatus.AI_COMPLETE },
    });

    if (analysis.overallScore < 60) {
      await this.notifications.create({
        title: 'Alerta de bajo cumplimiento',
        message: `El avance "${advance.title}" tiene ${analysis.overallScore}% de cumplimiento IA`,
        type: 'alert',
        advanceId,
      });
    }

    await this.activity.log('AI_ANALYSIS_DONE', `Análisis IA completado (${analysis.overallScore}%)`, {
      advanceId,
      metadata: { provider: usedProvider, model },
    });

    return this.prisma.advance.findUnique({
      where: { id: advanceId },
      include: { aiAnalysis: true, student: true, template: true },
    });
  }

  async processFullPipeline(file: Express.Multer.File, body: Record<string, string>) {
    const { advance } = await this.uploadAndEnqueue(file, body);
    const result = await this.runAnalysisForAdvance(advance.id, body.provider);
    return { advance: result, provider: result?.aiAnalysis?.aiProvider, model: result?.aiAnalysis?.aiModel };
  }

  list(filters?: { programId?: string; status?: AdvanceStatus; studentId?: string }) {
    return this.prisma.advance.findMany({
      where: {
        ...(filters?.programId ? { programId: filters.programId } : {}),
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.studentId ? { studentId: filters.studentId } : {}),
      },
      include: { aiAnalysis: true, student: true, program: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.advance.findUnique({
      where: { id },
      include: { aiAnalysis: true, review: true, student: true, template: true, program: true },
    });
  }

  getPreviewUrl(id: string) {
    const advance = this.prisma.advance.findUnique({ where: { id } });
    return advance.then((a) => {
      if (!a) throw new NotFoundException('Avance no encontrado');
      return {
        fileKey: a.fileKey,
        fileType: a.fileType,
        url: `/advances/${id}/pdf`,
      };
    });
  }
}
