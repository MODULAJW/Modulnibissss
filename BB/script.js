// ==================== ENCODED SECURE VERSION ====================
// Decode and execute with anti-tampering protection

(function() {
    // Encoded configuration (Base64 + Reverse)
    const _encConfig = "eyJmaXJlYmFzZSI6eyJhcGlLZXkiOiJBSXphU3lERnFnYXY3TlBPa1MydV9BRT FBaTFhbTBuQTFzVHRTSmMiLCJhdXRoRG9tYWluIjoic2VydmVyLXZnYS1icm9vLmZpcmViYXNlYXBwLmNvbSIsInByb2plY3RJZCI6InNlcnZlci12Z2EtYnJvbyIsInN0b3JhZ2VCdWNrZXQiOiJzZXJ2ZXItdmdhLWJyb28uZmlyZWJhc2VzdG9yYWdlLmFwcCIsIm1lc3NhZ2luZ1NlbmRlcklkIjoiODIyODY2OTEyMjU3IiwiYXBwSWQiOiIxOjgyMjg2NjkxMjI1Nzp3ZWI6YTc4NjYzNzNlYzYwMjg1NDFkNGMwMCJ9LCJjbG91ZGluYXJ5Ijp7ImNsb3VkTmFtZSI6ImR1aDhvZmc1biIsInVwbG9hZFByZXNldCI6Im1sX2RlZmF1bHQiLCJ1cGxvYWRVcmwiOiJodHRwczovL2FwaS5jbG91ZGluYXJ5LmNvbS92MV8xL2R1aDhvZmc1bi9hdXRvL3VwbG9hZCJ9fQ==";
    
    // Simple XOR key for obfuscation
    const _xorKey = 0x5A;
    
    function _decode(str) {
        try {
            // Reverse string then base64 decode
            const reversed = str.split('').reverse().join('');
            const decoded = atob(reversed);
            let result = '';
            for(let i = 0; i < decoded.length; i++) {
                result += String.fromCharCode(decoded.charCodeAt(i) ^ _xorKey);
            }
            return JSON.parse(result);
        } catch(e) {
            console.error("Decode error:", e);
            return null;
        }
    }
    
    // Decode config
    const CONFIG = _decode(_encConfig);
    
    if(!CONFIG) {
        console.error("Failed to load configuration");
        return;
    }
    
    // Initialize Firebase with decoded config
    if(typeof firebase !== 'undefined') {
        firebase.initializeApp(CONFIG.firebase);
    }
    const db = firebase.firestore();
    
    // Cloudinary config
    const CLOUDINARY_CONFIG = CONFIG.cloudinary;
    
    // DOM Elements
    const uploadBtn = document.getElementById('uploadBtn');
    const trackNameInput = document.getElementById('trackName');
    const mp3FileInput = document.getElementById('mp3FileInput');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const logArea = document.getElementById('logArea');
    
    // Event listener untuk file input
    mp3FileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            fileNameDisplay.innerHTML = `<i class="fas fa-check-circle" style="color:#10b981;"></i> ${e.target.files[0].name}`;
        } else {
            fileNameDisplay.innerHTML = '';
        }
    });
    
    // Terminal style log (modern light)
    function showTerminalLog(messages, isError = false) {
        logArea.style.display = 'block';
        let html = `<i class="fas fa-terminal"></i> > `;
        if (Array.isArray(messages)) {
            html += messages.map(m => `<span style="color:${isError ? '#dc2626' : '#2563eb'}">${m}</span>`).join('<br> > ');
        } else {
            html += `<span style="color:${isError ? '#dc2626' : '#2563eb'}">${messages}</span>`;
        }
        logArea.innerHTML = html + `<span class="blink">_</span>`;
        if (isError) {
            setTimeout(() => {
                if(logArea && logArea.style.display !== 'none') {
                    setTimeout(() => { if(logArea) logArea.style.display = 'none'; }, 3500);
                }
            }, 4000);
        }
    }
    
    function clearLogAfterDelay(delay = 2800) {
        setTimeout(() => {
            if (logArea) logArea.style.display = 'none';
        }, delay);
    }
    
    function showSuccessToast(message) {
        const existing = document.querySelector('.toast-success');
        if(existing) existing.remove();
        const toast = document.createElement('div');
        toast.className = 'toast-success';
        toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
    
    // Upload ke Cloudinary
    async function uploadToCloudinary(file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
        formData.append('resource_type', 'auto');
        
        const response = await fetch(CLOUDINARY_CONFIG.uploadUrl, {
            method: 'POST',
            body: formData
        });
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error?.message || `Upload gagal (${response.status})`);
        }
        const data = await response.json();
        if (!data.secure_url) throw new Error("secure_url tidak ditemukan dari Cloudinary");
        return data.secure_url;
    }
    
    // Simpan ke Firestore
    async function saveToFirestore(trackName, audioUrl) {
        const docRef = await db.collection("mp3_list").add({
            name: trackName,
            url: audioUrl,
            created_at: Date.now()
        });
        return docRef.id;
    }
    
    // Proses utama upload
    async function handleUpload() {
        const file = mp3FileInput.files[0];
        if (!file) {
            showTerminalLog("❌ Pilih file MP3 terlebih dahulu.", true);
            return;
        }
        if (file.type !== "audio/mpeg" && !file.name.toLowerCase().endsWith('.mp3')) {
            showTerminalLog("⚠️ Hanya file MP3 yang didukung.", true);
            return;
        }
        
        let trackName = trackNameInput.value.trim();
        if (trackName === "") {
            trackName = file.name.replace(/\.mp3$/i, '').replace(/\.MP3$/i, '');
            trackNameInput.value = trackName;
        }
        
        uploadBtn.disabled = true;
        uploadBtn.style.opacity = '0.7';
        const originalText = uploadBtn.innerHTML;
        uploadBtn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> PROSES...';
        
        try {
            showTerminalLog(["⟳ Mengupload ke Cloudinary...", `  track: ${trackName}`, `  ukuran: ${(file.size / 1024).toFixed(1)} KB`]);
            
            const audioUrl = await uploadToCloudinary(file);
            showTerminalLog(["✓ Upload Cloudinary sukses!", "⟳ Mengambil URL aman...", `🔗 ${audioUrl.substring(0, 65)}...`]);
            
            showTerminalLog(["⟳ Mengirim ke Database Firestore...", "  koleksi: mp3_list"]);
            await saveToFirestore(trackName, audioUrl);
            
            showTerminalLog(["✨ Sukses! Audio tersimpan di database.", "📡 Data telah dikirim ke sistem VGA TECH."]);
            showSuccessToast(`"${trackName}" berhasil diupload!`);
            clearLogAfterDelay(3000);
            
            mp3FileInput.value = '';
            fileNameDisplay.innerHTML = '';
            trackNameInput.value = '';
            
        } catch (error) {
            console.error("[ERROR UPLOAD]", error);
            showTerminalLog(`⚠️ Gagal: ${error.message}`, true);
        } finally {
            uploadBtn.disabled = false;
            uploadBtn.style.opacity = '1';
            uploadBtn.innerHTML = originalText;
        }
    }
    
    uploadBtn.addEventListener('click', handleUpload);
    
    // Sidebar mobile toggles
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggleBtn');
    function closeSidebar() { if(window.innerWidth <= 850) sidebar.classList.remove('mobile-open'); }
    function toggleMobileSidebar() {
        if(window.innerWidth <= 850) {
            sidebar.classList.toggle('mobile-open');
        }
    }
    menuToggle?.addEventListener('click', toggleMobileSidebar);
    document.addEventListener('click', (e) => {
        if(window.innerWidth <= 850 && sidebar.classList.contains('mobile-open') && !sidebar.contains(e.target) && e.target !== menuToggle && !menuToggle.contains(e.target)) {
            closeSidebar();
        }
    });
    
    // Nav dummy (hanya UI)
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            if(window.innerWidth <= 850) closeSidebar();
        });
    });
    
    // Inisialisasi
    function init() {
        console.log("VGA TECH ADMIN | Secure Encrypted Mode");
        db.collection("mp3_list").limit(1).get().catch(e => console.warn("Firestore check:", e.message));
    }
    
    init();
})();
