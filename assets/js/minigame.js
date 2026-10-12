/**
 * BẾP 1979 - MINI GAME "VÒNG QUAY MỸ VỊ 1979" (LUCKY SPIN WHEEL)
 * - Trên các trang khách hàng: chỉ hiển thị nút nổi hình tròn ở góc dưới bên trái màn hình dẫn sang trang riêng `minigame.html` (không bật popup đè lên màn hình).
 * - Trên trang `minigame.html`: điều khiển Vòng Quay, bộ đếm ngược cuối ngày và khung phần thưởng.
 * - Cơ chế: Mỗi tài khoản mỗi ngày được quay 1 lần (1/1). Đến cuối ngày (23:59:59 -> 00:00:00) tự động reset lượt quay và xóa toàn bộ dữ liệu/voucher vòng quay của ngày cũ dù đã xài hay chưa xài.
 */

(function initFoodHubMiniGame() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const rawSegment = (window.location.pathname.split("/").filter(Boolean).pop() || "index.html").toLowerCase();
  const pageName = rawSegment.endsWith(".html") ? rawSegment : `${rawSegment}.html`;
  if (pageName.startsWith("admin") || pageName === "login.html" || pageName === "register.html") return;

  const API_BASE = window.FOODHUB_CONFIG?.API_BASE_URL || "http://localhost:3000/api";
  const ORDERS_API_URL = `${API_BASE}/orders`;
  const CLAIM_STORAGE_PREFIX = "foodhub_minigame_claimed_";

  const WHEEL_SLICES = [
    {
      key: "SPIN15K",
      type: "voucher",
      shortLabel: "Giảm 15K",
      icon: "🎟️",
      title: "Voucher Giảm 15.000đ",
      desc: "Áp dụng cho đơn hàng từ 80.000đ (Hiệu lực đến 23:59 hôm nay)",
      fallbackCode: "BEP79SPIN15K",
      discountValue: 15000,
      discountType: "fixed",
      minOrderAmount: 80000,
      color: "#ff5722",
      textColor: "#ffffff",
      weight: 22
    },
    {
      key: "MISS",
      type: "extra",
      shortLabel: "Quay Lại Nhé",
      icon: "🍀",
      title: "Chưa Trúng Voucher - Tặng Ngay Lượt Quay Bù!",
      desc: "Bạn không bị mất lượt hôm nay, hãy bấm quay tiếp để nhận Voucher nhé!",
      color: "#2b1d16",
      textColor: "#ffe0b2",
      weight: 14
    },
    {
      key: "SPIN10P",
      type: "voucher",
      shortLabel: "Giảm 10%",
      icon: "⚡",
      title: "Voucher Giảm 10% Đơn Hàng",
      desc: "Giảm 10% (tối đa 25.000đ) cho đơn từ 60.000đ (Hiệu lực đến 23:59 hôm nay)",
      fallbackCode: "BEP79SPIN10P",
      discountValue: 10,
      discountType: "percent",
      minOrderAmount: 60000,
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
      desc: "Giảm ngay 15.000đ phí giao hàng cho đơn từ 60.000đ (Hiệu lực đến 23:59 hôm nay)",
      fallbackCode: "BEP79SHIP15K",
      discountValue: 15000,
      discountType: "shipping",
      minOrderAmount: 60000,
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
      desc: "Giải đặc biệt! Giảm 30.000đ cho đơn từ 120.000đ (Hiệu lực đến 23:59 hôm nay)",
      fallbackCode: "BEP79SPIN30K",
      discountValue: 30000,
      discountType: "fixed",
      minOrderAmount: 120000,
      color: "#7c3aed",
      textColor: "#ffffff",
      weight: 7
    },
    {
      key: "EXTRA",
      type: "extra",
      shortLabel: "Thêm 1 Lượt",
      icon: "🎲",
      title: "Ô May Mắn - Cộng Thêm 1 Lượt Quay!",
      desc: "Lượt quay hôm nay của bạn vẫn còn nguyên, bấm quay tiếp ngay nhé!",
      color: "#3e2723",
      textColor: "#ffd54f",
      weight: 12
    },
    {
      key: "SPIN20K",
      type: "voucher",
      shortLabel: "Giảm 20K",
      icon: "🔥",
      title: "Voucher Giảm 20.000đ",
      desc: "Áp dụng cho đơn hàng từ 100.000đ (Hiệu lực đến 23:59 hôm nay)",
      fallbackCode: "BEP79SPIN20K",
      discountValue: 20000,
      discountType: "fixed",
      minOrderAmount: 100000,
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
      desc: "Áp dụng cho mọi đơn hàng từ 50.000đ (Hiệu lực đến 23:59 hôm nay)",
      fallbackCode: "BEP79SPIN10K",
      discountValue: 10000,
      discountType: "fixed",
      minOrderAmount: 50000,
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

  function getTodayDisplayString() {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, "0");
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const y = now.getFullYear();
    return `Ngày ${d}/${m}/${y}`;
  }

  /**
   * Tự động xóa toàn bộ dữ liệu lượt quay & voucher của các ngày cũ trong bộ nhớ trình duyệt
   * (dù đã xài hay chưa xài đều xóa sạch khi sang ngày mới).
   */
  function purgeExpiredMiniGameLocalStorage() {
    const todayKey = getTodayKey();
    try {
      const keysToDelete = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CLAIM_STORAGE_PREFIX) && !key.endsWith(`_${todayKey}`)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(k => localStorage.removeItem(k));

      const savedVoucherDate = sessionStorage.getItem("foodhub_auto_apply_voucher_date");
      if (savedVoucherDate && savedVoucherDate !== todayKey) {
        sessionStorage.removeItem("foodhub_auto_apply_voucher");
        sessionStorage.removeItem("foodhub_auto_apply_voucher_date");
      }
    } catch (_) {}
  }

  function getDailyClaimStorageKey() {
    const user = getCurrentUser();
    const userId = user?.id ? String(user.id) : "guest";
    return `${CLAIM_STORAGE_PREFIX}${userId}_${getTodayKey()}`;
  }

  function getClaimedRewardToday() {
    purgeExpiredMiniGameLocalStorage();
    if (!getAuthToken() || !getCurrentUser()) return null;
    try {
      const raw = localStorage.getItem(getDailyClaimStorageKey());
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function saveClaimedRewardToday(rewardInfo) {
    purgeExpiredMiniGameLocalStorage();
    if (!getAuthToken() || !getCurrentUser()) return;
    try {
      localStorage.setItem(
        getDailyClaimStorageKey(),
        JSON.stringify({
          ...rewardInfo,
          dateKey: getTodayKey(),
          claimedAt: new Date().toISOString()
        })
      );
    } catch (_) {}
  }

  function clearClaimedRewardToday() {
    try {
      localStorage.removeItem(getDailyClaimStorageKey());
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
      } else if (type === "extra") {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.linearRampToValueAtTime(580, now + 0.22);
        gain.gain.setValueAtTime(0.11, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch (_) {}
  }

  /**
   * Đồng bộ trạng thái lượt quay hôm nay từ Backend (và tự động dọn voucher ngày cũ trên DB).
   */
  async function syncDailyStatusFromServer() {
    purgeExpiredMiniGameLocalStorage();
    const token = getAuthToken();
    const user = getCurrentUser();
    if (!token || !user) return getClaimedRewardToday();

    try {
      const res = await fetch(`${ORDERS_API_URL}/minigame/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.hasSpunToday && data.rewardToday) {
          const rewardObj = {
            code: data.rewardToday.code,
            title: data.rewardToday.name || "Voucher Vòng Quay Mỹ Vị",
            desc: data.rewardToday.description || "Có hiệu lực đến 23:59:59 hôm nay",
            usedCount: Number(data.rewardToday.usedCount || 0)
          };
          saveClaimedRewardToday(rewardObj);
          return rewardObj;
        } else if (data.hasSpunToday === false) {
          // Nếu server xác nhận hôm nay chưa quay (hoặc đã sang ngày mới), chỉ giữ local nếu vừa lưu từ fallback
          const localClaimed = getClaimedRewardToday();
          if (localClaimed && !localClaimed.isFallbackLocal) {
            clearClaimedRewardToday();
            return null;
          }
          return localClaimed;
        }
      }
    } catch (_) {}

    return getClaimedRewardToday();
  }

  async function claimRewardFromServer(slice) {
    const token = getAuthToken();
    const user = getCurrentUser();

    if (!token || !user) {
      if (typeof window.showSiteToast === "function") {
        window.showSiteToast("Vui lòng đăng nhập để quay và nhận Voucher hôm nay!", "info");
      }
      setTimeout(() => {
        window.location.href = "login.html?redirect=minigame.html";
      }, 600);
      return null;
    }

    // Bước 1: Gọi endpoint chính thức /api/orders/minigame/claim-reward
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
        const discount = data.discount || { code: slice.fallbackCode, name: slice.title, description: slice.desc };
        const rewardObj = {
          key: slice.key,
          code: discount.code || slice.fallbackCode,
          title: discount.name || slice.title,
          desc: discount.description || slice.desc,
          isFallbackLocal: false
        };
        saveClaimedRewardToday(rewardObj);
        return {
          ...rewardObj,
          message: data.message || "Đã lưu voucher vào Kho Voucher hôm nay của bạn!"
        };
      }

      if (response.status === 400) {
        const errData = await response.json().catch(() => ({}));
        if (errData.code === "DAILY_LIMIT_REACHED") {
          const existing = errData.rewardToday;
          const rewardObj = {
            key: slice.key,
            code: existing?.code || slice.fallbackCode,
            title: existing?.name || slice.title,
            desc: existing?.description || slice.desc,
            isFallbackLocal: false
          };
          saveClaimedRewardToday(rewardObj);
          throw new Error(errData.message || "Mỗi tài khoản chỉ được quay 1 lần mỗi ngày!");
        }
      }
    } catch (err) {
      if (err.message && err.message.includes("Mỗi tài khoản chỉ được quay")) {
        throw err;
      }
    }

    // Bước 2: Fallback tương thích với API /orders/vouchers/available & /orders/vouchers/claim
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
              const rewardObj = {
                key: slice.key,
                code: finalCode,
                title: finalName,
                desc: slice.desc,
                isFallbackLocal: true
              };
              saveClaimedRewardToday(rewardObj);
              return {
                ...rewardObj,
                message: `Chúc mừng! Đã thêm voucher ${finalCode} vào ví hôm nay của bạn.`
              };
            }
          }
        }
      }
    } catch (_) {}

    // Bước 3: Lưu mã thưởng hôm nay vào tài khoản phiên hiện tại
    const fallbackReward = {
      key: slice.key,
      code: slice.fallbackCode,
      title: slice.title,
      desc: slice.desc,
      isFallbackLocal: true
    };
    saveClaimedRewardToday(fallbackReward);
    return {
      ...fallbackReward,
      message: `Đã nhận mã thưởng ${slice.fallbackCode} cho hôm nay!`
    };
  }

  function autoApplyPendingVoucherOnCart() {
    purgeExpiredMiniGameLocalStorage();
    const pendingCode = sessionStorage.getItem("foodhub_auto_apply_voucher");
    if (!pendingCode) return;
    const discountInput = document.getElementById("discountCodeInput");
    if (!discountInput) return;

    sessionStorage.removeItem("foodhub_auto_apply_voucher");
    sessionStorage.removeItem("foodhub_auto_apply_voucher_date");
    discountInput.value = pendingCode;
    if (typeof window.showSiteToast === "function") {
      window.showSiteToast(`Đã điền mã voucher ${pendingCode} từ Vòng Quay!`, "success");
    }
  }

  /**
   * 1. TRÊN CÁC TRANG KHÁC (KHÔNG PHẢI minigame.html):
   * Chỉ hiển thị nút tròn nổi ở góc dưới bên trái dẫn thẳng sang trang `minigame.html`.
   */
  function injectFloatingLauncherStyles() {
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
        text-decoration: none;
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
        background: linear-gradient(135deg, #64748b, #475569);
      }

      .fh-minigame-tooltip {
        position: absolute;
        left: calc(100% + 12px);
        top: 50%;
        transform: translateY(-50%) translateX(-6px);
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
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.22s ease, transform 0.22s ease, visibility 0.22s ease;
      }

      .fh-minigame-Launcher:hover .fh-minigame-tooltip,
      .fh-minigame-Launcher:focus-visible .fh-minigame-tooltip {
        opacity: 1;
        visibility: visible;
        transform: translateY(-50%) translateX(3px);
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
      }
    `;
    document.head.appendChild(style);
  }

  function buildFloatingLauncherOnly() {
    if (document.getElementById("fhMiniGameWidget") || document.getElementById("mgWheelCanvas")) return;
    injectFloatingLauncherStyles();

    const wrapper = document.createElement("div");
    wrapper.id = "fhMiniGameWidget";
    wrapper.className = "fh-minigame-widget";

    wrapper.innerHTML = `
      <a href="minigame.html" class="fh-minigame-Launcher" id="fhMiniGameOpenBtn" aria-label="Đi tới trang Vòng Quay Mỹ Vị 1979" title="Vòng Quay Mỹ Vị 1979 - Mỗi ngày 1 lượt quay nhận Voucher">
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
        <span class="fh-minigame-tooltip" id="fhMiniGameTooltip">🎡 Vòng Quay (1 lượt/ngày)</span>
      </a>
    `;

    document.body.appendChild(wrapper);

    const badgeEl = wrapper.querySelector("#fhMiniGameBadge");
    const tooltipEl = wrapper.querySelector("#fhMiniGameTooltip");

    function updateLauncherBadge(claimed) {
      if (claimed) {
        badgeEl.textContent = "✓";
        badgeEl.classList.add("is-claimed");
        if (tooltipEl) tooltipEl.textContent = `🎟️ Đã nhận mã ${claimed.code} hôm nay`;
      } else {
        badgeEl.textContent = "🎁 1";
        badgeEl.classList.remove("is-claimed");
        if (tooltipEl) tooltipEl.textContent = "🎡 Vòng Quay (Còn 1 lượt hôm nay)";
      }
    }

    updateLauncherBadge(getClaimedRewardToday());
    syncDailyStatusFromServer().then(claimed => updateLauncherBadge(claimed));
  }

  /**
   * 2. TRÊN TRANG RIÊNG `minigame.html`:
   * Vẽ bánh xe 350x350, đếm ngược tới 23:59:59, kiểm soát đúng 1 lượt/ngày/tài khoản.
   */
  function drawWheelCanvas(canvas, size = 350) {
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2;
    const sliceCount = WHEEL_SLICES.length;
    const sliceAngle = (Math.PI * 2) / sliceCount;

    ctx.clearRect(0, 0, size, size);

    WHEEL_SLICES.forEach((slice, idx) => {
      const startAngle = -Math.PI / 2 - sliceAngle / 2 + idx * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = slice.color;
      ctx.fill();

      ctx.lineWidth = 1.6;
      ctx.strokeStyle = "rgba(255, 248, 225, 0.36)";
      ctx.stroke();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = slice.textColor || "#fff";

      ctx.font = "800 13.5px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
      ctx.fillText(slice.shortLabel, radius - 20, 4);

      ctx.font = "19px system-ui, -apple-system, Segoe UI, Emoji, sans-serif";
      ctx.fillText(slice.icon, radius - 106, 6);
      ctx.restore();

      const pegAngle = startAngle;
      const px = cx + Math.cos(pegAngle) * (radius - 7);
      const py = cy + Math.sin(pegAngle) * (radius - 7);
      ctx.beginPath();
      ctx.arc(px, py, 3.5, 0, Math.PI * 2);
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

  function initDedicatedMiniGamePage() {
    const canvas = document.getElementById("mgWheelCanvas");
    if (!canvas) return;
    if (canvas.dataset.mgInitialized === "1") return;
    canvas.dataset.mgInitialized = "1";

    const pointer = document.getElementById("mgWheelPointer");
    const centerBtn = document.getElementById("mgWheelCenterBtn");
    const spinMainBtn = document.getElementById("mgSpinMainBtn");
    const quotaBadge = document.getElementById("mgQuotaStatusBadge");
    const soundBtn = document.getElementById("mgSoundToggleBtn");
    const soundIcon = document.getElementById("mgSoundIcon");
    const soundText = document.getElementById("mgSoundText");
    const rewardBox = document.getElementById("mgMyRewardBox");
    const todayDateTag = document.getElementById("mgTodayDateTag");
    const footnoteEl = document.getElementById("mgWheelFootnote");

    const hoursEl = document.getElementById("mgTimerHours");
    const minutesEl = document.getElementById("mgTimerMinutes");
    const secondsEl = document.getElementById("mgTimerSeconds");

    drawWheelCanvas(canvas, 350);

    let currentRotationDeg = 0;
    let isSpinning = false;
    let activeDateKey = getTodayKey();

    if (todayDateTag) {
      todayDateTag.textContent = getTodayDisplayString();
    }

    function renderPageQuotaAndReward(claimedReward) {
      const isLogged = Boolean(getAuthToken() && getCurrentUser());

      if (!isLogged) {
        if (quotaBadge) {
          quotaBadge.className = "mg-quota-badge";
          quotaBadge.textContent = "🔑 Đăng nhập để nhận 1 lượt quay hôm nay";
        }
        if (centerBtn) {
          centerBtn.disabled = false;
          centerBtn.innerHTML = `<span>ĐĂNG</span><small>NHẬP</small>`;
        }
        if (spinMainBtn) {
          spinMainBtn.disabled = false;
          spinMainBtn.textContent = "🔑 ĐĂNG NHẬP ĐỂ QUAY (1 LƯỢT/NGÀY)";
        }
        if (rewardBox) {
          rewardBox.innerHTML = `
            <div class="mg-my-voucher-empty">
              <strong>Bạn chưa đăng nhập tài khoản!</strong>
              <p>Mỗi tài khoản thành viên được tặng <b>01 lượt quay miễn phí mỗi ngày</b>. Hãy đăng nhập để quay và lưu Voucher nhé.</p>
            </div>
          `;
        }
        return;
      }

      if (claimedReward) {
        if (quotaBadge) {
          quotaBadge.className = "mg-quota-badge is-used";
          quotaBadge.textContent = "✅ Lượt quay hôm nay: 0 / 1 (Đã sử dụng)";
        }
        if (centerBtn) {
          centerBtn.disabled = true;
          centerBtn.innerHTML = `<span>HẾT</span><small>LƯỢT</small>`;
        }
        if (spinMainBtn) {
          spinMainBtn.disabled = true;
          spinMainBtn.textContent = "✅ BẠN ĐÃ DÙNG LƯỢT QUAY HÔM NAY (0/1)";
        }
        if (footnoteEl) {
          footnoteEl.textContent = "* Lượt quay mới sẽ được cấp lại vào 00:00 đêm nay và toàn bộ voucher ngày cũ sẽ tự động xóa.";
        }
        if (rewardBox) {
          rewardBox.innerHTML = `
            <div class="mg-voucher-ticket">
              <span class="mg-voucher-badge-top">🎉 Đã nhận hôm nay • Tự động xóa lúc 23:59:59</span>
              <h3 class="mg-voucher-title">${claimedReward.title || "Voucher Ưu Đãi Bếp 1979"}</h3>
              <p class="mg-voucher-desc">${claimedReward.desc || "Áp dụng tại Giỏ hàng trước 23:59:59 hôm nay."}</p>
              <div class="mg-voucher-code-row">
                <span class="mg-voucher-code-box">${claimedReward.code}</span>
              </div>
              <div class="mg-voucher-actions">
                <button type="button" class="mg-btn primary" data-mg-use-code="${claimedReward.code}">
                  🛒 Dùng ngay tại Giỏ hàng
                </button>
                <button type="button" class="mg-btn secondary" data-mg-copy-code="${claimedReward.code}">
                  📋 Sao chép mã
                </button>
              </div>
            </div>
          `;
        }
      } else {
        if (quotaBadge) {
          quotaBadge.className = "mg-quota-badge";
          quotaBadge.textContent = "🎁 Lượt quay hôm nay: 1 / 1";
        }
        if (centerBtn) {
          centerBtn.disabled = false;
          centerBtn.innerHTML = `<span>QUAY</span><small>1 LƯỢT</small>`;
        }
        if (spinMainBtn) {
          spinMainBtn.disabled = false;
          spinMainBtn.textContent = "🎰 QUAY NGAY (1 LƯỢT HÔM NAY)";
        }
        if (footnoteEl) {
          footnoteEl.textContent = "* Nếu quay vào ô \"Thêm 1 Lượt\" hoặc \"Quay Lại Nhé\", bạn được quay bù ngay mà không mất lượt!";
        }
        if (rewardBox) {
          rewardBox.innerHTML = `
            <div class="mg-my-voucher-empty">
              <strong>Bạn đang có 01 lượt quay hôm nay!</strong>
              <p>Hãy bấm nút <b>Quay Ngay</b> bên trái để săn Voucher giảm giá. Voucher có hiệu lực đến 23:59:59 hôm nay.</p>
            </div>
          `;
        }
      }
    }

    function updateCountdownTimer() {
      const now = new Date();
      const currentKey = getTodayKey();

      // Nếu đồng hồ bước qua 00:00 sang ngày mới -> Xóa toàn bộ dữ liệu ngày cũ & Reset 1 lượt mới!
      if (currentKey !== activeDateKey) {
        activeDateKey = currentKey;
        purgeExpiredMiniGameLocalStorage();
        if (todayDateTag) todayDateTag.textContent = getTodayDisplayString();
        syncDailyStatusFromServer().then(claimed => {
          renderPageQuotaAndReward(claimed);
        });
        if (typeof window.showSiteToast === "function") {
          window.showSiteToast("Đã bước sang ngày mới! Voucher cũ đã xóa và bạn có 1 lượt quay mới!", "info");
        }
      }

      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      const diffMs = Math.max(0, endOfDay.getTime() - now.getTime());
      const totalSeconds = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      if (hoursEl) hoursEl.textContent = String(hours).padStart(2, "0");
      if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, "0");
      if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, "0");
    }

    updateCountdownTimer();
    setInterval(updateCountdownTimer, 1000);

    async function handleSpinOutcome(slice) {
      if (slice.type === "extra") {
        playGameSound("extra");
        if (centerBtn) {
          centerBtn.disabled = false;
          centerBtn.innerHTML = `<span>QUAY</span><small>TIẾP</small>`;
        }
        if (spinMainBtn) {
          spinMainBtn.disabled = false;
          spinMainBtn.textContent = "🎲 QUAY BÙ NGAY (KHÔNG MẤT LƯỢT)";
        }
        if (rewardBox) {
          rewardBox.innerHTML = `
            <div class="mg-my-voucher-empty">
              <strong>${slice.icon} ${slice.title}</strong>
              <p>${slice.desc}</p>
            </div>
          `;
        }
        if (typeof window.showSiteToast === "function") {
          window.showSiteToast(`${slice.icon} ${slice.title}`, "info");
        }
        return;
      }

      playGameSound("win");
      if (typeof window.triggerConfetti === "function") {
        window.triggerConfetti({ particleCount: 75 });
      }

      if (spinMainBtn) {
        spinMainBtn.disabled = true;
        spinMainBtn.textContent = "⏳ Đang lưu Voucher vào tài khoản...";
      }

      try {
        const reward = await claimRewardFromServer(slice);
        if (!reward) return;
        if (typeof window.showSiteToast === "function") {
          window.showSiteToast(reward.message, "success");
        }
        if (typeof window.startFoodHubNotificationBadges === "function") {
          window.startFoodHubNotificationBadges();
        }
        renderPageQuotaAndReward(reward);
      } catch (err) {
        if (typeof window.showSiteToast === "function") {
          window.showSiteToast(err.message || "Không thể lưu phần thưởng hôm nay", "error");
        }
        const existing = getClaimedRewardToday();
        renderPageQuotaAndReward(existing);
      }
    }

    function startSpin() {
      if (isSpinning) return;

      const token = getAuthToken();
      const user = getCurrentUser();
      if (!token || !user) {
        if (typeof window.showSiteToast === "function") {
          window.showSiteToast("Vui lòng đăng nhập tài khoản để nhận 01 lượt quay miễn phí hôm nay!", "info");
        }
        setTimeout(() => {
          window.location.href = "login.html?redirect=minigame.html";
        }, 550);
        return;
      }

      const claimedToday = getClaimedRewardToday();
      if (claimedToday) {
        renderPageQuotaAndReward(claimedToday);
        if (typeof window.showSiteToast === "function") {
          window.showSiteToast("Hôm nay bạn đã sử dụng 1/1 lượt quay rồi. Hẹn gặp lại bạn vào ngày mai!", "info");
        }
        return;
      }

      isSpinning = true;
      if (centerBtn) centerBtn.disabled = true;
      if (spinMainBtn) {
        spinMainBtn.disabled = true;
        spinMainBtn.textContent = "🎡 Vòng quay đang chạy...";
      }

      const sliceCount = WHEEL_SLICES.length;
      const sliceDeg = 360 / sliceCount;
      const targetIndex = pickWeightedSliceIndex();
      const targetSlice = WHEEL_SLICES[targetIndex];

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
        const eased = 1 - Math.pow(1 - progress, 4);
        const angleNow = startDeg + (finalDeg - startDeg) * eased;

        canvas.style.transform = `rotate(${angleNow}deg)`;

        const currentTickStep = Math.floor(angleNow / sliceDeg);
        if (currentTickStep > lastTickStep) {
          lastTickStep = currentTickStep;
          playGameSound("tick");
          pointer?.classList.add("is-ticking");
          setTimeout(() => pointer?.classList.remove("is-ticking"), 55);
        }

        if (progress < 1) {
          requestAnimationFrame(animateFrame);
        } else {
          currentRotationDeg = finalDeg;
          isSpinning = false;
          handleSpinOutcome(targetSlice);
        }
      }

      requestAnimationFrame(animateFrame);
    }

    centerBtn?.addEventListener("click", startSpin);
    spinMainBtn?.addEventListener("click", startSpin);

    soundBtn?.addEventListener("click", () => {
      isMuted = !isMuted;
      if (soundIcon) soundIcon.textContent = isMuted ? "🔇" : "🔊";
      if (soundText) soundText.textContent = isMuted ? "Âm thanh: Tắt" : "Âm thanh: Bật";
    });

    rewardBox?.addEventListener("click", e => {
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
        sessionStorage.setItem("foodhub_auto_apply_voucher_date", getTodayKey());
        window.location.href = "cart.html";
      }
    });

    renderPageQuotaAndReward(getClaimedRewardToday());
    syncDailyStatusFromServer().then(claimed => {
      renderPageQuotaAndReward(claimed);
    });
  }

  function bootMiniGame() {
    purgeExpiredMiniGameLocalStorage();
    autoApplyPendingVoucherOnCart();

    const hasWheelCanvasOnPage = Boolean(document.getElementById("mgWheelCanvas"));
    if (hasWheelCanvasOnPage || pageName === "minigame.html") {
      const existingWidget = document.getElementById("fhMiniGameWidget");
      if (existingWidget) existingWidget.remove();
      initDedicatedMiniGamePage();
    } else {
      buildFloatingLauncherOnly();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootMiniGame);
  } else {
    bootMiniGame();
  }
})();
