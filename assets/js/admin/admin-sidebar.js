// Thiết lập theme ngay lập tức chống chớp sáng cho Admin (Zero-FOUC)
(function() {
  try {
    const saved = localStorage.getItem("foodhub_theme");
    const theme = (saved === "dark" || saved === "light")
      ? saved
      : (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
  } catch (_) {}
})();

const ADMIN_SIDEBAR_COLLAPSED_KEY = "foodhub_admin_sidebar_collapsed";
// Điều khiển sidebar dùng chung cho các trang admin.
// File này render icon, đồng bộ tên admin và lưu trạng thái thu gọn/mở menu theo session.
const ADMIN_MOBILE_QUERY = "(max-width: 1100px)";

const ADMIN_ICONS = {
  menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14"/></svg>',
  home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 11 8-7 8 7"/><path d="M6.5 10.5V20h11v-9.5"/><path d="M10 20v-5h4v5"/></svg>',
  orders: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h11v14H7z"/><path d="M4 8h3M4 12h3M4 16h3"/><path d="M10 9h5M10 13h5"/></svg>',
  categories: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6.5h14"/><path d="M5 12h14"/><path d="M5 17.5h14"/><path d="M7.5 4.5v4"/><path d="M16.5 10v4"/><path d="M11 15.5v4"/></svg>',
  delivery: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h11v10H3z"/><path d="M14 11h3l3 3v3h-6z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>',
  utensils: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4v6M6 4v6M10 4v6"/><path d="M6 10h4l-2 10"/><path d="M16 4v16"/><path d="M16 4c1.9 1.5 3 3.3 3 5.8 0 2.1-1.1 3.7-3 4.7"/></svg>',
  account: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5.5 20c1.1-3.4 3.3-5 6.5-5s5.4 1.6 6.5 5"/></svg>',
  bell: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10a5 5 0 0 1 10 0v4l2 3H5l2-3z"/><path d="M10 20h4"/></svg>',
  ad: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10h4l8-4v12l-8-4H4z"/><path d="M8 14l1.4 5H12l-1.2-5"/><path d="M19 10.5c.8.5 1.3 1.3 1.3 2.3s-.5 1.8-1.3 2.3"/></svg>',
  ticket: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4Z"/><path d="M9 9h.01M15 15h.01M16 8l-8 8"/></svg>',
  audit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8a8 8 0 1 1 1.7 10.6"/><path d="M5 8V4"/><path d="M5 8h4"/><path d="M12 8v5l3 2"/></svg>',
  feedback: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v10H8l-3 3z"/><path d="M8 9h8M8 12h5"/></svg>',
  stats: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19V5"/><path d="M5 19h14"/><path d="M9 16v-5"/><path d="M13 16V8"/><path d="M17 16v-3"/></svg>',
  dot: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/></svg>',
  logout: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 6H6v12h4"/><path d="M14 8l4 4-4 4"/><path d="M8 12h10"/></svg>'
};

function renderAdminChildNavigation() {
  const page = location.pathname.split("/").pop().toLowerCase().replace(/\.html$/, "");
  const activeSection = page === "admin-food"
    ? "foods"
    : page === "admin-account"
      ? "accounts"
      : page === "admin-announcement"
        ? "announcements"
        : "";
  const nav = document.querySelector(".admin-nav");

  if (!nav || !activeSection) return;

  const active = section => section === activeSection ? " active" : "";
  const open = sections => sections.includes(activeSection) ? " is-open" : "";
  const expanded = sections => sections.includes(activeSection) ? "true" : "false";

  nav.innerHTML = `
    <a class="admin-nav-btn${active("overview")}" href="admin.html?section=overview"><span class="nav-icon" data-icon="home" aria-hidden="true"></span><span class="nav-text">Tổng quan</span></a>
    <a class="admin-nav-btn${active("orders")}" href="admin.html?section=orders"><span class="nav-icon" data-icon="orders" aria-hidden="true"></span><span class="nav-text">Đơn hàng</span></a>
    <a class="admin-nav-btn${active("categories")}" href="admin.html?section=categories"><span class="nav-icon" data-icon="categories" aria-hidden="true"></span><span class="nav-text">Quản lý danh mục</span></a>
    <div class="admin-nav-group${open(["foods"])}">
      <button class="admin-nav-btn admin-nav-toggle${active("foods")}" type="button" aria-expanded="${expanded(["foods"])}"><span class="nav-icon" data-icon="utensils" aria-hidden="true"></span><span class="nav-text">Quản lý món ăn</span></button>
      <div class="admin-subnav"><a href="admin.html?section=foods&foodCategory=all"><span class="nav-icon" data-icon="dot" aria-hidden="true"></span><span class="nav-text">Danh sách món</span></a></div>
    </div>
    <a class="admin-nav-btn${active("combos")}" href="admin.html?section=combos"><span class="nav-icon" data-icon="ticket" aria-hidden="true"></span><span class="nav-text">Combo món ăn</span></a>
    <a class="admin-nav-btn${active("inventory")}" href="admin.html?section=inventory"><span class="nav-icon" data-icon="categories" aria-hidden="true"></span><span class="nav-text">Quản lý kho</span></a>
    <div class="admin-nav-group${open(["accounts"])}">
      <button class="admin-nav-btn admin-nav-toggle${active("accounts")}" type="button" aria-expanded="${expanded(["accounts"])}"><span class="nav-icon" data-icon="account" aria-hidden="true"></span><span class="nav-text">Tài khoản</span></button>
      <div class="admin-subnav">
        <a href="admin.html?section=accounts&accountType=staff"><span class="nav-icon" data-icon="dot" aria-hidden="true"></span><span class="nav-text">Nhân viên</span></a>
        <a href="admin.html?section=accounts&accountType=customers"><span class="nav-icon" data-icon="dot" aria-hidden="true"></span><span class="nav-text">Khách hàng</span></a>
      </div>
    </div>
    <div class="admin-nav-group${open(["announcements"])}">
      <button class="admin-nav-btn admin-nav-toggle${active("announcements")}" type="button" aria-expanded="${expanded(["announcements"])}"><span class="nav-icon" data-icon="bell" aria-hidden="true"></span><span class="nav-text">Quản lý tin tức</span></button>
      <div class="admin-subnav">
        <a href="admin.html?section=announcements"><span class="nav-icon" data-icon="dot" aria-hidden="true"></span><span class="nav-text">Thông báo</span></a>
        <a href="admin.html?section=advertisements"><span class="nav-icon" data-icon="dot" aria-hidden="true"></span><span class="nav-text">Quảng cáo</span></a>
      </div>
    </div>
    <div class="admin-nav-group">
      <button class="admin-nav-btn admin-nav-toggle" type="button" aria-expanded="false"><span class="nav-icon" data-icon="ticket" aria-hidden="true"></span><span class="nav-text">Quản lý khuyến mãi</span></button>
      <div class="admin-subnav">
        <a href="admin.html?section=flash-sales"><span class="nav-icon" data-icon="dot" aria-hidden="true"></span><span class="nav-text">Flash sale</span></a>
        <a href="admin.html?section=discounts"><span class="nav-icon" data-icon="dot" aria-hidden="true"></span><span class="nav-text">Mã giảm giá</span></a>
      </div>
    </div>
    <a class="admin-nav-btn" href="admin.html?section=shipping"><span class="nav-icon" data-icon="delivery" aria-hidden="true"></span><span class="nav-text">Phí vận chuyển</span></a>
    <a class="admin-nav-btn" href="admin.html?section=audit-logs"><span class="nav-icon" data-icon="audit" aria-hidden="true"></span><span class="nav-text">Nhật ký</span></a>
    <div class="admin-nav-group">
      <button class="admin-nav-btn admin-nav-toggle" type="button" aria-expanded="false"><span class="nav-icon" data-icon="feedback" aria-hidden="true"></span><span class="nav-text">Chăm sóc khách hàng</span></button>
      <div class="admin-subnav">
        <a href="admin.html?section=feedback"><span class="nav-icon" data-icon="dot" aria-hidden="true"></span><span class="nav-text">Phản hồi</span></a>
        <a href="admin.html?section=food-reviews"><span class="nav-icon" data-icon="dot" aria-hidden="true"></span><span class="nav-text">Bình luận món</span></a>
      </div>
    </div>
  `;

  nav.querySelectorAll(".admin-nav-toggle").forEach(button => {
    button.addEventListener("click", () => {
      const group = button.closest(".admin-nav-group");
      const willOpen = !group.classList.contains("is-open");
      group.classList.toggle("is-open", willOpen);
      button.setAttribute("aria-expanded", String(willOpen));
    });
  });
}

function renderAdminIcons() {
  // Gắn SVG icon vào các phần tử có data-icon.
  // HTML admin chỉ cần khai báo tên icon, còn SVG được quản lý tập trung tại đây.
  document.querySelectorAll("[data-icon]").forEach(icon => {
    const name = icon.getAttribute("data-icon");
    if (ADMIN_ICONS[name]) icon.innerHTML = ADMIN_ICONS[name];
  });

  const toggle = document.querySelector("[data-sidebar-toggle]");
  if (toggle) toggle.innerHTML = ADMIN_ICONS.menu;
}

function syncAdminUserName() {
  let user = null;

  try {
    user = JSON.parse(sessionStorage.getItem("foodhub_user") || "null");
  } catch (_) {
    user = null;
  }

  const name = user?.fullname || user?.name || user?.email || "admin";
  document.querySelectorAll("[data-admin-user-name]").forEach(el => {
    el.textContent = name;
  });
}

function initAdminThemeToggle() {
  const actions = document.querySelector(".admin-page-actions");
  if (!actions) return;

  const getTheme = () => {
    const s = localStorage.getItem("foodhub_theme");
    if (s === "dark" || s === "light") return s;
    return (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
  };

  const applyTheme = (t) => {
    const norm = t === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", norm);
    const btns = document.querySelectorAll("[data-theme-toggle]");
    btns.forEach(b => {
      const tip = norm === "dark" ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối";
      b.title = tip;
      b.setAttribute("aria-label", tip);
    });
  };

  if (!actions.querySelector("[data-theme-toggle]")) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "admin-top-icon theme-toggle notranslate";
    btn.setAttribute("data-theme-toggle", "");
    btn.title = "Chuyển chế độ sáng / tối";
    btn.setAttribute("aria-label", "Chuyển chế độ sáng / tối");
    btn.innerHTML = `
      <svg class="theme-icon theme-icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
      <svg class="theme-icon theme-icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
    `;
    const userMenu = actions.querySelector(".admin-user-menu");
    if (userMenu) {
      actions.insertBefore(btn, userMenu);
    } else {
      actions.appendChild(btn);
    }
  }

  applyTheme(getTheme());

  if (!window["__adminThemeToggleBound"]) {
    window["__adminThemeToggleBound"] = true;
    document.addEventListener("click", e => {
      const b = e.target.closest("[data-theme-toggle]");
      if (b) {
        e.preventDefault();
        const curr = document.documentElement.getAttribute("data-theme") || getTheme();
        const nxt = curr === "dark" ? "light" : "dark";
        localStorage.setItem("foodhub_theme", nxt);
        applyTheme(nxt);
      }
    });
  }
}

function initAdminSidebar() {
  // Khởi tạo sidebar desktop/mobile.
  // Desktop lưu trạng thái collapsed; mobile dùng backdrop và phím Escape để đóng menu.
  const sidebar = document.querySelector(".admin-sidebar");
  const toggle = document.querySelector("[data-sidebar-toggle]");

  renderAdminChildNavigation();
  renderAdminIcons();
  syncAdminUserName();
  initAdminThemeToggle();

  if (!sidebar || !toggle) return;

  const media = window.matchMedia(ADMIN_MOBILE_QUERY);
  let backdrop = document.querySelector(".admin-mobile-backdrop");

  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.className = "admin-mobile-backdrop";
    document.body.appendChild(backdrop);
  }

  const closeMobileMenu = () => {
    document.body.classList.remove("sidebar-mobile-open", "admin-menu-lock");
    toggle.setAttribute("aria-expanded", "false");
  };

  const openMobileMenu = () => {
    document.body.classList.add("sidebar-mobile-open", "admin-menu-lock");
    toggle.setAttribute("aria-expanded", "true");
  };

  const setCollapsed = collapsed => {
    if (media.matches) return;
    document.body.classList.toggle("sidebar-collapsed", collapsed);
    toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
    sessionStorage.setItem(ADMIN_SIDEBAR_COLLAPSED_KEY, collapsed ? "1" : "0");
  };

  const syncMode = () => {
    if (media.matches) {
      document.body.classList.remove("sidebar-collapsed");
      closeMobileMenu();
      return;
    }

    closeMobileMenu();
    setCollapsed(sessionStorage.getItem(ADMIN_SIDEBAR_COLLAPSED_KEY) === "1");
  };

  syncMode();

  toggle.addEventListener("click", () => {
    if (media.matches) {
      if (document.body.classList.contains("sidebar-mobile-open")) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
      return;
    }

    setCollapsed(!document.body.classList.contains("sidebar-collapsed"));
  });

  backdrop.addEventListener("click", closeMobileMenu);

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeMobileMenu();
  });

  sidebar.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      if (media.matches) closeMobileMenu();
    });
  });

  if (typeof media.addEventListener === "function") {
    media.addEventListener("change", syncMode);
  } else if (typeof media.addListener === "function") {
    media.addListener(syncMode);
  }
}

function startAdminPresenceHeartbeat() {
  const token = sessionStorage.getItem("foodhub_token");
  const apiBase = window.FOODHUB_CONFIG?.API_BASE_URL || "http://localhost:3000/api";
  if (!token || window.__foodHubPresenceHeartbeatStarted) return;

  window.__foodHubPresenceHeartbeatStarted = true;
  const pingPresence = () => {
    fetch(`${apiBase}/auth/ping`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      keepalive: true
    }).catch(() => {});
  };

  pingPresence();
  window.setInterval(pingPresence, 60000);
}

function startAdminRealtime() {
  const token = sessionStorage.getItem("foodhub_token");
  const apiBase = window.FOODHUB_CONFIG?.API_BASE_URL || "http://localhost:3000/api";
  const socketBase = apiBase.replace(/\/api\/?$/, "");
  if (!token || window.__foodHubAdminRealtimeStarted) return;

  const isSectionActive = section => (
    document.querySelector(`[data-admin-section="${section}"]`)?.classList.contains("active")
  );

  const loadSocketClient = () => new Promise((resolve, reject) => {
    if (window.io) {
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
    if (!window.io || window.__foodHubAdminRealtimeStarted) return;
    window.__foodHubAdminRealtimeStarted = true;

    const socket = window.io(socketBase, {
      auth: { token },
      transports: ["websocket", "polling"]
    });

    const refreshOrders = () => {
      if (isSectionActive("orders") && typeof window.loadOrders === "function") window.loadOrders();
      if (isSectionActive("overview") && typeof window.loadStats === "function") window.loadStats();
    };

    socket.on("order:created", payload => {
      refreshOrders();
      if (typeof window.showAdminToast === "function") {
        window.showAdminToast(`Có đơn hàng mới #${payload?.order?.id || ""}`, "info");
      }
    });

    socket.on("order:updated", payload => {
      refreshOrders();
      if (typeof window.showAdminToast === "function") {
        window.showAdminToast(`Đơn hàng #${payload?.order?.id || ""} vừa cập nhật`, "info");
      }
    });
  }).catch(() => {});
}

function startAdminOrderAutoRefresh() {
  if (window.__foodHubAdminOrderAutoRefreshStarted) return;

  window.__foodHubAdminOrderAutoRefreshStarted = true;
  const isOrdersSectionActive = () => (
    document.querySelector('[data-admin-section="orders"]')?.classList.contains("active")
  );
  const refresh = () => {
    if (document.hidden || !isOrdersSectionActive()) return;
    if (typeof window.loadOrders === "function") window.loadOrders();
  };

  window.setInterval(refresh, 12000);
  window.addEventListener("focus", refresh);
}

function startAdminIdleSessionGuard() {
  const tokenKey = "foodhub_token";
  const userKey = "foodhub_user";
  const cartKey = "foodhub_cart";
  const activityKey = "foodhub_last_activity_at";
  const lockKey = "foodhub_admin_pin_locked";
  const apiBase = window.FOODHUB_CONFIG?.API_BASE_URL || "http://localhost:3000/api";
  const idleLimitMs = Number(window.FOODHUB_CONFIG?.ADMIN_PIN_IDLE_LIMIT_MS || 5 * 60 * 1000);
  const token = sessionStorage.getItem(tokenKey);
  let failedAttempts = 0;
  let isLocked = sessionStorage.getItem(lockKey) === "1";

  if (!token || window.__foodHubIdleSessionStarted) return;

  window.__foodHubIdleSessionStarted = true;
  const now = Date.now();
  const lastActivity = Number(sessionStorage.getItem(activityKey) || now);

  const clearSession = () => {
    sessionStorage.removeItem(tokenKey);
    sessionStorage.removeItem(userKey);
    sessionStorage.removeItem(cartKey);
    sessionStorage.removeItem(activityKey);
    sessionStorage.removeItem(lockKey);
  };

  const redirectToLogin = () => {
    sessionStorage.setItem("foodhub_after_login", `${location.pathname.split("/").pop() || "admin.html"}${location.search || ""}`);
    window.location.href = "login.html?reason=session-timeout";
  };

  let lastMarkActivityAt = 0;
  const markActivity = () => {
    if (isLocked) return;
    const now = Date.now();
    if (now - lastMarkActivityAt < 10000) return;
    lastMarkActivityAt = now;
    sessionStorage.setItem(activityKey, String(now));
  };

  const initPinBoxes = container => {
    const hiddenInput = container.querySelector("[data-admin-pin-input]");
    const boxes = Array.from(container.querySelectorAll("[data-admin-pin-box]"));
    if (!hiddenInput || !boxes.length || container.dataset.pinReady === "1") return;

    container.dataset.pinReady = "1";
    const syncHidden = () => {
      hiddenInput.value = boxes.map(input => input.value).join("");
    };

    boxes.forEach((input, index) => {
      input.addEventListener("input", () => {
        input.value = input.value.replace(/\D/g, "").slice(-1);
        syncHidden();
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
        syncHidden();
        boxes[Math.min(digits.length, boxes.length) - 1]?.focus();
      });
    });
  };

  const ensurePinOverlay = () => {
    let overlay = document.querySelector("[data-admin-pin-lock]");
    if (overlay) return overlay;

    overlay = document.createElement("div");
    overlay.className = "admin-pin-lock";
    overlay.dataset.adminPinLock = "true";
    overlay.innerHTML = `
      <form class="admin-pin-card" data-admin-pin-form>
        <span class="admin-pin-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="10" rx="2"></rect><path d="M8 10V7a4 4 0 0 1 8 0v3"></path></svg>
        </span>
        <h2>Nhập mã PIN quản trị</h2>
        <p>Màn hình đã khóa do không thao tác trong 5 phút.</p>
        <div class="admin-pin-box-row" data-admin-pin-boxes>
          ${Array.from({ length: 6 }, (_, index) => `<input type="password" inputmode="numeric" autocomplete="one-time-code" maxlength="1" aria-label="Số PIN ${index + 1}" data-admin-pin-box>`).join("")}
        </div>
        <input type="hidden" data-admin-pin-input required>
        <small data-admin-pin-error></small>
        <button type="submit">Mở khóa</button>
      </form>
    `;
    document.body.appendChild(overlay);
    initPinBoxes(overlay);

    overlay.querySelector("[data-admin-pin-form]").addEventListener("submit", async event => {
      event.preventDefault();
      const input = overlay.querySelector("[data-admin-pin-input]");
      const error = overlay.querySelector("[data-admin-pin-error]");
      const button = overlay.querySelector("button");
      const pin = input.value.trim();

      if (!/^\d{6}$/.test(pin)) {
        error.textContent = "Vui lòng nhập đủ 6 số PIN.";
        overlay.querySelector("[data-admin-pin-box]")?.focus();
        return;
      }

      button.disabled = true;
      error.textContent = "";

      try {
        const response = await fetch(`${apiBase}/auth/admin-pin/verify`, {
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
          error.textContent = data.message || `Mã PIN không đúng. Còn ${3 - failedAttempts} lần thử.`;
          input.value = "";
          overlay.querySelectorAll("[data-admin-pin-box]").forEach(box => {
            box.value = "";
          });
          overlay.querySelector("[data-admin-pin-box]")?.focus();
          return;
        }

        failedAttempts = 0;
        isLocked = false;
        sessionStorage.removeItem(lockKey);
        sessionStorage.setItem(activityKey, String(Date.now()));
        overlay.classList.remove("is-visible");
      } catch (_) {
        error.textContent = "Không thể xác minh mã PIN. Vui lòng thử lại.";
      } finally {
        button.disabled = false;
      }
    });

    return overlay;
  };

  const lockScreen = () => {
    if (isLocked) return;
    isLocked = true;
    failedAttempts = 0;
    sessionStorage.setItem(lockKey, "1");
    const overlay = ensurePinOverlay();
    overlay.classList.add("is-visible");
    setTimeout(() => overlay.querySelector("[data-admin-pin-box]")?.focus(), 50);
  };

  const unlockIfNeededOnLoad = () => {
    if (!isLocked) return;
    const overlay = ensurePinOverlay();
    overlay.classList.add("is-visible");
    setTimeout(() => overlay.querySelector("[data-admin-pin-box]")?.focus(), 50);
  };

  if (now - lastActivity > idleLimitMs) lockScreen();

  ["click", "keydown", "pointerdown"].forEach(eventName => {
    window.addEventListener(eventName, markActivity, { passive: true });
  });
  if (!isLocked) markActivity();
  unlockIfNeededOnLoad();

  window.setInterval(() => {
    const currentToken = sessionStorage.getItem(tokenKey);
    const latestActivity = Number(sessionStorage.getItem(activityKey) || 0);
    if (currentToken && !isLocked && Date.now() - latestActivity > idleLimitMs) lockScreen();
  }, 15000);
}

initAdminSidebar();
startAdminIdleSessionGuard();
startAdminPresenceHeartbeat();
startAdminRealtime();
startAdminOrderAutoRefresh();
