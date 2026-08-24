function renderSharedHeader() {
  document.querySelectorAll("[data-shared-header]").forEach(slot => {
    slot.outerHTML = `
  <header>
    <div class="header-top">
      <a class="logo brand-logo" href="index.html" aria-label="FoodHub">
        <span class="brand-mark" aria-hidden="true">
          <span>FH</span>
        </span>
        <span class="brand-copy">
          <strong>FoodHub</strong>
          <small>Fresh delivery</small>
        </span>
      </a>

      <div class="header-tools">
        <form class="header-search" action="menu.html" role="search">
          <input type="search" name="search" placeholder="Bạn cần tìm gì?" aria-label="Tìm kiếm món ăn">
          <button type="submit" aria-label="Tìm kiếm">⌕</button>
        </form>
        <a href="vouchers.html" class="top-icon voucher-icon" title="Voucher" aria-label="Voucher"><span aria-hidden="true">V</span></a>
        <a href="announcements.html" class="top-icon" title="Thông báo" aria-label="Thông báo">🔔</a>
        <div id="user-area">
          <a href="login.html" class="header-action primary">Đăng nhập</a>
          <a href="register.html" class="header-action secondary">Đăng ký</a>
        </div>
        <a href="cart.html" class="cart-btn">🛒 <span>Giỏ hàng</span> <strong id="cart-count">0</strong></a>
      </div>
    </div>

    <section class="site-announcements" aria-label="Thông báo FoodHub">
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
        <a class="nav-dropdown-toggle" href="menu.html?category=drink">Đồ uống <span aria-hidden="true">▾</span></a>
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
        <a class="footer-logo brand-logo" href="index.html" aria-label="FoodHub">
          <span class="brand-mark" aria-hidden="true">
            <span>FH</span>
          </span>
          <span class="brand-copy">
            <strong>FoodHub</strong>
            <small>Fresh delivery</small>
          </span>
        </a>
        <p>Nền tảng giao đồ ăn hiện đại, kết nối khách hàng với thực đơn tươi ngon, thanh toán linh hoạt và theo dõi đơn hàng minh bạch.</p>
        <div class="footer-contact-list">
          <span>Hotline: <a href="tel:0123456789">0123 456 789</a></span>
          <span>Email: <a href="mailto:foodhub@gmail.com">foodhub@gmail.com</a></span>
          <span>Giờ phục vụ: 08:00 - 22:00 hằng ngày</span>
        </div>
        <div class="footer-socials" aria-label="Kênh liên hệ FoodHub">
          <a href="index.html" aria-label="Website FoodHub" title="Website"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"/><path d="M3.6 9h16.8M3.6 15h16.8M12 3c2.2 2.5 3.4 5.5 3.4 9S14.2 18.5 12 21c-2.2-2.5-3.4-5.5-3.4-9S9.8 5.5 12 3Z"/></svg></a>
          <a href="mailto:foodhub@gmail.com" aria-label="Email FoodHub" title="Email"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16v12H4z"/><path d="m4 7 8 6 8-6"/></svg></a>
          <a href="tel:0123456789" aria-label="Hotline FoodHub" title="Hotline"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 4.5 6 6.8c-.7.7-.7 1.8-.2 2.7a25 25 0 0 0 8.7 8.7c.9.5 2 .5 2.7-.2l2.3-2.5-3.7-3-1.8 1.8c-1.9-.9-3.4-2.4-4.3-4.3l1.8-1.8-3-3.7Z"/></svg></a>
        </div>
      </div>
      <div class="footer-links">
        <div>
          <h3>Khám phá</h3>
          <a href="index.html">Trang chủ</a>
          <a href="menu.html">Thực đơn</a>
          <a href="menu.html?category=food">Đồ ăn</a>
          <a href="menu.html?category=drink">Đồ uống</a>
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
          <a href="contact.html">Liên hệ FoodHub</a>
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
          <strong>FoodHub Vinh Long</strong>
          <a href="https://www.google.com/maps/search/?api=1&query=10.2537,105.9722" target="_blank" rel="noopener">Mở bản đồ lớn</a>
        </div>
        <iframe
          title="Bản đồ FoodHub"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          src="https://www.google.com/maps?q=10.2537,105.9722&z=16&output=embed">
        </iframe>
      </div>
      <div class="footer-bottom">
        <p>© 2026 FoodHub Delivery. All rights reserved.</p>
        <p>Designed by Tran Duc Chinh IT</p>
      </div>
    </div>
  </footer>`;
  });
}

function startFoodHubPresenceHeartbeat() {
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

function startFoodHubIdleSessionGuard() {
  const tokenKey = "foodhub_token";
  const userKey = "foodhub_user";
  const cartKey = "foodhub_cart";
  const activityKey = "foodhub_last_activity_at";
  const userPinLockKey = "foodhub_user_pin_locked";
  const idleLimitMs = Number(window.FOODHUB_CONFIG?.USER_PIN_IDLE_LIMIT_MS || 5 * 60 * 1000);
  const token = sessionStorage.getItem(tokenKey);
  const apiBase = window.FOODHUB_CONFIG?.API_BASE_URL || "http://localhost:3000/api";
  let failedAttempts = 0;
  let isLocked = sessionStorage.getItem(userPinLockKey) === "1";

  if (!token || window.__foodHubIdleSessionStarted) return;

  window.__foodHubIdleSessionStarted = true;
  const now = Date.now();
  const lastActivity = Number(sessionStorage.getItem(activityKey) || now);

  const getSessionUser = () => {
    try {
      return JSON.parse(sessionStorage.getItem(userKey) || "null");
    } catch (_) {
      return null;
    }
  };

  const shouldUsePinLock = () => Boolean(getSessionUser()?.hasPin);

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
        <input type="password" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="Mã PIN" data-user-pin-input required>
        <small data-user-pin-error></small>
        <button type="submit">Mở khóa</button>
      </form>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector("[data-user-pin-form]").addEventListener("submit", async event => {
      event.preventDefault();
      const input = overlay.querySelector("[data-user-pin-input]");
      const error = overlay.querySelector("[data-user-pin-error]");
      const button = overlay.querySelector("button");
      const pin = input.value.trim();

      if (!pin) return;

      button.disabled = true;
      error.textContent = "";

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
          error.textContent = data.message || `Mã PIN không đúng. Còn ${3 - failedAttempts} lần thử.`;
          input.value = "";
          input.focus();
          return;
        }

        failedAttempts = 0;
        isLocked = false;
        sessionStorage.removeItem(userPinLockKey);
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
    if (!shouldUsePinLock()) {
      clearSession();
      redirectToLogin();
      return;
    }

    isLocked = true;
    sessionStorage.setItem(userPinLockKey, "1");
    const overlay = ensurePinOverlay();
    overlay.classList.add("is-visible");
    setTimeout(() => overlay.querySelector("[data-user-pin-input]")?.focus(), 50);
  };

  if (now - lastActivity > idleLimitMs) {
    lockScreen();
    return;
  }

  if (isLocked && shouldUsePinLock()) {
    const overlay = ensurePinOverlay();
    overlay.classList.add("is-visible");
    setTimeout(() => overlay.querySelector("[data-user-pin-input]")?.focus(), 50);
  } else if (isLocked) {
    clearSession();
    redirectToLogin();
    return;
  }

  const markActivity = () => {
    if (isLocked) return;
    sessionStorage.setItem(activityKey, String(Date.now()));
  };
  ["click", "keydown", "mousemove", "scroll", "touchstart"].forEach(eventName => {
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

renderSharedHeader();
renderSharedFooter();
startFoodHubIdleSessionGuard();
startFoodHubPresenceHeartbeat();
