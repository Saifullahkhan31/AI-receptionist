import asyncio
import os
import httpx
from datetime import datetime, date, timedelta
from database import supabase
from dotenv import load_dotenv

load_dotenv()

META_ACCESS_TOKEN    = os.getenv("META_ACCESS_TOKEN")
META_PHONE_NUMBER_ID = os.getenv("META_PHONE_NUMBER_ID")
CLINIC_NAME          = os.getenv("CLINIC_NAME", "Smile Dental Clinic")

GRAPH_API_URL = f"https://graph.facebook.com/v19.0/{META_PHONE_NUMBER_ID}/messages"


# ─────────────────────────────────────────────────────────────────────────────
# Send a WhatsApp message (shared helper, same as in whatsapp_handler.py)
# ─────────────────────────────────────────────────────────────────────────────

async def send_whatsapp_message(to: str, text: str) -> None:
    """
    `to` — patient phone WITHOUT '+', e.g. '923001234567'
    """
    headers = {
        "Authorization": f"Bearer {META_ACCESS_TOKEN}",
        "Content-Type":  "application/json",
    }
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type":    "individual",
        "to":                to,
        "type":              "text",
        "text":              {"body": text},
    }
    async with httpx.AsyncClient() as client:
        resp = await client.post(GRAPH_API_URL, headers=headers, json=payload)
        if resp.status_code != 200:
            print(f"[Reminder] ❌ Send failed for {to}: {resp.text}")


# ─────────────────────────────────────────────────────────────────────────────
# Core reminder logic
# ─────────────────────────────────────────────────────────────────────────────

async def send_reminders() -> None:
    """
    Query Supabase for all appointments tomorrow that haven't had a reminder sent.
    Send a WhatsApp reminder to each patient via Meta API and mark reminder_sent=True.
    """
    tomorrow = date.today() + timedelta(days=1)
    tomorrow_str = tomorrow.isoformat()

    result = (
        supabase.table("appointments")
        .select("*")
        .eq("appointment_date", tomorrow_str)
        .in_("status", ["Confirmed", "Tentative Appt", "Show"])
        .eq("reminder_sent", False)
        .execute()
    )

    if not result.data:
        print("[Reminder] No pending reminders for tomorrow.")
        return

    for appt in result.data:
        # Meta expects phone without '+'; Supabase stores it with '+'
        phone = str(appt.get("contact_number", "")).lstrip("+")
        if not phone:
            continue

        try:
            time_display = appt.get("appointment_time", "12:00:00")[:5]
            # convert to 12 hr am/pm
            h, m = map(int, time_display.split(":"))
            ampm = "PM" if h >= 12 else "AM"
            h12 = h % 12 or 12
            time_display = f"{h12}:{m:02d} {ampm}"
            date_display = tomorrow.strftime("%A, %B %d")
        except Exception:
            time_display = appt.get("appointment_time")
            date_display = tomorrow.strftime("%A, %B %d")

        message = (
            f"Hi {appt['patient_name']}! 👋 Reminder from {CLINIC_NAME}: "
            f"you have a dental appointment on {date_display} at {time_display}. "
            f"Please arrive 10 minutes early. Reply CANCEL if you need to reschedule."
        )

        await send_whatsapp_message(phone, message)

        # Mark reminder as sent so we don't send duplicates
        supabase.table("appointments").update({"reminder_sent": True}).eq(
            "id", appt["id"]
        ).execute()

        print(f"[Reminder] ✅ Sent to {appt['patient_name']} ({phone}) — {date_display} {time_display}")


# ─────────────────────────────────────────────────────────────────────────────
# Background loop  (started by FastAPI lifespan)
# ─────────────────────────────────────────────────────────────────────────────

async def reminder_loop() -> None:
    """Runs forever. Checks Supabase every hour and dispatches WhatsApp reminders."""
    print("[Reminder] 🔄 Background scheduler started — checking every hour.")
    while True:
        await asyncio.sleep(3600)  # wait 1 hour between checks
        try:
            await send_reminders()
        except Exception as e:
            print(f"[Reminder] ❌ Unexpected error: {e}")
