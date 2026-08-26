const PROFILE_AUTH_API = `${API_BASE_URL}/auth`;
const PROFILE_FAVORITES_API = `${API_BASE_URL}/foods/favorites`;
// Trang hồ sơ dùng API auth để đọc/cập nhật thông tin cá nhân, địa chỉ, avatar và liên kết mạng xã hội.
// Mọi request riêng tư đều gắn token đăng nhập để backend xác thực đúng người dùng.
const PROFILE_GOOGLE_CLIENT_ID = window.FOODHUB_CONFIG?.GOOGLE_CLIENT_ID || "";
const PROFILE_FACEBOOK_APP_ID = window.FOODHUB_CONFIG?.FACEBOOK_APP_ID || "";
const PROFILE_FACEBOOK_SDK_VERSION = "v25.0";

let profileGoogleTokenClient;
let profileFacebookSdkPromise;
let savedAddresses = [];
let selectedAvatarData = "";
let selectedAvatarFile = null;
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
  // Wrapper gọi API JSON cho trang hồ sơ.
  // Tự gắn token, xử lý 401 bằng cách xóa session và chuyển người dùng về đăng nhập.
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
    requireLogin(data.message || "Phiên đăng nhập da hết hạn.", "profile.html");
    throw new Error(data.message || "Phiên đăng nhập da hết hạn.");
  }

  if (!response.ok) {
    throw new Error(data.message || "Không thể xử lý yêu cầu.");
  }

  return data;
}

async function requestProfileFormData(url, formData, options = {}) {
  // Wrapper upload FormData, chủ yếu dùng cho avatar.
  // Không đặt Content-Type thủ công để trình duyệt tự sinh boundary multipart chính xác.
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
    requireLogin(data.message || "Phiên đăng nhập da hết hạn.", "profile.html");
    throw new Error(data.message || "Phiên đăng nhập da hết hạn.");
  }

  if (!response.ok) {
    throw new Error(data.message || "Không thể xử lý yêu cầu.");
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
    ? "Email đã được xác thực. Google cùng email se từ dong đồng bộ vao tài khoản này."
    : "Email chưa xác thực. Bạn cần xác thực trước khi đăng nhập bằng mật khẩu.";
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
    title.textContent = hasPasswordSet ? "Đổi mật khẩu" : "Tạo mật khẩu đăng nhập";
  }

  if (hint) {
    hint.textContent = hasPasswordSet
      ? "Nhập mật khẩu hiện tại để đổi sang mật khẩu mới."
      : "Tài khoản này vừa được tạo bằng Google/Facebook. Hãy tạo mật khẩu để hoàn tất tài khoản chính.";
  }

  if (button) {
    button.textContent = hasPasswordSet ? "Đổi mật khẩu" : "Tạo mật khẩu";
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
    button.textContent = "Đang lấy mã...";
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

const PRESET_AVATARS = [
  { id: "chef-boy", name: "Đầu bếp Nam", url: "assets/images/avatars/chef-boy.svg" },
  { id: "chef-girl", name: "Đầu bếp Nữ", url: "assets/images/avatars/chef-girl.svg" },
  { id: "burger-buddy", name: "Bé Burger", url: "assets/images/avatars/burger-buddy.svg" },
  { id: "boba-cat", name: "Bé Trà Sữa", url: "assets/images/avatars/boba-cat.svg" },
  { id: "pizza-slice", name: "Bé Pizza", url: "assets/images/avatars/pizza-slice.svg" },
  { id: "ramen-bowl", name: "Bé Mì Ramen", url: "assets/images/avatars/ramen-bowl.svg" }
];

function openAvatarChoiceModal() {
  const modal = document.getElementById("avatarChoiceModal");
  if (!modal) return;

  const currentAvatar = selectedAvatarData || JSON.parse(sessionStorage.getItem(AUTH_USER_KEY) || "{}").avatar || "";
  renderPresetAvatars(currentAvatar);

  if (typeof modal.showModal === "function") {
    modal.showModal();
  } else {
    modal.setAttribute("open", "");
  }
}

function closeAvatarChoiceModal() {
  const modal = document.getElementById("avatarChoiceModal");
  if (!modal) return;

  if (typeof modal.close === "function") {
    modal.close();
  } else {
    modal.removeAttribute("open");
  }
}

function renderPresetAvatars(currentAvatarUrl) {
  const container = document.getElementById("presetAvatarsList");
  if (!container) return;

  container.innerHTML = PRESET_AVATARS.map(item => {
    const isSelected = Boolean(currentAvatarUrl && currentAvatarUrl.includes(item.url));
    return `
      <button type="button" class="preset-avatar-btn ${isSelected ? "active" : ""}" data-preset-avatar="${item.url}" title="${item.name}" aria-label="Chọn ${item.name}">
        <img src="${item.url}" alt="${item.name}">
        <span class="preset-avatar-name">${item.name}</span>
      </button>
    `;
  }).join("");

  container.querySelectorAll("[data-preset-avatar]").forEach(btn => {
    btn.addEventListener("click", () => selectPresetAvatar(btn.dataset.presetAvatar));
  });
}

async function selectPresetAvatar(avatarUrl) {
  if (!avatarUrl) return;

  const user = JSON.parse(sessionStorage.getItem(AUTH_USER_KEY) || "{}");
  selectedAvatarData = avatarUrl;
  selectedAvatarFile = null;

  renderAccountSummary({ ...user, avatar: avatarUrl });
  renderPresetAvatars(avatarUrl);

  try {
    showSiteLoading("Đang cập nhật ảnh đại diện...");
    const res = await requestProfileJson(`${PROFILE_AUTH_API}/avatar`, {
      method: "POST",
      body: JSON.stringify({ presetAvatar: avatarUrl })
    });

    const updatedUser = res.user || { ...user, avatar: avatarUrl };
    sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));

    if (typeof broadcastUserUpdate === "function") {
      broadcastUserUpdate(updatedUser);
    }

    renderAccountSummary(updatedUser);
    renderPresetAvatars(avatarUrl);
    closeAvatarChoiceModal();
    showSiteToast("Đã cập nhật ảnh đại diện thành công! ✨", "success");
  } catch (error) {
    console.error("Lỗi chọn avatar có sẵn:", error);
    showSiteToast(error.message || "Không thể cập nhật ảnh đại diện.", "error");
  } finally {
    hideSiteLoading();
  }
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

  const avatarSource = selectedAvatarData || user?.avatar || (typeof getDefaultAvatarDataUrl === "function" ? getDefaultAvatarDataUrl() : "");

  if (avatar) {
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

function renderPinMode(user) {
  const status = document.getElementById("pinStatus");
  const currentPin = document.getElementById("currentPin");
  const currentLabel = document.getElementById("currentPinLabel");
  const hasPin = Boolean(user?.hasPin);

  if (status) {
    status.className = `pin-status ${hasPin ? "enabled" : ""}`;
    status.textContent = hasPin ? "Đã bật PIN" : "Chưa tạo PIN";
  }

  if (currentPin) {
    currentPin.required = hasPin;
  }

  if (currentLabel) {
    currentLabel.hidden = !hasPin;
  }
}

function initProfilePinBoxes() {
  document.querySelectorAll("[data-profile-pin-group]").forEach(group => {
    const inputId = group.dataset.profilePinGroup;
    const hiddenInput = document.getElementById(inputId);
    if (!hiddenInput || group.dataset.pinReady === "1") return;

    group.dataset.pinReady = "1";
    group.innerHTML = Array.from({ length: 6 }, (_, index) => `
      <input type="password" inputmode="numeric" autocomplete="off" maxlength="1" aria-label="Số PIN ${index + 1}" data-profile-pin-box>
    `).join("");

    const boxes = Array.from(group.querySelectorAll("[data-profile-pin-box]"));
    const syncHidden = () => {
      hiddenInput.value = boxes.map(input => input.value).join("");
    };

    boxes.forEach((box, index) => {
      box.addEventListener("input", () => {
        box.value = box.value.replace(/\D/g, "").slice(-1);
        syncHidden();
        if (box.value && boxes[index + 1]) boxes[index + 1].focus();
      });

      box.addEventListener("keydown", event => {
        if (event.key === "Backspace" && !box.value && boxes[index - 1]) {
          boxes[index - 1].focus();
        }
      });

      box.addEventListener("paste", event => {
        event.preventDefault();
        const digits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, boxes.length);
        digits.split("").forEach((digit, digitIndex) => {
          boxes[digitIndex].value = digit;
        });
        syncHidden();
        boxes[Math.min(digits.length, boxes.length) - 1]?.focus();
      });
    });
  });
}

function clearProfilePinBoxes(form) {
  form?.querySelectorAll("[data-profile-pin-box]").forEach(input => {
    input.value = "";
  });
  form?.querySelectorAll("#currentPin, #newPin, #confirmPin").forEach(input => {
    input.value = "";
  });
}

function getProfileVoucherLabel(entry) {
  const discount = entry.discount || entry;
  const applyText = discount.applyTo === "shipping" ? "Phí giao hàng" : "Đơn hàng";
  const valueText = discount.discountType === "free_shipping"
    ? "Miễn phí ship"
    : discount.discountType === "percent"
      ? `${Number(discount.discountValue || 0)}%`
      : formatMoney(discount.discountValue || 0);
  const minText = Number(discount.minOrder || 0) > 0 ? ` từ ${formatMoney(discount.minOrder)}` : " không yêu cầu đơn tối thiểu";
  return `${valueText} cho ${applyText},${minText}`;
}

function renderProfileVouchers(vouchers = []) {
  const container = document.getElementById("profileVoucherList");
  if (!container) return;

  if (!vouchers.length) {
    container.innerHTML = `
      <p class="empty-cart">Bạn chưa có voucher nào. Vào trang Thông báo để nhận voucher đang phát hành.</p>
      <a class="social-link-btn" href="announcements.html">Xem voucher</a>
    `;
    return;
  }

  container.innerHTML = vouchers.map(item => {
    const discount = item.discount || item;
    return `
      <article class="profile-voucher-card">
        <div>
          <span class="profile-voucher-code">${escapeHtml(discount.code || "")}</span>
          <h3>${escapeHtml(discount.name || discount.code || "Voucher")}</h3>
          <p>${escapeHtml(getProfileVoucherLabel(item))}</p>
          <small>Còn ${Number(item.remaining || 0)} lượt${discount.expiresAt ? ` - Hết hạn ${new Date(discount.expiresAt).toLocaleString("vi-VN")}` : ""}</small>
        </div>
        <a class="social-link-btn" href="cart.html">Dùng ngay</a>
      </article>
    `;
  }).join("");
}

async function loadProfileVouchers() {
  const container = document.getElementById("profileVoucherList");
  if (!container) return;

  container.innerHTML = `<p class="empty-cart">Đang tải voucher...</p>`;

  try {
    const response = await fetch(`${ORDERS_API}/vouchers/mine`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` }
    });
    const data = await response.json().catch(() => []);
    if (!response.ok) throw new Error(data.message || "Không thể tải voucher.");
    renderProfileVouchers(Array.isArray(data) ? data : []);
  } catch (error) {
    container.innerHTML = `<p class="empty-cart">${escapeHtml(error.message)}</p>`;
  }
}

function getProfileFoodCategory(food = {}) {
  return food.categoryName || food.parentCategoryName || food.category || food.parentCategory || "Món ăn";
}

function renderProfileFavoriteFoods(favoriteFoods = []) {
  const container = document.getElementById("profileFavoriteFoodsList");
  if (!container) return;

  if (!favoriteFoods.length) {
    container.innerHTML = `
      <p class="empty-cart">Bạn chưa lưu món yêu thích nào.</p>
      <a class="social-link-btn" href="menu.html">Khám phá thực đơn</a>
    `;
    return;
  }

  container.innerHTML = favoriteFoods.map(food => {
    const stock = Number(food.stockQuantity ?? food.stock_quantity ?? 0);
    const image = food.image
      ? `<img src="${escapeHtml(food.image)}" alt="${escapeHtml(food.name)}">`
      : `<span class="profile-favorite-placeholder">FH</span>`;
    return `
      <article class="profile-favorite-food-card" data-profile-favorite-food="${food.id}">
        <a class="profile-favorite-image" href="food-detail.html?id=${encodeURIComponent(food.id)}&from=profile">
          ${image}
        </a>
        <div class="profile-favorite-main">
          <span>${escapeHtml(getProfileFoodCategory(food))}</span>
          <h3><a href="food-detail.html?id=${encodeURIComponent(food.id)}&from=profile">${escapeHtml(food.name || "Món ăn")}</a></h3>
          <p>${escapeHtml(food.desc || food.description || "Món đã lưu trong danh sách yêu thích của bạn.")}</p>
          <small>${stock > 0 ? `Còn ${stock} phần` : "Hết hàng"}${food.favoritedAt ? ` - Đã lưu ${new Date(food.favoritedAt).toLocaleDateString("vi-VN")}` : ""}</small>
        </div>
        <div class="profile-favorite-actions">
          <strong>${formatMoney(food.price || 0)}</strong>
          <button type="button" class="social-link-btn" data-profile-add-favorite="${food.id}" ${stock <= 0 ? "disabled" : ""}>Thêm vào giỏ</button>
          <button type="button" class="social-link-btn subtle" data-profile-remove-favorite="${food.id}">Bỏ lưu</button>
        </div>
      </article>
    `;
  }).join("");
}

async function loadProfileFavoriteFoods() {
  const container = document.getElementById("profileFavoriteFoodsList");
  if (!container) return;

  container.innerHTML = `<p class="empty-cart">Đang tải món yêu thích...</p>`;

  try {
    const response = await fetch(`${PROFILE_FAVORITES_API}/detail`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` }
    });
    const data = await response.json().catch(() => []);
    if (!response.ok) throw new Error(data.message || "Không thể tải món yêu thích.");
    renderProfileFavoriteFoods(Array.isArray(data) ? data : []);
  } catch (error) {
    container.innerHTML = `<p class="empty-cart">${escapeHtml(error.message)}</p>`;
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
    showSiteToast(data.message || "Đã hủy liên kết tài khoản.");
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
    showSiteToast(data.message || "Đã lưu địa chỉ.");
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
    showSiteToast(data.message || "Đã xóa địa chỉ.");
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
  // Gửi accessToken mạng xã hội lên backend để liên kết với tài khoản FoodHub hiện tại.
  // Frontend không tự lưu token social, chỉ dùng một lần để backend xác thực provider.
  const data = await requestProfileJson(`${PROFILE_AUTH_API}/social/link/${provider}`, {
    method: "POST",
    body: JSON.stringify({ accessToken })
  });

  renderSocialAccounts(data.accounts || []);
  await loadProfile();
  showSiteToast(data.message || "Đã liên kết tài khoản.");
}

async function linkGoogleAccount() {
  if (!PROFILE_GOOGLE_CLIENT_ID) {
    showSiteToast("Google chưa được cấu hình Client ID.", "error");
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
            showSiteToast("Google không trả về access token.", "error");
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
    showSiteToast("Không tải được Google Login.", "error");
  }
}

function initProfileFacebookSdk() {
  if (!PROFILE_FACEBOOK_APP_ID) {
    return Promise.reject(new Error("Facebook chưa được cấu hình App ID."));
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
        reject(new Error("Facebook SDK tải quá lâu hoặc bị trình duyệt chặn."));
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
    showSiteToast(error.message || "Không tải được Facebook Login.", "error");
  }
}

async function handleFacebookLinkResponse(response) {
  if (!response.authResponse?.accessToken) {
    showSiteToast("Facebook chưa cấp quyền đăng nhập hoặc popup đã bị đóng.", "info");
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
    requireLogin("Vui lòng đăng nhập để xem tài khoản.", "profile.html");
    return;
  }

  try {
    await initAddressSelectors();
    const data = await requestProfileJson(`${PROFILE_AUTH_API}/me`);
    if (selectedAvatarData?.startsWith("blob:")) {
      URL.revokeObjectURL(selectedAvatarData);
    }
    selectedAvatarData = "";
    selectedAvatarFile = null;
    document.getElementById("profileFullname").value = data.user.fullname || "";
    document.getElementById("profileUsername").value = data.user.username || "";
    document.getElementById("profileEmail").value = data.user.email || "";
    document.getElementById("profilePhone").value = data.user.phone || "";
    renderEmailVerifyStatus(data.user);
    renderPasswordMode(data.user);
    renderPinMode(data.user);
    renderAccountSummary(data.user);
    if (data.user.requiresAccountSetup || new URLSearchParams(window.location.search).get("setup") === "1") {
      showSiteToast("Vui lòng tạo username và mật khẩu để hoàn tất tài khoản.", "info");
    }
    sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
    renderUser();
    await loadSocialAccounts();
    await loadSavedAddresses();
    await loadProfileVouchers();
    await loadProfileFavoriteFoods();
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
    phone: document.getElementById("profilePhone").value
  };

  try {
    let data = await requestProfileJson(`${PROFILE_AUTH_API}/me`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });

    if (selectedAvatarFile) {
      const avatarForm = new FormData();
      avatarForm.append("avatar", selectedAvatarFile);
      const avatarData = await requestProfileFormData(`${PROFILE_AUTH_API}/avatar`, avatarForm);
      data = {
        ...data,
        user: avatarData.user || {
          ...data.user,
          avatar: avatarData.avatar
        }
      };
    }

    const verificationUrl = data.verificationUrl;
    const profileMessage = data.message;

    sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
    selectedAvatarData = "";
    selectedAvatarFile = null;
    renderEmailVerifyStatus(data.user);
    renderAccountSummary(data.user);
    renderUser();
    if (verificationUrl) {
      showSiteToast(profileMessage || "Vui lòng xác thực email mới.");
      setTimeout(() => {
        window.location.href = verificationUrl;
      }, 900);
      return;
    }

    showSiteToast(data.message || "Đã cập nhật thông tin tài khoản.");
  } catch (error) {
    showSiteToast(error.message, "error");
  }
}

/* ============================================================
   Avatar Crop / Zoom / Pan / Rotate & Lightbox Preview
   ============================================================ */
let cropState = {
  src: null,
  zoom: 1,
  rotation: 0,
  offsetX: 0,
  offsetY: 0,
  isDragging: false,
  startX: 0,
  startY: 0,
  lastOffsetX: 0,
  lastOffsetY: 0,
  naturalW: 300,
  naturalH: 300
};

function openAvatarCropModal(file) {
  const modal = document.getElementById("avatarCropModal");
  const img   = document.getElementById("avatarCropImage");
  if (!modal || !img) return;

  if (cropState.src?.startsWith("blob:")) URL.revokeObjectURL(cropState.src);
  const url = URL.createObjectURL(file);
  cropState.src = url;
  cropState.zoom = 1;
  cropState.rotation = 0;
  cropState.offsetX = 0;
  cropState.offsetY = 0;

  img.onload = () => {
    cropState.naturalW = img.naturalWidth || 300;
    cropState.naturalH = img.naturalHeight || 300;
    requestAnimationFrame(applyCropTransform);
  };
  img.src = url;

  const slider = document.getElementById("avatarZoomRange");
  if (slider) slider.value = 1;

  if (typeof modal.showModal === "function") {
    modal.showModal();
  } else {
    modal.setAttribute("open", "");
  }

  requestAnimationFrame(applyCropTransform);
}

function applyCropTransform() {
  const img  = document.getElementById("avatarCropImage");
  const wrap = document.getElementById("avatarCropCanvasWrap");
  if (!img || !wrap) return;

  const wrapW = wrap.offsetWidth || 260;
  const wrapH = wrap.offsetHeight || 260;
  const rad   = (cropState.rotation * Math.PI) / 180;
  const cosA  = Math.abs(Math.cos(rad));
  const sinA  = Math.abs(Math.sin(rad));

  const naturalW = cropState.naturalW || 300;
  const naturalH = cropState.naturalH || 300;

  // Ensure image at least covers the 200px crop mask circle
  const minMaskSize = 200;
  const fittedW = Math.max(minMaskSize, wrapW * cosA + wrapH * sinA);
  const fittedH = Math.max(minMaskSize, wrapH * cosA + wrapW * sinA);

  const baseScale = Math.max(fittedW / naturalW, fittedH / naturalH);
  const finalScale = baseScale * cropState.zoom;
  const displayW = naturalW * finalScale;
  const displayH = naturalH * finalScale;

  img.style.width  = `${displayW}px`;
  img.style.height = `${displayH}px`;
  img.style.left   = `${wrapW / 2 - displayW / 2 + cropState.offsetX}px`;
  img.style.top    = `${wrapH / 2 - displayH / 2 + cropState.offsetY}px`;
  img.style.transform = `rotate(${cropState.rotation}deg)`;
}

function initCropModalEvents() {
  const modal    = document.getElementById("avatarCropModal");
  const wrap     = document.getElementById("avatarCropCanvasWrap");
  const slider   = document.getElementById("avatarZoomRange");
  const zoomIn   = document.getElementById("avatarZoomInBtn");
  const zoomOut  = document.getElementById("avatarZoomOutBtn");
  const rotateBtn = document.getElementById("avatarRotateBtn");
  const resetBtn  = document.getElementById("avatarResetBtn");
  const saveBtn   = document.getElementById("avatarSaveCropBtn");

  if (!modal || !wrap) return;

  slider?.addEventListener("input", () => {
    cropState.zoom = Number(slider.value);
    applyCropTransform();
  });
  zoomIn?.addEventListener("click", () => {
    cropState.zoom = Math.min(3, parseFloat((cropState.zoom + 0.15).toFixed(2)));
    if (slider) slider.value = cropState.zoom;
    applyCropTransform();
  });
  zoomOut?.addEventListener("click", () => {
    cropState.zoom = Math.max(1, parseFloat((cropState.zoom - 0.15).toFixed(2)));
    if (slider) slider.value = cropState.zoom;
    applyCropTransform();
  });

  rotateBtn?.addEventListener("click", () => {
    cropState.rotation = (cropState.rotation + 90) % 360;
    cropState.offsetX = 0;
    cropState.offsetY = 0;
    applyCropTransform();
  });

  resetBtn?.addEventListener("click", () => {
    cropState.zoom = 1;
    cropState.rotation = 0;
    cropState.offsetX = 0;
    cropState.offsetY = 0;
    if (slider) slider.value = 1;
    applyCropTransform();
  });

  // Pan with mouse
  wrap.addEventListener("mousedown", e => {
    cropState.isDragging = true;
    cropState.startX = e.clientX;
    cropState.startY = e.clientY;
    cropState.lastOffsetX = cropState.offsetX;
    cropState.lastOffsetY = cropState.offsetY;
    e.preventDefault();
  });
  window.addEventListener("mousemove", e => {
    if (!cropState.isDragging) return;
    cropState.offsetX = cropState.lastOffsetX + (e.clientX - cropState.startX);
    cropState.offsetY = cropState.lastOffsetY + (e.clientY - cropState.startY);
    applyCropTransform();
  });
  window.addEventListener("mouseup", () => { cropState.isDragging = false; });

  // Pan with touch
  wrap.addEventListener("touchstart", e => {
    const t = e.touches[0];
    cropState.isDragging = true;
    cropState.startX = t.clientX;
    cropState.startY = t.clientY;
    cropState.lastOffsetX = cropState.offsetX;
    cropState.lastOffsetY = cropState.offsetY;
  }, { passive: true });
  wrap.addEventListener("touchmove", e => {
    if (!cropState.isDragging) return;
    const t = e.touches[0];
    cropState.offsetX = cropState.lastOffsetX + (t.clientX - cropState.startX);
    cropState.offsetY = cropState.lastOffsetY + (t.clientY - cropState.startY);
    applyCropTransform();
  }, { passive: true });
  wrap.addEventListener("touchend", () => { cropState.isDragging = false; });

  const closeModal = () => {
    if (typeof modal.close === "function") modal.close();
    else modal.removeAttribute("open");
    if (cropState.src?.startsWith("blob:")) URL.revokeObjectURL(cropState.src);
  };

  modal.querySelectorAll("[data-close-avatar-crop]").forEach(btn => {
    btn.addEventListener("click", closeModal);
  });

  modal.addEventListener("click", e => {
    if (e.target === modal) closeModal();
  });

  saveBtn?.addEventListener("click", () => cropAvatarAndApply(modal, wrap));
}

function cropAvatarAndApply(modal, wrap) {
  const CROP_SIZE = 300;
  const canvas = document.createElement("canvas");
  canvas.width = CROP_SIZE;
  canvas.height = CROP_SIZE;
  const ctx = canvas.getContext("2d");
  const img = document.getElementById("avatarCropImage");
  if (!img) return;

  const wrapW = wrap.offsetWidth || 260;
  const wrapH = wrap.offsetHeight || 260;
  const imgStyle = getComputedStyle(img);
  const displayW = parseFloat(imgStyle.width) || wrapW;
  const displayH = parseFloat(imgStyle.height) || wrapH;
  const imgLeft  = parseFloat(imgStyle.left) || 0;
  const imgTop   = parseFloat(imgStyle.top) || 0;
  const maskR = CROP_SIZE / 2;

  // Mask in wrap is 200px wide, target canvas is 300px wide
  const scaleRatio = CROP_SIZE / 200;

  // Image center relative to wrap center
  const cx = (imgLeft + displayW / 2) - wrapW / 2;
  const cy = (imgTop  + displayH / 2) - wrapH / 2;

  ctx.save();
  ctx.beginPath();
  ctx.arc(maskR, maskR, maskR, 0, 2 * Math.PI);
  ctx.clip();
  ctx.translate(maskR + cx * scaleRatio, maskR + cy * scaleRatio);
  ctx.rotate((cropState.rotation * Math.PI) / 180);
  ctx.drawImage(
    img,
    -displayW * scaleRatio / 2,
    -displayH * scaleRatio / 2,
    displayW * scaleRatio,
    displayH * scaleRatio
  );
  ctx.restore();

  const finalizeCrop = (blobOrDataUrl, isBlob = true) => {
    if (selectedAvatarData?.startsWith("blob:")) URL.revokeObjectURL(selectedAvatarData);
    if (isBlob) {
      selectedAvatarFile = new File([blobOrDataUrl], "avatar.jpg", { type: "image/jpeg" });
      selectedAvatarData = URL.createObjectURL(blobOrDataUrl);
    } else {
      selectedAvatarData = blobOrDataUrl;
    }
    renderAccountSummary({
      fullname: document.getElementById("profileFullname")?.value,
      email: document.getElementById("profileEmail")?.value,
      avatar: selectedAvatarData
    });
    if (typeof modal.close === "function") modal.close();
    else modal.removeAttribute("open");
    if (cropState.src?.startsWith("blob:")) URL.revokeObjectURL(cropState.src);
    showSiteToast("Ảnh đại diện đã được cắt. Bấm Lưu thay đổi để cập nhật.");
  };

  try {
    canvas.toBlob(blob => {
      if (blob) {
        finalizeCrop(blob, true);
      } else {
        finalizeCrop(canvas.toDataURL("image/jpeg", 0.92), false);
      }
    }, "image/jpeg", 0.92);
  } catch (e) {
    finalizeCrop(canvas.toDataURL("image/jpeg", 0.92), false);
  }
}

function initAvatarLightbox() {
  const avatarEl     = document.getElementById("profileAvatar");
  const previewModal = document.getElementById("avatarPreviewModal");
  const previewImg   = document.getElementById("avatarPreviewImage");
  const changeBtn    = document.getElementById("avatarPreviewChangeBtn");
  const input        = document.getElementById("avatarUploadInput");

  if (!avatarEl || !previewModal) return;

  const openPreview = (e) => {
    if (e && e.target && e.target.closest("#avatarUploadButton")) return;

    const existingImg = avatarEl.querySelector("img");
    const src = selectedAvatarData || existingImg?.src || (typeof getDefaultAvatarDataUrl === "function" ? getDefaultAvatarDataUrl() : "");

    if (src) {
      if (previewImg) previewImg.src = src;
      if (typeof previewModal.showModal === "function") {
        previewModal.showModal();
      } else {
        previewModal.setAttribute("open", "");
      }
    } else {
      // If no photo yet, trigger file picker directly
      input?.click();
    }
  };

  avatarEl.addEventListener("click", openPreview);
  avatarEl.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openPreview(e);
    }
  });

  const closePreview = () => {
    if (typeof previewModal.close === "function") previewModal.close();
    else previewModal.removeAttribute("open");
  };

  previewModal.querySelectorAll("[data-close-avatar-preview]").forEach(btn => {
    btn.addEventListener("click", closePreview);
  });

  previewModal.addEventListener("click", e => {
    if (e.target === previewModal) closePreview();
  });

  changeBtn?.addEventListener("click", () => {
    closePreview();
    openAvatarChoiceModal();
  });
}

function initAvatarUpload() {
  const button = document.getElementById("avatarUploadButton");
  const input  = document.getElementById("avatarUploadInput");
  const choiceModal = document.getElementById("avatarChoiceModal");
  const triggerBtn  = document.getElementById("triggerUploadInputBtn");

  if (button) {
    button.addEventListener("click", (e) => {
      e.stopPropagation();
      openAvatarChoiceModal();
    });
  }

  if (triggerBtn) {
    triggerBtn.addEventListener("click", () => {
      closeAvatarChoiceModal();
      input?.click();
    });
  }

  if (choiceModal) {
    choiceModal.querySelectorAll("[data-close-avatar-choice]").forEach(btn => {
      btn.addEventListener("click", closeAvatarChoiceModal);
    });

    choiceModal.addEventListener("click", (e) => {
      if (e.target === choiceModal) closeAvatarChoiceModal();
    });
  }

  if (input) {
    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        showSiteToast("Vui lòng chọn tệp hình ảnh (JPG, PNG, WebP...).", "error");
        input.value = "";
        return;
      }
      openAvatarCropModal(file);
      input.value = "";
    });
  }

  initCropModalEvents();
  initAvatarLightbox();
}



async function changePassword(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const currentPassword = document.getElementById("currentPassword").value;
  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmNewPassword").value;
  const captchaAnswer = document.getElementById("passwordCaptchaAnswer").value.trim().toLowerCase();

  if (newPassword !== confirmPassword) {
    showSiteToast("Mật khẩu mới nhập lại không khớp.", "error");
    return;
  }

  if (!passwordCaptchaId || !passwordCaptchaAnswer) {
    showSiteToast("Vui lòng bấm Xin mã captcha trước.", "error");
    return;
  }

  if (captchaAnswer !== passwordCaptchaAnswer) {
    showSiteToast("Mã captcha không đúng.", "error");
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
    showSiteToast(data.message || "Đã đổi mật khẩu.");
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
  button.textContent = shouldShow ? "\u1ea8n" : "Hi\u1ec7n";
}

async function changePin(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const currentPin = document.getElementById("currentPin")?.value || "";
  const newPin = document.getElementById("newPin")?.value || "";
  const confirmPin = document.getElementById("confirmPin")?.value || "";

  if (!/^\d{6}$/.test(newPin)) {
    showSiteToast("Mã PIN phải gồm đúng 6 chữ số.", "error");
    return;
  }

  if (newPin !== confirmPin) {
    showSiteToast("Mã PIN nhập lại không khớp.", "error");
    return;
  }

  try {
    const data = await requestProfileJson(`${PROFILE_AUTH_API}/pin`, {
      method: "PUT",
      body: JSON.stringify({ currentPin, newPin, confirmPin })
    });

    clearProfilePinBoxes(form);

    if (data.user) {
      sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
      renderPinMode(data.user);
      renderUser();
    }

    sessionStorage.removeItem("foodhub_user_pin_locked");
    sessionStorage.setItem("foodhub_last_activity_at", String(Date.now()));
    showSiteToast(data.message || "Đã cập nhật mã PIN.");
  } catch (error) {
    showSiteToast(error.message, "error");
  }
}

document.getElementById("profileForm").addEventListener("submit", saveProfile);
document.getElementById("passwordForm").addEventListener("submit", changePassword);
document.getElementById("passwordForm").addEventListener("click", togglePasswordVisibility);
document.getElementById("pinForm")?.addEventListener("submit", changePin);
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
document.getElementById("profileFavoriteFoodsList")?.addEventListener("click", async event => {
  const addButton = event.target.closest("[data-profile-add-favorite]");
  const removeButton = event.target.closest("[data-profile-remove-favorite]");

  if (addButton) {
    addToCart(addButton.dataset.profileAddFavorite, event);
    return;
  }

  if (removeButton) {
    await toggleFoodFavorite(removeButton.dataset.profileRemoveFavorite, event);
    await loadProfileFavoriteFoods();
  }
});
document.querySelectorAll("[data-profile-tab]").forEach(button => {
  button.addEventListener("click", () => setProfileTab(button.dataset.profileTab));
});
initProfilePinBoxes();
drawPasswordCaptchaPlaceholder("Bấm Xin mã");
updatePasswordCaptchaButton();
loadProfile();
