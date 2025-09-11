import os

from flask.cli import load_dotenv

load_dotenv()
class Config:
    GEMINI_KEY = os.environ.get('GEMINI_KEY')
    URL = os.environ.get('URL')