# Riplify — Spotify Library Downloader

Riplify is a local desktop application that lets you browse and download tracks from Spotify using three powerful modes. It requires **no Spotify API credentials, no OAuth, and no Premium subscription**.

## Three Download Modes

1.  **Search**: Type a song, artist, or album name into the search bar to find and download tracks publicly.
2.  **Paste URL**: Paste any public Spotify URL (track, album, playlist, or artist) to load its content into the UI.
3.  **My Library**: Point Riplify to your extracted **Spotify Data Export** folder to browse all your personal playlists and liked songs locally.

The app runs a **Flask** backend locally and displays the UI inside a **PyQt6** window using `QWebEngineView`.

## Features

- **Privacy First**: No Spotify login required. All metadata is fetched publicly or via local JSON.
- **Selective Downloads**: Download individual tracks or entire collections with one click.
- **Managed Queue**: Background download manager with a limit of 2 concurrent downloads for stability.
- **Spotify Aesthetic**: Modern dark theme UI inspired by the official Spotify desktop app.
- **Customizable Settings**:
    - Change output folder (default: `~/Music/Riplify/`).
    - Choose audio format (MP3, FLAC, M4A).
    - Select audio quality (128kbps to 320kbps).
    - Configure a custom FFmpeg path.

## Prerequisites

- **FFmpeg**: Must be installed and accessible in your system's `PATH`.
    - Windows: `choco install ffmpeg` or download from [ffmpeg.org](https://ffmpeg.org).
    - Linux: `sudo apt install ffmpeg` or your distribution's package manager.
- **Spotify Data Export (Optional for "My Library" mode)**:
    1.  Go to [Spotify Account Privacy](https://www.spotify.com/account/privacy).
    2.  Scroll to "Download your data" and request "Account data".
    3.  Once you receive the email, download and extract the zip file.
    4.  Enter the extracted folder path in Riplify Settings.

## Tech Stack

- **Python 3.10+**
- **Flask**: Local web server.
- **spotDL**: Audio downloading and metadata tagging.
- **SpotifyScraper**: Public metadata fetching without authentication.
- **PyQt6 & PyQt6-WebEngine**: Native desktop wrapper.
- **Tailwind CSS**: Styling via Play CDN.

## Setup & Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd riplify
    ```

2.  **Install dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

3.  **Run the application**:
    ```bash
    python main.py
    ```

## Application Structure

- `main.py`: Entry point. Initializes PyQt6 and the Flask daemon thread.
- `server.py`: Flask backend and API routes.
- `spotify_scraper_client.py`: Public metadata fetching via SpotifyScraper.
- `spotify_import.py`: Local JSON data import logic.
- `downloader.py`: Custom download queue manager.
- `config.py`: Configuration persistence at `~/.riplify/config.json`.

## License

This project is licensed under the MIT License.
