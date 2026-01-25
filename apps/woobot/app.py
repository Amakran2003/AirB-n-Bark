from fastapi import FastAPI
from pydantic import BaseModel

import woobot

app = FastAPI(title="WooBot Service")


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
