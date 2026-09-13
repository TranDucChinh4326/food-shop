/**
 * BẾP 1979 - LUXURY MODERN RETRO F&B INTRO
 * Tông màu: Nâu Espresso (#140b07), Đỏ gạch (#b8381e), Cam cháy (#d9531e), Kem yến mạch (#fdf8f4).
 * Tính năng:
 * - Đĩa món ăn cao cấp chụp thật (lấy từ cache món ngon của Bếp 1979 hoặc hình sườn nướng mật ong chuẩn vị).
 * - Làn hơi nóng (Steam) bốc lên nhẹ nhàng, chân thực.
 * - Trạng thái nhỏ: "● Đang mở cửa phục vụ".
 * - Nút "Khám phá thực đơn" hoặc tự động chuyển mượt vào trang sau ~2.8 giây.
 */

(function initLuxuryRetroIntro() {
  if (window.location.pathname.includes("admin.html")) return;

  const urlParams = new URLSearchParams(window.location.search);
  const forceIntro = urlParams.get("intro") === "1";
  const hasSeenIntro = sessionStorage.getItem("foodhub_luxury_retro_seen_v7");

  if (hasSeenIntro && !forceIntro) {
    return;
  }

  sessionStorage.setItem("foodhub_luxury_retro_seen_v7", "true");

  let audioCtx = null;
  let isMuted = false;

  function playSoftChime() {
    if (isMuted) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtx) audioCtx = new AudioCtx();
      if (audioCtx.state === "suspended") audioCtx.resume();

      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(540, now + 0.28);

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.28);
    } catch (e) {}
  }

  // Lấy hình ảnh món ăn thực tế từ database cache của Bếp 1979
  function getHeroFoodImageUrl() {
    try {
      const cache = JSON.parse(localStorage.getItem("foodhub_foods_cache_v1") || "null");
      if (cache && Array.isArray(cache.items) && cache.items.length) {
        const foundWithImage = cache.items.find(item => item.image && item.image.startsWith("http"));
        if (foundWithImage) return foundWithImage.image;
      }
    } catch (e) {}

    // Fallback ảnh ẩm thực chụp nghệ thuật chất lượng cao (Unsplash Culinary Food)
    return "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80";
  }

  function createIntroElement() {
    const overlay = document.createElement("div");
    overlay.className = "fh-retro-intro";
    overlay.id = "foodHubRetroIntro";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-label", "Chào mừng đến với Bếp 1979");

    const heroImgUrl = getHeroFoodImageUrl();

    overlay.innerHTML = `
      <div class="intro-retro-pattern"></div>

      <!-- 1. Top Bar (Dùng thẻ div riêng để không bị ảnh hưởng style header trang chủ) -->
      <div class="intro-top-bar">
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
      </div>

      <!-- 2. Main Center Hero Stage -->
      <div class="intro-retro-hero">
        <div class="intro-food-spotlight">
          <div class="intro-food-halo"></div>
          
          <div class="intro-food-plate" title="Món ngon nóng hổi tại Bếp 1979">
            <img class="intro-food-img" id="introHeroFoodImg" src="${heroImgUrl}" alt="Món ăn đặc sản Bếp 1979" onerror="this.src='https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80'">
          </div>

          <!-- Làn hơi nóng (Steam) bốc lên tự nhiên từ đĩa món ăn -->
          <div class="intro-steam-overlay" aria-hidden="true">
            <svg class="intro-steam-svg" viewBox="0 0 100 80">
              <path class="intro-steam-line s1" d="M35 70 C35 50 28 40 38 25 C44 14 38 6 40 0"/>
              <path class="intro-steam-line s2" d="M50 72 C52 52 46 38 54 22 C60 12 52 4 54 0"/>
              <path class="intro-steam-line s3" d="M65 70 C65 52 72 42 62 26 C56 16 62 8 60 0"/>
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
      </div>

      <!-- 3. Bottom Minimal Timeline Bar -->
      <div class="intro-bottom-footer">
        <div class="intro-progress-track">
          <div class="intro-progress-fill"></div>
        </div>
        <span class="intro-footer-hint">Tự động vào trang sau giây lát</span>
      </div>
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

    ctaBtn.addEventListener("click", () => dismissIntro());
    skipBtn.addEventListener("click", () => dismissIntro());

    soundBtn.addEventListener("click", () => {
      isMuted = !isMuted;
      soundIcon.textContent = isMuted ? "🔇" : "🔊";
      soundBtn.style.opacity = isMuted ? "0.6" : "1";
    });

    const onKeyDown = (e) => {
      if (e.key === "Escape" || e.key === "Enter") {
        dismissIntro();
        window.removeEventListener("keydown", onKeyDown);
      }
    };
    window.addEventListener("keydown", onKeyDown);

    // Tự động chuyển trang sau 2.8 giây
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
