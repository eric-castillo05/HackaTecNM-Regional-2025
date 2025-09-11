import json
from typing import Any

import requests
from flask.cli import load_dotenv

from flaskr.utils import Config


class gemini_service:
    def init_app(self) -> None:
        pass
    def ask(self, text: str) -> None | tuple[str, Any] | tuple[str, int, str]:
        print("DEBUG URL:", Config.URL)
        print("DEBUG KEY:", Config.GEMINI_KEY)

        try:
            headers = {
                "Content-Type": "application/json",
                "X-goog-api-key": Config.GEMINI_KEY,
            }

            data = {
                "contents": [
                    {
                        "parts": [
                            {
                                "text": (
                                    text
                                )
                            }
                        ]
                    }
                ]
            }

            response = requests.post(Config.URL, headers=headers, data=json.dumps(data))
            if response.status_code == 200:
                result = response.json()
                return "Success", 200, result["candidates"][0]["content"]["parts"][0]["text"]

            return "Error:", response.status_code, response.text

        except Exception as e:
            print(e)
            return "Error", 500, str(e)

