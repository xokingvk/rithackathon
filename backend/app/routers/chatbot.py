"""
/api/chatbot — Groq-backed assistant, with chat history logging.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from app.schemas import ChatMessageIn, ChatMessageOut
from app.services.groq_service import get_chat_reply

router = APIRouter(prefix="/chatbot", tags=["chatbot"])


@router.post("/message", response_model=ChatMessageOut)
async def send_message(payload: ChatMessageIn, db: Session = Depends(get_db)):
    db.add(models.ChatLog(role="user", message=payload.message, session_id=payload.session_id))
    db.commit()

    reply = await get_chat_reply(payload.message, payload.context)

    db.add(models.ChatLog(role="assistant", message=reply, session_id=payload.session_id))
    db.commit()

    return ChatMessageOut(reply=reply)
