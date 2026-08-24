const API_BASE_URL = window.FOODHUB_CONFIG?.API_BASE_URL || "http://localhost:3000/api";
// Trang tạo/sửa thông báo trong admin.
// File này quản lý ngày đăng, ngày hết hạn và gửi nội dung thông báo về API quản trị.
const ADMIN_API = `${API_BASE_URL}/admin`;
const AUTH_TOKEN_KEY = "foodhub_token";
const AUTH_USER_KEY = "foodhub_user";

localStorage.removeItem(AUTH_TOKEN_KEY);
localStorage.removeItem(AUTH_USER_KEY);

const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
const user = JSON.parse(sessionStorage.getItem(AUTH_USER_KEY) || "null");
const params = new URLSearchParams(window.location.search);
const announcementId = params.get("id");
const isEditMode = Boolean(announcementId);

const announcementForm = document.getElementById("announcementForm");
const announcementTitle = document.getElementById("announcementTitle");
const announcementContent = document.getElementById("announcementContent");
const announcementPublishedAt = document.getElementById("announcementPublishedAt");
const announcementValidityDays = document.getElementById("announcementValidityDays");
const announcementExpiresAt = document.getElementById("announcementExpiresAt");
const announcementActive = document.getElementById("announcementActive");
const announcementFormTitle = document.getElementById("announcementFormTitle");
const announcementBreadcrumb = document.getElementById("announcementBreadcrumb");

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
    alert("Vui lòng đăng nhập bằng tài khoản quản trị.");
    window.location.href = "login.html";
  }
}

async function requestJson(url, options = {}) {
  // Wrapper gọi API admin cho thông báo, tự gắn token và xử lý hết phiên đăng nhập.
  // Các thao tác tạo/sửa phụ thuộc backend kiểm quyền ANNOUNCEMENTS_MANAGE.
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

function setModeText() {
  if (isEditMode) {
    announcementFormTitle.textContent = "Cập nhật thong tin thông báo";
    announcementBreadcrumb.textContent = "Cập nhật";
    return;
  }

  announcementFormTitle.textContent = "Thêm mới thông báo";
  announcementBreadcrumb.textContent = "Thêm mới";
}

function toDatetimeLocal(value) {
  if (!value) return "";

  const date = new Date(value);
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

function getPublishDate() {
  if (announcementPublishedAt.value) {
    return new Date(announcementPublishedAt.value);
  }

  return new Date();
}

function updateExpiresAtPreview() {
  // Tính trước ngày hết hạn dựa trên ngày đăng và số ngày hiệu lực.
  // Output chỉ điền vào input expiresAt để admin kiểm tra trước khi lưu.
  const days = Number(announcementValidityDays.value);

  if (!Number.isFinite(days) || days <= 0) {
    announcementExpiresAt.value = "";
    return;
  }

  const expiresAt = getPublishDate();
  expiresAt.setDate(expiresAt.getDate() + days);
  announcementExpiresAt.value = toDatetimeLocal(expiresAt);
}

async function loadAnnouncement() {
  if (!isEditMode) return;

  const announcement = await requestJson(`${ADMIN_API}/announcements/${announcementId}`);

  announcementTitle.value = announcement.title || "";
  announcementContent.value = announcement.content || "";
  announcementPublishedAt.value = toDatetimeLocal(announcement.published_at);
  announcementExpiresAt.value = toDatetimeLocal(announcement.expires_at);
  announcementActive.checked = Boolean(announcement.is_active);
}

async function saveAnnouncement(event) {
  event.preventDefault();

  const payload = {
    title: announcementTitle.value.trim(),
    content: announcementContent.value.trim(),
    publishedAt: announcementPublishedAt.value || null,
    validityDays: announcementValidityDays.value || null,
    expiresAt: announcementValidityDays.value ? null : (announcementExpiresAt.value || null),
    isActive: announcementActive.checked
  };

  try {
    await requestJson(isEditMode ? `${ADMIN_API}/announcements/${announcementId}` : `${ADMIN_API}/announcements`, {
      method: isEditMode ? "PUT" : "POST",
      body: JSON.stringify(payload)
    });

    sessionStorage.setItem("foodhub_admin_section", "announcements");
    showAdminToast(isEditMode ? "Đã cập nhật thông báo." : "Đã tạo thông báo.");
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

announcementForm.addEventListener("submit", saveAnnouncement);
announcementPublishedAt.addEventListener("input", updateExpiresAtPreview);
announcementValidityDays.addEventListener("input", updateExpiresAtPreview);

requireAdminSession();
setModeText();
loadAnnouncement().catch(error => showAdminToast(error.message, "error"));
