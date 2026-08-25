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

let googleTokenClient;
let facebookSdkPromise;

localStorage.removeItem(AUTH_TOKEN_KEY);
localStorage.removeItem(AUTH_USER_KEY);

function showToast(message, type = "info") {
  let stack = document.getElementById("authToastStack");

  if (!stack) {
    stack = document.createElement("div");
    stack.id = "authToastStack";
    stack.className = "toast-stack auth-toast-stack";
    document.body.appendChild(stack);
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${escapeHtml(message)}</span>
    <i aria-hidden="true"></i>
  `;
  stack.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("show"));

  setTimeout(() => {
    toast.classList.add("hide");
    setTimeout(() => toast.remove(), 280);
  }, 3600);
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getAuthLoadingOverlay() {
  let overlay = document.getElementById("authLoadingOverlay");
  if (overlay) return overlay;

  overlay = document.createElement("div");
  overlay.id = "authLoadingOverlay";
  overlay.className = "auth-loading-overlay";
  overlay.setAttribute("role", "status");
  overlay.setAttribute("aria-live", "polite");
  overlay.innerHTML = `
    <div class="auth-loading-card">
      <span class="auth-loading-spinner" aria-hidden="true"></span>
      <strong>Đang xử lý</strong>
      <small>FoodHub đang kiểm tra thông tin đăng nhập...</small>
    </div>
  `;
  document.body.appendChild(overlay);
  return overlay;
}

function showAuthLoading(message = "FoodHub đang kiểm tra thông tin đăng nhập...") {
  const overlay = getAuthLoadingOverlay();
  const text = overlay.querySelector("small");
  if (text) text.textContent = message;
  requestAnimationFrame(() => overlay.classList.add("show"));
}

function hideAuthLoading() {
  document.getElementById("authLoadingOverlay")?.classList.remove("show");
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
  sessionStorage.setItem("foodhub_last_activity_at", String(Date.now()));
  sessionStorage.setItem("foodhub_show_chat_bubble", "1");
  showAuthLoading("Đăng nhập thành công. Đang chuyển vào FoodHub...");
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
  const fullnameInput = form.querySelector("[name='fullname'], #fullname, #registerFullname");
  const usernameInput = form.querySelector("[name='username'], #username, #registerUsername");
  const emailInput = form.querySelector("[name='email'], #email, #registerEmail");
  const passwordInput = form.querySelector("[name='password'], #password, #registerPassword");
  const fullname = fullnameInput?.value || "";
  const username = usernameInput?.value || "";
  const email = emailInput?.value || "";
  const password = passwordInput?.value || "";
  const passwordError = getRegisterPasswordError(password);

  if (passwordError) {
    showToast(passwordError, "error");
    passwordInput?.focus();
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
  const emailInput = form.querySelector("[name='email'], #email, #registerEmail");
  const fullnameInput = form.querySelector("[name='fullname'], #fullname, #registerFullname");

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
    const shell = document.querySelector("[data-auth-shell]");
    if (shell && shell.classList.contains("login-active")) return;
    showToast("Đăng ký thủ công đã tắt. Hãy chọn Google hoặc Facebook để xác thực trước.", "info");
  }
}

async function login(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const loginValue = form.querySelector("[name='loginIdentifier'], #loginIdentifier, #email")?.value || "";
  const password = form.querySelector("[name='password'], #password, #loginPassword")?.value || "";

  showAuthLoading("Đang kiểm tra thông tin đăng nhập...");
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
      hideAuthLoading();
      handleVerificationStep(data, "Email chưa xác thực.");
      return;
    }

    if (!response.ok) {
      hideAuthLoading();
      showToast(data.message || "Không thể đăng nhập.", "error");
      return;
    }

    finishLogin(data);
  } catch (error) {
    hideAuthLoading();
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
      hideAuthLoading();
      showToast(data.message || "Không thể gửi yêu cầu đặt lại mật khẩu.", "error");
      return;
    }

    showToast(data.message || "Nếu email tồn tại, FoodHub đã gửi hướng dẫn đặt lại mật khẩu.", "success");
    sessionStorage.setItem("foodhub_reset_email", email);
    setTimeout(() => {
      window.location.href = "reset-password.html";
    }, 900);
  } catch (error) {
    hideAuthLoading();
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
  const eyeIcon = `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  `;
  const eyeOffIcon = `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M3 3l18 18"></path>
      <path d="M10.7 5.2A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a17.5 17.5 0 0 1-3.1 4"></path>
      <path d="M6.1 6.8A17.6 17.6 0 0 0 2 12s3.5 7 10 7a10.8 10.8 0 0 0 3.9-.7"></path>
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"></path>
    </svg>
  `;

  document.querySelectorAll("[data-auth-toggle-password]").forEach(button => {
    button.innerHTML = eyeIcon;

    button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.authTogglePassword);
      if (!input) return;

      const shouldShow = input.type === "password";
      input.type = shouldShow ? "text" : "password";
      button.innerHTML = shouldShow ? eyeOffIcon : eyeIcon;
      button.setAttribute("aria-label", shouldShow ? "\u1ea8n m\u1eadt kh\u1ea9u" : "Hi\u1ec7n m\u1eadt kh\u1ea9u");
    });
  });
}

function initAuthSlider() {
  const shell = document.querySelector("[data-auth-shell]");
  if (!shell) return;

  const setView = view => {
    const isRegister = view === "register";
    shell.classList.toggle("register-active", isRegister);
    shell.classList.toggle("login-active", !isRegister);

    if (isRegister && !JSON.parse(sessionStorage.getItem(PENDING_SOCIAL_KEY) || "null")?.provider) {
      showToast("Vui lòng xác thực bằng Google hoặc Facebook trước.", "info");
    }

    const target = isRegister ? "register.html" : "login.html";
    const title = isRegister ? "\u0110\u0103ng k\u00fd - FoodHub" : "\u0110\u0103ng nh\u1eadp - FoodHub";
    if (!window.location.pathname.endsWith(target)) {
      window.history.replaceState(null, title, target);
      document.title = title;
    }
  };

  shell.querySelectorAll("[data-auth-view]").forEach(button => {
    button.addEventListener("click", () => setView(button.dataset.authView));
  });
}

function initSupportWidget() {
  if (document.getElementById("support-widget")) return;

  const robotIcon = `
    <svg class="support-robot-icon" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true">
      <defs>
        <linearGradient id="fhAuthBotHatGrad" x1="30" y1="10" x2="70" y2="35" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="100%" stop-color="#ffebe1"/>
        </linearGradient>
        <linearGradient id="fhAuthBotFaceShell" x1="20" y1="30" x2="80" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="100%" stop-color="#fff2ea"/>
        </linearGradient>
        <linearGradient id="fhAuthBotEarGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#ff7f3e"/>
          <stop offset="100%" stop-color="#ea3607"/>
        </linearGradient>
        <linearGradient id="fhAuthBotScreenGrad" x1="25" y1="40" x2="75" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#241a17"/>
          <stop offset="100%" stop-color="#140d0b"/>
        </linearGradient>
        <linearGradient id="fhAuthBotEyeCyan" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#56ccf2"/>
          <stop offset="100%" stop-color="#2f80ed"/>
        </linearGradient>
      </defs>

      <!-- Headphone Band -->
      <path class="bot-headphone-band" d="M22 52 C22 28, 78 28, 78 52" stroke="url(#fhAuthBotEarGrad)" stroke-width="4.5" stroke-linecap="round" fill="none"/>

      <!-- Chef Hat -->
      <g class="bot-chef-hat">
        <path d="M38 25 C34 16, 44 11, 50 14 C56 11, 66 16, 62 25 Z" fill="url(#fhAuthBotHatGrad)" stroke="#f6ded2" stroke-width="1.5"/>
        <path d="M36 24.5 Q50 26.5 64 24.5 L63 29.5 Q50 31.5 37 29.5 Z" fill="url(#fhAuthBotEarGrad)"/>
        <circle cx="50" cy="27.5" r="1.5" fill="#ffffff"/>
      </g>

      <!-- Headphone Ears -->
      <rect class="bot-ear bot-ear-left" x="13" y="47" width="9" height="22" rx="4.5" fill="url(#fhAuthBotEarGrad)"/>
      <rect class="bot-ear bot-ear-right" x="78" y="47" width="9" height="22" rx="4.5" fill="url(#fhAuthBotEarGrad)"/>

      <!-- Robot Head Outer Shell -->
      <rect class="bot-head-shell" x="19" y="34" width="62" height="49" rx="22" fill="url(#fhAuthBotFaceShell)" stroke="#fcd9c8" stroke-width="2"/>

      <!-- Dark Glossy Screen -->
      <rect class="bot-face-screen" x="26" y="42" width="48" height="33" rx="14" fill="url(#fhAuthBotScreenGrad)"/>

      <!-- Glowing Smiling Eyes -->
      <g class="bot-eyes">
        <ellipse class="bot-eye bot-eye-left" cx="39" cy="55.5" rx="5" ry="6" fill="url(#fhAuthBotEyeCyan)"/>
        <ellipse class="bot-eye bot-eye-right" cx="61" cy="55.5" rx="5" ry="6" fill="url(#fhAuthBotEyeCyan)"/>
        <circle cx="41" cy="53" r="1.8" fill="#ffffff"/>
        <circle cx="37.5" cy="57.5" r="0.9" fill="#ffffff"/>
        <circle cx="63" cy="53" r="1.8" fill="#ffffff"/>
        <circle cx="59.5" cy="57.5" r="0.9" fill="#ffffff"/>
      </g>

      <!-- Smile -->
      <path class="bot-mouth" d="M43.5 64.5 Q50 71 56.5 64.5" stroke="#ff9f43" stroke-width="2.6" stroke-linecap="round" fill="none"/>

      <!-- Rosy Cheeks -->
      <ellipse class="bot-blush" cx="32" cy="62.5" rx="3.2" ry="2" fill="#ff6b6b" opacity="0.5"/>
      <ellipse class="bot-blush" cx="68" cy="62.5" rx="3.2" ry="2" fill="#ff6b6b" opacity="0.5"/>
    </svg>
  `;

  const widget = document.createElement("div");
  widget.id = "support-widget";
  widget.className = "support-widget";
  widget.innerHTML = `
    <div class="support-panel" aria-label="Kênh hỗ trợ FoodHub">
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
    <button type="button" class="support-toggle" aria-label="Mở hỗ trợ" aria-expanded="false" title="Liên hệ hỗ trợ FoodHub">
      <span class="support-toggle-icon" aria-hidden="true">${robotIcon}</span>
      <span class="bot-online-badge" aria-hidden="true" title="Trực tuyến 24/7"></span>
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
initAuthSlider();
initResetPasswordForm();
initSocialSetupForm();
