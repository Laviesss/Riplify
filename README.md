# Riplify — Spotify Library Downloader

Riplify is a local desktop application that lets you log into your Spotify account, browse your playlists (including private ones), and download them as tagged audio files using **spotDL**.

The app runs a **Flask** backend locally and displays the UI inside a **PyQt6** window using `QWebEngineView` — providing a native desktop experience without needing an external browser.

## Features

- **Spotify Authentication**: Secure OAuth login flow within the application window.
- **Library Browsing**: View your playlists, cover art, track counts, and liked songs.
- **Selective Downloads**: Download individual tracks or entire playlists with a single click.
- **Managed Queue**: Background download manager with a limit of 2 concurrent downloads to ensure stability.
- **Customizable Settings**:
  - Change output folder (default: `~/Music/Riplify/`).
  - Choose audio format (MP3, FLAC, M4A).
  - Select audio quality (128kbps to 320kbps).
  - Configure Spotify API credentials and custom FFmpeg path.
- **Visual Feedback**: Real-time download progress and status updates.
- **Dark Theme**: Modern UI using Tailwind CSS with a dedicated music-themed desktop icon.

## Tech Stack

- **Python 3.10+**
- **Flask**: Local web server for the application logic and API.
- **Spotipy**: Spotify API and OAuth management.
- **spotDL**: Audio downloading, YouTube matching, and metadata tagging (Python API).
- **PyQt6 & PyQt6-WebEngine**: Native desktop wrapper for the web UI.
- **python-dotenv**: Environment variable management for Spotify credentials.
- **Tailwind CSS**: Modern styling via Play CDN.

## Prerequisites

- **FFmpeg**: Must be installed and accessible in your system's `PATH`.
  - Windows: `choco install ffmpeg` or download from [ffmpeg.org](https://ffmpeg.org).
  - Linux: `sudo apt install ffmpeg` or your distribution's package manager.
- **Spotify Developer Credentials**: You need a Client ID and Client Secret from the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
  - Create a new app and set the **Redirect URI** to: `http://localhost:5174/callback`

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
   python main.py
   ```

4. **Initial Configuration**:
   - On the first run, you will be prompted to enter your Spotify Client ID and Client Secret.
   - The application will verify if FFmpeg is installed.
   - Once both checks pass, the main window will open, and you can log in to your Spotify account.

## Application Structure

- `main.py`: Entry point, PyQt6 window initialization, and startup checks.
- `server.py`: Flask backend, API endpoints, and route management.
- `spotify_auth.py`: Spotify OAuth flow and session management.
- `downloader.py`: Custom download queue manager using spotDL.
- `config.py`: Configuration persistence at `~/.riplify/config.json`.
- `templates/`: HTML templates for the UI.
- `static/`: Custom CSS and frontend JavaScript logic.

## Usage

- **Login**: Click "Login with Spotify" in the startup screen to authenticate.
- **Browse**: Use the sidebar to switch between your playlists or Liked Songs.
- **Search**: Use the search bar at the top to filter through your playlists.
- **Download**: Click the download icon next to a track or "Download All" for an entire playlist.
- **Settings**: Adjust your download preferences and credentials in the Settings page.

## License

This project is licensed under the MIT License.
