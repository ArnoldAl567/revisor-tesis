import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { OpenAI } from 'openai';
import * as mammoth from 'mammoth';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (buffer: Buffer) => Promise<{ text: string }>;
import {
  AiProviderId,
  AiProviderInfo,
  ThesisAnalysisResult,
} from './ai-analysis.types';

const PLACEHOLDER_KEYS = ['tu_clave', 'tu_clave_aqui', 'your_api_key', 'sk-xxx'];

@Injectable()
export class AiAnalysisService {
  private readonly logger = new Logger(AiAnalysisService.name);
  private openai: OpenAI | null = null;
  private gemini: GoogleGenerativeAI | null = null;

  constructor() {
    const openaiKey = process.env.OPENAI_API_KEY?.trim();
    if (openaiKey && !this.isPlaceholder(openaiKey)) {
      this.openai = new OpenAI({ apiKey: openaiKey });
    }

    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    if (geminiKey && !this.isPlaceholder(geminiKey)) {
      this.gemini = new GoogleGenerativeAI(geminiKey);
    }
  }

  private isPlaceholder(key: string): boolean {
    const lower = key.toLowerCase();
    return PLACEHOLDER_KEYS.some((p) => lower.includes(p));
  }

  getAvailableProviders(): AiProviderInfo[] {
    const providers: AiProviderInfo[] = [];
    if (this.openai) {
      providers.push({
        id: 'openai',
        label: 'OpenAI GPT-4o',
        model: process.env.OPENAI_MODEL || 'gpt-4o',
      });
    }
    if (this.gemini) {
      providers.push({
        id: 'gemini',
        label: 'Google Gemini',
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      });
    }
    return providers;
  }

  resolveProvider(requested?: string): AiProviderId {
    const available = this.getAvailableProviders();
    if (available.length === 0) {
      throw new BadRequestException(
        'Configura OPENAI_API_KEY o GEMINI_API_KEY en apps/api/.env',
      );
    }
    const ids = available.map((p) => p.id);
    const envDefault = process.env.AI_PROVIDER?.trim().toLowerCase();

    if (requested) {
      const normalized = requested.toLowerCase() as AiProviderId;
      if (ids.includes(normalized)) return normalized;
      throw new BadRequestException(
        `Proveedor "${requested}" no disponible. Activos: ${ids.join(', ')}`,
      );
    }

    if (envDefault && envDefault !== 'auto' && ids.includes(envDefault as AiProviderId)) {
      return envDefault as AiProviderId;
    }

    return ids[0];
  }

  getProviderInfo(provider: AiProviderId): AiProviderInfo {
    const info = this.getAvailableProviders().find((p) => p.id === provider);
    if (!info) {
      throw new BadRequestException(`Proveedor ${provider} no configurado`);
    }
    return info;
  }

  async extractText(buffer: Buffer, fileType: string): Promise<string> {
    if (fileType === 'docx') {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }
    if (fileType === 'pdf') {
      const data = await pdfParse(buffer);
      return data.text;
    }
    throw new BadRequestException('Formato no soportado. Use PDF o DOCX.');
  }

  private buildPrompt(
    text: string,
    templateSchema: unknown,
    maxGrade = 20,
    rubric?: unknown,
    weights?: { structure: number; content: number; form: number; originality: number },
  ): string {
    const w = weights ?? { structure: 30, content: 40, form: 20, originality: 10 };
    return `
Eres un revisor académico experto. Compara el avance contra el PATRÓN INSTITUCIONAL y la RÚBRICA.
Ponderación obligatoria para overallScore: Estructura ${w.structure}%, Contenido ${w.content}%, Forma ${w.form}%, Originalidad ${w.originality}%.
Calcula gradeConverted = (overallScore / 100) * ${maxGrade}.
Nota máxima institucional: ${maxGrade}.

PATRÓN (secciones, citas, estilo):
${JSON.stringify(templateSchema)}

RÚBRICA DE EVALUACIÓN (criterios y pesos por dimensión):
${JSON.stringify(rubric ?? { sections: [] })}

CONTENIDO DEL AVANCE:
${text.substring(0, 14000)}

Responde SOLO JSON válido:
{
  "overallScore": 0-100,
  "gradeConverted": 0-${maxGrade},
  "executiveSummary": "párrafo con fortalezas, debilidades, prioridades y nivel de avance",
  "structureScore": 0-100,
  "contentScore": 0-100,
  "formScore": 0-100,
  "originalityScore": 0-100,
  "missingSections": ["secciones obligatorias ausentes"],
  "semanticNotes": "coherencia entre introducción, metodología, resultados y conclusiones",
  "detectedAdvanceType": "Capítulo 1 | Marco teórico | etc.",
  "findings": [{
    "section": "nombre",
    "severity": "CRITICAL|MAJOR|MINOR|SUGGESTION",
    "type": "MISSING|STRUCTURAL|CONTENT|FORM|SEMANTIC",
    "description": "qué se encontró o falta",
    "fix": "pasos para corregir",
    "pageApprox": 1,
    "example": "párrafo ejemplo de redacción correcta",
    "recommendation": "consejo académico adicional"
  }]
}
`.trim();
  }

  async extractTemplateStructure(text: string, provider?: string): Promise<unknown> {
    const prompt = `
Extrae la estructura de este DOCUMENTO PATRÓN INSTITUCIONAL de tesis.
TEXTO:
${text.substring(0, 15000)}

Responde SOLO JSON:
{
  "title": "nombre del patrón",
  "sections": [{"name": "...", "required": true, "subsections": [], "suggestedPages": 0}],
  "citationStyle": "APA|IEEE|...",
  "writingStyle": "académico formal",
  "indexRequired": true
}`;
    return this.generateJson(prompt, provider);
  }

  async generateJson(prompt: string, provider?: string): Promise<unknown> {
    const resolved = this.resolveProvider(provider);
    const info = this.getProviderInfo(resolved);
    let raw: string;
    if (resolved === 'openai') {
      if (!this.openai) throw new BadRequestException('OPENAI_API_KEY no configurada');
      const response = await this.openai.chat.completions.create({
        model: info.model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });
      raw = response.choices[0]?.message?.content ?? '';
    } else {
      if (!this.gemini) throw new BadRequestException('GEMINI_API_KEY no configurada');
      const generativeModel = this.gemini.getGenerativeModel({
        model: info.model,
        generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
      });
      const response = await generativeModel.generateContent(prompt);
      raw = response.response.text() ?? '';
    }
    return this.parseRawJson(raw);
  }

  private parseRawJson(raw: string): unknown {
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    return JSON.parse(cleaned);
  }

  computeGrade(overallScore: number, maxGrade: number): number {
    return Math.round((overallScore / 100) * maxGrade * 100) / 100;
  }

  private parseAnalysisJson(raw: string): ThesisAnalysisResult {
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(cleaned) as ThesisAnalysisResult;
    if (
      typeof parsed.overallScore !== 'number' ||
      typeof parsed.gradeConverted !== 'number' ||
      !parsed.executiveSummary
    ) {
      throw new BadRequestException('La IA devolvió un JSON inválido');
    }
    return parsed;
  }

  async analyzeWithIA(
    text: string,
    templateSchema: unknown,
    provider?: string,
    maxGrade = 20,
    rubric?: unknown,
    weights?: { structure: number; content: number; form: number; originality: number },
  ): Promise<{ result: ThesisAnalysisResult; provider: AiProviderId; model: string }> {
    if (!text?.trim()) {
      throw new BadRequestException('No se pudo extraer texto del documento');
    }

    const resolved = this.resolveProvider(provider);
    const info = this.getProviderInfo(resolved);
    const prompt = this.buildPrompt(
      text,
      templateSchema ?? { secciones: [] },
      maxGrade,
      rubric,
      weights,
    );

    this.logger.log(`Análisis con ${resolved} (${info.model})`);

    try {
      if (resolved === 'openai') {
        const result = await this.analyzeWithOpenAI(prompt, info.model);
        return { result, provider: resolved, model: info.model };
      }
      const { result, model } = await this.analyzeWithGemini(prompt, info.model);
      return { result, provider: resolved, model };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      if (resolved === 'gemini' && this.openai && this.isGeminiQuotaError(error)) {
        this.logger.warn('Gemini sin cuota; reintentando con OpenAI');
        const openaiModel = process.env.OPENAI_MODEL || 'gpt-4o';
        const result = await this.analyzeWithOpenAI(prompt, openaiModel);
        return { result, provider: 'openai', model: openaiModel };
      }
      throw this.mapProviderError(error, resolved);
    }
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  private isGeminiQuotaError(error: unknown): boolean {
    const msg = this.errorMessage(error);
    return (
      msg.includes('429') ||
      msg.toLowerCase().includes('quota') ||
      msg.toLowerCase().includes('rate limit')
    );
  }

  private isGeminiRetryableError(error: unknown): boolean {
    const msg = this.errorMessage(error);
    return (
      this.isGeminiQuotaError(error) ||
      msg.includes('404') ||
      msg.toLowerCase().includes('not found')
    );
  }

  private mapProviderError(error: unknown, provider: AiProviderId): BadRequestException {
    const msg = this.errorMessage(error);
    if (provider === 'gemini' && this.isGeminiQuotaError(error)) {
      return new BadRequestException(
        'Cuota de Gemini agotada. Espera 1–2 minutos, activa facturación en Google AI Studio, o usa OPENAI_API_KEY.',
      );
    }
    if (provider === 'gemini' && (msg.includes('404') || msg.toLowerCase().includes('not found'))) {
      return new BadRequestException(
        'Modelo de Gemini no encontrado. En apps/api/.env usa GEMINI_MODEL=gemini-2.5-flash o gemini-2.0-flash.',
      );
    }
    if (msg.includes('API key') || msg.includes('401')) {
      return new BadRequestException('API key inválida o sin permisos. Revisa tu archivo .env');
    }
    return new BadRequestException(`Error de ${provider}: ${msg.slice(0, 280)}`);
  }

  private getGeminiModelCandidates(primary: string): string[] {
    const fromEnv = process.env.GEMINI_FALLBACK_MODELS?.split(',').map((m) => m.trim()).filter(Boolean);
    const defaults = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-2.5-flash-lite',
    ];
    return [...new Set([primary, ...(fromEnv ?? defaults)])];
  }

  private async analyzeWithOpenAI(prompt: string, model: string): Promise<ThesisAnalysisResult> {
    if (!this.openai) {
      throw new BadRequestException('OPENAI_API_KEY no configurada');
    }
    const response = await this.openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });
    const content = response.choices[0]?.message?.content;
    if (!content) throw new BadRequestException('OpenAI no devolvió contenido');
    return this.parseAnalysisJson(content);
  }

  private async analyzeWithGemini(
    prompt: string,
    model: string,
  ): Promise<{ result: ThesisAnalysisResult; model: string }> {
    if (!this.gemini) {
      throw new BadRequestException('GEMINI_API_KEY no configurada');
    }

    const candidates = this.getGeminiModelCandidates(model);
    let lastError: unknown;

    for (const candidate of candidates) {
      try {
        this.logger.log(`Gemini: intentando modelo ${candidate}`);
        const generativeModel = this.gemini.getGenerativeModel({
          model: candidate,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.3,
          },
        });
        const response = await generativeModel.generateContent(prompt);
        const content = response.response.text();
        if (!content) throw new BadRequestException('Gemini no devolvió contenido');
        return { result: this.parseAnalysisJson(content), model: candidate };
      } catch (error) {
        lastError = error;
        if (error instanceof BadRequestException) throw error;
        if (this.isGeminiRetryableError(error)) {
          this.logger.warn(
            `Gemini ${candidate}: ${this.errorMessage(error).slice(0, 80)}… probando otro modelo`,
          );
          continue;
        }
        throw this.mapProviderError(error, 'gemini');
      }
    }

    throw this.mapProviderError(lastError, 'gemini');
  }
}
