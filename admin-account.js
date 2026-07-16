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

const accountForm = document.getElementById("accountForm");
const accountName = document.getElementById("accountName");
const accountEmail = document.getElementById("accountEmail");
const accountPassword = document.getElementById("accountPassword");
const passwordField = document.getElementById("passwordField");
const accountRole = document.getElementById("accountRole");
const accountPermissions = document.getElementById("accountPermissions");
const accountPageTitle = document.getElementById("accountPageTitle");
const accountFormTitle = document.getElementById("accountFormTitle");
const accountBreadcrumb = document.getElementById("accountBreadcrumb");

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
    alert("Vui long dang nhap bang tai khoan quan tri.");
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
    throw new Error(data.message || "Phien dang nhap da het han.");
  }

  if (!response.ok) {
    throw new Error(data.message || "Khong the xu ly yeu cau.");
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

function getCheckedPermissions() {
  return [...accountPermissions.querySelectorAll("input[type='checkbox']:checked")].map(input => input.value);
}

function setModeText() {
  if (isEditMode) {
    accountPageTitle.textContent = "Cap nhat tai khoan";
    accountFormTitle.textContent = "Cap nhat thong tin tai khoan";
    accountBreadcrumb.textContent = "Cap nhat";
    passwordField.hidden = true;
    accountPassword.required = false;
    return;
  }

  accountPageTitle.textContent = "Them tai khoan";
  accountFormTitle.textContent = "Them moi tai khoan";
  accountBreadcrumb.textContent = "Them moi";
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
    showAdminToast("Khong tim thay tai khoan.", "error");
    return;
  }

  accountName.value = account.fullname || "";
  accountEmail.value = account.email || "";
  accountRole.value = account.role || "USER";
  renderPermissionChecks(account.permissions || []);
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
    showAdminToast(isEditMode ? "Da cap nhat tai khoan." : "Da tao tai khoan.");
    setTimeout(() => {
      window.location.href = "admin.html";
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
  accountPermissions.closest("div").style.display = accountRole.value === "USER" ? "none" : "block";
});

accountForm.addEventListener("submit", saveAccount);

requireAdminSession();
setModeText();
loadPermissions()
  .then(loadAccount)
  .then(() => {
    accountPermissions.closest("div").style.display = accountRole.value === "USER" ? "none" : "block";
  })
  .catch(error => showAdminToast(error.message, "error"));
