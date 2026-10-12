/**
 * BẾP 1979 - MINI GAME "VÒNG QUAY MỸ VỊ 1979" (LUCKY SPIN WHEEL)
 * - Nút nổi hình tròn ở góc dưới bên trái màn hình (đối xứng với Zalo & Chatbot bên phải).
 * - Cho phép quay giải trí không giới hạn lượt.
 * - Mỗi tài khoản được nhận tối đa 1 Voucher thưởng/ngày vào Kho Voucher.
 */

(function initFoodHubMiniGame() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const pageName = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
  if (pageName.startsWith("admin") || pageName === "login.html" || pageName === "register.html") return;
  if (document.getElementById("fhMiniGameWidget")) return;

  const API_BASE = window.FOODHUB_CONFIG?.API_BASE_URL || "http://localhost:3000/api";
  const ORDERS_API_URL = `${API_BASE}/orders`;

  const WHEEL_SLICES = [
    {
      key: "SPIN15K",
      type: "voucher",
      shortLabel: "Giảm 15K",
      icon: "🎟️",
      title: "Voucher Giảm 15.000đ",
      desc: "Áp dụng cho đơn hàng từ 80.000đ",
      fallbackCode: "BEP79SPIN15K",
      discountValue: 15000,
      discountType: "fixed",
      color: "#ff5722",
      textColor: "#ffffff",
      weight: 22
    },
    {
      key: "MISS",
      type: "miss",
      shortLabel: "Chúc May Mắn",
      icon: "🍀",
      title: "Chúc Bạn May Mắn Lần Sau!",
      desc: "Lượt quay không giới hạn, hãy bấm quay tiếp ngay nhé!",
      color: "#2b1d16",
      textColor: "#ffe0b2",
      weight: 18
    },
    {
      key: "SPIN10P",
      type: "voucher",
      shortLabel: "Giảm 10%",
      icon: "⚡",
      title: "Voucher Giảm 10% Đơn Hàng",
      desc: "Giảm 10% (tối đa 25.000đ) cho đơn từ 60.000đ",
      fallbackCode: "BEP79SPIN10P",
      discountValue: 10,
      discountType: "percent",
      color: "#f59e0b",
      textColor: "#1f1209",
      weight: 16
    },
    {
      key: "SHIP15K",
      type: "voucher",
      shortLabel: "Freeship 15K",
      icon: "🛵",
      title: "Voucher Hỗ Trợ 15.000đ Phí Ship",
      desc: "Giảm ngay 15.000đ phí giao hàng cho đơn từ 60.000đ",
      fallbackCode: "BEP79SHIP15K",
      discountValue: 15000,
      discountType: "shipping",
      color: "#e11d48",
      textColor: "#ffffff",
      weight: 16
    },
    {
      key: "SPIN30K",
      type: "voucher",
      shortLabel: "VIP 30K",
      icon: "👑",
      title: "Siêu Voucher VIP Giảm 30.000đ",
      desc: "Giải đặc biệt! Giảm 30.000đ cho đơn từ 120.000đ",
      fallbackCode: "BEP79SPIN30K",
      discountValue: 30000,
      discountType: "fixed",
      color: "#7c3aed",
      textColor: "#ffffff",
      weight: 7
    },
    {
      key: "EXTRA",
      type: "extra",
      shortLabel: "Thêm 1 Lượt",
      icon: "🎲",
      title: "Tặng Thêm Lượt Quay May Mắn!",
      desc: "Bấm quay tiếp ngay để săn Voucher khủng nhé!",
      color: "#3e2723",
      textColor: "#ffd54f",
      weight: 15
    },
    {
      key: "SPIN20K",
      type: "voucher",
      shortLabel: "Giảm 20K",
      icon: "🔥",
      title: "Voucher Giảm 20.000đ",
      desc: "Áp dụng cho đơn hàng từ 100.000đ",
      fallbackCode: "BEP79SPIN20K",
      discountValue: 20000,
      discountType: "fixed",
      color: "#ea580c",
      textColor: "#ffffff",
      weight: 12
    },
    {
      key: "SPIN10K",
      type: "voucher",
      shortLabel: "Giảm 10K",
      icon: "🎁",
      title: "Voucher Giảm 10.000đ",
      desc: "Áp dụng cho mọi đơn hàng từ 50.000đ",
      fallbackCode: "BEP79SPIN10K",
      discountValue: 10000,
      discountType: "fixed",
      color: "#059669",
      textColor: "#ffffff",
      weight: 24
    }
  ];

  function getAuthToken() {
    return localStorage.getItem("foodhub_token") || "";
  }

  function getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem("foodhub_user") || "null");
    } catch (_) {
      return null;
    }
  }

  function getTodayKey() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function getDailyClaimStorageKey() {
    const user = getCurrentUser();
    const userId = user?.id ? String(user.id) : "guest";
    return `foodhub_minigame_claimed_${userId}_${getTodayKey()}`;
  }

  function getClaimedRewardToday() {
    if (!getAuthToken() || !getCurrentUser()) return null;
    try {
      const raw = localStorage.getItem(getDailyClaimStorageKey());
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function saveClaimedRewardToday(rewardInfo) {
    try {
      localStorage.setItem(getDailyClaimStorageKey(), JSON.stringify({
        ...rewardInfo,
        claimedAt: new Date().toISOString()
      }));
    } catch (_) {}
  }

  // Web Audio Synthesizer cho tiếng kim quay tạch-tạch và nhạc trúng giải
  let audioCtx = null;
  let isMuted = false;

  function playGameSound(type = "tick") {
    if (isMuted) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      if (!audioCtx) audioCtx = new AudioContextClass();
      if (audioCtx.state === "suspended") audioCtx.resume();

      const now = audioCtx.currentTime;
      if (type === "tick") {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(680, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.035);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === "win") {
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = "sine";
          const startAt = now + idx * 0.09;
          osc.frequency.setValueAtTime(freq, startAt);
          gain.gain.setValueAtTime(0.14, startAt);
          gain.gain.exponentialRampToValueAtTime(0.001, startAt + 0.32);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(startAt);
          osc.stop(startAt + 0.34);
        });
      } else if (type === "miss") {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(360, now);
        osc.frequency.linearRampToValueAtTime(240, now + 0.22);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch (_) {}
  }

  function injectMiniGameStyles() {
    if (document.getElementById("fhMiniGameStyles")) return;
    const style = document.createElement("style");
    style.id = "fhMiniGameStyles";
    style.textContent = `
      .fh-minigame-widget {
        position: fixed;
        left: 22px;
        bottom: 22px;
        z-index: 98;
        font-family: inherit;
      }

      .fh-minigame-Launcher {
        position: relative;
        width: 58px;
        height: 58px;
        border-radius: 50%;
        border: 2px solid rgba(255, 224, 130, 0.85);
        background: radial-gradient(circle at 30% 25%, #ffb300 0%, #ff5722 62%, #c62828 100%);
        color: #fff;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 12px 28px rgba(230, 62, 0, 0.42), inset 0 2px 6px rgba(255, 255, 255, 0.45);
        transition: transform 0.24s cubic-bezier(0.2, 1, 0.3, 1), box-shadow 0.24s ease;
        padding: 0;
      }

      .fh-minigame-Launcher:hover {
        transform: translateY(-4px) scale(1.06);
        box-shadow: 0 16px 34px rgba(230, 62, 0, 0.55), inset 0 2px 8px rgba(255, 255, 255, 0.6);
      }

      .fh-minigame-Launcher:hover .fh-minigame-wheel-svg {
        transform: rotate(120deg);
      }

      .fh-minigame-wheel-svg {
        width: 34px;
        height: 34px;
        transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.28));
      }

      .fh-minigame-pulse-ring {
        position: absolute;
        inset: -5px;
        border-radius: 50%;
        border: 2px solid rgba(255, 160, 0, 0.65);
        animation: fhMiniGamePulse 2.2s ease-out infinite;
        pointer-events: none;
      }

      @keyframes fhMiniGamePulse {
        0% { transform: scale(0.92); opacity: 0.9; }
        70% { transform: scale(1.26); opacity: 0; }
        100% { transform: scale(1.26); opacity: 0; }
      }

      .fh-minigame-badge {
        position: absolute;
        top: -5px;
        right: -5px;
        background: linear-gradient(135deg, #00c853, #009624);
        color: #fff;
        font-size: 11px;
        font-weight: 800;
        min-width: 22px;
        height: 22px;
        padding: 0 5px;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #fff;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.22);
      }

      .fh-minigame-badge.is-claimed {
        background: linear-gradient(135deg, #ff8f00, #e65100);
      }

      .fh-minigame-tooltip {
        position: absolute;
        left: calc(100% + 12px);
        top: 50%;
        transform: translateY(-50%);
        background: linear-gradient(135deg, #2b160c, #432010);
        color: #fff8e1;
        border: 1px solid rgba(255, 193, 7, 0.45);
        padding: 7px 13px;
        border-radius: 999px;
        font-size: 12.5px;
        font-weight: 700;
        white-space: nowrap;
        box-shadow: 0 8px 22px rgba(28, 12, 4, 0.26);
        pointer-events: none;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: opacity 0.2s ease, transform 0.2s ease;
      }

      .fh-minigame-Launcher:hover .fh-minigame-tooltip {
        transform: translateY(-50%) translateX(3px);
      }

      /* Modal Overlay */
      .fh-minigame-modal {
        position: fixed;
        inset: 0;
        z-index: 99999;
        background: rgba(15, 7, 4, 0.76);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.26s ease, visibility 0.26s ease;
      }

      .fh-minigame-modal.is-open {
        opacity: 1;
        visibility: visible;
      }

      .fh-minigame-dialog {
        width: 100%;
        max-width: 500px;
        max-height: 94vh;
        overflow-y: auto;
        background: radial-gradient(circle at 50% 0%, #3a180b 0%, #1b0b05 68%, #120603 100%);
        border: 1.5px solid rgba(255, 184, 48, 0.38);
        border-radius: 26px;
        box-shadow: 0 28px 70px rgba(0, 0, 0, 0.65), 0 0 40px rgba(255, 109, 0, 0.22);
        color: #fff;
        padding: 20px 22px 22px;
        position: relative;
        text-align: center;
        transform: scale(0.92) translateY(12px);
        transition: transform 0.28s cubic-bezier(0.2, 1, 0.3, 1);
      }

      .fh-minigame-modal.is-open .fh-minigame-dialog {
        transform: scale(1) translateY(0);
      }

      .fh-minigame-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 10px;
      }

      .fh-minigame-brand {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.14);
        padding: 5px 12px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
        color: #ffd54f;
      }

      .fh-minigame-controls {
        display: inline-flex;
        gap: 8px;
      }

      .fh-minigame-icon-btn {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        border: 1px solid rgba(255, 255, 255, 0.18);
        background: rgba(255, 255, 255, 0.08);
        color: #fff;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 15px;
        transition: background 0.18s ease, transform 0.18s ease;
      }

      .fh-minigame-icon-btn:hover {
        background: rgba(255, 255, 255, 0.18);
        transform: scale(1.06);
      }

      .fh-minigame-title {
        font-size: 23px;
        font-weight: 900;
        margin: 2px 0 4px;
        background: linear-gradient(135deg, #fff8e1 0%, #ffd54f 50%, #ff8a00 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        letter-spacing: -0.01em;
      }

      .fh-minigame-subtitle {
        font-size: 13px;
        color: rgba(255, 236, 179, 0.82);
        margin: 0 0 12px;
      }

      .fh-minigame-status-bar {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 8px;
        margin-bottom: 14px;
      }

      .fh-minigame-pill {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 213, 79, 0.28);
        border-radius: 999px;
        padding: 5px 12px;
        font-size: 12px;
        font-weight: 700;
        color: #fff3e0;
      }

      .fh-minigame-pill.highlight {
        background: rgba(0, 200, 83, 0.16);
        border-color: rgba(0, 230, 118, 0.45);
        color: #b9f6ca;
      }

      .fh-minigame-pill.claimed {
        background: rgba(255, 160, 0, 0.16);
        border-color: rgba(255, 193, 7, 0.45);
        color: #ffe082;
      }

      /* Wheel Stage */
      .fh-wheel-stage {
        position: relative;
        width: 310px;
        height: 310px;
        margin: 6px auto 16px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .fh-wheel-outer-rim {
        position: absolute;
        inset: -10px;
        border-radius: 50%;
        background: conic-gradient(from 0deg, #ffb300, #ff5722, #ffd54f, #d84315, #ffb300);
        padding: 10px;
        box-shadow: 0 14px 36px rgba(0, 0, 0, 0.55), 0 0 28px rgba(255, 145, 0, 0.35);
      }

      .fh-wheel-canvas-wrap {
        position: relative;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        overflow: hidden;
        box-shadow: inset 0 0 18px rgba(0, 0, 0, 0.55);
      }

      .fh-wheel-canvas {
        width: 100%;
        height: 100%;
        display: block;
        will-change: transform;
      }

      .fh-wheel-pointer {
        position: absolute;
        top: -18px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 5;
        width: 38px;
        height: 44px;
        filter: drop-shadow(0 6px 8px rgba(0, 0, 0, 0.5));
        transition: transform 0.08s ease;
      }

      .fh-wheel-pointer.is-ticking {
        transform: translateX(-50%) rotate(-14deg);
      }

      .fh-wheel-center-cap {
        position: absolute;
        width: 68px;
        height: 68px;
        border-radius: 50%;
        background: radial-gradient(circle at 30% 30%, #fff8e1 0%, #ffb300 55%, #e65100 100%);
        border: 3px solid #fff;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.5);
        z-index: 4;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: #2b1204;
        font-weight: 900;
        font-size: 13px;
        line-height: 1.05;
        user-select: none;
        transition: transform 0.18s ease, box-shadow 0.18s ease;
      }

      .fh-wheel-center-cap:hover:not(:disabled) {
        transform: scale(1.07);
        box-shadow: 0 8px 24px rgba(255, 160, 0, 0.65);
      }

      .fh-wheel-center-cap:disabled {
        cursor: wait;
        opacity: 0.85;
      }

      .fh-spin-main-btn {
        width: 100%;
        max-width: 310px;
        padding: 13px 22px;
        border-radius: 999px;
        border: none;
        background: linear-gradient(135deg, #ffb300 0%, #ff5722 100%);
        color: #fff;
        font-size: 15px;
        font-weight: 800;
        cursor: pointer;
        box-shadow: 0 10px 24px rgba(255, 87, 34, 0.42);
        transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
      }

      .fh-spin-main-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 14px 28px rgba(255, 87, 34, 0.56);
      }

      .fh-spin-main-btn:disabled {
        opacity: 0.65;
        cursor: wait;
      }

      /* Result Box */
      .fh-minigame-result {
        margin-top: 14px;
        background: rgba(255, 255, 255, 0.07);
        border: 1px solid rgba(255, 213, 79, 0.35);
        border-radius: 18px;
        padding: 14px 16px;
        text-align: center;
        animation: fhResultPop 0.28s cubic-bezier(0.2, 1, 0.3, 1);
      }

      @keyframes fhResultPop {
        from { opacity: 0; transform: translateY(8px) scale(0.96); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }

      .fh-minigame-result h3 {
        margin: 0 0 4px;
        font-size: 16.5px;
        color: #ffd54f;
      }

      .fh-minigame-result p {
        margin: 0 0 10px;
        font-size: 13px;
        color: rgba(255, 255, 255, 0.86);
      }

      .fh-minigame-code-box {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(0, 0, 0, 0.35);
        border: 1px dashed #ffd54f;
        border-radius: 10px;
        padding: 6px 12px;
        margin-bottom: 10px;
        font-family: monospace;
        font-size: 14px;
        font-weight: 800;
        color: #ffe082;
      }

      .fh-minigame-result-actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 8px;
      }

      .fh-mg-btn {
        padding: 9px 15px;
        border-radius: 999px;
        font-size: 13px;
        font-weight: 800;
        cursor: pointer;
        border: none;
        transition: transform 0.16s ease, opacity 0.16s ease;
      }

      .fh-mg-btn:hover:not(:disabled) {
        transform: translateY(-1px);
      }

      .fh-mg-btn.primary {
        background: linear-gradient(135deg, #00c853, #009624);
        color: #fff;
        box-shadow: 0 6px 16px rgba(0, 200, 83, 0.35);
      }

      .fh-mg-btn.secondary {
        background: rgba(255, 255, 255, 0.14);
        color: #fff;
        border: 1px solid rgba(255, 255, 255, 0.24);
      }

      .fh-mg-btn.accent {
        background: linear-gradient(135deg, #ffb300, #ff6d00);
        color: #1f0d05;
      }

      @media (max-width: 640px) {
        .fh-minigame-widget {
          left: 14px;
          bottom: 16px;
        }
        .fh-minigame-Launcher {
          width: 52px;
          height: 52px;
        }
        .fh-minigame-tooltip {
          display: none;
        }
        .fh-wheel-stage {
          width: 270px;
          height: 270px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function drawWheelCanvas(canvas) {
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = 310;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2;
    const sliceCount = WHEEL_SLICES.length;
    const sliceAngle = (Math.PI * 2) / sliceCount;

    ctx.clearRect(0, 0, size, size);

    WHEEL_SLICES.forEach((slice, idx) => {
      // Vẽ góc sao cho slice 0 nằm chính giữa hướng 12 giờ (-PI/2)
      const startAngle = -Math.PI / 2 - sliceAngle / 2 + idx * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = slice.color;
      ctx.fill();

      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "rgba(255, 248, 225, 0.35)";
      ctx.stroke();

      // Vẽ chữ và icon hướng vào tâm
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = slice.textColor || "#fff";

      ctx.font = "800 12.5px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
      ctx.fillText(slice.shortLabel, radius - 18, 4);

      ctx.font = "17px system-ui, -apple-system, Segoe UI, Emoji, sans-serif";
      ctx.fillText(slice.icon, radius - 92, 6);
      ctx.restore();

      // Chấm đinh tán vàng trên vành bánh xe
      const pegAngle = startAngle;
      const px = cx + Math.cos(pegAngle) * (radius - 6);
      const py = cy + Math.sin(pegAngle) * (radius - 6);
      ctx.beginPath();
      ctx.arc(px, py, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = "#fff8e1";
      ctx.fill();
    });
  }

  function pickWeightedSliceIndex() {
    const totalWeight = WHEEL_SLICES.reduce((sum, item) => sum + Number(item.weight || 10), 0);
    let random = Math.random() * totalWeight;
    for (let i = 0; i < WHEEL_SLICES.length; i++) {
      random -= Number(WHEEL_SLICES[i].weight || 10);
      if (random <= 0) return i;
    }
    return 0;
  }

  async function claimRewardFromServer(slice) {
    const token = getAuthToken();
    const user = getCurrentUser();

    if (!token || !user) {
      sessionStorage.setItem("foodhub_pending_minigame_slice", slice.key);
      if (typeof window.showSiteToast === "function") {
        window.showSiteToast("Vui lòng đăng nhập để lưu Voucher thưởng vào tài khoản!", "info");
      }
      setTimeout(() => {
        window.location.href = `login.html?redirect=${encodeURIComponent(window.location.pathname.split("/").pop() || "index.html")}`;
      }, 650);
      return null;
    }

    // Bước 1: Thử gọi endpoint chuyên biệt /api/orders/minigame/claim-reward
    try {
      const response = await fetch(`${ORDERS_API_URL}/minigame/claim-reward`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rewardKey: slice.key })
      });

      if (response.ok) {
        const data = await response.json();
        const discount = data.discount || { code: slice.fallbackCode, name: slice.title };
        saveClaimedRewardToday({
          key: slice.key,
          code: discount.code || slice.fallbackCode,
          title: discount.name || slice.title
        });
        return {
          code: discount.code || slice.fallbackCode,
          title: discount.name || slice.title,
          message: data.message || "Đã lưu voucher vào ví của bạn!"
        };
      }

      if (response.status === 400) {
        const errData = await response.json().catch(() => ({}));
        if (errData.code === "DAILY_LIMIT_REACHED") {
          saveClaimedRewardToday({
            key: slice.key,
            code: slice.fallbackCode,
            title: slice.title
          });
          throw new Error(errData.message || "Hôm nay bạn đã nhận 1 phần thưởng rồi!");
        }
      }
    } catch (err) {
      if (err.message && err.message.includes("Hôm nay bạn đã nhận")) {
        throw err;
      }
    }

    // Bước 2: Fallback tương thích trực tiếp với API /orders/vouchers/available & /orders/vouchers/claim trên Render
    try {
      const availRes = await fetch(`${ORDERS_API_URL}/vouchers/available`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (availRes.ok) {
        const list = await availRes.json();
        if (Array.isArray(list) && list.length > 0) {
          const claimable = list.filter(item => {
            const owned = Number(item.ownedQuantity ?? item.ownedRemaining ?? 0) > 0;
            const out = item.remainingGlobal !== null && Number(item.remainingGlobal || 0) <= 0;
            return !owned && !out;
          });
          const targetVoucher = claimable[0] || list[0];
          if (targetVoucher?.id) {
            const claimRes = await fetch(`${ORDERS_API_URL}/vouchers/claim`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({ discountId: targetVoucher.id })
            });
            const claimData = await claimRes.json().catch(() => ({}));
            if (claimRes.ok) {
              const finalCode = claimData.discount?.code || targetVoucher.code || slice.fallbackCode;
              const finalName = claimData.discount?.name || targetVoucher.name || slice.title;
              saveClaimedRewardToday({
                key: slice.key,
                code: finalCode,
                title: finalName
              });
              return {
                code: finalCode,
                title: finalName,
                message: `Chúc mừng! Đã thêm voucher ${finalCode} vào ví của bạn.`
              };
            }
          }
        }
      }
    } catch (_) {}

    // Bước 3: Lưu mã thưởng hôm nay vào tài khoản phiên hiện tại
    saveClaimedRewardToday({
      key: slice.key,
      code: slice.fallbackCode,
      title: slice.title
    });
    return {
      code: slice.fallbackCode,
      title: slice.title,
      message: `Đã nhận mã thưởng ${slice.fallbackCode}!`
    };
  }

  function autoApplyPendingVoucherOnCart() {
    const pendingCode = sessionStorage.getItem("foodhub_auto_apply_voucher");
    if (!pendingCode) return;
    const discountInput = document.getElementById("discountCodeInput");
    if (!discountInput) return;

    sessionStorage.removeItem("foodhub_auto_apply_voucher");
    discountInput.value = pendingCode;
    if (typeof window.showSiteToast === "function") {
      window.showSiteToast(`Đã điền mã voucher ${pendingCode} từ Vòng Quay!`, "success");
    }
  }

  function buildMiniGameDOM() {
    injectMiniGameStyles();

    const wrapper = document.createElement("div");
    wrapper.id = "fhMiniGameWidget";
    wrapper.className = "fh-minigame-widget";

    wrapper.innerHTML = `
      <button type="button" class="fh-minigame-Launcher" id="fhMiniGameOpenBtn" aria-label="Mở Vòng Quay Mỹ Vị 1979" title="Vòng Quay Mỹ Vị 1979 - Quay nhận Voucher giảm giá">
        <span class="fh-minigame-pulse-ring" aria-hidden="true"></span>
        <svg class="fh-minigame-wheel-svg" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle cx="32" cy="32" r="28" fill="#1F0D05" stroke="#FFE082" stroke-width="3"/>
          <path d="M32 32L32 4A28 28 0 0 1 56.2 18L32 32Z" fill="#FF5722"/>
          <path d="M32 32L56.2 18A28 28 0 0 1 56.2 46L32 32Z" fill="#FFB300"/>
          <path d="M32 32L56.2 46A28 28 0 0 1 32 60L32 32Z" fill="#E11D48"/>
          <path d="M32 32L32 60A28 28 0 0 1 7.8 46L32 32Z" fill="#7C3AED"/>
          <path d="M32 32L7.8 46A28 28 0 0 1 7.8 18L32 32Z" fill="#059669"/>
          <path d="M32 32L7.8 18A28 28 0 0 1 32 4L32 32Z" fill="#F59E0B"/>
          <circle cx="32" cy="32" r="7" fill="#FFF8E1" stroke="#FF6F00" stroke-width="2.5"/>
        </svg>
        <span class="fh-minigame-badge" id="fhMiniGameBadge">🎁 1</span>
        <span class="fh-minigame-tooltip">🎡 Vòng Quay Săn Voucher</span>
      </button>

      <div class="fh-minigame-modal" id="fhMiniGameModal" role="dialog" aria-modal="true" aria-labelledby="fhMiniGameTitle" hidden>
        <div class="fh-minigame-dialog">
          <div class="fh-minigame-header">
            <span class="fh-minigame-brand">🎡 Mini Game Bếp 1979</span>
            <div class="fh-minigame-controls">
              <button type="button" class="fh-minigame-icon-btn" id="fhMiniGameMuteBtn" title="Bật/Tắt âm thanh" aria-label="Bật hoặc tắt âm thanh">🔊</button>
              <button type="button" class="fh-minigame-icon-btn" id="fhMiniGameCloseBtn" title="Đóng" aria-label="Đóng Vòng Quay">✕</button>
            </div>
          </div>

          <h2 class="fh-minigame-title" id="fhMiniGameTitle">Vòng Quay Mỹ Vị 1979</h2>
          <p class="fh-minigame-subtitle">Quay thử vận may không giới hạn • Nhận ngay 1 Voucher ưu đãi mỗi ngày!</p>

          <div class="fh-minigame-status-bar">
            <span class="fh-minigame-pill">♾️ Lượt quay: <strong>Không giới hạn</strong></span>
            <span class="fh-minigame-pill highlight" id="fhMiniGameQuotaPill">🎁 Quà hôm nay: <strong>Còn 1/1 lượt nhận</strong></span>
          </div>

          <div class="fh-wheel-stage">
            <div class="fh-wheel-outer-rim"></div>
            <svg class="fh-wheel-pointer" id="fhWheelPointer" viewBox="0 0 40 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M20 46L5 16C2 9 7 2 15 2H25C33 2 38 9 35 16L20 46Z" fill="#FFD54F" stroke="#FFFFFF" stroke-width="2.5"/>
              <circle cx="20" cy="14" r="5" fill="#D84315"/>
            </svg>
            <div class="fh-wheel-canvas-wrap">
              <canvas class="fh-wheel-canvas" id="fhWheelCanvas"></canvas>
            </div>
            <button type="button" class="fh-wheel-center-cap" id="fhWheelCenterBtn" aria-label="Quay ngay">
              <span>QUAY</span>
              <small>NGAY</small>
            </button>
          </div>

          <button type="button" class="fh-spin-main-btn" id="fhSpinMainBtn">🎰 QUAY NGAY SĂN VOUCHER</button>

          <div class="fh-minigame-result" id="fhMiniGameResultBox" hidden></div>
        </div>
      </div>
    `;

    document.body.appendChild(wrapper);

    const openBtn = wrapper.querySelector("#fhMiniGameOpenBtn");
    const badgeEl = wrapper.querySelector("#fhMiniGameBadge");
    const modal = wrapper.querySelector("#fhMiniGameModal");
    const closeBtn = wrapper.querySelector("#fhMiniGameCloseBtn");
    const muteBtn = wrapper.querySelector("#fhMiniGameMuteBtn");
    const quotaPill = wrapper.querySelector("#fhMiniGameQuotaPill");
    const canvas = wrapper.querySelector("#fhWheelCanvas");
    const pointer = wrapper.querySelector("#fhWheelPointer");
    const centerBtn = wrapper.querySelector("#fhWheelCenterBtn");
    const spinMainBtn = wrapper.querySelector("#fhSpinMainBtn");
    const resultBox = wrapper.querySelector("#fhMiniGameResultBox");

    drawWheelCanvas(canvas);

    let currentRotationDeg = 0;
    let isSpinning = false;

    function syncDailyQuotaUI() {
      const claimed = getClaimedRewardToday();
      if (claimed) {
        badgeEl.textContent = "🎮";
        badgeEl.classList.add("is-claimed");
        quotaPill.className = "fh-minigame-pill claimed";
        quotaPill.innerHTML = `✅ Đã nhận quà hôm nay: <strong>${claimed.code}</strong>`;
      } else {
        badgeEl.textContent = "🎁 1";
        badgeEl.classList.remove("is-claimed");
        quotaPill.className = "fh-minigame-pill highlight";
        quotaPill.innerHTML = `🎁 Quà hôm nay: <strong>Còn 1/1 lượt nhận</strong>`;
      }
    }

    function openModal() {
      syncDailyQuotaUI();
      modal.hidden = false;
      requestAnimationFrame(() => modal.classList.add("is-open"));
    }

    function closeModal() {
      if (isSpinning) return;
      modal.classList.remove("is-open");
      setTimeout(() => {
        modal.hidden = true;
      }, 250);
    }

    function renderClaimedState(reward) {
      syncDailyQuotaUI();
      resultBox.hidden = false;
      resultBox.innerHTML = `
        <h3>🎉 Đã Nhận Voucher Thành Công!</h3>
        <p>${reward.title || "Voucher ưu đãi Bếp 1979"}</p>
        <div class="fh-minigame-code-box">
          <span>Mã: ${reward.code}</span>
        </div>
        <div class="fh-minigame-result-actions">
          <button type="button" class="fh-mg-btn primary" data-mg-use-code="${reward.code}">🛒 Dùng ngay tại Giỏ hàng</button>
          <button type="button" class="fh-mg-btn secondary" data-mg-copy-code="${reward.code}">📋 Sao chép mã</button>
        </div>
      `;
    }

    function renderSpinOutcome(slice) {
      resultBox.hidden = false;
      const claimedToday = getClaimedRewardToday();

      if (slice.type === "miss" || slice.type === "extra") {
        playGameSound("miss");
        resultBox.innerHTML = `
          <h3>${slice.icon} ${slice.title}</h3>
          <p>${slice.desc}</p>
          <div class="fh-minigame-result-actions">
            <button type="button" class="fh-mg-btn accent" data-mg-spin-again="1">🔄 Quay Tiếp Ngay</button>
          </div>
        `;
        return;
      }

      playGameSound("win");
      if (typeof window.triggerConfetti === "function") {
        window.triggerConfetti({ particleCount: 65 });
      }

      if (claimedToday) {
        resultBox.innerHTML = `
          <h3>${slice.icon} Bạn quay trúng: ${slice.title}!</h3>
          <p>Hôm nay bạn đã nhận mã <strong>${claimedToday.code}</strong> rồi. Bạn vẫn có thể quay giải trí thoải mái hoặc dùng mã đã nhận nhé!</p>
          <div class="fh-minigame-code-box">
            <span>Mã hôm nay của bạn: ${claimedToday.code}</span>
          </div>
          <div class="fh-minigame-result-actions">
            <button type="button" class="fh-mg-btn primary" data-mg-use-code="${claimedToday.code}">🛒 Dùng mã ${claimedToday.code}</button>
            <button type="button" class="fh-mg-btn secondary" data-mg-spin-again="1">🔄 Quay giải trí tiếp</button>
          </div>
        `;
        return;
      }

      resultBox.innerHTML = `
        <h3>🎉 Chúc mừng! Bạn trúng: ${slice.title}</h3>
        <p>${slice.desc}</p>
        <div class="fh-minigame-result-actions">
          <button type="button" class="fh-mg-btn primary" id="fhClaimPrizeBtn">🎁 Nhận Voucher Này (1/1 Hôm Nay)</button>
          <button type="button" class="fh-mg-btn secondary" data-mg-spin-again="1">🔄 Quay tiếp tìm giải khác</button>
        </div>
      `;

      const claimBtn = resultBox.querySelector("#fhClaimPrizeBtn");
      claimBtn?.addEventListener("click", async () => {
        claimBtn.disabled = true;
        claimBtn.textContent = "Đang lưu vào ví...";
        try {
          const reward = await claimRewardFromServer(slice);
          if (!reward) return;
          if (typeof window.showSiteToast === "function") {
            window.showSiteToast(reward.message, "success");
          }
          if (typeof window.loadAvailableVouchers === "function") window.loadAvailableVouchers();
          if (typeof window.loadOwnedVouchers === "function") window.loadOwnedVouchers();
          if (typeof window.startFoodHubNotificationBadges === "function") window.startFoodHubNotificationBadges();
          renderClaimedState(reward);
        } catch (err) {
          if (typeof window.showSiteToast === "function") {
            window.showSiteToast(err.message || "Không thể nhận voucher", "error");
          }
          syncDailyQuotaUI();
          claimBtn.disabled = false;
          claimBtn.textContent = "🎁 Nhận Voucher Này (1/1 Hôm Nay)";
        }
      });
    }

    function spinWheel() {
      if (isSpinning) return;
      isSpinning = true;
      centerBtn.disabled = true;
      spinMainBtn.disabled = true;
      spinMainBtn.textContent = "🎡 Vòng quay đang chạy...";
      resultBox.hidden = true;

      const sliceCount = WHEEL_SLICES.length;
      const sliceDeg = 360 / sliceCount;
      const targetIndex = pickWeightedSliceIndex();
      const targetSlice = WHEEL_SLICES[targetIndex];

      // Để lát targetIndex dừng ở kim chỉ 12h, góc đích cần bù -(targetIndex * sliceDeg)
      const jitterDeg = (Math.random() - 0.5) * (sliceDeg * 0.55);
      const targetModDeg = ((360 - targetIndex * sliceDeg + jitterDeg) % 360 + 360) % 360;
      const currentModDeg = ((currentRotationDeg % 360) + 360) % 360;
      let deltaDeg = targetModDeg - currentModDeg;
      if (deltaDeg < 0) deltaDeg += 360;

      const extraSpins = (5 + Math.floor(Math.random() * 3)) * 360;
      const startDeg = currentRotationDeg;
      const finalDeg = startDeg + extraSpins + deltaDeg;
      const durationMs = 4600;
      const startTime = performance.now();
      let lastTickStep = Math.floor(startDeg / sliceDeg);

      function animateFrame(now) {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / durationMs);
        // Ease-out cubic-quintic mượt mà như vòng quay thật
        const eased = 1 - Math.pow(1 - progress, 4);
        const angleNow = startDeg + (finalDeg - startDeg) * eased;

        canvas.style.transform = `rotate(${angleNow}deg)`;

        const currentTickStep = Math.floor(angleNow / sliceDeg);
        if (currentTickStep > lastTickStep) {
          lastTickStep = currentTickStep;
          playGameSound("tick");
          pointer.classList.add("is-ticking");
          setTimeout(() => pointer.classList.remove("is-ticking"), 55);
        }

        if (progress < 1) {
          requestAnimationFrame(animateFrame);
        } else {
          currentRotationDeg = finalDeg;
          isSpinning = false;
          centerBtn.disabled = false;
          spinMainBtn.disabled = false;
          spinMainBtn.textContent = "🎰 QUAY TIẾP";
          renderSpinOutcome(targetSlice);
        }
      }

      requestAnimationFrame(animateFrame);
    }

    openBtn.addEventListener("click", openModal);
    closeBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", e => {
      if (e.target === modal) closeModal();
    });
    window.addEventListener("keydown", e => {
      if (e.key === "Escape" && !modal.hidden) closeModal();
    });

    muteBtn.addEventListener("click", () => {
      isMuted = !isMuted;
      muteBtn.textContent = isMuted ? "🔇" : "🔊";
    });

    centerBtn.addEventListener("click", spinWheel);
    spinMainBtn.addEventListener("click", spinWheel);

    resultBox.addEventListener("click", e => {
      const spinAgainBtn = e.target.closest("[data-mg-spin-again]");
      if (spinAgainBtn) {
        spinWheel();
        return;
      }

      const copyBtn = e.target.closest("[data-mg-copy-code]");
      if (copyBtn) {
        const code = copyBtn.getAttribute("data-mg-copy-code") || "";
        navigator.clipboard?.writeText(code).catch(() => {});
        if (typeof window.showSiteToast === "function") {
          window.showSiteToast(`Đã sao chép mã ${code}`, "success");
        }
        copyBtn.textContent = "✓ Đã sao chép";
        return;
      }

      const useBtn = e.target.closest("[data-mg-use-code]");
      if (useBtn) {
        const code = useBtn.getAttribute("data-mg-use-code") || "";
        sessionStorage.setItem("foodhub_auto_apply_voucher", code);
        if (window.location.pathname.endsWith("cart.html")) {
          closeModal();
          autoApplyPendingVoucherOnCart();
        } else {
          window.location.href = "cart.html";
        }
      }
    });

    syncDailyQuotaUI();
    autoApplyPendingVoucherOnCart();

    // Nếu vừa đăng nhập xong từ lời mời nhận quà trước đó thì mở lại Vòng Quay
    const pendingSliceKey = sessionStorage.getItem("foodhub_pending_minigame_slice");
    if (pendingSliceKey && getAuthToken()) {
      sessionStorage.removeItem("foodhub_pending_minigame_slice");
      const matched = WHEEL_SLICES.find(s => s.key === pendingSliceKey);
      if (matched) {
        openModal();
        renderSpinOutcome(matched);
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildMiniGameDOM);
  } else {
    buildMiniGameDOM();
  }
})();

