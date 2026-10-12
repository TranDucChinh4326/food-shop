// Cấu hình runtime cho frontend Bếp 1979.
// Các file JS đọc FOODHUB_CONFIG để biết backend API và ID đăng nhập mạng xã hội đang dùng.
window.FOODHUB_CONFIG = {
  API_BASE_URL: "https://food-backend-xrb9.onrender.com/api",
  GOOGLE_CLIENT_ID: "1035084433038-7ab68das8hl0s2b2mgv4b27b9k00enmi.apps.googleusercontent.com",
  FACEBOOK_APP_ID: "1385223216785892",
  ADMIN_PIN_IDLE_LIMIT_MS: 5 * 60 * 1000,
  USER_PIN_IDLE_LIMIT_MS: 5 * 60 * 1000,
  ADMIN_LOGOUT_IDLE_LIMIT_MS: 15 * 60 * 1000,
  SESSION_LOGOUT_IDLE_LIMIT_MS: 15 * 60 * 1000,
  ADMIN_TOKEN_MAX_AGE_MS: 2 * 60 * 60 * 1000,
  USER_TOKEN_MAX_AGE_MS: 12 * 60 * 60 * 1000
};

// Chia sẻ đúng một phiên web giữa các tab trong cùng trình duyệt.
for (const key of ["foodhub_token", "foodhub_user"]) {
  const legacyValue = sessionStorage.getItem(key);
  if (!localStorage.getItem(key) && legacyValue) {
    localStorage.setItem(key, legacyValue);
  }
  sessionStorage.removeItem(key);
}

function readFoodHubTokenPayload(token) {
  try {
    const part = String(token || "").split(".")[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch (_) {
    return null;
  }
}

function isFoodHubTokenExpired(token) {
  const payload = readFoodHubTokenPayload(token);
  if (!payload) return true;

  const now = Date.now();
  if (payload.exp && Number(payload.exp) * 1000 <= now) {
    return true;
  }

  const role = String(payload.role || "").toUpperCase();
  const maxAgeMs = role && role !== "USER"
    ? Number(window.FOODHUB_CONFIG?.ADMIN_TOKEN_MAX_AGE_MS || 2 * 60 * 60 * 1000)
    : Number(window.FOODHUB_CONFIG?.USER_TOKEN_MAX_AGE_MS || 12 * 60 * 60 * 1000);

  if (payload.iat && now - Number(payload.iat) * 1000 >= maxAgeMs) {
    return true;
  }

  return false;
}

function clearFoodHubSessionStorage() {
  const activityKey = "foodhub_last_activity_at";
  localStorage.removeItem("foodhub_token");
  localStorage.removeItem("foodhub_user");
  localStorage.removeItem("foodhub_cart");
  localStorage.removeItem(activityKey);
  localStorage.removeItem("foodhub_user_pin_locked");
  sessionStorage.removeItem(activityKey);
  sessionStorage.removeItem("foodhub_admin_pin_locked");
}

function enforceFoodHubSessionExpiryOnStartup() {
  const token = localStorage.getItem("foodhub_token");
  if (!token) return false;

  const payload = readFoodHubTokenPayload(token);
  const now = Date.now();
  const tokenIssuedAtMs = Number(payload?.iat || 0) * 1000;
  const storedActivity = Number(localStorage.getItem("foodhub_last_activity_at") || 0);
  // Nếu không có mốc hoạt động hoặc mốc cũ hơn lúc cấp token, lấy đúng thời điểm cấp token (iat), tuyệt đối không lấy Date.now().
  const effectiveLastActivity = storedActivity >= tokenIssuedAtMs ? storedActivity : tokenIssuedAtMs;
  const logoutLimitMs = Number(window.FOODHUB_CONFIG?.SESSION_LOGOUT_IDLE_LIMIT_MS || 15 * 60 * 1000);

  const isExpired = isFoodHubTokenExpired(token);
  const isIdleTooLong = !effectiveLastActivity || (now - effectiveLastActivity > logoutLimitMs);

  if (!isExpired && !isIdleTooLong) {
    if (!storedActivity || storedActivity < tokenIssuedAtMs) {
      localStorage.setItem("foodhub_last_activity_at", String(effectiveLastActivity));
    }
    return false;
  }

  clearFoodHubSessionStorage();

  const page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  const isProtectedPage = page.startsWith("admin") || page === "profile.html";
  if (isProtectedPage && page !== "login.html" && page !== "register.html") {
    const returnTarget = `${location.pathname.split("/").pop() || "index.html"}${location.search || ""}`;
    sessionStorage.setItem("foodhub_after_login", returnTarget);
    localStorage.setItem("foodhub_after_login", returnTarget);
    window.location.replace("login.html?reason=session-timeout");
  }
  return true;
}

// Chạy kiểm tra ngay lập tức trước khi các script giao diện đọc localStorage
enforceFoodHubSessionExpiryOnStartup();

window.addEventListener("storage", event => {
  if (event.key === "foodhub_token" && event.oldValue !== event.newValue) {
    window.location.reload();
  }
});

function startWebSessionMonitor() {
  const tokenKey = "foodhub_token";
  const page = location.pathname.split("/").pop() || "index.html";
  if (page === "login.html" || page === "register.html") return;

  let checking = false;
  const checkSession = async () => {
    const currentToken = localStorage.getItem(tokenKey);
    if (!currentToken) return;

    if (enforceFoodHubSessionExpiryOnStartup()) {
      window.location.reload();
      return;
    }

    if (checking || document.hidden) return;
    checking = true;
    try {
      const response = await fetch(`${window.FOODHUB_CONFIG.API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
          "X-Client-Type": "web"
        },
        cache: "no-store"
      });
      if (response.status !== 401) return;

      const data = await response.json().catch(() => ({}));
      const reason = data.code === "SESSION_REPLACED"
        ? "session-replaced"
        : "session-invalid";
      clearFoodHubSessionStorage();
      window.location.replace(`login.html?reason=${reason}`);
    } catch (error) {
      // Mất mạng tạm thời không được tự đăng xuất người dùng.
    } finally {
      checking = false;
    }
  };

  checkSession();
  window.setInterval(checkSession, 15000);
  window.addEventListener("focus", checkSession);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) checkSession();
  });
}

function disableBrowserInputSuggestions(root = document) {
  const ignoredTypes = new Set(["button", "checkbox", "file", "hidden", "image", "radio", "reset", "submit"]);

  root.querySelectorAll?.("form").forEach(form => {
    form.setAttribute("autocomplete", "off");
  });

  root.querySelectorAll?.("input, textarea, select").forEach(field => {
    const type = String(field.getAttribute("type") || "").toLowerCase();
    if (ignoredTypes.has(type)) return;

    field.setAttribute("autocomplete", "off");
    field.setAttribute("autocorrect", "off");
    field.setAttribute("autocapitalize", "none");
    field.setAttribute("spellcheck", "false");
  });
}

function initBrowserInputSuggestionGuard() {
  disableBrowserInputSuggestions();

  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          disableBrowserInputSuggestions(node);
        }
      });
    });
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initBrowserInputSuggestionGuard();
    startWebSessionMonitor();
  });
} else {
  initBrowserInputSuggestionGuard();
  startWebSessionMonitor();
}
