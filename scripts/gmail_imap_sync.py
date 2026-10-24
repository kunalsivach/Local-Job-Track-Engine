#!/usr/bin/env python3
"""
OfferTrail - Local Gmail IMAP Sync
Connects securely to your Gmail inbox using Python's native imaplib and an App Password.
Scans for recruiter replies, extracts compensation & notice period discussions,
and posts them directly to the local OfferTrail API.

Prerequisites:
  pip install requests
  Generate a 16-character App Password at https://myaccount.google.com/apppasswords

Usage:
  python3 gmail_imap_sync.py --email yourname@gmail.com --password "xxxx xxxx xxxx xxxx"
"""

import sys
import imaplib
import email
from email.header import decode_header
import datetime
import argparse
import requests

API_ENDPOINT = "http://localhost:3000/api/ingest/raw"

def clean_header(header_val):
    if not header_val:
        return ""
    decoded = decode_header(header_val)
    parts = []
    for part, enc in decoded:
        if isinstance(part, bytes):
            try:
                parts.append(part.decode(enc or "utf-8", errors="ignore"))
            except Exception:
                parts.append(part.decode("latin1", errors="ignore"))
        else:
            parts.append(str(part))
    return "".join(parts)

def extract_body(msg):
    body = ""
    if msg.is_multipart():
        for part in msg.walk():
            ctype = part.get_content_type()
            disp = str(part.get("Content-Disposition"))
            if ctype == "text/plain" and "attachment" not in disp:
                try:
                    payload = part.get_payload(decode=True)
                    body += payload.decode("utf-8", errors="ignore")
                except Exception:
                    pass
    else:
        try:
            body = msg.get_payload(decode=True).decode("utf-8", errors="ignore")
        except Exception:
            pass
    return body

def post_email_to_offertrail(subject, sender, date_str, body):
    raw_text = f"Platform: Gmail\nFrom: {sender}\nDate: {date_str}\nSubject: {subject}\n\n{body[:3500]}"
    try:
        res = requests.post(API_ENDPOINT, json={
            "source": "gmail",
            "rawText": raw_text,
            "metadata": {"subject": subject, "sender": sender}
        }, timeout=10)
        if res.status_code == 200:
            data = res.json()
            print(f"[GMAIL] Ingested: {data.get('response', {}).get('company')} ({data.get('response', {}).get('role')})")
            print(f"  Claimed LWD: {data.get('response', {}).get('claimedLastWorkingDay')} | Notice: {data.get('response', {}).get('noticePeriodStated')}")
        else:
            print(f"[GMAIL] API returned {res.status_code}")
    except Exception as e:
        print(f"[GMAIL] Failed to send to OfferTrail: {e}")

def main():
    parser = argparse.ArgumentParser(description="OfferTrail Gmail IMAP Sync")
    parser.add_argument("--email", required=True, help="Your Gmail address")
    parser.add_argument("--password", required=True, help="Google App Password (16 characters)")
    parser.add_argument("--days", type=int, default=3, help="Scan emails from past N days")
    args = parser.parse_args()

    print(f"Connecting to Gmail IMAP for {args.email}...")
    mail = imaplib.IMAP4_SSL("imap.gmail.com")
    try:
        mail.login(args.email, args.password.replace(" ", ""))
        mail.select("inbox")

        since_date = (datetime.date.today() - datetime.timedelta(days=args.days)).strftime("%d-%b-%Y")
        
        # Search for recruitment-related keywords
        keywords = ["interview", "recruiter", "ctc", "salary", "notice period", "last working day", "offer letter", "scheduled a call"]
        found_ids = set()

        for kw in keywords:
            status, data = mail.search(None, f'(SINCE "{since_date}" TEXT "{kw}")')
            if status == "OK" and data[0]:
                for msg_id in data[0].split():
                    found_ids.add(msg_id)

        print(f"Found {len(found_ids)} candidate recruitment emails from past {args.days} days.")

        for msg_id in list(found_ids)[:15]:
            res, msg_data = mail.fetch(msg_id, "(RFC822)")
            if res != "OK":
                continue
            for response_part in msg_data:
                if isinstance(response_part, tuple):
                    msg = email.message_from_bytes(response_part[1])
                    subject = clean_header(msg.get("Subject"))
                    sender = clean_header(msg.get("From"))
                    date_str = clean_header(msg.get("Date"))
                    body = extract_body(msg)

                    # Filter for active discussions
                    body_lower = body.lower()
                    if any(term in body_lower for term in ["notice", "ctc", "salary", "working day", "round", "interview", "scheduled"]):
                        post_email_to_offertrail(subject, sender, date_str, body)

        mail.logout()
        print("Gmail sync completed.")
    except Exception as e:
        print(f"Error during Gmail sync: {e}")

if __name__ == "__main__":
    main()
