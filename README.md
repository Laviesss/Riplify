# Riplify — Spotify Library Downloader

Riplify is a local desktop application that lets you browse your Spotify library and download tracks as tagged audio files using **spotDL**.

Instead of the Spotify Web API (which requires Premium for development), Riplify now uses your official **Spotify Data Export** JSON files to display your library and playlists locally.

The app runs a **Flask** backend locally and displays the UI inside a **PyQt6** window using `QWebEngineView` — providing a native desktop experience.

## Features

- **Local Library Import**: No Spotify API credentials required. Import your library from a data export.
- **Library Browsing**: View your playlists, track counts, and liked songs directly from JSON.
- **Selective Downloads**: Download individual tracks or entire playlists with a single click.
- **Managed Queue**: Background download manager with a limit of 2 concurrent downloads.
- **Customizable Settings**:
  - Change output folder (default: `~/Music/Riplify/`).
  - Choose audio format (MP3, FLAC, M4A).
  - Select audio quality (128kbps to 320kbps).
  - Configure a custom FFmpeg path.
- **Visual Feedback**: Real-time status updates for the download queue.
- **Dark Theme**: Modern UI using Tailwind CSS with a dedicated music-themed desktop icon.

## Tech Stack

- **Python 3.10+**
- **Flask**: Local web server for the application logic and API.
- **spotDL**: Audio downloading, YouTube matching, and metadata tagging (Python API).
- **PyQt6 & PyQt6-WebEngine**: Native desktop wrapper for the web UI.
- **python-dotenv**: Environment variable management.
- **Tailwind CSS**: Modern styling via Play CDN.

## Prerequisites

- **FFmpeg**: Must be installed and accessible in your system's `PATH`.
  - Windows: `choco install ffmpeg` or download from [ffmpeg.org](https://ffmpeg.org).
  - Linux: `sudo apt install ffmpeg` or your distribution's package manager.
- **Spotify Data Export**:
  1. Go to [Spotify Account Privacy](https://www.spotify.com/account/privacy).
  2. Scroll to "Download your data" and request "Account data".
  3. Once you receive the email (can take a few days), download and extract the zip file.
  4. Point Riplify to the extracted folder in the Settings.

## Setup & Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd riplify
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**:
   ```bash
   # IMPORTANT: Run the main.py file to launch the desktop app
   python main.py
   ```

## Application Structure

- `main.py`: **Main entry point**. It initializes the PyQt6 window, checks for FFmpeg, and starts the Flask server in a background thread.
- `server.py`: Flask backend, API endpoints for library browsing and settings.
- `spotify_import.py`: Logic for parsing `Playlist*.json` and `YourLibrary.json` from your Spotify export.
- `downloader.py`: Custom download queue manager using spotDL.
- `config.py`: Configuration persistence at `~/.riplify/config.json`.
- `templates/`: HTML templates for the UI.
- `static/`: Custom CSS and frontend JavaScript logic.

## Usage

- **Initial Setup**: On first launch, you'll see a dialog explaining how to export your data.
- **Settings**: Click "Settings" in the top bar and enter the path to your extracted Spotify data folder.
- **Browse**: Use the sidebar to switch between your playlists or Liked Songs.
- **Download**: Click the download icon next to a track or "Download All" for an entire playlist.

## Note for Developers

If you are running from an IDE (like PyCharm), **always run `main.py`**.

Running `server.py` directly only starts the API server without the desktop UI or the necessary background task managers that `main.py` initializes. The desktop window is required to interact with the application properly.

## License

This project is licensed under the MIT License.
