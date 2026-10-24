#!/usr/bin/env python3
"""
OfferTrail - Master Automation Runner
Orchestrates local ingestion from Chrome CDP (LinkedIn/Instahyre), Gmail IMAP, and WhatsApp.
Can be triggered manually or run via crontab every hour.

Usage:
  python3 run_all_sync.py
"""

import subprocess
import sys
import os

SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))

def run_script(script_name, args=None):
    script_path = os.path.join(SCRIPTS_DIR, script_name)
    if not os.path.exists(script_path):
        print(f"Script not found: {script_path}")
        return
    print(f"\n---> Running {script_name}...")
    cmd = [sys.executable, script_path] + (args or [])
    try:
        subprocess.run(cmd, check=False)
    except Exception as e:
        print(f"Error executing {script_name}: {e}")

def main():
    print("=" * 60)
    print(" OfferTrail Local Automation Sync Runner")
    print("=" * 60)

    # 1. LinkedIn & Instahyre over CDP
    print("\n[1/2] Checking LinkedIn & Instahyre via Chrome CDP...")
    run_script("linkedin_playwright_cdp.py")

    # 2. Tip for Gmail and WhatsApp
    print("\n[2/2] Local check complete.")
    print("Tip: To sync Gmail, run:")
    print("  python3 scripts/gmail_imap_sync.py --email yourname@gmail.com --password 'your-app-password'")
    print("Tip: To ingest copied WhatsApp text, run:")
    print("  python3 scripts/whatsapp_sync.py --clipboard")
    print("\nAll captured responses are visible at http://localhost:3000")

if __name__ == "__main__":
    main()
