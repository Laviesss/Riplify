from flask import Flask, redirect, url_for, session, request, jsonify, render_template
import os
import spotipy
from spotify_auth import get_spotify_oauth
from downloader import download_manager
from config import load_config, save_config
from dotenv import set_key

app = Flask(__name__)
app.secret_key = os.urandom(24)

def get_spotify():
    auth_manager = get_spotify_oauth()
    if not auth_manager.validate_token(auth_manager.cache_handler.get_cached_token()):
        return None
    return spotipy.Spotify(auth_manager=auth_manager)

@app.route("/")
def index():
    if not get_spotify():
        return redirect(url_for("login"))
    return render_template("index.html")

@app.route("/login")
def login():
    auth_manager = get_spotify_oauth()
    auth_url = auth_manager.get_authorize_url()
    return render_template("login.html", auth_url=auth_url)

@app.route("/callback")
def callback():
    auth_manager = get_spotify_oauth()
    auth_manager.get_access_token(request.args.get("code"))
    return redirect(url_for("index"))

@app.route("/logout")
def logout():
    auth_manager = get_spotify_oauth()
    if os.path.exists(auth_manager.cache_handler.cache_path):
        os.remove(auth_manager.cache_handler.cache_path)
    return redirect(url_for("login"))

@app.route("/api/playlists")
def api_playlists():
    sp = get_spotify()
    if not sp:
        return jsonify({"error": "unauthorized"}), 401

    playlists = []
    results = sp.current_user_playlists()
    while results:
        for item in results["items"]:
            playlists.append({
                "id": item["id"],
                "name": item["name"],
                "count": item["tracks"]["total"],
                "image": item["images"][0]["url"] if item["images"] else None
            })
        if results["next"]:
            results = sp.next(results)
        else:
            results = None
    return jsonify(playlists)

@app.route("/api/playlist/<playlist_id>")
def api_playlist_tracks(playlist_id):
    sp = get_spotify()
    if not sp:
        return jsonify({"error": "unauthorized"}), 401

    tracks = []
    results = sp.playlist_tracks(playlist_id)
    while results:
        for item in results["items"]:
            if not item["track"]: continue
            track = item["track"]
            tracks.append({
                "id": track["id"],
                "name": track["name"],
                "artist": ", ".join([a["name"] for a in track["artists"]]),
                "album": track["album"]["name"],
                "duration": track["duration_ms"],
                "image": track["album"]["images"][0]["url"] if track["album"]["images"] else None
            })
        if results["next"]:
            results = sp.next(results)
        else:
            results = None
    return jsonify(tracks)

@app.route("/api/library")
def api_library():
    sp = get_spotify()
    if not sp:
        return jsonify({"error": "unauthorized"}), 401

    tracks = []
    results = sp.current_user_saved_tracks()
    while results:
        for item in results["items"]:
            track = item["track"]
            tracks.append({
                "id": track["id"],
                "name": track["name"],
                "artist": ", ".join([a["name"] for a in track["artists"]]),
                "album": track["album"]["name"],
                "duration": track["duration_ms"],
                "image": track["album"]["images"][0]["url"] if track["album"]["images"] else None
            })
        if results["next"]:
            results = sp.next(results)
        else:
            results = None
    return jsonify(tracks)

@app.route("/api/download", methods=["POST"])
def api_download():
    data = request.json
    task_type = data.get("type") # "track" or "playlist"
    item_id = data.get("id")
    name = data.get("name", "Unknown")

    if task_type not in ["track", "playlist"]:
        return jsonify({"error": "invalid type"}), 400

    task_id = download_manager.add_task(task_type, item_id, name)
    return jsonify({"task_id": task_id})

@app.route("/api/download/status")
def api_download_status():
    return jsonify(download_manager.get_status())

@app.route("/settings")
def settings_page():
    config = load_config()
    config["spotify_client_id"] = os.getenv("SPOTIPY_CLIENT_ID", "")
    config["spotify_client_secret"] = os.getenv("SPOTIPY_CLIENT_SECRET", "")
    return render_template("settings.html", config=config)

@app.route("/api/settings", methods=["POST"])
def api_save_settings():
    data = request.json

    # Extract spotify credentials if present
    spotify_id = data.pop("spotify_client_id", None)
    spotify_secret = data.pop("spotify_client_secret", None)

    if spotify_id and spotify_secret:
        env_path = os.path.join(os.getcwd(), ".env")
        set_key(env_path, "SPOTIPY_CLIENT_ID", spotify_id)
        set_key(env_path, "SPOTIPY_CLIENT_SECRET", spotify_secret)
        os.environ["SPOTIPY_CLIENT_ID"] = spotify_id
        os.environ["SPOTIPY_CLIENT_SECRET"] = spotify_secret

    save_config(data)
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    app.run(port=5174, debug=True)
