const API_BASE_URL = window.FOODHUB_CONFIG?.API_BASE_URL || "http://localhost:3000/api";
const ADMIN_API = `${API_BASE_URL}/admin`;
const ADVERTISEMENTS_API = `${API_BASE_URL}/advertisements`;
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
const categoriesList = document.getElementById("categoriesList");
const categoryForm = document.getElementById("categoryForm");
const categoryListView = document.getElementById("categoryListView");
const categoryFormView = document.getElementById("categoryFormView");
const categoryFormTitle = document.getElementById("categoryFormTitle");
const categoryFormSubtitle = document.getElementById("categoryFormSubtitle");
const categorySearch = document.getElementById("categorySearch");
const categoryTypeFilter = document.getElementById("categoryTypeFilter");
const usersList = document.getElementById("usersList");
const announcementsList = document.getElementById("announcementsList");
const staffForm = document.getElementById("staffForm");
const staffPermissions = document.getElementById("staffPermissions");
const foodSearch = document.getElementById("foodSearch");
const foodCategoryFilter = document.getElementById("foodCategoryFilter");
const foodPageSize = document.getElementById("foodPageSize");
const foodCategoryTitle = document.getElementById("foodCategoryTitle");
const foodCreateLink = document.getElementById("foodCreateLink");
const userSearch = document.getElementById("userSearch");
const userPageSize = document.getElementById("userPageSize");
const accountCreateLink = document.getElementById("accountCreateLink");
const announcementSearch = document.getElementById("announcementSearch");
const announcementStatusFilter = document.getElementById("announcementStatusFilter");
const announcementsCount = document.getElementById("announcementsCount");
const discountsList = document.getElementById("discountsList");
const discountForm = document.getElementById("discountForm");
const discountSearch = document.getElementById("discountSearch");
const discountStatusFilter = document.getElementById("discountStatusFilter");
const discountPageSize = document.getElementById("discountPageSize");
const advertisementsList = document.getElementById("advertisementsList");
const advertisementForm = document.getElementById("advertisementForm");
const advertisementLayout = document.querySelector(".advertisement-admin-layout");
const advertisementSearch = document.getElementById("advertisementSearch");
const advertisementPositionFilter = document.getElementById("advertisementPositionFilter");
const advertisementStatusFilter = document.getElementById("advertisementStatusFilter");
const advertisementPageSize = document.getElementById("advertisementPageSize");
const advertisementImageFile = document.getElementById("advertisementImageFile");
const advertisementPreview = document.getElementById("advertisementPreview");
const statsSummary = document.getElementById("statsSummary");
const statsTopFoods = document.getElementById("statsTopFoods");
const statsDaily = document.getElementById("statsDaily");
const statsFromDate = document.getElementById("statsFromDate");
const statsToDate = document.getElementById("statsToDate");
let navButtons = [...document.querySelectorAll("[data-admin-target]")];
let navToggles = [...document.querySelectorAll("[data-admin-toggle]")];
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
let cachedCategories = [];
let categorySearchTimer;
let foodSearchTimer;
let activeFoodCategory = "all";
let activeFoodSubcategory = "all";
let foodsPage = 1;
let foodsPerPage = 5;
let userSearchTimer;
let cachedUsers = [];
let usersPage = 1;
let usersPerPage = 5;
let activeAccountType = "staff";
let announcementSearchTimer;
let cachedAnnouncements = [];
let announcementsPage = 1;
const ANNOUNCEMENTS_PER_PAGE = 5;
let discountSearchTimer;
let cachedDiscounts = [];
let discountsPage = 1;
let discountsPerPage = 5;
let advertisementSearchTimer;
let cachedAdvertisements = [];
let advertisementsPage = 1;
let advertisementsPerPage = 5;
let pendingAdvertisementImage = "";
function refreshAdminNavElements() {
  navButtons = [...document.querySelectorAll("[data-admin-target]")];
  navToggles = [...document.querySelectorAll("[data-admin-toggle]")];
}

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
    const isAccountNav = button.dataset.adminTarget === "accounts";
    const matchesAccountType = !button.dataset.accountType || button.dataset.accountType === activeAccountType;
    button.classList.toggle(
      "active",
      button.dataset.adminTarget === target
        && (!isFoodNav || matchesFoodCategory)
        && (!isAccountNav || matchesAccountType)
    );
  });

  adminSections.forEach(section => {
    section.classList.toggle("active", section.dataset.adminSection === target);
  });

  if (target === "foods") {
    setAdminNavGroupOpen("foods-menu", true);
  }

  if (target === "accounts") {
    setAdminNavGroupOpen("accounts-menu", true);
  }

  sessionStorage.setItem("foodhub_admin_section", target);
}

function normalizeAccountType(value) {
  return value === "customers" ? "customers" : "staff";
}

function getAccountTypeTitle() {
  return activeAccountType === "customers" ? "Tai khoan khach hang" : "Tai khoan nhan vien";
}

function syncAccountView() {
  const accountSection = document.querySelector('[data-admin-section="accounts"]');
  if (!accountSection) return;

  accountSection.querySelector(".page-heading h2").textContent = getAccountTypeTitle();
  const breadcrumb = accountSection.querySelector(".page-heading p");
  if (breadcrumb) {
    breadcrumb.innerHTML = `<a href="index.html">Trang chu</a> <span>/</span> ${getAccountTypeTitle()}`;
  }

  if (accountCreateLink) {
    accountCreateLink.href = `admin-account.html?type=${activeAccountType === "customers" ? "customer" : "staff"}`;
    accountCreateLink.textContent = activeAccountType === "customers" ? "+ Tao khach hang" : "+ Them nhan vien";
  }
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

  syncAccountView();
  usersList.textContent = `Dang tai ${activeAccountType === "customers" ? "khach hang" : "nhan vien"}...`;

  try {
    const params = new URLSearchParams({
      type: activeAccountType,
      q: userSearch?.value || ""
    });
    const users = await requestJson(`${ADMIN_API}/users?${params.toString()}`);

    if (users.length === 0) {
      cachedUsers = [];
      usersPage = 1;
      usersList.textContent = `Chua co ${activeAccountType === "customers" ? "khach hang" : "nhan vien"} phu hop.`;
      return;
    }

    cachedUsers = users;
    usersPage = Math.min(usersPage, Math.ceil(cachedUsers.length / usersPerPage)) || 1;
    renderUsersTable();
  } catch (error) {
    usersList.textContent = error.message;
    showAdminToast(error.message, "error");
  }
}

function renderUsersTable() {
  if (!usersList) return;

  const totalUsers = cachedUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalUsers / usersPerPage));
  usersPage = Math.min(Math.max(usersPage, 1), totalPages);

  const startIndex = (usersPage - 1) * usersPerPage;
  const pageUsers = cachedUsers.slice(startIndex, startIndex + usersPerPage);
  const from = totalUsers === 0 ? 0 : startIndex + 1;
  const to = startIndex + pageUsers.length;

  if (totalUsers === 0) {
    usersList.textContent = `Chua co ${activeAccountType === "customers" ? "khach hang" : "nhan vien"} phu hop.`;
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
            ${pageUsers.map((account, index) => {
              const isRootAdmin = String(account.role || "").toUpperCase() === "ADMIN";
              return `
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
                    ${isRootAdmin
                      ? `<span class="admin-lock-note">Quan tri cao nhat</span>`
                      : `
                        <a class="icon-btn edit" href="admin-account.html?id=${account.id}&type=${activeAccountType === "customers" ? "customer" : "staff"}" title="Sua" aria-label="Sua tai khoan">${editIcon()}</a>
                        <button type="button" class="icon-btn key" title="Dat mat khau" aria-label="Dat mat khau" data-reset-password="${account.id}">${keyIcon()}</button>
                        <button type="button" class="icon-btn delete" title="${account.isActive ? "Khoa" : "Mo khoa"}" aria-label="${account.isActive ? "Khoa tai khoan" : "Mo khoa tai khoan"}" data-toggle-user="${account.id}" data-active="${account.isActive ? "0" : "1"}">${trashIcon()}</button>
                      `}
                  </div>
                </td>
              </tr>
            `;
            }).join("")}
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

function formatAdvertisementPosition(position) {
  const labels = {
    both: "Hai ben",
    left: "Ben trai",
    right: "Ben phai"
  };
  return labels[position] || "Hai ben";
}

function formatAdvertisementStatus(status) {
  const labels = {
    active: "Hoat dong",
    scheduled: "Sap hien",
    expired: "Het han",
    hidden: "Da an"
  };
  return labels[status] || status || "Khong ro";
}

function getAdvertisementStatusClass(status) {
  if (status === "active") return "active";
  if (status === "scheduled") return "pending";
  return "locked";
}

function renderAdvertisementPreview(src) {
  if (!advertisementPreview) return;

  advertisementPreview.innerHTML = src
    ? `<img src="${escapeHtml(src)}" alt="Xem truoc quang cao">`
    : "Chua chon anh";
}

function showAdvertisementListView() {
  if (!advertisementLayout) return;

  advertisementLayout.classList.add("is-list-mode");
  advertisementLayout.classList.remove("is-form-mode");
}

function showAdvertisementFormView() {
  if (!advertisementLayout) return;

  advertisementLayout.classList.add("is-form-mode");
  advertisementLayout.classList.remove("is-list-mode");
  advertisementLayout.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetAdvertisementForm() {
  if (!advertisementForm) return;

  advertisementForm.reset();
  document.getElementById("advertisementId").value = "";
  document.getElementById("advertisementPosition").value = "both";
  document.getElementById("advertisementSortOrder").value = "0";
  document.getElementById("advertisementIsActive").value = "1";
  pendingAdvertisementImage = "";
  renderAdvertisementPreview("");
  document.getElementById("saveAdvertisementBtn").textContent = "Luu quang cao";
}

function fillAdvertisementForm(item) {
  if (!advertisementForm || !item) return;

  document.getElementById("advertisementId").value = item.id || "";
  document.getElementById("advertisementTitle").value = item.title || "";
  document.getElementById("advertisementPosition").value = item.position || "both";
  document.getElementById("advertisementLink").value = item.link_url || item.linkUrl || "";
  document.getElementById("advertisementSortOrder").value = item.sort_order ?? item.sortOrder ?? 0;
  document.getElementById("advertisementStartsAt").value = formatDateInputValue(item.starts_at || item.startsAt);
  document.getElementById("advertisementExpiresAt").value = formatDateInputValue(item.expires_at || item.expiresAt);
  document.getElementById("advertisementIsActive").value = item.is_active || item.isActive ? "1" : "0";
  pendingAdvertisementImage = item.image || "";
  if (advertisementImageFile) advertisementImageFile.value = "";
  renderAdvertisementPreview(pendingAdvertisementImage);
  document.getElementById("saveAdvertisementBtn").textContent = "Cap nhat quang cao";
  showAdvertisementFormView();
}

function readAdvertisementImageFile() {
  const file = advertisementImageFile?.files?.[0];
  if (!file) return Promise.resolve(pendingAdvertisementImage);

  const validTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!validTypes.includes(file.type)) {
    return Promise.reject(new Error("Chi ho tro anh JPG, PNG hoac WebP."));
  }

  if (file.size > 1.5 * 1024 * 1024) {
    return Promise.reject(new Error("Anh quang cao toi da 1.5MB."));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Khong the doc tep anh."));
    reader.readAsDataURL(file);
  });
}

async function readAdvertisementPayload() {
  const image = await readAdvertisementImageFile();

  return {
    title: document.getElementById("advertisementTitle").value,
    image,
    linkUrl: document.getElementById("advertisementLink").value,
    position: document.getElementById("advertisementPosition").value,
    sortOrder: document.getElementById("advertisementSortOrder").value,
    startsAt: document.getElementById("advertisementStartsAt").value || null,
    expiresAt: document.getElementById("advertisementExpiresAt").value || null,
    isActive: document.getElementById("advertisementIsActive").value === "1"
  };
}

async function saveAdvertisement(event) {
  event.preventDefault();

  const advertisementId = document.getElementById("advertisementId").value;

  try {
    const payload = await readAdvertisementPayload();
    await requestJson(`${ADVERTISEMENTS_API}/admin${advertisementId ? `/${advertisementId}` : ""}`, {
      method: advertisementId ? "PUT" : "POST",
      body: JSON.stringify(payload)
    });

    showAdminToast(advertisementId ? "Da cap nhat quang cao." : "Da tao quang cao.");
    resetAdvertisementForm();
    await loadAdvertisements();
    showAdvertisementListView();
  } catch (error) {
    showAdminToast(error.message, "error");
  }
}

async function loadAdvertisements() {
  if (!advertisementsList) return;

  advertisementsList.textContent = "Dang tai quang cao...";

  try {
    const params = new URLSearchParams({
      q: advertisementSearch?.value || "",
      position: advertisementPositionFilter?.value || "all",
      status: advertisementStatusFilter?.value || "all"
    });
    const advertisements = await requestJson(`${ADVERTISEMENTS_API}/admin?${params.toString()}`);

    cachedAdvertisements = advertisements;
    advertisementsPage = Math.min(advertisementsPage, Math.ceil(cachedAdvertisements.length / advertisementsPerPage)) || 1;
    renderAdvertisementsTable();
  } catch (error) {
    advertisementsList.textContent = error.message;
    showAdminToast(error.message, "error");
  }
}

function renderAdvertisementsTable() {
  if (!advertisementsList) return;

  advertisementsPerPage = Number(advertisementPageSize?.value || advertisementsPerPage || 5);
  if (![5, 10, 20].includes(advertisementsPerPage)) advertisementsPerPage = 5;

  const total = cachedAdvertisements.length;
  const totalPages = Math.max(1, Math.ceil(total / advertisementsPerPage));
  advertisementsPage = Math.min(Math.max(advertisementsPage, 1), totalPages);

  const startIndex = (advertisementsPage - 1) * advertisementsPerPage;
  const pageItems = cachedAdvertisements.slice(startIndex, startIndex + advertisementsPerPage);
  const from = total === 0 ? 0 : startIndex + 1;
  const to = startIndex + pageItems.length;

  if (total === 0) {
    advertisementsList.textContent = "Chua co quang cao phu hop.";
    return;
  }

  advertisementsList.innerHTML = `
    <div class="table-wrap">
      <table class="admin-table advertisements-table">
        <thead>
          <tr>
            <th>STT</th>
            <th>Hinh anh</th>
            <th>Tieu de</th>
            <th>Vi tri</th>
            <th>Hieu luc</th>
            <th>Trang thai</th>
            <th>Chuc nang</th>
          </tr>
        </thead>
        <tbody>
          ${pageItems.map((item, index) => `
            <tr>
              <td>${startIndex + index + 1}</td>
              <td><img class="ad-thumb" src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}"></td>
              <td>
                <strong>${escapeHtml(item.title)}</strong>
                <small>${item.link_url ? escapeHtml(item.link_url) : "Khong gan link"}</small>
              </td>
              <td>${formatAdvertisementPosition(item.position)}</td>
              <td>
                <strong>${item.starts_at ? formatDateTime(item.starts_at) : "Bat dau ngay"}</strong>
                <small>${item.expires_at ? formatDateTime(item.expires_at) : "Khong gioi han"}</small>
              </td>
              <td><span class="account-status ${getAdvertisementStatusClass(item.status)}">${formatAdvertisementStatus(item.status)}</span></td>
              <td>
                <div class="table-actions">
                  <button type="button" class="icon-btn edit" title="Sua" aria-label="Sua quang cao" data-edit-advertisement="${item.id}">${editIcon()}</button>
                  <button type="button" class="icon-btn delete" title="Xoa" aria-label="Xoa quang cao" data-delete-advertisement="${item.id}">${trashIcon()}</button>
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
        <button type="button" data-advertisements-page="prev" ${advertisementsPage === 1 ? "disabled" : ""}>&lsaquo;</button>
        ${Array.from({ length: totalPages }, (_, index) => `
          <button type="button" class="${advertisementsPage === index + 1 ? "active" : ""}" data-advertisements-page="${index + 1}">${index + 1}</button>
        `).join("")}
        <button type="button" data-advertisements-page="next" ${advertisementsPage === totalPages ? "disabled" : ""}>&rsaquo;</button>
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

function normalizeAdminCategory(category) {
  return {
    ...category,
    id: Number(category.id),
    slug: category.slug || slugify(category.name || category.id),
    parentId: category.parentId ?? category.parent_id ?? null,
    parentName: category.parentName ?? category.parent_name ?? null,
    parentSlug: category.parentSlug ?? category.parent_slug ?? null,
    sortOrder: Number(category.sortOrder ?? category.sort_order ?? category.id ?? 0),
    isActive: Number(category.isActive ?? category.is_active ?? 1)
  };
}

function getRootCategories(includeInactive = true) {
  return cachedCategories
    .map(normalizeAdminCategory)
    .filter(category => !category.parentId && (includeInactive || category.isActive))
    .sort((first, second) => first.sortOrder - second.sortOrder || String(first.name).localeCompare(String(second.name), "vi"));
}

function getCategoryById(categoryId) {
  return cachedCategories
    .map(normalizeAdminCategory)
    .find(category => String(category.id) === String(categoryId));
}

function getCategoryBySlug(slug) {
  return cachedCategories
    .map(normalizeAdminCategory)
    .find(category => String(category.slug) === String(slug));
}

function getRootCategory(category) {
  if (!category) return null;
  const normalized = normalizeAdminCategory(category);
  return normalized.parentId ? getCategoryById(normalized.parentId) || normalized : normalized;
}

function getFoodRootCategory(food) {
  const directCategory = getCategoryById(food.category_id);
  if (directCategory) {
    return getRootCategory(directCategory);
  }

  if (food.parent_category_id) {
    return getCategoryById(food.parent_category_id);
  }

  const legacyType = String(food.category_type || "").toLowerCase();
  if (legacyType === "drink") return getCategoryBySlug("nuoc-uong");
  if (legacyType === "food") return getCategoryBySlug("do-an");

  return null;
}

function getFoodRootSlug(food) {
  return getFoodRootCategory(food)?.slug || "all";
}

function getFoodCategoryTitle(slug = activeFoodCategory) {
  if (!slug || slug === "all") return "Tat ca mon";
  return getCategoryBySlug(slug)?.name || "Tat ca mon";
}

function renderAdminFoodCategoryNav() {
  const container = document.querySelector("[data-admin-food-categories]");
  if (!container) return;

  const roots = getRootCategories(false);
  container.innerHTML = `
    <a href="admin.html?section=foods&foodCategory=all" data-admin-target="foods" data-food-category="all">
      <span class="nav-icon" data-icon="dot" aria-hidden="true"></span><span class="nav-text">Tat ca mon</span>
    </a>
    ${roots.map(category => `
      <a href="admin.html?section=foods&foodCategory=${escapeHtml(category.slug)}" data-admin-target="foods" data-food-category="${escapeHtml(category.slug)}">
        <span class="nav-icon" data-icon="dot" aria-hidden="true"></span><span class="nav-text">${escapeHtml(category.name)}</span>
      </a>
    `).join("")}
  `;

  if (window.AdminSidebar?.refreshIcons) {
    window.AdminSidebar.refreshIcons(container);
  }

  refreshAdminNavElements();
}

function renderCategoryParentOptions(selectedId = "", editingId = "") {
  const parentSelect = document.getElementById("categoryParent");
  if (!parentSelect) return;

  const rootCategories = cachedCategories
    .filter(category => !category.parentId && String(category.id) !== String(editingId))
    .sort((first, second) => Number(first.sortOrder || 0) - Number(second.sortOrder || 0));

  parentSelect.innerHTML = `
    <option value="">Danh muc cha</option>
    ${rootCategories.map(category => `
      <option value="${category.id}" ${String(selectedId || "") === String(category.id) ? "selected" : ""}>
        ${escapeHtml(category.name)}
      </option>
    `).join("")}
  `;
}

function renderCategoryFilterOptions() {
  if (!categoryTypeFilter) return;

  const currentValue = categoryTypeFilter.value || "all";
  const roots = getRootCategories(true);

  categoryTypeFilter.innerHTML = `
    <option value="all">Tat ca</option>
    <option value="root">Danh muc cha</option>
    ${roots.map(category => `<option value="${category.id}">${escapeHtml(category.name)}</option>`).join("")}
  `;

  categoryTypeFilter.value = [...categoryTypeFilter.options].some(option => option.value === currentValue) ? currentValue : "all";
}

function showCategoryListView() {
  if (categoryListView) categoryListView.hidden = false;
  if (categoryFormView) categoryFormView.hidden = true;
}

function showCategoryFormView(mode = "create") {
  if (categoryListView) categoryListView.hidden = true;
  if (categoryFormView) categoryFormView.hidden = false;

  if (categoryFormTitle) {
    categoryFormTitle.textContent = mode === "edit" ? "Cap nhat danh muc" : "Them danh muc";
  }

  if (categoryFormSubtitle) {
    categoryFormSubtitle.textContent = mode === "edit"
      ? "Chinh sua ten, cap danh muc, thu tu hien thi va trang thai."
      : "Tao danh muc cha nhu Banh keo hoac danh muc con ben trong danh muc cha.";
  }
}

function resetCategoryForm() {
  if (!categoryForm) return;

  categoryForm.reset();
  document.getElementById("categoryId").value = "";
  document.getElementById("categorySortOrder").value = "0";
  document.getElementById("categoryIsActive").checked = true;
  renderCategoryParentOptions();
  showCategoryFormView("create");
}

function fillCategoryForm(category) {
  if (!categoryForm || !category) return;

  document.getElementById("categoryId").value = category.id;
  document.getElementById("categoryName").value = category.name || "";
  document.getElementById("categorySortOrder").value = Number(category.sortOrder || 0);
  document.getElementById("categoryIsActive").checked = Boolean(Number(category.isActive));
  renderCategoryParentOptions(category.parentId || "", category.id);
  showCategoryFormView("edit");
  showAdminSection("categories");
}

function getFilteredCategories() {
  const search = String(categorySearch?.value || "").trim().toLowerCase();
  const filterValue = categoryTypeFilter?.value || "all";

  return cachedCategories.filter(category => {
    let matchesType = true;

    if (filterValue === "root") {
      matchesType = !category.parentId;
    } else if (filterValue !== "all") {
      matchesType = String(category.id) === String(filterValue) || String(category.parentId || "") === String(filterValue);
    }

    const matchesSearch = !search
      || String(category.name || "").toLowerCase().includes(search)
      || String(category.slug || "").toLowerCase().includes(search)
      || String(category.parentName || "").toLowerCase().includes(search);

    return matchesType && matchesSearch;
  });
}

function renderCategoriesTable() {
  if (!categoriesList) return;

  renderCategoryParentOptions(document.getElementById("categoryParent")?.value || "", document.getElementById("categoryId")?.value || "");
  renderCategoryFilterOptions();
  renderAdminFoodCategoryNav();
  const categories = getFilteredCategories();

  if (!categories.length) {
    categoriesList.textContent = "Chua co danh muc phu hop.";
    return;
  }

  categoriesList.innerHTML = `
    <div class="table-wrap">
      <table class="admin-table compact-table">
        <thead>
          <tr>
            <th>STT</th>
            <th>Ten danh muc</th>
            <th>Cap</th>
            <th>Thuoc danh muc cha</th>
            <th>Trang thai</th>
            <th>Chuc nang</th>
          </tr>
        </thead>
        <tbody>
          ${categories.map((category, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>
                <strong>${escapeHtml(category.name)}</strong>
                <small>${escapeHtml(category.slug || "")}</small>
              </td>
              <td>${category.parentId ? "Danh muc con" : "Danh muc cha"}</td>
              <td>${escapeHtml(category.parentName || "-")}</td>
              <td><span class="account-status ${Number(category.isActive) ? "active" : "locked"}">${Number(category.isActive) ? "Hoat dong" : "Da an"}</span></td>
              <td>
                <div class="table-actions">
                  <button type="button" class="icon-btn edit" title="Sua" aria-label="Sua danh muc" data-edit-category="${category.id}">${editIcon()}</button>
                  <button type="button" class="icon-btn delete" title="An" aria-label="An danh muc" data-delete-category="${category.id}">${trashIcon()}</button>
                </div>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

async function loadCategories() {
  if (!categoriesList) return;

  categoriesList.textContent = "Dang tai danh muc...";

  try {
    cachedCategories = (await requestJson(`${ADMIN_API}/categories?includeInactive=1`)).map(normalizeAdminCategory);
    renderAdminFoodCategoryNav();
    renderCategoriesTable();
  } catch (error) {
    categoriesList.textContent = error.message;
    showAdminToast(error.message, "error");
  }
}

async function saveCategory(event) {
  event.preventDefault();

  const categoryId = document.getElementById("categoryId").value;
  const payload = {
    name: document.getElementById("categoryName").value,
    parentId: document.getElementById("categoryParent").value || null,
    sortOrder: document.getElementById("categorySortOrder").value || 0,
    isActive: document.getElementById("categoryIsActive").checked ? 1 : 0
  };

  try {
    await requestJson(`${ADMIN_API}/categories${categoryId ? `/${categoryId}` : ""}`, {
      method: categoryId ? "PUT" : "POST",
      body: JSON.stringify(payload)
    });
    showAdminToast(categoryId ? "Da cap nhat danh muc." : "Da them danh muc.");
    resetCategoryForm();
    await loadCategories();
    await loadFoods();
    showCategoryListView();
  } catch (error) {
    showAdminToast(error.message, "error");
  }
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
  return getFoodRootSlug(food);
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
  const roots = getRootCategories(false);

  if (activeFoodCategory !== "all") {
    const root = getCategoryBySlug(activeFoodCategory);
    const children = cachedCategories
      .filter(category => String(category.parentId || "") === String(root?.id || "") && category.isActive)
      .sort((first, second) => Number(first.sortOrder || 0) - Number(second.sortOrder || 0));

    return [
      { value: "all", label: "Tat ca" },
      ...children.map(category => ({ value: String(category.id), label: category.name }))
    ];
  }

  return [
    { value: "all", label: "Tat ca" },
    ...roots.map(category => ({ value: category.slug, label: category.name }))
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
    const rootSlug = getFoodRootSlug(food);
    let matchesCategory = true;

    if (activeFoodCategory !== "all") {
      matchesCategory = rootSlug === activeFoodCategory
        && (filterValue === "all" || String(food.category_id || "") === filterValue);
    } else if (filterValue !== "all") {
      const selectedRoot = getCategoryBySlug(filterValue);
      matchesCategory = selectedRoot
        ? rootSlug === selectedRoot.slug
        : String(food.category_id || "") === filterValue;
    }

    const matchesSearch = !search
      || String(food.name || "").toLowerCase().includes(search)
      || String(getFoodCategoryLabel(food)).toLowerCase().includes(search)
      || String(food.price || "").includes(search)
      || String(food.stock_quantity ?? food.stockQuantity ?? 0).includes(search);

    return matchesCategory && matchesSearch;
  });
}

function updateFoodCreateLink() {
  if (!foodCreateLink) return;

  const rootSlug = activeFoodCategory === "all" ? getRootCategories(false)[0]?.slug || "all" : activeFoodCategory;
  foodCreateLink.href = `admin-food.html?foodCategory=${encodeURIComponent(rootSlug)}`;
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
    foodCategoryTitle.textContent = getFoodCategoryTitle(activeFoodCategory);
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
            <th>So luong con</th>
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
              <td>${Number(food.stock_quantity ?? food.stockQuantity ?? 0).toLocaleString("vi-VN")}</td>
              <td>
                <div class="table-actions">
                  <a class="icon-btn edit" href="admin-food.html?id=${food.id}&foodCategory=${encodeURIComponent(getFoodRootSlug(food))}" title="Sua" aria-label="Sua mon">${editIcon()}</a>
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
document.getElementById("refreshCategoriesBtn")?.addEventListener("click", loadCategories);
document.getElementById("refreshFoodsBtn")?.addEventListener("click", loadFoods);
document.getElementById("refreshUsersBtn")?.addEventListener("click", loadUsers);
document.getElementById("refreshAnnouncementsBtn")?.addEventListener("click", loadAnnouncements);
document.getElementById("refreshDiscountsBtn")?.addEventListener("click", loadDiscounts);
document.getElementById("refreshAdvertisementsBtn")?.addEventListener("click", loadAdvertisements);
document.getElementById("refreshStatsBtn")?.addEventListener("click", loadStats);
document.getElementById("applyStatsFilterBtn")?.addEventListener("click", loadStats);
document.getElementById("resetCategoryFormBtn")?.addEventListener("click", resetCategoryForm);
document.querySelector("[data-back-category-list]")?.addEventListener("click", () => {
  resetCategoryForm();
  showCategoryListView();
});
document.getElementById("resetDiscountFormBtn")?.addEventListener("click", resetDiscountForm);
document.getElementById("resetAdvertisementFormBtn")?.addEventListener("click", () => {
  resetAdvertisementForm();
  showAdvertisementFormView();
});
categoryForm?.addEventListener("submit", saveCategory);
categoryForm?.querySelector("[data-reset-category]")?.addEventListener("click", resetCategoryForm);
discountForm?.addEventListener("submit", saveDiscount);
discountForm?.querySelector("[data-reset-discount]")?.addEventListener("click", resetDiscountForm);
advertisementForm?.addEventListener("submit", saveAdvertisement);
advertisementForm?.querySelector("[data-reset-advertisement]")?.addEventListener("click", () => {
  resetAdvertisementForm();
  showAdvertisementListView();
});
document.querySelector(".admin-nav")?.addEventListener("click", event => {
  const button = event.target.closest("[data-admin-target]");

  if (!button) return;

  event.preventDefault();

  if (button.dataset.foodCategory && foodCategoryFilter) {
    activeFoodCategory = button.dataset.foodCategory || "all";
    activeFoodSubcategory = "all";
    sessionStorage.setItem("foodhub_food_category", activeFoodCategory);
    sessionStorage.setItem("foodhub_food_subcategory", activeFoodSubcategory);
    foodsPage = 1;
    renderFoodsTable();
  }

  if (button.dataset.accountType) {
    activeAccountType = normalizeAccountType(button.dataset.accountType);
    sessionStorage.setItem("foodhub_account_type", activeAccountType);
    usersPage = 1;
    loadUsers();
  }

  showAdminSection(button.dataset.adminTarget);
});
categoryTypeFilter?.addEventListener("change", renderCategoriesTable);
categorySearch?.addEventListener("input", () => {
  clearTimeout(categorySearchTimer);
  categorySearchTimer = setTimeout(renderCategoriesTable, 250);
});
categoriesList?.addEventListener("click", async event => {
  const editButton = event.target.closest("[data-edit-category]");
  const deleteButton = event.target.closest("[data-delete-category]");

  try {
    if (editButton) {
      const category = cachedCategories.find(item => String(item.id) === String(editButton.dataset.editCategory));
      fillCategoryForm(category);
      return;
    }

    if (deleteButton) {
      if (!confirm("An danh muc nay? Neu la danh muc cha, cac muc con cung se bi an.")) return;

      await requestJson(`${ADMIN_API}/categories/${deleteButton.dataset.deleteCategory}`, {
        method: "DELETE"
      });
      showAdminToast("Da an danh muc.");
      await loadCategories();
      await loadFoods();
    }
  } catch (error) {
    showAdminToast(error.message, "error");
  }
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
userPageSize?.addEventListener("change", () => {
  usersPerPage = Number(userPageSize.value || 5);
  sessionStorage.setItem("foodhub_users_page_size", String(usersPerPage));
  usersPage = 1;
  renderUsersTable();
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
advertisementPositionFilter?.addEventListener("change", () => {
  advertisementsPage = 1;
  loadAdvertisements();
});
advertisementStatusFilter?.addEventListener("change", () => {
  advertisementsPage = 1;
  loadAdvertisements();
});
advertisementPageSize?.addEventListener("change", () => {
  advertisementsPerPage = Number(advertisementPageSize.value || 5);
  advertisementsPage = 1;
  renderAdvertisementsTable();
});
advertisementSearch?.addEventListener("input", () => {
  clearTimeout(advertisementSearchTimer);
  advertisementsPage = 1;
  advertisementSearchTimer = setTimeout(loadAdvertisements, 300);
});
advertisementImageFile?.addEventListener("change", async () => {
  try {
    const src = await readAdvertisementImageFile();
    pendingAdvertisementImage = src;
    renderAdvertisementPreview(src);
  } catch (error) {
    showAdminToast(error.message, "error");
    advertisementImageFile.value = "";
  }
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
      const totalPages = Math.max(1, Math.ceil(cachedUsers.length / usersPerPage));

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

advertisementsList?.addEventListener("click", async event => {
  const pageButton = event.target.closest("[data-advertisements-page]");
  const editButton = event.target.closest("[data-edit-advertisement]");
  const deleteButton = event.target.closest("[data-delete-advertisement]");

  try {
    if (pageButton) {
      const pageAction = pageButton.dataset.advertisementsPage;
      const totalPages = Math.max(1, Math.ceil(cachedAdvertisements.length / advertisementsPerPage));

      if (pageAction === "prev") {
        advertisementsPage -= 1;
      } else if (pageAction === "next") {
        advertisementsPage += 1;
      } else {
        advertisementsPage = Number(pageAction);
      }

      advertisementsPage = Math.min(Math.max(advertisementsPage, 1), totalPages);
      renderAdvertisementsTable();
      return;
    }

    if (editButton) {
      const advertisement = cachedAdvertisements.find(item => String(item.id) === String(editButton.dataset.editAdvertisement))
        || await requestJson(`${ADVERTISEMENTS_API}/admin/${editButton.dataset.editAdvertisement}`);
      fillAdvertisementForm(advertisement);
      return;
    }

    if (deleteButton) {
      if (!confirm("Xoa vinh vien quang cao nay?")) return;

      await requestJson(`${ADVERTISEMENTS_API}/admin/${deleteButton.dataset.deleteAdvertisement}`, {
        method: "DELETE"
      });
      showAdminToast("Da xoa quang cao.");
      await loadAdvertisements();
    }
  } catch (error) {
    showAdminToast(error.message, "error");
  }
});

requireAdminSession();
const initialFoodCategory = pageParams.get("foodCategory") || sessionStorage.getItem("foodhub_food_category") || "all";
const initialFoodSubcategory = sessionStorage.getItem("foodhub_food_subcategory") || "all";
const initialFoodPageSize = Number(sessionStorage.getItem("foodhub_food_page_size") || "5");
const initialAccountType = pageParams.get("accountType") || sessionStorage.getItem("foodhub_account_type") || "staff";
const initialUsersPageSize = Number(sessionStorage.getItem("foodhub_users_page_size") || "5");

activeFoodCategory = initialFoodCategory === "food"
  ? "do-an"
  : initialFoodCategory === "drink"
    ? "nuoc-uong"
    : initialFoodCategory || "all";
activeFoodSubcategory = initialFoodSubcategory;

activeAccountType = normalizeAccountType(initialAccountType);
sessionStorage.setItem("foodhub_account_type", activeAccountType);

if ([5, 10, 20].includes(initialFoodPageSize) && foodPageSize) {
  foodsPerPage = initialFoodPageSize;
  foodPageSize.value = String(foodsPerPage);
}

if ([5, 10, 20].includes(initialUsersPageSize) && userPageSize) {
  usersPerPage = initialUsersPageSize;
  userPageSize.value = String(usersPerPage);
}

showAdminSection(pageParams.get("section") || sessionStorage.getItem("foodhub_admin_section") || "overview");
syncAccountView();
showAdvertisementListView();
loadAdminPermissions().then(loadUsers);
loadOrders();
loadCategories();
loadFoods();
loadAnnouncements();
loadDiscounts();
loadAdvertisements();
loadStats();
