// ==================== SPLASH SCREEN PROGRESS REALISTIS ====================
let progressValue = 0;
const splashFill = document.getElementById('splashFill');
const splashScreenDiv = document.getElementById('splashScreen');
const interval = setInterval(() => {
  if(progressValue < 100) {
    progressValue += Math.floor(Math.random() * 15) + 2;
    if(progressValue > 100) progressValue = 100;
    splashFill.style.width = progressValue + '%';
  } 
  if(progressValue >= 100) {
    clearInterval(interval);
    setTimeout(() => {
      splashScreenDiv.style.opacity = '0';
      splashScreenDiv.style.visibility = 'hidden';
    }, 500);
  }
}, 100);

// CUSTOM CURSOR
const glow = document.getElementById('cursorGlow');
const dot = document.getElementById('cursorDot');
document.addEventListener('mousemove', (e) => {
  dot.style.left = e.clientX + 'px';
  dot.style.top = e.clientY + 'px';
  glow.style.left = e.clientX + 'px';
  glow.style.top = e.clientY + 'px';
});
const interactive = document.querySelectorAll('a, button, .btn, .skill-card, .project-card, .testimonial-card');
interactive.forEach(el => {
  el.addEventListener('mouseenter', () => { glow.style.width = '50px'; glow.style.height = '50px'; glow.style.background = 'radial-gradient(circle, rgba(0,210,255,0.65) 0%, rgba(0,160,255,0) 75%)'; });
  el.addEventListener('mouseleave', () => { glow.style.width = '36px'; glow.style.height = '36px'; glow.style.background = 'radial-gradient(circle, rgba(0,200,255,0.45) 0%, rgba(0,160,255,0) 70%)'; });
});

// Navbar scroll effect
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => { window.scrollY > 30 ? navbar.classList.add('scrolled') : navbar.classList.remove('scrolled'); });

// Typing text
const roles = ["UI/UX Designer", "Creative Technologist", "Fullstack Alchemist"];
let roleIndex = 0, charIndex = 0, isDeleting = false;
const typedSpan = document.getElementById('typedText');
function typeEffect() {
  const current = roles[roleIndex];
  if(isDeleting) {
    typedSpan.innerText = current.substring(0, charIndex-1);
    charIndex--;
    if(charIndex === 0) { isDeleting=false; roleIndex = (roleIndex+1)%roles.length; setTimeout(typeEffect, 400); return; }
  } else {
    typedSpan.innerText = current.substring(0, charIndex+1);
    charIndex++;
    if(charIndex === current.length) { isDeleting=true; setTimeout(typeEffect, 1800); return; }
  }
  setTimeout(typeEffect, isDeleting ? 55 : 100);
}
typeEffect();

// SCROLL REVEAL
const faders = document.querySelectorAll('.fade-up');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => { if(entry.isIntersecting) entry.target.classList.add('visible'); });
}, { threshold: 0.2 });
faders.forEach(el => observer.observe(el));

// Particle canvas dinamis
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
let particles = [];
function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
for(let i=0;i<120;i++) {
  particles.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, radius: Math.random()*2.2+0.6, alpha: Math.random()*0.6+0.2, vx: (Math.random()-0.5)*0.2, vy: (Math.random()-0.5)*0.1 });
}
function drawStars() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  for(let p of particles) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2);
    ctx.fillStyle = `rgba(0, 200, 255, ${p.alpha*0.8})`;
    ctx.fill();
    p.x += p.vx; p.y += p.vy;
    if(p.x<0) p.x=canvas.width; if(p.x>canvas.width) p.x=0;
    if(p.y<0) p.y=canvas.height; if(p.y>canvas.height) p.y=0;
  }
  requestAnimationFrame(drawStars);
}
drawStars();

// Smooth scroll + mobile menu
document.querySelectorAll('.nav-links a').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const id = this.getAttribute('href').substring(1);
    const target = document.getElementById(id);
    if(target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('navLinks').classList.remove('active');
  });
});
document.getElementById('menuIcon').addEventListener('click', () => {
  document.getElementById('navLinks').classList.toggle('active');
});
document.getElementById('contactForm').addEventListener('submit', (e) => {
  e.preventDefault();
  alert('✨ Pesan visioner terkirim! Akan saya balas dalam 24 jam ✨');
  e.target.reset();
});
document.getElementById('hireBtn').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
});

// ========== DOWNLOAD CV REAL (PDF) ==========
document.getElementById('downloadCV').addEventListener('click', (e) => {
  e.preventDefault();
  // Membuat file PDF dinamis menggunakan Blob agar terdownload dengan nama RizzXploit_CV.pdf
  const cvContent = `
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 256 >>
stream
BT
/F1 24 Tf
100 700 Td
(RIZZXPLOIT - VISIONARY CV) Tj
/F1 16 Tf
100 650 Td
(Nama: RizzXploit | Fullstack & Creative Technologist) Tj
100 600 Td
(Email: rizz@xploit.space | Portfolio: rizzxploit.xyz) Tj
100 550 Td
(Keahlian: React,Node.js, Three.js, UI/UX, Web3) Tj
100 500 Td
(Project: CyberForge XR, Nexus AI, Metaverse Port) Tj
100 450 Td
(Pengalaman 4+ tahun menghadirkan solusi digital inovatif) Tj
100 400 Td
("Estetika tinggi, kode solid, tanpa batas.") Tj
ET
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000221 00000 n
0000000558 00000 n
trailer << /Size 6 /Root 1 0 R >>
startxref
638
%%EOF
  `;
  const blob = new Blob([cvContent], { type: 'application/pdf' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = 'RizzXploit_CV.pdf';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
});

// ========== SET LINK SOSIAL MEDIA DISINI (GANTI DENGAN LINK ASLIKU) ==========
// Cukup edit href di bawah ini dengan akun sosial media asli kamu
document.getElementById('instagramLink').href = 'https://www.instagram.com/riszz_xploit?igsh=MWx0cGRwMWVnOWppMw==';
document.getElementById('linkedinLink').href = 'https://linkedin.com';
document.getElementById('githubLink').href = 'https://github.com';
document.getElementById('whatsappLink').href = 'https://wa.me/6289504546082';
document.getElementById('tiktokLink').href = 'https://tiktok.com';

// Untuk tombol project preview bisa navigasi smooth (optional)
document.querySelectorAll('.project-preview').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    alert('Project sedang mengalami masalah.. harap tunggu...');
  });
});
