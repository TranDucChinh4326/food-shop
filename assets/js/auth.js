const API_BASE_URL = window.FOODHUB_CONFIG?.API_BASE_URL || "http://localhost:3000/api";
// File điều khiển đăng nhập/đăng ký frontend.
// Các endpoint auth trả JWT và user; frontend lưu vào sessionStorage để gọi API riêng tư sau đó.
const AUTH_API = `${API_BASE_URL}/auth`;
const AUTH_TOKEN_KEY = "foodhub_token";
const AUTH_USER_KEY = "foodhub_user";
const PENDING_SOCIAL_KEY = "foodhub_pending_social";
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
  showToast(`${provider} chưa được cấu hình App ID/Client ID.`, "info");
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
  // Chỉ cho redirect về cùng origin sau khi đăng nhập.
  // Bước này tránh việc URL redirect bị lợi dụng để chuyển người dùng sang website lạ.
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
  // Hoàn tất đăng nhập ở frontend: lưu token/user, bật gợi ý chat và điều hướng về trang trước đó.
  // Input là response backend gồm token và user đã được publicUser chuẩn hóa.
  if (!data.token || !data.user) {
    showToast(data.message || "Thiếu thong tin đăng nhập.", "error");
    return;
  }

  sessionStorage.setItem(AUTH_TOKEN_KEY, data.token);
  sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
  sessionStorage.setItem("foodhub_show_chat_bubble", "1");
  showToast("Đăng nhập thành công. Đang vào FoodHub...", "success");

  setTimeout(() => {
    const redirectUrl = data.requiresAccountSetup || data.user?.requiresAccountSetup
      ? "profile.html?setup=1"
      : getSafeRedirectUrl();
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
    return Promise.reject(new Error("Facebook chưa được cấu hình App ID."));
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
        reject(new Error("Facebook SDK tải quá lâu hoặc bị trình duyệt chặn."));
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

  if (response.status === 202 && data.requiresAccountSetup) {
    sessionStorage.setItem(PENDING_SOCIAL_KEY, JSON.stringify({
      provider,
      accessToken,
      email: data.providerEmail || "",
      fullname: data.fullname || "",
      avatar: data.avatar || ""
    }));
    showToast(data.message || "Vui lòng hoàn tất tài khoản.", "info");
    setTimeout(() => {
      window.location.href = "register.html?socialSetup=1";
    }, 900);
    return;
  }

  if (!response.ok) {
    throw new Error(data.message || "Không thể đăng nhập social.");
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
            showToast("Google không trả về access token.", "error");
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
    showToast("Không tải được Google Login.", "error");
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
    showToast(error.message || "Không tải được Facebook Login.", "error");
  }
}

async function handleFacebookResponse(response) {
  if (!response.authResponse?.accessToken) {
    showToast("Facebook chưa cấp quyền đăng nhập hoặc popup đã bị đóng.", "info");
    return;
  }

  try {
    await postSocialToken("facebook", response.authResponse.accessToken);
  } catch (error) {
    showToast(error.message, "error");
  }
}

function getRegisterPasswordError(value) {
  const password = String(value || "");
  if (password.length < 8) return "Mật khẩu phải có ít nhất 8 ký tự.";
  if (!/[a-z]/.test(password)) return "Mật khẩu phải có ít nhất 1 chữ thường.";
  if (!/[A-Z]/.test(password)) return "Mật khẩu phải có ít nhất 1 chữ hoa.";
  if (!/\d/.test(password)) return "Mật khẩu phải có ít nhất 1 chữ số.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Mật khẩu phải có ít nhất 1 ký tự đặc biệt.";
  return "";
}

async function register(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const pendingSocial = JSON.parse(sessionStorage.getItem(PENDING_SOCIAL_KEY) || "null");
  const fullname = document.getElementById("fullname").value;
  const username = document.getElementById("username").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const passwordError = getRegisterPasswordError(password);

  if (passwordError) {
    showToast(passwordError, "error");
    document.getElementById("password").focus();
    return;
  }

  if (!pendingSocial?.provider || !pendingSocial?.accessToken) {
    showToast("Vui lòng xác thực bằng Google hoặc Facebook trước.", "error");
    return;
  }

  setSubmitState(form, true, "Đang hoàn tất tài khoản...");

  try {
    const response = await fetch(`${AUTH_API}/social/setup/${pendingSocial.provider}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        accessToken: pendingSocial.accessToken,
        username,
        fullname,
        email,
        password
      })
    });
    const data = await response.json();

    if (!response.ok) {
      showToast(data.message || "Không thể đăng ký.", "error");
      return;
    }

    sessionStorage.removeItem(PENDING_SOCIAL_KEY);
    finishLogin(data);
  } catch (error) {
    showToast("Không kết nối được server.", "error");
    console.error(error);
  } finally {
    setSubmitState(form, false);
  }
}

function initSocialSetupForm() {
  const form = document.querySelector("form[onsubmit='register(event)']");
  if (!form) return;

  const pendingSocial = JSON.parse(sessionStorage.getItem(PENDING_SOCIAL_KEY) || "null");
  const emailInput = document.getElementById("email");
  const fullnameInput = document.getElementById("fullname");

  if (pendingSocial?.email && emailInput) {
    emailInput.value = pendingSocial.email;
    emailInput.readOnly = true;
  }

  if (pendingSocial?.fullname && fullnameInput) {
    fullnameInput.value = pendingSocial.fullname;
  }

  if (!pendingSocial?.provider) {
    form.querySelectorAll("input, button[type='submit']").forEach(element => {
      element.disabled = true;
    });
    showToast("Đăng ký thủ công đã tắt. Hãy chọn Google hoặc Facebook để xác thực trước.", "info");
  }
}

async function login(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const loginValue = document.getElementById("loginIdentifier")?.value || document.getElementById("email")?.value;
  const password = document.getElementById("password").value;

  setSubmitState(form, true, "Đang đăng nhập...");

  try {
    const response = await fetch(`${AUTH_API}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ login: loginValue, password })
    });
    const data = await response.json();

    if (response.status === 403) {
      handleVerificationStep(data, "Email chưa xác thực.");
      return;
    }

    if (!response.ok) {
      showToast(data.message || "Không thể đăng nhập.", "error");
      return;
    }

    finishLogin(data);
  } catch (error) {
    showToast("Không kết nối được server.", "error");
    console.error(error);
  } finally {
    setSubmitState(form, false);
  }
}

async function forgotPassword(event) {
  // Gửi email quên mật khẩu đến backend.
  // Backend trả thông báo chung để tránh lộ email nào đang tồn tại trong hệ thống.
  event.preventDefault();

  const form = event.currentTarget;
  const email = document.getElementById("forgotEmail")?.value.trim();

  if (!email) {
    showToast("Vui lòng nhập email.", "error");
    return;
  }

  setSubmitState(form, true, "Đang gửi...");

  const controller = new AbortController();
  const requestTimeout = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(`${AUTH_API}/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email }),
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      showToast(data.message || "Không thể gửi yêu cầu đặt lại mật khẩu.", "error");
      return;
    }

    showToast(data.message || "Nếu email tồn tại, FoodHub đã gửi hướng dẫn đặt lại mật khẩu.", "success");
    sessionStorage.setItem("foodhub_reset_email", email);
    setTimeout(() => {
      window.location.href = "reset-password.html";
    }, 900);
  } catch (error) {
    showToast(error.name === "AbortError" ? "Gửi OTP quá lâu, vui lòng kiểm tra cấu hình mail hoặc thử lại." : "Không kết nối được server.", "error");
    console.error(error);
  } finally {
    clearTimeout(requestTimeout);
    setSubmitState(form, false);
  }
}

async function resetPassword(event) {
  // Đặt lại mật khẩu bằng email và mã OTP nhận trong email.
  // Frontend kiểm tra format trước, backend vẫn kiểm tra lại OTP và hash password mới.
  event.preventDefault();

  const form = event.currentTarget;
  const email = document.getElementById("resetEmail")?.value.trim() || "";
  const otp = document.getElementById("resetOtp")?.value.trim() || "";
  const password = document.getElementById("resetPassword")?.value || "";
  const confirmPassword = document.getElementById("resetConfirmPassword")?.value || "";

  if (!email) {
    showToast("Vui lòng nhập email.", "error");
    return;
  }

  if (!/^\d{6}$/.test(otp)) {
    showToast("Mã OTP phải gồm 6 chữ số.", "error");
    return;
  }

  const passwordError = getRegisterPasswordError(password);
  if (passwordError) {
    showToast(passwordError, "error");
    return;
  }

  if (password !== confirmPassword) {
    showToast("Mật khẩu xác nhận không khớp.", "error");
    return;
  }

  setSubmitState(form, true, "Đang cập nhật...");

  try {
    const response = await fetch(`${AUTH_API}/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, otp, password, confirmPassword })
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      showToast(data.message || "Không thể đặt lại mật khẩu.", "error");
      return;
    }

    showToast(data.message || "Đặt lại mật khẩu thành công.", "success");
    sessionStorage.removeItem("foodhub_reset_email");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1100);
  } catch (error) {
    showToast("Không kết nối được server.", "error");
    console.error(error);
  } finally {
    setSubmitState(form, false);
  }
}

function initResetPasswordForm() {
  const emailInput = document.getElementById("resetEmail");
  if (!emailInput) return;

  const rememberedEmail = sessionStorage.getItem("foodhub_reset_email") || "";
  if (rememberedEmail && !emailInput.value) {
    emailInput.value = rememberedEmail;
  }
}

function initAuthPasswordToggles() {
  document.querySelectorAll("[data-auth-toggle-password]").forEach(button => {
    button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.authTogglePassword);
      if (!input) return;

      const shouldShow = input.type === "password";
      input.type = shouldShow ? "text" : "password";
      button.textContent = shouldShow ? "\u1ea8n" : "Hi\u1ec7n";
    });
  });
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
    <div class="support-panel" aria-label="Kenh hỗ trợ FoodHub">
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
    <button type="button" class="support-toggle" aria-label="Mo hỗ trợ" aria-expanded="false">
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

initAuthPasswordToggles();
initResetPasswordForm();
initSocialSetupForm();
