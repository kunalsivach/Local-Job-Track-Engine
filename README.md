# OfferTrail — Local Recruiter Response & Disclosed Terms Tracker

> **A minimalist, local-first workspace for active job seekers.** Tracks only employers who actually replied to you across **LinkedIn, WhatsApp Web, and Gmail**, auditing the exact terms you quoted them (**Claimed Last Working Day**, **Notice Period Promised**, and **Expected CTC**) with zero credentials and 1-click browser synchronization.

---

## 🎯 The Core Problem & Goal

Traditional job application trackers (like Simplify, Huntr, or Teal) catalog hundreds of cold, silent applications that never reply. 

When recruiters *do* reach out across multiple platforms (LinkedIn InMail, WhatsApp, Gmail threads), they ask the same high-stakes questions:
- *"What is your expected CTC?"*
- *"What is your notice period?"*
- *"What is your official last working day (LWD)?"*

Because candidates frequently negotiate and customize what timeline they give to each company (e.g. *telling Company A you can join in 15 days, but telling Company B you need 30 days*), mixing up what you claimed leads to awkward discrepancies during offer rounds or HR background checks.

**OfferTrail solves this:**
1. **Inbound-Only Focus**: Ignores cold applications. Tracks conversations only when a company responds.
2. **Disclosed Terms Ledger**: Audits your **Claimed LWD** and **Notice Period Promised** (`Immediate`, `15 Days`, `30 Days`, `60 Days`, `90 Days`) side-by-side in high-contrast tabular typography.
3. **Zero Credentials Required**: Because you already have Gmail, WhatsApp Web, and LinkedIn open in your browser, OfferTrail reads your active tabs directly via **Chrome DevTools Protocol (CDP)**. No Google App Passwords or API tokens needed for your accounts.
4. **Multi-Key Failover Pool**: Supports multiple API keys across **Gemini**, **Groq**, and **OpenAI**. If one key hits rate limits or quota caps (429), it automatically fails over to the next key.
5. **100% Local & Private**: Runs on `http://localhost:3000`. Stored in a local file on your hard drive with zero cloud subscriptions.

---

## 🖥️ UI Overview & Screens

### 1. The Pipeline Board
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  OT  OfferTrail  [Pipeline Board (5)]  [Terms Matrix]  [Sync & LLM Status]  [Sync All] │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  Direct Extraction: [Sync LinkedIn / Instahyre]  [Sync WhatsApp Web]  [Sync Gmail Tab]  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  All Active (5)  ·  Initial Outreach (1)  ·  Screening (2)  ·  Interviews (1)  ·  Offer(1)│
├────────────────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────┐ ┌─────────────────────────────┐ ┌────────────────────┐ │
│ │ Razorpay                    │ │ Stripe                      │ │ Coinbase           │ │
│ │ Staff Frontend Engineer     │ │ Senior Full Stack Engineer  │ │ Platform Engineer  │ │
│ │ Priya Sharma · LinkedIn     │ │ Alex Mercer · Gmail         │ │ Sarah J · Gmail    │ │
│ ├─────────────────────────────┤ ├─────────────────────────────┤ ├────────────────────┤ │
│ │ CLAIMED LWD   NOTICE  CTC   │ │ CLAIMED LWD   NOTICE  CTC   │ │ CLAIMED LWD NOTICE │ │
│ │ Nov 15, 2026  15 Days ₹34L  │ │ Dec 01, 2026  30 Days $165k │ │ Nov 15, 2026 15d   │ │
│ ├─────────────────────────────┤ ├─────────────────────────────┤ ├────────────────────┤ │
│ │ Next: Phone Screen on Tue   │ │ Next: System Design Round 3 │ │ Verbal Offer!      │ │
│ └─────────────────────────────┘ └─────────────────────────────┘ └────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2. Disclosed Terms Matrix ("What Did I Tell Them?")
Cross-reference your claimed dates and notice periods side-by-side before entering an interview:

| Company & Role | Channel | Claimed Last Working Day | Notice Promised | Expected CTC | Stage | Upcoming Action |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Razorpay** (Staff Frontend) | LinkedIn | `Nov 15, 2026` | `15 Days` | `₹34 LPA` | Screening | Director Screen (Tue) |
| **Stripe** (Senior Full Stack) | Gmail | `Dec 01, 2026` | `30 Days` | `$165,000` | Interviews | System Design Round |
| **Swiggy** (Lead UI Architect) | WhatsApp | `Immediate / Relieved` | `Immediate` | `₹38 LPA` | Outreach | Share portfolio links |
| **Coinbase** (Platform Engineer) | Gmail | `Nov 15, 2026` | `15 Days` | `$175,000` | Offer | Offer review call |

---

## ⚡ How It Works (Architecture)

```
┌────────────────────────────────────────────────────────────────────────┐
│             Active Google Chrome (Port 9222 Remote Debugging)          │
│                                                                        │
│  [Tab: mail.google.com]  [Tab: web.whatsapp.com]  [Tab: linkedin.com]  │
│  (Your logged-in session — zero passwords or credentials needed)       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ CDP Inspection on Port 9222
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   OfferTrail Backend (Node.js / Express)               │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                 Chrome CDP Extraction Worker                   │   │
│   │   - Connects to existing Chrome on http://localhost:9222       │   │
│   │   - Extracts unread/recruiter chat blocks from active DOMs     │   │
│   └───────────────────────────────┬────────────────────────────────┘   │
│                                   │ Raw Message Text                   │
│                                   ▼                                    │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │              Multi-Provider LLM Failover Engine                │   │
│   │   Pool: [ Gemini Key 1 ──> Gemini Key 2 ──> Groq ──> OpenAI ]  │   │
│   │   - Extracts: Company, Role, Recruiter, Channel                │   │
│   │   - Audits: Claimed Last Working Day, Notice Period, CTC       │   │
│   └───────────────────────────────┬────────────────────────────────┘   │
│                                   │ Structured Record                  │
│                                   ▼                                    │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │            Clean Local Database (data/offertrail_db.json)      │   │
│   │            (Stores records locally on your hard drive)         │   │
│   └────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ REST API
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   React 19 Dashboard (http://localhost:3000)           │
│  - 1-Click Sync Buttons: [Sync All] [LinkedIn] [WhatsApp] [Gmail]      │
│  - Pipeline Board & Disclosed Terms Matrix                             │
│  - Manual Log & Paste Modal with AI Extraction                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Prerequisites

Before running OfferTrail locally, make sure you have:
1. **[Node.js](https://nodejs.org)** (v18.0.0 or v20+) installed on your machine.
2. **Google Chrome** installed.
3. At least one **LLM API Key** (you can use free Google Gemini, Groq, or OpenAI keys), or a local **Ollama** instance.

---

## 🚀 Step-by-Step Local Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/offertrail.git
cd offertrail
```

### 2. Install Node Dependencies
```bash
npm install
```

### 3. Configure Your `.env` File
Create a `.env` file in the project root:
```bash
cp .env.example .env
```

Open `.env` and paste your LLM API keys:
```env
# Multi-Key Gemini Pool (Comma-separated for automatic failover)
GEMINI_API_KEYS="your_gemini_api_key_1,your_gemini_api_key_2"

# Optional: Ultra-fast Groq fallback
GROQ_API_KEYS="gsk_your_groq_key"

# Optional: OpenAI fallback
OPENAI_API_KEYS="sk-your_openai_key"

# Optional: Local Ollama URL
OLLAMA_URL="http://localhost:11434"

PORT=3000
```
> **Note:** You do NOT need to configure any Gmail ID, email passwords, or WhatsApp tokens in `.env`. Chrome CDP reads your active browser tabs directly.

---

### 4. Launch Chrome with Remote Debugging (Port 9222)

Close your normal Chrome browser completely, then launch it from your terminal:

**macOS:**
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --user-data-dir="/Users/$(whoami)/Library/Application Support/Google/Chrome"
```

**Linux / Ubuntu:**
```bash
google-chrome --remote-debugging-port=9222 --user-data-dir="$HOME/.config/google-chrome"
```

**Windows (PowerShell):**
```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="$env:LOCALAPPDATA\Google\Chrome\User Data"
```

Once Chrome opens, open your everyday tabs as usual:
- `https://mail.google.com` (Gmail)
- `https://web.whatsapp.com` (WhatsApp Web)
- `https://www.linkedin.com/messaging` (LinkedIn)

---

### 5. Start OfferTrail
In your project terminal, run:
```bash
npm run dev
```

You should see:
```text
OfferTrail server running on http://localhost:3000
```

---

### 6. Open the Dashboard
Navigate to **`http://localhost:3000`** in your browser.

- **Sync All Tabs**: Click the **Sync All Tabs** button in the header. OfferTrail reads the open Gmail, WhatsApp, and LinkedIn tabs, runs them through the AI failover pool, and populates your board in seconds.
- **Inspect Disclosures**: Switch to **Terms Matrix** to see all numbers and dates you quoted side-by-side.
- **Log or Paste Manually**: Click **Log Reply** anytime to enter a company manually or paste an email/chat snippet for 1-click AI auto-fill.
- **Export Data**: Click **Export CSV** in the Terms Matrix to download your records as a backup spreadsheet.

---

## 🗄️ Database & Storage

All data is stored locally in `data/offertrail_db.json`. 
- **Zero Cloud Leakage**: No data is sent to external databases or third-party tracking services.
- **Clean Reset**: To wipe your database clean at any time, click **Clear All Tracked Data** under the **Sync & LLM Status** tab, or run:
  ```bash
  curl -X POST http://localhost:3000/api/responses/clear-all
  ```

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs the full-stack server (Express backend + Vite frontend) on port 3000 |
| `npm run build` | Builds the production bundle |
| `npm run lint` | Runs TypeScript linting check (`tsc --noEmit`) |

---

## 📄 License
Apache-2.0. Built for job seekers who want clarity, control, and privacy in their interview process.
