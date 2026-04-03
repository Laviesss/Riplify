import os
from spotify_scraper import SpotifyClient
from spotdl.providers.audio import YouTubeMusic

class ScraperClient:
    def __init__(self):
        self.client = SpotifyClient()
        self.yt_music = YouTubeMusic()

    def search(self, query, limit=20):
        # Fallback to YouTube Music search since SpotifyScraper lacks public search
        try:
            results = self.yt_music.get_results(query)
            tracks = []
            for t in results[:limit]:
                tracks.append({
                    "id": t.result_id,
                    "name": t.name,
                    "artist": ", ".join(t.artists) if t.artists else (t.author if t.author else "Unknown Artist"),
                    "album": t.album if t.album else "YouTube Result",
                    "uri": t.url, # Use YT URL as URI if search
                    "image": None
                })
            return tracks
        except Exception as e:
            print(f"Search error: {e}")
            return []

    def get_playlist(self, url):
        try:
            p = self.client.get_playlist_info(url)
            tracks = []
            for t in p.get('tracks', []):
                tracks.append({
                    "id": t.get('id'),
                    "name": t.get('name'),
                    "artist": ", ".join([a.get('name') for a in t.get('artists', [])]),
                    "album": t.get('album', {}).get('name'),
                    "uri": t.get('uri'),
                    "image": t.get('album', {}).get('images', [{}])[0].get('url')
                })
            return {"name": p.get('name', 'Unknown Playlist'), "tracks": tracks}
        except Exception as e:
            print(f"Playlist error: {e}")
            return {"name": "Unknown Playlist", "tracks": []}

    def get_album(self, url):
        try:
            a = self.client.get_album_info(url)
            tracks = []
            for t in a.get('tracks', []):
                tracks.append({
                    "id": t.get('id'),
                    "name": t.get('name'),
                    "artist": ", ".join([art.get('name') for art in a.get('artists', [])]),
                    "album": a.get('name'),
                    "uri": t.get('uri'),
                    "image": a.get('images', [{}])[0].get('url')
                })
            return {"name": a.get('name', 'Unknown Album'), "tracks": tracks}
        except Exception as e:
            print(f"Album error: {e}")
            return {"name": "Unknown Album", "tracks": []}

    def get_track(self, url):
        try:
            t = self.client.get_track_info(url)
            return {
                "id": t.get('id'),
                "name": t.get('name'),
                "artist": ", ".join([a.get('name') for a in t.get('artists', [])]),
                "album": t.get('album', {}).get('name'),
                "uri": t.get('uri'),
                "image": t.get('album', {}).get('images', [{}])[0].get('url')
            }
        except Exception as e:
            print(f"Track error: {e}")
            return None

    def get_artist_top_tracks(self, url):
        try:
            artist = self.client.get_artist_info(url)
            tracks = []
            for t in artist.get('top_tracks', []):
                tracks.append({
                    "id": t.get('id'),
                    "name": t.get('name'),
                    "artist": artist.get('name'),
                    "album": t.get('album', {}).get('name'),
                    "uri": t.get('uri'),
                    "image": t.get('album', {}).get('images', [{}])[0].get('url')
                })
            return {"name": f"Top tracks: {artist.get('name')}", "tracks": tracks}
        except Exception as e:
            print(f"Artist error: {e}")
            return {"name": "Unknown Artist", "tracks": []}

scraper_client = ScraperClient()
