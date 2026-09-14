import os
import asyncio
import httpx
from fastapi import Request, Response, BackgroundTasks
from agent import handle_message

# NOTE: META_ACCESS_TOKEN is read fresh on every request so .env changes
# are picked up without restarting the server.
def _get_graph_url():
    phone_id = os.getenv("META_PHONE_NUMBER_ID")
    return f"https://graph.facebook.com/v19.0/{phone_id}/messages"


# ─────────────────────────────────────────────────────────────────────────────
# Webhook verification  (GET)
# ─────────────────────────────────────────────────────────────────────────────

async def verify_webhook(request: Request) -> Response:
    """
    Meta calls this GET endpoint once when you register the webhook in the
    Meta Developer Console.
    """
    params        = dict(request.query_params)
    mode          = params.get("hub.mode")
    token         = params.get("hub.verify_token")
    challenge     = params.get("hub.challenge")
    expected_token = os.getenv("META_VERIFY_TOKEN") or os.getenv("VERIFY_TOKEN") or "clinicdentalagent"

    if mode == "subscribe" and token == expected_token:
        print("[Webhook] OK Verification successful.")
        return Response(content=challenge, media_type="text/plain")

    print(f"[Webhook] FAILED Verification failed - token mismatch (received '{token}', expected '{expected_token}').")
    return Response(content="Forbidden", status_code=403)


PROCESSED_MESSAGE_IDS = set()


# ─────────────────────────────────────────────────────────────────────────────
# Voice Note (Audio) Transcription via Gemini
# ─────────────────────────────────────────────────────────────────────────────

VOICE_GEMINI_MODELS = [
    "gemini-3.6-flash",
    "gemini-3.7-flash",
    "gemini-3.8-flash",
    "gemini-flash-latest"
]

async def transcribe_voice_note(audio_id: str) -> str:
    """Downloads an audio voice note from Meta and transcribes it using Google Gemini."""
    token = os.getenv("META_ACCESS_TOKEN")
    headers = {"Authorization": f"Bearer {token}"}

    try:
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            # 1. Fetch media URL from Meta Graph API
            info_url = f"https://graph.facebook.com/v19.0/{audio_id}"
            resp = await client.get(info_url, headers=headers)
            if resp.status_code != 200:
                print(f"[VoiceNote] Failed to fetch media URL for {audio_id}: {resp.text}")
                return ""
            
            media_data = resp.json()
            download_url = media_data.get("url")
            raw_mime = media_data.get("mime_type", "audio/ogg")
            clean_mime = raw_mime.split(";")[0].strip()

            # 2. Download audio bytes (follow_redirects handles Meta's 302 to CDN)
            audio_resp = await client.get(download_url, headers=headers)
            if audio_resp.status_code != 200:
                print(f"[VoiceNote] Failed to download audio: {audio_resp.status_code}")
                return ""
            audio_bytes = audio_resp.content

        # 3. Transcribe audio with Gemini (with resilient model fallbacks)
        from google import genai
        from google.genai import types

        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if not gemini_api_key:
            print("[VoiceNote] GEMINI_API_KEY not configured.")
            return ""

        g_client = genai.Client(api_key=gemini_api_key)

        prompt = (
            "Transcribe this WhatsApp voice message from a patient verbatim. "
            "If the spoken language is Urdu or Hindi, transcribe it in ROMAN URDU (using English/Latin alphabet, e.g. 'Mera dant me dard hai'). "
            "If English, transcribe in English. NEVER output Hindi script (Devanagari like 'हमारे'). "
            "Return ONLY the transcribed text without quotes or explanations."
        )

        for model_name in VOICE_GEMINI_MODELS:
            try:
                trans_resp = g_client.models.generate_content(
                    model=model_name,
                    contents=[
                        types.Part.from_bytes(data=audio_bytes, mime_type=clean_mime),
                        prompt
                    ]
                )
                transcribed = trans_resp.text.strip() if trans_resp and trans_resp.text else ""
                if transcribed:
                    print(f"[VoiceNote] Transcribed with {model_name}: '{transcribed}'")
                    return transcribed
            except Exception as model_err:
                print(f"[VoiceNote] Model {model_name} failed: {model_err}. Trying next model...")

        print("[VoiceNote] All Gemini transcription models failed.")
        return ""

    except Exception as e:
        print(f"[VoiceNote] Transcription error: {e}")
        return ""


# ─────────────────────────────────────────────────────────────────────────────
# Receive incoming messages  (POST)
# ─────────────────────────────────────────────────────────────────────────────

# Per-phone asyncio Locks to serialize incoming messages for the same patient
PHONE_LOCKS: dict[str, asyncio.Lock] = {}

def get_phone_lock(phone: str) -> asyncio.Lock:
    if phone not in PHONE_LOCKS:
        PHONE_LOCKS[phone] = asyncio.Lock()
    return PHONE_LOCKS[phone]


async def process_message_background(
    msg_id: str,
    sender_phone: str,
    sender_name: str,
    msg_type: str,
    text_body: str,
    audio_id: str | None,
    loc_info: str | None
):
    """Background task to handle voice transcription, AI processing, and WhatsApp reply safely."""
    lock = get_phone_lock(sender_phone)
    async with lock:
        text = ""

        if msg_type == "text":
            text = text_body.strip()
        elif msg_type in ("audio", "voice") and audio_id:
            print(f"[WhatsApp] Processing incoming voice note in background for {sender_phone} (id: {audio_id})")
            text = await transcribe_voice_note(audio_id)
        elif msg_type == "location" and loc_info:
            text = f"[Patient shared location: {loc_info}. Please guide them with clinic address and directions]"

        if not text:
            print(f"[WhatsApp] Empty message text after processing for {sender_phone}. Skipping.")
            return

        print(f"[WhatsApp] IN {sender_phone}: {text}")

        # Process conversation through Gemini AI logic in threadpool
        reply_text = await asyncio.to_thread(handle_message, sender_phone, text, sender_name)

        if reply_text:
            await send_whatsapp_message(sender_phone, reply_text)
            print(f"[WhatsApp] OUT {sender_phone}: {reply_text}")


async def whatsapp_webhook(request: Request, background_tasks: BackgroundTasks) -> Response:
    """
    Meta POSTs here for incoming text, audio voice notes, or location pins.
    Returns 200 OK immediately (< 10ms) to prevent Meta webhook retries.
    """
    body = await request.json()
    print("--- RAW PAYLOAD ---")
    print(body)

    try:
        value = body["entry"][0]["changes"][0]["value"]

        if "messages" not in value or not value["messages"]:
            return Response(content="ok", status_code=200)

        msg          = value["messages"][0]
        msg_id       = msg["id"]
        sender_phone = msg["from"]                        # e.g. "923001234567"
        msg_type     = msg.get("type", "text")

        # Instantly deduplicate: if Meta sends duplicate webhook retries, drop them immediately
        if msg_id in PROCESSED_MESSAGE_IDS:
            print(f"[Webhook] Duplicate message ID {msg_id} dropped at webhook entrypoint.")
            return Response(content="ok", status_code=200)
        PROCESSED_MESSAGE_IDS.add(msg_id)

        if len(PROCESSED_MESSAGE_IDS) > 2000:
            PROCESSED_MESSAGE_IDS.clear()

        # Extract patient's WhatsApp name
        sender_name = "Unknown Patient"
        if "contacts" in value and len(value["contacts"]) > 0:
            sender_name = value["contacts"][0].get("profile", {}).get("name", "Unknown Patient")

        text_body = ""
        audio_id = None
        loc_info = None

        if msg_type == "text":
            text_body = msg.get("text", {}).get("body", "")
        elif msg_type in ("audio", "voice"):
            audio_obj = msg.get("audio") or msg.get("voice") or {}
            audio_id = audio_obj.get("id")
        elif msg_type == "location":
            loc = msg.get("location", {})
            loc_info = loc.get("name") or loc.get("address") or f"coordinates ({loc.get('latitude')}, {loc.get('longitude')})"

        # Schedule processing in background and return 200 OK IMMEDIATELY to Meta
        background_tasks.add_task(
            process_message_background,
            msg_id,
            sender_phone,
            sender_name,
            msg_type,
            text_body,
            audio_id,
            loc_info
        )

    except (KeyError, IndexError, TypeError) as e:
        print(f"[Webhook] Unexpected payload shape: {e}")

    return Response(content="ok", status_code=200)


# ─────────────────────────────────────────────────────────────────────────────
# Send a WhatsApp message via Meta Graph API
# ─────────────────────────────────────────────────────────────────────────────

async def send_whatsapp_message(to: str, text: str) -> None:
    """
    POST a text message to Meta Graph API.
    `to` — phone number WITHOUT the '+', e.g. '923001234567'
    """
    token = os.getenv("META_ACCESS_TOKEN")
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type":  "application/json",
    }
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type":    "individual",
        "to":                to,
        "type":              "text",
        "text":              {"body": text},
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(_get_graph_url(), headers=headers, json=payload)
        if resp.status_code != 200:
            print(f"[Meta API] Send error {resp.status_code}: {resp.text}")
        else:
            print(f"[Meta API] Message sent OK to {to}")

