import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AiAnalysisService } from '../ai-analysis/ai-analysis.service';
import { StorageService } from '../storage/storage.service';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class TemplatesService {
  constructor(
    private prisma: PrismaService,
    private ai: AiAnalysisService,
    private storage: StorageService,
    private activity: ActivityService,
  ) {}

  list(programId?: string) {
    return this.prisma.thesisTemplate.findMany({
      where: programId ? { programId } : undefined,
      include: { program: { select: { id: true, name: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.thesisTemplate.findUnique({
      where: { id },
      include: { program: true },
    });
  }

  async upload(
    file: Express.Multer.File,
    body: { programId: string; name: string; version?: string; rubric?: string; provider?: string },
  ) {
    const fileType = file.mimetype.includes('pdf') ? 'pdf' : 'docx';
    const fileKey = this.storage.saveFile(file.buffer, file.originalname);
    const text = await this.ai.extractText(file.buffer, fileType);
    let extractedSchema: unknown = {
      sections: [
        { name: 'Introducción', required: true },
        { name: 'Metodología', required: true },
        { name: 'Resultados', required: true },
        { name: 'Conclusiones', required: true },
      ],
    };
    try {
      extractedSchema = await this.ai.extractTemplateStructure(text, body.provider);
    } catch {
      /* fallback schema */
    }
    let rubric: Prisma.InputJsonValue = {
      sections: [
        { name: 'Estructura', weight: 30, criteria: ['Índice', 'Orden de secciones'] },
        { name: 'Contenido', weight: 40, criteria: ['Objetivos', 'Metodología', 'Citas'] },
        { name: 'Forma', weight: 20, criteria: ['Extensión', 'Redacción académica'] },
        { name: 'Originalidad', weight: 10, criteria: ['Coherencia interna'] },
      ],
    };
    if (body.rubric) {
      try {
        rubric = JSON.parse(body.rubric) as Prisma.InputJsonValue;
      } catch {
        throw new BadRequestException('rubric debe ser JSON válido');
      }
    }
    if (body.version && body.version !== '1.0') {
      await this.prisma.thesisTemplate.updateMany({
        where: { programId: body.programId, name: body.name },
        data: { isActive: false },
      });
    }
    const template = await this.prisma.thesisTemplate.create({
      data: {
        programId: body.programId,
        name: body.name,
        version: body.version || '1.0',
        fileKey,
        fileType,
        extractedSchema: extractedSchema as Prisma.InputJsonValue,
        rubric,
        isActive: true,
      },
      include: { program: true },
    });
    await this.activity.log('TEMPLATE_UPLOAD', `Patrón "${template.name}" v${template.version} cargado`, {
      metadata: { templateId: template.id, programId: body.programId },
    });
    return template;
  }

  async updateRubric(id: string, rubric: unknown) {
    return this.prisma.thesisTemplate.update({
      where: { id },
      data: { rubric: rubric as Prisma.InputJsonValue },
    });
  }

  async setActive(id: string) {
    const t = await this.prisma.thesisTemplate.findUnique({ where: { id } });
    if (!t) throw new BadRequestException('Plantilla no encontrada');
    await this.prisma.thesisTemplate.updateMany({
      where: { programId: t.programId, name: t.name },
      data: { isActive: false },
    });
    return this.prisma.thesisTemplate.update({ where: { id }, data: { isActive: true } });
  }
}
