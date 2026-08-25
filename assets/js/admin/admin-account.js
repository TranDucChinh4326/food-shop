const API_BASE_URL = window.FOODHUB_CONFIG?.API_BASE_URL || "http://localhost:3000/api";
// Trang tạo/sửa tài khoản trong admin.
// File này đọc quyền hiện có, hiển thị form theo loại khách/nhân viên và gửi thay đổi về API quản trị.
const ADMIN_API = `${API_BASE_URL}/admin`;
const AUTH_TOKEN_KEY = "foodhub_token";
const AUTH_USER_KEY = "foodhub_user";

localStorage.removeItem(AUTH_TOKEN_KEY);
localStorage.removeItem(AUTH_USER_KEY);

const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
const user = JSON.parse(sessionStorage.getItem(AUTH_USER_KEY) || "null");
const params = new URLSearchParams(window.location.search);
const accountId = params.get("id");
const isEditMode = Boolean(accountId);
const accountType = params.get("type") === "customer" ? "customer" : "staff";

const accountForm = document.getElementById("accountForm");
const accountName = document.getElementById("accountName");
const accountEmail = document.getElementById("accountEmail");
const accountPassword = document.getElementById("accountPassword");
const passwordField = document.getElementById("passwordField");
const accountRole = document.getElementById("accountRole");
const accountPermissions = document.getElementById("accountPermissions");
const permissionPanel = document.getElementById("permissionPanel");
const accountFormTitle = document.getElementById("accountFormTitle");
const accountBreadcrumb = document.getElementById("accountBreadcrumb");
const accountBackLink = document.getElementById("accountBackLink");
const accountCancelLink = document.getElementById("accountCancelLink");
const accountLoginLabel = document.getElementById("accountLoginLabel");

let adminPermissions = [];
let currentAccountPermissions = [];
let currentAdmin = {
  ...user,
  permissions: Array.isArray(user?.permissions) ? user.permissions : []
};

function isRootAdmin() {
  return String(currentAdmin?.role || "").toUpperCase() === "ADMIN";
}

function hasAdminPermission(permission) {
  if (isRootAdmin()) return true;
  return Array.isArray(currentAdmin?.permissions) && currentAdmin.permissions.includes(permission);
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function showAdminToast(message, type = "success") {
  let stack = document.getElementById("adminToastStack");
  if (!stack) {
    stack = document.createElement("div");
    stack.id = "adminToastStack";
    stack.className = "toast-stack admin-toast-stack";
    document.body.appendChild(stack);
  }

  const isError = type === "error";
  const toast = document.createElement("div");
  toast.className = `admin-toast ${type}`;
  toast.innerHTML = `
    <div class="admin-toast-card">
      <span class="admin-toast-icon" aria-hidden="true">
        <span class="admin-toast-symbol">${isError ? "!" : "✓"}</span>
      </span>
      <div>
        <strong>${isError ? "Không thể xử lý" : "Cập nhật thành công"}</strong>
        <p>${escapeHtml(message)}</p>
      </div>
      <i aria-hidden="true"></i>
    </div>
  `;
  stack.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("show"));

  setTimeout(() => {
    toast.classList.add("hide");
    setTimeout(() => toast.remove(), 280);
  }, 3600);
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
}

function requireAdminSession() {
  const role = String(user?.role || "").toUpperCase();

  if (!token || role === "USER") {
    showAdminToast("Vui lòng đăng nhập bằng tài khoản quản trị.", "error");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 500);
  }
}

async function loadCurrentAdmin() {
  // Lấy lại thông tin admin hiện tại từ backend.
  // Cần để kiểm tra quyền mới nhất trước khi cho tạo/sửa user hoặc nhân viên.
  const data = await requestJson(`${ADMIN_API}/me`);
  currentAdmin = data;
  sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify({ ...user, ...data }));
  document.querySelectorAll("[data-admin-user-name]").forEach(node => {
    node.textContent = data.fullname || data.email || "admin";
  });
  return data;
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
    window.location.href = "login.html";
    throw new Error(data.message || "Phiên đăng nhập da hết hạn.");
  }

  if (!response.ok) {
    throw new Error(data.message || "Không thể xử lý yêu cầu.");
  }

  return data;
}

function renderPermissionChecks(selected = []) {
  // Render danh sách checkbox quyền cho tài khoản nhân viên.
  // Input selected là quyền đã có; output là UI để admin chọn quyền gửi về backend.
  accountPermissions.innerHTML = adminPermissions.map(permission => `
    <label class="permission-item">
      <input type="checkbox" value="${permission.value}" ${selected.includes(permission.value) ? "checked" : ""}>
      <span>${permission.label}</span>
    </label>
  `).join("");
}

function isCustomerMode() {
  return accountType === "customer";
}

function getAccountRoleValue(rawRole = accountRole?.value) {
  if (accountType === "customer") return "USER";
  const normalizedRole = String(rawRole || "").toUpperCase();
  return normalizedRole && normalizedRole !== "USER" ? normalizedRole : "STAFF_SALES";
}

function syncAccountMode() {
  const listType = accountType === "customer" ? "customers" : "staff";
  const listUrl = `admin.html?section=accounts&accountType=${listType}`;

  if (accountBackLink) accountBackLink.href = listUrl;
  if (accountCancelLink) accountCancelLink.href = listUrl;
  if (accountLoginLabel) accountLoginLabel.textContent = accountType === "customer" ? "Email" : "T\u00ean \u0111\u0103ng nh\u1eadp";
  if (accountEmail) {
    accountEmail.type = accountType === "customer" ? "email" : "text";
    accountEmail.placeholder = accountType === "customer" ? "name@example.com" : "vd: ducchinhnv";
  }

  accountRole.value = getAccountRoleValue();

  if (permissionPanel) {
    permissionPanel.hidden = true;
    permissionPanel.style.display = "none";
  }
}

function getCheckedPermissions() {
  return [...accountPermissions.querySelectorAll("input[type='checkbox']:checked")].map(input => input.value);
}

function getAdminPasswordError(password) {
  const value = String(password || "");
  if (value.length < 6) return "Mật khẩu phải có ít nhất 6 ký tự.";
  return "";
}

function validatePasswordInput({ allowEmpty = false } = {}) {
  const password = accountPassword.value.trim();
  const error = allowEmpty && !password ? "" : getAdminPasswordError(password);
  accountPassword.setCustomValidity(error);
  passwordField?.classList.toggle("is-password-valid", Boolean(password) && !error);
  passwordField?.classList.toggle("is-password-invalid", Boolean(error));
  return error;
}

function setModeText() {
  if (isEditMode) {
    accountFormTitle.textContent = accountType === "customer"
      ? "C\u1eadp nh\u1eadt t\u00e0i kho\u1ea3n kh\u00e1ch h\u00e0ng"
      : "C\u1eadp nh\u1eadt t\u00e0i kho\u1ea3n nh\u00e2n vi\u00ean";
    accountBreadcrumb.textContent = "C\u1eadp nh\u1eadt";
    passwordField.hidden = false;
    accountPassword.required = false;
    accountPassword.placeholder = "\u0110\u1ec3 tr\u1ed1ng n\u1ebfu kh\u00f4ng \u0111\u1ed5i m\u1eadt kh\u1ea9u";
    return;
  }

  accountFormTitle.textContent = accountType === "customer"
    ? "T\u1ea1o t\u00e0i kho\u1ea3n kh\u00e1ch h\u00e0ng"
    : "Th\u00eam t\u00e0i kho\u1ea3n nh\u00e2n vi\u00ean";
  accountBreadcrumb.textContent = "Th\u00eam m\u1edbi";
  passwordField.hidden = false;
  accountPassword.placeholder = "Nh\u1eadp m\u1eadt kh\u1ea9u ban \u0111\u1ea7u";
  accountPassword.required = true;
}

async function loadPermissions() {
  if (!hasAdminPermission("roles.manage")) {
    adminPermissions = [];
    renderPermissionChecks();
    return;
  }

  const data = await requestJson(`${ADMIN_API}/permissions`);
  adminPermissions = data.permissions || [];
  renderPermissionChecks();
}

function ensureAccountManageAccess() {
  const allowed = accountType === "customer"
    ? hasAdminPermission("users.manage")
    : hasAdminPermission("staff.manage");

  if (allowed) return true;

  showAdminToast("Bạn không có quyền quản lý loại tài khoản này.", "error");
  setTimeout(() => {
    window.location.href = "admin.html";
  }, 500);
  return false;
}

async function loadAccount() {
  if (!isEditMode) return;

  const users = await requestJson(`${ADMIN_API}/users`);
  const account = users.find(item => String(item.id) === String(accountId));

  if (!account) {
    showAdminToast("Kh\u00f4ng t\u00ecm th\u1ea5y t\u00e0i kho\u1ea3n.", "error");
    return;
  }

  accountName.value = account.fullname || "";
  accountEmail.value = accountType === "customer" ? (account.email || "") : (account.username || "");
  accountRole.value = getAccountRoleValue(account.role);
  currentAccountPermissions = Array.isArray(account.permissions) ? account.permissions : [];
  syncAccountMode();
}

async function saveAccount(event) {
  event.preventDefault();

  const resolvedRole = getAccountRoleValue();
  const payload = {
    fullname: accountName.value.trim(),
    email: accountType === "customer" ? accountEmail.value.trim() : "",
    username: accountType === "customer" ? "" : accountEmail.value.trim(),
    role: resolvedRole,
    permissions: isEditMode ? currentAccountPermissions : []
  };

  if (!isEditMode) {
    const passwordError = validatePasswordInput();
    if (passwordError) {
      showAdminToast(passwordError, "error");
      accountPassword.focus();
      return;
    }
    payload.password = accountPassword.value;
  } else if (accountPassword.value.trim()) {
    const passwordError = validatePasswordInput({ allowEmpty: true });
    if (passwordError) {
      showAdminToast(passwordError, "error");
      accountPassword.focus();
      return;
    }
  }

  try {
    await requestJson(isEditMode ? `${ADMIN_API}/users/${accountId}` : `${ADMIN_API}/users`, {
      method: isEditMode ? "PUT" : "POST",
      body: JSON.stringify(payload)
    });

    if (isEditMode && accountPassword.value.trim()) {
      await requestJson(`${ADMIN_API}/users/${accountId}/password`, {
        method: "PUT",
        body: JSON.stringify({ newPassword: accountPassword.value.trim() })
      });
    }

    sessionStorage.setItem("foodhub_admin_section", "accounts");
    sessionStorage.setItem("foodhub_account_type", accountType === "customer" ? "customers" : "staff");
    showAdminToast(isEditMode ? "\u0110\u00e3 c\u1eadp nh\u1eadt t\u00e0i kho\u1ea3n." : "\u0110\u00e3 t\u1ea1o t\u00e0i kho\u1ea3n.");
    setTimeout(() => {
      window.location.href = `admin.html?section=accounts&accountType=${accountType === "customer" ? "customers" : "staff"}`;
    }, 700);
  } catch (error) {
    showAdminToast(error.message, "error");
  }
}

document.getElementById("logoutBtn").addEventListener("click", () => {
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_USER_KEY);
  sessionStorage.removeItem("foodhub_cart");
  window.location.href = "login.html";
});

accountForm.addEventListener("submit", saveAccount);
accountPassword.addEventListener("input", () => validatePasswordInput({ allowEmpty: isEditMode }));

async function initAccountPage() {
  requireAdminSession();
  await loadCurrentAdmin();
  if (!ensureAccountManageAccess()) return;

  setModeText();
  syncAccountMode();
  await loadPermissions();
  await loadAccount();
  syncAccountMode();
}

initAccountPage().catch(error => showAdminToast(error.message, "error"));
