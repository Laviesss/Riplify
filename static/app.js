document.addEventListener('DOMContentLoaded', () => {
    let currentPlaylistId = null;
    let playlists = [];
    let currentTracks = [];

    const playlistList = document.getElementById('playlistList');
    const trackList = document.getElementById('trackList');
    const tracksTitle = document.getElementById('tracksTitle');
    const tracksCover = document.getElementById('tracksCover');
    const tracksMeta = document.getElementById('tracksMeta');
    const playlistActions = document.getElementById('playlistActions');
    const playlistSearch = document.getElementById('playlistSearch');
    const queueList = document.getElementById('queueList');
    const queueCount = document.getElementById('queueCount');
    const downloadPlaylistBtn = document.getElementById('downloadPlaylistBtn');
    const likedSongsBtn = document.getElementById('likedSongsBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const emptyState = document.getElementById('emptyState');
    const tracksView = document.getElementById('tracksView');
    const loadingSkeleton = document.getElementById('loadingSkeleton');
    const trackListContainer = document.getElementById('trackListContainer');
    const queuePanel = document.getElementById('queuePanel');
    const queueHeader = document.getElementById('queueHeader');
    const queueArrow = document.getElementById('queueArrow');

    // Queue Toggle Functionality
    queueHeader.addEventListener('click', () => {
        queuePanel.classList.toggle('collapsed');
        if (queuePanel.classList.contains('collapsed')) {
            queueArrow.style.transform = 'rotate(180deg)';
        } else {
            queueArrow.style.transform = 'rotate(0deg)';
        }
    });

    // Fetch and display playlists
    async function fetchPlaylists() {
        try {
            const res = await fetch('/api/playlists');
            playlists = await res.json();

            if (playlists.length === 0) {
                emptyState.classList.remove('hidden');
                tracksView.classList.add('hidden');
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
        playlistList.innerHTML = '';

        list.forEach(p => {
            const div = document.createElement('div');
            div.className = `playlist-item flex items-center group cursor-pointer ${currentPlaylistId === p.id ? 'active' : ''}`;
            div.dataset.id = p.id;
            div.innerHTML = `
                <div class="w-12 h-12 rounded shadow-md mr-4 flex items-center justify-center text-xl cover-placeholder transition-transform group-hover:scale-105">📁</div>
                <div class="overflow-hidden">
                    <div class="font-medium text-sm truncate text-white">${p.name}</div>
                    <div class="text-xs text-gray-500 font-medium mt-1">Playlist • ${p.count} tracks</div>
                </div>
            `;
            div.addEventListener('click', () => loadPlaylist(p));
            playlistList.appendChild(div);
        });
    }

    async function loadPlaylist(p) {
        currentPlaylistId = p.id;
        // Update UI
        document.querySelectorAll('.playlist-item, #likedSongsBtn').forEach(el => el.classList.remove('active'));
        const activeEl = p.id === 'liked' ? likedSongsBtn : Array.from(document.querySelectorAll('.playlist-item')).find(el => el.dataset.id === p.id);
        if (activeEl) {
            activeEl.classList.add('active');
        }

        tracksTitle.textContent = p.name;
        tracksCover.innerHTML = p.id === 'liked' ? '❤️' : '📁';
        tracksMeta.textContent = `${p.count} tracks`;
        playlistActions.classList.remove('hidden');

        // Show skeleton and hide content
        trackListContainer.classList.add('hidden');
        loadingSkeleton.classList.remove('hidden');

        try {
            const endpoint = p.id === 'liked' ? '/api/library' : `/api/playlist/${p.id}`;
            const res = await fetch(endpoint);
            currentTracks = await res.json();

            // Artificial delay for visual effect of skeleton
            setTimeout(() => {
                renderTracks(currentTracks);
                loadingSkeleton.classList.add('hidden');
                trackListContainer.classList.remove('hidden');
                trackListContainer.classList.add('fade-in');
            }, 300);
        } catch (e) {
            console.error("Failed to load tracks", e);
        }
    }

    function renderTracks(tracks) {
        trackList.innerHTML = '';
        if (tracks.length === 0) {
            trackList.innerHTML = '<tr><td colspan="5" class="p-12 text-center text-gray-500 font-medium">No tracks found in this playlist.</td></tr>';
            return;
        }

        tracks.forEach((t, index) => {
            const tr = document.createElement('tr');
            tr.className = 'group track-row';
            tr.innerHTML = `
                <td class="px-4 py-3 text-center text-gray-500 font-medium text-xs">${index + 1}</td>
                <td class="px-4 py-3">
                    <div class="flex items-center">
                        <div class="w-10 h-10 rounded mr-4 flex items-center justify-center text-xs cover-placeholder">🎵</div>
                        <div class="overflow-hidden">
                            <div class="text-white font-bold text-sm truncate">${t.name}</div>
                            <div class="text-[13px] text-gray-400 group-hover:text-white transition-colors truncate">${t.artist}</div>
                        </div>
                    </div>
                </td>
                <td class="px-4 py-3 text-gray-400 text-[13px] truncate max-w-[200px] font-medium">${t.album}</td>
                <td class="px-4 py-3 text-gray-400 text-[13px] font-medium truncate">${t.artist}</td>
                <td class="px-4 py-3 text-right">
                    <button class="download-track-btn opacity-0 group-hover:opacity-100 bg-white text-black p-2 rounded-full transition-all transform hover:scale-105 shadow-xl" data-uri="${t.uri}" data-name="${t.name}">
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

    async function downloadItem(type, id, name) {
        const res = await fetch('/api/download', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({type, id, name})
        });
        if (res.ok) {
            // Expand queue panel if it was collapsed
            if (queuePanel.classList.contains('collapsed')) {
                queueHeader.click();
            }
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
            div.className = 'bg-[#1a1a1a] p-3 rounded-md flex items-center space-x-4 border border-white/5 hover:bg-[#222] transition-colors';

            let statusColor = 'text-gray-400';
            if (item.status === 'downloading') statusColor = 'text-[#9B59B6]';
            if (item.status === 'done') statusColor = 'text-[#1DB954]';
            if (item.status === 'error') statusColor = 'text-red-500';

            div.innerHTML = `
                <div class="flex-1 overflow-hidden">
                    <div class="text-[11px] font-bold text-white truncate mb-1">${item.name}</div>
                    <div class="flex items-center space-x-3 mt-1">
                        <div class="flex-1 bg-[#333] h-1 rounded-full overflow-hidden shadow-inner">
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
        loadPlaylist({id: 'liked', name: 'Liked Songs', count: '...', image: null});
    });

    downloadPlaylistBtn.addEventListener('click', () => {
        if (currentPlaylistId) {
            downloadItem('playlist', currentPlaylistId, tracksTitle.textContent);
        }
    });

    refreshBtn.addEventListener('click', () => {
        fetchPlaylists();
    });

    // Initial fetch
    fetchPlaylists();

    // Poll for queue status every 2 seconds
    setInterval(updateQueue, 2000);
});
