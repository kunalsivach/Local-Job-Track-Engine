/**
 * OfferTrail - Native Chrome DevTools Protocol (CDP) Multi-Tab Extractor
 * Connects directly to Google Chrome running with --remote-debugging-port=9222.
 * Inspects open tabs: Gmail, WhatsApp Web, LinkedIn, Instahyre.
 * Uses native Node WebSocket to execute DOM evaluation without external binaries.
 */

export interface OpenTab {
  id: string;
  title: string;
  url: string;
  type: string;
  webSocketDebuggerUrl?: string;
}

export interface ExtractedTabContent {
  source: 'linkedin' | 'instahyre' | 'email' | 'whatsapp';
  tabTitle: string;
  tabUrl: string;
  rawText: string;
}

const CDP_HOST = process.env.CHROME_CDP_URL || 'http://localhost:9222';

export async function checkChromeCdpStatus(): Promise<{
  connected: boolean;
  tabs: Array<{ title: string; url: string; platform: string }>;
  error?: string;
}> {
  try {
    const res = await fetch(`${CDP_HOST}/json/list`, { signal: AbortSignal.timeout(1500) });
    if (!res.ok) {
      return { connected: false, tabs: [], error: `HTTP ${res.status} from CDP` };
    }
    const rawTabs: OpenTab[] = await res.json();
    const candidateTabs = rawTabs
      .filter((t) => t.type === 'page' && t.webSocketDebuggerUrl)
      .map((t) => {
        let platform = 'Other';
        if (t.url.includes('mail.google.com')) platform = 'Gmail';
        else if (t.url.includes('web.whatsapp.com')) platform = 'WhatsApp Web';
        else if (t.url.includes('linkedin.com')) platform = 'LinkedIn';
        else if (t.url.includes('instahyre.com')) platform = 'Instahyre';

        return {
          title: t.title,
          url: t.url,
          platform,
        };
      });

    return { connected: true, tabs: candidateTabs };
  } catch (err: any) {
    return {
      connected: false,
      tabs: [],
      error: `Could not reach Chrome on ${CDP_HOST}. Start Chrome with --remote-debugging-port=9222.`,
    };
  }
}

/**
 * Evaluates JavaScript inside a Chrome tab using native WebSocket CDP
 */
function evaluateInTab(wsUrl: string, expression: string, timeoutMs = 4000): Promise<string> {
  return new Promise((resolve, reject) => {
    let ws: any;
    let timer: NodeJS.Timeout;

    try {
      // In Node 22, WebSocket is globally available
      const WebSocketClass = (globalThis as any).WebSocket;
      if (!WebSocketClass) {
        return reject(new Error('Native WebSocket not supported in this Node environment'));
      }

      ws = new WebSocketClass(wsUrl);

      timer = setTimeout(() => {
        try {
          ws.close();
        } catch {}
        reject(new Error('CDP evaluation timed out'));
      }, timeoutMs);

      ws.onopen = () => {
        const msg = JSON.stringify({
          id: 1,
          method: 'Runtime.evaluate',
          params: {
            expression,
            returnByValue: true,
          },
        });
        ws.send(msg);
      };

      ws.onmessage = (event: any) => {
        try {
          const data = JSON.parse(event.data);
          if (data.id === 1) {
            clearTimeout(timer);
            ws.close();
            const value = data.result?.result?.value;
            resolve(typeof value === 'string' ? value : JSON.stringify(value || ''));
          }
        } catch (e) {
          clearTimeout(timer);
          ws.close();
          reject(e);
        }
      };

      ws.onerror = (err: any) => {
        clearTimeout(timer);
        reject(err);
      };
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Extracts conversation text from all relevant open tabs
 */
export async function extractFromOpenTabs(targetFilter?: 'all' | 'linkedin' | 'whatsapp' | 'gmail'): Promise<ExtractedTabContent[]> {
  const res = await fetch(`${CDP_HOST}/json/list`, { signal: AbortSignal.timeout(2000) });
  if (!res.ok) throw new Error('Failed to query Chrome tabs');

  const rawTabs: OpenTab[] = await res.json();
  const pages = rawTabs.filter((t) => t.type === 'page' && t.webSocketDebuggerUrl);

  const results: ExtractedTabContent[] = [];

  for (const tab of pages) {
    if (!tab.webSocketDebuggerUrl) continue;

    let source: ExtractedTabContent['source'] | null = null;
    let scriptToRun = '';

    if (tab.url.includes('linkedin.com/messaging') || tab.url.includes('linkedin.com')) {
      if (targetFilter && targetFilter !== 'all' && targetFilter !== 'linkedin') continue;
      source = 'linkedin';
      // Extract active conversation panel or recent messages
      scriptToRun = `
        (() => {
          const msgs = Array.from(document.querySelectorAll('.msg-s-event-listitem__body, .msg-s-message-list-content, .msg-conversation-card'));
          const title = document.querySelector('.msg-title-bar__title, .msg-entity-lockup__entity-title')?.innerText || '';
          const body = msgs.slice(-8).map(m => m.innerText.trim()).filter(Boolean).join('\\n---\\n');
          return title ? 'Contact: ' + title + '\\n\\n' + body : document.body.innerText.slice(0, 3000);
        })()
      `;
    } else if (tab.url.includes('web.whatsapp.com')) {
      if (targetFilter && targetFilter !== 'all' && targetFilter !== 'whatsapp') continue;
      source = 'whatsapp';
      // Extract active chat text bubbles
      scriptToRun = `
        (() => {
          const chatHeader = document.querySelector('header span[title]')?.getAttribute('title') || '';
          const messageElements = Array.from(document.querySelectorAll('.message-in, .message-out, div[data-pre-plain-text]'));
          const messages = messageElements.slice(-10).map(el => el.innerText.trim()).filter(Boolean).join('\\n');
          return chatHeader ? 'Chat with: ' + chatHeader + '\\n\\n' + messages : document.body.innerText.slice(0, 3000);
        })()
      `;
    } else if (tab.url.includes('mail.google.com')) {
      if (targetFilter && targetFilter !== 'all' && targetFilter !== 'gmail') continue;
      source = 'email';
      // Extract visible email thread subject and body
      scriptToRun = `
        (() => {
          const subject = document.querySelector('h2.hP')?.innerText || document.title;
          const bodies = Array.from(document.querySelectorAll('.a3s.aiL, .ii.gt, .adn.ads'));
          const threadText = bodies.slice(-4).map(b => b.innerText.trim()).filter(Boolean).join('\\n---\\n');
          return 'Subject: ' + subject + '\\n\\n' + (threadText || document.body.innerText.slice(0, 3000));
        })()
      `;
    } else if (tab.url.includes('instahyre.com')) {
      if (targetFilter && targetFilter !== 'all' && targetFilter !== 'linkedin') continue;
      source = 'instahyre';
      scriptToRun = `document.body.innerText.slice(0, 3000);`;
    }

    if (source && scriptToRun) {
      try {
        const text = await evaluateInTab(tab.webSocketDebuggerUrl, scriptToRun);
        if (text && text.trim().length > 25) {
          results.push({
            source,
            tabTitle: tab.title,
            tabUrl: tab.url,
            rawText: text.trim(),
          });
        }
      } catch (err: any) {
        console.warn(`[CDP] Failed to evaluate in tab "${tab.title}":`, err?.message || err);
      }
    }
  }

  return results;
}
