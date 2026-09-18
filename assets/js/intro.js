/**
 * BẾP 1979 - GRAND COMMERCIAL INTRO SHOWCASE (10-SECOND AD TRAILER)
 * Trình chiếu toàn cảnh website Bếp 1979 trong 10 giây qua 4 phân cảnh quảng cáo độc đáo:
 * 1. Cảnh 1 (0s - 2.5s): Thương hiệu Bếp 1979 & Món ngon chuẩn vị truyền thống.
 * 2. Cảnh 2 (2.5s - 5s): Thực đơn phong phú 50+ món ăn & Giao nóng hổi trong 20 phút.
 * 3. Cảnh 3 (5s - 7.5s): Giờ vàng Flash Sale & Kho Voucher ưu đãi khủng lên đến 50%.
 * 4. Cảnh 4 (7.5s - 10s): Theo dõi đơn hàng thời gian thực & Dịch vụ 5 sao tận tâm.
 *
 * Tính năng tương tác:
 * - Chuyển cảnh tự động theo Timeline đếm ngược 10 giây (hoặc click vào các tab để xem cảnh mong muốn).
 * - Tương tác chạm Nắp đĩa vàng cloche, chọn món ăn yêu thích, nhận voucher ngay trên intro.
 * - Âm thanh tổng hợp Web Audio Synthesizer cao cấp, có nút Bật/Tắt âm thanh & Nút Bỏ qua tức thì.
 */

(function initGrandCommercialIntro() {
  if (window.location.pathname.includes("admin.html")) return;

  const urlParams = new URLSearchParams(window.location.search);
  const forceIntro = urlParams.get("intro") === "1";
  const hasSeenIntro = localStorage.getItem("foodhub_grand_ad_intro_seen_v5");

  if (hasSeenIntro && !forceIntro) {
    return;
  }

  localStorage.setItem("foodhub_grand_ad_intro_seen_v5", "true");

  // Web Audio Synthesizer (Zero External Dependencies)
  let audioCtx = null;
  let isMuted = false;

  function playSound(type = "transition") {
    if (isMuted) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtx) audioCtx = new AudioCtx();
      if (audioCtx.state === "suspended") audioCtx.resume();

      const now = audioCtx.currentTime;

      if (type === "transition") {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === "bell") {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(1280, now);
        osc.frequency.exponentialRampToValueAtTime(950, now + 0.35);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === "sizzle") {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.linearRampToValueAtTime(750, now + 0.18);

        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
      }
    } catch (e) {
      // Browser autoplay policy graceful fallback
    }
  }

  // Particle explosion on interaction
  function spawnBurstParticles(x, y) {
    const colors = ["#ff4b1f", "#ff9b2f", "#ffd166", "#ffffff", "#00e676"];
    for (let i = 0; i < 24; i++) {
      const p = document.createElement("div");
      p.className = "intro-burst-fx";
      const size = Math.random() * 8 + 4;
      const angle = (Math.PI * 2 * i) / 24 + (Math.random() - 0.5) * 0.4;
      const dist = Math.random() * 80 + 35;
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
    overlay.className = "fh-ad-intro";
    overlay.id = "grandAdIntroOverlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-label", "Bếp 1979 - Trải nghiệm đặt món online toàn diện");

    overlay.innerHTML = `
      <canvas class="intro-canvas-bg" id="introCanvas"></canvas>
      <div class="intro-ambient-glow"></div>

      <!-- 1. Header Bar -->
      <div class="intro-top-header">
        <div class="intro-brand-badge">
          <div class="intro-brand-icon">79</div>
          <div class="intro-brand-text">
            <strong>Bếp 1979</strong>
            <small>Hệ thống ẩm thực trực tuyến</small>
          </div>
        </div>

        <!-- 4 Cảnh Quảng Cáo Stepper -->
        <div class="intro-scene-stepper" id="introSceneStepper">
          <button type="button" class="intro-step-pill active" data-scene="0">
            <span>🔥</span>
            <span>Thương Hiệu</span>
          </button>
          <button type="button" class="intro-step-pill" data-scene="1">
            <span>🍲</span>
            <span>Thực Đơn 50+</span>
          </button>
          <button type="button" class="intro-step-pill" data-scene="2">
            <span>⚡</span>
            <span>Flash Sale & Quà</span>
          </button>
          <button type="button" class="intro-step-pill" data-scene="3">
            <span>⭐</span>
            <span>Giao Nhanh 20P</span>
          </button>
        </div>

        <div class="intro-nav-controls">
          <button type="button" class="intro-glass-btn" id="introSoundToggle" title="Bật/Tắt âm thanh">
            <span id="introSoundIcon">🔊</span>
          </button>
          <button type="button" class="intro-glass-btn" id="introSkipBtn" title="Bỏ qua intro">
            <span>Bỏ qua</span>
            <span>✕</span>
          </button>
        </div>
      </div>

      <!-- 2. Main Trailer Stage -->
      <div class="intro-stage-container">
        
        <!-- SCENE 1: THƯƠNG HIỆU & HƯƠNG VỊ ĐỘC BẢN -->
        <div class="intro-scene-slide active" data-slide-index="0">
          <div class="intro-slide-text">
            <div class="intro-tag-eyebrow">✨ Chào mừng bạn đến với Bếp 1979</div>
            <h1 class="intro-headline">Hương Vị Chuẩn Gu • Đậm Đà Bản Sắc</h1>
            <p class="intro-description">
              Bếp 1979 tự hào mang đến trải nghiệm ẩm thực chất lượng hàng đầu với nguồn nguyên liệu tươi mới mỗi ngày, công thức nấu chuẩn vị gia truyền và dịch vụ giao món tận tâm.
            </p>
            <div class="intro-feature-chips">
              <span class="intro-feature-chip">🔥 Nổi lửa phục vụ 24/7</span>
              <span class="intro-feature-chip">🌿 100% Nguyên liệu tươi</span>
              <span class="intro-feature-chip">🥇 Đạt chuẩn vệ sinh ATTP</span>
            </div>
            <button type="button" class="intro-cta-action" data-goto="menu.html">
              <span>Xem thực đơn ngay</span>
              <span>➔</span>
            </button>
          </div>

          <div class="intro-slide-visual">
            <div class="intro-visual-cloche" id="introClocheTrigger" title="Chạm mở nắp đĩa vàng!">
              <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="clocheGoldGrad" x1="10" y1="10" x2="110" y2="110" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stop-color="#FFF8E7"/>
                    <stop offset="35%" stop-color="#FFC107"/>
                    <stop offset="70%" stop-color="#FF5722"/>
                    <stop offset="100%" stop-color="#BF360C"/>
                  </linearGradient>
                  <linearGradient id="silverPlateGrad" x1="0" y1="88" x2="120" y2="88" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stop-color="#5D4037"/>
                    <stop offset="50%" stop-color="#FFF3E0"/>
                    <stop offset="100%" stop-color="#5D4037"/>
                  </linearGradient>
                </defs>

                <!-- Làn khói thơm nghi ngút -->
                <path d="M48 24 C48 16 42 12 50 6" stroke="#FFA726" stroke-width="2.5" stroke-linecap="round" opacity="0.85">
                  <animate attributeName="d" values="M48 24 C48 16 42 12 50 6; M48 24 C52 15 48 10 53 4; M48 24 C48 16 42 12 50 6" dur="2s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.3;0.9;0.3" dur="2s" repeatCount="indefinite"/>
                </path>
                <path d="M58 22 C61 15 55 10 62 4" stroke="#FF7043" stroke-width="3" stroke-linecap="round" opacity="0.9">
                  <animate attributeName="d" values="M58 22 C61 15 55 10 62 4; M58 22 C55 14 62 8 59 2; M58 22 C61 15 55 10 62 4" dur="2.4s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.3;1;0.3" dur="2.4s" repeatCount="indefinite"/>
                </path>
                <path d="M68 25 C68 18 73 13 65 7" stroke="#FFD54F" stroke-width="2.5" stroke-linecap="round" opacity="0.8">
                  <animate attributeName="d" values="M68 25 C68 18 73 13 65 7; M68 25 C65 17 67 12 63 6; M68 25 C68 18 73 13 65 7" dur="2.2s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.2;0.85;0.2" dur="2.2s" repeatCount="indefinite"/>
                </path>

                <circle cx="60" cy="28" r="7" fill="url(#clocheGoldGrad)"/>
                <circle cx="60" cy="27" r="3" fill="#FFF"/>

                <path d="M22 82 C24 44, 40 34, 60 34 C80 34, 96 44, 98 82 Z" fill="url(#clocheGoldGrad)"/>
                <path d="M34 76 C36 50, 46 42, 60 42" stroke="rgba(255,255,255,0.7)" stroke-width="3.5" stroke-linecap="round"/>

                <rect x="14" y="83" width="92" height="7" rx="3.5" fill="url(#silverPlateGrad)"/>
                <path d="M6 90 C6 88.5, 114 88.5, 114 90 C114 96, 92 98, 60 98 C28 98, 6 96, 6 90 Z" fill="url(#clocheGoldGrad)"/>
              </svg>
              <div class="cloche-interactive-hint">✦ Chạm mở nắp đĩa vàng</div>
            </div>
          </div>
        </div>

        <!-- SCENE 2: THỰC ĐƠN PHONG PHÚ 50+ MÓN ĂN & NƯỚC UỐNG -->
        <div class="intro-scene-slide" data-slide-index="1">
          <div class="intro-slide-text">
            <div class="intro-tag-eyebrow">🍱 Menu Đa Dạng • Đầy Đủ Dưỡng Chất</div>
            <h1 class="intro-headline">Hơn 50+ Món Ăn & Nước Uống Tuyệt Đỉnh</h1>
            <p class="intro-description">
              Từ Cơm tấm sườn nướng mật ong trứ danh, Lẩu thái hải sản chua cay, đến Gà rán giòn rụm và Trà sữa trân châu chuẩn vị. Thỏa thích chọn món chỉ với vài chạm!
            </p>
            <div class="intro-feature-chips">
              <span class="intro-feature-chip">🍚 Cơm, Phở, Mì, Bún</span>
              <span class="intro-feature-chip">🧋 Trà sữa & Sinh tố mát lạnh</span>
              <span class="intro-feature-chip">🥗 Món chay thanh đạm</span>
            </div>
            <button type="button" class="intro-cta-action" data-goto="menu.html">
              <span>Khám phá menu đầy đủ</span>
              <span>➔</span>
            </button>
          </div>

          <div class="intro-slide-visual">
            <div class="intro-visual-food-grid">
              <div class="intro-food-card-interactive" data-food-search="Cơm">
                <div class="intro-food-emoji-wrap">🍱</div>
                <div class="intro-food-name">Cơm Tấm Sườn</div>
                <div class="intro-food-desc">Sườn nướng mật ong giòn thơm</div>
              </div>
              <div class="intro-food-card-interactive" data-food-search="Lẩu">
                <div class="intro-food-emoji-wrap">🍲</div>
                <div class="intro-food-name">Lẩu Thái Hải Sản</div>
                <div class="intro-food-desc">Nước dùng Tomyum chua cay</div>
              </div>
              <div class="intro-food-card-interactive" data-food-search="Gà">
                <div class="intro-food-emoji-wrap">🍗</div>
                <div class="intro-food-name">Gà Rán Giòn Cay</div>
                <div class="intro-food-desc">Da giòn rụm thịt mềm ngọt</div>
              </div>
              <div class="intro-food-card-interactive" data-food-search="Trà Sữa">
                <div class="intro-food-emoji-wrap">🧋</div>
                <div class="intro-food-name">Trà Sữa Bếp 79</div>
                <div class="intro-food-desc">Trân châu hoàng kim béo thơm</div>
              </div>
            </div>
          </div>
        </div>

        <!-- SCENE 3: FLASH SALE & VOUCHER GIỜ VÀNG -->
        <div class="intro-scene-slide" data-slide-index="2">
          <div class="intro-slide-text">
            <div class="intro-tag-eyebrow">⚡ Giờ Vàng Săn Deal Tiết Kiệm</div>
            <h1 class="intro-headline">Flash Sale Giảm Sâu & Voucher Hot Mỗi Ngày</h1>
            <p class="intro-description">
              Săn ngay hàng ngàn mã giảm giá lên đến 50%, miễn phí vận chuyển cho đơn hàng đầu tiên và các combo món ăn tiết kiệm chỉ có tại Bếp 1979.
            </p>
            <div class="intro-feature-chips">
              <span class="intro-feature-chip">🎟️ Voucher giảm tới 50k</span>
              <span class="intro-feature-chip">🛵 Freeship bán kính 5km</span>
              <span class="intro-feature-chip">🎁 Tích điểm đổi quà vip</span>
            </div>
            <button type="button" class="intro-cta-action" data-goto="vouchers.html">
              <span>Thu thập voucher ngay</span>
              <span>➔</span>
            </button>
          </div>

          <div class="intro-slide-visual">
            <div class="intro-visual-promo-box">
              <div class="intro-promo-header">
                <span class="intro-flash-tag">⚡ FLASH SALE HÔM NAY</span>
                <span class="intro-promo-timer">⏳ Đang diễn ra</span>
              </div>

              <div class="intro-voucher-ticket">
                <div class="intro-ticket-left">
                  <strong>GIẢM 30.000đ</strong>
                  <small>Đơn từ 120k • Áp dụng toàn menu</small>
                </div>
                <button type="button" class="intro-ticket-btn" data-goto="vouchers.html">Lấy mã</button>
              </div>

              <div class="intro-voucher-ticket">
                <div class="intro-ticket-left">
                  <strong>FREESHIP 0 ĐỒNG</strong>
                  <small>Đơn từ 80k • Giao siêu tốc 20P</small>
                </div>
                <button type="button" class="intro-ticket-btn" data-goto="vouchers.html">Lấy mã</button>
              </div>
            </div>
          </div>
        </div>

        <!-- SCENE 4: ĐÁNH GIÁ 5 SAO & ĐẶT MÓN TIỆN LỢI -->
        <div class="intro-scene-slide" data-slide-index="3">
          <div class="intro-slide-text">
            <div class="intro-tag-eyebrow">🚀 Dịch Vụ Chu Đáo • An Tâm Đặt Món</div>
            <h1 class="intro-headline">Giao Hàng 20 Phút • Theo Dõi Trực Quan</h1>
            <p class="intro-description">
              Tích hợp định vị bản đồ giao hàng thông minh, theo dõi lộ trình tài xế thời gian thực và thanh toán bảo mật với MoMo, VNPay, chuyển khoản VietQR hoặc COD.
            </p>
            <div class="intro-feature-chips">
              <span class="intro-feature-chip">📍 Định vị giao hàng GPS</span>
              <span class="intro-feature-chip">💳 Quét mã VietQR tiện lợi</span>
              <span class="intro-feature-chip">💬 Chatbot hỗ trợ 24/7</span>
            </div>
            <button type="button" class="intro-cta-action" data-goto="index.html">
              <span>Bắt đầu đặt món ngay</span>
              <span>➔</span>
            </button>
          </div>

          <div class="intro-slide-visual">
            <div class="intro-visual-trust-box">
              <div class="intro-trust-card">
                <div class="intro-trust-icon">🛵</div>
                <div class="intro-trust-info">
                  <strong>Giao Hàng Thần Tốc</strong>
                  <p>Món ăn đóng hộp giữ nhiệt, nóng hổi như vừa mới ra lò.</p>
                </div>
              </div>

              <div class="intro-trust-card">
                <div class="intro-trust-icon">⭐</div>
                <div class="intro-trust-info">
                  <strong>Hơn 10.000+ Khách Hài Lòng</strong>
                  <p>Điểm đánh giá trung bình 4.9/5 sao từ thực khách khắp cả nước.</p>
                </div>
              </div>

              <div class="intro-trust-card">
                <div class="intro-trust-icon">🛡️</div>
                <div class="intro-trust-info">
                  <strong>Cam Kết Hoàn Tiền 100%</strong>
                  <p>Hỗ trợ đổi trả hoặc hoàn tiền nhanh chóng nếu món ăn không đạt chuẩn.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- 3. Bottom CTA Bar (Bo thanh tien trinh, giu nut Vao Website) -->
      <div class="intro-bottom-bar">
        <button type="button" class="intro-bottom-cta" id="introBottomCta">
          <span>Vào Website Bếp 1979</span>
          <span>➔</span>
        </button>
      </div>
    `;

    return overlay;
  }

  // Particle Canvas Physics
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

    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2.2 + 0.8,
        color: colors[Math.floor(Math.random() * colors.length)],
        vy: -(Math.random() * 1.1 + 0.4),
        vx: (Math.random() - 0.5) * 0.7,
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
        ctx.shadowBlur = 6;
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

    const slides = overlay.querySelectorAll(".intro-scene-slide");
    const stepPills = overlay.querySelectorAll(".intro-step-pill");
    const timelineLabel = overlay.querySelector("#introTimelineLabel");
    const timerDisplay = overlay.querySelector("#introTimerDisplay");
    const soundToggle = overlay.querySelector("#introSoundToggle");
    const soundIcon = overlay.querySelector("#introSoundIcon");
    const skipBtn = overlay.querySelector("#introSkipBtn");
    const bottomCta = overlay.querySelector("#introBottomCta");
    const clocheTrigger = overlay.querySelector("#introClocheTrigger");
    const foodCards = overlay.querySelectorAll("[data-food-search]");
    const ctaButtons = overlay.querySelectorAll("[data-goto]");

    const SCENE_NAMES = [
      "Cảnh 1/4: Giới thiệu Bếp 1979",
      "Cảnh 2/4: Thực đơn 50+ món ăn & đồ uống",
      "Cảnh 3/4: Giờ vàng Flash Sale & Voucher ưu đãi",
      "Cảnh 4/4: Giao hàng 20P & Đặt món tiện lợi"
    ];

    let currentSceneIndex = 0;
    let isDismissed = false;

    function switchScene(index, userInitiated = false) {
      if (index === currentSceneIndex && !userInitiated) return;
      currentSceneIndex = index;

      slides.forEach((s, idx) => {
        s.classList.toggle("active", idx === currentSceneIndex);
      });

      stepPills.forEach((p, idx) => {
        p.classList.toggle("active", idx === currentSceneIndex);
      });

      if (timelineLabel) {
        timelineLabel.textContent = SCENE_NAMES[currentSceneIndex] || "Bếp 1979";
      }

      if (userInitiated) {
        playSound("transition");
      }
    }

    // Step pill click interactions
    stepPills.forEach(pill => {
      pill.addEventListener("click", () => {
        clearInterval(interval);
        const scene = Number(pill.dataset.scene || 0);
        switchScene(scene, true);
      });
    });

    function exitIntro(targetUrl) {
      if (isDismissed) return;
      isDismissed = true;
      clearInterval(interval);

      playSound("bell");
      overlay.classList.add("intro-exit");

      setTimeout(() => {
        if (cleanupCanvas) cleanupCanvas();
        if (overlay && overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
        if (targetUrl) {
          window.location.href = targetUrl;
        }
      }, 750);
    }

    // Interactive Cloche
    if (clocheTrigger) {
      clocheTrigger.addEventListener("click", () => {
        const rect = clocheTrigger.getBoundingClientRect();
        spawnBurstParticles(rect.left + rect.width / 2, rect.top + rect.height / 2);
        playSound("bell");

        clocheTrigger.style.transform = "scale(1.2) translateY(-14px) rotateX(16deg)";
        setTimeout(() => {
          clocheTrigger.style.transform = "";
        }, 350);
      });
    }

    // Interactive Food Cards in Scene 2
    foodCards.forEach(card => {
      card.addEventListener("click", () => {
        const keyword = card.dataset.foodSearch || "";
        const rect = card.getBoundingClientRect();
        spawnBurstParticles(rect.left + rect.width / 2, rect.top + rect.height / 2);
        playSound("sizzle");

        exitIntro(`menu.html?search=${encodeURIComponent(keyword)}`);
      });
    });

    // CTA Button actions
    ctaButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const url = btn.dataset.goto || "menu.html";
        exitIntro(url);
      });
    });

    // Sound toggle
    soundToggle.addEventListener("click", () => {
      isMuted = !isMuted;
      soundIcon.textContent = isMuted ? "🔇" : "🔊";
      soundToggle.style.opacity = isMuted ? "0.6" : "1";
    });

    // Skip & Main Bottom Exit
    skipBtn.addEventListener("click", () => exitIntro());
    bottomCta.addEventListener("click", () => exitIntro());

    // 10-Second Countdown & Auto Scene Switching (Chuyển cảnh sau mỗi 2.5s)
    let secondsLeft = 10;
    const interval = setInterval(() => {
      secondsLeft -= 1;
      if (timerDisplay) {
        timerDisplay.textContent = `${Math.max(0, secondsLeft)}s`;
      }

      // 10s chia làm 4 cảnh:
      // 10s -> 8s: Cảnh 0
      // 7s -> 5s: Cảnh 1
      // 4s -> 2s: Cảnh 2
      // 2s -> 0s: Cảnh 3
      if (secondsLeft === 7) switchScene(1);
      else if (secondsLeft === 4) switchScene(2);
      else if (secondsLeft === 2) switchScene(3);

      if (secondsLeft <= 0) {
        clearInterval(interval);
        exitIntro();
      }
    }, 1000);

    // Escape Key Exit
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
