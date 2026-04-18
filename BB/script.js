// Firebase init
const firebaseConfig = {
    apiKey: "AIzaSyDHSWmNFH0M2xxAHscSaVf5S8EbGecLzh4",
    authDomain: "vga-tech-v2-88b79.firebaseapp.com",
    projectId: "vga-tech-v2-88b79",
    storageBucket: "vga-tech-v2-88b79.firebasestorage.app",
    messagingSenderId: "736275916549",
    appId: "1:736275916549:web:31d62d90aad3c1f2adf96c"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const usersCollection = db.collection("users");

// Global state
let allUsers = [];
let selectionMode = false;
let selectedUsersSet = new Set(); // simpan document id

// DOM elements
const usersGrid = document.getElementById("usersGrid");
const addBtn = document.getElementById("addUserBtn");
const usernameInp = document.getElementById("username");
const passwordInp = document.getElementById("password");
const durationInp = document.getElementById("duration");
const enableSelectBtn = document.getElementById("enableSelectBtn");
const deleteSelectedBtn = document.getElementById("deleteSelectedBtn");
const deleteAllBtn = document.getElementById("deleteAllBtn");
const userCountSpan = document.getElementById("userCount");
const modalOverlay = document.getElementById("detailModal");
const modalContent = document.getElementById("modalContent");
const closeModalBtn = document.getElementById("closeModalBtn");
const toastEl = document.getElementById("toastMsg");
const toastTextSpan = document.getElementById("toastText");

function showToast(message, type = "success") {
    toastTextSpan.innerText = message;
    toastEl.classList.add("show");
    setTimeout(() => toastEl.classList.remove("show"), 2800);
}

function showLoading(btn, isLoading, originalText) {
    if(isLoading) {
        btn.disabled = true;
        btn.innerHTML = `<span class="loader-sm"></span> Memproses...`;
    } else {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// reset selection mode
function resetSelectionMode() {
    selectionMode = false;
    selectedUsersSet.clear();
    renderUsersGrid();
    enableSelectBtn.innerHTML = `<span class="material-symbols-rounded">check_box_outline_blank</span> Pilih`;
}

// render dengan checkboxes jika mode selection aktif
function renderUsersGrid() {
    if(!allUsers.length) {
        usersGrid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:2rem; background:rgba(0,0,0,0.3); border-radius:2rem;">✨ Tidak ada user. Tambahkan user baru ✨</div>`;
        userCountSpan.innerText = "0";
        return;
    }
    userCountSpan.innerText = allUsers.length;
    let html = '';
    allUsers.forEach(user => {
        const docId = user.id;
        const data = user.data;
        const isActive = data.deviceId && data.deviceId !== null;
        const statusText = isActive ? "Aktif" : "Belum digunakan";
        const statusIcon = isActive ? "check_circle" : "hourglass_empty";
        const checked = selectedUsersSet.has(docId);
        html += `
            <div class="user-card" data-id="${docId}">
                ${selectionMode ? `
                    <div class="card-check" data-checkbox-stop>
                        <span class="material-symbols-rounded" data-select-icon="${docId}" style="font-variation-settings:'FILL' ${checked ? 1 : 0};">${checked ? "check_box" : "check_box_outline_blank"}</span>
                    </div>
                ` : ''}
                <div class="card-actions">
                    <span class="material-symbols-rounded icon-btn" data-delete-single="${docId}" style="color:#ff7b89;">delete</span>
                </div>
                <div class="user-info">
                    <div class="user-name"><span class="material-symbols-rounded">badge</span> ${escapeHtml(data.username)}</div>
                    <div style="margin: 10px 0; display:flex; gap:8px; flex-wrap:wrap;"><span class="status-badge ${isActive ? 'status-active' : 'status-inactive'}"><span class="material-symbols-rounded" style="font-size:14px;">${statusIcon}</span> ${statusText}</span>
                    <span><span class="material-symbols-rounded" style="font-size:16px;">schedule</span> ${data.duration} hari</span></div>
                    <div style="font-size:0.75rem; opacity:0.6;">🖥️ ${data.deviceId ? data.deviceId.substring(0,12)+".." : "—"}</div>
                </div>
            </div>
        `;
    });
    usersGrid.innerHTML = html;
    // attach event listeners card klik untuk detail (kecuali checkbox atau tombol hapus)
    document.querySelectorAll('.user-card').forEach(card => {
        const cardId = card.getAttribute('data-id');
        card.addEventListener('click', (e) => {
            // jika target adalah area checkbox atau icon delete, jangan buka modal
            if(e.target.closest('[data-checkbox-stop]') || e.target.closest('[data-delete-single]')) return;
            const userFound = allUsers.find(u => u.id === cardId);
            if(userFound) openDetailModal(userFound);
        });
    });
    // event delete single
    document.querySelectorAll('[data-delete-single]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const docId = btn.getAttribute('data-delete-single');
            if(confirm("Hapus user ini secara permanen?")) {
                try {
                    await usersCollection.doc(docId).delete();
                    showToast("User dihapus", "success");
                } catch(err) { showToast("Error: "+err.message, "error"); }
            }
        });
    });
    // jika mode selection, tambahkan event pada icon select
    if(selectionMode) {
        document.querySelectorAll('[data-select-icon]').forEach(icon => {
            icon.addEventListener('click', async (e) => {
                e.stopPropagation();
                const docId = icon.getAttribute('data-select-icon');
                if(selectedUsersSet.has(docId)) {
                    selectedUsersSet.delete(docId);
                } else {
                    selectedUsersSet.add(docId);
                }
                renderUsersGrid();
            });
        });
    }
}

function openDetailModal(userObj) {
    const d = userObj.data;
    const start = d.startTime ? new Date(d.startTime.toDate ? d.startTime.toDate() : d.startTime).toLocaleString() : "Belum mulai";
    modalContent.innerHTML = `
        <div class="detail-row"><strong>Username</strong> <span>${escapeHtml(d.username)}</span></div>
        <div class="detail-row"><strong>Password</strong> <span>${escapeHtml(d.password)}</span></div>
        <div class="detail-row"><strong>Durasi</strong> <span>${d.duration} hari</span></div>
        <div class="detail-row"><strong>Start Time</strong> <span>${start}</span></div>
        <div class="detail-row"><strong>Device ID</strong> <span>${d.deviceId || "❌ null / belum terdaftar"}</span></div>
    `;
    modalOverlay.classList.add('active');
}

function escapeHtml(str) { return String(str).replace(/[&<>]/g, function(m){if(m==='&') return '&amp;'; if(m==='<') return '&lt;'; if(m==='>') return '&gt;'; return m;});}

// realtime onSnapshot
function subscribeUsers() {
    usersCollection.orderBy("createdAt", "desc").onSnapshot((snapshot) => {
        const usersArray = [];
        snapshot.forEach(doc => {
            usersArray.push({ id: doc.id, data: doc.data() });
        });
        allUsers = usersArray;
        // hapus id yang sudah tidak ada dari selected set
        const existingIds = new Set(usersArray.map(u => u.id));
        for(let sid of selectedUsersSet) {
            if(!existingIds.has(sid)) selectedUsersSet.delete(sid);
        }
        renderUsersGrid();
    }, (error) => {
        console.error(error);
        showToast("Gagal sync realtime", "error");
    });
}

// tambah user
async function addUser() {
    const username = usernameInp.value.trim();
    const password = passwordInp.value.trim();
    const duration = parseInt(durationInp.value);
    if(!username || !password) { showToast("Username & password wajib diisi!", "error"); return; }
    if(isNaN(duration) || duration <= 0) { showToast("Durasi harus angka positif", "error"); return; }
    const originalBtnHtml = addBtn.innerHTML;
    showLoading(addBtn, true, "");
    try {
        await usersCollection.add({
            username: username,
            password: password,
            duration: duration,
            startTime: null,
            deviceId: null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        showToast(`User ${username} berhasil ditambahkan`, "success");
        usernameInp.value = "";
        passwordInp.value = "";
        durationInp.value = "7";
        resetSelectionMode();
    } catch(err) {
        showToast("Gagal: "+err.message, "error");
    } finally {
        showLoading(addBtn, false, `<span class="material-symbols-rounded">add</span> Tambahkan User`);
    }
}

// hapus selected (massal)
async function deleteSelected() {
    if(selectedUsersSet.size === 0) {
        showToast("Tidak ada user yang dipilih", "error");
        return;
    }
    const confirmDel = confirm(`Hapus ${selectedUsersSet.size} user terpilih? Tindakan permanen.`);
    if(!confirmDel) return;
    const batch = db.batch();
    for(let id of selectedUsersSet) {
        const ref = usersCollection.doc(id);
        batch.delete(ref);
    }
    try {
        await batch.commit();
        showToast(`${selectedUsersSet.size} user telah dihapus.`, "success");
        selectedUsersSet.clear();
        if(selectionMode) resetSelectionMode();
    } catch(e) { showToast("Gagal batch delete: "+e.message, "error"); }
}

async function deleteAllUsers() {
    const doubleConfirm = confirm("⚠️ PERINGATAN AKHIR: Hapus SEMUA user dari database? ⚠️");
    if(!doubleConfirm) return;
    const finalConfirm = confirm("Ya, saya yakin ingin MENGHAPUS TOTAL SEMUA DATA. Tidak dapat dikembalikan.");
    if(!finalConfirm) return;
    try {
        const snapshot = await usersCollection.get();
        if(snapshot.empty) { showToast("Tidak ada data untuk dihapus", "info"); return; }
        const batch = db.batch();
        snapshot.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        showToast("Semua user telah dihapus total", "success");
        resetSelectionMode();
    } catch(e) { showToast("Error saat hapus semua: "+e.message, "error"); }
}

// enable selection mode
function enableSelection() {
    selectionMode = true;
    selectedUsersSet.clear();
    renderUsersGrid();
    enableSelectBtn.innerHTML = `<span class="material-symbols-rounded">check_box</span> Mode Pilih Aktif`;
    // setelah 3 detik mungkin kembali? tapi user bisa nonaktifkan
    setTimeout(() => {
        if(selectionMode) {
            // optional reset after 20 detik? lebih baik tambah tombol cancel? tapi kita tambah fitur jika klik lagi cancel
        }
    },100);
}
// cancel selection by click same button?
enableSelectBtn.addEventListener('click', () => {
    if(selectionMode) {
        resetSelectionMode();
    } else {
        enableSelection();
    }
});
deleteSelectedBtn.addEventListener('click', deleteSelected);
deleteAllBtn.addEventListener('click', deleteAllUsers);
addBtn.addEventListener('click', addUser);
closeModalBtn.addEventListener('click', () => modalOverlay.classList.remove('active'));
modalOverlay.addEventListener('click', (e) => { if(e.target === modalOverlay) modalOverlay.classList.remove('active'); });

// start realtime
subscribeUsers();

// handle enter key
const inputs = [usernameInp, passwordInp, durationInp];
inputs.forEach(inp => inp.addEventListener('keypress', (e) => { if(e.key === 'Enter') addUser(); }));
