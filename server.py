from flask import Flask, redirect, url_for, request, jsonify, render_template
import os
from downloader import download_manager
from config import load_config, save_config
from spotify_import import load_playlists, load_liked_songs

app = Flask(__name__)
app.secret_key = os.urandom(24)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/playlists")
def api_playlists():
    config = load_config()
    export_folder = config.get("spotify_export_folder")
    playlists = load_playlists(export_folder)
    # Don't send all tracks to save bandwidth in the list view
    summary = []
    for p in playlists:
        summary.append({
            "id": p["id"],
            "name": p["name"],
            "count": p["count"],
            "image": None
        })
    return jsonify(summary)

@app.route("/api/playlist/<id>")
def api_playlist_tracks(id):
    config = load_config()
    export_folder = config.get("spotify_export_folder")
    playlists = load_playlists(export_folder)

    # Find the playlist by our generated slug ID
    playlist = next((p for p in playlists if p["id"] == id), None)
    if not playlist:
        return jsonify({"error": "not found"}), 404

    return jsonify(playlist["tracks"])

@app.route("/api/library")
def api_library():
    config = load_config()
    export_folder = config.get("spotify_export_folder")
    tracks = load_liked_songs(export_folder)
    return jsonify(tracks)

@app.route("/api/download", methods=["POST"])
def api_download():
    data = request.json
    task_type = data.get("type") # "track" or "playlist"
    item_id = data.get("id")
    name = data.get("name", "Unknown")

    if task_type not in ["track", "playlist"]:
        return jsonify({"error": "invalid type"}), 400

    if task_type == "playlist":
        # For local exports, we should queue each track in the playlist individually
        # to respect the concurrency limit, since we already have the track list.
        config = load_config()
        export_folder = config.get("spotify_export_folder")
        playlists = load_playlists(export_folder)
        playlist = next((p for p in playlists if p["id"] == item_id), None)
        if playlist:
            for track in playlist["tracks"]:
                download_manager.add_task("track", track["uri"], f"{track['artist']} - {track['name']}")
            return jsonify({"status": "queued_all"})
        return jsonify({"error": "playlist not found"}), 404

    task_id = download_manager.add_task(task_type, item_id, name)
    return jsonify({"task_id": task_id})

@app.route("/api/download/status")
def api_download_status():
    return jsonify(download_manager.get_status())

@app.route("/settings")
def settings_page():
    config = load_config()
    return render_template("settings.html", config=config)

@app.route("/api/settings", methods=["POST"])
def api_save_settings():
    data = request.json
    save_config(data)
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5174, debug=True)
