import sys
import os
import threading
import subprocess
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QVBoxLayout, QWidget,
    QMessageBox
)
from PyQt6.QtWebEngineWidgets import QWebEngineView
from PyQt6.QtCore import QUrl, Qt
from PyQt6.QtGui import QIcon
from server import app
from config import load_config

def check_ffmpeg():
    try:
        subprocess.run(["ffmpeg", "-version"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return True
    except FileNotFoundError:
        return False

def run_flask():
    app.run(host="127.0.0.1", port=5174, threaded=True, use_reloader=False)

class RiplifyWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Riplify")
        self.resize(1100, 700)

        qr = self.frameGeometry()
        cp = self.screen().availableGeometry().center()
        qr.moveCenter(cp)
        self.move(qr.topLeft())

        self.web_view = QWebEngineView()
        self.setCentralWidget(self.web_view)

        if os.path.exists("music_note.png"):
            self.setWindowIcon(QIcon("music_note.png"))

        self.web_view.load(QUrl("http://127.0.0.1:5174"))

def main():
    qt_app = QApplication(sys.argv)

    # 1. Check for FFmpeg
    if not check_ffmpeg():
        QMessageBox.critical(
            None,
            "FFmpeg Missing",
            "FFmpeg was not found in your PATH. Please install FFmpeg to use Riplify.\n\n"
            "Instructions:\n"
            "- Windows: Install via 'choco install ffmpeg' or download from ffmpeg.org\n"
            "- Linux: 'sudo apt install ffmpeg' or similar"
        )
        sys.exit(1)

    # 2. Check for export folder config
    config = load_config()
    if not config.get("spotify_export_folder"):
        QMessageBox.information(
            None,
            "Setup Required",
            "To use Riplify, export your Spotify data:\n\n"
            "1. Go to spotify.com -> Account -> Privacy -> Download your data\n"
            "2. Check 'Account data', click Request\n"
            "3. Extract the zip and select the folder in Settings"
        )

    # 3. Start Flask in daemon thread
    flask_thread = threading.Thread(target=run_flask, daemon=True)
    flask_thread.start()

    window = RiplifyWindow()
    window.show()

    sys.exit(qt_app.exec())

if __name__ == "__main__":
    main()
