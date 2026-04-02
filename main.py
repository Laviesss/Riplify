import sys
import os
import threading
import subprocess
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QVBoxLayout, QWidget,
    QMessageBox, QDialog, QLabel, QLineEdit, QPushButton,
    QFormLayout, QHBoxLayout
)
from PyQt6.QtWebEngineWidgets import QWebEngineView
from PyQt6.QtCore import QUrl, Qt
from PyQt6.QtGui import QIcon, QPixmap
from server import app
from dotenv import set_key, load_dotenv

class SetupDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Riplify - First Run Setup")
        self.setFixedSize(450, 300)

        layout = QVBoxLayout(self)

        instruction = QLabel(
            "<b>Spotify Credentials Required</b><br><br>"
            "Go to <a href='https://developer.spotify.com'>developer.spotify.com</a>, create a new app,<br>"
            "set the Redirect URI to <b>http://127.0.0.1:5174/callback</b>,<br>"
            "then copy your Client ID and Secret below."
        )
        instruction.setOpenExternalLinks(True)
        instruction.setWordWrap(True)
        layout.addWidget(instruction)

        form = QFormLayout()
        self.client_id = QLineEdit()
        self.client_secret = QLineEdit()
        form.addRow("Client ID:", self.client_id)
        form.addRow("Client Secret:", self.client_secret)
        layout.addLayout(form)

        btn_layout = QHBoxLayout()
        self.save_btn = QPushButton("Save & Continue")
        self.save_btn.clicked.connect(self.accept)
        btn_layout.addStretch()
        btn_layout.addWidget(self.save_btn)
        layout.addLayout(btn_layout)

    def get_credentials(self):
        return self.client_id.text().strip(), self.client_secret.text().strip()

def check_ffmpeg():
    # Try running ffmpeg -version
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

        # Center the window
        qr = self.frameGeometry()
        cp = self.screen().availableGeometry().center()
        qr.moveCenter(cp)
        self.move(qr.topLeft())

        self.web_view = QWebEngineView()
        self.setCentralWidget(self.web_view)

        # Set icon if exists
        if os.path.exists("music_note.png"):
            self.setWindowIcon(QIcon("music_note.png"))

        self.web_view.load(QUrl("http://127.0.0.1:5174"))

def main():
    qt_app = QApplication(sys.argv)

    # 1. Check for .env
    load_dotenv()
    if not os.getenv("SPOTIPY_CLIENT_ID") or not os.getenv("SPOTIPY_CLIENT_SECRET"):
        dialog = SetupDialog()
        if dialog.exec() == QDialog.DialogCode.Accepted:
            cid, csec = dialog.get_credentials()
            if cid and csec:
                env_path = os.path.join(os.getcwd(), ".env")
                set_key(env_path, "SPOTIPY_CLIENT_ID", cid)
                set_key(env_path, "SPOTIPY_CLIENT_SECRET", csec)
                # Reload env
                os.environ["SPOTIPY_CLIENT_ID"] = cid
                os.environ["SPOTIPY_CLIENT_SECRET"] = csec
            else:
                QMessageBox.critical(None, "Error", "Client ID and Secret are required.")
                sys.exit(1)
        else:
            sys.exit(0)

    # 2. Check for FFmpeg
    if not check_ffmpeg():
        QMessageBox.critical(
            None,
            "FFmpeg Missing",
            "FFmpeg was not found in your PATH. Please install FFmpeg to use Riplify.\n\n"
            "Instructions:\n"
            "- Windows: Install via 'choco install ffmpeg' or download from ffmpeg.org\n"
            "- Linux: 'sudo apt install ffmpeg' or similar"
        )
        # We don't exit if missing, just show error as requested,
        # but user might have specified path in config later.
        # Actually objective says "Only open the main window after both checks pass".
        sys.exit(1)

    # 3. Start Flask in daemon thread
    flask_thread = threading.Thread(target=run_flask, daemon=True)
    flask_thread.start()

    # 4. Open Window
    window = RiplifyWindow()
    window.show()

    sys.exit(qt_app.exec())

if __name__ == "__main__":
    main()
