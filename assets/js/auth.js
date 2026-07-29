const API_BASE_URL = window.FOODHUB_CONFIG?.API_BASE_URL || "http://localhost:3000/api";
const AUTH_API = `${API_BASE_URL}/auth`;
const AUTH_TOKEN_KEY = "foodhub_token";
const AUTH_USER_KEY = "foodhub_user";
const GOOGLE_CLIENT_ID = window.FOODHUB_CONFIG?.GOOGLE_CLIENT_ID || "";
const FACEBOOK_APP_ID = window.FOODHUB_CONFIG?.FACEBOOK_APP_ID || "";
const FACEBOOK_SDK_VERSION = "v25.0";

let toastTimer;
let googleTokenClient;
let facebookSdkPromise;

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
  showToast(`${provider} chua duoc cau hinh App ID/Client ID.`, "info");
}

function handleVerificationStep(data, fallbackMessage) {
  showToast(data.message || fallbackMessage, "info");

  if (data.verificationUrl) {
    setTimeout(() => {
      window.location.href = data.verificationUrl;
    }, 900);
    return true;
  }

  return false;
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

function finishLogin(data) {
  sessionStorage.setItem(AUTH_TOKEN_KEY, data.token);
  sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
  showToast("Dang nhap thanh cong. Dang vao FoodHub...", "success");

  setTimeout(() => {
    const redirectUrl = getSafeRedirectUrl();
    sessionStorage.removeItem("foodhub_after_login");
    window.location.href = redirectUrl;
  }, 700);
}

function loadScript(src, id) {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function initFacebookSdk() {
  if (!FACEBOOK_APP_ID) {
    return Promise.reject(new Error("Facebook chua duoc cau hinh App ID."));
  }

  if (window.FB) {
    FB.init({
      appId: FACEBOOK_APP_ID,
      cookie: false,
      xfbml: false,
      status: true,
      version: FACEBOOK_SDK_VERSION
    });
    return Promise.resolve();
  }

  if (!facebookSdkPromise) {
    facebookSdkPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Facebook SDK tai qua lau hoac bi trinh duyet chan."));
      }, 10000);

      window.fbAsyncInit = () => {
        clearTimeout(timeout);
        FB.init({
          appId: FACEBOOK_APP_ID,
          cookie: false,
          xfbml: false,
          status: true,
          version: FACEBOOK_SDK_VERSION
        });
        resolve();
      };

      loadScript("https://connect.facebook.net/vi_VN/sdk.js", "facebook-sdk-script")
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  return facebookSdkPromise;
}

async function postSocialToken(provider, accessToken) {
  const response = await fetch(`${AUTH_API}/${provider}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ accessToken })
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Khong the dang nhap social.");
  }

  finishLogin(data);
}

async function loginWithGoogle() {
  if (!GOOGLE_CLIENT_ID) {
    showComingSoon("Google");
    return;
  }

  try {
    await loadScript("https://accounts.google.com/gsi/client", "google-identity-script");

    if (!googleTokenClient) {
      googleTokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: "openid email profile",
        callback: async response => {
          if (!response.access_token) {
            showToast("Google khong tra ve access token.", "error");
            return;
          }

          try {
            await postSocialToken("google", response.access_token);
          } catch (error) {
            showToast(error.message, "error");
          }
        }
      });
    }

    googleTokenClient.requestAccessToken({ prompt: "select_account" });
  } catch (error) {
    console.error(error);
    showToast("Khong tai duoc Google Login.", "error");
  }
}

async function loginWithFacebook() {
  if (!FACEBOOK_APP_ID) {
    showComingSoon("Facebook");
    return;
  }

  try {
    await initFacebookSdk();

    FB.login(response => {
      handleFacebookResponse(response);
    }, { scope: "public_profile" });
  } catch (error) {
    console.error(error);
    showToast(error.message || "Khong tai duoc Facebook Login.", "error");
  }
}

async function handleFacebookResponse(response) {
  if (!response.authResponse?.accessToken) {
    showToast("Facebook chua cap quyen dang nhap hoac popup da bi dong.", "info");
    return;
  }

  try {
    await postSocialToken("facebook", response.authResponse.accessToken);
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function register(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const fullname = document.getElementById("fullname").value;
  const username = document.getElementById("username").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  setSubmitState(form, true, "Dang tao tai khoan...");

  try {
    const response = await fetch(`${AUTH_API}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, fullname, email, password })
    });
    const data = await response.json();

    if (!response.ok) {
      showToast(data.message || "Khong the dang ky.", "error");
      return;
    }

    if (handleVerificationStep(data, "Dang ky thanh cong. Vui long xac thuc email.")) {
      return;
    }

    showToast(data.message || "Dang ky thanh cong. Hay kiem tra email de xac thuc.", "success");

    setTimeout(() => {
      window.location.href = "login.html";
    }, 1400);
  } catch (error) {
    showToast("Khong ket noi duoc server.", "error");
    console.error(error);
  } finally {
    setSubmitState(form, false);
  }
}

async function login(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const login = document.getElementById("login")?.value || document.getElementById("email")?.value;
  const password = document.getElementById("password").value;

  setSubmitState(form, true, "Dang dang nhap...");

  try {
    const response = await fetch(`${AUTH_API}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ login, password })
    });
    const data = await response.json();

    if (response.status === 403) {
      handleVerificationStep(data, "Email chua xac thuc.");
      return;
    }

    if (!response.ok) {
      showToast(data.message || "Khong the dang nhap.", "error");
      return;
    }

    finishLogin(data);
  } catch (error) {
    showToast("Khong ket noi duoc server.", "error");
    console.error(error);
  } finally {
    setSubmitState(form, false);
  }
}

function initSupportWidget() {
  if (document.getElementById("support-widget")) return;

  const robotIcon = `
    <svg class="support-robot-icon" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <path class="robot-antenna" d="M32 14v-6" />
      <circle class="robot-dot" cx="32" cy="7" r="3" />
      <rect class="robot-face" x="15" y="20" width="34" height="30" rx="12" />
      <circle class="robot-eye" cx="26" cy="34" r="3" />
      <circle class="robot-eye" cx="38" cy="34" r="3" />
      <path class="robot-mouth" d="M27 43h10" />
      <path class="robot-antenna" d="M15 35h-5M54 35h-5" />
    </svg>
  `;

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
      <span>${robotIcon}</span>
    </button>
  `;

  const button = widget.querySelector(".support-toggle");
  button.addEventListener("click", () => {
    const isOpen = widget.classList.toggle("open");
    button.setAttribute("aria-expanded", String(isOpen));
  });

  document.body.appendChild(widget);
}

