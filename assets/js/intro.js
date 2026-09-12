/**
 * BẾP 1979 - LUXURY CINEMATIC 3D CULINARY INTRO EXPERIENCE (PREMIUM EDITION)
 * - Canvas 60 FPS Particle Physics: Hệ thống hạt sao vàng, tàn lửa và làn khói bồng bềnh.
 * - Golden Cloche 3D Tương tác: Nhấc nắp đĩa vàng mở ra hương vị đặc sắc.
 * - 4 Món Ăn Tiêu Biểu Bếp 1979: Thẻ tương tác 3D kính mờ (Glassmorphism), bấm vào chuyển trang ngay lập tức.
 * - Âm thanh ẩm thực High-End sống động (Web Audio Synthesizer: tiếng leng keng dĩa bạc & xèo xèo bếp lửa).
 * - Đếm ngược 5 giây, nút Bỏ qua & Phím ESC.
 */

(function initLuxuryCinematicIntro() {
  if (window.location.pathname.includes("admin.html")) return;

  const urlParams = new URLSearchParams(window.location.search);
  const forceIntro = urlParams.get("intro") === "1";
  const hasSeenIntro = sessionStorage.getItem("foodhub_luxury_intro_seen_v3");

  if (hasSeenIntro && !forceIntro) {
    return;
  }

  sessionStorage.setItem("foodhub_luxury_intro_seen_v3", "true");

  // Web Audio Synthesizer
  let audioCtx = null;
  let isMuted = false;

  function playCulinarySound(type = "bell") {
    if (isMuted) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtx) audioCtx = new AudioCtx();
      if (audioCtx.state === "suspended") audioCtx.resume();

      const now = audioCtx.currentTime;

      if (type === "bell") {
        // High-end restaurant silver cloche chime
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(1480, now);
        osc.frequency.exponentialRampToValueAtTime(1100, now + 0.4);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === "sizzle") {
        // Cooking flame & sizzle burst
        const osc1 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        osc1.type = "triangle";
        osc1.frequency.setValueAtTime(320, now);
        osc1.frequency.linearRampToValueAtTime(840, now + 0.18);

        gain1.gain.setValueAtTime(0.15, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);
        osc1.start(now);
        osc1.stop(now + 0.22);
      }
    } catch (e) {
      // Browser autoplay policy graceful fallback
    }
  }

  // Particle explosion on interaction
  function triggerParticleBurst(x, y) {
    const colors = ["#ff4b1f", "#ff9b2f", "#ffd166", "#ffffff", "#ff8c00"];
    for (let i = 0; i < 28; i++) {
      const p = document.createElement("div");
      p.className = "intro-particle-burst";
      const size = Math.random() * 8 + 4;
      const angle = (Math.PI * 2 * i) / 28 + (Math.random() - 0.5) * 0.4;
      const dist = Math.random() * 90 + 35;
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist;

      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;
      p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      p.style.boxShadow = `0 0 10px ${p.style.backgroundColor}`;
      p.style.setProperty("--tx", `${tx}px`);
      p.style.setProperty("--ty", `${ty}px`);

      document.body.appendChild(p);
      setTimeout(() => p.remove(), 700);
    }
  }

  function createIntroElement() {
    const overlay = document.createElement("div");
    overlay.className = "fh-cinematic-intro";
    overlay.id = "luxuryIntroOverlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-label", "Bếp 1979 - Trải nghiệm ẩm thực thượng hạng");

    overlay.innerHTML = `
      <canvas class="intro-canvas-bg" id="introCanvas"></canvas>
      <div class="intro-light-core"></div>

      <!-- Top Navigation Bar -->
      <div class="intro-top-bar">
        <div class="intro-brand-mini">
          <span class="intro-mini-dot"></span>
          <span>Bếp Đang Nổi Lửa • Mở Cửa Phục Vụ</span>
        </div>

        <div class="intro-top-actions">
          <button type="button" class="intro-glass-btn" id="introSoundToggle" title="Bật/Tắt âm thanh">
            <span id="introSoundIcon">🔊</span>
            <span id="introSoundLabel">Âm thanh</span>
          </button>
          <button type="button" class="intro-glass-btn" id="introSkipBtn" title="Bỏ qua intro">
            <span>Bỏ qua</span>
            <span>✕</span>
          </button>
        </div>
      </div>

      <!-- Center Showcase Area -->
      <div class="intro-center-stage">
        <!-- 3D Luxury Cloche (Đĩa Đậy Thức Ăn Hoàng Gia Bốc Khói) -->
        <div class="intro-cloche-visual" id="introClocheVisual" title="Chạm để mở nắp đĩa vàng!">
          <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="goldPlateGrad" x1="10" y1="10" x2="110" y2="110" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#FFF5DB"/>
                <stop offset="30%" stop-color="#FFC857"/>
                <stop offset="70%" stop-color="#E87A1E"/>
                <stop offset="100%" stop-color="#8F3200"/>
              </linearGradient>
              <linearGradient id="rimShine" x1="0" y1="88" x2="120" y2="88" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#8F3200"/>
                <stop offset="50%" stop-color="#FFF9E6"/>
                <stop offset="100%" stop-color="#8F3200"/>
              </linearGradient>
              <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur"/>
                <feComposite in="SourceGraphic" in2="blur" operator="over"/>
              </filter>
            </defs>

            <!-- Làn Khói Thơm Nghi Ngút -->
            <path d="M48 24 C48 16 42 12 50 6" stroke="#FFA726" stroke-width="2.5" stroke-linecap="round" opacity="0.85">
              <animate attributeName="d" values="M48 24 C48 16 42 12 50 6; M48 24 C52 15 48 10 53 4; M48 24 C48 16 42 12 50 6" dur="2.2s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.3;0.9;0.3" dur="2.2s" repeatCount="indefinite"/>
            </path>
            <path d="M58 22 C61 15 55 10 62 4" stroke="#FF7043" stroke-width="3" stroke-linecap="round" opacity="0.9">
              <animate attributeName="d" values="M58 22 C61 15 55 10 62 4; M58 22 C55 14 62 8 59 2; M58 22 C61 15 55 10 62 4" dur="2.5s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.3;1;0.3" dur="2.5s" repeatCount="indefinite"/>
            </path>
            <path d="M68 25 C68 18 73 13 65 7" stroke="#FFD54F" stroke-width="2.5" stroke-linecap="round" opacity="0.8">
              <animate attributeName="d" values="M68 25 C68 18 73 13 65 7; M68 25 C65 17 67 12 63 6; M68 25 C68 18 73 13 65 7" dur="2.1s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.2;0.85;0.2" dur="2.1s" repeatCount="indefinite"/>
            </path>

            <!-- Núm Cầm Cloche Bằng Vàng -->
            <circle cx="60" cy="28" r="7" fill="url(#goldPlateGrad)" filter="url(#goldGlow)"/>
            <circle cx="60" cy="27" r="3" fill="#FFF"/>

            <!-- Thân Nắp Vòm Cung Cloche Hoàng Gia -->
            <path d="M22 82 C24 44, 40 34, 60 34 C80 34, 96 44, 98 82 Z" fill="url(#goldPlateGrad)" filter="url(#goldGlow)"/>
            <!-- Vệt Phản Quang Sang Trọng -->
            <path d="M34 76 C36 50, 46 42, 60 42" stroke="rgba(255,255,255,0.7)" stroke-width="3.5" stroke-linecap="round"/>

            <!-- Khay Bạc Đựng Món Ăn -->
            <rect x="14" y="83" width="92" height="7" rx="3.5" fill="url(#rimShine)"/>
            <path d="M6 90 C6 88.5, 114 88.5, 114 90 C114 96, 92 98, 60 98 C28 98, 6 96, 6 90 Z" fill="url(#goldPlateGrad)"/>
          </svg>
          <div class="intro-cloche-tip">Chạm mở nắp ✦</div>
        </div>

        <div class="intro-title-area">
          <div class="intro-badge-row">
            <span class="intro-year-badge">1979</span>
            <span class="intro-status-text">Đậm Đà Bản Sắc Ẩm Thực</span>
          </div>
          <h1 class="intro-hero-title">BẾP 1979</h1>
          <p class="intro-hero-subtitle">Món ngon nóng hổi • Đặt món siêu nhanh • Giao tận tay</p>
        </div>

        <!-- 4 Thẻ Món Ăn Thượng Hạng (Glassmorphism 3D Cards) -->
        <div class="intro-cards-carousel" id="introCardsCarousel">
          <div class="intro-dish-card" data-dish="Cơm">
            <div class="intro-card-icon">🍱</div>
            <div class="intro-card-name">Cơm Tấm Sườn</div>
            <div class="intro-card-tag">Đậm vị truyền thống</div>
          </div>
          <div class="intro-dish-card" data-dish="Lẩu">
            <div class="intro-card-icon">🍲</div>
            <div class="intro-card-name">Lẩu Thái Chua Cay</div>
            <div class="intro-card-tag">Nước dùng thơm cay</div>
          </div>
          <div class="intro-dish-card" data-dish="Gà">
            <div class="intro-card-icon">🍗</div>
            <div class="intro-card-name">Gà Rán Giòn Cay</div>
            <div class="intro-card-tag">Vàng ruộm nóng hổi</div>
          </div>
          <div class="intro-dish-card" data-dish="Trà Sữa">
            <div class="intro-card-icon">🧋</div>
            <div class="intro-card-name">Trà Sữa Bếp 79</div>
            <div class="intro-card-tag">Trân châu dẻo béo</div>
          </div>
        </div>

        <!-- Điều Khiển & Tiến Trình 5 Giây -->
        <div class="intro-bottom-controls">
          <button type="button" class="intro-main-cta" id="introCtaBtn">
            <span>Khám phá thực đơn ngay</span>
            <span>➔</span>
          </button>

          <div class="intro-progress-status">
            <div class="intro-timeline-track">
              <div class="intro-timeline-fill"></div>
            </div>
            <span class="intro-timer-badge" id="introTimerBadge">10s</span>
          </div>
        </div>
      </div>
    `;

    return overlay;
  }

  // Canvas Physics Engine (Golden sparks & soft embers)
  function initCanvasAtmosphere(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const onResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    const particles = [];
    const colors = ["#ff4b1f", "#ff9b2f", "#ffd166", "#ffa726", "#ffffff"];

    for (let i = 0; i < 45; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2.5 + 0.8,
        color: colors[Math.floor(Math.random() * colors.length)],
        vy: -(Math.random() * 1.2 + 0.5),
        vx: (Math.random() - 0.5) * 0.8,
        alpha: Math.random() * 0.7 + 0.3,
        pulseSpeed: Math.random() * 0.03 + 0.01
      });
    }

    let animId = null;
    function render() {
      ctx.clearRect(0, 0, width, height);

      for (let p of particles) {
        p.y += p.vy;
        p.x += p.vx;
        p.alpha += Math.sin(Date.now() * p.pulseSpeed) * 0.01;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0.1, Math.min(1, p.alpha));
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    }

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
    };
  }

  function startIntro() {
    const overlay = createIntroElement();
    document.body.prepend(overlay);

    const canvas = overlay.querySelector("#introCanvas");
    const cleanupCanvas = initCanvasAtmosphere(canvas);

    const cloche = overlay.querySelector("#introClocheVisual");
    const cards = overlay.querySelectorAll(".intro-dish-card");
    const ctaBtn = overlay.querySelector("#introCtaBtn");
    const skipBtn = overlay.querySelector("#introSkipBtn");
    const soundToggle = overlay.querySelector("#introSoundToggle");
    const soundIcon = overlay.querySelector("#introSoundIcon");
    const timerBadge = overlay.querySelector("#introTimerBadge");

    let isDismissed = false;
    function exitIntro(destination) {
      if (isDismissed) return;
      isDismissed = true;

      playCulinarySound("bell");
      overlay.classList.add("intro-exit");

      setTimeout(() => {
        if (cleanupCanvas) cleanupCanvas();
        if (overlay && overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
        if (destination) {
          window.location.href = destination;
        }
      }, 750);
    }

    // 1. Tương tác Nắp đĩa vàng: Chạm vào mở nắp bốc khói và phát chuông vàng
    cloche.addEventListener("click", (e) => {
      const rect = cloche.getBoundingClientRect();
      triggerParticleBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);
      playCulinarySound("bell");

      cloche.style.transform = "scale(1.2) translateY(-14px) rotateX(16deg)";
      setTimeout(() => {
        cloche.style.transform = "";
      }, 350);
    });

    // 2. Tương tác 4 Thẻ Món Ăn: Bấm vào bay hạt lấp lánh và chuyển thẳng đến món đó
    cards.forEach(card => {
      card.addEventListener("click", () => {
        const dish = card.dataset.dish;
        const rect = card.getBoundingClientRect();
        triggerParticleBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);
        playCulinarySound("sizzle");

        exitIntro(`menu.html?search=${encodeURIComponent(dish)}`);
      });
    });

    // 3. Nút Âm Thanh Bật/Tắt
    soundToggle.addEventListener("click", () => {
      isMuted = !isMuted;
      soundIcon.textContent = isMuted ? "🔇" : "🔊";
      soundToggle.style.opacity = isMuted ? "0.6" : "1";
    });

    // 4. Nút Khám Phá & Bỏ Qua
    ctaBtn.addEventListener("click", () => exitIntro());
    skipBtn.addEventListener("click", () => exitIntro());

    // 5. Đếm ngược 10s
    let secondsLeft = 10;
    const interval = setInterval(() => {
      secondsLeft -= 1;
      if (timerBadge) {
        timerBadge.textContent = `${Math.max(0, secondsLeft)}s`;
      }
      if (secondsLeft <= 0) {
        clearInterval(interval);
        exitIntro();
      }
    }, 1000);

    // Thoát bằng phím Escape
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        clearInterval(interval);
        exitIntro();
        window.removeEventListener("keydown", onKeyDown);
      }
    };
    window.addEventListener("keydown", onKeyDown);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startIntro);
  } else {
    startIntro();
  }
})();
