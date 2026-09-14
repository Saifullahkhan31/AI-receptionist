import re
import os
import time
from dotenv import load_dotenv
load_dotenv(override=True)

from database import supabase
import gcal
import httpx
from google import genai
from google.genai import types

gemini_api_key = os.getenv("GEMINI_API_KEY")
gemini_client = genai.Client(api_key=gemini_api_key) if gemini_api_key else None

CLINIC_NAME = os.getenv("CLINIC_NAME", "Smile Dental Clinic")

# Global memory to store the last few messages for each phone number
CONVERSATION_HISTORY = {}


# ─────────────────────────────────────────────────────────────────────────────
# Patient helpers (Supabase)
# ─────────────────────────────────────────────────────────────────────────────

def get_patient(phone: str) -> dict | None:
    """Look up a patient by phone number. Returns dict or None."""
    result = supabase.table("patients").select("*").eq("contact_number", phone).execute()
    return result.data[0] if result.data else None


def register_patient(phone: str, name: str) -> None:
    """Auto-register a new patient if they are not in the DB."""
    existing = supabase.table("patients").select("id").eq("contact_number", phone).execute()
    if not existing.data:
        supabase.table("patients").insert({"name": name, "contact_number": phone}).execute()


import json
from datetime import datetime

# ─────────────────────────────────────────────────────────────────────────────
# Doctor Notification Lookup & Registry
# ─────────────────────────────────────────────────────────────────────────────
# Default doctor number: Dr. Mustafa (923312887365)
DOCTOR_WHATSAPP_NUMBER = os.getenv("DOCTOR_WHATSAPP_NUMBER", "923312887365")

# Lookup mapping doctor_id -> WhatsApp configuration
DOCTOR_REGISTRY = {
    "default": {
        "name": "Dr. on Duty",
        "whatsapp_number": DOCTOR_WHATSAPP_NUMBER,
    },
    "dr_mustafa": {
        "name": "Dr. Mustafa",
        "whatsapp_number": os.getenv("DR_MUSTAFA_WHATSAPP", DOCTOR_WHATSAPP_NUMBER),
    },
    "dr_qasim": {
        "name": "Dr. Qasim",
        "whatsapp_number": os.getenv("DR_QASIM_WHATSAPP", DOCTOR_WHATSAPP_NUMBER),
    },
}

# In-memory deduplication set to guarantee exactly ONE notification per booking
NOTIFIED_BOOKINGS = set()
RECENTLY_BOOKED_SLOTS = set()


def format_time_12h(time_input: str | float | int) -> str:
    """
    Converts 24-hour time formats (e.g. '18:30', '18.30', '19', 18.3, 19)
    into 12-hour AM/PM format (e.g. '6:30 p.m.', '7:00 p.m.').
    """
    if time_input is None:
        return ""

    val = str(time_input).strip()
    if not val:
        return ""

    # If already contains AM/PM/a.m./p.m.
    if re.search(r"[a-zA-Z]", val):
        return val

    # Match hour and minute components: '18:30', '18.30', '18.3', '19', '09:15'
    match = re.match(r"^(\d{1,2})(?:[:.](\d{1,2}))?$", val)
    if not match:
        return val

    hour = int(match.group(1))
    min_str = match.group(2)

    if min_str is None:
        minute = 0
    else:
        # If float like 18.3 was passed, min_str is '3' -> 30 mins
        if len(min_str) == 1:
            minute = int(min_str) * 10
        else:
            minute = int(min_str)

    period = "a.m." if hour < 12 else "p.m."
    hour_12 = hour % 12
    if hour_12 == 0:
        hour_12 = 12

    return f"{hour_12}:{minute:02d} {period}"


def get_day_name(date_input: str) -> str:
    """
    Returns the day of the week (e.g. 'Tuesday') from YYYY-MM-DD date string.
    """
    if not date_input:
        return ""
    try:
        dt = datetime.strptime(date_input.strip(), "%Y-%m-%d")
        return dt.strftime("%A")
    except Exception:
        return ""


def send_doctor_notification(booking: dict) -> bool:
    """
    Sends an instant WhatsApp notification to the assigned doctor right after
    a booking is successfully created in Supabase.
    Exact format required:
    "New Appointment: [Patient Name], [Phone Number], [Date], [Day], [Time], [Procedure]"
    """
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    appointment_id = booking.get("appointment_id", "N/A")
    patient_name = booking.get("patient_name", "Unknown Patient")
    patient_phone = booking.get("patient_phone", "")
    date_str = booking.get("date_str", "")
    raw_time = booking.get("time_str", "")
    procedure = booking.get("procedure", "Dental Consultation")

    # Format time to 12-hour AM/PM format (e.g. "5:45 p.m.")
    formatted_time = format_time_12h(raw_time)

    # Get day of week (e.g. "Tuesday")
    day_str = booking.get("day_str") or get_day_name(date_str)

    # Deduplication key: ensure this booking only fires one notification
    dedup_key = f"{patient_phone}_{date_str}_{raw_time}"
    if appointment_id != "N/A":
        dedup_key = f"appt_{appointment_id}"

    if dedup_key in NOTIFIED_BOOKINGS:
        print(f"[Doctor Notification] [{timestamp}] [Booking ID: {appointment_id}] DUPLICATE DETECTED: Notification already sent for {dedup_key}. Dropping duplicate.")
        return True
    NOTIFIED_BOOKINGS.add(dedup_key)

    # Collect both doctors' WhatsApp numbers, removing duplicates in case they share a default
    phones_to_notify = list(set([
        DOCTOR_REGISTRY.get("dr_mustafa", {}).get("whatsapp_number"),
        DOCTOR_REGISTRY.get("dr_qasim", {}).get("whatsapp_number")
    ]))
    phones_to_notify = [p for p in phones_to_notify if p]

    token = os.getenv("META_ACCESS_TOKEN")
    phone_id = os.getenv("META_PHONE_NUMBER_ID")

    if not token or not phone_id:
        print(f"[Doctor Notification] [{timestamp}] [Booking ID: {appointment_id}] META credentials missing in .env — skipping doctor alert.")
        return False

    # Exact format: "New Appointment: [Patient Name], [Phone Number], [Date], [Day], [Time], [Procedure]"
    if day_str:
        message = f"New Appointment: {patient_name}, {patient_phone}, {date_str}, {day_str}, {formatted_time}, {procedure}"
    else:
        message = f"New Appointment: {patient_name}, {patient_phone}, {date_str}, {formatted_time}, {procedure}"

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    success = True
    for phone in phones_to_notify:
        # 1. Primary: Send via Meta Approved Template (doctor_appointment_alert) for 24/7 delivery outside 24h window
        template_payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": phone,
            "type": "template",
            "template": {
                "name": "doctor_appointment_alert",
                "language": {"code": "en"},
                "components": [
                    {
                        "type": "body",
                        "parameters": [
                            {"type": "text", "text": patient_name},
                            {"type": "text", "text": patient_phone},
                            {"type": "text", "text": date_str},
                            {"type": "text", "text": day_str or "N/A"},
                            {"type": "text", "text": formatted_time},
                            {"type": "text", "text": procedure}
                        ]
                    }
                ]
            }
        }

        # 2. Fallback: Free-form text message
        text_payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": phone,
            "type": "text",
            "text": {"body": message}
        }

        print(f"\n[Doctor Notification] [{timestamp}] [Booking ID: {appointment_id}] Triggered send_doctor_notification for {patient_name} ({patient_phone}) to {phone}")

        try:
            url = f"https://graph.facebook.com/v19.0/{phone_id}/messages"
            # Try Template first
            resp = httpx.post(url, headers=headers, json=template_payload, timeout=12.0)
            if resp.status_code == 200:
                msg_id = resp.json().get("messages", [{}])[0].get("id", "OK")
                print(f"[Doctor Notification] [{timestamp}] [Booking ID: {appointment_id}] ✅ Sent template alert (doctor_appointment_alert) to {phone} (Message ID: {msg_id})")
            else:
                print(f"[Doctor Notification] Template payload warning {resp.status_code}: {resp.text}. Falling back to text payload...")
                # Fallback to free-form text payload
                resp2 = httpx.post(url, headers=headers, json=text_payload, timeout=12.0)
                if resp2.status_code == 200:
                    msg_id = resp2.json().get("messages", [{}])[0].get("id", "OK")
                    print(f"[Doctor Notification] [{timestamp}] [Booking ID: {appointment_id}] ✅ Sent text alert to {phone} (Message ID: {msg_id})")
                else:
                    print(f"[Doctor Notification] [{timestamp}] [Booking ID: {appointment_id}] ❌ Meta API Error {resp2.status_code} for {phone}: {resp2.text}")
                    success = False
        except Exception as e:
            print(f"[Doctor Notification] [{timestamp}] [Booking ID: {appointment_id}] ❌ Failed for {phone}: {e}")
            success = False

    return success


def notify_doctor(patient_name: str, patient_phone: str, date_str: str, time_str: str):
    """Backwards-compatible wrapper for existing callers."""
    return send_doctor_notification({
        "patient_name": patient_name,
        "patient_phone": patient_phone,
        "date_str": date_str,
        "time_str": time_str,
        "procedure": "Dental Appointment"
    })



# ─────────────────────────────────────────────────────────────────────────────
# Gemini AI logic
# ─────────────────────────────────────────────────────────────────────────────

def get_patient_upcoming_appointments(phone: str) -> str:
    """Fetch active/upcoming appointments for this patient from Supabase."""
    try:
        from datetime import date
        today_str = date.today().isoformat()

        # Query appointments by contact_number
        res = (
            supabase.table("appointments")
            .select("*")
            .eq("contact_number", phone)
            .gte("appointment_date", today_str)
            .neq("status", "Appt Cancel/Postpone")
            .order("appointment_date")
            .order("appointment_time")
            .execute()
        )
        if res.data:
            lines = []
            for appt in res.data:
                a_date = appt.get("appointment_date") or (appt.get("slot_time", "")[:10] if appt.get("slot_time") else "")
                a_time = appt.get("appointment_time") or (appt.get("slot_time", "")[11:16] if appt.get("slot_time") else "")
                a_proc = appt.get("treatment_planned") or appt.get("procedure", "Dental Visit")
                a_status = appt.get("status", "Confirmed")

                formatted_t = format_time_12h(a_time) if a_time else "TBD"
                day_name = get_day_name(a_date) if a_date else ""

                day_part = f" ({day_name})" if day_name else ""
                lines.append(f"  • Date: {a_date}{day_part} at {formatted_t} | Procedure: {a_proc} | Status: {a_status}")
            return "\n".join(lines)
    except Exception as e:
        print(f"[Supabase] Error fetching patient upcoming appointments: {e}")
    return "  No active upcoming appointments found on record."


def build_system_prompt(patient: dict | None, open_slots: list[str], phone: str) -> str:
    slots_text = "\n".join(open_slots) if open_slots else "No slots available this week."
    upcoming_appts = get_patient_upcoming_appointments(phone)

    patient_ctx = ""
    if patient:
        patient_ctx = f"""
=== RETURNING PATIENT RECORD ===
- Name                  : {patient['name']}
- Phone                 : {phone}
- Last Visit            : {patient.get('last_proc') or 'not on record'}
- Notes                 : {patient.get('notes') or 'none'}
- UPCOMING APPOINTMENTS :
{upcoming_appts}
================================
"""
    else:
        patient_ctx = f"""
=== NEW PATIENT / UNREGISTERED ===
- Phone                 : {phone}
- UPCOMING APPOINTMENTS :
{upcoming_appts}
==================================
"""

    return f"""You are Sana, the AI Dental Clinic Receptionist for {CLINIC_NAME}.
Your job is to communicate with patients professionally, warmly, naturally, and respectfully, help them with appointment booking, explain appointment availability, collect necessary information, and guide them toward consultation with Dr. Mustafa or Dr. Qasim.

Follow ALL rules below strictly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. LANGUAGE RULES — EXTREMELY IMPORTANT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
### Roman Urdu and English ONLY
- The receptionist must NEVER use Hindi, Devanagari, or Hindi vocabulary in its responses.
- All Urdu responses MUST be written in Roman Urdu using English/Latin alphabets.
- Never output Urdu in Urdu/Arabic script.
- Never mix Hindi vocabulary into Roman Urdu.

Examples of preferred Roman Urdu:
- "Mujhe is bare mein maloomat nahi hai."
- "Aap clinic visit karein, main aap ke liye appointment book kar deti hoon."
- "Doctor Mustafa aur Doctor Qasim checkup ke baad aap ko behtar guide kar saken ge."
- "Aap tension na lein, doctor aap ko proper guidance dein ge."

Do NOT use Hindi-style words such as:
- "jaankari"
- "ilaaj" when a more natural Roman Urdu alternative is appropriate
- "takleef" is acceptable in Urdu
- "samajh sakti hoon" is acceptable
- Avoid Hindi constructions and vocabulary generally.

The language should sound like natural Pakistani Roman Urdu, not translated Hindi.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. LANGUAGE MATCHING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Always respond in the language used by the patient.
- If the patient speaks/writes in English: Respond completely in English.
- If the patient speaks/writes in Urdu/Roman Urdu: Respond strictly in Roman Urdu.
- Do NOT switch to Hindi.
- Do NOT respond in Urdu/Arabic script or Devanagari.
- Do NOT unnecessarily mix English into a Roman Urdu response, except for natural terms such as: appointment, clinic, doctor, checkup, consultation, treatment, time, slot.
- If the patient uses a mixture of English and Roman Urdu, respond naturally in the same Pakistani Roman Urdu/English style.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. GREETING AND HOW TO ADDRESS PATIENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Your name is Sana and you are the receptionist at {CLINIC_NAME}.
A natural opening can be:
"Hello, Assalamualaikum, main Sana, {CLINIC_NAME} se baat kar rahi hoon. Main aap ki kya madad kar sakti hoon?"
Or:
"Assalamualaikum, main Sana, {CLINIC_NAME} se baat kar rahi hoon. Aap mujhe batayein, main aap ki kis tarah madad kar sakti hoon?"

Do NOT use "sahab" after a patient's name under any circumstances.
- Male patients: Address male patients using [Name] bhai (e.g., "Ibrahim bhai", "Ahmed bhai", "Usman bhai"). Never say "Ibrahim sahab".
- Female patients: Address female patients using [Name] behen (e.g., "Ayesha behen", "Fatima behen").
- If gender is unknown, do not assume it unnecessarily; simply use their name without a gendered title.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. MEDICAL / DENTAL COMPLAINTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The receptionist is NOT a dentist.
- Never diagnose a patient's condition.
- Never tell a patient with certainty what their disease/problem is.
- Never prescribe medication or treatment.
- When a patient says: "Mere daant mein dard hai", "Mere gums mein pain hai", "Mujhe checkup karwana hai", "Mera tooth bohat hurt kar raha hai", "Mujhe samajh nahi aa raha problem kya hai"
  The preferred response should guide them toward an in-clinic consultation:
  "Aap clinic visit karein. Main aap ke liye appointment ka time bata deti hoon aur aap us time par aa jayein. Dr. Mustafa ya Dr. Qasim aap ka proper checkup aur consultation kar ke aap ko behtar guide kar saken ge ke asal problem kya hai aur aap ke treatment ke liye kya behtar rahega."
- Another natural variation:
  "Aap tension na lein. Dr. Mustafa ya Dr. Qasim aap ka checkup karne ke baad aap ko behtar guide kar saken ge ke problem kya hai aur aap ke liye kis tarah ka treatment munasib rahega."
- Do not attempt to determine the cause of pain remotely. Do not say "Aap ko cavity hai", "Aap ko infection hai", or "Aap ko root canal ki zaroorat hai". Your role is to facilitate the consultation.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. STRONGLY PREFERRED RESPONSE FOR CHECKUP REQUESTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If a patient says they want a checkup because of pain or another dental issue:
"Aap clinic visit karein, main aap ke liye appointment book kar deti hoon. Dr. Mustafa ya Dr. Qasim aap ka checkup aur consultation karne ke baad aap ko behtar guide kar saken ge ke problem kya hai aur aap ke treatment ke liye kya behtar rahega."
If appropriate, add:
"Aap is bare mein tension na lein, doctor aap ko proper guidance dein ge."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. IF PATIENT ASKS: "PROBLEM KYA HAI?"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Do not diagnose. Say:
"Main aap ka checkup kiye baghair confirm nahi bata sakti ke problem kya hai. Dr. Mustafa ya Dr. Qasim aap ka checkup karne ke baad aap ko behtar guide kar saken ge."
Or:
"Is bare mein behtar Dr. Mustafa ya Dr. Qasim aap ka checkup karne ke baad bata saken ge, kyun ke proper diagnosis ke liye doctor ka checkup zaroori hai."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7. IF YOU DO NOT KNOW SOMETHING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If the receptionist does not have information, NEVER invent an answer.
Say:
"Mujhe is bare mein maloomat nahi hai."
Or:
"Mere paas is waqt is bare mein maloomat available nahi hai."
Never use Hindi words like "jaankari". Never fabricate clinic policies, prices, treatment details, doctor availability, or other information.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
8. CONSULTATION / TREATMENT PRICE QUESTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If the patient asks "Consultation kitne ki hai?" or "Treatment ke kitne paise lagen ge?":
Do not invent prices. Say:
"Consultation ki fee aur treatment ke charges Dr. Mustafa ya Dr. Qasim aap ki consultation aur checkup ke baad aap ko bata saken ge. Treatment aap ki dental problem ke hisaab se decide hoga aur doctor usi ke mutabiq aap ko charges bata dein ge."
Or:
"Doctor Mustafa ya Doctor Qasim consultation ke waqt aap ko charges bata dein ge. Treatment aap ki condition ke hisaab se decide hoga."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
9. CLINIC INFORMATION, TIMINGS & DOCTORS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Clinic Name    : {CLINIC_NAME}
Location       : Grey Skyline, Block 13, Jauhar Chowrangi Road, Gulistan-e-Johar, Karachi (786 Medical Store se jo andar road ja rahi hai, us road par seedha andar Hussaini Blood Bank hai, wahan hi clinic hai). Google Maps: https://maps.app.goo.gl/7NfZMQEBh1HTo5bw8
Doctors        :
- Dr. Mustafa — Qualifications: BDS, RDS, D-Ortho (Orthodontics & Braces Specialist)
- Dr. Qasim — Qualifications: BDS, RDS, C-Endo, C-Implant (Root Canal & Implants Specialist)
If a patient asks about qualifications:
"Hamare clinic mein 2 senior qualified doctors hain:
• Dr. Mustafa — BDS, RDS, D-Ortho
• Dr. Qasim — BDS, RDS, C-Endo, C-Implant"
Clinic Hours   : Monday to Saturday, 6:00 PM – 10:00 PM. Sundays closed.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
10. DYNAMIC APPOINTMENT SLOT SYSTEM — CRITICAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Each appointment occupies a maximum of 45 minutes.
- Booking window: 6:00 PM — 10:00 PM.
- The appointment system is DYNAMIC. Do NOT assume only fixed predefined slots (6:00, 6:45, 7:30, 8:15, 9:00).
- Appointments can start at a patient's requested time, provided that:
  1. The requested start time is within clinic hours (6:00 PM – 10:00 PM).
  2. The requested 45-minute period does not overlap another booked appointment.
  3. The requested appointment can finish by 10:00 PM.
  4. The doctor(s) are available during that period.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
11. HOW TO CALCULATE A BOOKED SLOT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Every appointment reserves: Requested start time → 45 minutes later.
- Example 1: Patient books at 6:00 PM → Reserved 6:00 PM to 6:45 PM. Next available begins at 6:45 PM.
- Example 2: Patient books at 7:15 PM → Reserved 7:15 PM to 8:00 PM. Next available begins at 8:00 PM.
- Example 3: Patient books at 8:30 PM → Reserved 8:30 PM to 9:15 PM. Next available begins at 9:15 PM.
- Example 4: Patient books at 9:30 PM → Reserved 9:30 PM to 10:00 PM (valid shortened final slot before 10:00 PM closing).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
12. END-OF-DAY RULE (10:00 PM CLOSING)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The clinic closes at 10:00 PM.
- 9:00 PM → 9:45 PM = valid
- 9:15 PM → 10:00 PM = valid
- 9:30 PM → 10:00 PM = valid as a shortened final appointment
- 9:45 PM → 10:30 PM = NOT valid
- 10:00 PM or later = NOT bookable
Never create an appointment that extends beyond 10:00 PM. If requested, explain politely that clinic closes at 10:00 PM.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
13. DO NOT SHOW ONLY FIXED SLOT TIMES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
When a patient asks "Kaun kaun se slots available hain?", do NOT automatically respond with only fixed intervals.
Inspect the actual booked appointments and identify the available periods.
Example:
Clinic timing: 6:00 PM → 10:00 PM. Existing booking: 6:00 PM → 6:45 PM.
Tell the patient: "6:45 PM se 10:00 PM tak doctors available hain. Aap kis waqt aana chahein ge?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
14. IF PATIENT CHOOSES ANY TIME WITHIN AVAILABLE PERIOD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If patient gives a specific time, book starting from that exact requested time (if 45 mins fit without overlap).
Example: Available 6:45 PM → 10:00 PM. Patient says: "Main 7:15 par aaunga."
Book: 7:15 PM → 8:00 PM. Remaining availability becomes: 8:00 PM → 10:00 PM.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
15. IF PATIENT DOES NOT SPECIFY A TIME ("Koi bhi time de dein")
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tell them the available period and ask them to select a time:
"8:00 PM se 10:00 PM tak time available hai. Aap kisi bhi waqt aa sakte hain. Aap mujhe apna preferred time bata dein, main aap ka appointment book kar deti hoon."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
16. IF PATIENT REQUESTS A TIME THAT IS ALREADY BOOKED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Do NOT simply say "No". Explain naturally that the requested time is already occupied:
- For male: "Asal mein bhai, jis waqt aap appointment lena chah rahe hain us waqt doctor ki appointment pehle se booked hai. Is liye main aap ko us waqt appointment nahi de pa rahi. Agar aap chahein to main aap ko us ke baad wala available time book kar deti hoon."
- For female: "Asal mein behen, jis waqt aap appointment lena chah rahi hain us waqt doctor ki appointment pehle se booked hai. Is liye main aap ko us waqt appointment nahi de pa rahi. Agar aap chahein to main aap ko us ke baad wala available time book kar deti hoon."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
17. IF PATIENT INSISTS ON A BUSY TIME
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- For male: "Asal mein bhai, masla ye hai ke 8:30 ka time pehle se booked hai aur us waqt doctors free nahi hain. Isi liye main aap ko ye time book nahi kar sakti. Agar aap chahein to main aap ko us ke baad ka available time book kar deti hoon."
- For female: "Asal mein behen, masla ye hai ke 8:30 ka time pehle se booked hai aur us waqt doctors free nahi hain. Isi liye main aap ko ye time book nahi kar sakti. Agar aap chahein to main aap ko us ke baad ka available time book kar deti hoon."
Never falsely claim that a time is available.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
18. NEVER DOUBLE-BOOK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Check existing appointments and ensure the requested 45-minute period does not overlap any existing booking. Appointments must never overlap.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
19. TIME UNDERSTANDING (PAKISTANI EXPRESSIONS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Understand natural Pakistani time expressions:
- "6 baje" = 6:00 PM | "7 baje" = 7:00 PM | "8 baje" = 8:00 PM | "9 baje" = 9:00 PM | "10 baje" = 10:00 PM
- "sawa 7" = 7:15 PM | "saadhe 7" = 7:30 PM | "paune 8" = 7:45 PM
- "sawa 8" = 8:15 PM | "saadhe 8" = 8:30 PM | "paune 9" = 8:45 PM
- "sawa 9" = 9:15 PM | "saadhe 9" = 9:30 PM | "paune 10" = 9:45 PM (not bookable as 45-min slot)
Always convert natural-language time into exact HH:MM start time before booking.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
20. PATIENT PRIVACY (STRICT)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If a patient asks about other patients' details, names, or bookings, refuse politely without extra unprompted details:
"Hamare paas patient privacy ki wajah se kisi ki personal details share nahi ki jaati, sorry for that. 😊 Agar aap apne liye appointment book karwana chahte hain ya appointment/consultation se related koi sawal hai toh main zarur aap ki rehnumai kar sakti hoon!"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
21. MANDATORY PATIENT SCREENING & RESCHEDULING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- When a patient asks to book: Ask: "Kya aap pehle {CLINIC_NAME} aa chuke hain (Dr. Mustafa ya Dr. Qasim se check-up karwaya hai) ya aap pehli baar aa rahe hain?"
- If new patient: "Zabardast! Aap clinic mein kisi bhi available doctor (Dr. Mustafa ya Dr. Qasim) se consultation / check-up karwa sakte hain."
- If rescheduling: When confirming the new slot, output BOTH the CANCEL tag for old slot and BOOK tag for new slot.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PATIENT CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{patient_ctx}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CURRENT SCHEDULE & SLOTS THIS WEEK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{slots_text}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SYSTEM TAGS (HIDDEN — NEVER SHOW TO PATIENT)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BOOKING TAG    : When a patient confirms a slot, append on a new line at the very end:
                 BOOK:YYYY-MM-DD:HH:MM:Procedure Name
                 Example: BOOK:2026-09-16:19:15:Consultation Checkup

CANCELLATION TAG: When a patient cancels or reschedules an appointment, append on a new line:
                 CANCEL:YYYY-MM-DD:HH:MM
                 Example: CANCEL:2026-09-15:18:00

IMPORTANT: These tags are parsed by the system. They must appear on their own line at the very end of your message. Never show or mention tags to the patient."""


# ─────────────────────────────────────────────────────────────────────────────
# Dynamic Gemini Model Pool with Self-Healing Fallback
# ─────────────────────────────────────────────────────────────────────────────

INITIAL_GEMINI_MODELS = [
    "gemini-3.6-flash",
    "gemini-3.7-flash",
    "gemini-3.8-flash",
    "gemini-flash-latest"
]

_ACTIVE_GEMINI_MODELS: list[str] = list(INITIAL_GEMINI_MODELS)
_RETIRED_GEMINI_MODELS: set[str] = {"gemini-2.5-flash", "gemini-2.5-flash-lite"}
_LAST_DISCOVERY_TIME: float = time.time()

def get_active_gemini_models(client: genai.Client | None = None) -> list[str]:
    """
    Returns a resilient, prioritized list of active Gemini models.
    Filters out any deprecated/retired models, and dynamically discovers live
    working models from Google GenAI API if the candidate pool is ever exhausted.
    """
    global _ACTIVE_GEMINI_MODELS, _RETIRED_GEMINI_MODELS, _LAST_DISCOVERY_TIME

    candidates = [m for m in _ACTIVE_GEMINI_MODELS if m not in _RETIRED_GEMINI_MODELS]

    # Only query Google API if all current models have been disqualified/retired
    if not candidates and client:
        try:
            print("[Gemini Pool] Candidate pool exhausted. Discovering live models directly from Google GenAI API...")
            discovered = []
            for m in client.models.list():
                m_name = m.name[7:] if m.name.startswith("models/") else m.name
                lower = m_name.lower()
                # Pick general flash/pro text/multimodal models, exclude specialized/deprecated
                if ("flash" in lower or "pro" in lower) and not any(x in lower for x in ["image", "tts", "preview-09", "preview-12", "realtime", "2.5"]):
                    if m_name not in _RETIRED_GEMINI_MODELS:
                        discovered.append(m_name)
            if discovered:
                discovered.sort(key=lambda x: ("3.8" in x, "3.7" in x, "3.6" in x, "flash" in x), reverse=True)
                _ACTIVE_GEMINI_MODELS = discovered
                _LAST_DISCOVERY_TIME = time.time()
                candidates = [m for m in _ACTIVE_GEMINI_MODELS if m not in _RETIRED_GEMINI_MODELS]
                print(f"[Gemini Pool] Dynamic self-healing discovered {len(candidates)} active models: {candidates}")
        except Exception as e:
            print(f"[Gemini Pool] Dynamic discovery error: {e}")

    return candidates or ["gemini-3.6-flash", "gemini-3.7-flash", "gemini-flash-latest"]


def mark_model_failed(model_name: str, permanent: bool = True) -> None:
    """Disqualifies a retired or deprecated model so future requests never waste time on it."""
    global _RETIRED_GEMINI_MODELS
    if permanent:
        _RETIRED_GEMINI_MODELS.add(model_name)
        print(f"[Gemini Pool] Disqualified inactive/retired model: '{model_name}'.")


def sanitize_conversation_history(history: list) -> list:
    """
    Sanitizes conversation history for Gemini API:
    1. Ensures roles alternate strictly: 'user' -> 'model' -> 'user' -> 'model'.
    2. Merges consecutive messages from the same role into a single message.
    3. Removes any empty messages.
    4. Ensures the history starts with a 'user' message.
    """
    if not history:
        return []

    sanitized = []
    for turn in history:
        raw_role = turn.get("role", "user")
        role = "user" if raw_role == "user" else "model"
        content = (turn.get("content") or "").strip()
        if not content:
            continue

        if sanitized and sanitized[-1]["role"] == role:
            # Merge consecutive messages of the same role
            sanitized[-1]["content"] += "\n" + content
        else:
            sanitized.append({"role": role, "content": content})

    # Ensure history starts with 'user'
    while sanitized and sanitized[0]["role"] != "user":
        sanitized.pop(0)

    return sanitized


def get_chat_completion(system_prompt: str, conversation_history: list) -> str:
    """Generate response using Google Gemini API with self-healing model fallback."""
    if not gemini_client:
        print("[Gemini] ERROR: GEMINI_API_KEY is not configured.")
        return "Assalam o Alaikum! Our system is currently being updated. A clinic representative will assist you shortly."

    # Strictly sanitize conversation history for Gemini multi-turn format
    sanitized_history = sanitize_conversation_history(conversation_history)

    # Format multi-turn conversation history for Gemini
    contents = []
    for turn in sanitized_history:
        role = "user" if turn["role"] == "user" else "model"
        contents.append(types.Content(
            role=role,
            parts=[types.Part.from_text(text=turn["content"])]
        ))

    config = types.GenerateContentConfig(
        system_instruction=system_prompt,
        temperature=0.7,
    )

    models_to_try = get_active_gemini_models(gemini_client)

    for g_model in models_to_try:
        try:
            resp = gemini_client.models.generate_content(
                model=g_model,
                contents=contents,
                config=config
            )
            if resp and resp.text:
                return resp.text.strip()
        except Exception as e:
            err_str = str(e).lower()
            if "not found" in err_str or "no longer available" in err_str or "deprecated" in err_str:
                mark_model_failed(g_model, permanent=True)
            print(f"[Gemini] Model {g_model} failed: {e}. Trying next Gemini model...")

    return "Assalam o Alaikum! We are currently experiencing a brief technical delay. A clinic representative will assist you shortly."


def normalize_phone(p: str) -> str:
    """Normalize any phone format (e.g. 0331..., +92331..., 92331...) to plain digits."""
    if not p:
        return ""
    digits = re.sub(r"[^\d]", "", str(p))
    if digits.startswith("0") and len(digits) == 11:
        digits = "92" + digits[1:]
    return digits


def cancel_patient_appointment(phone: str, date_str: str = None, time_str: str = None) -> list[str]:
    """
    Cancels appointment(s) in Google Calendar & updates Supabase status to 'Appt Cancel/Postpone'.
    If date_str and time_str are provided, cancels that specific slot.
    If date_str is None, cancels all active upcoming appointments for this phone number (used during rescheduling).
    Returns list of cancelled date strings.
    """
    cancelled_dates = []
    try:
        from datetime import date
        today_str = date.today().isoformat()

        # Query active appointments from Supabase
        query = supabase.table("appointments").select("*").eq("contact_number", phone).neq("status", "Appt Cancel/Postpone")
        if date_str:
            query = query.eq("appointment_date", date_str)
        else:
            query = query.gte("appointment_date", today_str)

        res = query.execute()
        active_appts = res.data or []

        for appt in active_appts:
            a_id = appt.get("id")
            a_date = appt.get("appointment_date") or (appt.get("slot_time", "")[:10] if appt.get("slot_time") else "")
            a_time = appt.get("appointment_time") or (appt.get("slot_time", "")[11:16] if appt.get("slot_time") else "")

            # 1. Update Supabase status
            if a_id:
                supabase.table("appointments").update({"status": "Appt Cancel/Postpone"}).eq("id", a_id).execute()

            # 2. Cancel in Google Calendar
            if a_date and a_time:
                gcal.cancel_booking(phone=phone, date_str=a_date, time_str=a_time)
                cancelled_dates.append(f"{a_date} at {format_time_12h(a_time)}")

            print(f"[Cancellation Flow] Cancelled appointment ID {a_id} ({a_date} {a_time}) for {phone}")

        # If specific date/time was given but not found in DB query, still try GCal delete & update
        if date_str and time_str and not cancelled_dates:
            gcal.cancel_booking(phone=phone, date_str=date_str, time_str=time_str)
            supabase.table("appointments").update({"status": "Appt Cancel/Postpone"}).eq("contact_number", phone).eq("appointment_date", date_str).execute()
            cancelled_dates.append(f"{date_str} at {format_time_12h(time_str)}")

    except Exception as e:
        print(f"[Cancellation Flow] Error in cancel_patient_appointment for {phone}: {e}")

    return cancelled_dates


def handle_message(phone: str, incoming_message: str, patient_name: str = "Unknown Patient") -> str:
    """Main entry point. Takes the sender's phone + message, returns reply text."""
    # ── 1. Check if the sender is a Doctor ──────────────────────────────────
    sender_clean = normalize_phone(phone)
    is_doctor = False
    doc_display_name = "Doctor"

    for doc_id, doc_data in DOCTOR_REGISTRY.items():
        reg_num = doc_data.get("whatsapp_number", "")
        reg_clean = normalize_phone(reg_num)
        
        # Match either exact normalized digits or last 10 digits (e.g. 3311286436)
        if sender_clean and reg_clean:
            if sender_clean == reg_clean or sender_clean[-10:] == reg_clean[-10:]:
                is_doctor = True
                doc_display_name = doc_data.get("name", "Doctor")
                break

    if is_doctor:
        print(f"[Doctor Session] Recognized {doc_display_name} ({phone})")
        # Fetch today and upcoming appointments from Supabase
        from datetime import date
        today_str = date.today().isoformat()
        try:
            appts = supabase.table("appointments").select("*").gte("appointment_date", today_str).neq("status", "Appt Cancel/Postpone").order("appointment_date").order("appointment_time").limit(5).execute()
            if appts.data:
                appt_lines = "\n".join([
                    f"• *{a.get('patient_name', 'Patient')}* — {a.get('treatment_planned', 'Dental Visit')} at {a.get('appointment_date', '')} {a.get('appointment_time', '')}"
                    for a in appts.data
                ])
            else:
                appt_lines = "No upcoming appointments scheduled yet."
        except Exception as e:
            appt_lines = f"Schedule lookup error: {e}"

        return (
            f"Assalam o Alaikum {doc_display_name}! 👨‍⚕️\n\n"
            f"You are connected to *{CLINIC_NAME}*'s AI Receptionist.\n"
            f"Whenever a patient books an appointment, you will receive real-time alerts on this chat.\n\n"
            f"📋 *Upcoming Appointments:*\n{appt_lines}\n\n"
            f"*(This number is designated as the Doctor recipient)*"
        )

    # ── 2. Standard Patient Flow ─────────────────────────────────────────────
    patient = get_patient(phone)
    
    # If this is a brand new patient, register them automatically!
    if not patient:
        register_patient(phone, patient_name)
        patient = get_patient(phone) # Re-fetch so we have their dictionary properly loaded

    # Get available slots from Google Calendar
    open_slots = gcal.get_open_slots()

    # Initialize memory if new phone
    if phone not in CONVERSATION_HISTORY:
        CONVERSATION_HISTORY[phone] = []

    # Append the newest user message
    CONVERSATION_HISTORY[phone].append({"role": "user", "content": incoming_message})

    # Build system prompt and fetch completion
    system_prompt = build_system_prompt(patient, open_slots, phone)
    reply = get_chat_completion(system_prompt, CONVERSATION_HISTORY[phone])

    # ── Parse and act on BOOK tag ────────────────────────────────────────────
    book_match = re.search(r"BOOK:(\d{4}-\d{2}-\d{2}):(\d{2}:\d{2})(?::(.+))?", reply)
    if book_match and patient:
        date_str, time_str = book_match.group(1), book_match.group(2)
        procedure_name = book_match.group(3).strip() if book_match.group(3) else "Dental Appointment"
        slot_key = (phone, date_str, time_str)
        reply = reply[: book_match.start()].strip()

        # Guard against duplicate bookings caused by webhook retries or repeat confirmation turns
        if slot_key in RECENTLY_BOOKED_SLOTS:
            print(f"[Booking Flow] Slot {date_str} {time_str} already confirmed for {phone}. Skipping duplicate actions.")
        else:
            # Check if patient already has an active upcoming appointment in Supabase (Rescheduling protection!)
            from datetime import date
            today_str = date.today().isoformat()
            try:
                existing_active = (
                    supabase.table("appointments")
                    .select("*")
                    .eq("contact_number", phone)
                    .gte("appointment_date", today_str)
                    .neq("status", "Appt Cancel/Postpone")
                    .execute()
                )
                old_appts = existing_active.data or []
                old_date_str = ""
                if old_appts:
                    old_date_str = old_appts[0].get("appointment_date", "")
                    print(f"[Reschedule Flow] Patient {phone} has {len(old_appts)} active appointment(s) (e.g. {old_date_str}). Auto-cancelling old appointment(s) before creating new booking...")
                    # Cancel old active appointment(s) in Supabase & Google Calendar
                    cancel_patient_appointment(phone=phone)
            except Exception as e:
                print(f"[Reschedule Flow] Check for existing appointments warning: {e}")

            success = gcal.create_booking(
                patient_name=patient["name"],
                phone=phone,
                date_str=date_str,
                time_str=time_str,
                procedure=procedure_name,
            )
            if not success:
                reply += "\n\nSorry, that slot was just taken. Please choose another time."
            else:
                RECENTLY_BOOKED_SLOTS.add(slot_key)
                if len(RECENTLY_BOOKED_SLOTS) > 500:
                    RECENTLY_BOOKED_SLOTS.clear()

                if not reply:
                    reply = f"Perfect! Your appointment for {date_str} at {time_str} is confirmed. We look forward to seeing you!"

                # 1. Save the new appointment to Supabase
                assigned_doctor_id = "default"

                payload = {
                    "contact_number": phone,
                    "patient_name": patient["name"],
                    "treatment_planned": procedure_name,
                    "appointment_date": date_str,
                    "appointment_time": time_str,
                    "status": "Confirmed",
                    "booked_by": "ai_bot"
                }
                if patient.get("id"):
                    payload["patient_id"] = patient["id"]

                supabase_res = supabase.table("appointments").insert(payload).execute()

                # 2. Right after the Supabase write succeeds, send a dedicated WhatsApp notification to the Doctor
                if supabase_res.data:
                    reschedule_note = f" (Rescheduled from {old_date_str})" if 'old_date_str' in locals() and old_date_str else ""
                    booking_record = {
                        "patient_name": patient["name"],
                        "patient_phone": phone,
                        "date_str": date_str,
                        "time_str": time_str,
                        "procedure": f"{procedure_name}{reschedule_note}",
                        "doctor_id": assigned_doctor_id,
                        "notes": patient.get("notes") or "Booked via WhatsApp AI Receptionist",
                        "appointment_id": supabase_res.data[0].get("id")
                    }
                    send_doctor_notification(booking_record)
                else:
                    print(f"[Booking Flow] Warning: Supabase insert returned no data for patient {patient['name']}. Doctor alert skipped.")

    # ── Parse and act on CANCEL tag ──────────────────────────────────────────
    cancel_match = re.search(r"CANCEL:(\d{4}-\d{2}-\d{2}):(\d{2}:\d{2})", reply)
    if cancel_match and patient:
        c_date, c_time = cancel_match.group(1), cancel_match.group(2)
        cancel_patient_appointment(phone=phone, date_str=c_date, time_str=c_time)
        reply = reply[: cancel_match.start()].strip()
        if not reply:
            reply = f"Your appointment on {c_date} at {c_time} has been canceled."

    # Save the final cleaned reply to the conversation history
    CONVERSATION_HISTORY[phone].append({"role": "assistant", "content": reply})
    
    # Keep only the last 6 messages (3 turns) so we don't accidentally exceed token limits
    CONVERSATION_HISTORY[phone] = CONVERSATION_HISTORY[phone][-6:]

    return reply
