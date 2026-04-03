import os
import json
import glob
import re

def slugify(text):
    return re.sub(r'[\W_]+', '-', text.lower()).strip('-')

def load_playlists(export_folder):
    if not export_folder or not os.path.exists(export_folder):
        return []

    playlists = []
    playlist_files = glob.glob(os.path.join(export_folder, "Playlist*.json"))

    # Also check for MyData subdirectory if users just selected the root export folder
    if not playlist_files:
        playlist_files = glob.glob(os.path.join(export_folder, "MyData", "Playlist*.json"))

    for file_path in playlist_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                # Sometimes it's a list, sometimes a dict with "playlists"
                items = data if isinstance(data, list) else data.get("playlists", [])

                for p in items:
                    name = p.get("name", "Unknown Playlist")
                    tracks = []
                    for item in p.get("items", []):
                        track_data = item.get("track")
                        if track_data:
                            tracks.append({
                                "id": track_data.get("trackUri", "").split(":")[-1],
                                "name": track_data.get("trackName", "Unknown"),
                                "artist": track_data.get("artistName", "Unknown"),
                                "album": track_data.get("albumName", "Unknown"),
                                "uri": track_data.get("trackUri", "")
                            })

                    if name:
                        playlists.append({
                            "id": slugify(name),
                            "name": name,
                            "count": len(tracks),
                            "tracks": tracks,
                            "image": None # Local export doesn't have images
                        })
        except Exception as e:
            print(f"Error loading {file_path}: {e}")

    return playlists

def load_liked_songs(export_folder):
    if not export_folder or not os.path.exists(export_folder):
        return []

    # Check root and MyData/
    paths = [
        os.path.join(export_folder, "YourLibrary.json"),
        os.path.join(export_folder, "MyData", "YourLibrary.json")
    ]

    for file_path in paths:
        if os.path.exists(file_path):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    tracks_data = data.get("tracks", [])
                    tracks = []
                    for t in tracks_data:
                        tracks.append({
                            "id": t.get("uri", "").split(":")[-1],
                            "name": t.get("track", "Unknown"),
                            "artist": t.get("artist", "Unknown"),
                            "album": t.get("album", "Unknown"),
                            "uri": t.get("uri", "")
                        })
                    return tracks
            except Exception as e:
                print(f"Error loading {file_path}: {e}")

    return []
