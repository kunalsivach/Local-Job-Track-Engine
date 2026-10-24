#!/usr/bin/env python3
"""
OfferTrail - LinkedIn & Instahyre Playwright CDP Automation
Attaches to an existing Google Chrome session running with remote debugging enabled.
Extracts active recruiter conversations and streams them to OfferTrail local API.

Prerequisites:
  pip install playwright requests
  playwright install chromium (if needed)

Start Chrome with CDP before running:
  macOS:
    /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222 --user-data-dir="/Users/$(whoami)/Library/Application Support/Google/Chrome"
  Linux:
    google-chrome --remote-debugging-port=9222 --user-data-dir="$HOME/.config/google-chrome"
  Windows:
    chrome.exe --remote-debugging-port=9222 --user-data-dir="%LOCALAPPDATA%\\Google\\Chrome\\User Data"
"""

import sys
import time
import requests
from playwright.sync_api import sync_playwright

API_ENDPOINT = "http://localhost:3000/api/ingest/raw"
CDP_URL = "http://localhost:9222"

def post_to_offertrail(source: str, raw_text: str, metadata: dict = None):
    try:
        payload = {
            "source": source,
            "rawText": raw_text.strip(),
            "metadata": metadata or {}
        }
        res = requests.post(API_ENDPOINT, json=payload, timeout=10)
        if res.status_code == 200:
            data = res.json()
            print(f"[{source.upper()}] Successfully ingested:")
            print(f"  Company: {data.get('response', {}).get('company')}")
            print(f"  Claimed LWD: {data.get('response', {}).get('claimedLastWorkingDay')}")
            print(f"  Notice Period: {data.get('response', {}).get('noticePeriodStated')}")
            print(f"  Salary Quoted: {data.get('response', {}).get('expectedSalary')}")
        else:
            print(f"[{source.upper()}] Server responded with {res.status_code}: {res.text}")
    except Exception as e:
        print(f"[{source.upper()}] Failed to post to OfferTrail API: {e}")

def scrape_linkedin(page):
    print("Navigating or inspecting LinkedIn Messaging...")
    if "linkedin.com/messaging" not in page.url:
        page.goto("https://www.linkedin.com/messaging/", wait_until="domcontentloaded")
        time.sleep(3)

    # Find conversation list items
    conv_items = page.locator(".msg-conversation-listitem, .msg-conversation-card").all()
    print(f"Found {len(conv_items)} conversations on LinkedIn.")

    # Scrape the top 5 most recent conversations
    for i, item in enumerate(conv_items[:5]):
        try:
            item.click()
            time.sleep(1.5)
            
            # Recruiter name / title
            header_el = page.locator(".msg-title-bar__title, .msg-entity-lockup__entity-title").first
            recruiter_name = header_el.inner_text().strip() if header_el.count() > 0 else "LinkedIn Recruiter"
            
            # Conversation message bubbles
            messages = page.locator(".msg-s-event-listitem__body, .msg-s-message-list-content").all()
            if not messages:
                continue

            full_convo = []
            for msg in messages[-6:]:  # grab last 6 messages
                txt = msg.inner_text().strip()
                if txt:
                    full_convo.append(txt)

            if full_convo:
                convo_text = f"Platform: LinkedIn\nContact: {recruiter_name}\n\n" + "\n---\n".join(full_convo)
                print(f"Ingesting LinkedIn conversation with {recruiter_name}...")
                post_to_offertrail("linkedin", convo_text, {"recruiter": recruiter_name})

        except Exception as err:
            print(f"Error reading conversation {i}: {err}")

def scrape_instahyre(page):
    print("Checking Instahyre candidate inbox...")
    try:
        page.goto("https://www.instahyre.com/candidate/messages", wait_until="domcontentloaded")
        time.sleep(3)
        threads = page.locator(".opportunity-item, .message-thread-item").all()
        print(f"Found {len(threads)} Instahyre opportunities.")
        for thread in threads[:4]:
            text = thread.inner_text().strip()
            if text and ("notice" in text.lower() or "ctc" in text.lower() or "salary" in text.lower() or "joining" in text.lower() or "working day" in text.lower()):
                post_to_offertrail("instahyre", f"Platform: Instahyre\n\n{text}")
    except Exception as e:
        print(f"Instahyre check skipped or failed: {e}")

def main():
    print("=" * 60)
    print(" OfferTrail Local CDP Automation Engine")
    print("=" * 60)
    print(f"Connecting to Chrome on {CDP_URL}...")

    with sync_playwright() as p:
        try:
            browser = p.chromium.connect_over_cdp(CDP_URL)
            context = browser.contexts[0] if browser.contexts else browser.new_context()
            page = context.new_page()

            scrape_linkedin(page)
            # scrape_instahyre(page)

            page.close()
            print("\nLinkedIn sync finished.")
        except Exception as e:
            print(f"\nCould not connect to Chrome on {CDP_URL}.")
            print("Make sure Chrome was started with --remote-debugging-port=9222.")
            print(f"Detail: {e}")

if __name__ == "__main__":
    main()
