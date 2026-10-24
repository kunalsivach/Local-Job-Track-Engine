import { GoogleGenAI } from '@google/genai';

export interface ParsedRecruiterData {
  company: string;
  role: string;
  recruiterName: string;
  channel: 'linkedin' | 'instahyre' | 'email' | 'whatsapp' | 'phone' | 'other';
  claimedLastWorkingDay: string;
  noticePeriodStated: string;
  expectedSalary: string;
  currentSalary?: string;
  stage: 'initial_outreach' | 'screening' | 'interviews' | 'offer' | 'archived';
  notes: string;
  nextAction?: string;
  nextActionDate?: string;
  providerUsed?: string;
}

const SYSTEM_PROMPT = `You are an expert AI parser for job seeker communications.
Your job is to read raw conversations, recruiter emails, or chat threads (from LinkedIn, WhatsApp, Instahyre, Gmail) and extract exactly what terms the candidate disclosed to the recruiter.

Pay exceptional attention to:
1. "claimedLastWorkingDay": The exact last working day (LWD) or date the candidate claimed to this recruiter (e.g., "Nov 15, 2026", "Dec 01, 2026", "Immediate / Already Serving Notice", "In 15 days"). Candidates often give different dates to different companies, so extract what was actually stated or promised.
2. "noticePeriodStated": Categorize or state the promised notice period (e.g., "Immediate", "15 Days", "30 Days", "60 Days", "90 Days").
3. "expectedSalary": Expected compensation or CTC (e.g. "₹32 LPA", "$165k", "150k USD").
4. "currentSalary": Current compensation if mentioned.
5. "company": Company name.
6. "role": Job title.
7. "recruiterName": Name of the recruiter or sender.
8. "channel": One of: 'linkedin', 'instahyre', 'email', 'whatsapp', 'phone', 'other'.
9. "stage": One of: 'initial_outreach', 'screening', 'interviews', 'offer', 'archived'.
10. "nextAction": Any upcoming scheduled call, next round, or action.
11. "nextActionDate": ISO date if a date/time is mentioned.
12. "notes": Brief 1-2 sentence executive summary of what was agreed.

Return strictly valid JSON matching this schema:
{
  "company": string,
  "role": string,
  "recruiterName": string,
  "channel": "linkedin" | "instahyre" | "email" | "whatsapp" | "phone" | "other",
  "claimedLastWorkingDay": string,
  "noticePeriodStated": string,
  "expectedSalary": string,
  "currentSalary": string,
  "stage": "initial_outreach" | "screening" | "interviews" | "offer" | "archived",
  "notes": string,
  "nextAction": string,
  "nextActionDate": string
}`;

function parseKeyList(envVal?: string): string[] {
  if (!envVal) return [];
  return envVal
    .split(/[,\n]/)
    .map((k) => k.trim())
    .filter((k) => k.length > 5 && !k.startsWith('MY_'));
}

export function getConfiguredKeysSummary() {
  const geminiKeys = [
    ...parseKeyList(process.env.GEMINI_API_KEYS),
    ...(process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.startsWith('MY_')
      ? [process.env.GEMINI_API_KEY]
      : []),
  ];
  const groqKeys = parseKeyList(process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY);
  const openAiKeys = parseKeyList(process.env.OPENAI_API_KEYS || process.env.OPENAI_API_KEY);

  return {
    geminiCount: Array.from(new Set(geminiKeys)).length,
    groqCount: Array.from(new Set(groqKeys)).length,
    openAiCount: Array.from(new Set(openAiKeys)).length,
    totalKeys:
      Array.from(new Set(geminiKeys)).length +
      Array.from(new Set(groqKeys)).length +
      Array.from(new Set(openAiKeys)).length,
    ollamaConfigured: Boolean(process.env.OLLAMA_URL || true),
  };
}

export async function parseRecruiterMessage(rawText: string): Promise<ParsedRecruiterData> {
  const geminiKeys = Array.from(
    new Set([
      ...parseKeyList(process.env.GEMINI_API_KEYS),
      ...(process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.startsWith('MY_')
        ? [process.env.GEMINI_API_KEY]
        : []),
    ])
  );

  const groqKeys = Array.from(
    new Set(parseKeyList(process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY))
  );

  const openAiKeys = Array.from(
    new Set(parseKeyList(process.env.OPENAI_API_KEYS || process.env.OPENAI_API_KEY))
  );

  // 1. Try Gemini Keys in pool
  for (let i = 0; i < geminiKeys.length; i++) {
    const key = geminiKeys[i];
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `${SYSTEM_PROMPT}\n\nHere is the raw conversation or email:\n\n${rawText}`,
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        const normalized = normalizeParsedData(parsed, rawText);
        normalized.providerUsed = `Gemini (Key #${i + 1})`;
        return normalized;
      }
    } catch (err: any) {
      console.warn(`[LLM Pool] Gemini key #${i + 1} failed (${err?.message || err}). Trying next key...`);
    }
  }

  // 2. Try Groq Keys in pool
  for (let i = 0; i < groqKeys.length; i++) {
    const key = groqKeys[i];
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: rawText },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          const normalized = normalizeParsedData(parsed, rawText);
          normalized.providerUsed = `Groq (Key #${i + 1})`;
          return normalized;
        }
      } else {
        console.warn(`[LLM Pool] Groq key #${i + 1} HTTP ${res.status}. Trying next key...`);
      }
    } catch (err: any) {
      console.warn(`[LLM Pool] Groq key #${i + 1} failed (${err?.message}). Trying next key...`);
    }
  }

  // 3. Try OpenAI Keys in pool
  for (let i = 0; i < openAiKeys.length; i++) {
    const key = openAiKeys[i];
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: rawText },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          const normalized = normalizeParsedData(parsed, rawText);
          normalized.providerUsed = `OpenAI (Key #${i + 1})`;
          return normalized;
        }
      }
    } catch (err: any) {
      console.warn(`[LLM Pool] OpenAI key #${i + 1} failed. Trying next key...`);
    }
  }

  // 4. Try Local Ollama if running
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  const ollamaModel = process.env.OLLAMA_MODEL || 'qwen2.5-coder:7b';
  try {
    const res = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ollamaModel,
        system: SYSTEM_PROMPT,
        prompt: `Extract structured recruiter tracking data from this message:\n\n${rawText}`,
        stream: false,
        format: 'json',
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.response) {
        const parsed = JSON.parse(data.response);
        const normalized = normalizeParsedData(parsed, rawText);
        normalized.providerUsed = `Local Ollama (${ollamaModel})`;
        return normalized;
      }
    }
  } catch (err) {
    // Ollama not reachable
  }

  // 5. Ultimate Fallback: Rule-based Heuristic Parser (Zero crash guarantee)
  const heuristic = heuristicParse(rawText);
  heuristic.providerUsed = 'Heuristic Local Parser';
  return heuristic;
}

function normalizeParsedData(raw: any, originalText: string): ParsedRecruiterData {
  return {
    company: raw.company || 'Unknown Company',
    role: raw.role || 'Software Engineer',
    recruiterName: raw.recruiterName || 'Recruiter Contact',
    channel: (['linkedin', 'instahyre', 'email', 'whatsapp', 'phone'].includes(raw.channel)
      ? raw.channel
      : 'other') as any,
    claimedLastWorkingDay: raw.claimedLastWorkingDay || 'To be specified',
    noticePeriodStated: raw.noticePeriodStated || '30 Days',
    expectedSalary: raw.expectedSalary || 'Not specified',
    currentSalary: raw.currentSalary || '',
    stage: (['initial_outreach', 'screening', 'interviews', 'offer', 'archived'].includes(raw.stage)
      ? raw.stage
      : 'screening') as any,
    notes: raw.notes || originalText.slice(0, 140),
    nextAction: raw.nextAction || 'Follow up with recruiter',
    nextActionDate: raw.nextActionDate || undefined,
  };
}

function heuristicParse(text: string): ParsedRecruiterData {
  const t = text.toLowerCase();

  let channel: ParsedRecruiterData['channel'] = 'other';
  if (t.includes('linkedin') || t.includes('inmail')) channel = 'linkedin';
  else if (t.includes('instahyre')) channel = 'instahyre';
  else if (t.includes('whatsapp') || t.includes('wa.me') || t.includes('status: online')) channel = 'whatsapp';
  else if (t.includes('gmail') || t.includes('from:') || t.includes('subject:')) channel = 'email';

  let notice = '30 Days';
  if (t.includes('immediate') || t.includes('already relieved')) notice = 'Immediate';
  else if (t.includes('15 day') || t.includes('15-day') || t.includes('2 week')) notice = '15 Days';
  else if (t.includes('60 day') || t.includes('2 month')) notice = '60 Days';
  else if (t.includes('90 day') || t.includes('3 month')) notice = '90 Days';

  let lwd = 'Nov 15, 2026';
  const lwdMatch = text.match(/(?:lwd|last working day|relieving|serving notice)[:\s]+([^\n,\.]+)/i);
  if (lwdMatch && lwdMatch[1]) {
    lwd = lwdMatch[1].trim();
  } else if (notice === 'Immediate') {
    lwd = 'Immediate / Already Relieved';
  }

  let salary = 'Not disclosed';
  const ctcMatch = text.match(/(?:expected ctc|expected salary|ctc|salary|package)[:\s]+([^\n,\.]+)/i);
  if (ctcMatch && ctcMatch[1]) {
    salary = ctcMatch[1].trim();
  }

  let company = 'Target Company';
  const compMatch = text.match(/(?:at|company|team at|opportunity at)\s+([A-Z][a-zA-Z0-9]+)/);
  if (compMatch && compMatch[1]) {
    company = compMatch[1];
  }

  return {
    company,
    role: 'Senior Engineer',
    recruiterName: 'Recruiter Contact',
    channel,
    claimedLastWorkingDay: lwd,
    noticePeriodStated: notice,
    expectedSalary: salary,
    stage: 'screening',
    notes: text.slice(0, 120),
    nextAction: 'Confirm interview availability',
  };
}
