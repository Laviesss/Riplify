import threading
import queue
import time
import os
from spotdl import Spotdl
from config import load_config
from dotenv import load_dotenv

load_dotenv()

class DownloadTask:
    def __init__(self, task_type, item_id, name):
        self.id = f"{task_type}_{int(time.time())}_{name[:10]}"
        self.type = task_type
        self.item_id = item_id # URI or URL
        self.name = name
        self.status = "queued" # queued, downloading, done, error
        self.progress = 0

class DownloadManager:
    def __init__(self):
        self.tasks = {}
        self.task_list = [] # To keep order
        self.queue = queue.Queue()
        self.max_concurrent = 2
        self.lock = threading.Lock()
        self.stop_event = threading.Event()

        # Start worker threads
        for _ in range(self.max_concurrent):
            threading.Thread(target=self._worker, daemon=True).start()

    def add_task(self, task_type, item_id, name):
        with self.lock:
            task = DownloadTask(task_type, item_id, name)
            self.tasks[task.id] = task
            self.task_list.append(task)
            self.queue.put(task)
            return task.id

    def _worker(self):
        while not self.stop_event.is_set():
            try:
                task = self.queue.get(timeout=1)
                self._run_task(task)
                self.queue.task_done()
            except queue.Empty:
                continue
            except Exception as e:
                print(f"Worker error: {e}")

    def _run_task(self, task):
        config = load_config()

        downloader_settings = {
            "output": os.path.join(config["output_folder"], "{artist}/{album}/{title}.{output-ext}"),
            "format": config["audio_format"],
            "bitrate": config["audio_quality"],
            "ffmpeg": config["ffmpeg_path"],
            "threads": 1,
        }

        try:
            with self.lock:
                task.status = "downloading"
                task.progress = 10

            sdl = Spotdl(
                downloader_settings=downloader_settings
            )

            # Convert URI to URL
            # spotify:track:XXXX -> https://open.spotify.com/track/XXXX
            url = str(task.item_id)
            if url.startswith("spotify:"):
                parts = url.split(":")
                if len(parts) >= 3:
                    url = f"https://open.spotify.com/{parts[1]}/{parts[2]}"

            songs = sdl.search([url])

            if not songs:
                with self.lock:
                    task.status = "error"
                return

            with self.lock:
                task.progress = 30

            # Spotdl doesn't easily expose progress via API without deep hooks
            sdl.download_songs(songs)

            with self.lock:
                task.status = "done"
                task.progress = 100
        except Exception as e:
            print(f"Download error for {task.name}: {e}")
            with self.lock:
                task.status = "error"

    def get_status(self):
        with self.lock:
            return [
                {
                    "id": t.id,
                    "name": t.name,
                    "status": t.status,
                    "progress": t.progress
                }
                for t in self.task_list
            ]

download_manager = DownloadManager()
