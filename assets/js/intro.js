/**
 * BẾP 1979 - MODERN RETRO F&B INTRO SPLASH
 * Phong cách: Retro Việt Nam hiện đại, sang trọng, tinh tế.
 * - Thời lượng nhẹ nhàng: Tự động chuyển trang sau ~2.8 giây.
 * - Người dùng có thể click "Khám phá thực đơn" hoặc "Vào ngay" để chuyển trang lập tức.
 * - Hiệu ứng chuyển cảnh: Smooth Zoom-Fade mượt mà, không giật lag.
 * - Bảng màu: Nâu cà phê (#1d120c), Đỏ gạch (#b8381e), Cam ấm (#e65100), Kem (#fef7ee).
 */

(function initRetroFBIntro() {
  if (window.location.pathname.includes("admin.html")) return;

  const urlParams = new URLSearchParams(window.location.search);
  const forceIntro = urlParams.get("intro") === "1";
  const hasSeenIntro = sessionStorage.getItem("foodhub_retro_intro_seen_v6");

  if (hasSeenIntro && !forceIntro) {
    return;
  }

  sessionStorage.setItem("foodhub_retro_intro_seen_v6", "true");

  // Subtle web audio sound on interaction
  let audioCtx = null;
  let isMuted = false;

  function playSoftChime() {
    if (isMuted) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!audioCtx) audioCtx = new AudioContext();
      if (audioCtx.state === "suspended") audioCtx.resume();

      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.25);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  function createIntroElement() {
    const overlay = document.createElement("div");
    overlay.className = "fh-retro-intro";
    overlay.id = "foodHubRetroIntro";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-label", "Chào mừng đến với Bếp 1979");

    overlay.innerHTML = `
      <div class="intro-retro-pattern"></div>

      <!-- Top Status & Actions -->
      <header class="intro-retro-header">
        <div class="intro-open-status">
          <span class="intro-status-pulse"></span>
          <span>Đang mở cửa phục vụ</span>
        </div>

        <div class="intro-header-actions">
          <button type="button" class="intro-action-btn" id="retroSoundBtn" title="Bật/Tắt âm thanh">
            <span id="retroSoundIcon">🔊</span>
          </button>
          <button type="button" class="intro-action-btn" id="retroSkipBtn" title="Bỏ qua intro">
            <span>Vào ngay</span>
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
      </header>

      <!-- Center Brand & Culinary Hero -->
      <main class="intro-retro-hero">
        <div class="intro-food-spotlight">
          <div class="intro-food-halo"></div>
          <div class="intro-food-plate" title="Món ăn nóng hổi tại Bếp 1979">
            <!-- Professional SVG: Tô đồ ăn nóng bốc khói hơi nóng thanh lịch -->
            <svg class="intro-food-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="bowlGrad" x1="20" y1="40" x2="80" y2="85" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#b8381e"/>
                  <stop offset="60%" stop-color="#8c2511"/>
                  <stop offset="100%" stop-color="#5a1508"/>
                </linearGradient>
                <linearGradient id="rimGrad" x1="12" y1="42" x2="88" y2="42" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#e65100"/>
                  <stop offset="50%" stop-color="#ffcc80"/>
                  <stop offset="100%" stop-color="#e65100"/>
                </linearGradient>
                <linearGradient id="brothGrad" x1="20" y1="48" x2="80" y2="48" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#ff9800"/>
                  <stop offset="100%" stop-color="#f57c00"/>
                </linearGradient>
              </defs>

              <!-- Làn hơi nóng (Steam) bốc nhẹ tự nhiên -->
              <path class="intro-steam-path s1" d="M38 32 C38 24 34 20 40 14 C44 9 40 5 42 2" stroke="#ffcc80" stroke-width="2.2" stroke-linecap="round"/>
              <path class="intro-steam-path s2" d="M50 30 C52 23 48 18 53 12 C57 7 53 3 55 1" stroke="#ffe0b2" stroke-width="2.5" stroke-linecap="round"/>
              <path class="intro-steam-path s3" d="M62 33 C62 25 66 21 60 15 C56 10 60 6 58 2" stroke="#ffcc80" stroke-width="2.2" stroke-linecap="round"/>

              <!-- Vành tô sứ retro -->
              <ellipse cx="50" cy="45" rx="38" ry="11" fill="url(#rimGrad)"/>
              <!-- Nước dùng/Món ăn bên trong tô -->
              <ellipse cx="50" cy="46" rx="34" ry="9" fill="url(#brothGrad)"/>

              <!-- Topping món ăn: Trứng lòng đào, hành hoa, thịt sườn -->
              <circle cx="42" cy="46" r="5" fill="#fff9c4"/>
              <circle cx="42" cy="46" r="3.2" fill="#ff9800"/>
              <circle cx="56" cy="45" r="3" fill="#43a047"/>
              <circle cx="63" cy="47" r="2.5" fill="#2e7d32"/>
              <rect x="48" y="47" width="8" height="3" rx="1.5" fill="#8d6e63" transform="rotate(-15 48 47)"/>

              <!-- Thân tô gốm mộc màu đỏ gạch truyền thống -->
              <path d="M12 45 C14 68, 30 82, 50 82 C70 82, 86 68, 88 45 Z" fill="url(#bowlGrad)"/>

              <!-- Đường chỉ viền retro mạ vàng -->
              <path d="M20 54 C30 62, 70 62, 80 54" stroke="rgba(255, 204, 128, 0.5)" stroke-width="1.8" stroke-linecap="round"/>

              <!-- Chân đế tô -->
              <ellipse cx="50" cy="83" rx="18" ry="4" fill="#3e140b"/>
            </svg>
          </div>
        </div>

        <div class="intro-brand-lockup">
          <div class="intro-badge-mark">79</div>
          <h1 class="intro-brand-name">Bếp 1979</h1>
        </div>

        <p class="intro-slogan">
          Đậm vị trong từng món • <strong>Nóng hổi giao nhanh</strong>
        </p>

        <button type="button" class="intro-cta-button" id="retroCtaBtn">
          <span>Khám phá thực đơn</span>
          <svg class="intro-cta-arrow" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"/>
          </svg>
        </button>
      </main>

      <!-- Bottom Minimal Progress Bar (~2.8s) -->
      <footer class="intro-retro-footer">
        <div class="intro-progress-track">
          <div class="intro-progress-fill"></div>
        </div>
        <span class="intro-footer-hint">Tự động vào trang sau giây lát</span>
      </footer>
    `;

    return overlay;
  }

  function startIntro() {
    const overlay = createIntroElement();
    document.body.prepend(overlay);

    const ctaBtn = overlay.querySelector("#retroCtaBtn");
    const skipBtn = overlay.querySelector("#retroSkipBtn");
    const soundBtn = overlay.querySelector("#retroSoundBtn");
    const soundIcon = overlay.querySelector("#retroSoundIcon");

    let isDismissed = false;

    function dismissIntro(destinationUrl) {
      if (isDismissed) return;
      isDismissed = true;

      playSoftChime();
      overlay.classList.add("intro-dismissed");

      setTimeout(() => {
        if (overlay && overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
        if (destinationUrl) {
          window.location.href = destinationUrl;
        }
      }, 650);
    }

    // 1. Click CTA "Khám phá thực đơn" -> vào thẳng menu hoặc trang chủ mượt mà
    ctaBtn.addEventListener("click", () => {
      dismissIntro();
    });

    // 2. Click "Vào ngay"
    skipBtn.addEventListener("click", () => {
      dismissIntro();
    });

    // 3. Sound button
    soundBtn.addEventListener("click", () => {
      isMuted = !isMuted;
      soundIcon.textContent = isMuted ? "🔇" : "🔊";
      soundBtn.style.opacity = isMuted ? "0.6" : "1";
    });

    // 4. Thoát bằng phím Escape hoặc Enter
    const onKeyDown = (e) => {
      if (e.key === "Escape" || e.key === "Enter") {
        dismissIntro();
        window.removeEventListener("keydown", onKeyDown);
      }
    };
    window.addEventListener("keydown", onKeyDown);

    // 5. Tự động chuyển mượt vào homepage sau 2.8 giây (không bắt người dùng chờ lâu)
    setTimeout(() => {
      dismissIntro();
    }, 2800);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startIntro);
  } else {
    startIntro();
  }
})();
