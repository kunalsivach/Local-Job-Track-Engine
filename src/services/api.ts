import { RecruiterResponse } from '../types.js';

export interface SyncStatus {
  cdpStatus: {
    connected: boolean;
    tabs: Array<{ title: string; url: string; platform: string }>;
    error?: string;
  };
  llmStatus: {
    geminiCount: number;
    groqCount: number;
    openAiCount: number;
    totalKeys: number;
    ollamaConfigured: boolean;
  };
}

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      },
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(errBody.error || `HTTP ${res.status}`);
    }

    return res.json();
  }

  // --- Responses (Zero Auth) ---
  async getResponses(stage?: string, channel?: string, search?: string): Promise<RecruiterResponse[]> {
    const params = new URLSearchParams();
    if (stage && stage !== 'all') params.set('stage', stage);
    if (channel && channel !== 'all') params.set('channel', channel);
    if (search && search.trim()) params.set('search', search.trim());

    const query = params.toString() ? `?${params.toString()}` : '';
    const data = await this.request<{ responses: RecruiterResponse[] }>(`/api/responses${query}`);
    return data.responses;
  }

  async createResponse(data: Partial<RecruiterResponse>): Promise<RecruiterResponse> {
    const res = await this.request<{ response: RecruiterResponse }>('/api/responses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.response;
  }

  async updateResponse(id: string, patch: Partial<RecruiterResponse>): Promise<RecruiterResponse> {
    const res = await this.request<{ response: RecruiterResponse }>(`/api/responses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    return res.response;
  }

  async deleteResponse(id: string): Promise<void> {
    await this.request<{ success: boolean }>(`/api/responses/${id}`, {
      method: 'DELETE',
    });
  }

  async clearAllResponses(): Promise<void> {
    await this.request<{ success: boolean }>('/api/responses/clear-all', {
      method: 'POST',
    });
  }

  // --- 1-Click Sync Controls (Direct Chrome CDP Extraction) ---
  async syncAllTabs(): Promise<{ count: number; synced: RecruiterResponse[]; message?: string }> {
    return this.request<{ count: number; synced: RecruiterResponse[]; message?: string }>('/api/sync/all', {
      method: 'POST',
    });
  }

  async syncChannel(channel: 'linkedin' | 'whatsapp' | 'gmail'): Promise<{ count: number; synced: RecruiterResponse[]; message?: string }> {
    return this.request<{ count: number; synced: RecruiterResponse[]; message?: string }>(`/api/sync/${channel}`, {
      method: 'POST',
    });
  }

  async getSyncStatus(): Promise<SyncStatus> {
    return this.request<SyncStatus>('/api/sync/status');
  }

  // --- AI Parsing & Testing ---
  async ingestRawText(source: string, rawText: string): Promise<{ response: RecruiterResponse; parsed: any }> {
    return this.request<{ response: RecruiterResponse; parsed: any }>('/api/ingest/raw', {
      method: 'POST',
      body: JSON.stringify({ source, rawText }),
    });
  }

  async parseTextPreview(text: string): Promise<any> {
    const res = await this.request<{ parsed: any }>('/api/ai/parse', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
    return res.parsed;
  }
}

export const api = new ApiService();
