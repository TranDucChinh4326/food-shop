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
  toast.title = "Bấm để đóng";
  toast.innerHTML = `
    <span>${escapeHtml(message)}</span>
    <span class="site-toast-progress" aria-hidden="true"></span>
  `;

  let dismissTimer = null;
  const startTimer = (ms = 3600) => {
    clearTimeout(dismissTimer);
    dismissTimer = setTimeout(() => {
      toast.classList.add("hide");
      setTimeout(() => toast.remove(), 280);
    }, ms);
  };

  toast.addEventListener("mouseenter", () => clearTimeout(dismissTimer));
  toast.addEventListener("mouseleave", () => startTimer(1500));
  toast.addEventListener("click", () => {
    clearTimeout(dismissTimer);
    toast.classList.add("hide");
    setTimeout(() => toast.remove(), 200);
  });

  stack.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  startTimer(3600);
}

function shakeInputElement(input) {
  const el = typeof input === "string" ? document.getElementById(input) || document.querySelector(input) : input;
  if (!el) return;
  el.classList.remove("input-error-shake");
  void el.offsetWidth;
  el.classList.add("input-error-shake");
  setTimeout(() => el.classList.remove("input-error-shake"), 450);
  el.focus();
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
      <small>Bếp 1979 đang kiểm tra thông tin đăng nhập...</small>
    </div>
  `;
  document.body.appendChild(overlay);
  return overlay;
}

function showAuthLoading(message = "Bếp 1979 đang kiểm tra thông tin đăng nhập...") {
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
    showToast(data.message || "Thiếu thông tin đăng nhập.", "error");
    return;
  }

  sessionStorage.setItem(AUTH_TOKEN_KEY, data.token);
  sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
  sessionStorage.setItem("foodhub_last_activity_at", String(Date.now()));
  sessionStorage.setItem("foodhub_show_chat_bubble", "1");
  showAuthLoading("Đăng nhập thành công. Đang chuyển vào Bếp 1979...");
  showToast("Đăng nhập thành công. Đang vào Bếp 1979...", "success");

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

function evaluatePasswordCriteria(password) {
  const pwd = String(password || "");
  const criteria = {
    length: pwd.length >= 8,
    lowercase: /[a-z]/.test(pwd),
    uppercase: /[A-Z]/.test(pwd),
    number: /\d/.test(pwd),
    special: /[^A-Za-z0-9]/.test(pwd)
  };

  const validCount = Object.values(criteria).filter(Boolean).length;
  let strength = "empty";
  let strengthLabel = "Chưa nhập";
  let barLevel = "empty";

  if (pwd.length > 0) {
    if (validCount <= 2) {
      strength = "weak";
      strengthLabel = "Yếu";
      barLevel = "weak";
    } else if (validCount === 3) {
      strength = "medium";
      strengthLabel = "Trung bình";
      barLevel = "medium-1";
    } else if (validCount === 4) {
      strength = "medium";
      strengthLabel = "Khá mạnh";
      barLevel = "medium-2";
    } else {
      strength = "strong";
      strengthLabel = "Mạnh";
      barLevel = "strong";
    }
  }

  return { criteria, validCount, strength, strengthLabel, barLevel };
}

function updatePasswordStrengthUI(input, wrap) {
  if (!input || !wrap) return;

  const result = evaluatePasswordCriteria(input.value);

  // Cập nhật từng dòng điều kiện
  Object.entries(result.criteria).forEach(([key, isValid]) => {
    const item = wrap.querySelector(`[data-criterion="${key}"]`);
    if (item) {
      item.classList.toggle("is-valid", isValid);
    }
  });

  // Cập nhật thanh tiến trình
  const bars = wrap.querySelector("[data-strength-bars]");
  if (bars) {
    bars.setAttribute("data-strength", result.barLevel);
  }

  // Cập nhật nhãn trạng thái
  const status = wrap.querySelector("[data-strength-status]");
  if (status) {
    status.textContent = result.strengthLabel;
    status.setAttribute("data-state", result.strength);
  }
}

function initPasswordStrengthCheckers() {
  const wraps = document.querySelectorAll("[data-password-strength-for]");
  wraps.forEach(wrap => {
    const inputId = wrap.dataset.passwordStrengthFor;
    const input = document.getElementById(inputId);
    if (!input) return;

    const updateVisibility = () => {
      const isFocused = document.activeElement === input;
      const hasValue = Boolean(input.value && input.value.length > 0);
      wrap.classList.toggle("show", isFocused || hasValue);
    };

    input.addEventListener("focus", updateVisibility);
    input.addEventListener("blur", updateVisibility);

    input.addEventListener("input", () => {
      updatePasswordStrengthUI(input, wrap);
      updateVisibility();
    });

    updatePasswordStrengthUI(input, wrap);
    updateVisibility();
  });
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
      shakeInputElement(form.querySelector("[name='password'], #password, #loginPassword"));
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

    showToast(data.message || "Nếu email tồn tại, Bếp 1979 đã gửi hướng dẫn đặt lại mật khẩu.", "success");
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
      button.setAttribute("aria-label", shouldShow ? "Ẩn mật khẩu" : "Hiện mật khẩu");
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
    const title = isRegister ? "Đăng ký - Bếp 1979" : "Đăng nhập - Bếp 1979";
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
        <linearGradient id="fhAuthBotHatGrad" x1="30" y1="5" x2="70" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="100%" stop-color="#ffebe1"/>
        </linearGradient>
        <linearGradient id="fhAuthBotFaceShell" x1="20" y1="22" x2="80" y2="82" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="100%" stop-color="#fff2ea"/>
        </linearGradient>
        <linearGradient id="fhAuthBotEarGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#ff7f3e"/>
          <stop offset="100%" stop-color="#ea3607"/>
        </linearGradient>
        <linearGradient id="fhAuthBotScreenGrad" x1="25" y1="32" x2="75" y2="72" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#241a17"/>
          <stop offset="100%" stop-color="#140d0b"/>
        </linearGradient>
        <linearGradient id="fhAuthBotEyeCyan" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#56ccf2"/>
          <stop offset="100%" stop-color="#2f80ed"/>
        </linearGradient>
      </defs>

      <!-- Headphone Band -->
      <path class="bot-headphone-band" d="M22 45 C22 21, 78 21, 78 45" stroke="url(#fhAuthBotEarGrad)" stroke-width="4.5" stroke-linecap="round" fill="none"/>

      <!-- Chef Hat -->
      <g class="bot-chef-hat">
        <path d="M38 18 C34 9, 44 4, 50 7 C56 4, 66 9, 62 18 Z" fill="url(#fhAuthBotHatGrad)" stroke="#f6ded2" stroke-width="1.5"/>
        <path d="M36 17.5 Q50 19.5 64 17.5 L63 22.5 Q50 24.5 37 22.5 Z" fill="url(#fhAuthBotEarGrad)"/>
        <circle cx="50" cy="20.5" r="1.5" fill="#ffffff"/>
      </g>

      <!-- Headphone Ears -->
      <rect class="bot-ear bot-ear-left" x="13" y="40" width="9" height="22" rx="4.5" fill="url(#fhAuthBotEarGrad)"/>
      <rect class="bot-ear bot-ear-right" x="78" y="40" width="9" height="22" rx="4.5" fill="url(#fhAuthBotEarGrad)"/>

      <!-- Robot Head Outer Shell (Visual Center at Y=50) -->
      <rect class="bot-head-shell" x="19" y="27" width="62" height="49" rx="22" fill="url(#fhAuthBotFaceShell)" stroke="#fcd9c8" stroke-width="2"/>

      <!-- Dark Glossy Screen -->
      <rect class="bot-face-screen" x="26" y="35" width="48" height="33" rx="14" fill="url(#fhAuthBotScreenGrad)"/>

      <!-- Glowing Smiling Eyes -->
      <g class="bot-eyes">
        <ellipse class="bot-eye bot-eye-left" cx="39" cy="48.5" rx="5" ry="6" fill="url(#fhAuthBotEyeCyan)"/>
        <ellipse class="bot-eye bot-eye-right" cx="61" cy="48.5" rx="5" ry="6" fill="url(#fhAuthBotEyeCyan)"/>
        <circle cx="41" cy="46" r="1.8" fill="#ffffff"/>
        <circle cx="37.5" cy="50.5" r="0.9" fill="#ffffff"/>
        <circle cx="63" cy="46" r="1.8" fill="#ffffff"/>
        <circle cx="59.5" cy="50.5" r="0.9" fill="#ffffff"/>
      </g>

      <!-- Smile -->
      <path class="bot-mouth" d="M43.5 57.5 Q50 64 56.5 57.5" stroke="#ff9f43" stroke-width="2.6" stroke-linecap="round" fill="none"/>

      <!-- Rosy Cheeks -->
      <ellipse class="bot-blush" cx="32" cy="55.5" rx="3.2" ry="2" fill="#ff6b6b" opacity="0.5"/>
      <ellipse class="bot-blush" cx="68" cy="55.5" rx="3.2" ry="2" fill="#ff6b6b" opacity="0.5"/>
    </svg>
  `;

  const widget = document.createElement("div");
  widget.id = "support-widget";
  widget.className = "support-widget";
  widget.innerHTML = `
    <div class="support-panel" aria-label="Kênh hỗ trợ Bếp 1979">
      <a href="https://zalo.me/0387700547" target="_blank" rel="noopener noreferrer" class="support-link zalo">
        <span>Z</span>
        <strong>Zalo</strong>
      </a>
      <a href="https://m.me/" target="_blank" rel="noopener" class="support-link messenger">
        <span>f</span>
        <strong>Messenger</strong>
      </a>
      <a href="tel:0387700547" class="support-link phone">
        <span>☎</span>
        <strong>Hotline</strong>
      </a>
      <a href="mailto:tdchinh04@gmail.com" class="support-link email">
        <span>@</span>
        <strong>Email</strong>
      </a>
    </div>
    <button type="button" class="support-toggle" aria-label="Mở hỗ trợ" aria-expanded="false" title="Liên hệ hỗ trợ Bếp 1979">
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

// ==========================================
// QR CODE WEB LOGIN CONTROLLER
// ==========================================
let qrPollTimer = null;
let qrCountdownTimer = null;
let currentQrSessionId = null;
let qrRemainingSeconds = 120;

function initWebQrLogin() {
  const qrSection = document.getElementById("qrLoginSection");
  const passwordSection = document.getElementById("passwordLoginSection");

  if (qrSection) {
    qrSection.hidden = true;
    qrSection.classList.add("is-hidden");
    qrSection.style.setProperty("display", "none", "important");
  }
  if (passwordSection) {
    passwordSection.hidden = false;
    passwordSection.classList.remove("is-hidden");
    passwordSection.style.setProperty("display", "block", "important");
  }

  const qrRefreshBtn = document.getElementById("qrRefreshBtn");
  qrRefreshBtn?.addEventListener("click", () => {
    startNewQrSession();
  });
}

function switchToQrLogin() {
  const passwordSection = document.getElementById("passwordLoginSection");
  const qrSection = document.getElementById("qrLoginSection");

  if (passwordSection) {
    passwordSection.hidden = true;
    passwordSection.classList.add("is-hidden");
    passwordSection.style.setProperty("display", "none", "important");
  }

  if (qrSection) {
    qrSection.hidden = false;
    qrSection.classList.remove("is-hidden");
    qrSection.style.setProperty("display", "flex", "important");
  }

  startNewQrSession();
}

function switchToPasswordLogin() {
  const passwordSection = document.getElementById("passwordLoginSection");
  const qrSection = document.getElementById("qrLoginSection");

  if (qrSection) {
    qrSection.hidden = true;
    qrSection.classList.add("is-hidden");
    qrSection.style.setProperty("display", "none", "important");
  }

  if (passwordSection) {
    passwordSection.hidden = false;
    passwordSection.classList.remove("is-hidden");
    passwordSection.style.setProperty("display", "block", "important");
  }

  stopQrSession();
}

window.switchToQrLogin = switchToQrLogin;
window.switchToPasswordLogin = switchToPasswordLogin;

function stopQrSession() {
  if (qrPollTimer) {
    clearInterval(qrPollTimer);
    qrPollTimer = null;
  }
  if (qrCountdownTimer) {
    clearInterval(qrCountdownTimer);
    qrCountdownTimer = null;
  }
}

async function startNewQrSession() {
  stopQrSession();

  const container = document.getElementById("qrCanvasContainer");
  const expiredOverlay = document.getElementById("qrExpiredOverlay");
  const statusIndicator = document.getElementById("qrStatusIndicator");
  const statusText = document.getElementById("qrStatusText");
  const shortCodeText = document.getElementById("qrShortCodeText");
  const timerCount = document.getElementById("qrTimerCount");

  if (!container) return;

  expiredOverlay?.setAttribute("hidden", "");
  container.innerHTML = '<div class="qr-loading-spinner" aria-hidden="true"></div>';
  statusIndicator?.classList.remove("scanned", "confirmed");
  if (statusText) statusText.textContent = "Đang tạo mã QR...";
  if (shortCodeText) shortCodeText.textContent = "------";

  try {
    const res = await fetch(`${AUTH_API}/qr/session/init`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    const data = await res.json();
    if (!res.ok || !data.success || !data.sessionId) {
      throw new Error(data.message || "Không thể tạo mã QR.");
    }

    currentQrSessionId = data.sessionId;
    qrRemainingSeconds = data.expiresIn || 120;

    renderQrCodeImage(container, data.qrData || data.sessionId);

    if (shortCodeText && data.shortCode) {
      shortCodeText.textContent = data.shortCode;
    }

    if (statusText) statusText.textContent = "Đang chờ quét mã...";

    updateQrTimerDisplay(timerCount, qrRemainingSeconds);
    qrCountdownTimer = setInterval(() => {
      qrRemainingSeconds--;
      updateQrTimerDisplay(timerCount, qrRemainingSeconds);

      if (qrRemainingSeconds <= 0) {
        stopQrSession();
        expiredOverlay?.removeAttribute("hidden");
        if (statusText) statusText.textContent = "Mã QR đã hết hạn.";
      }
    }, 1000);

    qrPollTimer = setInterval(() => {
      checkQrSessionStatus(currentQrSessionId);
    }, 1500);

  } catch (error) {
    console.error("QR Init Error:", error);
    container.innerHTML = `<p style="color:#dc2626;font-size:13px;padding:12px;">${escapeHtml(error.message || "Lỗi tải mã QR")}</p>`;
    if (statusText) statusText.textContent = "Lỗi kết nối máy chủ";
  }
}

function renderQrCodeImage(container, text) {
  if (!container) return;
  container.innerHTML = "";
  try {
    if (typeof window.QRCode === "function") {
      new window.QRCode(container, {
        text: String(text).trim(),
        width: 190,
        height: 190,
        colorDark: "#1a1008",
        colorLight: "#ffffff",
        correctLevel: window.QRCode.CorrectLevel.M
      });
      return;
    }
  } catch (e) {
    console.warn("Client QRCode generator error, falling back to API:", e);
  }

  const img = document.createElement("img");
  img.src = `https://api.qrserver.com/v1/create-qr-code/?size=190x190&data=${encodeURIComponent(text)}`;
  img.alt = "Mã QR Đăng nhập Bếp 1979";
  img.width = 190;
  img.height = 190;
  img.style.borderRadius = "8px";
  img.style.display = "block";
  container.appendChild(img);
}

function updateQrTimerDisplay(element, seconds) {
  if (!element) return;
  const mins = Math.floor(Math.max(0, seconds) / 60);
  const secs = Math.max(0, seconds) % 60;
  element.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

async function checkQrSessionStatus(sessionId) {
  if (!sessionId) return;

  try {
    const res = await fetch(`${AUTH_API}/qr/session/check/${sessionId}`);
    const data = await res.json();

    const statusIndicator = document.getElementById("qrStatusIndicator");
    const statusText = document.getElementById("qrStatusText");
    const expiredOverlay = document.getElementById("qrExpiredOverlay");

    if (data.status === "scanned") {
      statusIndicator?.classList.add("scanned");
      statusIndicator?.classList.remove("confirmed");
      if (statusText) {
        statusText.textContent = data.message || "Đã quét! Vui lòng bấm Xác nhận trên điện thoại...";
      }
    } else if (data.status === "confirmed") {
      stopQrSession();
      statusIndicator?.classList.add("confirmed");
      if (statusText) {
        statusText.textContent = "Xác nhận thành công! Đang vào Bếp 1979...";
      }
      finishLogin({
        token: data.token,
        user: data.user,
        message: "Đăng nhập thành công qua mã QR!"
      });
    } else if (data.status === "rejected") {
      stopQrSession();
      showToast("Yêu cầu đăng nhập đã bị từ chối trên thiết bị.", "error");
      expiredOverlay?.removeAttribute("hidden");
      if (statusText) statusText.textContent = "Đăng nhập bị từ chối.";
    } else if (data.status === "expired") {
      stopQrSession();
      expiredOverlay?.removeAttribute("hidden");
      if (statusText) statusText.textContent = "Mã QR đã hết hạn.";
    }
  } catch (error) {
    console.warn("QR check polling error:", error);
  }
}

initAuthPasswordToggles();
initAuthSlider();
initResetPasswordForm();
initSocialSetupForm();
initPasswordStrengthCheckers();
initSupportWidget();
initWebQrLogin();

