const PROFILE_AUTH_API = `${API_BASE_URL}/auth`;
const PROFILE_GOOGLE_CLIENT_ID = window.FOODHUB_CONFIG?.GOOGLE_CLIENT_ID || "";
const PROFILE_FACEBOOK_APP_ID = window.FOODHUB_CONFIG?.FACEBOOK_APP_ID || "";
const PROFILE_FACEBOOK_SDK_VERSION = "v25.0";

let profileGoogleTokenClient;
let profileFacebookSdkPromise;
let savedAddresses = [];
let selectedAvatarData = "";
let passwordCaptchaAnswer = "";
let passwordCaptchaId = "";
let passwordCaptchaCooldownTimer;
let passwordCaptchaCooldownUntil = 0;

function getProfileAuthHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getAuthToken()}`
  };
}

async function requestProfileJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getProfileAuthHeaders(),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
    requireLogin(data.message || "Phien dang nhap da het han.", "profile.html");
    throw new Error(data.message || "Phien dang nhap da het han.");
  }

  if (!response.ok) {
    throw new Error(data.message || "Khong the xu ly yeu cau.");
  }

  return data;
}

async function requestProfileFormData(url, formData, options = {}) {
  const response = await fetch(url, {
    ...options,
    method: options.method || "POST",
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
      ...(options.headers || {})
    },
    body: formData
  });
  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
    requireLogin(data.message || "Phien dang nhap da het han.", "profile.html");
    throw new Error(data.message || "Phien dang nhap da het han.");
  }

  if (!response.ok) {
    throw new Error(data.message || "Khong the xu ly yeu cau.");
  }

  return data;
}

function loadProfileScript(src, id) {
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

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderSocialAccounts(accounts = []) {
  const container = document.getElementById("socialAccounts");
  if (!container) return;

  const linked = accounts.reduce((result, account) => {
    result[account.provider] = account;
    return result;
  }, {});

  const providers = [
    {
      id: "google",
      label: "Google",
      icon: `
        <svg class="provider-logo google-logo" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
          <path fill="#EA4335" d="M24 9.5c3.5 0 6.7 1.2 9.2 3.6l6.9-6.9C35.9 2.3 30.5 0 24 0 14.6 0 6.5 5.4 2.6 13.3l8 6.2C12.5 13.6 17.8 9.5 24 9.5Z"/>
          <path fill="#4285F4" d="M47 24.5c0-1.7-.2-3.3-.4-4.8H24v9.1h12.9c-.6 2.9-2.2 5.4-4.7 7.1l7.3 5.7C43.8 37.7 47 31.9 47 24.5Z"/>
          <path fill="#FBBC05" d="M10.6 28.5A14.4 14.4 0 0 1 10.6 19.5l-8-6.2a24 24 0 0 0 0 21.4l8-6.2Z"/>
          <path fill="#34A853" d="M24 48c6.5 0 12-2.1 16-6.5l-7.8-6c-2.2 1.5-5 2.4-8.2 2.4-6.2 0-11.5-4.1-13.4-9.6l-8 6.2C6.5 42.6 14.6 48 24 48Z"/>
        </svg>
      `
    },
    {
      id: "facebook",
      label: "Facebook",
      icon: `
        <svg class="provider-logo facebook-logo" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
          <circle cx="24" cy="24" r="24" fill="#1877F2"/>
          <path fill="#fff" d="M30.8 25.4 31.9 18h-7.1v-4.8c0-2 1-4 4.2-4h3.2V2.9S29.3 2.4 26.5 2.4c-5.9 0-9.8 3.6-9.8 10.1V18h-6.6v7.4h6.6V43.3a26 26 0 0 0 8.1 0V25.4h6Z"/>
        </svg>
      `
    }
  ];

  container.innerHTML = providers.map(provider => {
    const account = linked[provider.id];
    const statusClass = account ? "linked" : "missing";
    const statusText = account ? "ĐÃ LIÊN KẾT" : "CHƯA LIÊN KẾT";
    const actionLabel = account ? "Hủy liên kết" : "Liên kết ngay";

    return `
      <div class="social-account-item">
        <div class="social-account-main">
          <span class="social-account-icon ${provider.id}">${provider.icon}</span>
          <div>
            <div class="social-account-name">
            ${provider.label}
            </div>
            <span class="social-account-status ${statusClass}">${statusText}</span>
          </div>
        </div>
        <button type="button" class="social-provider-action ${statusClass} ${provider.id}" data-social-provider="${provider.id}" data-social-action="${account ? "unlink" : "link"}">
          ${actionLabel}
        </button>
      </div>
    `;
  }).join("");
}

function renderEmailVerifyStatus(user) {
  const status = document.getElementById("emailVerifyStatus");
  if (!status) return;

  const isVerified = Boolean(user?.emailVerified);
  status.className = `verify-status ${isVerified ? "verified" : "pending"}`;
  status.textContent = isVerified
    ? "Email da duoc xac thuc. Google cung email se tu dong dong bo vao tai khoan nay."
    : "Email chua xac thuc. Ban can xac thuc truoc khi dang nhap bang mat khau.";
}

function renderPasswordMode(user) {
  const form = document.getElementById("passwordForm");
  const currentPassword = document.getElementById("currentPassword");
  const newPassword = document.getElementById("newPassword");
  const confirmNewPassword = document.getElementById("confirmNewPassword");

  if (!form || !currentPassword || !newPassword || !confirmNewPassword) return;

  const title = form.querySelector(".section-heading h2");
  const hint = form.querySelector(".section-heading p");
  const button = form.querySelector("button[type='submit']");
  const currentLabel = currentPassword.closest("label");
  const hasPasswordSet = Boolean(user?.passwordSet);

  currentPassword.required = hasPasswordSet;
  confirmNewPassword.required = true;
  if (currentLabel) {
    currentLabel.hidden = !hasPasswordSet;
  }

  if (title) {
    title.textContent = hasPasswordSet ? "Doi mat khau" : "Tao mat khau dang nhap";
  }

  if (hint) {
    hint.textContent = hasPasswordSet
      ? "Nhap mat khau hien tai de doi sang mat khau moi."
      : "Tai khoan nay vua duoc tao bang Google/Facebook. Hay tao mat khau de hoan tat tai khoan chinh.";
  }

  if (button) {
    button.textContent = hasPasswordSet ? "Doi mat khau" : "Tao mat khau";
  }
}

function drawPasswordCaptchaPlaceholder(message = "Bấm Xin mã") {
  const canvas = document.getElementById("passwordCaptchaCanvas");
  if (!canvas) return;

  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#fffaf4";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#9a6a4a";
  context.font = "700 18px Arial, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(message, canvas.width / 2, canvas.height / 2);
}

function updatePasswordCaptchaButton() {
  const button = document.getElementById("refreshPasswordCaptcha");
  if (!button) return;

  const remaining = Math.max(0, Math.ceil((passwordCaptchaCooldownUntil - Date.now()) / 1000));
  button.disabled = remaining > 0;
  button.textContent = remaining > 0 ? `Xin lại sau ${remaining}s` : "Xin mã";

  if (remaining <= 0 && passwordCaptchaCooldownTimer) {
    clearInterval(passwordCaptchaCooldownTimer);
    passwordCaptchaCooldownTimer = null;
  }
}

function startPasswordCaptchaCooldown(seconds = 60) {
  passwordCaptchaCooldownUntil = Date.now() + seconds * 1000;
  updatePasswordCaptchaButton();

  if (passwordCaptchaCooldownTimer) {
    clearInterval(passwordCaptchaCooldownTimer);
  }

  passwordCaptchaCooldownTimer = setInterval(updatePasswordCaptchaButton, 1000);
}

async function refreshPasswordCaptcha() {
  const canvas = document.getElementById("passwordCaptchaCanvas");
  const answerInput = document.getElementById("passwordCaptchaAnswer");
  const button = document.getElementById("refreshPasswordCaptcha");

  if (Date.now() < passwordCaptchaCooldownUntil) {
    updatePasswordCaptchaButton();
    return;
  }

  if (answerInput) answerInput.value = "";
  if (button) {
    button.disabled = true;
    button.textContent = "Dang lay ma...";
  }

  let code = "";
  try {
    const data = await requestProfileJson(`${PROFILE_AUTH_API}/password-captcha`);
    code = String(data.code || "").toUpperCase();
    passwordCaptchaId = data.id || "";
    passwordCaptchaAnswer = code.toLowerCase();
    startPasswordCaptchaCooldown(60);
  } catch (error) {
    passwordCaptchaId = "";
    passwordCaptchaAnswer = "";
    updatePasswordCaptchaButton();
    showSiteToast(error.message, "error");
    return;
  }

  if (!canvas) return;

  const context = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;

  context.clearRect(0, 0, width, height);
  context.fillStyle = "#fffaf4";
  context.fillRect(0, 0, width, height);

  for (let i = 0; i < 9; i += 1) {
    context.beginPath();
    context.moveTo(Math.random() * width, Math.random() * height);
    context.bezierCurveTo(
      Math.random() * width,
      Math.random() * height,
      Math.random() * width,
      Math.random() * height,
      Math.random() * width,
      Math.random() * height
    );
    context.strokeStyle = i % 2 === 0 ? "rgba(154, 67, 0, 0.28)" : "rgba(42, 33, 29, 0.22)";
    context.lineWidth = Math.random() * 1.4 + 0.6;
    context.stroke();
  }

  for (let i = 0; i < 120; i += 1) {
    context.fillStyle = `rgba(60, 42, 33, ${Math.random() * 0.18})`;
    context.fillRect(Math.random() * width, Math.random() * height, 1.2, 1.2);
  }

  const startX = 24;
  const gap = 30;
  code.split("").forEach((char, index) => {
    const x = startX + index * gap + Math.random() * 5;
    const y = 44 + Math.random() * 8;
    const angle = (Math.random() - 0.5) * 0.55;

    context.save();
    context.translate(x, y);
    context.rotate(angle);
    context.font = `${Math.floor(Math.random() * 9) + 28}px Georgia, "Times New Roman", serif`;
    context.lineWidth = 1;
    context.strokeStyle = "rgba(42, 33, 29, 0.65)";
    context.fillStyle = index % 2 === 0 ? "#2a211d" : "#9a4300";
    context.strokeText(char, 0, 0);
    context.fillText(char, 0, 0);
    context.restore();
  });
}

function renderAccountSummary(user) {
  const name = document.getElementById("profileDisplayName");
  const email = document.getElementById("profileDisplayEmail");
  const avatar = document.getElementById("profileAvatar");
  const initials = String(user?.fullname || user?.email || "FH")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join("") || "FH";

  if (name) name.textContent = user?.fullname || "FoodHub User";
  if (email) email.textContent = user?.email || "";

  if (avatar) {
    const avatarSource = selectedAvatarData || user?.avatar || getDefaultAvatarDataUrl();

    if (avatarSource) {
      avatar.textContent = "";
      const image = document.createElement("img");
      image.src = avatarSource;
      image.alt = user?.fullname || "FoodHub User";
      image.addEventListener("error", () => {
        console.warn("Avatar image failed to load:", avatarSource);
        avatar.textContent = initials;
      }, { once: true });
      avatar.appendChild(image);
    } else {
      avatar.textContent = initials;
    }
  }
}

async function loadSocialAccounts() {
  try {
    const data = await requestProfileJson(`${PROFILE_AUTH_API}/social/accounts`);
    renderSocialAccounts(data.accounts || []);
  } catch (error) {
    showSiteToast(error.message, "error");
  }
}

function setProfileTab(tab) {
  document.querySelectorAll("[data-profile-tab]").forEach(button => {
    button.classList.toggle("active", button.dataset.profileTab === tab);
  });

  document.querySelectorAll("[data-profile-panel]").forEach(panel => {
    panel.hidden = panel.dataset.profilePanel !== tab;
  });
}

function renderSavedAddresses() {
  const container = document.getElementById("savedAddressList");
  if (!container) return;

  if (!savedAddresses.length) {
    container.innerHTML = `<p class="empty-cart">Chưa có địa chỉ giao hàng nào.</p>`;
    return;
  }

  container.innerHTML = savedAddresses.map(address => `
    <article class="saved-address-card">
      <div>
        <h3>${escapeHtml(address.label || "Địa chỉ giao hàng")} ${address.isDefault ? "<span>Mặc định</span>" : ""}</h3>
        <p>${escapeHtml(address.receiverName || "")}${address.phone ? ` - ${escapeHtml(address.phone)}` : ""}</p>
        <small>${escapeHtml(address.address)}</small>
      </div>
      <div class="saved-address-actions">
        <button type="button" data-edit-address="${address.id}">Sửa</button>
        <button type="button" data-delete-address="${address.id}">Xóa</button>
      </div>
    </article>
  `).join("");
}

async function loadSavedAddresses() {
  try {
    const data = await requestProfileJson(`${PROFILE_AUTH_API}/addresses`);
    savedAddresses = data.addresses || [];
    renderSavedAddresses();
  } catch (error) {
    showSiteToast(error.message, "error");
  }
}

async function unlinkSocialAccount(provider) {
  try {
    const data = await requestProfileJson(`${PROFILE_AUTH_API}/social/unlink/${provider}`, {
      method: "DELETE"
    });
    renderSocialAccounts(data.accounts || []);
    await loadProfile();
    showSiteToast(data.message || "Da huy lien ket tai khoan.");
  } catch (error) {
    showSiteToast(error.message, "error");
  }
}

function handleSocialProviderAction(event) {
  const button = event.target.closest("[data-social-provider][data-social-action]");
  if (!button) return;

  const provider = button.dataset.socialProvider;
  const action = button.dataset.socialAction;

  if (action === "unlink") {
    unlinkSocialAccount(provider);
    return;
  }

  if (provider === "google") linkGoogleAccount();
  if (provider === "facebook") linkFacebookAccount();
}

function resetAddressForm() {
  document.getElementById("addressBookId").value = "";
  document.getElementById("addressBookForm")?.reset();
  fillAddressForm({
    cityId: "addressBookCity",
    wardId: "addressBookWard",
    detailId: "addressBookDetail"
  }, "");
}

async function saveAddressBook(event) {
  event.preventDefault();

  const addressId = document.getElementById("addressBookId").value;
  const payload = {
    label: document.getElementById("addressBookLabel").value,
    receiverName: document.getElementById("addressBookReceiver").value,
    phone: document.getElementById("addressBookPhone").value,
    address: buildAddressString(
      document.getElementById("addressBookCity")?.value || "",
      "",
      document.getElementById("addressBookWard")?.value || "",
      document.getElementById("addressBookDetail")?.value || ""
    ),
    isDefault: document.getElementById("addressBookDefault").checked
  };
  const url = addressId
    ? `${PROFILE_AUTH_API}/addresses/${addressId}`
    : `${PROFILE_AUTH_API}/addresses`;

  try {
    const data = await requestProfileJson(url, {
      method: addressId ? "PUT" : "POST",
      body: JSON.stringify(payload)
    });
    resetAddressForm();
    await loadSavedAddresses();
    await loadProfile();
    showSiteToast(data.message || "Da luu dia chi.");
  } catch (error) {
    showSiteToast(error.message, "error");
  }
}

async function deleteAddress(addressId) {
  try {
    const data = await requestProfileJson(`${PROFILE_AUTH_API}/addresses/${addressId}`, {
      method: "DELETE"
    });
    await loadSavedAddresses();
    await loadProfile();
    showSiteToast(data.message || "Da xoa dia chi.");
  } catch (error) {
    showSiteToast(error.message, "error");
  }
}

function editAddress(addressId) {
  const address = savedAddresses.find(item => String(item.id) === String(addressId));
  if (!address) return;

  document.getElementById("addressBookId").value = address.id;
  document.getElementById("addressBookLabel").value = address.label || "";
  document.getElementById("addressBookReceiver").value = address.receiverName || "";
  document.getElementById("addressBookPhone").value = address.phone || "";
  fillAddressForm({
    cityId: "addressBookCity",
    wardId: "addressBookWard",
    detailId: "addressBookDetail"
  }, address.address || "");
  document.getElementById("addressBookDefault").checked = Boolean(address.isDefault);
}

async function postSocialLink(provider, accessToken) {
  const data = await requestProfileJson(`${PROFILE_AUTH_API}/social/link/${provider}`, {
    method: "POST",
    body: JSON.stringify({ accessToken })
  });

  renderSocialAccounts(data.accounts || []);
  await loadProfile();
  showSiteToast(data.message || "Da lien ket tai khoan.");
}

async function linkGoogleAccount() {
  if (!PROFILE_GOOGLE_CLIENT_ID) {
    showSiteToast("Google chua duoc cau hinh Client ID.", "error");
    return;
  }

  try {
    await loadProfileScript("https://accounts.google.com/gsi/client", "google-identity-script");

    if (!profileGoogleTokenClient) {
      profileGoogleTokenClient = google.accounts.oauth2.initTokenClient({
        client_id: PROFILE_GOOGLE_CLIENT_ID,
        scope: "openid email profile",
        callback: async response => {
          if (!response.access_token) {
            showSiteToast("Google khong tra ve access token.", "error");
            return;
          }

          try {
            await postSocialLink("google", response.access_token);
          } catch (error) {
            showSiteToast(error.message, "error");
          }
        }
      });
    }

    profileGoogleTokenClient.requestAccessToken({ prompt: "select_account" });
  } catch (error) {
    console.error(error);
    showSiteToast("Khong tai duoc Google Login.", "error");
  }
}

function initProfileFacebookSdk() {
  if (!PROFILE_FACEBOOK_APP_ID) {
    return Promise.reject(new Error("Facebook chua duoc cau hinh App ID."));
  }

  if (window.FB) {
    FB.init({
      appId: PROFILE_FACEBOOK_APP_ID,
      cookie: false,
      xfbml: false,
      status: true,
      version: PROFILE_FACEBOOK_SDK_VERSION
    });
    return Promise.resolve();
  }

  if (!profileFacebookSdkPromise) {
    profileFacebookSdkPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Facebook SDK tai qua lau hoac bi trinh duyet chan."));
      }, 10000);

      window.fbAsyncInit = () => {
        clearTimeout(timeout);
        FB.init({
          appId: PROFILE_FACEBOOK_APP_ID,
          cookie: false,
          xfbml: false,
          status: true,
          version: PROFILE_FACEBOOK_SDK_VERSION
        });
        resolve();
      };

      loadProfileScript("https://connect.facebook.net/vi_VN/sdk.js", "facebook-sdk-script")
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  return profileFacebookSdkPromise;
}

async function linkFacebookAccount() {
  try {
    await initProfileFacebookSdk();

    FB.login(response => {
      handleFacebookLinkResponse(response);
    }, { scope: "public_profile" });
  } catch (error) {
    console.error(error);
    showSiteToast(error.message || "Khong tai duoc Facebook Login.", "error");
  }
}

async function handleFacebookLinkResponse(response) {
  if (!response.authResponse?.accessToken) {
    showSiteToast("Facebook chua cap quyen dang nhap hoac popup da bi dong.", "info");
    return;
  }

  try {
    await postSocialLink("facebook", response.authResponse.accessToken);
  } catch (error) {
    showSiteToast(error.message, "error");
  }
}

async function loadProfile() {
  if (!isLoggedIn()) {
    requireLogin("Vui long dang nhap de xem tai khoan.", "profile.html");
    return;
  }

  try {
    await initAddressSelectors();
    const data = await requestProfileJson(`${PROFILE_AUTH_API}/me`);
    selectedAvatarData = "";
    document.getElementById("profileFullname").value = data.user.fullname || "";
    document.getElementById("profileUsername").value = data.user.username || "";
    document.getElementById("profileEmail").value = data.user.email || "";
    document.getElementById("profilePhone").value = data.user.phone || "";
    renderEmailVerifyStatus(data.user);
    renderPasswordMode(data.user);
    renderAccountSummary(data.user);
    if (data.user.requiresAccountSetup || new URLSearchParams(window.location.search).get("setup") === "1") {
      showSiteToast("Vui long tao username va mat khau de hoan tat tai khoan.", "info");
    }
    sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
    renderUser();
    await loadSocialAccounts();
    await loadSavedAddresses();
  } catch (error) {
    showSiteToast(error.message, "error");
  }
}

async function saveProfile(event) {
  event.preventDefault();

  const payload = {
    username: document.getElementById("profileUsername").value,
    fullname: document.getElementById("profileFullname").value,
    email: document.getElementById("profileEmail").value,
    avatar: selectedAvatarData || document.querySelector("#profileAvatar img")?.getAttribute("src") || "",
    phone: document.getElementById("profilePhone").value
  };

  try {
    const data = await requestProfileJson(`${PROFILE_AUTH_API}/me`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });

    const verificationUrl = data.verificationUrl;
    const profileMessage = data.message;

    sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
    selectedAvatarData = "";
    renderEmailVerifyStatus(data.user);
    renderAccountSummary(data.user);
    renderUser();
    if (verificationUrl) {
      showSiteToast(profileMessage || "Vui long xac thuc email moi.");
      setTimeout(() => {
        window.location.href = verificationUrl;
      }, 900);
      return;
    }

    showSiteToast(data.message || "Da cap nhat thong tin tai khoan.");
  } catch (error) {
    showSiteToast(error.message, "error");
  }
}

function initAvatarUpload() {
  const button = document.getElementById("avatarUploadButton");
  const input = document.getElementById("avatarUploadInput");

  if (!button || !input) return;

  button.addEventListener("click", () => input.click());
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showSiteToast("Vui long chon tep hinh anh.", "error");
      input.value = "";
      return;
    }

    compressAvatarImage(file)
      .then(dataUrl => {
        selectedAvatarData = dataUrl;
        renderAccountSummary({
          fullname: document.getElementById("profileFullname")?.value,
          email: document.getElementById("profileEmail")?.value,
          avatar: selectedAvatarData
        });
        showSiteToast("Da chon anh dai dien. Bam Luu thay doi de cap nhat.");
      })
      .catch(error => {
        console.error(error);
        showSiteToast("Khong the xu ly anh dai dien.", "error");
      })
      .finally(() => {
        input.value = "";
      });
  });
}

function compressAvatarImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = reject;
    reader.onload = () => {
      const image = new Image();
      image.onerror = reject;
      image.onload = () => {
        const maxSize = 320;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        canvas.width = width;
        canvas.height = height;
        context.drawImage(image, 0, 0, width, height);

        let quality = 0.82;
        let dataUrl = canvas.toDataURL("image/jpeg", quality);

        while (dataUrl.length > 420000 && quality > 0.45) {
          quality -= 0.08;
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }

        resolve(dataUrl);
      };

      image.src = String(reader.result || "");
    };

    reader.readAsDataURL(file);
  });
}

async function changePassword(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const currentPassword = document.getElementById("currentPassword").value;
  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmNewPassword").value;
  const captchaAnswer = document.getElementById("passwordCaptchaAnswer").value.trim().toLowerCase();

  if (newPassword !== confirmPassword) {
    showSiteToast("Mat khau moi nhap lai khong khop.", "error");
    return;
  }

  if (!passwordCaptchaId || !passwordCaptchaAnswer) {
    showSiteToast("Vui long bam Xin ma captcha truoc.", "error");
    return;
  }

  if (captchaAnswer !== passwordCaptchaAnswer) {
    showSiteToast("Ma captcha khong dung.", "error");
    return;
  }

  const payload = {
    currentPassword,
    newPassword,
    confirmPassword,
    captchaAnswer,
    captchaId: passwordCaptchaId
  };

  try {
    const data = await requestProfileJson(`${PROFILE_AUTH_API}/password`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
    if (form) {
      form.querySelectorAll("input").forEach(input => {
        input.value = "";
      });
    }
    passwordCaptchaId = "";
    passwordCaptchaAnswer = "";
    drawPasswordCaptchaPlaceholder("Bấm Xin mã");
    await loadProfile();
    showSiteToast(data.message || "Da doi mat khau.");
  } catch (error) {
    if (/captcha/i.test(error.message || "")) {
      passwordCaptchaId = "";
      passwordCaptchaAnswer = "";
      drawPasswordCaptchaPlaceholder("Bấm Xin mã");
    }
    showSiteToast(error.message, "error");
  }
}

function togglePasswordVisibility(event) {
  const button = event.target.closest("[data-toggle-password]");
  if (!button) return;

  const input = document.getElementById(button.dataset.togglePassword);
  if (!input) return;

  const shouldShow = input.type === "password";
  input.type = shouldShow ? "text" : "password";
  button.textContent = shouldShow ? "Ẩn" : "Hiện";
}

document.getElementById("profileForm").addEventListener("submit", saveProfile);
document.getElementById("passwordForm").addEventListener("submit", changePassword);
document.getElementById("passwordForm").addEventListener("click", togglePasswordVisibility);
document.getElementById("socialAccounts")?.addEventListener("click", handleSocialProviderAction);
initAvatarUpload();
document.getElementById("addressBookForm")?.addEventListener("submit", saveAddressBook);
document.getElementById("cancelAddressEdit")?.addEventListener("click", resetAddressForm);
document.getElementById("refreshPasswordCaptcha")?.addEventListener("click", refreshPasswordCaptcha);
document.getElementById("savedAddressList")?.addEventListener("click", event => {
  const editButton = event.target.closest("[data-edit-address]");
  const deleteButton = event.target.closest("[data-delete-address]");

  if (editButton) editAddress(editButton.dataset.editAddress);
  if (deleteButton) deleteAddress(deleteButton.dataset.deleteAddress);
});
document.querySelectorAll("[data-profile-tab]").forEach(button => {
  button.addEventListener("click", () => setProfileTab(button.dataset.profileTab));
});
drawPasswordCaptchaPlaceholder("Bấm Xin mã");
updatePasswordCaptchaButton();
loadProfile();
