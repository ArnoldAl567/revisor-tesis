import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentPreviewService } from '../documents/document-preview.service';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private documentPreview: DocumentPreviewService,
  ) {}

  async buildActaHtml(advanceId: string) {
    const advance = await this.prisma.advance.findUnique({
      where: { id: advanceId },
      include: {
        student: true,
        program: true,
        template: true,
        aiAnalysis: true,
        review: { include: { reviewer: true } },
      },
    });
    if (!advance) throw new NotFoundException('Avance no encontrado');

    const findings = (advance.aiAnalysis?.findings as Array<Record<string, string>>) ?? [];
    const decisions = (advance.review?.findingDecisions as Array<Record<string, unknown>>) ?? [];

    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Acta de Revisión</title>
<style>body{font-family:Georgia,serif;padding:40px;color:#1e293b}h1{color:#185FA5}table{width:100%;border-collapse:collapse;margin:16px 0}td,th{border:1px solid #e2e8f0;padding:8px;font-size:12px}</style>
</head><body>
<h1>Acta de Revisión — ThesisReview</h1>
<p><strong>Estudiante:</strong> ${advance.student.name} · <strong>Programa:</strong> ${advance.program.name}</p>
<p><strong>Título:</strong> ${advance.title} · <strong>Avance:</strong> ${advance.advanceType} v${advance.version}</p>
<h2>Evaluación IA</h2>
<p>Cumplimiento: ${advance.aiAnalysis?.overallScore ?? '—'}% · Nota IA: ${advance.aiAnalysis?.gradeConverted ?? '—'}</p>
<p>${advance.aiAnalysis?.executiveSummary ?? ''}</p>
<h3>Hallazgos</h3>
<table><tr><th>Sección</th><th>Severidad</th><th>Descripción</th></tr>
${findings.map((f) => `<tr><td>${f.section}</td><td>${f.severity}</td><td>${f.description}</td></tr>`).join('')}
</table>
<h2>Revisión humana</h2>
<p><strong>Revisor:</strong> ${advance.review?.reviewer?.name ?? 'Pendiente'} · <strong>Nota final:</strong> ${advance.review?.finalGrade ?? '—'}</p>
<p>${advance.review?.humanComment ?? ''}</p>
${decisions.length ? `<h3>Decisiones sobre hallazgos IA</h3><ul>${decisions.map((d) => `<li>Hallazgo #${(d as { index?: number }).index}: ${(d as { action?: string }).action}</li>`).join('')}</ul>` : ''}
<p><em>Generado ${new Date().toLocaleString('es')}</em></p>
</body></html>`;
  }

  async versionComparison(advanceGroupId: string) {
    return this.prisma.advance.findMany({
      where: { advanceGroupId },
      include: { aiAnalysis: true, review: true },
      orderBy: { version: 'asc' },
    });
  }

  async buildActaPdf(advanceId: string): Promise<Buffer> {
    const html = await this.buildActaHtml(advanceId);
    return this.documentPreview.htmlToPdfBuffer(html);
  }
}
