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

let toastTimer;
let adminPermissions = [];

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
    alert("Vui lòng đăng nhập bang tài khoản quản trị.");
    window.location.href = "login.html";
  }
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
  return accountType === "customer" || accountRole.value === "USER";
}

function syncAccountMode() {
  const listType = accountType === "customer" ? "customers" : "staff";
  const listUrl = `admin.html?section=accounts&accountType=${listType}`;

  if (accountBackLink) accountBackLink.href = listUrl;
  if (accountCancelLink) accountCancelLink.href = listUrl;

  [...accountRole.options].forEach(option => {
    if (accountType === "customer") {
      option.hidden = option.value !== "USER";
    } else {
      option.hidden = option.value === "USER";
    }
  });

  if (!isEditMode) {
    accountRole.value = accountType === "customer" ? "USER" : "STAFF_SALES";
  }

  if (permissionPanel) {
    permissionPanel.style.display = isCustomerMode() ? "none" : "block";
    const note = permissionPanel.querySelector(".form-note");
    if (note) {
      note.textContent = isCustomerMode()
        ? "Khách hàng không được cấp quyền quản trị."
        : "Chọn cac khu vuc nhân viên được phép xem va thao tác trong trang quản trị.";
    }
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
  const data = await requestJson(`${ADMIN_API}/permissions`);
  adminPermissions = data.permissions || [];
  renderPermissionChecks();
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
  accountEmail.value = account.email || "";
  accountRole.value = account.role || "USER";
  renderPermissionChecks(account.permissions || []);
  syncAccountMode();
}

async function saveAccount(event) {
  event.preventDefault();

  const payload = {
    fullname: accountName.value.trim(),
    email: accountEmail.value.trim(),
    role: accountRole.value,
    permissions: accountRole.value === "USER" ? [] : getCheckedPermissions()
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

requireAdminSession();
setModeText();
syncAccountMode();
loadPermissions()
  .then(loadAccount)
  .then(() => {
    syncAccountMode();
  })
  .catch(error => showAdminToast(error.message, "error"));
