const API_BASE_URL = window.FOODHUB_CONFIG?.API_BASE_URL || "http://localhost:3000/api";
const AUTH_API = `${API_BASE_URL}/auth`;
const AUTH_TOKEN_KEY = "foodhub_token";
const AUTH_USER_KEY = "foodhub_user";

let toastTimer;

localStorage.removeItem(AUTH_TOKEN_KEY);
localStorage.removeItem(AUTH_USER_KEY);

function showToast(message, type = "info") {
  const toast = document.getElementById("toast");

  if (!toast) return;

  clearTimeout(toastTimer);
  toast.className = `toast ${type} show`;
  toast.textContent = message;

  toastTimer = setTimeout(() => {
    toast.className = `toast ${type}`;
  }, 3200);
}

function showComingSoon(provider) {
  showToast(`Đăng nhập bằng ${provider} sẽ được hỗ trợ ở phiên bản sau.`, "info");
}

function setSubmitState(form, isLoading, loadingText) {
  const button = form.querySelector("button[type='submit']");

  if (!button) return;

  if (!button.dataset.defaultText) {
    button.dataset.defaultText = button.textContent;
  }

  button.disabled = isLoading;
  button.textContent = isLoading ? loadingText : button.dataset.defaultText;
}

function getSafeRedirectUrl() {
  const params = new URLSearchParams(window.location.search);
  const redirectUrl = params.get("redirect") || sessionStorage.getItem("foodhub_after_login") || "index.html";

  try {
    const url = new URL(redirectUrl, window.location.origin);
    return url.origin === window.location.origin ? `${url.pathname}${url.search}${url.hash}` : "index.html";
  } catch (error) {
    return "index.html";
  }
}

async function register(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const fullname = document.getElementById("fullname").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  setSubmitState(form, true, "Đang tạo tài khoản...");

  try {
    const response = await fetch(`${AUTH_API}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ fullname, email, password })
    });
    const data = await response.json();

    if (!response.ok) {
      showToast(data.message || "Không thể đăng ký.", "error");
      return;
    }

    showToast("Đăng ký thành công. Đang chuyển sang đăng nhập...", "success");

    setTimeout(() => {
      window.location.href = "login.html";
    }, 900);
  } catch (error) {
    showToast("Không kết nối được server.", "error");
    console.error(error);
  } finally {
    setSubmitState(form, false);
  }
}

async function login(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  setSubmitState(form, true, "Đang đăng nhập...");

  try {
    const response = await fetch(`${AUTH_API}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();

    if (!response.ok) {
      showToast(data.message || "Không thể đăng nhập.", "error");
      return;
    }

    sessionStorage.setItem(AUTH_TOKEN_KEY, data.token);
    sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));

    showToast("Đăng nhập thành công. Đang vào FoodHub...", "success");

    setTimeout(() => {
      const redirectUrl = getSafeRedirectUrl();
      sessionStorage.removeItem("foodhub_after_login");
      window.location.href = redirectUrl;
    }, 700);
  } catch (error) {
    showToast("Không kết nối được server.", "error");
    console.error(error);
  } finally {
    setSubmitState(form, false);
  }
}

function initSupportWidget() {
  if (document.getElementById("support-widget")) return;

  const widget = document.createElement("div");
  widget.id = "support-widget";
  widget.className = "support-widget";
  widget.innerHTML = `
    <div class="support-panel" aria-label="Kenh ho tro FoodHub">
      <a href="https://zalo.me/" target="_blank" rel="noopener" class="support-link zalo">
        <span>Z</span>
        <strong>Zalo</strong>
      </a>
      <a href="https://m.me/" target="_blank" rel="noopener" class="support-link messenger">
        <span>f</span>
        <strong>Messenger</strong>
      </a>
      <a href="tel:0123456789" class="support-link phone">
        <span>☎</span>
        <strong>Hotline</strong>
      </a>
      <a href="mailto:foodhub@gmail.com" class="support-link email">
        <span>@</span>
        <strong>Email</strong>
      </a>
    </div>
    <button type="button" class="support-toggle" aria-label="Mo ho tro" aria-expanded="false">
      <span>?</span>
      Ho tro
    </button>
  `;

  const button = widget.querySelector(".support-toggle");
  button.addEventListener("click", () => {
    const isOpen = widget.classList.toggle("open");
    button.setAttribute("aria-expanded", String(isOpen));
  });

  document.body.appendChild(widget);
}

initSupportWidget();
