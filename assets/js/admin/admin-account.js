const API_BASE_URL = window.FOODHUB_CONFIG?.API_BASE_URL || "http://localhost:3000/api";
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

let toastTimer;
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

function showAdminToast(message, type = "success") {
  const toast = document.getElementById("adminToast");

  if (!toast) return;

  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.className = `admin-toast ${type} show`;

  toastTimer = setTimeout(() => {
    toast.className = `admin-toast ${type}`;
  }, 2600);
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
    alert("Vui lòng đăng nhập bằng tài khoản quản trị.");
    window.location.href = "login.html";
  }
}

async function loadCurrentAdmin() {
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
  if (accountLoginLabel) accountLoginLabel.textContent = accountType === "customer" ? "Email" : "Ten dang nhap";
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

function setModeText() {
  if (isEditMode) {
    accountFormTitle.textContent = accountType === "customer"
      ? "Cập nhật tài khoản khách hàng"
      : "Cập nhật tài khoản nhân viên";
    accountBreadcrumb.textContent = "Cập nhật";
    passwordField.hidden = true;
    accountPassword.required = false;
    return;
  }

  accountFormTitle.textContent = accountType === "customer"
    ? "Tạo tài khoản khách hàng"
    : "Thêm tài khoản nhân viên";
  accountBreadcrumb.textContent = "Thêm mới";
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

  alert("Ban khong co quyen quan ly loai tai khoan nay.");
  window.location.href = "admin.html";
  return false;
}

async function loadAccount() {
  if (!isEditMode) return;

  const users = await requestJson(`${ADMIN_API}/users`);
  const account = users.find(item => String(item.id) === String(accountId));

  if (!account) {
    showAdminToast("Không tìm thấy tài khoản.", "error");
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
    payload.password = accountPassword.value;
  }

  try {
    await requestJson(isEditMode ? `${ADMIN_API}/users/${accountId}` : `${ADMIN_API}/users`, {
      method: isEditMode ? "PUT" : "POST",
      body: JSON.stringify(payload)
    });

    sessionStorage.setItem("foodhub_admin_section", "accounts");
    sessionStorage.setItem("foodhub_account_type", accountType === "customer" ? "customers" : "staff");
    showAdminToast(isEditMode ? "Đã cập nhật tài khoản." : "Đã tạo tài khoản.");
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

accountRole.addEventListener("change", () => {
  syncAccountMode();
});

accountForm.addEventListener("submit", saveAccount);

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
