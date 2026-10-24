# OfferTrail — Local Recruiter Response & Disclosed Terms Tracker

A purely local, zero-auth personal dashboard for tracking active recruiter dialogues. Features one-click UI sync buttons that read directly from your open Chrome browser tabs (**Gmail, WhatsApp Web, LinkedIn, and Instahyre** via Chrome DevTools Protocol on port 9222) with **zero passwords or credentials required**, a multi-key multi-provider AI failover pool (**Gemini, OpenAI, Groq, and Ollama**), and a clean database with no dummy records.

## User Review & Critical Decisions

> [!IMPORTANT]
> **Confirmed Architecture & Workflow Decisions**:
> 1. **Zero Passwords / No Credentials Needed in `.env`**:
>    - Because you keep **Gmail**, **WhatsApp Web**, and **LinkedIn** open in your Chrome browser, the local Chrome CDP worker reads them directly from your active browser tabs (`mail.google.com`, `web.whatsapp.com`, `linkedin.com/messaging`).
>    - **No Gmail email ID or App Password required** in `.env`.
> 2. **Multi-Key Multi-Provider LLM Failover Pool**:
>    - In your `.env` file, you can specify multiple keys across **Gemini**, **OpenAI**, and **Groq**:
>      ```env
>      # Multiple keys separated by commas or newlines
>      GEMINI_API_KEYS="AIzaSy...,AIzaSy..."
>      OPENAI_API_KEYS="sk-...,sk-..."
>      GROQ_API_KEYS="gsk_...,gsk_..."
>      ```
>    - If any key hits a rate limit, quota exhaustion (429), or error, the backend automatically catches the failure and immediately fails over to the next key or provider in the pool. Local Ollama is also available as an offline fallback.
> 3. **1-Click Sync Buttons in UI**:
>    - Direct buttons in the top navigation:
>      - `Sync All Open Tabs`
>      - `Sync LinkedIn`
>      - `Sync WhatsApp Web`
>      - `Sync Gmail Tab`
>    - Displays live progress and updates the board immediately.
> 4. **Clean Database (No Dummy Records)**:
>    - The database starts completely clean. Zero mock/seeded entries. It populates strictly from your actual recruiter messages or manual input.
> 5. **Zero Authentication / Single-User Personal Mode**:
>    - Removed all login screens, tokens, and registration modals. The app loads directly to your tracker.
> 6. **Disclosed Terms Tracking**:
>    - Explicit tracking of **Claimed Last Working Day (LWD)**, **Promised Notice Period** (`Immediate`, `15 Days`, `30 Days`, `60 Days`, `90 Days`), and **Expected CTC**.

---

## 1. Overview & Data Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│             Active Google Chrome (Port 9222 Remote Debugging)          │
│                                                                        │
│  [Tab: mail.google.com]  [Tab: web.whatsapp.com]  [Tab: linkedin.com]  │
│  (Already logged into your accounts — zero credentials needed)         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ CDP Inspection on Port 9222
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 Express Backend Local Process (server.ts)              │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                 Chrome CDP Extraction Worker                   │   │
│   │   - Connects to existing Chrome on http://localhost:9222       │   │
│   │   - Scans active recruiter message DOMs across open tabs       │   │
│   └───────────────────────────────┬────────────────────────────────┘   │
│                                   │ Raw Message Text                   │
│                                   ▼                                    │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │              Multi-Provider LLM Failover Engine                │   │
│   │   Pool: [ Gemini Key 1 ──> Gemini Key 2 ──> Groq ──> OpenAI ]  │   │
│   │   - Extracts Company, Recruiter, Role, Channel                 │   │
│   │   - Audits: Claimed Last Working Day, Notice Period, CTC       │   │
│   └───────────────────────────────┬────────────────────────────────┘   │
│                                   │ Structured Record                  │
│                                   ▼                                    │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                Clean Local Database (data/db.json)             │   │
│   │                (Starts completely empty)                       │   │
│   └────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ REST API
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   React 19 Personal UI (Zero-Auth)                     │
│  - 1-Click Sync Buttons: [Sync All] [LinkedIn] [WhatsApp] [Gmail]      │
│  - Pipeline Board & Disclosed Terms Matrix                             │
│  - Manual Log / Screenshot Drop Modal with AI Extraction               │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Multi-Key Failover Engine

The backend maintains an active priority queue of configured API keys:
1. **Primary Pool**: All configured `GEMINI_API_KEYS` (e.g., Key A, Key B).
2. **Secondary Pool**: All configured `GROQ_API_KEYS` (e.g. `llama-3.3-70b-versatile`, ultra-fast inference).
3. **Tertiary Pool**: All configured `OPENAI_API_KEYS` (e.g. `gpt-4o-mini`).
4. **Local Fallback**: Local Ollama if running.

When extracting terms from a recruiter message:
- The engine tries the first available key.
- If a `429 (Too Many Requests)`, `quota exceeded`, or network error occurs, it marks the key as temporarily cool-down and immediately retries the prompt with the next key in line.
- The UI displays which provider and key index successfully processed the request.

---

## 3. User Experience & Visual Design

### High-Contrast Monochrome Aesthetic
- Pure blacks `#09090B`, clean whites `#FFFFFF`, and neutral hairlines `#E4E4E7`.
- Monospace tabular figures (`tabular-nums`) for currency amounts, notice days, and claimed dates.
- Zero-pill unboxed metadata separated by middots (`·`).

### Key Views
1. **Pipeline Board**:
   - Header with active dialogue count and **1-Click Sync Buttons**:
     - `Sync All Tabs` (with live spinner)
     - `Sync LinkedIn & Instahyre`
     - `Sync WhatsApp Web`
     - `Sync Gmail`
   - Stage columns: `All Active`, `Initial Outreach`, `Screening`, `Interviews`, `Offer`, `Archived`.
   - Cards display Company, Role, Recruiter, and prominent **Claimed LWD**, **Notice Period**, and **Expected CTC**.
2. **Disclosed Terms Comparison Matrix ("What Did I Tell Them?")**:
   - Dedicated side-by-side table comparing all employers and claims.
   - One-click CSV export.
3. **Log & Edit Modal**:
   - For fast manual entry or pasting conversation snippets with AI auto-fill.
4. **Key Pool & Sync Monitor Drawer**:
   - Live status of Chrome CDP port 9222.
   - Status of your LLM keys (active, rate-limited, cooling down).
   - Button to clear all records anytime.

---

## 4. Technical Architecture & Endpoints

### Configuration (`.env`)
```env
# Multi-key LLM failover pool (comma-separated)
GEMINI_API_KEYS="your_gemini_key_1,your_gemini_key_2"
GROQ_API_KEYS="gsk_key_1,gsk_key_2"
OPENAI_API_KEYS="sk-key_1"
```

### Backend Endpoints (`server.ts`)
- `POST /api/sync/all`: Attaches to Chrome via CDP, scans all open Gmail, WhatsApp Web, LinkedIn, and Instahyre tabs, parses new messages, and saves responses.
- `POST /api/sync/linkedin`: Scans open LinkedIn & Instahyre tabs.
- `POST /api/sync/whatsapp`: Scans open `web.whatsapp.com` tab.
- `POST /api/sync/gmail`: Scans open `mail.google.com` tab.
- `GET /api/sync/status`: Checks if Chrome on port 9222 is alive and lists open tabs.
- `GET /api/llm/keys`: Reports active keys and pool health across Gemini, Groq, and OpenAI.
- `GET /api/responses`: Returns all responses (starts empty).
- `POST /api/responses`: Creates response.
- `PATCH /api/responses/:id`: Updates response.
- `DELETE /api/responses/:id`: Deletes response.
- `POST /api/responses/clear-all`: Clears all data.
