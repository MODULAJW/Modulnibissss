// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDFqgav7NPOkS2u_AE1Ai1am0nA1sTtSJc",
    authDomain: "server-vga-broo.firebaseapp.com",
    projectId: "server-vga-broo",
    storageBucket: "server-vga-broo.firebasestorage.app",
    messagingSenderId: "822866912257",
    appId: "1:822866912257:web:a7866373ec6028541d4c00"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage(); // TAMBAHKAN STORAGE REFERENCE

// IndexedDB Configuration
const DB_NAME = 'VGA_BASURI_DB';
const DB_VERSION = 1;
const STORE_NAME = 'local_songs';
let dbInstance = null;

// Global Variables
let allSongs = [], filteredSongs = [], selectedIndex = -1, playingIndex = -1;
let renameTargetId = null, renameTargetIsLocal = false;
let deleteTargetId = null, deleteTargetIsLocal = false;
let discoveredDevices = [];

// DOM Elements
const audio = document.getElementById('audioPlayer');
const playlistEl = document.getElementById('playlistEl');
const currentSongLabel = document.getElementById('currentSongLabel');
const trackCounterSpan = document.getElementById('trackCounter');
const bpmDisplaySpan = document.getElementById('bpmDisplay');
const tempoDisplaySpan = document.getElementById('tempoDisplay');
const speedDisplaySpan = document.getElementById('speedDisplay');
const progressFill = document.getElementById('progressFill');
const progressBg = document.getElementById('progressBg');
const currentTimeSpan = document.getElementById('currentTime');
const durationTimeSpan = document.getElementById('durationTime');
const searchInput = document.getElementById('searchInput');
const upBtn = document.getElementById('upBtn');
const downBtn = document.getElementById('downBtn');
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stopBtn = document.getElementById('stopBtn');
const speedDownBtn = document.getElementById('speedDownBtn');
const speedUpBtn = document.getElementById('speedUpBtn');
const addSongBtn = document.getElementById('addSongBtn');
const fileInput = document.getElementById('fileInput');
const renameModal = document.getElementById('renameModal');
const renameInput = document.getElementById('renameInput');
const renameSave = document.getElementById('renameSaveBtn');
const renameCancel = document.getElementById('renameCancelBtn');
const deleteModal = document.getElementById('deleteModal');
const deleteYes = document.getElementById('deleteYesBtn');
const deleteNo = document.getElementById('deleteNoBtn');
const bgBtn = document.getElementById('bgBtn');
const bluetoothBtn = document.getElementById('bluetoothBtn');
const pianikaBtn = document.getElementById('pianikaBtn');
const chatBtn = document.getElementById('chatBtn');
const btPage = document.getElementById('bluetoothPage');
const closeBt = document.getElementById('closeBtPage');
const manualScanBt = document.getElementById('manualScanBt');
const deviceListArea = document.getElementById('deviceListArea');
const scanStatusSpan = document.getElementById('scanStatusText');
const btStatusSpan = document.getElementById('btStatusMsg');

// ========== HELPER FUNCTIONS ==========
function formatTime(sec) {
    if (isNaN(sec)) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function updateSpeedUI() {
    let r = audio.playbackRate;
    speedDisplaySpan.innerText = r.toFixed(2) + 'x';
    let bpmVal = Math.round(120 * r);
    tempoDisplaySpan.innerText = `TEMPO ${bpmVal}`;
    bpmDisplaySpan.innerText = `${bpmVal} BPM`;
}

// ========== FIX: SUPPORT AUDIO DI SAFARI IPHONE ==========
function fixAudioForSafari() {
    // Force audio format yang didukung Safari
    if (audio) {
        // Set preload metadata untuk performa lebih baik
        audio.preload = 'metadata';
        
        // Hapus blob URL lama jika ada memory leak
        window.addEventListener('beforeunload', () => {
            if (allSongs) {
                allSongs.forEach(song => {
                    if (song.url && song.url.startsWith('blob:')) {
                        URL.revokeObjectURL(song.url);
                    }
                });
            }
        });
    }
}
fixAudioForSafari();

// ========== INDEXEDDB OPERATIONS ==========
function openLocalDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            dbInstance = request.result;
            loadLocalSongsFromDB().then(resolve).catch(reject);
        };
        request.onupgradeneeded = (event) => {
            const dbEvent = event.target.result;
            if (!dbEvent.objectStoreNames.contains(STORE_NAME)) {
                dbEvent.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

async function loadLocalSongsFromDB() {
    if (!dbInstance) return [];
    return new Promise((resolve, reject) => {
        const transaction = dbInstance.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}

async function saveLocalSongToDB(songData) {
    if (!dbInstance) await openLocalDB();
    return new Promise((resolve, reject) => {
        const transaction = dbInstance.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add(songData);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function updateLocalSongInDB(id, newName) {
    if (!dbInstance) await openLocalDB();
    return new Promise((resolve, reject) => {
        const transaction = dbInstance.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const getReq = store.get(id);
        getReq.onsuccess = () => {
            const item = getReq.result;
            if (item) {
                item.name = newName;
                store.put(item);
                resolve(true);
            } else {
                reject("Item not found");
            }
        };
        getReq.onerror = () => reject(getReq.error);
    });
}

async function deleteLocalSongFromDB(id) {
    if (!dbInstance) await openLocalDB();
    return new Promise((resolve, reject) => {
        const transaction = dbInstance.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
    });
}

// ========== RENDER FUNCTIONS ==========
function renderPlaylist() {
    playlistEl.innerHTML = '';
    if (filteredSongs.length === 0) {
        let emptyLi = document.createElement('li');
        emptyLi.className = 'empty-message';
        emptyLi.innerText = searchInput.value.trim() !== "" ? "🔍 Tidak ditemukan" : "KAMU SEDANG OFFLINE, Untuk mendapatkan banyak nada harap kembali dengan jaringan Online, jika sedang tidak punya kuota disarankan menambahkan nada sendiri, dengan mengklik tombol (Tambah Nada) di paling bawah";
        playlistEl.appendChild(emptyLi);
        currentSongLabel.innerText = 'Pilih modul MP3';
        trackCounterSpan.innerText = '0/0';
        return;
    }
    filteredSongs.forEach((song, idx) => {
        let li = document.createElement('li');
        li.className = 'playlist-item';
        if (idx === selectedIndex) li.classList.add('selected');
        if (idx === playingIndex) li.classList.add('playing');
        
        let titleSpan = document.createElement('span');
        titleSpan.className = 'item-title';
        titleSpan.innerText = song.name;
        
        let actionDiv = document.createElement('div');
        actionDiv.className = 'item-actions';
        
        let playIcon = document.createElement('span');
        playIcon.className = 'material-icons';
        playIcon.innerText = 'play_arrow';
        playIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            setSelectedIndex(idx);
            playCurrent();
        });
        
        // TOMBOL RENAME & HAPUS HANYA UNTUK MP3 LOKAL (isLocal = true)
        if (song.isLocal === true) {
            let editIcon = document.createElement('span');
            editIcon.className = 'material-icons';
            editIcon.innerText = 'edit';
            editIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                renameTargetId = song.id;
                renameTargetIsLocal = true;
                renameInput.value = song.name;
                renameModal.style.display = 'flex';
            });
            actionDiv.appendChild(editIcon);
            
            let deleteIcon = document.createElement('span');
            deleteIcon.className = 'material-icons';
            deleteIcon.innerText = 'delete_forever';
            deleteIcon.style.color = '#ff8a6e';
            deleteIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteTargetId = song.id;
                deleteTargetIsLocal = true;
                deleteModal.style.display = 'flex';
            });
            actionDiv.appendChild(deleteIcon);
        }
        
        actionDiv.appendChild(playIcon);
        li.appendChild(titleSpan);
        li.appendChild(actionDiv);
        li.addEventListener('click', () => setSelectedIndex(idx));
        li.addEventListener('dblclick', () => {
            setSelectedIndex(idx);
            playCurrent();
        });
        playlistEl.appendChild(li);
    });
    if (selectedIndex >= 0 && selectedIndex < filteredSongs.length) {
        currentSongLabel.innerText = filteredSongs[selectedIndex].name;
        trackCounterSpan.innerText = `${selectedIndex + 1}/${filteredSongs.length}`;
    } else if (filteredSongs.length > 0 && selectedIndex === -1) {
        setSelectedIndex(0);
    }
}

function setSelectedIndex(index) {
    if (filteredSongs.length === 0 || index < 0 || index >= filteredSongs.length) return;
    selectedIndex = index;
    renderPlaylist();
}

// ========== FIXED: PLAY AUDIO DENGAN DUKUNGAN IPHONE ==========
function playCurrent() {
    if (selectedIndex === -1 || filteredSongs.length === 0) return;
    const song = filteredSongs[selectedIndex];
    if (!song.url) return;
    
    // Fix untuk Safari: pause dulu sebelum ganti src
    const wasPlaying = !audio.paused;
    if (wasPlaying) {
        audio.pause();
    }
    
    if (audio.src !== song.url) {
        audio.src = song.url;
        audio.load();
        
        // Tambahkan event listener untuk error handling di Safari
        audio.addEventListener('error', function(e) {
            console.warn('Audio error:', e);
            // Coba alternatif jika format tidak didukung
            if (song.blobData && song.isLocal) {
                // Re-create blob dengan tipe MIME yang lebih spesifik
                const mimeType = song.blobData.type || 'audio/mpeg';
                const newBlob = new Blob([song.blobData], { type: mimeType });
                const newUrl = URL.createObjectURL(newBlob);
                audio.src = newUrl;
                audio.load();
                audio.play().catch(err => console.warn('Retry play failed:', err));
            }
        }, { once: true });
        
        audio.play().then(() => {
            playingIndex = selectedIndex;
            renderPlaylist();
        }).catch(e => {
            console.warn('Playback error:', e);
            // Di iPhone, mungkin perlu user interaction pertama
            if (e.name === 'NotAllowedError') {
                showToast('Tap play lagi untuk memutar audio', false);
            }
        });
    } else {
        audio.play().then(() => {
            playingIndex = selectedIndex;
            renderPlaylist();
        }).catch(e => console.warn('Playback error:', e));
    }
}

// Toast helper untuk feedback
function showToast(msg, isError = false) {
    let toast = document.createElement('div');
    toast.style.cssText = `position:fixed;bottom:20px;left:20px;right:20px;background:${isError ? '#ff4444cc' : '#00ffccaa'};color:#000;padding:12px;border-radius:8px;text-align:center;z-index:10000;font-size:12px;backdrop-filter:blur(10px);`;
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

function filterSongs() {
    const keyword = searchInput.value.toLowerCase().trim();
    if (keyword === "") {
        filteredSongs = [...allSongs];
    } else {
        filteredSongs = allSongs.filter(item => item.name.toLowerCase().includes(keyword));
    }
    if (selectedIndex >= filteredSongs.length) {
        selectedIndex = filteredSongs.length > 0 ? 0 : -1;
    }
    if (playingIndex !== -1 && !filteredSongs.some(s => s.id === (filteredSongs[playingIndex]?.id))) {
        playingIndex = -1;
    }
    renderPlaylist();
}

// ========== CRUD OPERATIONS ==========
async function executeRename(docId, newName, isLocal) {
    if (!docId || !newName.trim()) return;
    if (isLocal && dbInstance) {
        try {
            await updateLocalSongInDB(docId, newName.trim());
            const localIdx = allSongs.findIndex(s => s.id === docId && s.isLocal);
            if (localIdx !== -1) allSongs[localIdx].name = newName.trim();
            filterSongs();
        } catch (e) {
            console.error(e);
        }
        renameModal.style.display = 'none';
    } else {
        renameModal.style.display = 'none';
    }
}

async function executeDelete(docId, isLocal) {
    if (!docId) return;
    if (isLocal && dbInstance) {
        try {
            await deleteLocalSongFromDB(docId);
            const localIdx = allSongs.findIndex(s => s.id === docId && s.isLocal);
            if (localIdx !== -1) {
                // Revoke blob URL sebelum dihapus
                if (allSongs[localIdx].url && allSongs[localIdx].url.startsWith('blob:')) {
                    URL.revokeObjectURL(allSongs[localIdx].url);
                }
                allSongs.splice(localIdx, 1);
            }
            if (selectedIndex >= allSongs.length) selectedIndex = allSongs.length - 1;
            if (playingIndex >= allSongs.length) playingIndex = -1;
            filterSongs();
            if (allSongs.length === 0) {
                audio.pause();
                audio.src = '';
            }
        } catch (e) {
            console.error(e);
        }
        deleteModal.style.display = 'none';
        deleteTargetId = null;
    } else {
        deleteModal.style.display = 'none';
    }
}

// ========== FIXED: UPLOAD MP3 DENGAN DUKUNGAN IPHONE & FORMAT AUDIO ==========
async function addLocalMp3(file) {
    // Dukung berbagai format audio
    const validAudioTypes = ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/m4a', 'audio/x-m4a', 'audio/wav', 'audio/aac', 'audio/aacp'];
    const isAudio = validAudioTypes.includes(file.type) || file.name.match(/\.(mp3|m4a|aac|wav)$/i);
    
    if (!isAudio) {
        showToast('Format tidak didukung. Gunakan MP3, M4A, AAC, atau WAV', true);
        return;
    }
    
    // Ambil nama file tanpa ekstensi
    let fileName = file.name.replace(/\.[^/.]+$/, '');
    if (fileName.length > 50) fileName = fileName.substring(0, 47) + '...';
    
    // Buat blob URL untuk play di Safari/iPhone
    const objectUrl = URL.createObjectURL(file);
    
    // Simpan blob data untuk IndexedDB (tetap simpan file asli)
    const newSong = { 
        name: fileName, 
        blobData: file, 
        url: objectUrl, 
        createdAt: Date.now(), 
        isLocal: true,
        fileType: file.type || 'audio/mpeg'
    };
    
    try {
        const id = await saveLocalSongToDB(newSong);
        newSong.id = id;
        allSongs.unshift({ 
            id: id, 
            name: fileName, 
            url: objectUrl, 
            isLocal: true,
            blobData: file,
            fileType: file.type
        });
        filterSongs();
        showToast(`✅ ${fileName} berhasil ditambahkan`, false);
        
        // Auto-select lagu baru
        if (filteredSongs.length > 0) {
            setSelectedIndex(0);
        }
    } catch (e) {
        console.error('Save to IndexedDB error:', e);
        showToast('Gagal menyimpan lagu', true);
        URL.revokeObjectURL(objectUrl);
    }
}

// ========== FIXED: LOAD DATA DARI INDEXEDDB DENGAN RECOVERY URL ==========
async function loadAllData() {
    await openLocalDB();
    const localItems = await loadLocalSongsFromDB();
    
    // Recreate blob URLs untuk setiap lagu lokal
    const localFormatted = localItems.map(item => {
        let audioUrl;
        if (item.blobData) {
            // Recreate URL dari blob yang tersimpan
            audioUrl = URL.createObjectURL(item.blobData);
        } else if (item.url && item.url.startsWith('blob:')) {
            audioUrl = item.url;
        } else {
            audioUrl = null;
        }
        
        return {
            id: item.id,
            name: item.name,
            url: audioUrl,
            isLocal: true,
            createdAt: item.createdAt,
            blobData: item.blobData,
            fileType: item.fileType
        };
    }).filter(item => item.url !== null); // Filter yang gagal load
    
    db.collection("mp3_list").orderBy("created_at", "desc").onSnapshot(snapshot => {
        let firebaseList = [];
        snapshot.forEach(doc => {
            let data = doc.data();
            firebaseList.push({
                id: doc.id,
                name: data.name || "Unnamed",
                url: data.url || "",
                isLocal: false,
                created_at: data.created_at
            });
        });
        allSongs = [...localFormatted, ...firebaseList];
        filterSongs();
    }, err => {
        console.error("Firebase error:", err);
        // Tetap tampilkan lagu lokal meskipun Firebase error
        allSongs = [...localFormatted];
        filterSongs();
        playlistEl.innerHTML = '<li class="empty-message">⚠️ Koneksi Firebase bermasalah, hanya lagu lokal tersedia</li>';
    });
}

// ========== BLUETOOTH FUNCTIONS (TETAP SAMA) ==========
function showBt() {
    btPage.style.display = 'flex';
    document.getElementById('appMain').style.display = 'none';
}

function hideBt() {
    btPage.style.display = 'none';
    document.getElementById('appMain').style.display = 'flex';
}

function updateDeviceUI() {
    if (discoveredDevices.length === 0) {
        deviceListArea.innerHTML = '<div style="text-align:center; color:#b3efcf; font-size:0.7rem;">✨ Belum ada device, klik SCAN ULANG</div>';
        return;
    }
    deviceListArea.innerHTML = '';
    discoveredDevices.forEach(dev => {
        let div = document.createElement('div');
        div.style.cssText = 'background:rgba(0,0,0,0.5); border-radius:60px; padding:10px 16px; margin-bottom:8px; display:flex; align-items:center; gap:12px; cursor:pointer; border:1px solid #5dae7e;';
        div.innerHTML = `<span class="material-icons" style="color:#6fe092; font-size:1.2rem;">bluetooth</span><span style="flex:1; font-size:0.75rem;">${dev.name || 'Unknown Device'}</span><span class="material-icons" style="font-size:1rem;">chevron_right</span>`;
        div.addEventListener('click', () => {
            btStatusSpan.innerText = `🔌 Connecting to ${dev.name} ...`;
            setTimeout(() => {
                btStatusSpan.innerText = `✅ CONNECTED → ${dev.name} (paired)`;
            }, 800);
        });
        deviceListArea.appendChild(div);
    });
}

async function startScan() {
    scanStatusSpan.innerText = "🔍 MEMINTA IZIN BLUETOOTH...";
    btStatusSpan.innerText = "Klik izinkan di popup browser";
    if (!navigator.bluetooth) {
        btStatusSpan.innerText = "⚠️ Browser tidak support Bluetooth (Demo Mode Aktif)";
        scanStatusSpan.innerText = "DEMO MODE - device simulasi";
        discoveredDevices = [{ name: "VGA BEAT MODULE (Demo)" }, { name: "NEO STATION (Demo)" }];
        updateDeviceUI();
        return;
    }
    try {
        const device = await navigator.bluetooth.requestDevice({ acceptAllDevices: true });
        const devName = device.name || `BT-${device.id.slice(0, 6)}`;
        if (!discoveredDevices.find(d => d.name === devName)) {
            discoveredDevices.push({ name: devName, id: device.id });
        }
        updateDeviceUI();
        btStatusSpan.innerText = `✔️ ${devName} ditemukan. Klik untuk connect.`;
        scanStatusSpan.innerText = "Scan selesai, pilih device";
    } catch (err) {
        btStatusSpan.innerText = "⏸ Scan dibatalkan. Demo mode aktif";
        if (discoveredDevices.length === 0) {
            discoveredDevices = [{ name: "NEO SPEAKER (Demo)" }, { name: "VGA RADIO (Demo)" }];
            updateDeviceUI();
            scanStatusSpan.innerText = "Demo device tersedia";
        }
    }
}

// ========== EVENT LISTENERS ==========
// Audio Events
audio.addEventListener('ratechange', updateSpeedUI);
audio.addEventListener('loadedmetadata', () => {
    durationTimeSpan.innerText = formatTime(audio.duration);
    updateSpeedUI();
});
audio.addEventListener('timeupdate', () => {
    if (audio.duration) {
        let percent = (audio.currentTime / audio.duration) * 100;
        progressFill.style.width = percent + '%';
        currentTimeSpan.innerText = formatTime(audio.currentTime);
    }
});
audio.addEventListener('ended', () => {
    if (filteredSongs.length > 0 && selectedIndex !== -1) {
        let nextIdx = selectedIndex + 1;
        if (nextIdx >= filteredSongs.length) nextIdx = 0;
        setSelectedIndex(nextIdx);
        playCurrent();
    }
});

// Error handling untuk audio
audio.addEventListener('error', (e) => {
    console.warn('Audio element error:', e);
    showToast('Gagal memutar audio, format mungkin tidak didukung', true);
});

// Progress Bar Click
progressBg.addEventListener('click', (e) => {
    if (!audio.duration) return;
    const rect = progressBg.getBoundingClientRect();
    const perc = (e.clientX - rect.left) / rect.width;
    audio.currentTime = perc * audio.duration;
});

// ========== FIXED: CONTROL BUTTONS DENGAN DUKUNGAN IPHONE ==========
addSongBtn.addEventListener('click', () => { 
    fileInput.click(); 
});
fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    // Support multiple format audio
    const audioFiles = files.filter(f => {
        const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/m4a', 'audio/x-m4a', 'audio/wav', 'audio/aac'];
        return validTypes.includes(f.type) || f.name.match(/\.(mp3|m4a|aac|wav)$/i);
    });
    
    if (audioFiles.length === 0 && files.length > 0) {
        showToast('Pilih file audio (MP3, M4A, AAC, WAV)', true);
    }
    
    if (audioFiles.length > 0) {
        audioFiles.forEach(f => addLocalMp3(f));
    }
    fileInput.value = '';
});

playBtn.addEventListener('click', () => {
    if (filteredSongs.length === 0) return;
    if (selectedIndex === -1 && filteredSongs.length) setSelectedIndex(0);
    playCurrent();
});
pauseBtn.addEventListener('click', () => audio.pause());
stopBtn.addEventListener('click', () => {
    audio.pause();
    audio.currentTime = 0;
    progressFill.style.width = '0%';
    currentTimeSpan.innerText = '00:00';
});
speedDownBtn.addEventListener('click', () => {
    let r = audio.playbackRate - 0.25;
    if (r < 0.5) r = 0.5;
    audio.playbackRate = r;
});
speedUpBtn.addEventListener('click', () => {
    let r = audio.playbackRate + 0.25;
    if (r > 2.5) r = 2.5;
    audio.playbackRate = r;
});
upBtn.addEventListener('click', () => {
    if (filteredSongs.length) {
        let newIdx = selectedIndex - 1;
        if (newIdx < 0) newIdx = filteredSongs.length - 1;
        setSelectedIndex(newIdx);
    }
});
downBtn.addEventListener('click', () => {
    if (filteredSongs.length) {
        let newIdx = selectedIndex + 1;
        if (newIdx >= filteredSongs.length) newIdx = 0;
        setSelectedIndex(newIdx);
    }
});
searchInput.addEventListener('input', filterSongs);

// Modal Events
renameSave.addEventListener('click', () => {
    if (renameTargetId && renameInput.value.trim()) {
        executeRename(renameTargetId, renameInput.value, renameTargetIsLocal);
    } else {
        renameModal.style.display = 'none';
    }
});
renameCancel.addEventListener('click', () => renameModal.style.display = 'none');
renameModal.addEventListener('click', (e) => {
    if (e.target === renameModal) renameModal.style.display = 'none';
});
deleteYes.addEventListener('click', () => {
    if (deleteTargetId) executeDelete(deleteTargetId, deleteTargetIsLocal);
    else deleteModal.style.display = 'none';
});
deleteNo.addEventListener('click', () => {
    deleteModal.style.display = 'none';
    deleteTargetId = null;
});
deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) deleteModal.style.display = 'none';
});

// Background Image Upload
let bgFileInput = document.createElement('input');
bgFileInput.type = 'file';
bgFileInput.accept = 'image/*';
bgBtn.addEventListener('click', () => bgFileInput.click());
bgFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
        let url = URL.createObjectURL(e.target.files[0]);
        document.body.style.backgroundImage = `url(${url})`;
        document.body.style.backgroundSize = 'cover';
    }
});

// Bluetooth Page
bluetoothBtn.addEventListener('click', showBt);
closeBt.addEventListener('click', hideBt);
manualScanBt.addEventListener('click', () => {
    discoveredDevices = [];
    startScan();
});

// Placeholder untuk Pianika & Chat (tetap)
pianikaBtn.addEventListener('click', () => console.log("Pianika"));
chatBtn.addEventListener('click', () => console.log("Chat"));

// Initialize Audio Speed
audio.playbackRate = 1.0;
updateSpeedUI();

// Load All Data
loadAllData();
