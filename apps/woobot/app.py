from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import woobot

app = FastAPI(title="WooBot Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class WoobotRequest(BaseModel):
    language: str = "english"


@app.get("/languages")
def get_languages():
    return {
        "languages": ["english", "french", "german", "icelandic"],
    }


@app.post("/woobot")
def generate_message(payload: WoobotRequest):
    woobot.lang = payload.language.strip().lower()
    message = woobot.woobot()
    return {
        "message": message,
        "language": woobot.lang,
    }
