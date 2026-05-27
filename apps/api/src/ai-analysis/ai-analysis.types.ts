export type AiProviderId = 'openai' | 'gemini';

export type FindingSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR' | 'SUGGESTION';
export type FindingType = 'MISSING' | 'STRUCTURAL' | 'CONTENT' | 'FORM' | 'SEMANTIC';

export interface ThesisFinding {
  section: string;
  severity: FindingSeverity;
  type?: FindingType;
  description: string;
  fix: string;
  pageApprox?: number;
  example?: string;
  recommendation?: string;
}

export interface ThesisAnalysisResult {
  overallScore: number;
  gradeConverted: number;
  executiveSummary: string;
  findings: ThesisFinding[];
  structureScore?: number;
  contentScore?: number;
  formScore?: number;
  originalityScore?: number;
  missingSections?: string[];
  semanticNotes?: string;
  detectedAdvanceType?: string;
}

export interface ExtractedTemplateSchema {
  title?: string;
  sections: Array<{
    name: string;
    required: boolean;
    subsections?: string[];
    suggestedPages?: number;
  }>;
  citationStyle?: string;
  writingStyle?: string;
  indexRequired?: boolean;
}

export interface RubricConfig {
  sections: Array<{
    name: string;
    weight: number;
    criteria: string[];
  }>;
  gradeRanges?: Array<{ min: number; max: number; label: string }>;
}

export interface AiProviderInfo {
  id: AiProviderId;
  label: string;
  model: string;
}
