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
const categoryPageSize = document.getElementById("categoryPageSize");
const usersList = document.getElementById("usersList");
const announcementsList = document.getElementById("announcementsList");
const announcementPageSize = document.getElementById("announcementPageSize");
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
const statsCategories = document.getElementById("statsCategories");
const statsSatisfaction = document.getElementById("statsSatisfaction");
const statsFromDate = document.getElementById("statsFromDate");
const statsToDate = document.getElementById("statsToDate");
const feedbackList = document.getElementById("feedbackList");
const feedbackSearch = document.getElementById("feedbackSearch");
const feedbackStatusFilter = document.getElementById("feedbackStatusFilter");
const feedbackPageSize = document.getElementById("feedbackPageSize");
const foodReviewsList = document.getElementById("foodReviewsList");
const foodReviewSearch = document.getElementById("foodReviewSearch");
const foodReviewRatingFilter = document.getElementById("foodReviewRatingFilter");
const foodReviewVisibilityFilter = document.getElementById("foodReviewVisibilityFilter");
const foodReviewPageSize = document.getElementById("foodReviewPageSize");
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
let categoriesPage = 1;
let categoriesPerPage = 5;
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
let announcementsPerPage = 5;
let discountSearchTimer;
let cachedDiscounts = [];
let discountsPage = 1;
let discountsPerPage = 5;
let advertisementSearchTimer;
let cachedAdvertisements = [];
let advertisementsPage = 1;
let advertisementsPerPage = 5;
let pendingAdvertisementImage = "";
let feedbackSearchTimer;
let cachedFeedback = [];
let feedbackPage = 1;
let feedbackPerPage = 5;
let foodReviewSearchTimer;
let cachedFoodReviews = [];
let foodReviewsPage = 1;
let foodReviewsPerPage = 5;
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
  return activeAccountType === "customers" ? "Tài khoản khách hàng" : "Tài khoản nhân viên";
}

function syncAccountView() {
  const accountSection = document.querySelector('[data-admin-section="accounts"]');
  if (!accountSection) return;

  accountSection.querySelector(".page-heading h2").textContent = getAccountTypeTitle();
  const breadcrumb = accountSection.querySelector(".page-heading p");
  if (breadcrumb) {
    breadcrumb.innerHTML = `<a href="index.html">Trang chủ</a> <span>/</span> ${getAccountTypeTitle()}`;
  }

  if (accountCreateLink) {
    accountCreateLink.href = `admin-account.html?type=${activeAccountType === "customers" ? "customer" : "staff"}`;
    accountCreateLink.textContent = activeAccountType === "customers" ? "+ Tạo khách hàng" : "+ Thêm nhân viên";
  }
}

function formatMoney(number) {
  return Number(number).toLocaleString("vi-VN") + "đ";
}

function formatDateTime(value) {
  if (!value) return "Chưa hẹn ngày";
  return new Date(value).toLocaleString("vi-VN");
}

function formatRole(role) {
  const roles = {
    USER: "Khách hàng",
    STAFF_SALES: "Nhân viên bán hàng",
    STAFF_CONTENT: "Quản lý món ăn",
    STAFF_MANAGER: "Quản lý nhân viên",
    ADMIN: "Admin"
  };

  return roles[role] || role || "Khách hàng";
}

function formatAnnouncementStatus(status) {
  const statuses = {
    active: "Hoạt động",
    hidden: "Đã ẩn",
    expired: "Hết hạn",
    scheduled: "Sắp hiển thị"
  };

  return statuses[status] || status || "Không rõ";
}

function formatDiscountStatus(status) {
  const statuses = {
    active: "Hoạt động",
    hidden: "Đã ẩn",
    expired: "Hết hạn",
    scheduled: "Sắp diễn ra",
    soldout: "Hết lượt"
  };

  return statuses[status] || status || "Không rõ";
}

function formatFeedbackStatus(status) {
  const statuses = {
    new: "Mới gửi",
    in_progress: "Đang xử lý",
    replied: "Đã phản hồi",
    closed: "Đã đóng"
  };

  return statuses[status] || status || "Không rõ";
}

function formatFeedbackCategory(category) {
  const categories = {
    general: "Trải nghiệm chung",
    order: "Đặt hàng",
    food: "Chất lượng món ăn",
    delivery: "Giao hàng",
    payment: "Thanh toán",
    account: "Tài khoản"
  };

  return categories[category] || "Trải nghiệm chung";
}

function renderFeedbackStars(rating) {
  const value = Math.max(1, Math.min(5, Number(rating) || 1));
  return "★".repeat(value) + "☆".repeat(5 - value);
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
    throw new Error(data.message || "Phiên đăng nhập da hết hạn.");
  }

  if (!response.ok) {
    throw new Error(data.message || "Không thể xử lý yêu cầu.");
  }

  return data;
}

async function requestFormData(url, formData, options = {}) {
  const response = await fetch(url, {
    ...options,
    method: options.method || "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    },
    body: formData
  });
  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
    window.location.href = "login.html";
    throw new Error(data.message || "Phiên đăng nhập đã hết hạn.");
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
  usersList.textContent = `Đang tải ${activeAccountType === "customers" ? "khách hàng" : "nhân viên"}...`;

  try {
    const params = new URLSearchParams({
      type: activeAccountType,
      q: userSearch?.value || ""
    });
    const users = await requestJson(`${ADMIN_API}/users?${params.toString()}`);

    if (users.length === 0) {
      cachedUsers = [];
      usersPage = 1;
      usersList.textContent = `Chưa có ${activeAccountType === "customers" ? "khách hàng" : "nhân viên"} phù hợp.`;
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
    usersList.textContent = `Chưa có ${activeAccountType === "customers" ? "khách hàng" : "nhân viên"} phù hợp.`;
    return;
  }

    usersList.innerHTML = `
      <div class="table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Họ tên</th>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Xác thực</th>
              <th>Trạng thái</th>
              <th>Chức năng</th>
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
                  <small>${account.passwordSet ? "Co mật khẩu" : "Chưa đặt mật khẩu"}</small>
                </td>
                <td>${escapeHtml(account.email)}</td>
                <td>${formatRole(account.role)}</td>
                <td>${account.emailVerified ? "Đã xác thực" : "Chưa xác thực"}</td>
                <td><span class="account-status ${account.isActive ? "active" : "locked"}">${account.isActive ? "Đang hoạt động" : "Đã khóa"}</span></td>
                <td>
                  <div class="table-actions">
                    ${isRootAdmin
                      ? `<span class="admin-lock-note">Quản trị cao nhat</span>`
                      : `
                        <a class="icon-btn edit" href="admin-account.html?id=${account.id}&type=${activeAccountType === "customers" ? "customer" : "staff"}" title="Sửa" aria-label="Sửa tài khoản">${editIcon()}</a>
                        <button type="button" class="icon-btn key" title="Dat mật khẩu" aria-label="Dat mật khẩu" data-reset-password="${account.id}">${keyIcon()}</button>
                        <button type="button" class="icon-btn delete" title="${account.isActive ? "Khoa" : "Mo khoa"}" aria-label="${account.isActive ? "Khoa tài khoản" : "Mo khoa tài khoản"}" data-toggle-user="${account.id}" data-active="${account.isActive ? "0" : "1"}">${trashIcon()}</button>
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
        Đang hiển thị từ ${from} đến ${to} của ${totalUsers} kết quả
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

  announcementsList.textContent = "Đang tải thông báo...";

  try {
    const params = new URLSearchParams({
      q: announcementSearch?.value || "",
      status: announcementStatusFilter?.value || "all"
    });
    const announcements = await requestJson(`${ADMIN_API}/announcements?${params.toString()}`);

    cachedAnnouncements = announcements;
    if (announcementsCount) announcementsCount.textContent = announcements.length;
    announcementsPage = Math.min(announcementsPage, Math.ceil(cachedAnnouncements.length / announcementsPerPage)) || 1;
    renderAnnouncementsTable();
  } catch (error) {
    announcementsList.textContent = error.message;
    showAdminToast(error.message, "error");
  }
}

function renderAnnouncementsTable() {
  if (!announcementsList) return;

  announcementsPerPage = Number(announcementPageSize?.value || announcementsPerPage || 5);
  if (![5, 10, 20].includes(announcementsPerPage)) announcementsPerPage = 5;

  const total = cachedAnnouncements.length;
  const totalPages = Math.max(1, Math.ceil(total / announcementsPerPage));
  announcementsPage = Math.min(Math.max(announcementsPage, 1), totalPages);

  const startIndex = (announcementsPage - 1) * announcementsPerPage;
  const pageItems = cachedAnnouncements.slice(startIndex, startIndex + announcementsPerPage);
  const from = total === 0 ? 0 : startIndex + 1;
  const to = startIndex + pageItems.length;

  if (total === 0) {
    announcementsList.textContent = "Chưa có thông báo phù hợp.";
    return;
  }

  announcementsList.innerHTML = `
    <div class="table-wrap">
      <table class="admin-table announcements-table">
        <thead>
          <tr>
            <th>STT</th>
            <th>Tiêu đề</th>
            <th>Ngày đăng</th>
            <th>Hết hiệu lực</th>
            <th>Trạng thái</th>
            <th>Chức năng</th>
          </tr>
        </thead>
        <tbody>
          ${pageItems.map((item, index) => `
            <tr>
              <td>${startIndex + index + 1}</td>
              <td>
                <strong>${escapeHtml(item.title)}</strong>
                <small>${escapeHtml(item.content || "Không có nội dung mô tả")}</small>
              </td>
              <td>${formatDateTime(item.published_at)}</td>
              <td>${item.expires_at ? formatDateTime(item.expires_at) : "Không giới hạn"}</td>
              <td><span class="account-status ${item.status === "active" ? "active" : "locked"}">${formatAnnouncementStatus(item.status)}</span></td>
              <td>
                <div class="table-actions">
                  <a class="icon-btn edit" href="admin-announcement.html?id=${item.id}" title="Sửa" aria-label="Sửa thông báo">${editIcon()}</a>
                  <button type="button" class="icon-btn delete" title="Xóa" aria-label="Xóa thông báo" data-hide-announcement="${item.id}">${trashIcon()}</button>
                </div>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
    <div class="table-footer">
      Đang hiển thị từ ${from} đến ${to} của ${total} kết quả
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
  document.getElementById("saveDiscountBtn").textContent = "Lưu ma";
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
  document.getElementById("saveDiscountBtn").textContent = "Cập nhật ma";
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

    showAdminToast(discountId ? "Đã cập nhật mã giảm giá." : "Đã tạo mã giảm giá.");
    resetDiscountForm();
    await loadDiscounts();
  } catch (error) {
    showAdminToast(error.message, "error");
  }
}

async function loadDiscounts() {
  if (!discountsList) return;

  discountsList.textContent = "Đang tải mã giảm giá...";

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
    discountsList.textContent = "Chưa có mã giảm giá phù hợp.";
    return;
  }

  discountsList.innerHTML = `
    <div class="table-wrap">
      <table class="admin-table discounts-table">
        <thead>
          <tr>
            <th>STT</th>
            <th>Mã</th>
            <th>Giá trị</th>
            <th>Điều kiện</th>
            <th>Hiệu lực</th>
            <th>Trạng thái</th>
            <th>Chức năng</th>
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
                <small>${item.max_discount ? `Tối đa ${formatMoney(item.max_discount)}` : "Không giới hạn giam"}</small>
              </td>
              <td>
                <strong>${item.starts_at ? formatDateTime(item.starts_at) : "Bắt đầu ngay"}</strong>
                <small>${item.expires_at ? formatDateTime(item.expires_at) : "Không giới hạn"}</small>
              </td>
              <td><span class="account-status ${item.status === "active" ? "active" : "locked"}">${formatDiscountStatus(item.status)}</span></td>
              <td>
                <div class="table-actions">
                  <button type="button" class="icon-btn edit" title="Sửa" aria-label="Sửa mã giảm giá" data-edit-discount="${item.id}">${editIcon()}</button>
                  <button type="button" class="icon-btn delete" title="Xóa" aria-label="Xóa mã giảm giá" data-delete-discount="${item.id}">${trashIcon()}</button>
                </div>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
    <div class="table-footer">
      Đang hiển thị từ ${from} đến ${to} của ${total} kết quả
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
    active: "Hoạt động",
    scheduled: "Sắp hiện",
    expired: "Hết hạn",
    hidden: "Đã ẩn"
  };
  return labels[status] || status || "Không rõ";
}

function getAdvertisementStatusClass(status) {
  if (status === "active") return "active";
  if (status === "scheduled") return "pending";
  return "locked";
}

function renderAdvertisementPreview(src) {
  if (!advertisementPreview) return;

  advertisementPreview.innerHTML = src
    ? `<img src="${escapeHtml(src)}" alt="Xem trước quảng cáo">`
    : "Chưa chọn anh";
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
  document.getElementById("saveAdvertisementBtn").textContent = "Lưu quảng cáo";
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
  document.getElementById("saveAdvertisementBtn").textContent = "Cập nhật quảng cáo";
  showAdvertisementFormView();
}

async function uploadAdvertisementImageFile() {
  const file = advertisementImageFile?.files?.[0];
  if (!file) return pendingAdvertisementImage;

  const validTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!validTypes.includes(file.type)) {
    throw new Error("Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.");
  }

  if (file.size > 1.5 * 1024 * 1024) {
    throw new Error("Ảnh quảng cáo tối đa 1.5MB.");
  }

  const formData = new FormData();
  formData.append("image", file);
  const data = await requestFormData(`${ADVERTISEMENTS_API}/admin/image`, formData);
  pendingAdvertisementImage = data.image || "";
  return pendingAdvertisementImage;
}
async function readAdvertisementPayload() {
  const image = await uploadAdvertisementImageFile();

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

    showAdminToast(advertisementId ? "Đã cập nhật quảng cáo." : "Đã tạo quảng cáo.");
    resetAdvertisementForm();
    await loadAdvertisements();
    showAdvertisementListView();
  } catch (error) {
    showAdminToast(error.message, "error");
  }
}

async function loadAdvertisements() {
  if (!advertisementsList) return;

  advertisementsList.textContent = "Đang tải quảng cáo...";

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
    advertisementsList.textContent = "Chưa có quảng cáo phù hợp.";
    return;
  }

  advertisementsList.innerHTML = `
    <div class="table-wrap">
      <table class="admin-table advertisements-table">
        <thead>
          <tr>
            <th>STT</th>
            <th>Hình ảnh</th>
            <th>Tiêu đề</th>
            <th>Vị trí</th>
            <th>Hiệu lực</th>
            <th>Trạng thái</th>
            <th>Chức năng</th>
          </tr>
        </thead>
        <tbody>
          ${pageItems.map((item, index) => `
            <tr>
              <td>${startIndex + index + 1}</td>
              <td><img class="ad-thumb" src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}"></td>
              <td>
                <strong>${escapeHtml(item.title)}</strong>
                <small>${item.link_url ? escapeHtml(item.link_url) : "Không gắn link"}</small>
              </td>
              <td>${formatAdvertisementPosition(item.position)}</td>
              <td>
                <strong>${item.starts_at ? formatDateTime(item.starts_at) : "Bắt đầu ngay"}</strong>
                <small>${item.expires_at ? formatDateTime(item.expires_at) : "Không giới hạn"}</small>
              </td>
              <td><span class="account-status ${getAdvertisementStatusClass(item.status)}">${formatAdvertisementStatus(item.status)}</span></td>
              <td>
                <div class="table-actions">
                  <button type="button" class="icon-btn edit" title="Sửa" aria-label="Sửa quảng cáo" data-edit-advertisement="${item.id}">${editIcon()}</button>
                  <button type="button" class="icon-btn delete" title="Xóa" aria-label="Xóa quảng cáo" data-delete-advertisement="${item.id}">${trashIcon()}</button>
                </div>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
    <div class="table-footer">
      Đang hiển thị từ ${from} đến ${to} của ${total} kết quả
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

async function loadFeedback() {
  if (!feedbackList) return;

  feedbackList.textContent = "Đang tải phản hồi...";

  try {
    const params = new URLSearchParams();
    if (feedbackSearch?.value.trim()) params.set("search", feedbackSearch.value.trim());
    if (feedbackStatusFilter?.value && feedbackStatusFilter.value !== "all") {
      params.set("status", feedbackStatusFilter.value);
    }

    cachedFeedback = await requestJson(`${ADMIN_API}/feedback?${params.toString()}`);
    renderFeedbackTable();
  } catch (error) {
    feedbackList.textContent = error.message;
    showAdminToast(error.message, "error");
  }
}

function renderFeedbackTable() {
  if (!feedbackList) return;

  const total = cachedFeedback.length;
  if (total === 0) {
    feedbackList.innerHTML = `<p class="empty-note">Chưa có phản hồi nào.</p>`;
    return;
  }

  const totalPages = Math.max(1, Math.ceil(total / feedbackPerPage));
  feedbackPage = Math.min(Math.max(feedbackPage, 1), totalPages);
  const startIndex = (feedbackPage - 1) * feedbackPerPage;
  const pageItems = cachedFeedback.slice(startIndex, startIndex + feedbackPerPage);
  const from = startIndex + 1;
  const to = Math.min(startIndex + pageItems.length, total);

  feedbackList.innerHTML = `
    <div class="feedback-admin-list">
      ${pageItems.map(item => `
        <article class="feedback-admin-card">
          <div class="feedback-admin-head">
            <div>
              <h3>${escapeHtml(item.title)}</h3>
              <p>
                <strong>${escapeHtml(item.customer_name)}</strong> - ${escapeHtml(item.customer_email)}<br>
                ${formatFeedbackCategory(item.category)} - ${formatDateTime(item.created_at)}
              </p>
            </div>
            <select class="status-select" data-feedback-status="${item.id}">
              ${["new", "in_progress", "replied", "closed"].map(status => `
                <option value="${status}" ${item.status === status ? "selected" : ""}>${formatFeedbackStatus(status)}</option>
              `).join("")}
            </select>
          </div>
          <div class="feedback-admin-rating">${renderFeedbackStars(item.rating)} <span>${Number(item.rating)}/5</span></div>
          <p class="feedback-admin-content">${escapeHtml(item.content)}</p>
          ${item.admin_reply ? `
            <div class="feedback-admin-reply">
              <strong>Đã phản hồi${item.replied_by_name ? ` - ${escapeHtml(item.replied_by_name)}` : ""}</strong>
              <p>${escapeHtml(item.admin_reply)}</p>
              <small>${item.replied_at ? formatDateTime(item.replied_at) : ""}</small>
            </div>
          ` : ""}
          <form class="feedback-reply-form" data-feedback-reply-form="${item.id}">
            <textarea name="reply" rows="3" placeholder="Nhập nội dung phản hồi đến khách hàng..." required>${item.admin_reply ? escapeHtml(item.admin_reply) : ""}</textarea>
            <button type="submit" class="primary-btn">Gửi phản hồi</button>
          </form>
        </article>
      `).join("")}
    </div>
    <div class="table-footer">
      Đang hiển thị từ ${from} đến ${to} của ${total} kết quả
      <div class="pager">
        <button type="button" data-feedback-page="prev" ${feedbackPage === 1 ? "disabled" : ""}>&lsaquo;</button>
        ${Array.from({ length: totalPages }, (_, index) => `
          <button type="button" class="${feedbackPage === index + 1 ? "active" : ""}" data-feedback-page="${index + 1}">${index + 1}</button>
        `).join("")}
        <button type="button" data-feedback-page="next" ${feedbackPage === totalPages ? "disabled" : ""}>&rsaquo;</button>
      </div>
    </div>
  `;
}

async function loadFoodReviews() {
  if (!foodReviewsList) return;

  foodReviewsList.textContent = "Dang tai binh luan...";

  try {
    const params = new URLSearchParams();
    if (foodReviewSearch?.value.trim()) params.set("search", foodReviewSearch.value.trim());
    if (foodReviewRatingFilter?.value && foodReviewRatingFilter.value !== "all") {
      params.set("rating", foodReviewRatingFilter.value);
    }
    if (foodReviewVisibilityFilter?.value && foodReviewVisibilityFilter.value !== "all") {
      params.set("visibility", foodReviewVisibilityFilter.value);
    }

    cachedFoodReviews = await requestJson(`${ADMIN_API}/food-reviews?${params.toString()}`);
    renderFoodReviewsTable();
  } catch (error) {
    foodReviewsList.textContent = error.message;
    showAdminToast(error.message, "error");
  }
}

function renderFoodReviewStars(rating) {
  const score = Math.max(0, Math.min(5, Number(rating) || 0));
  return `<span class="feedback-admin-rating">${"★".repeat(score)}${"☆".repeat(5 - score)} <span>${score}/5</span></span>`;
}

function renderFoodReviewsTable() {
  if (!foodReviewsList) return;

  const total = cachedFoodReviews.length;
  if (total === 0) {
    foodReviewsList.innerHTML = `<p class="empty-note">Chua co binh luan nao.</p>`;
    return;
  }

  const totalPages = Math.max(1, Math.ceil(total / foodReviewsPerPage));
  foodReviewsPage = Math.min(Math.max(foodReviewsPage, 1), totalPages);
  const startIndex = (foodReviewsPage - 1) * foodReviewsPerPage;
  const pageItems = cachedFoodReviews.slice(startIndex, startIndex + foodReviewsPerPage);
  const from = startIndex + 1;
  const to = Math.min(startIndex + pageItems.length, total);

  foodReviewsList.innerHTML = `
    <div class="feedback-admin-list">
      ${pageItems.map(item => {
        const isVisible = Number(item.is_visible) === 1;
        return `
          <article class="feedback-admin-card food-review-admin-card">
            <div class="feedback-admin-head">
              <div>
                <h3>${escapeHtml(item.food_name)}</h3>
                <p>
                  <strong>${escapeHtml(item.customer_name)}</strong> - ${escapeHtml(item.customer_email || "")}<br>
                  Don #${Number(item.order_id)} - ${formatDateTime(item.created_at)}
                </p>
              </div>
              <span class="account-status ${isVisible ? "active" : "locked"}">${isVisible ? "Dang hien thi" : "Da an"}</span>
            </div>
            <div class="food-review-admin-body">
              ${item.food_image ? `<img class="ad-thumb" src="${escapeHtml(item.food_image)}" alt="${escapeHtml(item.food_name)}">` : ""}
              <div>
                ${renderFoodReviewStars(item.rating)}
                <p class="feedback-admin-content">${escapeHtml(item.comment || "Khach hang chi danh gia sao.")}</p>
              </div>
            </div>
            <div class="table-actions">
              <button type="button" class="ghost-btn" data-food-review-visibility="${item.id}" data-visible="${isVisible ? "0" : "1"}">
                ${isVisible ? "An binh luan" : "Hien thi lai"}
              </button>
            </div>
          </article>
        `;
      }).join("")}
    </div>
    <div class="table-footer">
      Dang hien thi tu ${from} den ${to} cua ${total} ket qua
      <div class="pager">
        <button type="button" data-food-reviews-page="prev" ${foodReviewsPage === 1 ? "disabled" : ""}>&lsaquo;</button>
        ${Array.from({ length: totalPages }, (_, index) => `
          <button type="button" class="${foodReviewsPage === index + 1 ? "active" : ""}" data-food-reviews-page="${index + 1}">${index + 1}</button>
        `).join("")}
        <button type="button" data-food-reviews-page="next" ${foodReviewsPage === totalPages ? "disabled" : ""}>&rsaquo;</button>
      </div>
    </div>
  `;
}

async function loadStats() {
  if (!statsSummary) return;

  statsSummary.textContent = "Đang tải thống kê...";
  if (statsTopFoods) statsTopFoods.textContent = "Đang tải...";
  if (statsDaily) statsDaily.textContent = "Đang tải...";
  if (statsCategories) statsCategories.textContent = "Đang tải...";
  if (statsSatisfaction) statsSatisfaction.textContent = "Đang tải...";

  try {
    const params = new URLSearchParams();
    if (statsFromDate?.value) params.set("from", statsFromDate.value);
    if (statsToDate?.value) params.set("to", statsToDate.value);

    const data = await requestJson(`${ADMIN_API}/stats?${params.toString()}`);
    renderStats(data);
  } catch (error) {
    statsSummary.textContent = error.message;
    if (statsTopFoods) statsTopFoods.textContent = "";
    if (statsDaily) statsDaily.textContent = "";
    if (statsCategories) statsCategories.textContent = "";
    if (statsSatisfaction) statsSatisfaction.textContent = "";
    showAdminToast(error.message, "error");
  }
}

function renderStats(data) {
  const summary = data.summary || {};
  const totalOrders = Number(summary.total_orders || 0);
  const doneOrders = Number(summary.done_orders || 0);
  const successRate = totalOrders ? (doneOrders / totalOrders) * 100 : 0;
  const statCards = [
    {
      label: "Tổng doanh thu",
      value: formatMoney(summary.revenue || 0),
      hint: `${Number(summary.done_orders || 0).toLocaleString("vi-VN")} đơn hoàn tất`,
      icon: "₫"
    },
    {
      label: "Tổng đơn hàng",
      value: Number(summary.total_orders || 0).toLocaleString("vi-VN"),
      hint: `${Number(summary.pending_orders || 0).toLocaleString("vi-VN")} đơn chờ xử lý`,
      icon: "□"
    },
    {
      label: "Khách hàng",
      value: Number(summary.customers || 0).toLocaleString("vi-VN"),
      hint: `${Number(summary.total_users || 0).toLocaleString("vi-VN")} tài khoản trong hệ thống`,
      icon: "♙"
    },
    {
      label: "Tỷ lệ thành công",
      value: `${successRate.toFixed(1)}%`,
      hint: `${Number(summary.cancelled_orders || 0).toLocaleString("vi-VN")} đơn đã hủy`,
      icon: "✓"
    }
  ];

  statsSummary.innerHTML = statCards.map(card => `
    <article class="stats-card">
      <div>
        <span>${card.label}</span>
        <strong>${card.value}</strong>
        <small>${card.hint}</small>
      </div>
      <em aria-hidden="true">${card.icon}</em>
    </article>
  `).join("");

  if (statsDaily) statsDaily.innerHTML = renderRevenueTrend(data.dailyRevenue || []);
  if (statsTopFoods) statsTopFoods.innerHTML = renderTopFoodsList(data.topFoods || []);
  if (statsCategories) statsCategories.innerHTML = renderCategorySummary(data.categorySales || []);
  if (statsSatisfaction) statsSatisfaction.innerHTML = renderSatisfaction(data.feedback || {});
}

function renderRevenueTrend(rows) {
  const ordered = [...rows].reverse().slice(-7);
  if (!ordered.length) return `<p class="empty-note">Chưa có dữ liệu doanh thu.</p>`;

  const maxRevenue = Math.max(...ordered.map(item => Number(item.revenue || 0)), 1);
  const totalRevenue = ordered.reduce((sum, item) => sum + Number(item.revenue || 0), 0);
  const points = ordered.map((item, index) => {
    const x = ordered.length === 1 ? 50 : (index / (ordered.length - 1)) * 100;
    const y = 86 - (Number(item.revenue || 0) / maxRevenue) * 66;
    return `${x},${y}`;
  }).join(" ");
  const areaPoints = `0,92 ${points} 100,92`;

  return `
    ${totalRevenue === 0 ? `
      <div class="chart-empty">
        <strong>Chưa có doanh thu hoàn tất</strong>
        <span>Biểu đồ sẽ cập nhật khi có đơn hoàn tất trong khoảng thời gian đã chọn.</span>
      </div>
    ` : ""}
    <svg class="revenue-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#ff7a1a" stop-opacity="0.38"></stop>
          <stop offset="100%" stop-color="#ff7a1a" stop-opacity="0.04"></stop>
        </linearGradient>
      </defs>
      <polygon points="${areaPoints}" fill="url(#revenueFill)"></polygon>
      <polyline points="${points}" fill="none" stroke="#ff7a1a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></polyline>
    </svg>
    <div class="chart-labels">
      ${ordered.map(item => `
        <span>
          <strong>${formatMoney(item.revenue || 0)}</strong>
          ${new Date(item.order_date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
        </span>
      `).join("")}
    </div>
  `;
}

function renderTopFoodsList(rows) {
  if (!rows.length) return `<p class="empty-note">Chưa có dữ liệu món bán.</p>`;

  return `
    <div class="top-food-list">
      ${rows.map((item, index) => `
        <article>
          <span>${index + 1}</span>
          <div>
            <strong>${escapeHtml(item.food_name)}</strong>
            <small>${Number(item.quantity || 0).toLocaleString("vi-VN")} lượt bán</small>
          </div>
          <b>${formatMoney(item.revenue || 0)}</b>
        </article>
      `).join("")}
    </div>
  `;
}

function renderCategorySummary(rows) {
  if (!rows.length) return `<p class="empty-note">Chưa có dữ liệu danh mục.</p>`;

  const total = rows.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 1;
  let current = 0;
  const colors = ["#ff7a1a", "#ffc8ad", "#3d271c", "#ffefe7"];
  const segments = rows.slice(0, 4).map((item, index) => {
    const percent = Math.max(0, (Number(item.quantity || 0) / total) * 100);
    const start = current;
    current += percent;
    return `${colors[index]} ${start}% ${current}%`;
  }).join(", ");

  return `
    <div class="category-ring" style="background: conic-gradient(${segments});" aria-hidden="true"></div>
    <div class="category-list">
      ${rows.slice(0, 4).map((item, index) => `
        <p><i style="--i:${index};"></i>${escapeHtml(item.category_name || "Chưa phân loại")}<strong>${Number(item.quantity || 0).toLocaleString("vi-VN")}</strong></p>
      `).join("")}
    </div>
  `;
}

function renderSatisfaction(feedback) {
  const average = Number(feedback.average_rating || 0);
  const total = Number(feedback.total_feedback || 0);

  if (!total) return `<p class="empty-note">Chưa có phản hồi đánh giá.</p>`;

  return `
    <strong>${average.toFixed(1)}</strong>
    <span>/ 5.0</span>
    <small>${total.toLocaleString("vi-VN")} phản hồi</small>
  `;
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
          <div class="order-line">
            <span>Phi giao hang</span>
            <strong>${Number(order.shipping_fee || 0) > 0 ? formatMoney(order.shipping_fee) : "Mien phi"}</strong>
          </div>
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
  if (!slug || slug === "all") return "Tất cả món";
  return getCategoryBySlug(slug)?.name || "Tất cả món";
}

function renderAdminFoodCategoryNav() {
  const container = document.querySelector("[data-admin-food-categories]");
  if (!container) return;

  const roots = getRootCategories(false);
  container.innerHTML = `
    <a href="admin.html?section=foods&foodCategory=all" data-admin-target="foods" data-food-category="all">
      <span class="nav-icon" data-icon="dot" aria-hidden="true"></span><span class="nav-text">Tất cả món</span>
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
    <option value="">Danh mục cha</option>
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
    <option value="all">Tất cả</option>
    <option value="root">Danh mục cha</option>
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
    categoryFormTitle.textContent = mode === "edit" ? "Cập nhật danh mục" : "Thêm danh mục";
  }

  if (categoryFormSubtitle) {
    categoryFormSubtitle.textContent = mode === "edit"
      ? "Chỉnh sửa tên, cấp danh mục, thứ tự hiển thị và trạng thái."
      : "Tạo danh mục cha như Bánh kẹo hoặc danh mục con bên trong danh mục cha.";
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

  categoriesPerPage = Number(categoryPageSize?.value || categoriesPerPage || 5);
  if (![5, 10, 20].includes(categoriesPerPage)) categoriesPerPage = 5;

  const categories = getFilteredCategories();
  const total = categories.length;
  const totalPages = Math.max(1, Math.ceil(total / categoriesPerPage));
  categoriesPage = Math.min(Math.max(categoriesPage, 1), totalPages);

  const startIndex = (categoriesPage - 1) * categoriesPerPage;
  const pageItems = categories.slice(startIndex, startIndex + categoriesPerPage);
  const from = total === 0 ? 0 : startIndex + 1;
  const to = startIndex + pageItems.length;

  if (!total) {
    categoriesList.textContent = "Chưa có danh mục phù hợp.";
    return;
  }

  categoriesList.innerHTML = `
    <div class="table-wrap">
      <table class="admin-table compact-table">
        <thead>
          <tr>
            <th>STT</th>
            <th>Tên danh mục</th>
            <th>Cấp</th>
            <th>Thuộc danh mục cha</th>
            <th>Trạng thái</th>
            <th>Chức năng</th>
          </tr>
        </thead>
        <tbody>
          ${pageItems.map((category, index) => `
            <tr>
              <td>${startIndex + index + 1}</td>
              <td>
                <strong>${escapeHtml(category.name)}</strong>
                <small>${escapeHtml(category.slug || "")}</small>
              </td>
              <td>${category.parentId ? "Danh mục con" : "Danh mục cha"}</td>
              <td>${escapeHtml(category.parentName || "-")}</td>
              <td><span class="account-status ${Number(category.isActive) ? "active" : "locked"}">${Number(category.isActive) ? "Hoạt động" : "Đã ẩn"}</span></td>
              <td>
                <div class="table-actions">
                  <button type="button" class="icon-btn edit" title="Sửa" aria-label="Sửa danh mục" data-edit-category="${category.id}">${editIcon()}</button>
                  <button type="button" class="icon-btn delete" title="An" aria-label="Ẩn danh mục" data-delete-category="${category.id}">${trashIcon()}</button>
                </div>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
    <div class="table-footer">
      Đang hiển thị từ ${from} đến ${to} của ${total} kết quả
      <div class="pager">
        <button type="button" data-categories-page="prev" ${categoriesPage === 1 ? "disabled" : ""}>&lsaquo;</button>
        ${Array.from({ length: totalPages }, (_, index) => `
          <button type="button" class="${categoriesPage === index + 1 ? "active" : ""}" data-categories-page="${index + 1}">${index + 1}</button>
        `).join("")}
        <button type="button" data-categories-page="next" ${categoriesPage === totalPages ? "disabled" : ""}>&rsaquo;</button>
      </div>
    </div>
  `;
}

async function loadCategories() {
  if (!categoriesList) return;

  categoriesList.textContent = "Đang tải danh mục...";

  try {
    cachedCategories = (await requestJson(`${ADMIN_API}/categories?includeInactive=1`)).map(normalizeAdminCategory);
    categoriesPage = Math.min(categoriesPage, Math.ceil(cachedCategories.length / categoriesPerPage)) || 1;
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
    showAdminToast(categoryId ? "Đã cập nhật danh mục." : "Đã thêm danh mục.");
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

  foodsList.textContent = "Đang tải món ăn...";

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

  return "Chưa phân loại";
}

function getFoodCategoryFilterOptions() {
  const roots = getRootCategories(false);

  if (activeFoodCategory !== "all") {
    const root = getCategoryBySlug(activeFoodCategory);
    const children = cachedCategories
      .filter(category => String(category.parentId || "") === String(root?.id || "") && category.isActive)
      .sort((first, second) => Number(first.sortOrder || 0) - Number(second.sortOrder || 0));

    return [
      { value: "all", label: "Tất cả" },
      ...children.map(category => ({ value: String(category.id), label: category.name }))
    ];
  }

  return [
    { value: "all", label: "Tất cả" },
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
    foodsList.textContent = "Chưa có mon phù hợp.";
    return;
  }

  foodsList.innerHTML = `
    <div class="table-wrap">
      <table class="admin-table foods-admin-table">
        <thead>
          <tr>
            <th>STT</th>
            <th>Hình ảnh</th>
            <th>Tên món</th>
            <th>Giá</th>
            <th>Số lượng còn</th>
            <th>Chức năng</th>
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
                <small>${escapeHtml(getFoodCategoryLabel(food))} - ${food.is_active ? "Đang bán" : "Đã ẩn"}</small>
              </td>
              <td>${formatMoney(food.price)}</td>
              <td>${Number(food.stock_quantity ?? food.stockQuantity ?? 0).toLocaleString("vi-VN")}</td>
              <td>
                <div class="table-actions">
                  <a class="icon-btn edit" href="admin-food.html?id=${food.id}&foodCategory=${encodeURIComponent(getFoodRootSlug(food))}" title="Sửa" aria-label="Sửa món">${editIcon()}</a>
                  <button type="button" class="icon-btn delete" title="Ẩn mon" aria-label="Ẩn mon" data-hide-food="${food.id}">${trashIcon()}</button>
                </div>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
    <div class="table-footer">
      Đang hiển thị từ ${from} đến ${to} của ${totalFoods} kết quả
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
  if (!confirm("Ẩn mon này khoi thực đơn?")) {
    return;
  }

  try {
    await requestJson(`${ADMIN_API}/foods/${foodId}`, {
      method: "DELETE"
    });
    await loadFoods();
    showAdminToast("Đã ẩn mon khoi thực đơn.");
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
    showAdminToast("Đã tạo nhân viên.");
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
  const newPassword = prompt("Nhập mật khẩu mới tối thiểu 6 ky từ cho tài khoản này:");

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
categoryTypeFilter?.addEventListener("change", () => {
  categoriesPage = 1;
  renderCategoriesTable();
});
categoryPageSize?.addEventListener("change", () => {
  categoriesPerPage = Number(categoryPageSize.value || 5);
  categoriesPage = 1;
  renderCategoriesTable();
});
categorySearch?.addEventListener("input", () => {
  clearTimeout(categorySearchTimer);
  categoriesPage = 1;
  categorySearchTimer = setTimeout(renderCategoriesTable, 250);
});
categoriesList?.addEventListener("click", async event => {
  const pageButton = event.target.closest("[data-categories-page]");
  const editButton = event.target.closest("[data-edit-category]");
  const deleteButton = event.target.closest("[data-delete-category]");

  try {
    if (pageButton) {
      const pageAction = pageButton.dataset.categoriesPage;
      const totalPages = Math.max(1, Math.ceil(getFilteredCategories().length / categoriesPerPage));

      if (pageAction === "prev") {
        categoriesPage -= 1;
      } else if (pageAction === "next") {
        categoriesPage += 1;
      } else {
        categoriesPage = Number(pageAction);
      }

      categoriesPage = Math.min(Math.max(categoriesPage, 1), totalPages);
      renderCategoriesTable();
      return;
    }

    if (editButton) {
      const category = cachedCategories.find(item => String(item.id) === String(editButton.dataset.editCategory));
      fillCategoryForm(category);
      return;
    }

    if (deleteButton) {
      if (!confirm("Ẩn danh mục này? Nếu là danh mục cha, các mục con cũng sẽ bị ẩn.")) return;

      await requestJson(`${ADMIN_API}/categories/${deleteButton.dataset.deleteCategory}`, {
        method: "DELETE"
      });
      showAdminToast("Đã ẩn danh mục.");
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
announcementPageSize?.addEventListener("change", () => {
  announcementsPerPage = Number(announcementPageSize.value || 5);
  announcementsPage = 1;
  renderAnnouncementsTable();
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
document.getElementById("refreshFeedbackBtn")?.addEventListener("click", loadFeedback);
document.getElementById("refreshFoodReviewsBtn")?.addEventListener("click", loadFoodReviews);
feedbackStatusFilter?.addEventListener("change", () => {
  feedbackPage = 1;
  loadFeedback();
});
feedbackPageSize?.addEventListener("change", () => {
  feedbackPerPage = Number(feedbackPageSize.value) || 5;
  feedbackPage = 1;
  renderFeedbackTable();
});
feedbackSearch?.addEventListener("input", () => {
  clearTimeout(feedbackSearchTimer);
  feedbackPage = 1;
  feedbackSearchTimer = setTimeout(loadFeedback, 300);
});
foodReviewRatingFilter?.addEventListener("change", () => {
  foodReviewsPage = 1;
  loadFoodReviews();
});
foodReviewVisibilityFilter?.addEventListener("change", () => {
  foodReviewsPage = 1;
  loadFoodReviews();
});
foodReviewPageSize?.addEventListener("change", () => {
  foodReviewsPerPage = Number(foodReviewPageSize.value) || 5;
  foodReviewsPage = 1;
  renderFoodReviewsTable();
});
foodReviewSearch?.addEventListener("input", () => {
  clearTimeout(foodReviewSearchTimer);
  foodReviewsPage = 1;
  foodReviewSearchTimer = setTimeout(loadFoodReviews, 300);
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
      showAdminToast("Đã cập nhật trạng thái tài khoản.");
      await loadUsers();
    }

    if (resetButton) {
      await resetAccountPassword(resetButton.dataset.resetPassword);
      showAdminToast("Đã đặt lại mật khẩu.");
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
      const totalPages = Math.max(1, Math.ceil(cachedAnnouncements.length / announcementsPerPage));

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
      if (!confirm("Xóa vĩnh viễn thông báo này?")) return;

      await requestJson(`${ADMIN_API}/announcements/${hideButton.dataset.hideAnnouncement}`, {
        method: "DELETE"
      });
      showAdminToast("Đã xóa thông báo.");
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
      if (!confirm("Xóa vĩnh viễn mã giảm giá này?")) return;

      await requestJson(`${ADMIN_API}/discounts/${deleteButton.dataset.deleteDiscount}`, {
        method: "DELETE"
      });
      showAdminToast("Đã xóa mã giảm giá.");
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
      if (!confirm("Xóa vĩnh viễn quảng cáo này?")) return;

      await requestJson(`${ADVERTISEMENTS_API}/admin/${deleteButton.dataset.deleteAdvertisement}`, {
        method: "DELETE"
      });
      showAdminToast("Đã xóa quảng cáo.");
      await loadAdvertisements();
    }
  } catch (error) {
    showAdminToast(error.message, "error");
  }
});

feedbackList?.addEventListener("click", event => {
  const pageButton = event.target.closest("[data-feedback-page]");
  if (!pageButton) return;

  const pageAction = pageButton.dataset.feedbackPage;
  const totalPages = Math.max(1, Math.ceil(cachedFeedback.length / feedbackPerPage));

  if (pageAction === "prev") {
    feedbackPage -= 1;
  } else if (pageAction === "next") {
    feedbackPage += 1;
  } else {
    feedbackPage = Number(pageAction);
  }

  feedbackPage = Math.min(Math.max(feedbackPage, 1), totalPages);
  renderFeedbackTable();
});

feedbackList?.addEventListener("change", async event => {
  const statusSelect = event.target.closest("[data-feedback-status]");
  if (!statusSelect) return;

  try {
    await requestJson(`${ADMIN_API}/feedback/${statusSelect.dataset.feedbackStatus}`, {
      method: "PATCH",
      body: JSON.stringify({ status: statusSelect.value })
    });
    showAdminToast("Đã cập nhật trạng thái phản hồi.");
    await loadFeedback();
  } catch (error) {
    showAdminToast(error.message, "error");
    await loadFeedback();
  }
});

feedbackList?.addEventListener("submit", async event => {
  const form = event.target.closest("[data-feedback-reply-form]");
  if (!form) return;
  event.preventDefault();

  const button = form.querySelector("button[type='submit']");
  const reply = form.elements.reply.value;

  button.disabled = true;
  button.textContent = "Đang gửi...";

  try {
    await requestJson(`${ADMIN_API}/feedback/${form.dataset.feedbackReplyForm}/reply`, {
      method: "POST",
      body: JSON.stringify({ reply })
    });
    showAdminToast("Đã gửi phản hồi đến khách hàng.");
    await loadFeedback();
  } catch (error) {
    showAdminToast(error.message, "error");
  } finally {
    button.disabled = false;
    button.textContent = "Gửi phản hồi";
  }
});

foodReviewsList?.addEventListener("click", async event => {
  const pageButton = event.target.closest("[data-food-reviews-page]");
  if (pageButton) {
    const pageAction = pageButton.dataset.foodReviewsPage;
    const totalPages = Math.max(1, Math.ceil(cachedFoodReviews.length / foodReviewsPerPage));

    if (pageAction === "prev") {
      foodReviewsPage -= 1;
    } else if (pageAction === "next") {
      foodReviewsPage += 1;
    } else {
      foodReviewsPage = Number(pageAction);
    }

    foodReviewsPage = Math.min(Math.max(foodReviewsPage, 1), totalPages);
    renderFoodReviewsTable();
    return;
  }

  const visibilityButton = event.target.closest("[data-food-review-visibility]");
  if (!visibilityButton) return;

  visibilityButton.disabled = true;

  try {
    await requestJson(`${ADMIN_API}/food-reviews/${visibilityButton.dataset.foodReviewVisibility}/visibility`, {
      method: "PATCH",
      body: JSON.stringify({ isVisible: visibilityButton.dataset.visible === "1" })
    });
    showAdminToast("Da cap nhat hien thi binh luan.");
    await loadFoodReviews();
  } catch (error) {
    showAdminToast(error.message, "error");
    visibilityButton.disabled = false;
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
loadFeedback();
loadFoodReviews();
loadStats();
