document.addEventListener('DOMContentLoaded', () => {
    let currentPlaylistId = null;
    let playlists = [];
    let currentTracks = [];

    const playlistList = document.getElementById('playlistList');
    const trackList = document.getElementById('trackList');
    const tracksTitle = document.getElementById('tracksTitle');
    const tracksCover = document.getElementById('tracksCover');
    const tracksMeta = document.getElementById('tracksMeta');
    const tracksTypeLabel = document.getElementById('tracksTypeLabel');
    const playlistActions = document.getElementById('playlistActions');
    const spotifySearch = document.getElementById('spotifySearch');
    const urlInput = document.getElementById('urlInput');
    const queueList = document.getElementById('queueList');
    const queueCount = document.getElementById('queueCount');
    const downloadPlaylistBtn = document.getElementById('downloadPlaylistBtn');
    const likedSongsBtn = document.getElementById('likedSongsBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const emptyState = document.getElementById('emptyState');
    const tracksView = document.getElementById('tracksView');

    // Queue Toggle
    queueHeader.addEventListener('click', () => {
        queuePanel.classList.toggle('collapsed');
        queueArrow.style.transform = queuePanel.classList.contains('collapsed') ? 'rotate(180deg)' : 'rotate(0deg)';
    });

    // Fetch and display playlists (My Library)
    async function fetchPlaylists() {
        try {
            const res = await fetch('/api/playlists');
            playlists = await res.json();

            if (playlists.length === 0) {
                // Potential empty state if no folder set or no files found
                // We should check if folder is actually set in config via another call or just assume
                // But for now, if 0 playlists and no liked tracks, show empty
                renderPlaylists([]);
            } else {
                emptyState.classList.add('hidden');
                tracksView.classList.remove('hidden');
                renderPlaylists(playlists);
            }
        } catch (e) {
            console.error("Failed to fetch playlists", e);
        }
    }

    function renderPlaylists(list) {
        // Remove existing playlist items (not Liked Songs)
        const items = playlistList.querySelectorAll('.playlist-item');
        items.forEach(i => i.remove());

        if (list.length === 0) {
            // Check if liked songs also empty?
            // For now just render the list
        }

        list.forEach(p => {
            const div = document.createElement('div');
            div.className = `playlist-item flex items-center group cursor-pointer ${currentPlaylistId === p.id ? 'active' : ''}`;
            div.innerHTML = `
                <div class="w-10 h-10 bg-[#2a2a2a] rounded shadow-md mr-3 flex items-center justify-center text-lg">📁</div>
                <div class="overflow-hidden">
                    <div class="font-medium text-sm truncate text-white">${p.name}</div>
                    <div class="text-[11px] text-gray-500 font-medium">${p.count} tracks</div>
                </div>
            `;
            div.addEventListener('click', () => loadPlaylist(p));
            playlistList.appendChild(div);
        });
    }

    async function loadPlaylist(p) {
        currentPlaylistId = p.id;
        document.querySelectorAll('.playlist-item, #likedSongsBtn').forEach(el => el.classList.remove('active'));
        const activeEl = Array.from(document.querySelectorAll('.playlist-item')).find(el => el.textContent.includes(p.name));
        if (activeEl) activeEl.classList.add('active');

        tracksTitle.textContent = p.name;
        tracksCover.innerHTML = p.id === 'liked' ? '❤️' : '📁';
        tracksMeta.textContent = `${p.count} tracks`;
        playlistActions.classList.remove('hidden');

        showLoading();

        try {
            const endpoint = p.id === 'liked' ? '/api/library' : `/api/playlist/${p.id}`;
            const res = await fetch(endpoint);
            currentTracks = await res.json();
            renderTracks(currentTracks);
            hideLoading();
        } catch (e) {
            console.error("Failed to load tracks", e);
            hideLoading();
        }
    }

    // Search Logic
    let searchTimeout = null;
    spotifySearch.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        if (query.length < 2) return;

        searchTimeout = setTimeout(async () => {
            showLoading();
            searchResultsSection.classList.remove('hidden');
            document.querySelectorAll('.playlist-item').forEach(el => el.classList.remove('active'));
            document.getElementById('searchTab').classList.add('active');

            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                currentTracks = await res.json();

                tracksTitle.textContent = `Search results for "${query}"`;
                tracksTypeLabel.textContent = "Search";
                tracksCover.innerHTML = "🔍";
                tracksMeta.textContent = `${currentTracks.length} tracks found`;
                playlistActions.classList.add('hidden');

                renderTracks(currentTracks);
                hideLoading();
            } catch (e) {
                console.error("Search failed", e);
                hideLoading();
            }
        }, 500);
    });

    // Paste URL Logic
    urlInput.addEventListener('paste', (e) => {
        setTimeout(() => handleUrl(urlInput.value), 10);
    });
    urlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleUrl(urlInput.value);
    });

    async function handleUrl(url) {
        if (!url.includes('spotify.com/')) return;

        showLoading();
        searchResultsSection.classList.remove('hidden');
        document.getElementById('searchTab').classList.add('active');

        try {
            const res = await fetch('/api/load-url', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({url})
            });
            const data = await res.json();

            currentTracks = data.tracks;
            tracksTitle.textContent = data.name;
            tracksTypeLabel.textContent = data.type;
            tracksCover.innerHTML = "🔗";
            tracksMeta.textContent = `${currentTracks.length} tracks`;
            playlistActions.classList.remove('hidden');

            renderTracks(currentTracks);
            hideLoading();
            urlInput.value = '';
        } catch (e) {
            console.error("URL load failed", e);
            hideLoading();
        }
    }

    function renderTracks(tracks) {
        trackList.innerHTML = '';
        if (tracks.length === 0) {
            trackList.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-gray-500">No tracks found in this playlist.</td></tr>';
            return;
        }

        tracks.forEach((t, index) => {
            const tr = document.createElement('tr');
            tr.className = 'group track-row';
            tr.innerHTML = `
                <td class="px-4 py-3 text-center text-gray-500 font-medium text-xs">${index + 1}</td>
                <td class="px-4 py-3">
                    <div class="flex items-center">
                        <div class="w-10 h-10 bg-[#1a1a1a] rounded mr-4 flex items-center justify-center text-xs">🎵</div>
                        <div>
                            <div class="text-white font-semibold text-sm">${t.name}</div>
                            <div class="text-xs text-gray-500">${t.artist}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 text-gray-500 text-sm truncate max-w-xs">${t.album}</td>
                <td class="px-6 py-4 text-gray-500 text-sm">${t.artist}</td>
                <td class="px-6 py-4 text-right">
                    <button class="download-track-btn opacity-0 group-hover:opacity-100 bg-[#7B2FBE] hover:bg-[#9B59B6] text-white p-2 rounded-full transition shadow-md" data-uri="${t.uri}" data-name="${t.name}">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
                    </button>
                </td>
            `;
            tr.querySelector('.download-track-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                downloadItem('track', t.uri, `${t.artist} - ${t.name}`);
            });
            trackList.appendChild(tr);
        });
    }

    function showLoading() {
        emptyState.classList.add('hidden');
        tracksView.classList.remove('hidden');
        trackListContainer.classList.add('hidden');
        loadingSkeleton.classList.remove('hidden');
    }

    function hideLoading() {
        loadingSkeleton.classList.add('hidden');
        trackListContainer.classList.remove('hidden');
        trackListContainer.classList.add('fade-in');
    }

    async function downloadItem(type, id, name, uri) {
        const payload = {type, id, name, uri};
        if (type === 'playlist') {
            payload.tracks = currentTracks;
        }
        const res = await fetch('/api/download', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            if (queuePanel.classList.contains('collapsed')) queueHeader.click();
            updateQueue();
        }
    }

    async function updateQueue() {
        const res = await fetch('/api/download/status');
        const status = await res.json();
        renderQueue(status);
    }

    function renderQueue(items) {
        queueList.innerHTML = '';
        queueCount.textContent = `${items.length} items`;
        if (items.length === 0) {
            queueList.innerHTML = '<div class="h-full flex items-center justify-center text-gray-600 text-xs font-bold uppercase tracking-widest">No active downloads</div>';
            return;
        }
        items.slice().reverse().forEach(item => {
            const div = document.createElement('div');
            div.className = 'bg-[#1a1a1a] p-3 rounded-md flex items-center space-x-4 border border-white/5';
            let statusColor = item.status === 'downloading' ? 'text-[#9B59B6]' : (item.status === 'done' ? 'text-[#1DB954]' : (item.status === 'error' ? 'text-red-500' : 'text-gray-400'));
            div.innerHTML = `
                <div class="flex-1 overflow-hidden">
                    <div class="text-[11px] font-bold text-white truncate mb-1">${item.name}</div>
                    <div class="flex items-center space-x-3 mt-1">
                        <div class="flex-1 bg-[#333] h-1 rounded-full overflow-hidden">
                            <div class="bg-[#7B2FBE] h-full transition-all duration-700 ease-out" style="width: ${item.progress}%"></div>
                        </div>
                        <span class="text-[9px] font-bold text-gray-500 w-6 text-right">${item.progress}%</span>
                    </div>
                </div>
                <div class="text-[9px] font-extrabold uppercase tracking-widest px-2 py-1 bg-[#121212] rounded border border-white/5 ${statusColor}">${item.status}</div>
            `;
            queueList.appendChild(div);
        });
    }

    playlistSearch.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        const filtered = playlists.filter(p => p.name.toLowerCase().includes(q));
        renderPlaylists(filtered);
    });

    likedSongsBtn.addEventListener('click', () => {
        searchResultsSection.classList.add('hidden');
        loadPlaylist({id: 'liked', name: 'Liked Songs', count: '...'});
    });

    downloadPlaylistBtn.addEventListener('click', () => {
        downloadItem('playlist', 'batch', tracksTitle.textContent);
    });

    refreshBtn.addEventListener('click', () => {
        fetchPlaylists();
    });

    // Initial fetch
    fetchPlaylists();

    fetchPlaylists();
    setInterval(updateQueue, 2000);
});
