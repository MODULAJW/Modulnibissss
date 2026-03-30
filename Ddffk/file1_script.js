(function() {
    // ========= FIREBASE INIT =========
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

    const loadingOverlay = document.getElementById('sessionLoading');
    const loginLayout = document.getElementById('loginLayout');

    // ========= FUNGSI UTAMA: CEK SESSION AKTIF DAN VALIDASI KE FIREBASE =========
    async function checkActiveSessionAndRedirect() {
        const activeSession = localStorage.getItem('vga_active_session');
        
        if (!activeSession) {
            loadingOverlay.style.display = 'none';
            loginLayout.style.display = 'flex';
            return false;
        }
        
        try {
            const sessionData = JSON.parse(activeSession);
            const { username, loginTimestamp, durationDays } = sessionData;
            
            if (!username || !loginTimestamp || !durationDays) {
                localStorage.removeItem('vga_active_session');
                loadingOverlay.style.display = 'none';
                loginLayout.style.display = 'flex';
                return false;
            }
            
            const usersRef = db.collection('users');
            const querySnapshot = await usersRef.where('username', '==', username).limit(1).get();
            
            if (querySnapshot.empty) {
                console.log("User tidak ditemukan di database, menghapus session");
                localStorage.removeItem('vga_active_session');
                loadingOverlay.style.display = 'none';
                loginLayout.style.display = 'flex';
                return false;
            }
            
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();
            const startTimeFromDB = userData.startTime || null;
            const durationDaysFromDB = userData.duration || 0;
            const deviceIdFromDB = userData.deviceId || null;
            const currentDeviceId = localStorage.getItem('vga_device_id') || null;
            
            if (deviceIdFromDB !== null && currentDeviceId !== null && deviceIdFromDB !== currentDeviceId) {
                console.log("Device ID tidak cocok, session tidak valid");
                localStorage.removeItem('vga_active_session');
                loadingOverlay.style.display = 'none';
                loginLayout.style.display = 'flex';
                return false;
            }
            
            if (startTimeFromDB !== null && durationDaysFromDB > 0) {
                const now = Date.now();
                const elapsedMs = now - startTimeFromDB;
                const maxDurationMs = durationDaysFromDB * 24 * 60 * 60 * 1000;
                
                if (elapsedMs > maxDurationMs) {
                    console.log("Masa aktif sudah habis");
                    localStorage.removeItem('vga_active_session');
                    loadingOverlay.style.display = 'none';
                    loginLayout.style.display = 'flex';
                    return false;
                }
            } else {
                console.log("Data durasi tidak lengkap");
                localStorage.removeItem('vga_active_session');
                loadingOverlay.style.display = 'none';
                loginLayout.style.display = 'flex';
                return false;
            }
            
            const updatedSession = {
                username: username,
                loginTimestamp: startTimeFromDB,
                durationDays: durationDaysFromDB
            };
            localStorage.setItem('vga_active_session', JSON.stringify(updatedSession));
            
            window.location.href = "./VGATECH.html";
            return true;
            
        } catch (e) {
            console.error("Error checking session:", e);
            localStorage.removeItem('vga_active_session');
            loadingOverlay.style.display = 'none';
            loginLayout.style.display = 'flex';
            return false;
        }
    }
    
    checkActiveSessionAndRedirect();
    
    // ========= URL LOGO =========
    const logo1 = "https://res.cloudinary.com/dwiozm4vz/image/upload/v1774449893/wqbkrlayj1wfvbnaefl2.png";
    const logo2 = "https://res.cloudinary.com/dwiozm4vz/image/upload/v1774524752/gtbloooicxhkoz0ncvxx.png";
    
    let currentLogoIndex = 0;
    const logoWrapper = document.getElementById('logoWrapper');
    const mainLogoImg = document.getElementById('mainLogo');
    let isAnimating = false;
    
    function switchLogoWithGlow() {
        if (isAnimating) return;
        isAnimating = true;
        
        logoWrapper.classList.add('glowing');
        setTimeout(() => logoWrapper.classList.remove('glowing'), 700);
        
        mainLogoImg.classList.add('exit');
        
        setTimeout(() => {
            currentLogoIndex = currentLogoIndex === 0 ? 1 : 0;
            mainLogoImg.src = currentLogoIndex === 0 ? logo1 : logo2;
            
            mainLogoImg.classList.remove('exit');
            mainLogoImg.classList.add('enter');
            
            setTimeout(() => {
                mainLogoImg.classList.remove('enter');
                isAnimating = false;
            }, 600);
            
            animateAllRakLogos();
        }, 500);
    }
    
    function animateAllRakLogos() {
        const rakLogos = document.querySelectorAll('.rak-logo-img');
        if (rakLogos.length === 0) return;
        const targetLogo = currentLogoIndex === 0 ? logo2 : logo1;
        
        rakLogos.forEach(logo => {
            logo.classList.add('exit-logo');
            setTimeout(() => {
                logo.src = targetLogo;
                logo.classList.remove('exit-logo');
                logo.classList.add('enter-logo');
                setTimeout(() => {
                    logo.classList.remove('enter-logo');
                }, 550);
            }, 450);
        });
    }
    
    let logoInterval = setInterval(switchLogoWithGlow, 5000);
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            clearInterval(logoInterval);
        } else {
            logoInterval = setInterval(switchLogoWithGlow, 5000);
        }
    });
    
    // ========= AUDIO BACKGROUND =========
    const audio1 = new Audio('https://res.cloudinary.com/dwiozm4vz/video/upload/v1774504340/dvfxhaoywsaw6kkckgoa.mp3');
    const audio2 = new Audio('https://res.cloudinary.com/dwiozm4vz/video/upload/v1774504369/tsmso78amhbwfvouoglp.mp3');
    
    audio1.volume = 0.55;
    audio2.volume = 0.55;
    audio1.preload = 'auto';
    audio2.preload = 'auto';
    
    let isAudioPlaying = false;
    let audioStarted = false;
    let currentAudio = null;
    
    function stopAllAudio() {
        if (audio1) { audio1.pause(); audio1.currentTime = 0; }
        if (audio2) { audio2.pause(); audio2.currentTime = 0; }
        isAudioPlaying = false;
        audioStarted = false;
        currentAudio = null;
    }
    
    function playSequentialAudio() {
        if (audioStarted) return;
        audioStarted = true;
        isAudioPlaying = true;
        
        audio1.currentTime = 0;
        audio1.play().then(() => {
            currentAudio = audio1;
            document.getElementById('audioStatusText').innerText = 'Audio ON';
        }).catch(e => {
            audioStarted = false;
            document.getElementById('audioStatusText').innerText = 'Klik untuk Audio';
        });
        
        audio1.onended = function() {
            if (!isAudioPlaying) return;
            audio2.currentTime = 0;
            audio2.play().catch(e => console.log);
            currentAudio = audio2;
            audio2.onended = function() {
                if (!isAudioPlaying) return;
                audio2.currentTime = 0;
                audio2.play().catch(e => console.log);
            };
        };
    }
    
    function startAudioManually() {
        if (!audioStarted) {
            playSequentialAudio();
        } else if (isAudioPlaying && currentAudio) {
            currentAudio.pause();
            isAudioPlaying = false;
            document.getElementById('audioStatusText').innerText = 'Audio OFF';
        } else if (!isAudioPlaying && audioStarted) {
            if (currentAudio) {
                currentAudio.play().catch(e => console.log);
                isAudioPlaying = true;
                document.getElementById('audioStatusText').innerText = 'Audio ON';
            } else {
                playSequentialAudio();
            }
        }
    }
    
    const audioBtn = document.getElementById('audioControlBtn');
    audioBtn.addEventListener('click', startAudioManually);
    
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            if (currentAudio && !currentAudio.paused) {
                currentAudio.pause();
                isAudioPlaying = false;
                if (audioStarted) document.getElementById('audioStatusText').innerText = 'Audio OFF';
            }
        }
    });
    
    window.addEventListener('beforeunload', function() {
        if (audio1) { audio1.pause(); audio1.currentTime = 0; }
        if (audio2) { audio2.pause(); audio2.currentTime = 0; }
    });
    
    // ========= LOGIN FORM + FIREBASE LOGIC =========
    const nameInput = document.getElementById('fullname');
    const passwordInput = document.getElementById('passwordField');
    const nameError = document.getElementById('nameErrorMsg');
    const passError = document.getElementById('passErrorMsg');
    const loginBtn = document.getElementById('loginBtnAction');
    const loginForm = document.getElementById('secureLoginForm');
    const togglePw = document.getElementById('togglePasswordBtn');
    const daftarBtn = document.getElementById('daftarMarketBtn');
    const marketPage = document.getElementById('marketPage');
    const backBtn = document.getElementById('backToLoginBtn');
    const videoContainer = document.getElementById('securityVideoContainer');
    const securityVideo = document.getElementById('securityVideo');
    
    let isLoading = false;
    let isPwVisible = false;
    
    passwordInput.addEventListener('focus', () => {
        videoContainer.classList.add('active');
        if (securityVideo) securityVideo.play().catch(e => console.log);
    });
    passwordInput.addEventListener('blur', () => {
        videoContainer.classList.remove('active');
        if (securityVideo) securityVideo.pause();
    });
    if (securityVideo) securityVideo.loop = true;
    
    function validate() {
        let valid = true;
        if (!nameInput.value.trim()) {
            nameError.classList.add('show');
            nameInput.classList.add('shake-effect');
            setTimeout(() => nameInput.classList.remove('shake-effect'), 450);
            valid = false;
        } else nameError.classList.remove('show');
        if (!passwordInput.value) {
            passError.classList.add('show');
            passwordInput.classList.add('shake-effect');
            setTimeout(() => passwordInput.classList.remove('shake-effect'), 450);
            valid = false;
        } else passError.classList.remove('show');
        return valid;
    }
    
    function showToast(message, isError = false) {
        const toast = document.createElement('div');
        toast.className = 'premium-toast';
        toast.style.cssText = 'position:fixed;bottom:28px;right:28px;z-index:10000;background:rgba(8,18,28,0.96);backdrop-filter:blur(20px);border-left:3px solid #0ff;border-radius:28px;padding:1rem 1.8rem;display:flex;align-items:center;gap:14px;box-shadow:0 20px 40px rgba(0,0,0,0.6),0 0 28px rgba(0,255,255,0.3);';
        if(isError) toast.style.borderLeftColor = "#ff4d6d";
        toast.innerHTML = `<span class="material-symbols-rounded" style="color:${isError ? '#ff6b8b' : '#0ff'};font-size:30px;">${isError ? 'error' : 'verified'}</span><div><strong style="color:${isError ? '#ff6b8b' : '#0ff'};">${isError ? 'Login Gagal' : 'Verifikasi Sukses'}</strong><div style="font-size:0.75rem;">${message}</div></div>`;
        document.body.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 350); }, 3200);
    }
    
    function getDeviceId() {
        let deviceId = localStorage.getItem('vga_device_id');
        if (!deviceId) {
            deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 16);
            localStorage.setItem('vga_device_id', deviceId);
        }
        return deviceId;
    }
    
    async function handleFirebaseLogin(username, password) {
        try {
            const usersRef = db.collection('users');
            const querySnapshot = await usersRef.where('username', '==', username).where('password', '==', password).limit(1).get();
            
            if (querySnapshot.empty) {
                showToast('Username atau Password salah', true);
                return false;
            }
            
            const doc = querySnapshot.docs[0];
            const userData = doc.data();
            const deviceIdFromDB = userData.deviceId || null;
            const startTimeFromDB = userData.startTime || null;
            const durationDays = userData.duration || 0;
            const currentDeviceId = getDeviceId();
            
            if (deviceIdFromDB !== null && deviceIdFromDB !== currentDeviceId) {
                showToast('Akun sudah digunakan di perangkat lain', true);
                return false;
            }
            
            let finalStartTime = startTimeFromDB;
            if (startTimeFromDB !== null) {
                const now = Date.now();
                const elapsedMs = now - startTimeFromDB;
                const maxDurationMs = durationDays * 24 * 60 * 60 * 1000;
                if (elapsedMs > maxDurationMs) {
                    showToast('Masa aktif akun sudah habis', true);
                    return false;
                }
            }
            
            const updateData = {};
            if (deviceIdFromDB === null) {
                updateData.deviceId = currentDeviceId;
                updateData.startTime = Date.now();
                finalStartTime = updateData.startTime;
            }
            
            if (Object.keys(updateData).length > 0) {
                await doc.ref.update(updateData);
            }
            
            const sessionPayload = {
                username: username,
                loginTimestamp: finalStartTime,
                durationDays: durationDays
            };
            localStorage.setItem('vga_active_session', JSON.stringify(sessionPayload));
            
            return true;
        } catch (error) {
            console.error("Firebase Error:", error);
            showToast('Koneksi database gagal, coba lagi', true);
            return false;
        }
    }
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (isLoading) return;
        if (!validate()) return;
        
        isLoading = true;
        const originalHtml = loginBtn.innerHTML;
        loginBtn.disabled = true;
        loginBtn.innerHTML = `<span class="spinner-ring" style="width:20px;height:20px;border:2px solid rgba(255,255,255,0.3);border-top:2px solid white;border-radius:50%;display:inline-block;animation:spinRing 0.8s linear infinite;"></span> Authenticating...`;
        
        const username = nameInput.value.trim();
        const password = passwordInput.value;
        
        const isSuccess = await handleFirebaseLogin(username, password);
        
        isLoading = false;
        loginBtn.disabled = false;
        loginBtn.innerHTML = originalHtml;
        
        if (isSuccess) {
            showToast(`Selamat datang, ${username.substring(0, 30)}`);
            setTimeout(() => {
                window.location.href = "./VGATECH.html";
            }, 1500);
        }
    });
    
    togglePw.addEventListener('click', () => {
        passwordInput.type = isPwVisible ? 'password' : 'text';
        togglePw.textContent = isPwVisible ? 'visibility' : 'visibility_off';
        isPwVisible = !isPwVisible;
    });
    
    nameInput.addEventListener('input', () => { if (nameInput.value.trim()) nameError.classList.remove('show'); });
    passwordInput.addEventListener('input', () => { if (passwordInput.value) passError.classList.remove('show'); });
    
    daftarBtn.addEventListener('click', () => { loginLayout.style.display = 'none'; marketPage.classList.add('active'); });
    backBtn.addEventListener('click', () => { marketPage.classList.remove('active'); loginLayout.style.display = 'flex'; });
    
    // ========= RENDER RAK =========
    const rakList = [
        { id: 1, title: "VGA TECH | UNLIMITED", desc: "VGA TECH V2", price: "Rp 30.000", details: [ "Durasi tidak terbatas ( Selamanya )", "Mendapatkan semua fitur"], info: "" },
        { id: 2, title: "VGA TECH | 1 TAHUN", desc: "DURASI 1 TAHUN.", price: "Rp 25.000", details: ["paket Hemat", ], info: "" },
        { id: 4, title: "VGA TECH | 5 Bulan", desc: "Compact hemat tempat, cocok home theater.", price: "Rp 20.000", details: ["PAKET SEDANG",], info: "" },
        { id: 5, title: "VGA TECH | 5 MINGGU", desc: "Firewall appliance untuk kantor/server.", price: "Rp 15.000", details: ["PAKET CERDAS"], info: "" },
        { id: 6, title: "VGA TECH | 6 Hari", desc: "Optimal untuk live streaming.", price: "Rp 10.000", details: ["paket receh"], info: "" }
    ];
    
    function renderRak() {
        const container = document.getElementById('rakGridContainer');
        if (!container) return;
        container.innerHTML = rakList.map(rak => `
            <div class="rak-card">
                <div class="rak-image">
                    <div class="rak-logo-wrapper">
                        <img class="rak-logo-img" src="${logo1}" alt="VGA Tech Logo">
                    </div>
                </div>
                <div class="rak-info">
                    <div class="rak-title">${rak.title}</div>
                    <div class="rak-desc">${rak.desc}</div>
                    <div class="rak-price">${rak.price}</div>
                    <ul class="detail-list">${rak.details.map(d => `<li>🔹 ${d}</li>`).join('')}</ul>
                    <div style="font-size:0.7rem;color:#6d85b0;margin:6px 0;padding-top:4px;border-top:1px solid rgba(0,255,255,0.1);"> ${rak.info}</div>
                    <button class="beli-button" data-title="${rak.title}" data-price="${rak.price}" data-desc="${rak.desc}" data-info="${rak.info}" data-details="${rak.details.join(', ')}">
                        <span class="material-symbols-rounded">shopping_cart</span> BELI SEKARANG
                    </button>
                </div>
            </div>
        `).join('');
        
        document.querySelectorAll('.beli-button').forEach(btn => {
            btn.addEventListener('click', () => {
                const title = btn.dataset.title, price = btn.dataset.price, desc = btn.dataset.desc, info = btn.dataset.info, details = btn.dataset.details;
                const msg = `HALO ADMIN VGA TECH V2%0A%0ASaya tertarik dengan:%0A📦 *${title}*%0A💰 ${price}%0A📝 ${desc}%0A🔧 ${details}%0A✨ ${info}%0A%0A*Order via Market VGA TECH*`;
                window.open(`https://wa.me/6289504546082?text=${msg}`, '_blank');
            });
        });
        
        const targetRakLogo = currentLogoIndex === 0 ? logo2 : logo1;
        document.querySelectorAll('.rak-logo-img').forEach(img => { img.src = targetRakLogo; });
    }
    renderRak();
    
    function initParticles() {
        const container = document.getElementById('particlesContainer');
        if (!container) return;
        for (let i = 0; i < 32; i++) {
            const p = document.createElement('div');
            p.classList.add('particle');
            p.style.cssText = `width:${Math.random()*10+2}px;height:${Math.random()*10+2}px;left:${Math.random()*100}%;top:${Math.random()*100}%;animation-delay:${Math.random()*16}s;animation-duration:${12+Math.random()*14}s;background:radial-gradient(circle,rgba(0,255,255,${Math.random()*0.5+0.1}),rgba(138,43,226,0.2))`;
            container.appendChild(p);
        }
    }
    initParticles();
})();
