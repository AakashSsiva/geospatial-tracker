import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# API Keys
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
MAPBOX_TOKEN = os.getenv("MAPBOX_TOKEN", "")

# Polling Configuration
POLL_INTERVAL_SECONDS = int(os.getenv("POLL_INTERVAL", "10"))
OPENSKY_BBOX = {
    "lamin": 25.0,
    "lomin": -125.0,
    "lamax": 50.0,
    "lomax": -66.0,
}

# Gemini Model
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
