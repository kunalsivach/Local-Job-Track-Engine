import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import dotenv from 'dotenv';
import { db } from './src/server/db.js';
import { parseRecruiterMessage, getConfiguredKeysSummary } from './src/server/ai.js';
import { checkChromeCdpStatus, extractFromOpenTabs } from './src/server/cdp.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// --- RESPONSES CRUD (Zero Auth Personal Mode) ---
app.get('/api/responses', (req, res) => {
  const { stage, channel, search } = req.query as { stage?: string; channel?: string; search?: string };
  const responses = db.getResponses(stage, channel, search);
  res.json({ responses });
});

app.get('/api/responses/:id', (req, res) => {
  const response = db.getResponseById(req.params.id);
  if (!response) return res.status(404).json({ error: 'Response not found' });
  res.json({ response });
});

app.post('/api/responses', (req, res) => {
  const {
    company,
    role,
    channel,
    recruiterName,
    recruiterContact,
    stage,
    claimedLastWorkingDay,
    noticePeriodStated,
    expectedSalary,
    currentSalary,
    notes,
    rawSnippet,
    nextAction,
    nextActionDate,
  } = req.body;

  if (!company || !role) {
    return res.status(400).json({ error: 'Company and Role are required' });
  }

  const created = db.createResponse({
    company,
    role,
    channel: channel || 'linkedin',
    recruiterName: recruiterName || 'Direct Outreach',
    recruiterContact: recruiterContact || '',
    stage: stage || 'screening',
    claimedLastWorkingDay: claimedLastWorkingDay || 'To be specified',
    noticePeriodStated: noticePeriodStated || '30 Days',
    expectedSalary: expectedSalary || 'Not specified',
    currentSalary: currentSalary || '',
    notes: notes || '',
    rawSnippet: rawSnippet || '',
    nextAction: nextAction || '',
    nextActionDate: nextActionDate || undefined,
  });

  res.status(201).json({ response: created });
});

app.patch('/api/responses/:id', (req, res) => {
  const updated = db.updateResponse(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Response not found' });
  res.json({ response: updated });
});

app.delete('/api/responses/:id', (req, res) => {
  const success = db.deleteResponse(req.params.id);
  if (!success) return res.status(404).json({ error: 'Response not found' });
  res.json({ success: true });
});

app.post('/api/responses/clear-all', (_req, res) => {
  db.clearAllResponses();
  res.json({ success: true, message: 'All response tracking records cleared' });
});

// --- CHROME CDP ONE-CLICK SYNC ENDPOINTS ---
app.get('/api/sync/status', async (_req, res) => {
  const cdpStatus = await checkChromeCdpStatus();
  const llmStatus = getConfiguredKeysSummary();
  res.json({ cdpStatus, llmStatus });
});

app.post('/api/sync/:channel?', async (req, res) => {
  const channelParam = req.params.channel || 'all';
  const filter = (['all', 'linkedin', 'whatsapp', 'gmail'].includes(channelParam)
    ? channelParam
    : 'all') as any;

  try {
    const extractedList = await extractFromOpenTabs(filter);

    if (extractedList.length === 0) {
      return res.json({
        success: true,
        count: 0,
        message: 'No active recruiter tabs detected or no new messages found in open tabs.',
        synced: [],
      });
    }

    const syncedResponses = [];

    for (const item of extractedList) {
      try {
        const parsed = await parseRecruiterMessage(item.rawText);

        // Check if an existing response exists for this company
        const existingList = db.getResponses();
        const existing = existingList.find(
          (r) => r.company.toLowerCase() === parsed.company.toLowerCase()
        );

        let saved;
        if (existing) {
          saved = db.updateResponse(existing.id, {
            claimedLastWorkingDay: parsed.claimedLastWorkingDay || existing.claimedLastWorkingDay,
            noticePeriodStated: parsed.noticePeriodStated || existing.noticePeriodStated,
            expectedSalary: parsed.expectedSalary !== 'Not specified' ? parsed.expectedSalary : existing.expectedSalary,
            currentSalary: parsed.currentSalary || existing.currentSalary,
            stage: parsed.stage || existing.stage,
            nextAction: parsed.nextAction || existing.nextAction,
            nextActionDate: parsed.nextActionDate || existing.nextActionDate,
            notes: parsed.notes ? `${existing.notes}\n[Sync Update]: ${parsed.notes}` : existing.notes,
            rawSnippet: item.rawText.slice(0, 1500),
          });
        } else {
          saved = db.createResponse({
            company: parsed.company,
            role: parsed.role,
            channel: parsed.channel || item.source,
            recruiterName: parsed.recruiterName,
            recruiterContact: item.tabTitle || '',
            stage: parsed.stage,
            claimedLastWorkingDay: parsed.claimedLastWorkingDay,
            noticePeriodStated: parsed.noticePeriodStated,
            expectedSalary: parsed.expectedSalary,
            currentSalary: parsed.currentSalary,
            notes: parsed.notes,
            rawSnippet: item.rawText.slice(0, 1500),
            nextAction: parsed.nextAction,
            nextActionDate: parsed.nextActionDate,
          });
        }

        db.addRawIngest(item.source, item.rawText.slice(0, 300), 'processed', parsed.company, parsed.providerUsed);
        if (saved) syncedResponses.push(saved);
      } catch (err: any) {
        console.error('Failed to parse item:', err);
        db.addRawIngest(item.source, item.rawText.slice(0, 300), 'failed');
      }
    }

    res.json({
      success: true,
      count: syncedResponses.length,
      synced: syncedResponses,
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'CDP Sync Failed',
      details: err?.message || 'Ensure Chrome is running with --remote-debugging-port=9222',
    });
  }
});

// --- DIRECT RAW INGESTION / CLIPBOARD API ---
app.post('/api/ingest/raw', async (req, res) => {
  const { source, rawText } = req.body;

  if (!rawText || typeof rawText !== 'string') {
    return res.status(400).json({ error: 'rawText is required' });
  }

  try {
    const parsed = await parseRecruiterMessage(rawText);

    const existingList = db.getResponses();
    const existing = existingList.find(
      (r) => r.company.toLowerCase() === parsed.company.toLowerCase()
    );

    let saved;
    if (existing) {
      saved = db.updateResponse(existing.id, {
        claimedLastWorkingDay: parsed.claimedLastWorkingDay || existing.claimedLastWorkingDay,
        noticePeriodStated: parsed.noticePeriodStated || existing.noticePeriodStated,
        expectedSalary: parsed.expectedSalary !== 'Not specified' ? parsed.expectedSalary : existing.expectedSalary,
        currentSalary: parsed.currentSalary || existing.currentSalary,
        stage: parsed.stage || existing.stage,
        nextAction: parsed.nextAction || existing.nextAction,
        nextActionDate: parsed.nextActionDate || existing.nextActionDate,
        notes: parsed.notes ? `${existing.notes}\n[Update]: ${parsed.notes}` : existing.notes,
        rawSnippet: rawText.slice(0, 1500),
      });
    } else {
      saved = db.createResponse({
        company: parsed.company,
        role: parsed.role,
        channel: parsed.channel || (source as any) || 'other',
        recruiterName: parsed.recruiterName,
        recruiterContact: '',
        stage: parsed.stage,
        claimedLastWorkingDay: parsed.claimedLastWorkingDay,
        noticePeriodStated: parsed.noticePeriodStated,
        expectedSalary: parsed.expectedSalary,
        currentSalary: parsed.currentSalary,
        notes: parsed.notes,
        rawSnippet: rawText.slice(0, 1500),
        nextAction: parsed.nextAction,
        nextActionDate: parsed.nextActionDate,
      });
    }

    db.addRawIngest(source || 'manual', rawText.slice(0, 300), 'processed', parsed.company, parsed.providerUsed);

    res.json({
      success: true,
      response: saved,
      parsed,
    });
  } catch (err: any) {
    db.addRawIngest(source || 'manual', rawText.slice(0, 300), 'failed');
    res.status(500).json({ error: 'Failed to parse text', details: err?.message });
  }
});

// --- AI PARSE PREVIEW ---
app.post('/api/ai/parse', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required' });

  try {
    const parsed = await parseRecruiterMessage(text);
    res.json({ parsed });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

// --- LLM POOL STATUS ---
app.get('/api/llm/status', (_req, res) => {
  const status = getConfiguredKeysSummary();
  res.json({ status });
});

// --- VITE MIDDLEWARE OR STATIC SERVE ---
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`OfferTrail server running on http://localhost:${PORT}`);
  });
}

startServer();
