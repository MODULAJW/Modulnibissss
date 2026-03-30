// ========= FIREBASE CONFIG =========
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

// ========= LOCAL INDEXEDDB FOR "BASURI" =========
const DB_NAME = 'VGA_BASURI_DB';
const DB_VERSION = 1;
const STORE_NAME = 'local_songs';
let localSongs = [];
let dbInstance = null;

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

let allSongs = [];
let filteredSongs = [];
let selectedIndex = -1;
let playingIndex = -1;
let renameTargetId = null;
let renameTargetIsLocal = false;
const audio = document.getElementById('audioPlayer');

// DOM Elements
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
const upBtn = document.getElementById('upBtn'), downBtn = document.getElementById('downBtn');
const playBtn = document.getElementById('playBtn'), pauseBtn = document.getElementById('pauseBtn'), stopBtn = document.getElementById('stopBtn');
const speedDownBtn = document.getElementById('speedDownBtn'), speedUpBtn = document.getElementById('speedUpBtn');
const addSongBtn = document.getElementById('addSongBtn'), fileInput = document.getElementById('fileInput');
const renameModal = document.getElementById('renameModal'), renameInput = document.getElementById('renameInput');
const renameSave = document.getElementById('renameSaveBtn'), renameCancel = document.getElementById('renameCancelBtn');
const bgBtn = document.getElementById('bgBtn'), bluetoothBtn = document.getElementById('bluetoothBtn');
const prevBtnElem = document.getElementById('prevBtn');
const nextBtnElem = document.getElementById('nextBtn');

function formatTime(sec) { if(isNaN(sec)) return '00:00'; const m=Math.floor(sec/60), s=Math.floor(sec%60); return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`; }

function updateSpeedUI() { 
    let r = audio.playbackRate; 
    speedDisplaySpan.innerText = r.toFixed(2) + 'x'; 
    let bpmVal = Math.round(120 * r); 
    tempoDisplaySpan.innerText = `TEMPO ${bpmVal}`; 
    bpmDisplaySpan.innerText = `${bpmVal} BPM`; 
}

audio.addEventListener('ratechange', updateSpeedUI);
audio.addEventListener('loadedmetadata',()=>{ durationTimeSpan.innerText=formatTime(audio.duration); updateSpeedUI(); });
audio.addEventListener('timeupdate',()=>{ if(audio.duration){ let percent=(audio.currentTime/audio.duration)*100; progressFill.style.width=percent+'%'; currentTimeSpan.innerText=formatTime(audio.currentTime); } });
audio.addEventListener('ended',()=>{ if(filteredSongs.length>0 && selectedIndex!==-1){ let nextIdx=selectedIndex+1; if(nextIdx>=filteredSongs.length) nextIdx=0; setSelectedIndex(nextIdx); playCurrent(); } });
progressBg.addEventListener('click',(e)=>{ if(!audio.duration) return; const rect=progressBg.getBoundingClientRect(); const perc=(e.clientX-rect.left)/rect.width; audio.currentTime=perc*audio.duration; });

function renderPlaylist() {
    playlistEl.innerHTML='';
    if(filteredSongs.length===0){ let emptyLi=document.createElement('li'); emptyLi.className='empty-message'; emptyLi.innerText=searchInput.value.trim()!==""?"🔍 Tidak ditemukan":"KAMU SEDANG OFFLINE,Untuk medapatkan banyak nada harap kembali dengan jaringan Onnlime, jika anda sedang tidak punya kouta disarankan menambahkan nada sendiri, dengan mengklik tombol (Tambah Nada) di paling bawah" ; playlistEl.appendChild(emptyLi); currentSongLabel.innerText='Pilih modul MP3'; trackCounterSpan.innerText='0/0'; return; }
    filteredSongs.forEach((song,idx)=>{ 
        let li=document.createElement('li'); li.className='playlist-item'; 
        if(idx===selectedIndex) li.classList.add('selected'); 
        if(idx===playingIndex) li.classList.add('playing');
        let titleSpan=document.createElement('span'); titleSpan.className='item-title'; titleSpan.innerText=song.name;
        let actionDiv=document.createElement('div'); actionDiv.className='item-actions';
        let playIcon=document.createElement('span'); playIcon.className='material-icons'; playIcon.innerText='play_arrow'; 
        playIcon.addEventListener('click',(e)=>{ e.stopPropagation(); setSelectedIndex(idx); playCurrent(); });
        let editIcon=document.createElement('span'); editIcon.className='material-icons'; editIcon.innerText='edit'; 
        editIcon.addEventListener('click',(e)=>{ e.stopPropagation(); renameTargetId=song.id; renameTargetIsLocal = song.isLocal || false; renameInput.value=song.name; renameModal.style.display='flex'; });
        actionDiv.appendChild(playIcon); actionDiv.appendChild(editIcon);
        li.appendChild(titleSpan); li.appendChild(actionDiv);
        li.addEventListener('click',()=>setSelectedIndex(idx));
        li.addEventListener('dblclick',()=>{ setSelectedIndex(idx); playCurrent(); });
        playlistEl.appendChild(li);
    });
    if(selectedIndex>=0 && selectedIndex<filteredSongs.length){ currentSongLabel.innerText=filteredSongs[selectedIndex].name; trackCounterSpan.innerText=`${selectedIndex+1}/${filteredSongs.length}`; }
    else if(filteredSongs.length>0 && selectedIndex===-1) setSelectedIndex(0);
}

function setSelectedIndex(index){ if(filteredSongs.length===0 || index<0 || index>=filteredSongs.length) return; selectedIndex=index; renderPlaylist(); }

function playCurrent(){ 
    if(selectedIndex===-1 || filteredSongs.length===0) return; 
    const song = filteredSongs[selectedIndex]; 
    if(!song.url) return; 
    audio.src = song.url; 
    audio.load(); 
    audio.play().then(()=>{ playingIndex=selectedIndex; renderPlaylist(); }).catch(e=>console.warn); 
}

function filterSongs(){ 
    const keyword=searchInput.value.toLowerCase().trim(); 
    if(keyword==="") filteredSongs=[...allSongs]; 
    else filteredSongs=allSongs.filter(item=>item.name.toLowerCase().includes(keyword)); 
    if(selectedIndex>=filteredSongs.length) selectedIndex=filteredSongs.length>0?0:-1; 
    if(playingIndex!==-1 && !filteredSongs.some(s=>s.id===(filteredSongs[playingIndex]?.id))) playingIndex=-1; 
    renderPlaylist(); 
}

async function executeRename(docId, newName, isLocal){
    if(!docId || !newName.trim()) return;
    if(isLocal && dbInstance){
        const transaction = dbInstance.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const getReq = store.get(docId);
        getReq.onsuccess = () => {
            const item = getReq.result;
            if(item){ item.name = newName.trim(); store.put(item); }
        };
        const localIdx = allSongs.findIndex(s => s.id === docId && s.isLocal);
        if(localIdx !== -1) allSongs[localIdx].name = newName.trim();
        filterSongs();
        renameModal.style.display='none';
    } else if(!isLocal) {
        try{ await db.collection("mp3_list").doc(docId).update({ name: newName.trim() }); renameModal.style.display='none'; }catch(e){}
    }
}

async function addLocalMp3(file) {
    const fileName = file.name.replace(/\.mp3$/i, '');
    const objectUrl = URL.createObjectURL(file);
    const newSong = { name: fileName, blobData: file, url: objectUrl, createdAt: Date.now(), isLocal: true };
    try {
        const id = await saveLocalSongToDB(newSong);
        newSong.id = id;
        allSongs.unshift({ id: id, name: fileName, url: objectUrl, isLocal: true });
        filterSongs();
    } catch(e) { console.error("Gagal simpan ke IndexedDB:", e); }
}

async function loadAllData() {
    await openLocalDB();
    const localItems = await loadLocalSongsFromDB();
    const localFormatted = localItems.map(item => ({ id: item.id, name: item.name, url: URL.createObjectURL(item.blobData), isLocal: true, createdAt: item.createdAt }));
    
    db.collection("mp3_list").orderBy("created_at","desc").onSnapshot(snapshot=>{ 
        let firebaseList = [];
        snapshot.forEach(doc=>{ let data=doc.data(); firebaseList.push({ id:doc.id, name:data.name||"Unnamed", url:data.url||"", isLocal:false, created_at:data.created_at }); });
        allSongs = [...localFormatted, ...firebaseList];
        filterSongs();
    }, err=>{ playlistEl.innerHTML='<li class="empty-message">❌ Firebase error, data lokal tetap ada</li>'; });
}

// Event handlers
addSongBtn.addEventListener('click',()=>fileInput.click());
fileInput.addEventListener('change',(e)=>{ Array.from(e.target.files).filter(f=>f.type==='audio/mp3'||f.name.endsWith('.mp3')).forEach(f=>addLocalMp3(f)); fileInput.value=''; });
playBtn.addEventListener('click',()=>{ if(filteredSongs.length===0) return; if(selectedIndex===-1 && filteredSongs.length) setSelectedIndex(0); playCurrent(); });
pauseBtn.addEventListener('click',()=>audio.pause());
stopBtn.addEventListener('click',()=>{ audio.pause(); audio.currentTime=0; progressFill.style.width='0%'; currentTimeSpan.innerText='00:00'; });
speedDownBtn.addEventListener('click',()=>{ let r = audio.playbackRate - 0.25; if(r < 0.5) r = 0.5; audio.playbackRate = r; });
speedUpBtn.addEventListener('click',()=>{ let r = audio.playbackRate + 0.25; if(r > 2.5) r = 2.5; audio.playbackRate = r; });
upBtn.addEventListener('click',()=>{ if(filteredSongs.length){ let newIdx=selectedIndex-1; if(newIdx<0) newIdx=filteredSongs.length-1; setSelectedIndex(newIdx); } });
downBtn.addEventListener('click',()=>{ if(filteredSongs.length){ let newIdx=selectedIndex+1; if(newIdx>=filteredSongs.length) newIdx=0; setSelectedIndex(newIdx); } });
if(prevBtnElem) prevBtnElem.addEventListener('click',()=>{ if(filteredSongs.length){ let newIdx=selectedIndex-1; if(newIdx<0) newIdx=filteredSongs.length-1; setSelectedIndex(newIdx); playCurrent(); } });
if(nextBtnElem) nextBtnElem.addEventListener('click',()=>{ if(filteredSongs.length){ let newIdx=selectedIndex+1; if(newIdx>=filteredSongs.length) newIdx=0; setSelectedIndex(newIdx); playCurrent(); } });
searchInput.addEventListener('input',filterSongs);
renameSave.addEventListener('click',()=>{ if(renameTargetId && renameInput.value.trim()) executeRename(renameTargetId, renameInput.value, renameTargetIsLocal); else renameModal.style.display='none'; });
renameCancel.addEventListener('click',()=>renameModal.style.display='none');
renameModal.addEventListener('click',(e)=>{ if(e.target===renameModal) renameModal.style.display='none'; });
audio.playbackRate=1.0; updateSpeedUI();

// BG Custom
let bgFileInput=document.createElement('input'); bgFileInput.type='file'; bgFileInput.accept='image/*';
bgBtn.addEventListener('click',()=>bgFileInput.click());
bgFileInput.addEventListener('change',(e)=>{ if(e.target.files && e.target.files[0]){ let url=URL.createObjectURL(e.target.files[0]); document.body.style.backgroundImage=`url(${url})`; document.body.style.backgroundSize='cover'; document.body.style.backgroundPosition='center'; } });

// BLUETOOTH
const btPage=document.getElementById('bluetoothPage'), closeBt=document.getElementById('closeBtPage'), manualScanBt=document.getElementById('manualScanBt');
const deviceListArea=document.getElementById('deviceListArea'), scanStatusSpan=document.getElementById('scanStatusText'), btStatusSpan=document.getElementById('btStatusMsg');
let discoveredDevices=[];
function showBt(){ btPage.style.display='flex'; document.getElementById('appMain').style.display='none'; }
function hideBt(){ btPage.style.display='none'; document.getElementById('appMain').style.display='flex'; }
bluetoothBtn.addEventListener('click',showBt); closeBt.addEventListener('click',hideBt);
function updateDeviceUI(){ if(discoveredDevices.length===0){ deviceListArea.innerHTML='<div style="text-align:center; color:#b3efcf;">✨ Belum ada device, klik SCAN ULANG</div>'; return; }
    deviceListArea.innerHTML=''; discoveredDevices.forEach(dev=>{ let div=document.createElement('div'); div.className='device-item-elegant'; div.innerHTML=`<span class="material-icons" style="color:#6fe092">bluetooth</span><span style="flex:1;">${dev.name||'Unknown Device'}</span><span class="material-icons">chevron_right</span>`; div.addEventListener('click',()=>{ btStatusSpan.innerText=`🔌 Connecting to ${dev.name} ...`; setTimeout(()=>{ btStatusSpan.innerText=`✅ CONNECTED → ${dev.name} (paired)`; },800); }); deviceListArea.appendChild(div); }); }
async function startScan(){ scanStatusSpan.innerText="🔍 MEMINTA IZIN BLUETOOTH..."; btStatusSpan.innerText="Klik izinkan di popup browser"; if(!navigator.bluetooth){ btStatusSpan.innerText="⚠️ Web Bluetooth tidak didukung (demo mode)"; discoveredDevices=[{name:"VGA BEAT MODULE"},{name:"NEO STATION"}]; updateDeviceUI(); scanStatusSpan.innerText="DEMO MODE - pilih device"; return; }
    try{ const device=await navigator.bluetooth.requestDevice({acceptAllDevices:true}); const devName=device.name||`BT-${device.id.slice(0,6)}`; if(!discoveredDevices.find(d=>d.name===devName)) discoveredDevices.push({name:devName,id:device.id}); updateDeviceUI(); btStatusSpan.innerText=`✔️ ${devName} ditemukan. Klik untuk connect.`; scanStatusSpan.innerText="Scan selesai, pilih device"; }catch(err){ btStatusSpan.innerText="⏸ Scan dibatalkan. Gunakan tombol scan ulang."; if(discoveredDevices.length===0){ discoveredDevices=[{name:"NEO SPEAKER"},{name:"VGA RADIO"}]; updateDeviceUI(); scanStatusSpan.innerText="Demo device tersedia"; } } }
manualScanBt.addEventListener('click',()=>{ discoveredDevices=[]; startScan(); });

loadAllData();
