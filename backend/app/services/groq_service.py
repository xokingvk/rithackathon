"""
Groq chatbot integration.
Set GROQ_API_KEY in your .env to enable live responses; without it,
the service returns a helpful canned reply so the widget still works.
"""
import logging
from typing import Optional

import httpx

from app.config import get_settings

logger = logging.getLogger("voltaiq.chatbot")
settings = get_settings()

SYSTEM_PROMPT = (
    "You are Cell Assistant, the in-app support agent for VoltaiQ, an AI battery "
    "health analytics platform. You help users interpret state-of-health (SoH) "
    "scores, remaining useful life (RUL) predictions, and charging efficiency "
    "reports, and you give practical, safe charging recommendations. Keep answers "
    "concise (2-4 sentences) and concrete. If asked about anything unrelated to "
    "batteries, energy, or the platform, politely redirect to battery topics."
)


async def get_chat_reply(message: str, context: Optional[dict] = None) -> str:
    if not settings.GROQ_API_KEY:
        return (
            "Chatbot is running in demo mode — add GROQ_API_KEY to your .env to enable "
            "live answers. In the meantime: check the Overview tab for SoH/RUL trends, "
            "or the Fleet tab for packs flagged at-risk."
        )

    context_note = f"\nCurrent page context: {context}" if context else ""
    payload = {
        "model": settings.GROQ_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT + context_note},
            {"role": "user", "content": message},
        ],
        "temperature": 0.4,
        "max_tokens": 300,
    }
    headers = {"Authorization": f"Bearer {settings.GROQ_API_KEY}", "Content-Type": "application/json"}

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(settings.GROQ_API_URL, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"].strip()
    except Exception as exc:
        logger.error("Groq chat request failed: %s", exc)
        return "I'm having trouble reaching the assistant service right now. Please try again shortly."
