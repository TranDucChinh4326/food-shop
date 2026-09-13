function getFoodHubConfig() {
  return window["FOODHUB_CONFIG"] || {};
}

function getSharedApiBase() {
  return getFoodHubConfig().API_BASE_URL || "http://localhost:3000/api";
}

function getWindowFunction(name) {
  const fn = window[name];
  return typeof fn === "function" ? fn : null;
}

function getFoodHubCurrentLanguage() {
  const cookieMatch = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
  if (cookieMatch) {
    const val = decodeURIComponent(cookieMatch[1]).toLowerCase();
    if (val.endsWith("/en")) return "en";
    if (val.endsWith("/vi")) return "vi";
  }
  const saved = localStorage.getItem("foodhub_language");
  if (saved === "en" || saved === "vi") return saved;

  const htmlLang = (document.documentElement.lang || "").toLowerCase();
  if (htmlLang.startsWith("en")) return "en";

  return "vi";
}

function renderSharedHeader() {
  const currentLang = getFoodHubCurrentLanguage();
  const currentCode = currentLang === "en" ? "EN" : "VI";
  const currentTitle = currentLang === "en" ? "Language: English" : "Ngôn ngữ: Tiếng Việt";

  document.querySelectorAll("[data-shared-header]").forEach(slot => {
    slot.outerHTML = `
  <header>
    <div class="header-top">
      <a class="logo brand-logo notranslate" href="index.html" aria-label="Bếp 1979" translate="no">
        <span class="brand-mark" aria-hidden="true">
          <span>79</span>
        </span>
        <span class="brand-copy">
          <strong>Bếp 1979</strong>
          <small>Món ngon mỗi ngày</small>
        </span>
      </a>

      <div class="header-tools">
        <form class="header-search" action="menu.html" role="search" data-header-search-form>
          <div class="header-search-inner">
            <input type="search" name="search" id="headerSearchInput" placeholder="Bạn cần tìm gì?" aria-label="Tìm kiếm món ăn" autocomplete="off" aria-expanded="false" aria-autocomplete="list" aria-controls="headerSearchDropdown">
            <button type="submit" aria-label="Tìm kiếm">⌕</button>
          </div>
          <div id="headerSearchDropdown" class="header-search-dropdown" hidden role="listbox" aria-label="Gợi ý món ăn"></div>
        </form>
        <div class="header-actions-group">
          <div class="language-menu notranslate" data-language-menu translate="no">
            <button type="button" class="top-icon language-toggle notranslate" title="${currentTitle}" aria-label="${currentTitle}" aria-expanded="false" translate="no">
              <span class="language-current-code" data-language-current>${currentCode}</span>
            </button>
            <div class="language-dropdown notranslate" role="menu" translate="no">
              <button type="button" data-lang-code="vi" role="menuitem" class="${currentLang === "vi" ? "active" : ""}">
                <span class="lang-name">Tiếng Việt</span>
                <span class="lang-badge">VI</span>
              </button>
              <button type="button" data-lang-code="en" role="menuitem" class="${currentLang === "en" ? "active" : ""}">
                <span class="lang-name">English</span>
                <span class="lang-badge">EN</span>
              </button>
            </div>
          </div>
          <a href="vouchers.html" class="top-icon voucher-icon" title="Voucher khuyến mãi" aria-label="Voucher khuyến mãi" data-voucher-link>
            <svg class="header-action-svg voucher-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <defs>
                <linearGradient id="fhVoucherGrad" x1="2" y1="4" x2="22" y2="20" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#ff7a28"/>
                  <stop offset="100%" stop-color="#e63e00"/>
                </linearGradient>
              </defs>
              <path d="M3 8.5C4.38 8.5 5.5 7.38 5.5 6V5C5.5 4.45 5.95 4 6.5 4H17.5C18.05 4 18.5 4.45 18.5 5V6C18.5 7.38 19.62 8.5 21 8.5C21.55 8.5 22 8.95 22 9.5V14.5C22 15.05 21.55 15.5 21 15.5C19.62 15.5 18.5 16.62 18.5 18V19C18.5 19.55 18.05 20 17.5 20H6.5C5.95 20 5.5 19.55 5.5 19V18C5.5 16.62 4.38 15.5 3 15.5C2.45 15.5 2 15.05 2 14.5V9.5C2 8.95 2.45 8.5 3 8.5Z" fill="url(#fhVoucherGrad)"/>
              <path d="M9.5 5V19" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" stroke-dasharray="1.8 1.8" opacity="0.85"/>
              <circle cx="14" cy="9.5" r="1.3" fill="#ffffff"/>
              <circle cx="17" cy="14.5" r="1.3" fill="#ffffff"/>
              <path d="M17.5 9L13.5 15" stroke="#ffffff" stroke-width="1.3" stroke-linecap="round"/>
            </svg>
            <strong class="top-icon-badge" data-voucher-unread hidden>0</strong>
          </a>
          <a href="announcements.html" class="top-icon announcement-icon" title="Thông báo" aria-label="Thông báo" data-announcement-link>
            <svg class="header-action-svg bell-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <defs>
                <linearGradient id="fhBellGrad" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#ff9900"/>
                  <stop offset="100%" stop-color="#ea580c"/>
                </linearGradient>
              </defs>
              <g class="bell-body">
                <path d="M12 3C8.69 3 6 5.69 6 9V14.17L4.29 15.88C3.8 16.37 4.15 17.21 4.85 17.21H19.15C19.85 17.21 20.2 16.37 19.71 15.88L18 14.17V9C18 5.69 15.31 3 12 3Z" fill="url(#fhBellGrad)"/>
                <circle cx="12" cy="2.5" r="1.5" fill="url(#fhBellGrad)"/>
                <path d="M9 8.5C9 6.84 10.34 5.5 12 5.5" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" opacity="0.55"/>
              </g>
              <path class="bell-clapper" d="M10 18.5C10 19.6 10.9 20.5 12 20.5C13.1 20.5 14 19.6 14 18.5" stroke="#ea580c" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <strong class="top-icon-badge" data-announcement-unread hidden>0</strong>
          </a>
          <div id="user-area">
            <a href="login.html" class="header-action primary">Đăng nhập</a>
            <a href="register.html" class="header-action secondary">Đăng ký</a>
          </div>
          <a href="cart.html" class="cart-btn" aria-label="Giỏ hàng" data-cart-btn>
            <span class="cart-icon-shell" aria-hidden="true">
              <svg class="cart-custom-icon" viewBox="0 0 24 24" fill="none">
                <g class="cart-steam-group">
                  <path class="steam-line steam-1" d="M8.5 2.5C8.5 2.5 9.2 3.8 8 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                  <path class="steam-line steam-2" d="M12 1.5C12 1.5 12.8 3 11.5 4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                  <path class="steam-line steam-3" d="M15.5 2.5C15.5 2.5 16.2 3.8 15 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                </g>
                <path class="cart-basket-body" d="M2.5 3.5H5.2L7.6 15.2C7.75 16 8.45 16.6 9.3 16.6H18.8C19.65 16.6 20.35 16 20.5 15.2L22 8H5.8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path class="cart-food-spark" d="M13.5 8L14.2 9.8L16 10.5L14.2 11.2L13.5 13L12.8 11.2L11 10.5L12.8 9.8L13.5 8Z"/>
                <circle class="cart-wheel-node" cx="9.5" cy="19.8" r="1.6" fill="currentColor"/>
                <circle class="cart-wheel-node" cx="18" cy="19.8" r="1.6" fill="currentColor"/>
              </svg>
            </span>
            <span class="cart-btn-label">Giỏ hàng</span>
            <span class="cart-count-badge-wrap">
              <strong id="cart-count">0</strong>
              <span class="cart-ambient-pulse" aria-hidden="true"></span>
            </span>
          </a>
        </div>
      </div>
    </div>

    <section class="site-announcements" aria-label="Thông báo Bếp 1979">
      <div class="announcement-shell">
        <div id="publicAnnouncements" class="public-announcements">
          Đang tải thông báo...
        </div>
      </div>
    </section>

    <nav>
      <a href="index.html">Trang chủ</a>
      <div class="nav-dropdown" data-public-category-menu="food">
        <a class="nav-dropdown-toggle" href="menu.html?category=food">Đồ ăn <span aria-hidden="true">▾</span></a>
        <div class="nav-dropdown-panel">
          <a href="menu.html?category=com">Cơm</a>
          <a href="menu.html?category=pho">Phở</a>
          <a href="menu.html?category=mi">Mì</a>
          <a href="menu.html?category=bun">Bún</a>
        </div>
      </div>
      <div class="nav-dropdown" data-public-category-menu="drink">
        <a class="nav-dropdown-toggle" href="menu.html?category=drink">Nước uống <span aria-hidden="true">▾</span></a>
        <div class="nav-dropdown-panel">
          <a href="menu.html?category=tra">Trà</a>
          <a href="menu.html?category=ca-phe">Cà phê</a>
          <a href="menu.html?category=nuoc-ep-sinh-to">Nước ép và sinh tố</a>
          <a href="menu.html?category=nuoc-dong-chai">Nước đóng chai</a>
        </div>
      </div>
      <a href="cart.html">Giỏ hàng</a>
      <a href="track.html">Lịch sử đơn</a>
      <a href="feedback.html">Phản hồi</a>
      <a href="contact.html">Liên hệ</a>
      <a href="vouchers.html">Voucher</a>
    </nav>
  </header>`;
  });
}

function renderSharedFooter() {
  document.querySelectorAll("[data-shared-footer]").forEach(slot => {
    slot.outerHTML = `
  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <a class="footer-logo brand-logo notranslate" href="index.html" aria-label="Bếp 1979" translate="no">
          <span class="brand-mark" aria-hidden="true">
            <span>79</span>
          </span>
          <span class="brand-copy">
            <strong>Bếp 1979</strong>
            <small>Món ngon mỗi ngày</small>
          </span>
        </a>
        <p>Nền tảng giao đồ ăn hiện đại, kết nối khách hàng với thực đơn tươi ngon, thanh toán linh hoạt và theo dõi đơn hàng minh bạch.</p>
        <div class="footer-contact-list">
          <span>Hotline: <a href="tel:03877005477">0387 700 5477</a></span>
          <span>Email: <a href="mailto:tdchinh04@gmail.com">tdchinh04@gmail.com</a></span>
          <span>Giờ phục vụ: 08:00 - 22:00 hằng ngày</span>
        </div>
        <div class="footer-socials" aria-label="Kênh liên hệ Bếp 1979">
          <a href="index.html" aria-label="Website Bếp 1979" title="Website"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"/><path d="M3.6 9h16.8M3.6 15h16.8M12 3c2.2 2.5 3.4 5.5 3.4 9S14.2 18.5 12 21c-2.2-2.5-3.4-5.5-3.4-9S9.8 5.5 12 3Z"/></svg></a>
          <a href="mailto:tdchinh04@gmail.com" aria-label="Email Bếp 1979" title="Email"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16v12H4z"/><path d="m4 7 8 6 8-6"/></svg></a>
          <a href="tel:03877005477" aria-label="Hotline Bếp 1979" title="Hotline"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 4.5 6 6.8c-.7.7-.7 1.8-.2 2.7a25 25 0 0 0 8.7 8.7c.9.5 2 .5 2.7-.2l2.3-2.5-3.7-3-1.8 1.8c-1.9-.9-3.4-2.4-4.3-4.3l1.8-1.8-3-3.7Z"/></svg></a>
        </div>
      </div>
      <div class="footer-links">
        <div>
          <h3>Khám phá</h3>
          <a href="index.html">Trang chủ</a>
          <a href="menu.html">Thực đơn</a>
          <a href="menu.html?category=food">Đồ ăn</a>
          <a href="menu.html?category=drink">Nước uống</a>
        </div>
        <div>
          <h3>Khách hàng</h3>
          <a href="cart.html">Giỏ hàng</a>
          <a href="track.html">Lịch sử đơn</a>
          <a href="profile.html">Hồ sơ cá nhân</a>
          <a href="announcements.html">Thông báo</a>
          <a href="vouchers.html">Voucher</a>
        </div>
        <div>
          <h3>Hỗ trợ</h3>
          <a href="contact.html">Trung tâm hỗ trợ</a>
          <a href="feedback.html">Gửi phản hồi</a>
          <a href="contact.html">Hợp tác cửa hàng</a>
          <a href="contact.html">Liên hệ Bếp 1979</a>
        </div>
        <div>
          <h3>Cam kết</h3>
          <span>Món ăn cập nhật từ hệ thống</span>
          <span>Kiểm tra tồn kho khi đặt hàng</span>
          <span>Theo dõi trạng thái đơn</span>
          <span>Hỗ trợ COD, QR và VNPay</span>
        </div>
      </div>
      <div class="footer-map">
        <div class="footer-map-info">
          <strong>Bếp 1979 Store</strong>
          <a href="https://www.google.com/maps/search/?api=1&query=10.100528,105.686583" target="_blank" rel="noopener">Mở bản đồ lớn</a>
        </div>
        <iframe
          title="Bản đồ Bếp 1979"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          src="https://www.google.com/maps?q=10.100528,105.686583&z=16&output=embed">
        </iframe>
      </div>
      <div class="footer-bottom">
        <p>© 2026 Bếp 1979. All rights reserved.</p>
        <p>Designed by Tran Duc Chinh IT</p>
      </div>
    </div>
  </footer>`;
  });
}

function syncSharedNavActive() {
  const normalizePage = value => {
    const page = String(value || "index")
      .split("/")
      .pop()
      .toLowerCase()
      .replace(/\.html$/, "");
    return page || "index";
  };
  const currentPage = normalizePage(location.pathname);
  const params = new URLSearchParams(location.search);
  const currentCategory = String(params.get("category") || "").toLowerCase();
  const foodCategories = new Set(["food", "com", "pho", "mi", "bun"]);
  const drinkCategories = new Set(["drink", "tra", "ca-phe", "nuoc-ep-sinh-to", "nuoc-dong-chai"]);

  document.querySelectorAll("header nav a, header .header-tools a").forEach(link => {
    const rawHref = link.getAttribute("href") || "";
    const [hrefPage, hrefQuery = ""] = rawHref.split("?");
    const href = normalizePage(hrefPage);
    const hrefParams = new URLSearchParams(hrefQuery);
    const hrefCategory = String(hrefParams.get("category") || "").toLowerCase();
    let isActive = href && href === currentPage;

    if (currentPage === "menu" && href === "menu") {
      if (hrefCategory) {
        isActive = hrefCategory === currentCategory
          || (hrefCategory === "food" && foodCategories.has(currentCategory))
          || (hrefCategory === "drink" && drinkCategories.has(currentCategory));
      } else {
        isActive = !currentCategory;
      }
    }

    if (currentPage === "food-detail" && href === "menu") {
      isActive = true;
    }

    link.classList.toggle("is-active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
      link.closest(".nav-dropdown")?.classList.add("is-active");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  document.querySelectorAll(".nav-dropdown").forEach(dropdown => {
    const hasActiveChild = Boolean(dropdown.querySelector("a.is-active"));
    dropdown.classList.toggle("is-active", hasActiveChild);
  });
}

function startFoodHubPresenceHeartbeat() {
  const token = sessionStorage.getItem("foodhub_token");
  const apiBase = getSharedApiBase();
  if (!token || window["__foodHubPresenceHeartbeatStarted"]) return;

  window["__foodHubPresenceHeartbeatStarted"] = true;
  const pingPresence = () => {
    fetch(`${apiBase}/auth/ping`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      keepalive: true
    }).catch(err => {
      console.warn("Presence ping skipped:", err.message);
    });
  };

  pingPresence();
  window.setInterval(pingPresence, 60000);
}

function startFoodHubRealtime() {
  const token = sessionStorage.getItem("foodhub_token");
  const apiBase = getSharedApiBase();
  const socketBase = apiBase.replace(/\/api\/?$/, "");
  if (!token || window["__foodHubRealtimeStarted"]) return;

  const loadSocketClient = () => new Promise((resolve, reject) => {
    if (window["io"]) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = `${socketBase}/socket.io/socket.io.js`;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  loadSocketClient().then(() => {
    const socketClient = window["io"];
    if (!socketClient || window["__foodHubRealtimeStarted"]) return;
    window["__foodHubRealtimeStarted"] = true;

    const socket = socketClient(socketBase, {
      auth: { token },
      transports: ["websocket", "polling"]
    });

    socket.on("order:created", payload => {
      const loadOrderHistory = getWindowFunction("loadOrderHistory");
      const showSiteToast = getWindowFunction("showSiteToast");
      if (loadOrderHistory && document.getElementById("track-result")) {
        loadOrderHistory({ silent: true });
      }
      if (showSiteToast) {
        showSiteToast(`Đơn hàng #${payload?.order?.id || ""} đã được ghi nhận.`, "info");
      }
    });

    socket.on("order:updated", payload => {
      const loadOrderHistory = getWindowFunction("loadOrderHistory");
      const showSiteToast = getWindowFunction("showSiteToast");
      if (loadOrderHistory && document.getElementById("track-result")) {
        loadOrderHistory({ silent: true });
      }
      if (showSiteToast) {
        showSiteToast(`Đơn hàng #${payload?.order?.id || ""} vừa được cập nhật.`, "info");
      }
    });
  }).catch(err => {
    console.warn("Realtime socket client skipped:", err.message);
  });
}

function startFoodHubNotificationBadges() {
  const token = sessionStorage.getItem("foodhub_token");
  const userRaw = sessionStorage.getItem("foodhub_user");
  const apiBase = getSharedApiBase();
  const isAnnouncementPage = location.pathname.endsWith("/announcements.html") || location.pathname.endsWith("announcements.html");
  const isVoucherPage = location.pathname.endsWith("/vouchers.html") || location.pathname.endsWith("vouchers.html");
  let userId = "guest";

  try {
    const user = JSON.parse(userRaw || "null");
    userId = user?.id ? String(user.id) : "guest";
  } catch (err) {
    userId = "guest";
  }

  const readKey = `foodhub_read_announcements_${userId}`;
  const seenVoucherKey = `foodhub_seen_vouchers_${userId}`;

  const readIds = key => {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch (err) {
      return [];
    }
  };

  const writeIds = (key, ids) => {
    localStorage.setItem(key, JSON.stringify(Array.from(new Set(ids.map(String)))));
  };

  const setBadge = (selector, count) => {
    const badge = document.querySelector(selector);
    if (!badge) return;

    const safeCount = Math.max(0, Number(count || 0));
    const previousCount = Number(badge.textContent || 0);
    badge.hidden = safeCount <= 0;
    badge.textContent = safeCount > 99 ? "99+" : String(safeCount);
    if (safeCount > 0 && safeCount !== previousCount) {
      badge.classList.remove("is-popping");
      void badge.offsetWidth;
      badge.classList.add("is-popping");
    }
  };

  const notifyOnce = (key, message, type = "info") => {
    const marker = `${key}_${new Date().toISOString().slice(0, 10)}`;
    if (sessionStorage.getItem(marker) === "1") return;
    sessionStorage.setItem(marker, "1");

    setTimeout(() => {
      const showSiteToast = getWindowFunction("showSiteToast");
      if (showSiteToast) {
        showSiteToast(message, type);
      }
    }, 450);
  };

  const loadAnnouncementBadge = async () => {
    if (!token) {
      setBadge("[data-announcement-unread]", 0);
      return;
    }

    try {
      const response = await fetch(`${apiBase}/announcements?limit=20`);
      const announcements = await response.json();
      if (!response.ok || !Array.isArray(announcements)) return;

      const ids = announcements.map(item => String(item.id)).filter(Boolean);
      if (isAnnouncementPage) {
        writeIds(readKey, ids);
        setBadge("[data-announcement-unread]", 0);
        return;
      }

      const read = new Set(readIds(readKey));
      const unreadCount = ids.filter(id => !read.has(id)).length;
      setBadge("[data-announcement-unread]", unreadCount);
      if (token && unreadCount > 0) {
        notifyOnce("foodhub_new_announcements", `Bạn có ${unreadCount} thông báo mới.`);
      }
    } catch (err) {
      console.warn("Announcement badge skipped:", err.message);
    }
  };

  const loadVoucherBadge = async () => {
    if (!token) {
      setBadge("[data-voucher-unread]", 0);
      return;
    }

    try {
      const response = await fetch(`${apiBase}/orders/vouchers/available`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const vouchers = await response.json();
      if (!response.ok || !Array.isArray(vouchers)) return;

      const claimableIds = vouchers
        .filter(item => {
          const alreadyClaimed = Number(item.ownedQuantity ?? item.ownedRemaining ?? 0) > 0;
          const unavailable = item.remainingGlobal !== null && Number(item.remainingGlobal || 0) <= 0;
          return !alreadyClaimed && !unavailable;
        })
        .map(item => String(item.id))
        .filter(Boolean);

      if (isVoucherPage) {
        writeIds(seenVoucherKey, claimableIds);
        setBadge("[data-voucher-unread]", 0);
        return;
      }

      const seen = new Set(readIds(seenVoucherKey));
      const unreadCount = claimableIds.filter(id => !seen.has(id)).length;
      setBadge("[data-voucher-unread]", unreadCount);
      if (unreadCount > 0) {
        notifyOnce("foodhub_new_vouchers", `Bạn có ${unreadCount} voucher mới có thể nhận.`);
      }
    } catch (err) {
      console.warn("Voucher badge skipped:", err.message);
    }
  };

  loadAnnouncementBadge();
  loadVoucherBadge();
}

function startFoodHubIdleSessionGuard() {
  const tokenKey = "foodhub_token";
  const userKey = "foodhub_user";
  const cartKey = "foodhub_cart";
  const activityKey = "foodhub_last_activity_at";
  const userPinLockKey = "foodhub_user_pin_locked";
  const idleLimitMs = Number(getFoodHubConfig().USER_PIN_IDLE_LIMIT_MS || 5 * 60 * 1000);
  const token = sessionStorage.getItem(tokenKey);
  const apiBase = getSharedApiBase();
  let failedAttempts = 0;
  let isLocked = sessionStorage.getItem(userPinLockKey) === "1";

  if (!token || window["__foodHubIdleSessionStarted"]) return;

  window["__foodHubIdleSessionStarted"] = true;
  const now = Date.now();
  const lastActivity = Number(sessionStorage.getItem(activityKey) || now);

  const getSessionUser = () => {
    try {
      return JSON.parse(sessionStorage.getItem(userKey) || "null");
    } catch (err) {
      return null;
    }
  };

  const shouldUsePinLock = () => Boolean(getSessionUser()?.hasPin);

  const resetPinOverlayInputs = overlay => {
    if (!overlay) return;
    const input = overlay.querySelector("[data-user-pin-input]");
    const errorEl = overlay.querySelector("[data-user-pin-error]");
    const boxes = overlay.querySelectorAll("[data-pin-box]");
    if (input) input.value = "";
    if (errorEl) errorEl.textContent = "";
    boxes.forEach(box => {
      box.value = "";
    });
  };

  const initPinBoxes = container => {
    const hiddenInput = container.querySelector("[data-pin-hidden]");
    const boxes = Array.from(container.querySelectorAll("[data-pin-box]"));
    if (!hiddenInput || !boxes.length || container.dataset.pinReady === "1") return;

    container.dataset.pinReady = "1";
    const syncHiddenAndAutoSubmit = () => {
      const val = boxes.map(input => input.value).join("");
      hiddenInput.value = val;
      if (val.length === 6 && /^\d{6}$/.test(val)) {
        const form = container.querySelector("[data-user-pin-form]");
        if (form) {
          if (typeof form.requestSubmit === "function") {
            form.requestSubmit();
          } else {
            form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
          }
        }
      }
    };

    boxes.forEach((input, index) => {
      input.addEventListener("input", () => {
        input.value = input.value.replace(/\D/g, "").slice(-1);
        syncHiddenAndAutoSubmit();
        if (input.value && boxes[index + 1]) boxes[index + 1].focus();
      });

      input.addEventListener("keydown", event => {
        if (event.key === "Backspace" && !input.value && boxes[index - 1]) {
          boxes[index - 1].focus();
        }
      });

      input.addEventListener("paste", event => {
        event.preventDefault();
        const digits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, boxes.length);
        digits.split("").forEach((digit, digitIndex) => {
          boxes[digitIndex].value = digit;
        });
        syncHiddenAndAutoSubmit();
        boxes[Math.min(digits.length, boxes.length) - 1]?.focus();
      });
    });
  };

  const clearSession = () => {
    sessionStorage.removeItem(tokenKey);
    sessionStorage.removeItem(userKey);
    sessionStorage.removeItem(cartKey);
    sessionStorage.removeItem(activityKey);
    sessionStorage.removeItem(userPinLockKey);
  };

  const redirectToLogin = () => {
    if (location.pathname.endsWith("/login.html") || location.pathname.endsWith("/register.html")) return;
    sessionStorage.setItem("foodhub_after_login", `${location.pathname.split("/").pop() || "index.html"}${location.search || ""}`);
    window.location.href = "login.html?reason=session-timeout";
  };

  const ensurePinOverlay = () => {
    let overlay = document.querySelector("[data-user-pin-lock]");
    if (overlay) return overlay;

    overlay = document.createElement("div");
    overlay.className = "user-pin-lock";
    overlay.dataset.userPinLock = "true";
    overlay.innerHTML = `
      <form class="user-pin-card" data-user-pin-form>
        <span class="user-pin-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="10" rx="2"></rect><path d="M8 10V7a4 4 0 0 1 8 0v3"></path></svg>
        </span>
        <h2>Nhập mã PIN</h2>
        <p>Tài khoản đã tạm khóa vì không thao tác trong 5 phút.</p>
        <div class="pin-box-row" data-pin-boxes>
          ${Array.from({ length: 6 }, (_, index) => `<input type="password" inputmode="numeric" autocomplete="one-time-code" maxlength="1" aria-label="Số PIN ${index + 1}" data-pin-box>`).join("")}
        </div>
        <input type="hidden" data-user-pin-input data-pin-hidden required>
        <small data-user-pin-error></small>
      </form>
    `;
    document.body.appendChild(overlay);
    initPinBoxes(overlay);

    overlay.querySelector("[data-user-pin-form]").addEventListener("submit", async event => {
      event.preventDefault();
      const input = overlay.querySelector("[data-user-pin-input]");
      const errorEl = overlay.querySelector("[data-user-pin-error]");
      const boxes = overlay.querySelectorAll("[data-pin-box]");
      const pin = input ? input.value.trim() : "";

      if (!/^\d{6}$/.test(pin)) {
        if (errorEl) errorEl.textContent = "Vui lòng nhập đủ 6 số PIN.";
        overlay.querySelector("[data-pin-box]")?.focus();
        return;
      }

      boxes.forEach(b => {
        b.disabled = true;
      });
      if (errorEl) errorEl.textContent = "Đang kiểm tra mã PIN...";

      try {
        const response = await fetch(`${apiBase}/auth/pin/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem(tokenKey) || ""}`
          },
          body: JSON.stringify({ pin })
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          failedAttempts += 1;
          if (failedAttempts >= 3) {
            clearSession();
            redirectToLogin();
            return;
          }
          if (errorEl) {
            errorEl.textContent = data.message || `Mã PIN không đúng. Còn ${3 - failedAttempts} lần thử.`;
          }
          if (input) input.value = "";
          boxes.forEach(box => {
            box.value = "";
          });
          overlay.querySelector("[data-pin-box]")?.focus();
          return;
        }

        failedAttempts = 0;
        isLocked = false;
        sessionStorage.removeItem(userPinLockKey);
        sessionStorage.setItem(activityKey, String(Date.now()));
        resetPinOverlayInputs(overlay);
        overlay.classList.remove("is-visible");
      } catch (err) {
        if (errorEl) errorEl.textContent = "Không thể xác minh mã PIN. Vui lòng thử lại.";
      } finally {
        boxes.forEach(b => {
          b.disabled = false;
        });
      }
    });

    return overlay;
  };

  const lockScreen = () => {
    if (!shouldUsePinLock()) {
      clearSession();
      redirectToLogin();
      return;
    }

    isLocked = true;
    sessionStorage.setItem(userPinLockKey, "1");
    const overlay = ensurePinOverlay();
    resetPinOverlayInputs(overlay);
    overlay.classList.add("is-visible");
    setTimeout(() => overlay.querySelector("[data-pin-box]")?.focus(), 50);
  };

  if (now - lastActivity > idleLimitMs) {
    lockScreen();
    return;
  }

  if (isLocked && shouldUsePinLock()) {
    const overlay = ensurePinOverlay();
    resetPinOverlayInputs(overlay);
    overlay.classList.add("is-visible");
    setTimeout(() => overlay.querySelector("[data-pin-box]")?.focus(), 50);
  } else if (isLocked) {
    clearSession();
    redirectToLogin();
    return;
  }

  let lastMarkActivityAt = 0;
  const markActivity = () => {
    if (isLocked) return;
    const now = Date.now();
    if (now - lastMarkActivityAt < 10000) return;
    lastMarkActivityAt = now;
    sessionStorage.setItem(activityKey, String(now));
  };
  ["click", "keydown", "pointerdown"].forEach(eventName => {
    window.addEventListener(eventName, markActivity, { passive: true });
  });
  markActivity();

  window.setInterval(() => {
    const currentToken = sessionStorage.getItem(tokenKey);
    const latestActivity = Number(sessionStorage.getItem(activityKey) || 0);
    if (currentToken && !isLocked && Date.now() - latestActivity > idleLimitMs) {
      lockScreen();
    }
  }, 60000);
}

function setFoodHubTranslateCookie(lang) {
  const value = lang && lang !== "vi" ? `/vi/${lang}` : "";
  const expires = value ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  const hostParts = window.location.hostname.split(".");
  document.cookie = `googtrans=${value}; path=/${expires}`;
  if (hostParts.length > 1) {
    document.cookie = `googtrans=${value}; path=/; domain=.${hostParts.slice(-2).join(".")}${expires}`;
  }
}

function loadFoodHubTranslateScript() {
  if (document.querySelector("script[data-google-translate]")) return Promise.resolve();
  if (window.google?.translate?.TranslateElement) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const holder = document.createElement("div");
    holder.id = "google_translate_element";
    holder.hidden = true;
    document.body.appendChild(holder);

    window.googleTranslateElementInit = function googleTranslateElementInit() {
      if (!window.google?.translate?.TranslateElement) {
        reject(new Error("Google Translate is unavailable"));
        return;
      }
      new window.google.translate.TranslateElement({
        pageLanguage: "vi",
        includedLanguages: "vi,en",
        autoDisplay: false
      }, "google_translate_element");
      resolve();
    };

    const script = document.createElement("script");
    script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    script.dataset.googleTranslate = "true";
    script.onerror = () => reject(new Error("Cannot load Google Translate"));
    document.head.appendChild(script);
  });
}

let lastSyncedLang = "";
function syncLanguageUI(lang) {
  const currentLang = (lang || getFoodHubCurrentLanguage()).toLowerCase();
  if (currentLang === lastSyncedLang) return;
  lastSyncedLang = currentLang;

  const currentCode = currentLang === "en" ? "EN" : "VI";
  const currentTitle = currentLang === "en" ? "Language: English" : "Ngôn ngữ: Tiếng Việt";

  document.querySelectorAll("[data-language-menu]").forEach(menu => {
    const codeEl = menu.querySelector("[data-language-current]");
    if (codeEl && codeEl.textContent !== currentCode) codeEl.textContent = currentCode;

    const toggle = menu.querySelector(".language-toggle");
    if (toggle) {
      toggle.title = currentTitle;
      toggle.setAttribute("aria-label", currentTitle);
    }

    menu.querySelectorAll("[data-lang-code]").forEach(btn => {
      const isMatch = btn.dataset.langCode === currentLang;
      btn.classList.toggle("active", isMatch);
      btn.setAttribute("aria-selected", String(isMatch));
    });
  });
}

function initLanguageMenu() {
  const menu = document.querySelector("[data-language-menu]");
  if (!menu) return;

  const toggle = menu.querySelector(".language-toggle");
  const closeMenu = () => {
    menu.classList.remove("open");
    toggle?.setAttribute("aria-expanded", "false");
  };

  syncLanguageUI();
  if (getFoodHubCurrentLanguage() !== "vi") {
    loadFoodHubTranslateScript().catch(err => console.warn("Translate load skipped:", err.message));
  }

  toggle?.addEventListener("click", event => {
    event.stopPropagation();
    const isOpen = menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  menu.querySelectorAll("[data-lang-code]").forEach(button => {
    button.addEventListener("click", async () => {
      const lang = button.dataset.langCode || "vi";
      localStorage.setItem("foodhub_language", lang);
      setFoodHubTranslateCookie(lang);
      syncLanguageUI(lang);
      closeMenu();

      if (lang !== "vi") {
        await loadFoodHubTranslateScript().catch(err => console.warn("Translate load skipped:", err.message));
      }

      const teCombo = document.querySelector(".goog-te-combo");
      if (teCombo) {
        teCombo.value = lang;
        teCombo.dispatchEvent(new Event("change"));
      }

      setTimeout(() => {
        window.location.reload();
      }, 100);
    });
  });

  document.addEventListener("click", event => {
    if (!event.target.closest("[data-language-menu]")) closeMenu();
  });
}

function initSharedCartButtonState() {
  try {
    const raw = sessionStorage.getItem("foodhub_cart");
    const cartItems = raw ? JSON.parse(raw) : [];
    const count = Array.isArray(cartItems)
      ? cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
      : 0;

    const countEl = document.getElementById("cart-count");
    const cartBtn = document.querySelector(".cart-btn");
    if (countEl) countEl.textContent = String(count);
    if (cartBtn) {
      cartBtn.classList.toggle("has-items", count > 0);
    }
  } catch (e) {
    // Ignore parse error
  }
}

function initGentleFoodRain() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  // Tôn trọng thiết lập giảm chuyển động của hệ điều hành
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  // Danh sách emoji món ăn hấp dẫn, quen thuộc
  const FOOD_ICONS = [
    "🍕", "🍔", "🍟", "🍜", "🍣", "🍱", "🥟", "🍗",
    "🥪", "🌮", "🍩", "🍰", "🧋", "🥤", "🍦", "🥑",
    "🍓", "🍳", "🍙", "🍤", "🧁", "🥐", "🥞"
  ];

  // Đảm bảo có thẻ style hỗ trợ dự phòng nếu CSS chưa kịp nạp
  if (!document.getElementById("fh-gentle-food-rain-style")) {
    const styleEl = document.createElement("style");
    styleEl.id = "fh-gentle-food-rain-style";
    styleEl.textContent = `
      .fh-gentle-food-rain {
        position: fixed;
        inset: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none !important;
        user-select: none !important;
        -webkit-user-select: none !important;
        overflow: hidden;
        z-index: 9995;
        contain: strict;
        transform: translateZ(0);
      }
      .fh-falling-food-item {
        position: absolute;
        top: -55px;
        left: var(--food-left, 50%);
        font-size: var(--food-size, 24px);
        line-height: 1;
        pointer-events: none !important;
        user-select: none !important;
        -webkit-user-select: none !important;
        will-change: transform, opacity;
        text-shadow: 0 3px 6px rgba(0, 0, 0, 0.12);
        animation: fhGentleFoodFall var(--food-duration, 7s) cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
      }
      @keyframes fhGentleFoodFall {
        0% {
          transform: translate3d(0, 0, 0) rotate(var(--food-rot-start, 0deg));
          opacity: 0;
        }
        12% {
          opacity: var(--food-max-opacity, 0.8);
        }
        50% {
          transform: translate3d(var(--food-sway-x, 20px), 50vh, 0) rotate(calc((var(--food-rot-start, 0deg) + var(--food-rot-end, 0deg)) / 2));
        }
        85% {
          opacity: var(--food-max-opacity, 0.8);
        }
        100% {
          transform: translate3d(calc(var(--food-sway-x, 20px) * -0.5), 105vh, 0) rotate(var(--food-rot-end, 20deg));
          opacity: 0;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .fh-gentle-food-rain {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(styleEl);
  }

  function getRainContainer() {
    let container = document.querySelector(".fh-gentle-food-rain");
    if (!container) {
      container = document.createElement("div");
      container.className = "fh-gentle-food-rain";
      container.setAttribute("aria-hidden", "true");
      document.body.appendChild(container);
    }
    return container;
  }

  let isScrollingNow = false;
  let scrollTimeout = null;
  window.addEventListener("scroll", () => {
    isScrollingNow = true;
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      isScrollingNow = false;
    }, 280);
  }, { passive: true });

  // Thả 1 icon đồ ăn riêng lẻ
  function spawnFoodItem() {
    if (document.hidden || isScrollingNow) return; // Không thả khi chuyển tab hoặc đang cuộn trang
    const container = getRainContainer();
    if (!container) return;

    const item = document.createElement("span");
    item.className = "fh-falling-food-item";

    const randomIcon = FOOD_ICONS[Math.floor(Math.random() * FOOD_ICONS.length)];
    item.textContent = randomIcon;

    // Phân bổ toạ độ ngang ngẫu nhiên trên màn hình (5% - 93%)
    const leftPos = (Math.random() * 88 + 5).toFixed(2);
    // Tốc độ rơi: 5.5s đến 8.5s (chậm rãi, bay bổng êm ái)
    const duration = (Math.random() * 3 + 5.5).toFixed(2);
    // Độ đung đưa ngang do gió (-35px đến +35px)
    const swayX = ((Math.random() - 0.5) * 70).toFixed(0);
    // Góc xoay ngẫu nhiên
    const rotStart = ((Math.random() - 0.5) * 40).toFixed(0);
    const rotEnd = ((Math.random() - 0.5) * 80).toFixed(0);
    // Kích cỡ nhẹ nhàng vừa phải (20px - 28px)
    const size = (Math.random() * 8 + 20).toFixed(0);
    // Độ trong suốt nhẹ (0.7 - 0.85) để không che khuất chữ/nội dung
    const maxOpacity = (Math.random() * 0.15 + 0.7).toFixed(2);

    item.style.setProperty("--food-left", `${leftPos}%`);
    item.style.setProperty("--food-duration", `${duration}s`);
    item.style.setProperty("--food-sway-x", `${swayX}px`);
    item.style.setProperty("--food-rot-start", `${rotStart}deg`);
    item.style.setProperty("--food-rot-end", `${rotEnd}deg`);
    item.style.setProperty("--food-size", `${size}px`);
    item.style.setProperty("--food-max-opacity", maxOpacity);

    // Tự xoá phần tử khỏi DOM ngay khi hoàn thành animation
    const handleEnd = () => {
      item.removeEventListener("animationend", handleEnd);
      if (item.parentNode) {
        item.parentNode.removeChild(item);
      }
    };
    item.addEventListener("animationend", handleEnd);

    // Backup dọn dẹp phòng trường hợp animationend bị gián đoạn
    setTimeout(handleEnd, (parseFloat(duration) + 1.5) * 1000);

    container.appendChild(item);
  }

  // Mỗi đợt chỉ rơi 1 đến 3 cái thưa thớt, không rơi liên tục dồn dập
  function triggerGentleDrop() {
    if (document.hidden) return;

    // 1 đến 3 icon: 20% rơi 1 cái, 65% rơi 2 cái, 15% rơi 3 cái
    const rand = Math.random();
    const count = rand < 0.2 ? 1 : rand < 0.85 ? 2 : 3;

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        spawnFoodItem();
      }, i * (Math.random() * 900 + 400));
    }
  }

  // Lên lịch đợt rơi tiếp theo: 20s đến 38s (thời gian cách nhau dài, lâu lâu mới có)
  function scheduleNextDrop() {
    const nextInterval = Math.floor(Math.random() * 18000) + 20000; // 20s - 38s
    setTimeout(() => {
      triggerGentleDrop();
      scheduleNextDrop();
    }, nextInterval);
  }

  // Đợt đầu tiên xuất hiện sau khoảng 5s khi vào trang
  setTimeout(() => {
    triggerGentleDrop();
    scheduleNextDrop();
  }, 5000);
}

renderSharedHeader();
renderSharedFooter();
syncSharedNavActive();
initLanguageMenu();
initSharedCartButtonState();
startFoodHubNotificationBadges();
startFoodHubRealtime();
startFoodHubIdleSessionGuard();
startFoodHubPresenceHeartbeat();
initGentleFoodRain();


