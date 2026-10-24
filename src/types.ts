export type PipelineStage = 'initial_outreach' | 'screening' | 'interviews' | 'offer' | 'archived';
export type ContactChannel = 'linkedin' | 'instahyre' | 'email' | 'whatsapp' | 'phone' | 'other';

export interface RecruiterResponse {
  id: string;
  userId: string;
  company: string;
  role: string;
  channel: ContactChannel;
  recruiterName: string;
  recruiterContact: string;
  stage: PipelineStage;
  claimedLastWorkingDay: string;
  noticePeriodStated: string;
  expectedSalary: string;
  currentSalary?: string;
  notes: string;
  rawSnippet?: string;
  nextAction?: string;
  nextActionDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  defaultExpectedSalary: string;
  defaultNoticePeriod: string;
  defaultLastWorkingDay: string;
}

export interface RawIngestLog {
  id: string;
  userId: string;
  source: string;
  rawText: string;
  status: 'processed' | 'pending' | 'failed';
  parsedCompany?: string;
  createdAt: string;
}

export interface LLMSettings {
  provider: 'gemini' | 'ollama';
  ollamaUrl: string;
  ollamaModel: string;
}

export const STAGE_CONFIG: Record<PipelineStage, { label: string; description: string }> = {
  initial_outreach: { label: 'Initial Outreach', description: 'Recruiter reached out or initial reply received' },
  screening: { label: 'HR / Recruiter Screen', description: 'Initial call or background terms discussed' },
  interviews: { label: 'Technical & Team Rounds', description: 'Active technical/managerial interview rounds' },
  offer: { label: 'Offer & Decision', description: 'Verbal or written offer extended' },
  archived: { label: 'Archived / Closed', description: 'Position closed, rejected, or passed' },
};

export const CHANNEL_CONFIG: Record<ContactChannel, { label: string; icon: string }> = {
  linkedin: { label: 'LinkedIn', icon: 'linkedin' },
  instahyre: { label: 'Instahyre', icon: 'briefcase' },
  email: { label: 'Gmail / Email', icon: 'mail' },
  whatsapp: { label: 'WhatsApp', icon: 'message-square' },
  phone: { label: 'Phone Call', icon: 'phone' },
  other: { label: 'Other Channel', icon: 'globe' },
};

export const COMMON_NOTICE_PERIODS = [
  'Immediate',
  '15 Days',
  '30 Days',
  '60 Days',
  '90 Days',
];
