import os
from spotipy.oauth2 import SpotifyOAuth
from config import CONFIG_DIR
from dotenv import load_dotenv

load_dotenv()

CLIENT_ID = os.getenv("SPOTIPY_CLIENT_ID")
CLIENT_SECRET = os.getenv("SPOTIPY_CLIENT_SECRET")
REDIRECT_URI = "http://127.0.0.1:5174/callback"
CACHE_PATH = CONFIG_DIR / "spotify_token.json"
SCOPE = "playlist-read-private playlist-read-collaborative user-library-read"

def get_spotify_oauth():
    return SpotifyOAuth(
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        redirect_uri=REDIRECT_URI,
        scope=SCOPE,
        cache_path=str(CACHE_PATH),
        show_dialog=True
    )
