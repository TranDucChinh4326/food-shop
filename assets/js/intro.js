/**
 * BẾP 1979 - HIGH-ENERGY INTERACTIVE INTRO EXPERIENCE
 * Tự động chạy 5 giây khi người dùng vào website.
 * Tính năng tương tác sôi động:
 * 1. Đèn rọi Spotlight di chuyển mượt mà theo trỏ chuột người dùng.
 * 2. Chảo lửa xèo xèo: Bấm vào chảo tạo hiệu ứng bùng pháo hoa ẩm thực & âm thanh xèo xèo sống động.
 * 3. Các nút "Hôm nay bạn thèm gì?": Bấm trực tiếp (Lẩu Thái, Cơm Tấm, Trà Sữa, Gà Rán...) để vào thẳng món đó!
 * 4. Nút "Khám phá ngay", thanh đếm ngược 5 giây, nút "Bỏ qua" và phím ESC.
 */

(function initFoodHubInteractiveIntro() {
  if (window.location.pathname.includes("admin.html")) return;

  const urlParams = new URLSearchParams(window.location.search);
  const forceIntro = urlParams.get("intro") === "1";
  const hasSeenIntro = sessionStorage.getItem("foodhub_has_seen_intro_v2");

  if (hasSeenIntro && !forceIntro) {
    return;
  }

  sessionStorage.setItem("foodhub_has_seen_intro_v2", "true");

  // Web Audio Context for realistic culinary sizzle & pop sounds (zero external file dependency)
  let audioCtx = null;
  function playCookingSound(type = "pop") {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!audioCtx) audioCtx = new AudioContext();
      if (audioCtx.state === "suspended") audioCtx.resume();

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === "pop") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(320, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(780, audioCtx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.22, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
      } else if (type === "sizzle") {
        // High energy chime
        osc.type = "triangle";
        osc.frequency.setValueAtTime(520, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.28, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      }
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  // Particle explosion on interaction
  function spawnBurstParticles(x, y) {
    const colors = ["#ff4b1f", "#ff9b2f", "#ffd166", "#00e676", "#ff007f", "#ffffff"];
    for (let i = 0; i < 24; i++) {
      const p = document.createElement("div");
      p.className = "fh-intro-burst-particle";
      const size = Math.random() * 9 + 5;
      const angle = (Math.PI * 2 * i) / 24 + (Math.random() - 0.5) * 0.4;
      const distance = Math.random() * 90 + 40;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;

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
    overlay.className = "fh-intro-overlay";
    overlay.id = "foodHubIntroOverlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-label", "Bếp 1979 - Chào mừng bạn");

    overlay.innerHTML = `
      <div class="fh-intro-spotlight" id="introSpotlight"></div>
      <div class="fh-intro-sparks-wrap" id="introSparksWrap"></div>

      <button type="button" class="fh-intro-skip-btn" id="introSkipBtn" title="Bỏ qua intro">
        <span>Bỏ qua</span>
        <svg viewBox="0 0 24 24">
          <path d="M5.59 7.41L10.18 12l-4.59 4.59L7 18l6-6-6-6zM16 6h2v12h-2z"/>
        </svg>
      </button>

      <div class="fh-intro-stage">
        <div class="fh-intro-energy-tag">
          <span>🔥 Bếp Đang Nổi Lửa</span>
          <span>•</span>
          <span>Giao Nhanh 20 Phút</span>
        </div>

        <!-- Chảo lửa xèo xèo tương tác (bấm vào bùng pháo hoa) -->
        <div class="fh-intro-hero-visual" id="introHeroVisual" title="Chạm vào chảo để xào lửa!">
          <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="wokGradient" x1="20" y1="50" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#3a2218"/>
                <stop offset="60%" stop-color="#1c0f0a"/>
                <stop offset="100%" stop-color="#0a0503"/>
              </linearGradient>
              <linearGradient id="fireOrange" x1="30" y1="20" x2="80" y2="70" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#FFF176"/>
                <stop offset="40%" stop-color="#FF9800"/>
                <stop offset="100%" stop-color="#E64A19"/>
              </linearGradient>
            </defs>

            <!-- Lửa bốc cuồn cuộn trong chảo -->
            <path d="M42 55 C40 38, 48 24, 60 16 C63 26, 68 28, 74 34 C80 40, 78 50, 70 56 Z" fill="url(#fireOrange)">
              <animate attributeName="d" 
                values="M42 55 C40 38, 48 24, 60 16 C63 26, 68 28, 74 34 C80 40, 78 50, 70 56 Z;
                        M44 55 C38 34, 52 20, 58 12 C64 24, 72 26, 76 38 C80 46, 74 53, 68 56 Z;
                        M42 55 C40 38, 48 24, 60 16 C63 26, 68 28, 74 34 C80 40, 78 50, 70 56 Z" 
                dur="1.2s" repeatCount="indefinite" />
            </path>
            <path d="M50 55 C48 42, 53 32, 60 26 C64 33, 67 36, 68 44 C70 48, 66 52, 62 55 Z" fill="#FFE082">
              <animate attributeName="d" 
                values="M50 55 C48 42, 53 32, 60 26 C64 33, 67 36, 68 44 C70 48, 66 52, 62 55 Z;
                        M52 55 C46 40, 55 30, 62 22 C65 30, 68 34, 66 42 C68 48, 63 53, 60 55 Z;
                        M50 55 C48 42, 53 32, 60 26 C64 33, 67 36, 68 44 C70 48, 66 52, 62 55 Z" 
                dur="0.9s" repeatCount="indefinite" />
            </path>

            <!-- Lòng chảo Wok -->
            <ellipse cx="60" cy="65" rx="42" ry="18" fill="url(#wokGradient)" stroke="#ff7043" stroke-width="2.5"/>
            <!-- Vành chảo kim loại phản quang -->
            <path d="M18 65 C18 78, 102 78, 102 65" stroke="rgba(255,255,255,0.4)" stroke-width="2" stroke-linecap="round"/>
            <path d="M22 67 C28 86, 92 86, 98 67" fill="#1c0f0a" opacity="0.6"/>

            <!-- Cán chảo bên trái -->
            <rect x="0" y="60" width="20" height="7" rx="3.5" fill="#8d5b4c" transform="rotate(-16 10 63)"/>
            <rect x="2" y="61" width="16" height="3" rx="1.5" fill="#ffab91" transform="rotate(-16 10 63)"/>

            <!-- Món ăn xèo xèo đang xào bên trong -->
            <circle cx="52" cy="64" r="3.5" fill="#4caf50"/>
            <circle cx="68" cy="62" r="3" fill="#f44336"/>
            <circle cx="60" cy="67" r="3.5" fill="#ffeb3b"/>
            <circle cx="43" cy="65" r="2.5" fill="#ff9800"/>
            <circle cx="75" cy="66" r="3" fill="#8bc34a"/>
          </svg>
          <div class="fh-intro-click-hint">Chạm chảo xào lửa ✨</div>
        </div>

        <div class="fh-intro-title-wrap">
          <div class="fh-intro-main-title">BẾP 1979</div>
          <div class="fh-intro-subtitle">Hương vị chuẩn gu • Càng ăn càng cuốn</div>
        </div>

        <!-- Tương tác: Bấm chọn món ăn yêu thích chuyển nhanh tới Menu -->
        <div class="fh-intro-interactive-row" id="introFoodButtons">
          <button type="button" class="fh-intro-interactive-btn" data-food="Cơm Tấm">
            <span class="food-emoji">🍱</span>
            <span>Cơm Tấm Sườn</span>
          </button>
          <button type="button" class="fh-intro-interactive-btn" data-food="Lẩu">
            <span class="food-emoji">🍲</span>
            <span>Lẩu Thái Cay</span>
          </button>
          <button type="button" class="fh-intro-interactive-btn" data-food="Gà Rán">
            <span class="food-emoji">🍗</span>
            <span>Gà Rán Giòn</span>
          </button>
          <button type="button" class="fh-intro-interactive-btn" data-food="Trà Sữa">
            <span class="food-emoji">🧋</span>
            <span>Trà Sữa Trân Châu</span>
          </button>
        </div>

        <!-- Khám phá ngay + Thanh đếm ngược 5 giây -->
        <div class="fh-intro-bottom">
          <button type="button" class="fh-intro-cta-btn" id="introCtaBtn">
            <span>Bắt đầu gọi món ngay</span>
            <span>➔</span>
          </button>

          <div class="fh-intro-progress-container">
            <div class="fh-intro-progress-bar-bg">
              <div class="fh-intro-progress-bar-fill"></div>
            </div>
            <span class="fh-intro-timer-num" id="introTimerText">5s</span>
          </div>
        </div>
      </div>
    `;

    return overlay;
  }

  function startIntro() {
    const overlay = createIntroElement();
    document.body.prepend(overlay);

    const spotlight = overlay.querySelector("#introSpotlight");
    const sparksWrap = overlay.querySelector("#introSparksWrap");
    const heroVisual = overlay.querySelector("#introHeroVisual");
    const timerText = overlay.querySelector("#introTimerText");
    const ctaBtn = overlay.querySelector("#introCtaBtn");
    const skipBtn = overlay.querySelector("#introSkipBtn");
    const foodBtns = overlay.querySelectorAll("[data-food]");

    // 1. Tạo tàn lửa bay liên tục
    const sparkColors = ["#ff5722", "#ff9800", "#ffc107", "#ff3d00", "#ffeb3b"];
    for (let i = 0; i < 30; i++) {
      const sp = document.createElement("div");
      sp.className = "fh-intro-spark";
      const sz = Math.random() * 6 + 2;
      sp.style.width = `${sz}px`;
      sp.style.height = `${sz}px`;
      sp.style.left = `${Math.random() * 100}%`;
      sp.style.bottom = `${Math.random() * 20 - 10}%`;
      sp.style.backgroundColor = sparkColors[Math.floor(Math.random() * sparkColors.length)];
      sp.style.boxShadow = `0 0 8px ${sp.style.backgroundColor}`;
      sp.style.animationDuration = `${Math.random() * 3 + 2.5}s`;
      sp.style.animationDelay = `${Math.random() * 2}s`;
      sparksWrap.appendChild(sp);
    }

    // 2. Spotlight di chuyển theo trỏ chuột (interactive cursor spotlight)
    overlay.addEventListener("mousemove", (e) => {
      if (spotlight) {
        spotlight.style.left = `${e.clientX}px`;
        spotlight.style.top = `${e.clientY}px`;
      }
    });

    let dismissed = false;
    function dismissIntro(destinationUrl) {
      if (dismissed) return;
      dismissed = true;

      playCookingSound("pop");
      overlay.classList.add("fh-intro-hiding");

      setTimeout(() => {
        if (overlay && overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
        if (destinationUrl) {
          window.location.href = destinationUrl;
        }
      }, 700);
    }

    // 3. Tương tác với Chảo Lửa: Chạm vào bốc pháo hoa và âm thanh xèo xèo
    heroVisual.addEventListener("click", (e) => {
      const rect = heroVisual.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      spawnBurstParticles(centerX, centerY);
      playCookingSound("sizzle");

      heroVisual.style.transform = "scale(1.25) rotate(-6deg)";
      setTimeout(() => {
        heroVisual.style.transform = "";
      }, 250);
    });

    // 4. Bấm chọn món ăn yêu thích -> vào thẳng thực đơn tìm món đó
    foodBtns.forEach(btn => {
      btn.addEventListener("click", (e) => {
        const foodName = btn.dataset.food;
        const rect = btn.getBoundingClientRect();
        spawnBurstParticles(rect.left + rect.width / 2, rect.top + rect.height / 2);
        playCookingSound("pop");
        dismissIntro(`menu.html?search=${encodeURIComponent(foodName)}`);
      });
    });

    // 5. Nút Khám Phá & Bỏ qua
    ctaBtn.addEventListener("click", () => dismissIntro());
    skipBtn.addEventListener("click", () => dismissIntro());

    // 6. Đếm ngược 5 giây hiển thị trực quan
    let timeLeft = 5;
    const countdownInterval = setInterval(() => {
      timeLeft -= 1;
      if (timerText) {
        timerText.textContent = `${Math.max(0, timeLeft)}s`;
      }
      if (timeLeft <= 0) {
        clearInterval(countdownInterval);
        dismissIntro();
      }
    }, 1000);

    // Phím Escape để thoát ngay
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        clearInterval(countdownInterval);
        dismissIntro();
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
