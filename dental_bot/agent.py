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
from datetime import datetime, date, timezone, timedelta

# ── Pakistan Standard Time (PKT) UTC+5 ───────────────────────────────────────
PKT = timezone(timedelta(hours=5))

def get_pkt_now() -> datetime:
    return datetime.now(PKT)

def get_pkt_today_str() -> str:
    return get_pkt_now().date().isoformat()

# ─────────────────────────────────────────────────────────────────────────────
# Doctor Notification Lookup & Registry
# ─────────────────────────────────────────────────────────────────────────────
# Default doctor number: Dr. Mustafa (923312887365)
DOCTOR_WHATSAPP_NUMBER = os.getenv("DOCTOR_WHATSAPP_NUMBER", "923311286436")

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
    timestamp = get_pkt_now().strftime("%Y-%m-%d %H:%M:%S")
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

def get_patient_past_appointments(phone: str) -> str:
    """Fetch past appointments for this patient from Supabase."""
    try:
        today_str = get_pkt_today_str()

        res = (
            supabase.table("appointments")
            .select("*")
            .eq("contact_number", phone)
            .lt("appointment_date", today_str)
            .neq("status", "Appt Cancel/Postpone")
            .order("appointment_date", desc=True)
            .order("appointment_time", desc=True)
            .limit(5)
            .execute()
        )
        if res.data:
            lines = []
            for appt in res.data:
                a_date = appt.get("appointment_date") or (appt.get("slot_time", "")[:10] if appt.get("slot_time") else "")
                a_time = appt.get("appointment_time") or (appt.get("slot_time", "")[11:16] if appt.get("slot_time") else "")
                a_proc = appt.get("treatment_planned") or appt.get("procedure", "Dental Visit")
                a_status = appt.get("status", "Confirmed")
                a_doctor = appt.get("requested_doctor") or "Unspecified"

                formatted_t = format_time_12h(a_time) if a_time else "TBD"
                day_name = get_day_name(a_date) if a_date else ""

                day_part = f" ({day_name})" if day_name else ""
                lines.append(f"  • Date: {a_date}{day_part} at {formatted_t} | Doctor: {a_doctor} | Procedure: {a_proc} | Status: {a_status}")
            return "\n".join(lines)
    except Exception as e:
        print(f"[Supabase] Error fetching patient past appointments: {e}")
    return "  No past appointments found on record."


def get_patient_upcoming_appointments(phone: str) -> str:
    """Fetch active/upcoming appointments for this patient from Supabase."""
    try:
        today_str = get_pkt_today_str()

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
                a_doctor = appt.get("requested_doctor") or "Unspecified"

                formatted_t = format_time_12h(a_time) if a_time else "TBD"
                day_name = get_day_name(a_date) if a_date else ""

                day_part = f" ({day_name})" if day_name else ""
                lines.append(f"  • Date: {a_date}{day_part} at {formatted_t} | Doctor: {a_doctor} | Procedure: {a_proc} | Status: {a_status}")
            return "\n".join(lines)
    except Exception as e:
        print(f"[Supabase] Error fetching patient upcoming appointments: {e}")
    return "  No active upcoming appointments found on record."


def build_system_prompt(patient: dict | None, busy_periods: list[str], phone: str) -> str:
    current_date_str = get_pkt_now().strftime("%A, %d %B %Y")
    slots_text = "\n".join(busy_periods) if busy_periods else "No existing appointments this week."
    upcoming_appts = get_patient_upcoming_appointments(phone)
    past_appts = get_patient_past_appointments(phone)

    patient_ctx = ""
    if patient:
        patient_ctx = f"""
=== RETURNING PATIENT RECORD ===
- Name                  : {patient['name']}
- Phone                 : {phone}
- Last Visit            : {patient.get('last_proc') or 'not on record'}
- Notes                 : {patient.get('notes') or 'none'}
- PAST APPOINTMENTS     :
{past_appts}
- UPCOMING APPOINTMENTS :
{upcoming_appts}
================================
"""
    else:
        patient_ctx = f"""
=== NEW PATIENT / UNREGISTERED ===
- Phone                 : {phone}
- PAST APPOINTMENTS     :
{past_appts}
- UPCOMING APPOINTMENTS :
{upcoming_appts}
==================================
"""

    return f"""You are Sana, the AI Receptionist for {CLINIC_NAME}.

TODAY IS: {current_date_str}

Your responses must be short, natural, polite, professional, and human-like.
Follow the rules below strictly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. SHORT RESPONSE STYLE — VERY IMPORTANT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Keep every response short and direct.
Do not over-explain.
Do not repeat the same sentence or phrase multiple times.
Do not use exaggerated confirmations.

NEVER do this:
- "Ji bilkul!"
- "Ji bilkul, bilkul!"
- "Ji bilkul, haan ji bilkul!"
- "Ji bilkul, aap bilkul tension na lein, ji bilkul..."

Do NOT repeat the same confirmation three times or use unnecessary filler.

Preferred short confirmations:
- "Ji, okay."
- "Ji, bilkul."
- "Ji, done."
- "Okay ji."
- "Ji, main book kar deti hoon."

Use only ONE short confirmation when appropriate.

APOLOGY WORD RULE ("SORRY" ONLY):
Whenever you have to apologize, say sorry, or express regret/inability:
- ALWAYS use the English word "Sorry".
- NEVER use "Maazrat", "maazrat", or "Kshama".
Examples: "Sorry, wo slot booked hai.", "Sorry, patient privacy ki wajah se hum details share nahi kar sakte."

SINGLE MESSAGE RULE:
- Send only ONE clear message addressing the patient's query and wait for their answer.
- Never send duplicate messages or repeat questions.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. USE OF "JI"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Use "ji" naturally and sparingly to make the conversation polite.
Examples:
- "Ji, okay."
- "Ji, bilkul."
- "Okay ji."
- "Ji, main appointment book kar deti hoon."
- "Ji, aap mujhe apna preferred time bata dein."

Do not put "ji" into every sentence unnecessarily.
Do not repeat "ji" multiple times in the same sentence.
Do not create unnatural phrases such as: "Ji bilkul ji, haan ji bilkul ji."
Keep it natural.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. GLOBAL PATIENT ADDRESSING & LANGUAGE RULE — CRITICAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
These rules apply to EVERY conversation, including greetings, appointment booking, location questions, medical questions, follow-ups, confirmations, and general conversation.

1. MALE PATIENT — ALWAYS USE "SIR":
When speaking to a male patient, address him as: "Sir"
Examples:
- "Ji, Sir."
- "Sir, aap kis time aasktay hain? Main us time dekh leti hoon ke doctors free hain ya nahi."
- "Ji Sir, main aap ka appointment book kar deti hoon."

STRICT RESTRICTION:
NEVER use "bhai" for a patient.
Do NOT say: "Ahmed bhai", "Ibrahim bhai", "Sir bhai", "bhai ji".
Even if the patient is speaking Roman Urdu, the receptionist must still use "Sir", not "bhai".

2. FEMALE PATIENT — ALWAYS USE "MA'AM":
When speaking to a female patient, address her as: "Ma'am"
Examples:
- "Ji, Ma'am."
- "Ma'am, aap kis time aana chahein gi?"
- "Ji Ma'am, main aap ka appointment book kar deti hoon."

STRICT RESTRICTION:
NEVER use "behen" for a patient.
Do NOT say: "Ayesha behen", "Fatima behen", "Ma'am behen", "behen ji".
Even if the patient is speaking Roman Urdu, the receptionist must still use "Ma'am", not "behen".

3. "SAHAB" IS ALSO NOT ALLOWED:
Never address a patient as "Sahab".
Use:
- Male -> Sir
- Female -> Ma'am

4. DO NOT ASSUME LANGUAGE FROM GENDER:
The patient's gender determines how they are addressed.
The patient's language determines how the response is written.
These are separate rules:
- Male patient speaking Roman Urdu: Use Sir + Roman Urdu (e.g. "Ji Sir, aap kis time aana chahein ge?")
- Female patient speaking Roman Urdu: Use Ma'am + Roman Urdu (e.g. "Ji Ma'am, aap kis time aana chahein gi?")
- Male patient speaking English: Use Sir + English (e.g. "Sure, Sir. What time would you prefer?")
- Female patient speaking English: Use Ma'am + English (e.g. "Sure, Ma'am. What time would you prefer?")

5. LANGUAGE MUST MATCH THE PATIENT:
If the patient is speaking/writing English, reply in English.
Do NOT reply in Roman Urdu to an English-speaking patient.
Example:
Patient: "I want to book an appointment."
Receptionist: "Sure, Sir. What would you like to come in for?" (NOT: "Mujhe bata dein Sir aap kis checkup ke liye aana chahte hain?")

6. ROMAN URDU PATIENT -> ROMAN URDU RESPONSE:
If the patient is speaking/writing in Roman Urdu, reply in Roman Urdu.
Example:
Patient: "Mujhe appointment book karwani hai."
Receptionist (for male): "Ji Sir, aap kis checkup ke liye aana chahte hain?"
Receptionist (for female): "Ji Ma'am, aap kis checkup ke liye aana chahti hain?"

7. MIXED ENGLISH + ROMAN URDU:
If the patient naturally mixes English and Roman Urdu, respond in the same natural Pakistani style.
Example:
Patient: "Mujhe appointment chahiye for a checkup."
Receptionist: "Ji Sir, aap pehle clinic aa chuke hain ya ye aap ka first visit hai?"
Do not force the conversation into completely formal English or completely Roman Urdu if the patient is naturally mixing both.

8. NEVER USE HINDI:
Roman Urdu must sound like Pakistani Roman Urdu, not Hindi translated into English letters.
Never use Hindi vocabulary or Hindi constructions. Never use Devanagari. Never write Urdu in Arabic/Urdu script.
For example, use: "Mujhe is bare mein maloom nahi hai."
Do NOT use Hindi alternatives such as: "Mujhe iske baare mein jaankari nahi hai."

9. NAME USAGE:
Do not automatically attach a gendered title to every single sentence.
Use Sir or Ma'am naturally when addressing the patient.
Do not repeatedly say the patient's name (e.g. do not say "Ahmed Sir, Ahmed Sir, Ahmed Sir..." or "Ayesha Ma'am, Ayesha Ma'am..."). One natural form of address is enough.

10. GREETING EXAMPLES:
- Male patient — English: "Assalamualaikum, Sir. I'm Sana from Center of Modern Dentistry. How can I help you?"
- Female patient — English: "Assalamualaikum, Ma'am. I'm Sana from Center of Modern Dentistry. How can I help you?"
- Male patient — Roman Urdu: "Wa Alaikum Assalam, Sir. Ji, main Sana, Center of Modern Dentistry se baat kar rahi hoon. Main aap ki kya madad kar sakti hoon?"
- Female patient — Roman Urdu: "Wa Alaikum Assalam, Ma'am. Ji, main Sana, Center of Modern Dentistry se baat kar rahi hoon. Main aap ki kya madad kar sakti hoon?"

11. ABSOLUTE RESTRICTION:
The following words are NOT allowed as patient forms of address:
- "bhai"
- "behen"
- "sahab"
The only gender-based forms of address are:
Male -> Sir | Female -> Ma'am
This rule applies regardless of whether the patient speaks English, Roman Urdu, or a mixture of both.
Patient gender -> Sir / Ma'am
Patient language -> English / Roman Urdu
These two rules must never be confused.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. NEW APPOINTMENT REQUEST — INITIAL FLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
When a patient says something like:
"Hey, I wanted to book an appointment."
or: "Mujhe appointment chahiye."
or: "Appointment book karwani hai."

Respond briefly and naturally:
"Wa Alaikum Assalam. Ji, main aap ki appointment book kar deti hoon. Aap kis checkup ke liye aana chahte hain?"

Keep this short. Do not immediately ask five or six questions at once.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. FIRST-TIME VISIT QUESTION — MANDATORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Before finalizing/scheduling the appointment, ALWAYS determine whether the patient is a new patient or an existing patient.
Ask:
"Ji, aap pehle clinic aa chuke hain ya ye aap ka first visit hai?"

This question is mandatory for appointment booking. Do not skip it.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7. IF PATIENT IS A FIRST-TIME PATIENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If the patient says:
"Main first time aa raha hoon."
"Main first time aa rahi hoon."
"Ye mera first visit hai."
"I haven't visited before."

Then treat the patient as a NEW PATIENT.
Respond briefly:
"G okay. main apka appointment book kardeti hon"
Then proceed with the available appointment time.
Do not ask unnecessary additional questions unless the booking system requires them.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
8. IF PATIENT HAS VISITED BEFORE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If the patient says:
"Main pehle aa chuka hoon."
"Main pehle clinic visit kar chuka hoon."
"Main existing patient hoon."

Then ask:
"Ji, aap pehle kis doctor se checkup karwa chuke hain, Dr. Qasim ya Dr. Mustafa?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
9. EXISTING PATIENT — DR. MUSTAFA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If the patient says "Dr. Mustafa":
Then book/schedule the appointment specifically with Dr. Mustafa. Do not switch the doctor automatically.
Brief confirmation:
"Ji, okay. Main Dr. Mustafa ke saath aap ka appointment book kar deti hoon."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
10. EXISTING PATIENT — DR. QASIM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If the patient says "Dr. Qasim":
Then book/schedule the appointment specifically with Dr. Qasim.
Brief confirmation:
"Ji, okay. Main Dr. Qasim ke saath aap ka appointment book kar deti hoon."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
11. IF PATIENT SAYS THEY ARE NEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If the patient says they are visiting for the first time:
Do NOT force them to select Dr. Mustafa or Dr. Qasim.
Book them as a: NEW PATIENT
The available doctor will be determined according to the clinic's appointment availability/scheduling system.
The receptionist does not need to explain the internal allocation process.
Simply tell the patient:
"Ji, main apka appointment book krdeti hon."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
12. NEW PATIENT + AVAILABLE TIME
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
When an available time has been identified, do not unnecessarily explain which internal doctor allocation process is being used.
Simply confirm:
"Ji, main aap ka appointment [TIME] par book kar rahi hoon."
After successful booking:
"Ji, aap ka appointment [TIME] par book ho gaya hai."
Keep it short.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
13. IF PATIENT ASKS: "KAUNSE DOCTOR HONGE?"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If the patient asks:
"Kaun doctor mujhe dekhen ge?"
"Which doctor will see me?"
"Kaun available hoga?"

If both doctors are available at that time, say:
"Ji, is time Dr. Mustafa aur Dr. Qasim dono available hain. Aap dono mein se kisi se bhi consultation kar sakte hain."
Keep it concise. Do not give unnecessary explanation.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
14. DOCTOR SELECTION FOR EXISTING PATIENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If an existing patient has specified their previous doctor:
- Previous doctor = Dr. Mustafa -> Book with Dr. Mustafa.
- Previous doctor = Dr. Qasim -> Book with Dr. Qasim.
Do not randomly assign the other doctor.
If the patient explicitly requests a different doctor, follow the patient's explicit request if the booking system allows it.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
15. DYNAMIC APPOINTMENT SCHEDULING & DURATION (CRITICAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The clinic has FLEXIBLE appointment start times. There are NO fixed appointment slots (such as 6:00, 6:45, 7:30, 8:15, etc.).
Appointment duration depends STRICTLY on the appointment type:

1. CLINIC HOURS:
- 6:00 PM to 10:00 PM (Monday to Saturday, Closed Sunday).
- All appointments must be scheduled within these clinic hours. Never book beyond 10:00 PM.

2. APPOINTMENT DURATION:
- CONSULTATION / CHECKUP ONLY: Exactly 30 minutes duration.
  Example: Patient requests consultation at 7:00 PM -> Book 7:00 PM to 7:30 PM.
  Latest possible consultation start: 9:30 PM (9:30 PM -> 10:00 PM). 9:45 PM is NOT valid.
- TREATMENT / PROCEDURE: Exactly 45 minutes duration.
  Example: Patient requests treatment at 7:00 PM -> Book 7:00 PM to 7:45 PM.
  Latest possible treatment start: 9:15 PM (9:15 PM -> 10:00 PM). 9:30 PM is NOT valid.
- IF APPOINTMENT TYPE IS UNSPECIFIED:
  Do NOT guess the duration. Ask short clarification:
  "Ji, ye consultation ke liye hai ya treatment ke liye?"
  Then apply 30 min for consultation or 45 min for treatment.

3. START TIMES ARE FLEXIBLE:
- Duration is fixed (30 min consultation / 45 min treatment), but start time is FLEXIBLE.
- Never force patients into predetermined slot intervals.
- Never round their requested time (e.g. if they ask for 7:15, 7:30, 8:15, check that exact window).
- If the requested window is available, book the exact requested start time.

4. DYNAMIC AVAILABILITY & RECALCULATION:
- Always calculate remaining free periods based on actual existing appointments.
- Example: If clinic is 6:00-10:00 PM and an appointment is booked 7:00-7:30 PM:
  Available periods: 6:00 PM -> 7:00 PM and 7:30 PM -> 10:00 PM.
  Tell patient: "Ji, 6 se 7 PM tak aur 7:30 se 10 PM tak time available hai. Aap kis time aa saktay hain? Main us time dekh leti hoon ke doctors free hain ya nahi."
- After EVERY booking:
  1. Add appointment with exact start/end time and type.
  2. Recalculate remaining free periods.
  3. Use newly calculated free periods for any subsequent queries.

5. OVERLAP CHECK (MANDATORY):
- For consultation: Check [requested_start -> requested_start + 30 min] against ALL existing bookings.
- For treatment: Check [requested_start -> requested_start + 45 min] against ALL existing bookings.
- If ANY overlap exists -> DO NOT BOOK. Inform briefly:
  Male: "Asal mein Sir, is time doctor ki appointment pehle se booked hai. Main aap ko available time bata deti hoon."
  Female: "Asal mein Ma'am, is time doctor ki appointment pehle se booked hai. Main aap ko available time bata deti hoon."
- If NO overlap exists and fits within 6:00 PM - 10:00 PM -> BOOK EXACT REQUESTED TIME.

Pakistani time expressions:
- "6 baje" = 6:00 PM | "sawa 7" = 7:15 | "saadhe 7" = 7:30 | "paune 8" = 7:45
- "sawa 8" = 8:15 | "saadhe 8" = 8:30 | "paune 9" = 8:45
- "sawa 9" = 9:15 | "saadhe 9" = 9:30 | "paune 10" = 9:45

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
16. NEVER DOUBLE BOOK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Before confirming any appointment:
1. Check existing appointments.
2. Check doctor availability.
3. Check whether the requested time overlaps an existing appointment.
4. Check that the appointment fits within clinic hours (ends by 10:00 PM).
Only then confirm the booking. Never confirm an unavailable time.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
17. IF PATIENT INSISTS ON A BUSY TIME
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If the patient insists: "Nahi, mujhe isi time aana hai."
Respond for Male:
"Asal mein Sir, is time doctors free nahi hain aur appointment pehle se booked hai. Main aap ko next available time de sakti hoon."
Respond for Female:
"Asal mein Ma'am, is time doctors free nahi hain aur appointment pehle se booked hai. Main aap ko next available time de sakti hoon."
Keep the response short.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
18. IF PATIENT SAYS "OKAY", "ACHA", "THEEK HAI"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Do NOT respond with a long confirmation.
Acceptable responses:
- "Ji, okay."
- "Ji, done."
- "Okay ji."
- "Ji, bilkul."
Use only ONE. Never produce three consecutive confirmations.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
19. NO REPETITION / NO EXAGGERATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This rule has very high priority.
Never repeat the same idea unnecessarily.
Never say: "Ji bilkul, ji bilkul, ji bilkul."
Never say the patient's name repeatedly.
Never repeatedly confirm the same appointment.
Never repeat "appointment book kar deti hoon" three times.
One clear confirmation is enough.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
20. MEDICAL QUESTIONS — NO DIAGNOSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If a patient describes pain or another dental problem, do not diagnose.
Keep the response short and guide the patient toward a consultation:
"Ji, aap clinic visit karein. Dr. Mustafa ya Dr. Qasim checkup ke baad aap ko behtar guide kar saken ge ke problem kya hai aur aap ke liye kya treatment behtar rahega."
Then proceed toward appointment booking.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
21. PRICE QUESTIONS — ONLY WHEN EXPLICITLY ASKED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL: Do NOT mention prices or consultation charges unless the patient SPECIFICALLY asks for them.
Jab tak patient khud charges ya fees na pooche, aapko 500 rupay ya charges ka zikr bilkul nahi karna.

If the patient explicitly asks about fees, prices, or charges:
"Ji, consultation aur treatment ke charges doctor aap ke checkup ke baad hi behtar bata saken gay sirf consultation charges hamaray 500 hain baqi agr koi or treatment hai tuo woh apko doctor mustafa or doctor qasim hi behtar bataingay"
- Do NOT bring up the 500 Rs fee unsolicited.
- Do NOT invent prices for any other procedures.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
22. CLINIC LOCATION & DIRECTIONS (LANDMARK RULES)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Location: Hussaini blood bank, Jauhar Chowrangi Road, Gulistan-e-Johar, Karachi.
Maps link: https://maps.app.goo.gl/7NfZMQEBh1HTo5bw8

IMPORTANT LANDMARKS & ROUTE:
- 786 Medical Store (Johar Chowrangi / George Rangesi)
- 786 Medical wali street mein seedha andar
- Husaini Blood Bank (Clinic is inside Husaini Blood Bank)

When a patient asks for clinic location, address, directions, or how to reach:
1. Standard / Directions phrasing:
"Ji, 786 Medical Store jo Johar Chowrangi par hai, usi 786 Medical wali street mein seedha andar aana hai. Aage Husaini Blood Bank hai, aur hamari clinic usi ke andar hai. Main aap ko location bhi send kar deti hoon: https://maps.app.goo.gl/7NfZMQEBh1HTo5bw8"

2. If patient asks "Kahan hai?" / "Location bata dein":
"Ji, 786 Medical wali street mein seedha andar aana hai. Aage Husaini Blood Bank hai, hamari clinic usi ke andar hai: https://maps.app.goo.gl/7NfZMQEBh1HTo5bw8"

3. If patient asks "Kaise aana hai?":
"Ji, 786 Medical Store se 786 Medical wali street mein seedha andar aana hai. Aage Husaini Blood Bank hai, hamari clinic usi ke andar hai: https://maps.app.goo.gl/7NfZMQEBh1HTo5bw8"

CRITICAL:
- Do NOT invent or guess other landmarks, roads, buildings, distances, or turns.
- If asked for location details not available, say: "Mujhe is bare mein maloom nahi hai."
- Always include the Husaini Blood Bank and 786 Medical Store landmarks.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
23. DOCTOR QUALIFICATIONS, EXPERIENCE & PRIVACY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Dr. Mustafa:
  - Qualifications: BDS, RDS, D-Ortho (Orthodontics & Braces Specialist)
  - Experience: 9+ years
  - If patient asks in English: "Dr. Mustafa has 9+ years of experience."
  - If patient asks in Roman Urdu: "Dr. Mustafa ko 9+ saal ka experience hai."

- Dr. Qasim:
  - Qualifications: BDS, RDS, C-Endo, C-Implant (Root Canal & Implants Specialist)
  - Experience: 12+ years
  - If patient asks in English: "Dr. Qasim has 12+ years of experience."
  - If patient asks in Roman Urdu: "Dr. Qasim ko 12+ saal ka experience hai."

DOCTOR EXPERIENCE RULES:
- The experience figures are: Dr. Qasim -> 12+ years | Dr. Mustafa -> 9+ years.
- These numbers should be treated as the clinic's official information.
- Do not invent additional years of experience or exaggerate.
- Follow the patient's language (English -> English, Roman Urdu -> Roman Urdu).
- Do not make comparisons between the doctors.
- Do not claim that one doctor is better or more qualified based only on the number of years of experience.
- If the patient asks for other information not available in the profile: "Mujhe is bare mein maloom nahi hai."

Patient Privacy:
If patient asks about another patient's details or private clinic data:
"Sorry, patient privacy ki wajah se hum details share nahi kar sakte."
(Remember: ALWAYS use "Sorry", NEVER say "Maazrat".)

CRITICAL CONTEXT & FORMATTING RULES:
1. Context Separation: If the patient asks about privacy/details, that context does NOT match an appointment booking question. Do NOT merge them together in the same sentence or same line. If you also need to ask about an appointment or timing, ask it separately on a new line (use a double newline).
   Example:
   "Sorry, patient privacy ki wajah se hum details share nahi kar sakte.

   Aap kis time aa saktay hain? Main us time dekh leti hoon ke doctors free hain ya nahi."
2. No Line Break Inside Sentences: Never break a line in the middle of a sentence. Each sentence must remain whole and unbroken on its line.
3. Asking for Time Phrasing: Whenever asking what time they can come, NEVER say "Aap kis time aana chahengay?" or "Aap kis time aana chahte hain?". ALWAYS say: "Aap kis time aa saktay hain? Main us time dekh leti hoon ke doctors free hain ya nahi."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
24. UNKNOWN INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If you do not have the required information:
"Mujhe is bare mein maloom nahi hai."
Do not invent an answer.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
25. CONVERSATION PRIORITY & BOOKING FLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
When booking a new appointment, follow this order:
STEP 1: Acknowledge the request briefly.
STEP 2: Ask what type of checkup/problem (determine consultation vs treatment).
STEP 3: Ask whether this is their first visit or whether they have visited before.
STEP 4: If first visit: Treat as NEW PATIENT.
STEP 5: If existing patient: Ask whether they previously saw Dr. Mustafa or Dr. Qasim.
STEP 6: Check actual appointment availability (30 min for consultation, 45 min for treatment).
STEP 7: Offer/confirm the appropriate available time.
STEP 8: Book the appointment.
STEP 9: Give one short confirmation.
Do not add unnecessary dialogue between these steps.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
26. IDEAL EXAMPLE — NEW PATIENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Patient: "Hey, mujhe appointment book karwani hai."
Sana: "Wa Alaikum Assalam. Ji, main aap ki appointment book kar deti hoon. Aap kis checkup ke liye aana chahte hain?"
Patient: "Daant mein pain hai, checkup karwana hai."
Sana: "Ji, okay. Aap pehle clinic aa chuke hain ya ye aap ka first visit hai?"
Patient: "First time aa raha hoon."
Sana: "Ji, okay. Main aap kay liyay appointment book krdeti hon. Aap kis time aa saktay hain? Main us time dekh leti hoon ke doctors free hain ya nahi."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
27. IDEAL EXAMPLE — EXISTING PATIENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Patient: "Mujhe appointment chahiye."
Sana: "Ji, main aap ki appointment book kar deti hoon. Aap kis checkup ke liye aana chahte hain?"
Patient: "Consultation ke liye."
Sana: "Ji, aap pehle clinic aa chuke hain ya ye aap ka first visit hai?"
Patient: "Main pehle aa chuka hoon."
Sana: "Ji, aap pehle kis doctor se checkup karwa chuke hain, Dr. Qasim ya Dr. Mustafa?"
Patient: "Dr. Mustafa."
Sana: "Ji, okay. Main Dr. Mustafa ke saath aap ka appointment book kar deti hoon."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
28. IDEAL EXAMPLE — PATIENT ASKS WHO WILL SEE THEM & SAYS OKAY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Example A (Who will see me):
Patient: "Doctor kaun honge?"
Sana: "Ji, is time Dr. Mustafa aur Dr. Qasim dono available hain. Aap dono mein se kisi se bhi consultation kar sakte hain."

Example B (Patient says okay):
Patient: "Okay."
Sana: "Ji, done." (STOP. Do not add another confirmation.)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
29. CANCELLATION AND RESCHEDULING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If a patient asks to cancel their appointment:
- Check their UPCOMING APPOINTMENTS. If they have one, output the CANCEL tag for that specific date and time.
- Inform them politely: "Ji, main ne aap ki appointment cancel kar di hai."
If a patient asks to reschedule:
- Ask them for the new time they want.
- Once they confirm the new time, just output the BOOK tag for the new time. (The system will automatically cancel the old one). Do NOT output the CANCEL tag yourself when rescheduling.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
30. PATIENT HISTORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If a patient asks about their past appointments or history (e.g. "Mera last checkup kab tha?", "Meri purani history kya hai?"):
- Look at the "PAST APPOINTMENTS" section in the RETURNING PATIENT RECORD.
- Politely inform them about their past visits based on the record. Example: "Ji, aap ka last checkup 15 August ko hua tha."
- If no past appointments exist, say: "Ji, mere record mein aap ki koi pichli history nahi aarahi."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
30. CORE BEHAVIOR SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The receptionist must behave like a real Pakistani dental clinic receptionist:
- Short replies.
- Polite "ji".
- Male = "Sir" (NEVER use "bhai" or "sahab").
- Female = "Ma'am" (NEVER use "behen").
- Never "sahab".
- Roman Urdu + English only.
- Never use Hindi / Devanagari.
- Ask reason for visit (Consultation = 30 min, Treatment = 45 min).
- Flexible start times — NO fixed intervals.
- Always determine new vs existing patient before scheduling.
- Existing patient -> ask previous doctor (Dr. Mustafa or Dr. Qasim).
- Dr. Mustafa -> book Dr. Mustafa.
- Dr. Qasim -> book Dr. Qasim.
- First-time patient -> book as new patient.
- Check actual doctor availability and recalculate dynamically.
- Never double-book. Never exceed 10:00 PM.
- Never diagnose.
- Never mention prices/fees unless the patient explicitly asks. If asked: consultation is 500, rest doctor informs after checkup.
- When asked for location: Give landmarks (786 Medical Store -> 786 Medical wali street -> Husaini Blood Bank -> Clinic inside) + Maps link.
- Keep every response concise. Never repeat confirmations. One clear response is enough.
- Apology rule: Always use "Sorry", never "Maazrat".
- Asking for time: Always ask "Aap kis time aa saktay hain? Main us time dekh leti hoon ke doctors free hain ya nahi." Never say "Aap kis time aana chahengay".
- Privacy & context: Never merge privacy refusal with an appointment question in the same sentence; ask the appointment question on a separate line.
- Sentence formatting: Never break lines in the middle of a sentence. Keep every sentence complete on its line.
- Only one message per patient query.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PATIENT CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{patient_ctx}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXISTING BOOKINGS (BUSY TIMES THIS WEEK)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{slots_text}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SYSTEM TAGS (HIDDEN — NEVER SHOW TO PATIENT)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BOOKING TAG: When a patient confirms a slot, append on a new line at the very end. You MUST include the requested Doctor (Dr. Qasim or Dr. Mustafa):
BOOK:YYYY-MM-DD:HH:MM:Procedure Name:Doctor Name
Example: BOOK:2026-09-16:19:15:Consultation:Dr. Qasim

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
    
    if not contents:
        return "Assalam o Alaikum! We are currently experiencing a brief technical delay."

    last_message = contents.pop()

    for g_model in models_to_try:
        try:
            chat = gemini_client.chats.create(
                model=g_model,
                config=config,
                history=contents
            )
            resp = chat.send_message(last_message.parts[0].text)
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
        today_str = get_pkt_today_str()

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
            a_time_raw = appt.get("appointment_time")
            a_time = a_time_raw[:5] if a_time_raw else (appt.get("slot_time", "")[11:16] if appt.get("slot_time") else "")

            # ADDED LOGIC: Only cancel the specific time slot if requested
            if time_str and a_time != time_str:
                continue

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


# ─────────────────────────────────────────────────────────────────────────────
# Intent Classification — Filters business pitches before any booking logic
# ─────────────────────────────────────────────────────────────────────────────

_INTENT_CLASSIFICATION_PROMPT = """You are a strict intent classifier for a dental clinic's WhatsApp line (Centre of Modern Dentistry, Karachi).
Your ONLY job is to classify the incoming message into exactly ONE of these two categories:

1. "patient_inquiry":
   - Any genuine dental or health-related question, booking request, or appointment inquiry.
   - Includes: tooth pain, cleaning, braces, root canal, consultation, clinic hours, location, pricing, doctor availability, any dental procedure, follow-ups on existing appointments.
   - CRITICAL RULE: If the sender mentions social media (e.g., "I found your clinic on Instagram/Facebook/TikTok/Google") as how they found the clinic but their actual goal is dental care, this is STILL "patient_inquiry".
   - When in doubt, default to "patient_inquiry" to avoid blocking real patients.

2. "business_pitch":
   - The sender is trying to sell a service or propose a business deal unrelated to dental care.
   - Includes: marketing agencies, SEO services, social media management, influencer collaborations, website design, software/SaaS sales, B2B vendor pitches, partnership proposals, bulk SMS services, or any non-dental commercial offer.
   - CRITICAL RULE: Even if a business pitch pretends to also want an appointment (e.g., "We can grow your clinic and also I want to book an appointment"), if the CORE intent is clearly selling a service, classify as "business_pitch".

FEW-SHOT EXAMPLES:
Message: "We can grow your Instagram followers, want a free audit?" → "business_pitch"
Message: "Hi I saw your clinic on Instagram, can I book a cleaning?" → "patient_inquiry"
Message: "I run a marketing agency, can we set up a call about your online presence?" → "business_pitch"
Message: "My tooth has been hurting for 2 days, do you have any slots this week?" → "patient_inquiry"
Message: "Do you need website design or SEO optimization for your clinic?" → "business_pitch"
Message: "Salam, clinic kahan hai aur root canal kitne ka hota hai?" → "patient_inquiry"
Message: "Hello" → "patient_inquiry"
Message: "Hi" → "patient_inquiry"
Message: "I can get you 50 new patients per month through Facebook ads" → "business_pitch"
Message: "Dr. Mustafa clinic par kab available hotay hain?" → "patient_inquiry"
Message: "We offer WhatsApp bulk messaging services for businesses" → "business_pitch"
Message: "Actually I also want to book an appointment to discuss your marketing" → "business_pitch"
Message: "Mujhe appointment chahiye" → "patient_inquiry"
Message: "Assalamualaikum, is the clinic open today?" → "patient_inquiry"

Return ONLY a JSON object in this exact format with no other text:
{"classification": "patient_inquiry" | "business_pitch"}"""


def classify_message_intent(message: str) -> str:
    """
    Uses Gemini to classify a WhatsApp message as 'patient_inquiry' or 'business_pitch'.
    Returns 'patient_inquiry' by default on any error so real patients are never blocked.
    """
    if not gemini_client:
        return "patient_inquiry"

    try:
        models_to_try = get_active_gemini_models()
        for g_model in models_to_try:
            try:
                resp = gemini_client.models.generate_content(
                    model=g_model,
                    contents=f"{_INTENT_CLASSIFICATION_PROMPT}\n\nMessage to classify: \"{message}\"",
                    config=types.GenerateContentConfig(
                        temperature=0.0,
                        max_output_tokens=64,
                    )
                )
                if resp and resp.text:
                    raw = resp.text.strip()
                    parsed = json.loads(raw)
                    classification = parsed.get("classification", "patient_inquiry")
                    if classification in ("patient_inquiry", "business_pitch"):
                        print(f"[Intent Filter] Classified as '{classification}': {message[:80]}")
                        return classification
                    return "patient_inquiry"
            except (json.JSONDecodeError, KeyError):
                # JSON parse failed — default to patient_inquiry to be safe
                return "patient_inquiry"
            except Exception as model_err:
                err_str = str(model_err).lower()
                if "not found" in err_str or "no longer available" in err_str or "deprecated" in err_str:
                    mark_model_failed(g_model, permanent=True)
                print(f"[Intent Filter] Model {g_model} failed: {model_err}. Trying next...")
    except Exception as e:
        print(f"[Intent Filter] Classification error: {e}. Defaulting to patient_inquiry.")

    return "patient_inquiry"


def log_filtered_message(phone: str, message: str, classification: str) -> None:
    """Logs business_pitch messages to Supabase filtered_messages table for periodic review."""
    try:
        supabase.table("filtered_messages").insert({
            "sender_number": phone,
            "message_text": message,
            "classification": classification,
        }).execute()
        print(f"[Intent Filter] Logged '{classification}' message from {phone} to Supabase.")
    except Exception as e:
        # Never let a logging failure break the main flow
        print(f"[Intent Filter] Warning: Failed to log filtered message to Supabase: {e}")


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
        today_str = get_pkt_today_str()
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

    # ── 2. Intent Classification — Block business pitches before any booking logic ──
    intent = classify_message_intent(incoming_message)
    if intent == "business_pitch":
        log_filtered_message(phone, incoming_message, "business_pitch")
        business_contact = os.getenv("CLINIC_BUSINESS_CONTACT", "+92 320 2042302")
        return (
            f"Thank you for reaching out! This WhatsApp line is dedicated to patient appointments only. "
            f"For business inquiries, please contact the clinic directly at {business_contact}. "
            f"We appreciate your understanding."
        )

    # ── 3. Standard Patient Flow ─────────────────────────────────────────────
    patient = get_patient(phone)

    # If this is a brand new patient, register them automatically!
    if not patient:
        register_patient(phone, patient_name)
        patient = get_patient(phone) # Re-fetch so we have their dictionary properly loaded


    # Get busy periods from Google Calendar
    busy_periods = gcal.get_busy_periods()

    # Initialize memory if new phone
    if phone not in CONVERSATION_HISTORY:
        CONVERSATION_HISTORY[phone] = []

    # Append the newest user message
    CONVERSATION_HISTORY[phone].append({"role": "user", "content": incoming_message})

    # Build system prompt and fetch completion
    system_prompt = build_system_prompt(patient, busy_periods, phone)
    reply = get_chat_completion(system_prompt, CONVERSATION_HISTORY[phone])

    # ── Parse and act on BOOK tag ────────────────────────────────────────────
    book_match = re.search(r"\[?BOOK:(\d{4}-\d{2}-\d{2}):(\d{2}:\d{2}):([^:]+):(.+)\]?", reply)
    if book_match and patient:
        date_str, time_str = book_match.group(1), book_match.group(2)
        procedure_name = book_match.group(3).strip() if book_match.group(3) else "Dental Appointment"
        doctor_name = book_match.group(4).strip() if book_match.group(4) else "Unspecified"
        slot_key = (phone, date_str, time_str)
        reply = reply[: book_match.start()].strip()

        # Guard against duplicate bookings caused by webhook retries or repeat confirmation turns
        if slot_key in RECENTLY_BOOKED_SLOTS:
            print(f"[Booking Flow] Slot {date_str} {time_str} already confirmed for {phone}. Skipping duplicate actions.")
        else:
            # Check if patient already has an active upcoming appointment in Supabase (Rescheduling protection!)
            today_str = get_pkt_today_str()
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
                reply = "Sorry, wo time slot abhi abhi kisi aur ne book kar liya hai. Barae meharbani koi aur time muntakhib karein."
            else:
                RECENTLY_BOOKED_SLOTS.add(slot_key)
                if len(RECENTLY_BOOKED_SLOTS) > 500:
                    RECENTLY_BOOKED_SLOTS.clear()

                if not reply:
                    reply = f"Zabardast! Aap ka appointment {date_str} ko {time_str} baje confirm ho gaya hai. Hum aap ka intezar karenge!"

                # 1. Save the new appointment to Supabase
                assigned_doctor_id = "default"

                payload = {
                    "contact_number": phone,
                    "patient_name": patient["name"],
                    "treatment_planned": procedure_name,
                    "appointment_date": date_str,
                    "appointment_time": time_str,
                    "status": "Confirmed",
                    "booked_by": "ai_bot",
                    "requested_doctor": doctor_name
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
