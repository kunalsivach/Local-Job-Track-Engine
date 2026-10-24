import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export type PipelineStage = 'initial_outreach' | 'screening' | 'interviews' | 'offer' | 'archived';
export type ContactChannel = 'linkedin' | 'instahyre' | 'email' | 'whatsapp' | 'phone' | 'other';

export interface RecruiterResponse {
  id: string;
  company: string;
  role: string;
  channel: ContactChannel;
  recruiterName: string;
  recruiterContact: string;
  stage: PipelineStage;
  claimedLastWorkingDay: string; // The LWD date/timeline stated to this specific company
  noticePeriodStated: string;    // e.g. "Immediate", "15 Days", "30 Days", "60 Days", "90 Days"
  expectedSalary: string;        // e.g. "₹32 LPA", "$165,000"
  currentSalary?: string;
  notes: string;
  rawSnippet?: string;
  nextAction?: string;
  nextActionDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RawIngestLog {
  id: string;
  source: string;
  rawText: string;
  status: 'processed' | 'pending' | 'failed';
  parsedCompany?: string;
  providerUsed?: string;
  createdAt: string;
}

interface DatabaseSchema {
  responses: RecruiterResponse[];
  rawIngests: RawIngestLog[];
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'offertrail_db.json');

class Database {
  private data: DatabaseSchema = {
    responses: [],
    rawIngests: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        // Ensure responses array exists
        if (!Array.isArray(this.data.responses)) {
          this.data.responses = [];
        }
        if (!Array.isArray(this.data.rawIngests)) {
          this.data.rawIngests = [];
        }
      } catch (err) {
        console.error('Failed to parse database file, starting clean:', err);
        this.data = { responses: [], rawIngests: [] };
        this.save();
      }
    } else {
      // Clean database: zero dummy records
      this.data = {
        responses: [],
        rawIngests: [],
      };
      this.save();
    }
  }

  private save() {
    try {
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Database write error:', err);
    }
  }

  // --- Recruiter Responses ---
  getResponses(stage?: string, channel?: string, search?: string): RecruiterResponse[] {
    let list = [...this.data.responses];

    if (stage && stage !== 'all') {
      list = list.filter((r) => r.stage === stage);
    }

    if (channel && channel !== 'all') {
      list = list.filter((r) => r.channel === channel);
    }

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.company.toLowerCase().includes(q) ||
          r.role.toLowerCase().includes(q) ||
          r.recruiterName.toLowerCase().includes(q) ||
          r.claimedLastWorkingDay.toLowerCase().includes(q) ||
          r.noticePeriodStated.toLowerCase().includes(q) ||
          r.expectedSalary.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  getResponseById(id: string): RecruiterResponse | undefined {
    return this.data.responses.find((r) => r.id === id);
  }

  createResponse(item: Omit<RecruiterResponse, 'id' | 'createdAt' | 'updatedAt'>): RecruiterResponse {
    const now = new Date().toISOString();
    const newRecord: RecruiterResponse = {
      ...item,
      id: `resp_${crypto.randomUUID()}`,
      createdAt: now,
      updatedAt: now,
    };
    this.data.responses.unshift(newRecord);
    this.save();
    return newRecord;
  }

  updateResponse(id: string, patch: Partial<RecruiterResponse>): RecruiterResponse | null {
    const idx = this.data.responses.findIndex((r) => r.id === id);
    if (idx === -1) return null;

    const updated = {
      ...this.data.responses[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    this.data.responses[idx] = updated;
    this.save();
    return updated;
  }

  deleteResponse(id: string): boolean {
    const initialLen = this.data.responses.length;
    this.data.responses = this.data.responses.filter((r) => r.id !== id);
    if (this.data.responses.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  clearAllResponses(): void {
    this.data.responses = [];
    this.data.rawIngests = [];
    this.save();
  }

  // --- Raw Ingestion Logs ---
  addRawIngest(source: string, rawText: string, status: 'processed' | 'pending' | 'failed', parsedCompany?: string, providerUsed?: string): RawIngestLog {
    const log: RawIngestLog = {
      id: `ingest_${crypto.randomUUID()}`,
      source,
      rawText,
      status,
      parsedCompany,
      providerUsed,
      createdAt: new Date().toISOString(),
    };
    this.data.rawIngests.unshift(log);
    if (this.data.rawIngests.length > 50) {
      this.data.rawIngests = this.data.rawIngests.slice(0, 50);
    }
    this.save();
    return log;
  }

  getRawIngests(): RawIngestLog[] {
    return this.data.rawIngests.slice(0, 25);
  }
}

export const db = new Database();
