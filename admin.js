const API_BASE_URL = window.FOODHUB_CONFIG?.API_BASE_URL || "http://localhost:3000/api";
const ADMIN_API = `${API_BASE_URL}/admin`;
const AUTH_TOKEN_KEY = "foodhub_token";
const AUTH_USER_KEY = "foodhub_user";

localStorage.removeItem(AUTH_TOKEN_KEY);
localStorage.removeItem(AUTH_USER_KEY);

const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
const user = JSON.parse(sessionStorage.getItem(AUTH_USER_KEY) || "null");

const ordersList = document.getElementById("ordersList");
const foodsList = document.getElementById("foodsList");
const ordersCount = document.getElementById("ordersCount");
const foodsCount = document.getElementById("foodsCount");
const usersList = document.getElementById("usersList");
const announcementsList = document.getElementById("announcementsList");
const staffForm = document.getElementById("staffForm");
const staffPermissions = document.getElementById("staffPermissions");
const foodSearch = document.getElementById("foodSearch");
const foodCategoryFilter = document.getElementById("foodCategoryFilter");
const foodPageSize = document.getElementById("foodPageSize");
const foodCategoryTitle = document.getElementById("foodCategoryTitle");
const foodCreateLink = document.getElementById("foodCreateLink");
const userTypeFilter = document.getElementById("userTypeFilter");
const userSearch = document.getElementById("userSearch");
const announcementSearch = document.getElementById("announcementSearch");
const announcementStatusFilter = document.getElementById("announcementStatusFilter");
const announcementsCount = document.getElementById("announcementsCount");
const discountsList = document.getElementById("discountsList");
const discountForm = document.getElementById("discountForm");
const discountSearch = document.getElementById("discountSearch");
const discountStatusFilter = document.getElementById("discountStatusFilter");
const discountPageSize = document.getElementById("discountPageSize");
const statsSummary = document.getElementById("statsSummary");
const statsTopFoods = document.getElementById("statsTopFoods");
const statsDaily = document.getElementById("statsDaily");
const statsFromDate = document.getElementById("statsFromDate");
const statsToDate = document.getElementById("statsToDate");
const navButtons = [...document.querySelectorAll("[data-admin-target]")];
const navToggles = [...document.querySelectorAll("[data-admin-toggle]")];
const adminSections = [...document.querySelectorAll("[data-admin-section]")];
const shortcutButtons = [...document.querySelectorAll("[data-admin-shortcut]")];
const pageParams = new URLSearchParams(window.location.search);
const statusLabels = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  delivering: "Đang giao",
  done: "Hoàn tất",
  cancelled: "Đã hủy"
};

let toastTimer;
let adminPermissions = [];
let cachedFoods = [];
let foodSearchTimer;
let activeFoodCategory = "all";
let activeFoodSubcategory = "all";
let foodsPage = 1;
let foodsPerPage = 5;
let userSearchTimer;
let cachedUsers = [];
let usersPage = 1;
const USERS_PER_PAGE = 5;
let announcementSearchTimer;
let cachedAnnouncements = [];
let announcementsPage = 1;
const ANNOUNCEMENTS_PER_PAGE = 5;
let discountSearchTimer;
let cachedDiscounts = [];
let discountsPage = 1;
let discountsPerPage = 5;
const FOOD_CATEGORY_TITLES = {
  all: "Tat ca mon",
  food: "Do an",
  drink: "Nuoc uong"
};

function setAdminNavGroupOpen(toggleName, isOpen) {
  const toggle = document.querySelector(`[data-admin-toggle="${toggleName}"]`);
  const group = toggle?.closest(".admin-nav-group");

  if (!toggle || !group) return;

  group.classList.toggle("is-open", isOpen);
  toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
}

function showAdminSection(sectionId) {
  const target = adminSections.some(section => section.dataset.adminSection === sectionId) ? sectionId : "overview";

  navButtons.forEach(button => {
    const isFoodNav = button.dataset.adminTarget === "foods";
    const matchesFoodCategory = !button.dataset.foodCategory || button.dataset.foodCategory === activeFoodCategory;
    button.classList.toggle("active", button.dataset.adminTarget === target && (!isFoodNav || matchesFoodCategory));
  });

  adminSections.forEach(section => {
    section.classList.toggle("active", section.dataset.adminSection === target);
  });

  if (target === "foods") {
    setAdminNavGroupOpen("foods-menu", true);
  }

  sessionStorage.setItem("foodhub_admin_section", target);
}

function formatMoney(number) {
  return Number(number).toLocaleString("vi-VN") + "đ";
}

function formatDateTime(value) {
  if (!value) return "Chua hen ngay";
  return new Date(value).toLocaleString("vi-VN");
}

function formatRole(role) {
  const roles = {
    USER: "Khach hang",
    STAFF_SALES: "Nhan vien ban hang",
    STAFF_CONTENT: "Quan ly mon an",
    STAFF_MANAGER: "Quan ly nhan vien",
    ADMIN: "Admin"
  };

  return roles[role] || role || "Khach hang";
}

function formatAnnouncementStatus(status) {
  const statuses = {
    active: "Hoat dong",
    hidden: "Da an",
    expired: "Het han",
    scheduled: "Sap hien thi"
  };

  return statuses[status] || status || "Khong ro";
}

function formatDiscountStatus(status) {
  const statuses = {
    active: "Hoat dong",
    hidden: "Da an",
    expired: "Het han",
    scheduled: "Sap dien ra",
    soldout: "Het luot"
  };

  return statuses[status] || status || "Khong ro";
}

function formatDiscountValue(discount) {
  if (discount.discount_type === "fixed") {
    return formatMoney(discount.discount_value);
  }

  return `${Number(discount.discount_value).toLocaleString("vi-VN")}%`;
}

function formatDateInputValue(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function renderSimpleTable(headers, rows, emptyText) {
  if (!rows.length) return `<p class="empty-note">${emptyText}</p>`;

  return `
    <div class="table-wrap">
      <table class="admin-table compact-table">
        <thead>
          <tr>${headers.map(header => `<th>${header}</th>`).join("")}</tr>
        </thead>
        <tbody>${rows.join("")}</tbody>
      </table>
    </div>
  `;
}

function editIcon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20h9"></path>
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"></path>
    </svg>
  `;
}

function keyIcon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="7.5" cy="14.5" r="3.5"></circle>
      <path d="M10 12 20 2"></path>
      <path d="m15 7 2 2"></path>
      <path d="m17 5 2 2"></path>
    </svg>
  `;
}

function trashIcon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 6h18"></path>
      <path d="M8 6V4h8v2"></path>
      <path d="M19 6l-1 14H6L5 6"></path>
      <path d="M10 11v5"></path>
      <path d="M14 11v5"></path>
    </svg>
  `;
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
    alert("Vui lòng đăng nhập bằng tài khoản admin.");
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
    throw new Error(data.message || "Không thể xử lý yêu cầu.");
  }

  return data;
}

function renderPermissionChecks(container, selected = [], name = "permissions") {
  if (!container) return;

  container.innerHTML = adminPermissions.map(permission => `
    <label class="permission-item">
      <input type="checkbox" name="${name}" value="${permission.value}" ${selected.includes(permission.value) ? "checked" : ""}>
      <span>${permission.label}</span>
    </label>
  `).join("");
}

function getCheckedPermissions(container) {
  return [...container.querySelectorAll("input[type='checkbox']:checked")].map(input => input.value);
}

async function loadAdminPermissions() {
  try {
    const data = await requestJson(`${ADMIN_API}/permissions`);
    adminPermissions = data.permissions || [];
    renderPermissionChecks(staffPermissions);
  } catch (error) {
    showAdminToast(error.message, "error");
  }
}

async function loadUsers() {
  if (!usersList) return;

  usersList.textContent = "Dang tai tai khoan...";

  try {
    const params = new URLSearchParams({
      type: userTypeFilter?.value || "all",
      q: userSearch?.value || ""
    });
    const users = await requestJson(`${ADMIN_API}/users?${params.toString()}`);

    if (users.length === 0) {
      cachedUsers = [];
      usersPage = 1;
      usersList.textContent = "Chua co tai khoan phu hop.";
      return;
    }

    cachedUsers = users;
    usersPage = Math.min(usersPage, Math.ceil(cachedUsers.length / USERS_PER_PAGE)) || 1;
    renderUsersTable();
  } catch (error) {
    usersList.textContent = error.message;
    showAdminToast(error.message, "error");
  }
}

function renderUsersTable() {
  if (!usersList) return;

  const totalUsers = cachedUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalUsers / USERS_PER_PAGE));
  usersPage = Math.min(Math.max(usersPage, 1), totalPages);

  const startIndex = (usersPage - 1) * USERS_PER_PAGE;
  const pageUsers = cachedUsers.slice(startIndex, startIndex + USERS_PER_PAGE);
  const from = totalUsers === 0 ? 0 : startIndex + 1;
  const to = startIndex + pageUsers.length;

  if (totalUsers === 0) {
    usersList.textContent = "Chua co tai khoan phu hop.";
    return;
  }

    usersList.innerHTML = `
      <div class="table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Ho ten</th>
              <th>Email</th>
              <th>Vai tro</th>
              <th>Xac thuc</th>
              <th>Trang thai</th>
              <th>Chuc nang</th>
            </tr>
          </thead>
          <tbody>
            ${pageUsers.map((account, index) => `
              <tr class="account-row" data-user-id="${account.id}">
                <td>${startIndex + index + 1}</td>
                <td>
                  <strong>${escapeHtml(account.fullname)}</strong>
                  <small>${account.passwordSet ? "Co mat khau" : "Chua dat mat khau"}</small>
                </td>
                <td>${escapeHtml(account.email)}</td>
                <td>${formatRole(account.role)}</td>
                <td>${account.emailVerified ? "Da xac thuc" : "Chua xac thuc"}</td>
                <td><span class="account-status ${account.isActive ? "active" : "locked"}">${account.isActive ? "Activate" : "Lock"}</span></td>
                <td>
                  <div class="table-actions">
                    <a class="icon-btn edit" href="admin-account.html?id=${account.id}" title="Sua" aria-label="Sua tai khoan">${editIcon()}</a>
                    <button type="button" class="icon-btn key" title="Dat mat khau" aria-label="Dat mat khau" data-reset-password="${account.id}">${keyIcon()}</button>
                    <button type="button" class="icon-btn delete" title="${account.isActive ? "Khoa" : "Mo khoa"}" aria-label="${account.isActive ? "Khoa tai khoan" : "Mo khoa tai khoan"}" data-toggle-user="${account.id}" data-active="${account.isActive ? "0" : "1"}">${trashIcon()}</button>
                  </div>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
      <div class="table-footer">
        Dang hien thi tu ${from} den ${to} cua ${totalUsers} ket qua
        <div class="pager">
          <button type="button" data-users-page="prev" ${usersPage === 1 ? "disabled" : ""}>&lsaquo;</button>
          ${Array.from({ length: totalPages }, (_, index) => `
            <button type="button" class="${usersPage === index + 1 ? "active" : ""}" data-users-page="${index + 1}">${index + 1}</button>
          `).join("")}
          <button type="button" data-users-page="next" ${usersPage === totalPages ? "disabled" : ""}>&rsaquo;</button>
        </div>
      </div>
    `;
}

async function loadAnnouncements() {
  if (!announcementsList) return;

  announcementsList.textContent = "Dang tai thong bao...";

  try {
    const params = new URLSearchParams({
      q: announcementSearch?.value || "",
      status: announcementStatusFilter?.value || "all"
    });
    const announcements = await requestJson(`${ADMIN_API}/announcements?${params.toString()}`);

    cachedAnnouncements = announcements;
    if (announcementsCount) announcementsCount.textContent = announcements.length;
    announcementsPage = Math.min(announcementsPage, Math.ceil(cachedAnnouncements.length / ANNOUNCEMENTS_PER_PAGE)) || 1;
    renderAnnouncementsTable();
  } catch (error) {
    announcementsList.textContent = error.message;
    showAdminToast(error.message, "error");
  }
}

function renderAnnouncementsTable() {
  if (!announcementsList) return;

  const total = cachedAnnouncements.length;
  const totalPages = Math.max(1, Math.ceil(total / ANNOUNCEMENTS_PER_PAGE));
  announcementsPage = Math.min(Math.max(announcementsPage, 1), totalPages);

  const startIndex = (announcementsPage - 1) * ANNOUNCEMENTS_PER_PAGE;
  const pageItems = cachedAnnouncements.slice(startIndex, startIndex + ANNOUNCEMENTS_PER_PAGE);
  const from = total === 0 ? 0 : startIndex + 1;
  const to = startIndex + pageItems.length;

  if (total === 0) {
    announcementsList.textContent = "Chua co thong bao phu hop.";
    return;
  }

  announcementsList.innerHTML = `
    <div class="table-wrap">
      <table class="admin-table announcements-table">
        <thead>
          <tr>
            <th>STT</th>
            <th>Tieu de</th>
            <th>Ngay dang</th>
            <th>Het hieu luc</th>
            <th>Trang thai</th>
            <th>Chuc nang</th>
          </tr>
        </thead>
        <tbody>
          ${pageItems.map((item, index) => `
            <tr>
              <td>${startIndex + index + 1}</td>
              <td>
                <strong>${escapeHtml(item.title)}</strong>
                <small>${escapeHtml(item.content || "Khong co noi dung mo ta")}</small>
              </td>
              <td>${formatDateTime(item.published_at)}</td>
              <td>${item.expires_at ? formatDateTime(item.expires_at) : "Khong gioi han"}</td>
              <td><span class="account-status ${item.status === "active" ? "active" : "locked"}">${formatAnnouncementStatus(item.status)}</span></td>
              <td>
                <div class="table-actions">
                  <a class="icon-btn edit" href="admin-announcement.html?id=${item.id}" title="Sua" aria-label="Sua thong bao">${editIcon()}</a>
                  <button type="button" class="icon-btn delete" title="Xoa" aria-label="Xoa thong bao" data-hide-announcement="${item.id}">${trashIcon()}</button>
                </div>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
    <div class="table-footer">
      Dang hien thi tu ${from} den ${to} cua ${total} ket qua
      <div class="pager">
        <button type="button" data-announcements-page="prev" ${announcementsPage === 1 ? "disabled" : ""}>&lsaquo;</button>
        ${Array.from({ length: totalPages }, (_, index) => `
          <button type="button" class="${announcementsPage === index + 1 ? "active" : ""}" data-announcements-page="${index + 1}">${index + 1}</button>
        `).join("")}
        <button type="button" data-announcements-page="next" ${announcementsPage === totalPages ? "disabled" : ""}>&rsaquo;</button>
      </div>
    </div>
  `;
}

function resetDiscountForm() {
  if (!discountForm) return;

  discountForm.reset();
  document.getElementById("discountId").value = "";
  document.getElementById("discountMinOrder").value = "0";
  document.getElementById("discountIsActive").value = "1";
  document.getElementById("saveDiscountBtn").textContent = "Luu ma";
}

function fillDiscountForm(discount) {
  document.getElementById("discountId").value = discount.id;
  document.getElementById("discountCode").value = discount.code || "";
  document.getElementById("discountName").value = discount.name || "";
  document.getElementById("discountType").value = discount.discount_type || "percent";
  document.getElementById("discountValue").value = discount.discount_value || "";
  document.getElementById("discountMinOrder").value = discount.min_order || 0;
  document.getElementById("discountMaxDiscount").value = discount.max_discount ?? "";
  document.getElementById("discountUsageLimit").value = discount.usage_limit ?? "";
  document.getElementById("discountStartsAt").value = formatDateInputValue(discount.starts_at);
  document.getElementById("discountExpiresAt").value = formatDateInputValue(discount.expires_at);
  document.getElementById("discountIsActive").value = discount.is_active ? "1" : "0";
  document.getElementById("saveDiscountBtn").textContent = "Cap nhat ma";
  discountForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function readDiscountPayload() {
  return {
    code: document.getElementById("discountCode").value,
    name: document.getElementById("discountName").value,
    discountType: document.getElementById("discountType").value,
    discountValue: document.getElementById("discountValue").value,
    minOrder: document.getElementById("discountMinOrder").value,
    maxDiscount: document.getElementById("discountMaxDiscount").value,
    usageLimit: document.getElementById("discountUsageLimit").value,
    startsAt: document.getElementById("discountStartsAt").value || null,
    expiresAt: document.getElementById("discountExpiresAt").value || null,
    isActive: document.getElementById("discountIsActive").value === "1"
  };
}

async function saveDiscount(event) {
  event.preventDefault();

  const discountId = document.getElementById("discountId").value;
  const payload = readDiscountPayload();

  try {
    await requestJson(`${ADMIN_API}/discounts${discountId ? `/${discountId}` : ""}`, {
      method: discountId ? "PUT" : "POST",
      body: JSON.stringify(payload)
    });

    showAdminToast(discountId ? "Da cap nhat ma giam gia." : "Da tao ma giam gia.");
    resetDiscountForm();
    await loadDiscounts();
  } catch (error) {
    showAdminToast(error.message, "error");
  }
}

async function loadDiscounts() {
  if (!discountsList) return;

  discountsList.textContent = "Dang tai ma giam gia...";

  try {
    const params = new URLSearchParams({
      q: discountSearch?.value || "",
      status: discountStatusFilter?.value || "all"
    });
    const discounts = await requestJson(`${ADMIN_API}/discounts?${params.toString()}`);

    cachedDiscounts = discounts;
    discountsPage = Math.min(discountsPage, Math.ceil(cachedDiscounts.length / discountsPerPage)) || 1;
    renderDiscountsTable();
  } catch (error) {
    discountsList.textContent = error.message;
    showAdminToast(error.message, "error");
  }
}

function renderDiscountsTable() {
  if (!discountsList) return;

  discountsPerPage = Number(discountPageSize?.value || discountsPerPage || 5);
  if (![5, 10, 20].includes(discountsPerPage)) discountsPerPage = 5;

  const total = cachedDiscounts.length;
  const totalPages = Math.max(1, Math.ceil(total / discountsPerPage));
  discountsPage = Math.min(Math.max(discountsPage, 1), totalPages);

  const startIndex = (discountsPage - 1) * discountsPerPage;
  const pageItems = cachedDiscounts.slice(startIndex, startIndex + discountsPerPage);
  const from = total === 0 ? 0 : startIndex + 1;
  const to = startIndex + pageItems.length;

  if (total === 0) {
    discountsList.textContent = "Chua co ma giam gia phu hop.";
    return;
  }

  discountsList.innerHTML = `
    <div class="table-wrap">
      <table class="admin-table discounts-table">
        <thead>
          <tr>
            <th>STT</th>
            <th>Ma</th>
            <th>Gia tri</th>
            <th>Dieu kien</th>
            <th>Hieu luc</th>
            <th>Trang thai</th>
            <th>Chuc nang</th>
          </tr>
        </thead>
        <tbody>
          ${pageItems.map((item, index) => `
            <tr>
              <td>${startIndex + index + 1}</td>
              <td>
                <strong>${escapeHtml(item.code)}</strong>
                <small>${escapeHtml(item.name)}</small>
              </td>
              <td>${formatDiscountValue(item)}</td>
              <td>
                <strong>Tu ${formatMoney(item.min_order || 0)}</strong>
                <small>${item.max_discount ? `Toi da ${formatMoney(item.max_discount)}` : "Khong gioi han giam"}</small>
              </td>
              <td>
                <strong>${item.starts_at ? formatDateTime(item.starts_at) : "Bat dau ngay"}</strong>
                <small>${item.expires_at ? formatDateTime(item.expires_at) : "Khong gioi han"}</small>
              </td>
              <td><span class="account-status ${item.status === "active" ? "active" : "locked"}">${formatDiscountStatus(item.status)}</span></td>
              <td>
                <div class="table-actions">
                  <button type="button" class="icon-btn edit" title="Sua" aria-label="Sua ma giam gia" data-edit-discount="${item.id}">${editIcon()}</button>
                  <button type="button" class="icon-btn delete" title="Xoa" aria-label="Xoa ma giam gia" data-delete-discount="${item.id}">${trashIcon()}</button>
                </div>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
    <div class="table-footer">
      Dang hien thi tu ${from} den ${to} cua ${total} ket qua
      <div class="pager">
        <button type="button" data-discounts-page="prev" ${discountsPage === 1 ? "disabled" : ""}>&lsaquo;</button>
        ${Array.from({ length: totalPages }, (_, index) => `
          <button type="button" class="${discountsPage === index + 1 ? "active" : ""}" data-discounts-page="${index + 1}">${index + 1}</button>
        `).join("")}
        <button type="button" data-discounts-page="next" ${discountsPage === totalPages ? "disabled" : ""}>&rsaquo;</button>
      </div>
    </div>
  `;
}

async function loadStats() {
  if (!statsSummary) return;

  statsSummary.textContent = "Dang tai thong ke...";
  statsTopFoods.textContent = "Dang tai...";
  statsDaily.textContent = "Dang tai...";

  try {
    const params = new URLSearchParams();
    if (statsFromDate?.value) params.set("from", statsFromDate.value);
    if (statsToDate?.value) params.set("to", statsToDate.value);

    const data = await requestJson(`${ADMIN_API}/stats?${params.toString()}`);
    renderStats(data);
  } catch (error) {
    statsSummary.textContent = error.message;
    statsTopFoods.textContent = "";
    statsDaily.textContent = "";
    showAdminToast(error.message, "error");
  }
}

function renderStats(data) {
  const summary = data.summary || {};
  const statCards = [
    ["Tong don", summary.total_orders || 0],
    ["Doanh thu hoan tat", formatMoney(summary.revenue || 0)],
    ["Don cho xu ly", summary.pending_orders || 0],
    ["Don hoan tat", summary.done_orders || 0],
    ["Tai khoan", summary.total_users || 0],
    ["Khach hang", summary.customers || 0],
    ["Mon dang ban", summary.active_foods || 0],
    ["Ma dang dung", summary.active_discounts || 0]
  ];

  statsSummary.innerHTML = statCards.map(([label, value]) => `
    <article class="stats-card">
      <span>${label}</span>
      <strong>${value}</strong>
    </article>
  `).join("");

  statsTopFoods.innerHTML = renderSimpleTable(
    ["Mon", "So luong", "Doanh thu"],
    (data.topFoods || []).map(item => `
      <tr>
        <td><strong>${escapeHtml(item.food_name)}</strong></td>
        <td>${Number(item.quantity || 0).toLocaleString("vi-VN")}</td>
        <td>${formatMoney(item.revenue || 0)}</td>
      </tr>
    `),
    "Chua co du lieu mon ban."
  );

  statsDaily.innerHTML = renderSimpleTable(
    ["Ngay", "Don", "Doanh thu"],
    (data.dailyRevenue || []).map(item => `
      <tr>
        <td><strong>${new Date(item.order_date).toLocaleDateString("vi-VN")}</strong></td>
        <td>${Number(item.orders_count || 0).toLocaleString("vi-VN")}</td>
        <td>${formatMoney(item.revenue || 0)}</td>
      </tr>
    `),
    "Chua co du lieu doanh thu."
  );
}

async function loadOrders() {
  ordersList.textContent = "Đang tải đơn hàng...";

  try {
    const orders = await requestJson(`${ADMIN_API}/orders`);
    if (ordersCount) ordersCount.textContent = orders.length;

    if (orders.length === 0) {
      ordersList.textContent = "Chưa có đơn hàng.";
      return;
    }

    ordersList.innerHTML = orders.map(order => `
      <article class="order-card">
        <div class="order-top">
          <div>
            <h3>Đơn #${order.id} - ${formatMoney(order.total_price)}</h3>
            <p class="order-meta">
              <strong>${order.customer_name}</strong> - ${order.phone}<br>
              ${order.address}<br>
              ${order.note ? `Ghi chú: ${order.note}<br>` : ""}
              Ngày đặt: ${new Date(order.created_at).toLocaleString("vi-VN")}
            </p>
          </div>

          <select class="status-select" data-order-id="${order.id}">
            ${Object.entries(statusLabels).map(([value, label]) => `
              <option value="${value}" ${order.status === value ? "selected" : ""}>${label}</option>
            `).join("")}
          </select>
        </div>

        <div class="order-items">
          ${order.items.map(item => `
            <div class="order-line">
              <span>${item.food_name} x ${item.quantity}</span>
              <strong>${formatMoney(item.subtotal)}</strong>
            </div>
          `).join("")}
        </div>
      </article>
    `).join("");
  } catch (error) {
    ordersList.textContent = error.message;
    showAdminToast(error.message, "error");
  }
}

async function updateOrderStatus(orderId, status) {
  await requestJson(`${ADMIN_API}/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
}

async function loadFoods() {
  if (!foodsList) return;

  foodsList.textContent = "Dang tai mon an...";

  try {
    const foods = await requestJson(`${ADMIN_API}/foods`);
    cachedFoods = foods;
    if (foodsCount) foodsCount.textContent = foods.length;
    renderFoodsTable();
  } catch (error) {
    foodsList.textContent = error.message;
    showAdminToast(error.message, "error");
  }
}

function getFoodType(food) {
  const type = String(food.category_type || "").toLowerCase();
  if (type === "drink" || type === "food") return type;

  const categoryId = String(food.category_id || "");
  const categoryName = String(food.category_name || "").toLowerCase();

  if (categoryId === "4" || categoryName.includes("uong") || categoryName.includes("drink")) {
    return "drink";
  }

  return "food";
}

function getFoodCategoryLabel(food) {
  const parentName = food.parent_category_name;
  const categoryName = food.category_name;

  if (parentName && categoryName) {
    return `${parentName} / ${categoryName}`;
  }

  if (categoryName) return categoryName;

  return "Chua phan loai";
}

function getFoodCategoryFilterOptions() {
  if (activeFoodCategory === "food" || activeFoodCategory === "drink") {
    const categoryMap = new Map();

    cachedFoods.forEach(food => {
      if (getFoodType(food) !== activeFoodCategory || !food.category_id || !food.category_name) {
        return;
      }

      categoryMap.set(String(food.category_id), food.category_name);
    });

    return [
      { value: "all", label: "Tat ca" },
      ...Array.from(categoryMap.entries())
        .sort((first, second) => first[1].localeCompare(second[1], "vi"))
        .map(([value, label]) => ({ value, label }))
    ];
  }

  return [
    { value: "all", label: "Tat ca" },
    { value: "food", label: "Do an" },
    { value: "drink", label: "Nuoc uong" }
  ];
}

function renderFoodCategoryFilterOptions() {
  if (!foodCategoryFilter) return;

  const options = getFoodCategoryFilterOptions();
  const selectedValue = activeFoodCategory === "all" ? activeFoodSubcategory : activeFoodSubcategory;
  foodCategoryFilter.innerHTML = options
    .map(option => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`)
    .join("");

  const hasSelectedValue = options.some(option => option.value === selectedValue);
  foodCategoryFilter.value = hasSelectedValue ? selectedValue : "all";
  activeFoodSubcategory = foodCategoryFilter.value;
}

function getFilteredFoods() {
  const search = String(foodSearch?.value || "").trim().toLowerCase();
  const filterValue = foodCategoryFilter?.value || activeFoodSubcategory || "all";
  activeFoodSubcategory = filterValue;

  return cachedFoods.filter(food => {
    const foodType = getFoodType(food);
    let matchesCategory = true;

    if (activeFoodCategory === "food" || activeFoodCategory === "drink") {
      matchesCategory = foodType === activeFoodCategory
        && (filterValue === "all" || String(food.category_id || "") === filterValue);
    } else if (filterValue === "food" || filterValue === "drink") {
      matchesCategory = foodType === filterValue;
    } else if (filterValue !== "all") {
      matchesCategory = String(food.category_id || "") === filterValue;
    }

    const matchesSearch = !search
      || String(food.name || "").toLowerCase().includes(search)
      || String(getFoodCategoryLabel(food)).toLowerCase().includes(search)
      || String(food.price || "").includes(search);

    return matchesCategory && matchesSearch;
  });
}

function updateFoodCreateLink() {
  if (!foodCreateLink) return;

  const type = activeFoodCategory === "drink" ? "drink" : "food";
  foodCreateLink.href = `admin-food.html?type=${type}`;
}

function renderFoodsTable() {
  if (!foodsList) return;

  foodsPerPage = Number(foodPageSize?.value || foodsPerPage || 5);
  if (![5, 10, 20].includes(foodsPerPage)) foodsPerPage = 5;

  renderFoodCategoryFilterOptions();
  sessionStorage.setItem("foodhub_food_category", activeFoodCategory);
  sessionStorage.setItem("foodhub_food_subcategory", activeFoodSubcategory);
  sessionStorage.setItem("foodhub_food_page_size", String(foodsPerPage));

  if (foodCategoryTitle) {
    foodCategoryTitle.textContent = FOOD_CATEGORY_TITLES[activeFoodCategory] || FOOD_CATEGORY_TITLES.all;
  }
  updateFoodCreateLink();

  const filteredFoods = getFilteredFoods();
  const totalFoods = filteredFoods.length;
  const totalPages = Math.max(1, Math.ceil(totalFoods / foodsPerPage));
  foodsPage = Math.min(Math.max(foodsPage, 1), totalPages);
  const startIndex = (foodsPage - 1) * foodsPerPage;
  const pageFoods = filteredFoods.slice(startIndex, startIndex + foodsPerPage);
  const from = totalFoods === 0 ? 0 : startIndex + 1;
  const to = startIndex + pageFoods.length;

  if (totalFoods === 0) {
    foodsList.textContent = "Chua co mon phu hop.";
    return;
  }

  foodsList.innerHTML = `
    <div class="table-wrap">
      <table class="admin-table foods-admin-table">
        <thead>
          <tr>
            <th>STT</th>
            <th>Hinh anh</th>
            <th>Ten mon</th>
            <th>Gia</th>
            <th>Chuc nang</th>
          </tr>
        </thead>
        <tbody>
          ${pageFoods.map((food, index) => `
            <tr>
              <td>${startIndex + index + 1}</td>
              <td>
                <img class="admin-food-thumb" src="${escapeHtml(food.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c")}" alt="${escapeHtml(food.name)}">
              </td>
              <td>
                <strong>${escapeHtml(food.name)}</strong>
                <small>${escapeHtml(getFoodCategoryLabel(food))} - ${food.is_active ? "Dang ban" : "Da an"}</small>
              </td>
              <td>${formatMoney(food.price)}</td>
              <td>
                <div class="table-actions">
                  <a class="icon-btn edit" href="admin-food.html?id=${food.id}&type=${getFoodType(food)}" title="Sua" aria-label="Sua mon">${editIcon()}</a>
                  <button type="button" class="icon-btn delete" title="An mon" aria-label="An mon" data-hide-food="${food.id}">${trashIcon()}</button>
                </div>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
    <div class="table-footer">
      Dang hien thi tu ${from} den ${to} cua ${totalFoods} ket qua
      <div class="pager">
        <button type="button" data-foods-page="prev" ${foodsPage === 1 ? "disabled" : ""}>&lsaquo;</button>
        ${Array.from({ length: totalPages }, (_, index) => `
          <button type="button" class="${foodsPage === index + 1 ? "active" : ""}" data-foods-page="${index + 1}">${index + 1}</button>
        `).join("")}
        <button type="button" data-foods-page="next" ${foodsPage === totalPages ? "disabled" : ""}>&rsaquo;</button>
      </div>
    </div>
  `;
}

async function hideFood(foodId) {
  if (!confirm("An mon nay khoi thuc don?")) {
    return;
  }

  try {
    await requestJson(`${ADMIN_API}/foods/${foodId}`, {
      method: "DELETE"
    });
    await loadFoods();
    showAdminToast("Da an mon khoi thuc don.");
  } catch (error) {
    showAdminToast(error.message, "error");
  }
}

async function createStaff(event) {
  event.preventDefault();

  const payload = {
    fullname: document.getElementById("staffName").value,
    email: document.getElementById("staffEmail").value,
    password: document.getElementById("staffPassword").value,
    role: document.getElementById("staffRole").value,
    permissions: getCheckedPermissions(staffPermissions)
  };

  try {
    await requestJson(`${ADMIN_API}/staff`, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    staffForm.reset();
    renderPermissionChecks(staffPermissions);
    await loadUsers();
    showAdminToast("Da tao nhan vien.");
  } catch (error) {
    showAdminToast(error.message, "error");
  }
}

async function saveAccount(detailRow, userId) {
  const payload = {
    fullname: detailRow.dataset.name,
    email: detailRow.dataset.email,
    role: detailRow.querySelector("[data-account-role]").value,
    permissions: getCheckedPermissions(detailRow.querySelector(".account-permissions"))
  };

  await requestJson(`${ADMIN_API}/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

async function toggleAccount(userId, isActive) {
  await requestJson(`${ADMIN_API}/users/${userId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ isActive })
  });
}

async function resetAccountPassword(userId) {
  const newPassword = prompt("Nhap mat khau moi toi thieu 6 ky tu cho tai khoan nay:");

  if (!newPassword) return;

  await requestJson(`${ADMIN_API}/users/${userId}/password`, {
    method: "PUT",
    body: JSON.stringify({ newPassword })
  });
}

document.getElementById("logoutBtn").addEventListener("click", () => {
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_USER_KEY);
  sessionStorage.removeItem("foodhub_cart");
  window.location.href = "login.html";
});

document.getElementById("refreshOrdersBtn").addEventListener("click", loadOrders);
document.getElementById("refreshFoodsBtn")?.addEventListener("click", loadFoods);
document.getElementById("refreshUsersBtn")?.addEventListener("click", loadUsers);
document.getElementById("refreshAnnouncementsBtn")?.addEventListener("click", loadAnnouncements);
document.getElementById("refreshDiscountsBtn")?.addEventListener("click", loadDiscounts);
document.getElementById("refreshStatsBtn")?.addEventListener("click", loadStats);
document.getElementById("applyStatsFilterBtn")?.addEventListener("click", loadStats);
document.getElementById("resetDiscountFormBtn")?.addEventListener("click", resetDiscountForm);
discountForm?.addEventListener("submit", saveDiscount);
discountForm?.querySelector("[data-reset-discount]")?.addEventListener("click", resetDiscountForm);
navButtons.forEach(button => {
  button.addEventListener("click", event => {
    event.preventDefault();

    if (!button.dataset.adminTarget) {
      return;
    }

    if (button.dataset.foodCategory && foodCategoryFilter) {
      activeFoodCategory = button.dataset.foodCategory;
      activeFoodSubcategory = "all";
      sessionStorage.setItem("foodhub_food_category", activeFoodCategory);
      sessionStorage.setItem("foodhub_food_subcategory", activeFoodSubcategory);
      foodsPage = 1;
      renderFoodsTable();
    }

    showAdminSection(button.dataset.adminTarget);
  });
});
navToggles.forEach(toggle => {
  toggle.addEventListener("click", () => {
    const group = toggle.closest(".admin-nav-group");
    const isOpen = !group?.classList.contains("is-open");

    if (!group) return;

    group.classList.toggle("is-open", isOpen);
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
});
shortcutButtons.forEach(button => {
  button.addEventListener("click", () => {
    if (button.dataset.adminShortcut === "foods" && foodCategoryFilter) {
      activeFoodCategory = "all";
      activeFoodSubcategory = "all";
      foodsPage = 1;
      renderFoodsTable();
    }

    showAdminSection(button.dataset.adminShortcut);
  });
});
staffForm?.addEventListener("submit", createStaff);
foodCategoryFilter?.addEventListener("change", () => {
  activeFoodSubcategory = foodCategoryFilter.value || "all";
  sessionStorage.setItem("foodhub_food_subcategory", activeFoodSubcategory);
  foodsPage = 1;
  renderFoodsTable();
  showAdminSection("foods");
});
foodPageSize?.addEventListener("change", () => {
  foodsPerPage = Number(foodPageSize.value || 5);
  foodsPage = 1;
  renderFoodsTable();
});
foodSearch?.addEventListener("input", () => {
  clearTimeout(foodSearchTimer);
  foodsPage = 1;
  foodSearchTimer = setTimeout(renderFoodsTable, 250);
});
userTypeFilter?.addEventListener("change", () => {
  usersPage = 1;
  loadUsers();
});
userSearch?.addEventListener("input", () => {
  clearTimeout(userSearchTimer);
  usersPage = 1;
  userSearchTimer = setTimeout(loadUsers, 300);
});
announcementStatusFilter?.addEventListener("change", () => {
  announcementsPage = 1;
  loadAnnouncements();
});
announcementSearch?.addEventListener("input", () => {
  clearTimeout(announcementSearchTimer);
  announcementsPage = 1;
  announcementSearchTimer = setTimeout(loadAnnouncements, 300);
});
discountStatusFilter?.addEventListener("change", () => {
  discountsPage = 1;
  loadDiscounts();
});
discountPageSize?.addEventListener("change", () => {
  discountsPerPage = Number(discountPageSize.value || 5);
  discountsPage = 1;
  renderDiscountsTable();
});
discountSearch?.addEventListener("input", () => {
  clearTimeout(discountSearchTimer);
  discountsPage = 1;
  discountSearchTimer = setTimeout(loadDiscounts, 300);
});

ordersList.addEventListener("change", async event => {
  if (!event.target.matches(".status-select")) {
    return;
  }

  try {
    await updateOrderStatus(event.target.dataset.orderId, event.target.value);
    showAdminToast("Đã cập nhật trạng thái đơn hàng.");
  } catch (error) {
    showAdminToast(error.message, "error");
    await loadOrders();
  }
});

foodsList?.addEventListener("click", event => {
  const pageButton = event.target.closest("[data-foods-page]");
  const hideButton = event.target.closest("[data-hide-food]");

  if (pageButton) {
    const pageAction = pageButton.dataset.foodsPage;
    const totalFilteredFoods = getFilteredFoods().length;
    const totalPages = Math.max(1, Math.ceil(totalFilteredFoods / foodsPerPage));

    if (pageAction === "prev") {
      foodsPage -= 1;
    } else if (pageAction === "next") {
      foodsPage += 1;
    } else {
      foodsPage = Number(pageAction);
    }

    foodsPage = Math.min(Math.max(foodsPage, 1), totalPages);
    renderFoodsTable();
    return;
  }

  if (hideButton) {
    const hideId = hideButton.dataset.hideFood;
    hideFood(hideId);
  }
});

usersList?.addEventListener("click", async event => {
  const pageButton = event.target.closest("[data-users-page]");
  const toggleButton = event.target.closest("[data-toggle-user]");
  const resetButton = event.target.closest("[data-reset-password]");

  try {
    if (pageButton) {
      const pageAction = pageButton.dataset.usersPage;
      const totalPages = Math.max(1, Math.ceil(cachedUsers.length / USERS_PER_PAGE));

      if (pageAction === "prev") {
        usersPage -= 1;
      } else if (pageAction === "next") {
        usersPage += 1;
      } else {
        usersPage = Number(pageAction);
      }

      usersPage = Math.min(Math.max(usersPage, 1), totalPages);
      renderUsersTable();
      return;
    }

    if (toggleButton) {
      await toggleAccount(toggleButton.dataset.toggleUser, toggleButton.dataset.active === "1");
      showAdminToast("Da cap nhat trang thai tai khoan.");
      await loadUsers();
    }

    if (resetButton) {
      await resetAccountPassword(resetButton.dataset.resetPassword);
      showAdminToast("Da dat lai mat khau.");
    }
  } catch (error) {
    showAdminToast(error.message, "error");
  }
});

announcementsList?.addEventListener("click", async event => {
  const pageButton = event.target.closest("[data-announcements-page]");
  const hideButton = event.target.closest("[data-hide-announcement]");

  try {
    if (pageButton) {
      const pageAction = pageButton.dataset.announcementsPage;
      const totalPages = Math.max(1, Math.ceil(cachedAnnouncements.length / ANNOUNCEMENTS_PER_PAGE));

      if (pageAction === "prev") {
        announcementsPage -= 1;
      } else if (pageAction === "next") {
        announcementsPage += 1;
      } else {
        announcementsPage = Number(pageAction);
      }

      announcementsPage = Math.min(Math.max(announcementsPage, 1), totalPages);
      renderAnnouncementsTable();
      return;
    }

    if (hideButton) {
      if (!confirm("Xoa vinh vien thong bao nay?")) return;

      await requestJson(`${ADMIN_API}/announcements/${hideButton.dataset.hideAnnouncement}`, {
        method: "DELETE"
      });
      showAdminToast("Da xoa thong bao.");
      await loadAnnouncements();
    }
  } catch (error) {
    showAdminToast(error.message, "error");
  }
});

discountsList?.addEventListener("click", async event => {
  const pageButton = event.target.closest("[data-discounts-page]");
  const editButton = event.target.closest("[data-edit-discount]");
  const deleteButton = event.target.closest("[data-delete-discount]");

  try {
    if (pageButton) {
      const pageAction = pageButton.dataset.discountsPage;
      const totalPages = Math.max(1, Math.ceil(cachedDiscounts.length / discountsPerPage));

      if (pageAction === "prev") {
        discountsPage -= 1;
      } else if (pageAction === "next") {
        discountsPage += 1;
      } else {
        discountsPage = Number(pageAction);
      }

      discountsPage = Math.min(Math.max(discountsPage, 1), totalPages);
      renderDiscountsTable();
      return;
    }

    if (editButton) {
      const discount = cachedDiscounts.find(item => String(item.id) === String(editButton.dataset.editDiscount))
        || await requestJson(`${ADMIN_API}/discounts/${editButton.dataset.editDiscount}`);
      fillDiscountForm(discount);
      return;
    }

    if (deleteButton) {
      if (!confirm("Xoa vinh vien ma giam gia nay?")) return;

      await requestJson(`${ADMIN_API}/discounts/${deleteButton.dataset.deleteDiscount}`, {
        method: "DELETE"
      });
      showAdminToast("Da xoa ma giam gia.");
      await loadDiscounts();
    }
  } catch (error) {
    showAdminToast(error.message, "error");
  }
});

requireAdminSession();
const initialFoodCategory = pageParams.get("foodCategory") || sessionStorage.getItem("foodhub_food_category") || "all";
const initialFoodSubcategory = sessionStorage.getItem("foodhub_food_subcategory") || "all";
const initialFoodPageSize = Number(sessionStorage.getItem("foodhub_food_page_size") || "5");

if (["all", "food", "drink"].includes(initialFoodCategory)) {
  activeFoodCategory = initialFoodCategory;
  activeFoodSubcategory = initialFoodSubcategory;
}

if ([5, 10, 20].includes(initialFoodPageSize) && foodPageSize) {
  foodsPerPage = initialFoodPageSize;
  foodPageSize.value = String(foodsPerPage);
}

showAdminSection(pageParams.get("section") || sessionStorage.getItem("foodhub_admin_section") || "overview");
loadAdminPermissions().then(loadUsers);
loadOrders();
loadFoods();
loadAnnouncements();
loadDiscounts();
loadStats();
