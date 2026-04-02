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

    // Fetch and display playlists
    async function fetchPlaylists() {
        const res = await fetch('/api/playlists');
        playlists = await res.json();
        renderPlaylists(playlists);
    }

    function renderPlaylists(list) {
        // Remove existing playlist items (not Liked Songs)
        const items = playlistList.querySelectorAll('.playlist-item');
        items.forEach(i => i.remove());

        list.forEach(p => {
            const div = document.createElement('div');
            div.className = `playlist-item flex items-center p-3 hover:bg-[#2a2a2a] cursor-pointer transition border-l-4 border-transparent ${currentPlaylistId === p.id ? 'active bg-[#2a2a2a] border-[#7B2FBE]' : ''}`;
            div.dataset.id = p.id;
            div.innerHTML = `
                <img src="${p.image || 'https://via.placeholder.com/40'}" class="w-10 h-10 rounded shadow-md mr-3 object-cover">
                <div class="overflow-hidden">
                    <div class="font-medium text-sm truncate">${p.name}</div>
                    <div class="text-xs text-gray-500">${p.count} tracks</div>
                </div>
            `;
            div.addEventListener('click', () => loadPlaylist(p));
            playlistList.appendChild(div);
        });
    }

    async function loadPlaylist(p) {
        currentPlaylistId = p.id;
        // Update UI
        document.querySelectorAll('.playlist-item, #likedSongsBtn').forEach(el => el.classList.remove('active', 'border-[#7B2FBE]'));
        const activeEl = p.id === 'liked' ? likedSongsBtn : Array.from(document.querySelectorAll('.playlist-item')).find(el => el.dataset.id === p.id);
        if (activeEl) {
            activeEl.classList.add('active', 'border-[#7B2FBE]');
        }

        tracksTitle.textContent = p.name;
        tracksCover.style.backgroundImage = `url(${p.image || 'https://via.placeholder.com/200'})`;
        tracksCover.style.backgroundSize = 'cover';
        tracksMeta.textContent = `${p.count} tracks`;
        playlistActions.classList.remove('hidden');

        trackList.innerHTML = '<tr><td colspan="5" class="p-8 text-center">Loading tracks...</td></tr>';

        const endpoint = p.id === 'liked' ? '/api/library' : `/api/playlist/${p.id}`;
        const res = await fetch(endpoint);
        currentTracks = await res.json();
        renderTracks(currentTracks);
    }

    function renderTracks(tracks) {
        trackList.innerHTML = '';
        tracks.forEach((t, index) => {
            const tr = document.createElement('tr');
            tr.className = 'group';
            tr.innerHTML = `
                <td class="px-6 py-4 text-center text-gray-500 font-medium">${index + 1}</td>
                <td class="px-6 py-4">
                    <div class="flex items-center">
                        <img src="${t.image || 'https://via.placeholder.com/40'}" class="w-10 h-10 rounded mr-4">
                        <div>
                            <div class="text-white font-semibold text-sm">${t.name}</div>
                            <div class="text-xs text-gray-500">${t.artist}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 text-gray-500 text-sm truncate max-w-xs">${t.album}</td>
                <td class="px-6 py-4 text-gray-500 text-sm">${formatDuration(t.duration)}</td>
                <td class="px-6 py-4 text-right">
                    <button class="download-track-btn opacity-0 group-hover:opacity-100 bg-[#7B2FBE] hover:bg-[#9B59B6] text-white p-2 rounded-full transition shadow-md" data-id="${t.id}" data-name="${t.name}">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
                    </button>
                </td>
            `;
            tr.querySelector('.download-track-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                downloadItem('track', t.id, t.name);
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

        items.slice().reverse().forEach(item => {
            const div = document.createElement('div');
            div.className = 'bg-[#2a2a2a] p-3 rounded flex items-center space-x-4 border border-gray-800';

            let statusColor = 'text-gray-400';
            if (item.status === 'downloading') statusColor = 'text-[#9B59B6]';
            if (item.status === 'done') statusColor = 'text-green-500';
            if (item.status === 'error') statusColor = 'text-red-500';

            div.innerHTML = `
                <div class="flex-1">
                    <div class="text-xs font-semibold truncate">${item.name}</div>
                    <div class="flex items-center space-x-2 mt-1">
                        <div class="flex-1 bg-gray-700 h-1 rounded-full overflow-hidden">
                            <div class="bg-[#7B2FBE] h-full transition-all duration-500" style="width: ${item.progress}%"></div>
                        </div>
                        <span class="text-[10px] w-6 text-right">${item.progress}%</span>
                    </div>
                </div>
                <div class="text-[10px] font-bold uppercase tracking-widest ${statusColor}">${item.status}</div>
            `;
            queueList.appendChild(div);
        });
    }

    function formatDuration(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = ((ms % 60000) / 1000).toFixed(0);
        return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
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

    // Initial fetch
    fetchPlaylists();

    // Poll for queue status every 2 seconds
    setInterval(updateQueue, 2000);
});
