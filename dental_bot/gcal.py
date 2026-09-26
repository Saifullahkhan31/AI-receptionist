"""
gcal.py — Google Calendar Integration
======================================
Public functions:
  - get_open_slots()   → returns up to 10 free 1-hour slot strings
  - create_booking()   → atomically reserves slot in Supabase + creates GCal event
                         returns "success", "slot_taken", or "error"
  - cancel_booking()   → deletes a matching Calendar event + Supabase row
"""

import os
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# ─────────────────────────────────────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────────────────────────────────────

SCOPES = ["https://www.googleapis.com/auth/calendar"]
CALENDAR_ID = "primary"
TIMEZONE_STR = os.getenv("TIMEZONE", "Asia/Karachi")
TZ = ZoneInfo(TIMEZONE_STR)

# Paths — same folder as this file
_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TOKEN_PATH = os.path.join(_BASE_DIR, "token.json")
CREDS_PATH = os.path.join(_BASE_DIR, "credentials.json")

# Clinic hours (inclusive start, exclusive end)
CLINIC_START_HOUR = 18  # 6 pm (18:00)
CLINIC_END_HOUR   = 22  # 10 pm (22:00)
SLOT_DURATION_MINUTES = 45  # 45-minute slots back-to-back with no gap


# ─────────────────────────────────────────────────────────────────────────────
# Internal: build / refresh the Calendar service
# ─────────────────────────────────────────────────────────────────────────────

_SERVICE_CACHE = None

def _get_service():
    """Load credentials from token.json or GOOGLE_TOKEN_JSON env var, refresh if expired, return service."""
    global _SERVICE_CACHE
    import json as _json
    creds = None

    # 1. Try loading from file (local dev) if file exists and is non-empty
    if os.path.exists(TOKEN_PATH) and os.path.getsize(TOKEN_PATH) > 0:
        try:
            creds = Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES)
        except Exception as e:
            print(f"[GCal] Warning: Failed to load local token.json: {e}")

    # 2. Fall back to environment variable (Render / cloud deployment)
    if not creds:
        token_env = os.getenv("GOOGLE_TOKEN_JSON", "").strip()
        if token_env:
            try:
                token_data = _json.loads(token_env)
                creds = Credentials.from_authorized_user_info(token_data, SCOPES)
            except Exception as e:
                raise RuntimeError(
                    f"GOOGLE_TOKEN_JSON environment variable on Render is invalid JSON: {e}"
                ) from e

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
                # Write refreshed token back to file if possible
                try:
                    with open(TOKEN_PATH, "w") as f:
                        f.write(creds.to_json())
                except Exception:
                    pass  # On Render, disk may be read-only — that's OK
            except Exception as refresh_err:
                print(f"[GCal] Refresh token failed: {refresh_err}")
                creds = None

        if not creds or not creds.valid:
            # Cannot run browser-based auth on a cloud server
            raise RuntimeError(
                "Google Calendar token has expired or been revoked. "
                "Please run 'python run_auth.py' locally to generate a fresh token.json, "
                "then copy its contents into GOOGLE_TOKEN_JSON on Render."
            )
        _SERVICE_CACHE = None

    if _SERVICE_CACHE is None:
        _SERVICE_CACHE = build("calendar", "v3", credentials=creds)

    return _SERVICE_CACHE


# ─────────────────────────────────────────────────────────────────────────────
# Public: get free slots (45-minute intervals)
# ─────────────────────────────────────────────────────────────────────────────

def get_open_slots(days_ahead: int = 7, max_slots: int = 40) -> list[str]:
    """
    Return up to `max_slots` free 45-minute slots over the next `days_ahead` days
    during clinic hours (6:00 PM – 10:00 PM), Asia/Karachi time.
    Slots run back-to-back with no gap:
      6:00pm – 6:45pm (18:00)
      6:45pm – 7:30pm (18:45)
      7:30pm – 8:15pm (19:30)
      8:15pm – 9:00pm (20:15)
      9:00pm – 9:45pm (21:00)
    """
    try:
        service = _get_service()

        now_local = datetime.now(TZ)
        time_min = now_local.isoformat()
        time_max = (now_local + timedelta(days=days_ahead)).isoformat()

        # Ask Google which times are busy
        body = {
            "timeMin": time_min,
            "timeMax": time_max,
            "timeZone": TIMEZONE_STR,
            "items": [{"id": CALENDAR_ID}],
        }
        freebusy = service.freebusy().query(body=body).execute()
        busy_periods = freebusy["calendars"][CALENDAR_ID]["busy"]

        # Parse busy periods into localized start/end ranges
        parsed_busy = []
        for period in busy_periods:
            b_start = datetime.fromisoformat(period["start"].replace("Z", "+00:00")).astimezone(TZ)
            b_end   = datetime.fromisoformat(period["end"].replace("Z", "+00:00")).astimezone(TZ)
            parsed_busy.append((b_start, b_end))

        open_slots: list[str] = []
        slot_delta = timedelta(minutes=SLOT_DURATION_MINUTES)

        for day_offset in range(0, days_ahead + 1):
            day_local = (now_local + timedelta(days=day_offset)).date()
            
            # Skip Sundays (Clinic is closed on Sunday)
            if day_local.weekday() == 6:
                continue

            clinic_open  = datetime(day_local.year, day_local.month, day_local.day, CLINIC_START_HOUR, 0, tzinfo=TZ)
            clinic_close = datetime(day_local.year, day_local.month, day_local.day, CLINIC_END_HOUR, 0, tzinfo=TZ)

            cursor = clinic_open
            while cursor + slot_delta <= clinic_close:
                slot_start = cursor
                slot_end   = cursor + slot_delta
                cursor     += slot_delta  # Back-to-back: next slot begins immediately when previous ends

                # Skip slots that are already in the past
                if slot_start <= now_local:
                    continue

                # Check if this 45-minute slot overlaps with any busy period
                is_busy = False
                for b_start, b_end in parsed_busy:
                    # Overlap condition: max(start1, start2) < min(end1, end2)
                    if max(slot_start, b_start) < min(slot_end, b_end):
                        is_busy = True
                        break

                if not is_busy:
                    # Format as: YYYY-MM-DD at HH:MM (e.g. 2026-09-04 at 17:45 (5:45 PM – 6:30 PM))
                    time_12h_start = slot_start.strftime("%I:%M %p").lstrip("0")
                    time_12h_end   = slot_end.strftime("%I:%M %p").lstrip("0")
                    slot_str = f"{slot_start.strftime('%Y-%m-%d')} at {slot_start.strftime('%H:%M')} ({time_12h_start} – {time_12h_end})"
                    open_slots.append(slot_str)

                    if len(open_slots) >= max_slots:
                        return open_slots

        return open_slots

    except Exception as e:
        print(f"[GCal] get_open_slots failed: {e}")
        return []

# ─────────────────────────────────────────────────────────────────────────────
# Public: get existing appointments (busy periods)
# ─────────────────────────────────────────────────────────────────────────────

def get_busy_periods(days_ahead: int = 7) -> list[str]:
    """
    Return a list of strings representing the exact busy periods from Google Calendar.
    Format: 'YYYY-MM-DD from HH:MM AM/PM to HH:MM AM/PM'
    """
    try:
        service = _get_service()

        now_local = datetime.now(TZ)
        time_min = now_local.isoformat()
        time_max = (now_local + timedelta(days=days_ahead)).isoformat()

        # Ask Google which times are busy
        body = {
            "timeMin": time_min,
            "timeMax": time_max,
            "timeZone": TIMEZONE_STR,
            "items": [{"id": CALENDAR_ID}],
        }
        freebusy = service.freebusy().query(body=body).execute()
        busy_periods = freebusy["calendars"][CALENDAR_ID]["busy"]

        parsed_busy = []
        for period in busy_periods:
            b_start = datetime.fromisoformat(period["start"].replace("Z", "+00:00")).astimezone(TZ)
            b_end   = datetime.fromisoformat(period["end"].replace("Z", "+00:00")).astimezone(TZ)
            
            # Format: 2026-09-18 from 6:00 PM to 6:45 PM
            busy_str = f"{b_start.strftime('%Y-%m-%d')} from {b_start.strftime('%I:%M %p').lstrip('0')} to {b_end.strftime('%I:%M %p').lstrip('0')}"
            parsed_busy.append(busy_str)

        return parsed_busy

    except Exception as e:
        print(f"[GCal] get_busy_periods failed: {e}")
        return []


# ─────────────────────────────────────────────────────────────────────────────
# Helper: parse date and time strings robustly
# ─────────────────────────────────────────────────────────────────────────────

def _parse_slot_datetime(date_str: str, time_str: str) -> datetime:
    """Robustly parse date_str and time_str into a timezone-aware datetime in Asia/Karachi."""
    d_clean = (date_str or "").strip()
    t_clean = (time_str or "").strip()

    if "T" in d_clean:
        try:
            dt = datetime.fromisoformat(d_clean)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=TZ)
            return dt.astimezone(TZ)
        except Exception:
            pass

    # Extract clean YYYY-MM-DD
    if len(d_clean) >= 10 and d_clean[4] == '-' and d_clean[7] == '-':
        d_clean = d_clean[:10]

    # Try standard formats (with seconds, without seconds, 12h, etc.)
    for fmt in [
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M",
        "%Y-%m-%d %I:%M %p",
        "%Y-%m-%d %I:%M%p",
        "%Y-%m-%d %I %p",
    ]:
        try:
            dt = datetime.strptime(f"{d_clean} {t_clean}", fmt)
            return dt.replace(tzinfo=TZ)
        except ValueError:
            pass

    # Fallback: extract HH:MM manually
    t_parts = t_clean.split(":")
    if len(t_parts) >= 2:
        try:
            h = int(t_parts[0].strip())
            m = int(t_parts[1][:2].strip())
            dt = datetime.strptime(d_clean, "%Y-%m-%d").replace(
                hour=h, minute=m, second=0, microsecond=0, tzinfo=TZ
            )
            return dt
        except Exception:
            pass

    raise ValueError(f"Could not parse date '{date_str}' and time '{time_str}'")


def create_booking(
    patient_name: str,
    phone: str,
    date_str: str,
    time_str: str,
    procedure: str = "Dental Appointment",
    duration_minutes: int | None = None,
) -> bool:
    """
    Create a Google Calendar event for the given slot.
    Consultation = 30 minutes, Treatment/Procedure = 45 minutes.
    date_str: 'YYYY-MM-DD', time_str: 'HH:MM'
    Returns True on success, False on failure.
    """
    try:
        service = _get_service()

        if duration_minutes is None:
            proc_lower = procedure.lower()
            if any(k in proc_lower for k in ["consult", "check", "checkup", "inquiry"]):
                duration_minutes = 30
            else:
                duration_minutes = 45

        start_local = _parse_slot_datetime(date_str, time_str)
        end_local = start_local + timedelta(minutes=duration_minutes)

        # EXACT SLOT OVERLAP CHECK
        freebusy = service.freebusy().query(body={
            "timeMin": start_local.isoformat(),
            "timeMax": end_local.isoformat(),
            "timeZone": TIMEZONE_STR,
            "items": [{"id": CALENDAR_ID}]
        }).execute()
        
        if freebusy.get("calendars", {}).get(CALENDAR_ID, {}).get("busy"):
            print(f"[GCal] create_booking failed: Overlap detected for {start_local} to {end_local}")
            return False

        attendees = []
        for email in [os.getenv("DR_MUSTAFA_GMAIL"), os.getenv("DR_QASIM_GMAIL")]:
            if email:
                attendees.append({"email": email.strip()})

        event = {
            "summary": f"{procedure} — {patient_name}",
            "description": (
                f"Patient: {patient_name}\n"
                f"Phone: {phone}\n"
                f"Procedure: {procedure}\n"
                f"Duration: {duration_minutes} minutes"
            ),
            "start": {
                "dateTime": start_local.isoformat(),
                "timeZone": TIMEZONE_STR,
            },
            "end": {
                "dateTime": end_local.isoformat(),
                "timeZone": TIMEZONE_STR,
            },
        }
        
        if attendees:
            event["attendees"] = attendees

        kwargs = {"calendarId": CALENDAR_ID, "body": event}
        if attendees:
            kwargs["sendUpdates"] = "all"

        created = service.events().insert(**kwargs).execute()
        print(f"[GCal] Event created ({duration_minutes} min): {created.get('htmlLink')}")
        return True

    except HttpError as e:
        print(f"[GCal] create_booking HTTP error: {e.status_code} - {e.reason}")
        print(f"[GCal] Error details: {e.error_details}")
        return False
    except Exception as e:
        print(f"[GCal] create_booking failed: {e}")
        return False


# ─────────────────────────────────────────────────────────────────────────────
# Public: cancel a booking event (45-minute duration)
# ─────────────────────────────────────────────────────────────────────────────

def cancel_booking(phone: str, date_str: str, time_str: str) -> bool:
    """
    Find and delete the Calendar event that starts at the given slot
    and has the patient's phone in the description or summary.
    Returns True if deleted, False if not found or error.
    """
    try:
        import re
        service = _get_service()

        start_local = _parse_slot_datetime(date_str, time_str)
        time_min = (start_local - timedelta(minutes=15)).isoformat()
        time_max = (start_local + timedelta(hours=2)).isoformat()

        events_result = service.events().list(
            calendarId=CALENDAR_ID,
            timeMin=time_min,
            timeMax=time_max,
            singleEvents=True,
        ).execute()

        clean_target_phone = re.sub(r"\D", "", phone or "")[-10:]

        events = events_result.get("items", [])
        for event in events:
            desc = event.get("description", "")
            summary = event.get("summary", "")
            clean_desc_digits = re.sub(r"\D", "", desc)

            matched = False
            if phone and (phone in desc or phone in summary):
                matched = True
            elif clean_target_phone and clean_target_phone in clean_desc_digits:
                matched = True

            if matched:
                service.events().delete(
                    calendarId=CALENDAR_ID, eventId=event["id"]
                ).execute()
                print(f"[GCal] Event deleted: {summary}")
                return True

        print(f"[GCal] No matching event found for {phone} at {date_str} {time_str}")
        return False

    except Exception as e:
        print(f"[GCal] cancel_booking failed: {e}")
        return False
