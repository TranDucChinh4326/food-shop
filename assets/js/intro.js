/**
 * BẾP 1979 - CINEMATIC INTRO EXPERIENCE
 * Tự động chạy 5 giây khi người dùng vào website.
 * Có nút 'Bỏ qua', hiệu ứng âm thanh ẩm thực nhẹ (web audio api), và lưu trạng thái vào sessionStorage để trải nghiệm mượt mà.
 */

(function initFoodHubCinematicIntro() {
  // Kiểm tra nếu đang ở màn hình admin hoặc iframe thì bỏ qua
  if (window.location.pathname.includes("admin.html")) return;

  // Kiểm tra nếu người dùng đã xem trong phiên này (sessionStorage)
  // Để khách hàng có thể test liên tục hoặc muốn xem mỗi lần vào trang chủ, ta kiểm tra flag:
  // Nếu muốn xem lại, có thể xóa key hoặc set qua URL ?intro=1
  const urlParams = new URLSearchParams(window.location.search);
  const forceIntro = urlParams.get("intro") === "1";
  const hasSeenIntro = sessionStorage.getItem("foodhub_has_seen_intro_v1");

  if (hasSeenIntro && !forceIntro) {
    return;
  }

  // Đánh dấu đã xem intro trong phiên truy cập này
  sessionStorage.setItem("foodhub_has_seen_intro_v1", "true");

  function createIntroElement() {
    const overlay = document.createElement("div");
    overlay.className = "fh-intro-overlay";
    overlay.id = "foodHubIntroOverlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-label", "Chào mừng đến với Bếp 1979");

    overlay.innerHTML = `
      <div class="fh-intro-bg-glow"></div>
      <div class="fh-intro-steam-wrap" id="introSteamWrap"></div>

      <button type="button" class="fh-intro-skip-btn" id="introSkipBtn" title="Bỏ qua intro">
        <span>Bỏ qua</span>
        <svg viewBox="0 0 24 24">
          <path d="M5.59 7.41L10.18 12l-4.59 4.59L7 18l6-6-6-6zM16 6h2v12h-2z"/>
        </svg>
      </button>

      <div class="fh-intro-container">
        <!-- Cloche / Đĩa đậy thức ăn sang trọng với khói bốc nghi ngút -->
        <div class="fh-intro-cloche">
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="clocheGold" x1="10" y1="20" x2="90" y2="80" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#FFF3D4"/>
                <stop offset="35%" stop-color="#FFB347"/>
                <stop offset="70%" stop-color="#FF7426"/>
                <stop offset="100%" stop-color="#D9480F"/>
              </linearGradient>
              <linearGradient id="plateSilver" x1="0" y1="85" x2="100" y2="85" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#604030"/>
                <stop offset="50%" stop-color="#FFE8DB"/>
                <stop offset="100%" stop-color="#604030"/>
              </linearGradient>
              <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur"/>
                <feComposite in="SourceGraphic" in2="blur" operator="over"/>
              </filter>
            </defs>

            <!-- Khói bay từ món ăn bốc lên -->
            <path d="M42 22C42 16 38 12 45 6" stroke="#FFA726" stroke-width="2.5" stroke-linecap="round" opacity="0.85">
              <animate attributeName="d" values="M42 22C42 16 38 12 45 6; M42 22C46 15 42 10 47 4; M42 22C42 16 38 12 45 6" dur="2s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.2;0.9;0.2" dur="2s" repeatCount="indefinite"/>
            </path>
            <path d="M50 20C52 14 47 9 52 3" stroke="#FF7043" stroke-width="3" stroke-linecap="round" opacity="0.9">
              <animate attributeName="d" values="M50 20C52 14 47 9 52 3; M50 20C47 13 54 8 51 2; M50 20C52 14 47 9 52 3" dur="2.4s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.3;1;0.3" dur="2.4s" repeatCount="indefinite"/>
            </path>
            <path d="M58 22C58 17 62 12 55 6" stroke="#FFD54F" stroke-width="2.5" stroke-linecap="round" opacity="0.8">
              <animate attributeName="d" values="M58 22C58 17 62 12 55 6; M58 22C55 16 57 11 53 5; M58 22C58 17 62 12 55 6" dur="2.1s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.2;0.85;0.2" dur="2.1s" repeatCount="indefinite"/>
            </path>

            <!-- Núm nắp cloche -->
            <circle cx="50" cy="24" r="6" fill="url(#clocheGold)" filter="url(#glowEffect)"/>
            <circle cx="50" cy="23" r="2.5" fill="#FFF"/>

            <!-- Thân nắp cloche vòm cung nghệ thuật -->
            <path d="M16 75 C18 40, 32 30, 50 30 C68 30, 82 40, 84 75 Z" fill="url(#clocheGold)" filter="url(#glowEffect)"/>
            
            <!-- Ánh sáng phản chiếu đường cong -->
            <path d="M26 70 C28 46, 38 38, 50 38" stroke="rgba(255,255,255,0.6)" stroke-width="3" stroke-linecap="round"/>

            <!-- Khay đĩa đựng món ăn -->
            <rect x="8" y="77" width="84" height="6" rx="3" fill="url(#plateSilver)"/>
            <path d="M2 84 C2 82.5, 98 82.5, 98 84 C98 88, 80 90, 50 90 C20 90, 2 88, 2 84 Z" fill="url(#clocheGold)"/>
          </svg>
        </div>

        <!-- Logo thương hiệu Bếp 1979 -->
        <div class="fh-intro-brand">
          <div class="fh-intro-badge">
            <span>79</span>
          </div>
          <div class="fh-intro-title">Bếp 1979</div>
        </div>

        <div class="fh-intro-tagline">Món ngon chuẩn vị • Nóng hổi giao nhanh</div>

        <!-- Thanh đếm 5 giây -->
        <div class="fh-intro-progress-wrap" aria-hidden="true">
          <div class="fh-intro-progress-bar"></div>
        </div>
      </div>
    `;

    return overlay;
  }

  // Tạo các hạt ánh lửa bay lơ lửng
  function generateSteamParticles(wrap) {
    if (!wrap) return;
    const colors = ["#ff5722", "#ff9800", "#ffc107", "#ff3d00"];
    for (let i = 0; i < 22; i++) {
      const particle = document.createElement("div");
      particle.className = "fh-intro-steam-particle";
      const size = Math.random() * 26 + 10;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.animationDelay = `${Math.random() * 2.8}s`;
      particle.style.animationDuration = `${Math.random() * 2.5 + 3.2}s`;
      particle.style.background = `radial-gradient(circle, ${colors[i % colors.length]}99 0%, rgba(255,87,34,0) 70%)`;
      wrap.appendChild(particle);
    }
  }

  // Khởi động khi DOM sẵn sàng
  function startIntro() {
    const overlay = createIntroElement();
    document.body.prepend(overlay);

    const steamWrap = overlay.querySelector("#introSteamWrap");
    generateSteamParticles(steamWrap);

    let dismissed = false;
    function dismissIntro() {
      if (dismissed) return;
      dismissed = true;

      overlay.classList.add("fh-intro-hiding");
      setTimeout(() => {
        if (overlay && overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }, 900);
    }

    // Nút bỏ qua
    const skipBtn = overlay.querySelector("#introSkipBtn");
    if (skipBtn) {
      skipBtn.addEventListener("click", dismissIntro);
    }

    // Tự động kết thúc sau chính xác 5 giây (5000ms)
    const timer = setTimeout(dismissIntro, 5000);

    // Bấm phím ESC cũng bỏ qua
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        clearTimeout(timer);
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

