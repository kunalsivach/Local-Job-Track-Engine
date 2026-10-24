#!/usr/bin/env python3
"""
OfferTrail - WhatsApp Chat & Clipboard Ingestion Script
Ingests exported WhatsApp .txt chat transcripts or clipboard snippet directly into OfferTrail API.

Usage:
  # Ingest from exported WhatsApp chat text file:
  python3 whatsapp_sync.py --file "_chat.txt"

  # Ingest directly from system clipboard:
  python3 whatsapp_sync.py --clipboard
"""

import sys
import argparse
import requests

API_ENDPOINT = "http://localhost:3000/api/ingest/raw"

def get_clipboard_text():
    try:
        import subprocess
        # macOS
        p = subprocess.Popen(["pbpaste"], stdout=subprocess.PIPE)
        return p.communicate()[0].decode("utf-8")
    except Exception:
        try:
            # Linux / Windows fallback via tkinter
            import tkinter as tk
            root = tk.Tk()
            root.withdraw()
            return root.clipboard_get()
        except Exception as e:
            print(f"Could not read clipboard: {e}")
            return None

def post_to_api(text: str, source: str = "whatsapp"):
    if not text or len(text.strip()) < 10:
        print("Text too short to ingest.")
        return
    print(f"Sending {len(text)} characters to OfferTrail API...")
    try:
        res = requests.post(API_ENDPOINT, json={
            "source": source,
            "rawText": text,
            "metadata": {"type": "chat_export"}
        }, timeout=10)
        if res.status_code == 200:
            data = res.json()
            resp = data.get("response", {})
            print("Successfully ingested into OfferTrail!")
            print(f"  Company: {resp.get('company')}")
            print(f"  Recruiter: {resp.get('recruiterName')}")
            print(f"  Claimed LWD: {resp.get('claimedLastWorkingDay')}")
            print(f"  Notice Period: {resp.get('noticePeriodStated')}")
            print(f"  Expected Salary: {resp.get('expectedSalary')}")
        else:
            print(f"API Error ({res.status_code}): {res.text}")
    except Exception as e:
        print(f"Request failed: {e}")

def main():
    parser = argparse.ArgumentParser(description="OfferTrail WhatsApp Ingestion")
    parser.add_argument("--file", help="Path to exported WhatsApp _chat.txt file")
    parser.add_argument("--clipboard", action="store_true", help="Ingest currently copied clipboard text")
    args = parser.parse_args()

    if args.clipboard:
        text = get_clipboard_text()
        if text:
            print("Captured clipboard content. Ingesting...")
            post_to_api(text, "whatsapp")
        else:
            print("Clipboard is empty or inaccessible.")
    elif args.file:
        try:
            with open(args.file, "r", encoding="utf-8", errors="ignore") as f:
                lines = f.readlines()
                # Get last 20 messages
                recent_lines = lines[-35:] if len(lines) > 35 else lines
                text = "".join(recent_lines)
                print(f"Read {len(recent_lines)} lines from {args.file}. Ingesting...")
                post_to_api(text, "whatsapp")
        except Exception as e:
            print(f"Failed to read file {args.file}: {e}")
    else:
        print("Please provide --clipboard or --file <path>")

if __name__ == "__main__":
    main()
