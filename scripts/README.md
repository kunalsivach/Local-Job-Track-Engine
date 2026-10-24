# OfferTrail Local Automation Scripts

These Python scripts let you automatically extract recruiter replies from your active browser session and local desktop applications, bypassing closed cloud APIs and zero-bot restrictions.

## 1. Quick Setup

```bash
pip install playwright requests
```

## 2. Launch Chrome with Remote Debugging (Port 9222)

Close your normal Chrome browser completely, then launch it from your terminal:

**macOS:**
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --user-data-dir="/Users/$(whoami)/Library/Application Support/Google/Chrome"
```

**Linux:**
```bash
google-chrome --remote-debugging-port=9222 --user-data-dir="$HOME/.config/google-chrome"
```

**Windows:**
```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="$env:LOCALAPPDATA\Google\Chrome\User Data"
```

## 3. Run the Automations

- **LinkedIn & Instahyre (Playwright over CDP):**
  ```bash
  python3 scripts/linkedin_playwright_cdp.py
  ```
- **Gmail IMAP (Last 24h recruiter emails):**
  ```bash
  python3 scripts/gmail_imap_sync.py --email your@gmail.com --password "16-char-app-password"
  ```
- **WhatsApp (Clipboard snippet or chat export):**
  ```bash
  python3 scripts/whatsapp_sync.py --clipboard
  ```

Extracted responses and terms (Claimed LWD, Notice Period, Salary) will immediately appear on your local dashboard at `http://localhost:3000`.
