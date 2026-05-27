export type ProgramRef = { id: string; name: string };

export type StudentRef = { name: string };

export type AiFinding = {
  severity: string;
  section: string;
  type?: string;
  description: string;
  fix?: string;
  example?: string;
  recommendation?: string;
  pageApprox?: number;
};

export type FindingDecision = {
  index: number;
  action: 'accept' | 'modify' | 'reject';
  note?: string;
};

export type ChecklistItem = {
  name: string;
  weight: number;
  score?: number;
  criteria?: string[];
};

export type Annotation = {
  id: string;
  content: string;
  page?: number;
  paragraph?: string;
  author?: { name: string };
  createdAt: string;
};

export type AiAnalysis = {
  overallScore: number;
  gradeConverted: number;
  executiveSummary: string;
  findings?: AiFinding[];
};

export type Review = {
  finalGrade?: number | null;
  humanComment?: string | null;
  findingDecisions?: FindingDecision[];
  checklist?: ChecklistItem[];
  reviewer?: { name: string };
};

export type Advance = {
  id: string;
  title: string;
  status: string;
  version?: number;
  advanceGroupId?: string;
  fileType?: string;
  student?: StudentRef;
  program?: ProgramRef;
  template?: { rubric?: { sections?: ChecklistItem[] } };
  aiAnalysis?: AiAnalysis | null;
  review?: Review | null;
  annotations?: Annotation[];
};

export type BulkJob = {
  id: string;
  status: string;
  processed: number;
  total: number;
  failed: number;
  message?: string;
  skipped?: number;
  items?: Array<{
    id: string;
    status: string;
    error?: string | null;
    advanceId?: string;
    advance?: { title?: string; student?: { name: string } };
  }>;
};

export type ThesisTemplate = {
  id: string;
  name: string;
  version: string;
  isActive: boolean;
  program?: ProgramRef;
};

export type DashboardKpis = {
  pending?: number;
  reviewed?: number;
  rejected?: number;
  iaHumanConcordance?: number;
  avgAiGrade?: number;
  avgHumanGrade?: number;
  lowComplianceCount?: number;
};

export type DashboardRecentAdvance = {
  id: string;
  title: string;
  student: string;
  program: string;
  status: string;
  overallScore?: number | null;
};

export type DashboardTimelineItem = {
  id: string;
  message: string;
  createdAt: string;
};

export type DashboardAlert = {
  id: string;
  title: string;
  score?: number;
  student: string;
};

export type DashboardOverview = {
  kpis?: DashboardKpis;
  recentAdvances?: DashboardRecentAdvance[];
  alerts?: DashboardAlert[];
  timeline?: DashboardTimelineItem[];
};

export type StatsAnalytics = {
  scoreDistribution?: { range: string; count: number }[];
  byStatus?: { name: string; value: number }[];
  byMonth?: { month: string; count: number }[];
  iaHumanConcordance?: { ia: number; human: number }[];
  advisorLoad?: { reviewerId: string; name?: string; _count: { id: number } }[];
  radar?: {
    structure: number;
    content: number;
    form: number;
    originality: number;
  };
};

export type UploadPipelineResponse = {
  result?: Advance;
  provider?: string;
  model?: string;
};
