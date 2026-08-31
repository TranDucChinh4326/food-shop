const API_BASE_URL = window.FOODHUB_CONFIG?.API_BASE_URL || "http://localhost:3000/api";
// Dashboard admin dùng các endpoint này để quản lý dữ liệu thật trong backend.
// Token admin được gửi kèm request để backend kiểm tra role/permissions trước khi cho thao tác.
const ADMIN_API = `${API_BASE_URL}/admin`;
const PUBLIC_FOODS_API = `${API_BASE_URL}/foods`;
const ADVERTISEMENTS_API = `${API_BASE_URL}/advertisements`;
const AUTH_TOKEN_KEY = "foodhub_token";
const AUTH_USER_KEY = "foodhub_user";

localStorage.removeItem(AUTH_TOKEN_KEY);
localStorage.removeItem(AUTH_USER_KEY);

const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
const user = JSON.parse(sessionStorage.getItem(AUTH_USER_KEY) || "null");

const ordersList = document.getElementById("ordersList");
const orderSearch = document.getElementById("orderSearch");
const orderStatusFilter = document.getElementById("orderStatusFilter");
const orderPageSize = document.getElementById("orderPageSize");
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
const foodSearch = document.getElementById("foodSearch");
const foodCategoryFilter = document.getElementById("foodCategoryFilter");
const foodStatusFilter = document.getElementById("foodStatusFilter");
const foodPageSize = document.getElementById("foodPageSize");
const foodCategoryTitle = document.getElementById("foodCategoryTitle");
const foodCreateLink = document.getElementById("foodCreateLink");
const stockImportForm = document.getElementById("stockImportForm");
const stockImportFile = document.getElementById("stockImportFile");
const stockImportDate = document.getElementById("stockImportDate");
const stockImportResult = document.getElementById("stockImportResult");
const stockImportHistory = document.getElementById("stockImportHistory");
const downloadStockTemplateBtn = document.getElementById("downloadStockTemplateBtn");
const userSearch = document.getElementById("userSearch");
const userStatusFilter = document.getElementById("userStatusFilter");
const userPageSize = document.getElementById("userPageSize");
const accountCreateLink = document.getElementById("accountCreateLink");
const announcementSearch = document.getElementById("announcementSearch");
const announcementStatusFilter = document.getElementById("announcementStatusFilter");
const announcementsCount = document.getElementById("announcementsCount");
const discountsList = document.getElementById("discountsList");
const flashSalesList = document.getElementById("flashSalesList");
const flashSaleForm = document.getElementById("flashSaleForm");
const flashSaleItemForm = document.getElementById("flashSaleItemForm");
const flashSaleListView = document.getElementById("flashSaleListView");
const flashSaleFormView = document.getElementById("flashSaleFormView");
const flashSaleFormTitle = document.getElementById("flashSaleFormTitle");
const flashSaleSearch = document.getElementById("flashSaleSearch");
const flashSaleStatusFilter = document.getElementById("flashSaleStatusFilter");
const flashSalePageSize = document.getElementById("flashSalePageSize");
const flashSaleFoodSelect = document.getElementById("flashSaleFoodSelect");
const flashSaleItemsList = document.getElementById("flashSaleItemsList");
const flashSaleItemNotice = document.getElementById("flashSaleItemNotice");
const saveFlashSaleItemBtn = document.getElementById("saveFlashSaleItemBtn");
const discountForm = document.getElementById("discountForm");
const discountListView = document.getElementById("discountListView");
const discountFormView = document.getElementById("discountFormView");
const discountFormTitle = document.getElementById("discountFormTitle");
const discountSearch = document.getElementById("discountSearch");
const discountStatusFilter = document.getElementById("discountStatusFilter");
const discountPageSize = document.getElementById("discountPageSize");
const shippingMethodForm = document.getElementById("shippingMethodForm");
const shippingMethodsList = document.getElementById("shippingMethodsList");
const shippingListView = document.getElementById("shippingListView");
const shippingFormView = document.getElementById("shippingFormView");
const shippingSearch = document.getElementById("shippingSearch");
const shippingStatusFilter = document.getElementById("shippingStatusFilter");
const shippingPageSize = document.getElementById("shippingPageSize");
const advertisementsList = document.getElementById("advertisementsList");
const advertisementForm = document.getElementById("advertisementForm");
const advertisementLayout = document.querySelector(".advertisement-admin-layout");
const advertisementSearch = document.getElementById("advertisementSearch");
const advertisementPositionFilter = document.getElementById("advertisementPositionFilter");
const advertisementStatusFilter = document.getElementById("advertisementStatusFilter");
const advertisementPageSize = document.getElementById("advertisementPageSize");
const advertisementImageFile = document.getElementById("advertisementImageFile");
const advertisementPreview = document.getElementById("advertisementPreview");
const advertisementFoodLinkSelect = document.getElementById("advertisementFoodLinkSelect");
const statsSummary = document.getElementById("statsSummary");
const statsTopFoods = document.getElementById("statsTopFoods");
const statsDaily = document.getElementById("statsDaily");
const statsCategories = document.getElementById("statsCategories");
const statsCustomers = document.getElementById("statsCustomers");
const statsSatisfaction = document.getElementById("statsSatisfaction");
const statsFromDate = document.getElementById("statsFromDate");
const statsToDate = document.getElementById("statsToDate");
const statsTrendMode = document.getElementById("statsTrendMode");
const statsTrendLabel = document.getElementById("statsTrendLabel");
const feedbackList = document.getElementById("feedbackList");
const feedbackSearch = document.getElementById("feedbackSearch");
const feedbackStatusFilter = document.getElementById("feedbackStatusFilter");
const feedbackPageSize = document.getElementById("feedbackPageSize");
const foodReviewsList = document.getElementById("foodReviewsList");
const foodReviewSearch = document.getElementById("foodReviewSearch");
const foodReviewRatingFilter = document.getElementById("foodReviewRatingFilter");
const foodReviewVisibilityFilter = document.getElementById("foodReviewVisibilityFilter");
const foodReviewPageSize = document.getElementById("foodReviewPageSize");
const auditLogsList = document.getElementById("auditLogsList");
const auditLogSearch = document.getElementById("auditLogSearch");
const auditLogModuleFilter = document.getElementById("auditLogModuleFilter");
const auditLogActionFilter = document.getElementById("auditLogActionFilter");
const auditLogLimit = document.getElementById("auditLogLimit");
let navButtons = [...document.querySelectorAll("[data-admin-target]")];
let navToggles = [...document.querySelectorAll("[data-admin-toggle]")];
const adminSections = [...document.querySelectorAll("[data-admin-section]")];
const shortcutButtons = [...document.querySelectorAll("[data-admin-shortcut]")];
const pageParams = new URLSearchParams(window.location.search);
const SECTION_PERMISSIONS = {
  overview: ["stats.view"],
  orders: ["orders.manage"],
  categories: ["foods.manage"],
  foods: ["foods.manage"],
  accounts: ["users.manage", "staff.manage"],
  announcements: ["announcements.manage"],
  advertisements: ["ads.manage"],
  "flash-sales": ["discounts.manage"],
  discounts: ["discounts.manage"],
  shipping: ["shipping.manage"],
  feedback: ["feedback.manage"],
  "food-reviews": ["feedback.manage"],
  "audit-logs": ["stats.view", "roles.manage", "staff.manage"]
};
const statusLabels = {
  pending: "Ch\u1edd x\u00e1c nh\u1eadn",
  confirmed: "\u0110\u00e3 x\u00e1c nh\u1eadn",
  delivering: "\u0110ang giao",
  done: "Ho\u00e0n t\u1ea5t",
  cancelled: "\u0110\u00e3 h\u1ee7y"
};
const auditActionLabels = {
  create: "T\u1ea1o m\u1edbi",
  update: "C\u1eadp nh\u1eadt",
  delete: "X\u00f3a"
};

let adminPermissions = [];
let orderSearchTimer;
let cachedOrders = [];
let ordersPage = 1;
let ordersPerPage = 5;
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
let flashSaleSearchTimer;
let cachedFlashSales = [];
let flashSalesPage = 1;
let flashSalesPerPage = 5;
let flashSaleFoodOptions = [];
let cachedDiscounts = [];
let discountsPage = 1;
let discountsPerPage = 5;
let shippingSearchTimer;
let cachedShippingMethods = [];
let shippingPage = 1;
let shippingPerPage = 5;
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
let auditLogSearchTimer;
let cachedAuditLogs = [];
let currentAdmin = {
  ...user,
  permissions: Array.isArray(user?.permissions) ? user.permissions : []
};

const STAFF_PERMISSION_GROUPS = [
  {
    value: "sales",
    label: "Nh\u00e2n vi\u00ean b\u00e1n h\u00e0ng",
    permissions: ["orders.manage"]
  },
  {
    value: "content",
    label: "Qu\u1ea3n l\u00fd m\u00f3n \u0103n",
    permissions: ["foods.manage", "categories.manage", "ads.manage", "food-reviews.manage"]
  },
  {
    value: "support",
    label: "Ch\u0103m s\u00f3c kh\u00e1ch h\u00e0ng",
    permissions: ["feedback.manage", "announcements.manage"]
  },
  {
    value: "account_admin",
    label: "Qu\u1ea3n tr\u1ecb t\u00e0i kho\u1ea3n",
    permissions: ["users.manage", "staff.manage", "roles.manage", "password.reset"]
  },
  {
    value: "manager",
    label: "Qu\u1ea3n l\u00fd v\u1eadn h\u00e0nh",
    permissions: ["orders.manage", "foods.manage", "categories.manage", "discounts.manage", "shipping.manage", "staff.manage"]
  }
];

function isRootAdmin() {
  return String(currentAdmin?.role || "").toUpperCase() === "ADMIN";
}

function hasAdminPermission(permission) {
  if (isRootAdmin()) return true;
  return Array.isArray(currentAdmin?.permissions) && currentAdmin.permissions.includes(permission);
}

function canAccessSection(sectionId) {
  const permissions = SECTION_PERMISSIONS[sectionId] || [];
  return permissions.length === 0 || permissions.some(hasAdminPermission);
}

function getFirstAllowedSection() {
  const preferred = ["overview", "orders", "foods", "categories", "accounts", "announcements", "advertisements", "flash-sales", "discounts", "shipping", "feedback", "food-reviews", "audit-logs"];
  return preferred.find(canAccessSection) || "overview";
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
  const exists = adminSections.some(section => section.dataset.adminSection === sectionId);
  const target = exists && canAccessSection(sectionId) ? sectionId : getFirstAllowedSection();
  const activeToggle = target === "foods"
    ? "foods-menu"
    : target === "accounts"
      ? "accounts-menu"
      : target === "announcements" || target === "advertisements"
        ? "news-menu"
        : target === "flash-sales" || target === "discounts"
          ? "promotions-menu"
          : target === "feedback" || target === "food-reviews"
            ? "customer-care-menu"
            : "";

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

  navToggles.forEach(toggle => {
    setAdminNavGroupOpen(toggle.dataset.adminToggle, toggle.dataset.adminToggle === activeToggle);
  });

  sessionStorage.setItem("foodhub_admin_section", target);
}

function normalizeAccountType(value) {
  if (value === "customers" && hasAdminPermission("users.manage")) return "customers";
  if (value === "staff" && hasAdminPermission("staff.manage")) return "staff";
  if (hasAdminPermission("staff.manage")) return "staff";
  if (hasAdminPermission("users.manage")) return "customers";
  return "staff";
}

function applyAdminPermissionUi() {
  document.querySelectorAll("[data-admin-target]").forEach(link => {
    const section = link.dataset.adminTarget;
    const accountType = link.dataset.accountType;
    let allowed = canAccessSection(section);

    if (section === "accounts" && accountType === "staff") allowed = hasAdminPermission("staff.manage");
    if (section === "accounts" && accountType === "customers") allowed = hasAdminPermission("users.manage");

    link.hidden = !allowed;
  });

  document.querySelectorAll("[data-admin-toggle]").forEach(toggle => {
    const name = toggle.dataset.adminToggle;
    const group = toggle.closest(".admin-nav-group");
    const allowed = name === "foods-menu"
      ? hasAdminPermission("foods.manage")
      : name === "accounts-menu"
        ? hasAdminPermission("users.manage") || hasAdminPermission("staff.manage")
        : name === "news-menu"
          ? canAccessSection("announcements") || canAccessSection("advertisements")
          : name === "promotions-menu"
            ? canAccessSection("flash-sales") || canAccessSection("discounts")
            : name === "customer-care-menu"
              ? canAccessSection("feedback") || canAccessSection("food-reviews")
              : true;
    if (group) group.hidden = !allowed;
  });

  adminSections.forEach(section => {
    section.hidden = !canAccessSection(section.dataset.adminSection);
  });

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
  if (discount.discount_type === "free_shipping") {
    return "Mi\u1ec5n ph\u00ed ship";
  }

  if (discount.discount_type === "fixed") {
    return formatMoney(discount.discount_value);
  }

  return `${Number(discount.discount_value).toLocaleString("vi-VN")}%`;
}

function formatDiscountScope(discount) {
  return discount.apply_to === "shipping" ? "Ph\u00ed giao h\u00e0ng" : "\u0110\u01a1n h\u00e0ng";
}

function formatDiscountQuantity(discount) {
  const claimed = Number(discount.claimed_count || 0);
  const used = Number(discount.used_count || 0);

  if (discount.usage_limit === null || discount.usage_limit === undefined) {
    return `
      <strong>Kh\u00f4ng gi\u1edbi h\u1ea1n</strong>
      <small>\u0110\u00e3 nh\u1eadn ${claimed} - \u0110\u00e3 d\u00f9ng ${used}</small>
    `;
  }

  const limit = Number(discount.usage_limit || 0);
  const remaining = Math.max(0, limit - claimed);
  return `
    <strong>${remaining}/${limit} c\u00f2n l\u1ea1i</strong>
    <small>\u0110\u00e3 nh\u1eadn ${claimed} - \u0110\u00e3 d\u00f9ng ${used}</small>
  `;
}

function formatDateInputValue(value) {
  if (!value) return "";
  if (typeof value === "string") {
    const localMatch = value.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/);
    if (localMatch && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(value)) {
      return `${localMatch[1]}T${localMatch[2]}`;
    }
  }

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

function shieldIcon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 19 6v5c0 4.5-2.8 8-7 10-4.2-2-7-5.5-7-10V6Z"></path>
      <path d="M9 12l2 2 4-5"></path>
    </svg>
  `;
}

function lockIcon(isActive = true) {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2"></rect>
      ${isActive ? '<path d="M8 11V7a4 4 0 0 1 8 0v4"></path>' : '<path d="M8 11V7a4 4 0 0 1 7.2-2.4"></path><path d="M3 3l18 18"></path>'}
    </svg>
  `;
}

function visibilityIcon(isVisible = true) {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"></path>
      <circle cx="12" cy="12" r="3"></circle>
      ${isVisible ? "" : '<path d="M3 3l18 18"></path>'}
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
  // Chặn người dùng thường truy cập trang quản trị từ frontend.
  // Backend vẫn là lớp bảo vệ chính, hàm này chỉ giúp điều hướng UX sớm về trang đăng nhập.
  const role = String(user?.role || "").toUpperCase();

  if (!token || role === "USER") {
    showAdminToast("Vui lòng đăng nhập bằng tài khoản quản trị.", "error");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 500);
  }
}

async function requestJson(url, options = {}) {
  // Wrapper gọi API admin dạng JSON.
  // Tự gắn Authorization header, xử lý hết phiên đăng nhập và chuẩn hóa lỗi để các màn hình dùng chung.
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

function formatPermissionSummary(permissions = []) {
  if (!Array.isArray(permissions) || permissions.length === 0) return "Chưa cấp quyền";

  const labels = new Map(adminPermissions.map(permission => [permission.value, permission.label]));
  return permissions.map(permission => labels.get(permission) || permission).join(", ");
}

function formatAccountKind(account) {
  return formatRole(String(account?.role || "").toUpperCase());
}

function getCompactPaginationItems(totalPages, currentPage) {
  const total = Math.max(1, Number(totalPages) || 1);
  const current = Math.min(Math.max(1, Number(currentPage) || 1), total);
  if (total <= 5) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sortedPages = [...pages]
    .filter(page => page >= 1 && page <= total)
    .sort((a, b) => a - b);

  return sortedPages.reduce((items, page, index) => {
    if (index > 0 && page - sortedPages[index - 1] > 1) {
      items.push("ellipsis");
    }
    items.push(page);
    return items;
  }, []);
}

function renderAdminPaginationButton(page, currentPage, dataName) {
  if (page === "ellipsis") {
    return `<button type="button" class="ellipsis" disabled>...</button>`;
  }

  return `<button type="button" class="${page === currentPage ? "active" : ""}" data-${dataName}-page="${page}">${page}</button>`;
}

function detectPermissionGroup(permissions = []) {
  const selected = new Set(Array.isArray(permissions) ? permissions : []);
  const matched = STAFF_PERMISSION_GROUPS.find(group =>
    group.permissions.length === selected.size && group.permissions.every(permission => selected.has(permission))
  );
  return matched?.value || "";
}

function closePermissionDialog() {
  document.getElementById("permissionDialog")?.remove();
}

function showPermissionDialog(account) {
  if (!account || !hasAdminPermission("roles.manage")) return;

  closePermissionDialog();

  const selectedGroup = detectPermissionGroup(account.permissions || []);
  const dialog = document.createElement("div");
  dialog.id = "permissionDialog";
  dialog.className = "permission-dialog";
  dialog.innerHTML = `
    <div class="permission-dialog-card" role="dialog" aria-modal="true" aria-labelledby="permissionDialogTitle">
      <div class="permission-dialog-head">
        <div>
          <h3 id="permissionDialogTitle">Phân quyền nhân viên</h3>
          <p>${escapeHtml(account.fullname || account.username || account.email)} - ${escapeHtml(account.username || account.email || "")}</p>
        </div>
        <button type="button" class="icon-btn" data-close-permission-dialog aria-label="Đóng">&times;</button>
      </div>
      <form data-permission-form="${account.id}">
        <label class="permission-group-field">
          <span>Lo\u1ea1i t\u00e0i kho\u1ea3n</span>
          <select data-permission-group>
            <option value="">T\u00f9y ch\u1ec9nh</option>
            ${STAFF_PERMISSION_GROUPS.map(group => `
              <option value="${group.value}" ${group.value === selectedGroup ? "selected" : ""}>${group.label}</option>
            `).join("")}
          </select>
        </label>
        <div class="permission-list account-permissions">
          ${adminPermissions.map(permission => `
            <label class="permission-item">
              <input type="checkbox" value="${permission.value}" ${(account.permissions || []).includes(permission.value) ? "checked" : ""}>
              <span>${permission.label}</span>
            </label>
          `).join("")}
        </div>
        <div class="permission-dialog-actions">
          <button type="button" class="ghost-btn" data-close-permission-dialog>Hủy</button>
          <button type="submit" class="primary-btn">Lưu phân quyền</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(dialog);
}

async function loadAdminPermissions() {
  if (!hasAdminPermission("roles.manage")) {
    adminPermissions = [];
    return;
  }

  try {
    const data = await requestJson(`${ADMIN_API}/permissions`);
    adminPermissions = data.permissions || [];
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

function getFilteredUsers() {
  const status = userStatusFilter?.value || "all";

  return cachedUsers.filter(account =>
    status === "all"
      || (status === "active" && account.isActive)
      || (status === "locked" && !account.isActive)
  );
}

function renderUsersTable() {
  if (!usersList) return;

  const filteredUsers = getFilteredUsers();
  const totalUsers = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalUsers / usersPerPage));
  usersPage = Math.min(Math.max(usersPage, 1), totalPages);

  const startIndex = (usersPage - 1) * usersPerPage;
  const pageUsers = filteredUsers.slice(startIndex, startIndex + usersPerPage);
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
              <th>Lo\u1ea1i t\u00e0i kho\u1ea3n</th>
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
                </td>
                <td><span class="permission-summary">${escapeHtml(formatAccountKind(account))}</span></td>
                <td>${account.emailVerified ? "Đã xác thực" : "Chưa xác thực"}</td>
                <td><span class="account-status ${account.isActive ? "active" : "locked"}">${account.isActive ? "Đang hoạt động" : "Đã khóa"}</span></td>
                <td>
                  <div class="table-actions">
                    ${isRootAdmin
                      ? `<span class="admin-lock-note">Quản trị cao nhat</span>`
                      : `
                        <a class="icon-btn edit" href="admin-account.html?id=${account.id}&type=${activeAccountType === "customers" ? "customer" : "staff"}" title="Sửa" aria-label="Sửa tài khoản">${editIcon()}</a>
                        ${activeAccountType === "staff" && hasAdminPermission("roles.manage") ? `<button type="button" class="icon-btn permission" title="Phân quyền" aria-label="Phân quyền" data-permission-user="${account.id}">${shieldIcon()}</button>` : ""}
                        <button type="button" class="icon-btn key" title="Đặt mật khẩu" aria-label="Đặt mật khẩu" data-reset-password="${account.id}">${keyIcon()}</button>
                        <button type="button" class="icon-btn" title="${account.isActive ? "Khóa" : "Mở khóa"}" aria-label="${account.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}" data-toggle-user="${account.id}" data-active="${account.isActive ? "0" : "1"}">${lockIcon(account.isActive)}</button>
                        <button type="button" class="icon-btn delete" title="Xóa vĩnh viễn" aria-label="Xóa vĩnh viễn tài khoản" data-delete-user="${account.id}">${trashIcon()}</button>
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
          ${getCompactPaginationItems(totalPages, usersPage).map(page => renderAdminPaginationButton(page, usersPage, "users")).join("")}
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
        ${getCompactPaginationItems(totalPages, announcementsPage).map(page => renderAdminPaginationButton(page, announcementsPage, "announcements")).join("")}
        <button type="button" data-announcements-page="next" ${announcementsPage === totalPages ? "disabled" : ""}>&rsaquo;</button>
      </div>
    </div>
  `;
}

function resetFlashSaleForm() {
  if (!flashSaleForm) return;

  flashSaleForm.reset();
  document.getElementById("flashSaleId").value = "";
  document.getElementById("flashSaleIsActive").value = "1";
  document.getElementById("flashSaleScheduleType").value = "once";
  syncFlashSaleScheduleFields();
  document.getElementById("saveFlashSaleBtn").textContent = "Lưu flash sale";
  if (flashSaleFormTitle) flashSaleFormTitle.textContent = "Thêm mới flash sale";
  resetFlashSaleItemForm();
  renderFlashSaleItems();
  syncFlashSaleItemFormState();
}

function syncFlashSaleScheduleFields() {
  const scheduleType = document.getElementById("flashSaleScheduleType")?.value || "once";
  const onceFields = document.querySelector("[data-flash-sale-once-fields]");
  const dailyFields = document.querySelector("[data-flash-sale-daily-fields]");
  if (onceFields) onceFields.hidden = scheduleType !== "once";
  if (dailyFields) dailyFields.hidden = scheduleType !== "daily";

  document.getElementById("flashSaleStartsAt")?.toggleAttribute("required", scheduleType === "once");
  document.getElementById("flashSaleEndsAt")?.toggleAttribute("required", scheduleType === "once");
  document.getElementById("flashSaleStartTime")?.toggleAttribute("required", scheduleType === "daily");
  document.getElementById("flashSaleEndTime")?.toggleAttribute("required", scheduleType === "daily");
}

function resetFlashSaleItemForm() {
  if (!flashSaleItemForm) return;

  flashSaleItemForm.reset();
  document.getElementById("flashSaleItemSaleId").value = document.getElementById("flashSaleId")?.value || "";
  document.getElementById("flashSaleItemSort").value = "0";
  document.getElementById("flashSaleItemIsActive").value = "1";
}

function syncFlashSaleItemFormState() {
  if (!flashSaleItemForm) return;

  const hasSale = Boolean(document.getElementById("flashSaleId")?.value);
  flashSaleItemForm.classList.toggle("is-locked", !hasSale);
  flashSaleItemForm.querySelectorAll("select, input, button").forEach(control => {
    if (control.id === "flashSaleItemSaleId") return;
    control.disabled = !hasSale;
  });
  if (saveFlashSaleItemBtn) {
    saveFlashSaleItemBtn.textContent = hasSale ? "Thêm món vào flash sale" : "Lưu flash sale trước";
  }
  if (flashSaleItemNotice) {
    flashSaleItemNotice.textContent = hasSale
      ? "Chọn từng món áp dụng giảm giá, nhập giá sale và số lượng giới hạn nếu cần."
      : "Lưu thông tin flash sale trước, sau đó chọn món và giá giảm ở đây.";
  }
}

function renderFlashSaleItems(items = [], saleId = "") {
  if (!flashSaleItemsList) return;

  if (!items.length) {
    flashSaleItemsList.innerHTML = `<p class="muted-note">Chưa có món nào trong flash sale.</p>`;
    return;
  }

  flashSaleItemsList.innerHTML = `
    <div class="table-wrap compact-table">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Món</th>
            <th>Giá sale</th>
            <th>Giới hạn</th>
            <th>Đã bán</th>
            <th>Trạng thái</th>
            <th>Chức năng</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td><strong>${escapeHtml(item.food_name || item.foodName || item.name || "")}</strong></td>
              <td>${formatMoney(item.sale_price || item.salePrice || 0)}</td>
              <td>${Number(item.stock_limit ?? item.stockLimit ?? 0) || "Không giới hạn"}</td>
              <td>${Number(item.sold_count ?? item.soldCount ?? 0).toLocaleString("vi-VN")}</td>
              <td>${renderFlashSaleStatus(item.is_active || item.isActive ? "active" : "hidden")}</td>
              <td>
                <div class="table-actions">
                  <button type="button" class="icon-btn delete" title="Xóa món" aria-label="Xóa món khỏi flash sale" data-delete-flash-sale-item="${item.id}" data-flash-sale-id="${saleId}">${trashIcon()}</button>
                </div>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function openFlashSaleForm() {
  if (!flashSaleForm) return;

  if (flashSaleListView) flashSaleListView.hidden = true;
  if (flashSaleFormView) flashSaleFormView.hidden = false;
  flashSaleForm.classList.add("is-open");
  flashSaleForm.hidden = false;
  (flashSaleFormView || flashSaleForm).scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeFlashSaleForm() {
  if (!flashSaleForm) return;

  flashSaleForm.classList.remove("is-open");
  flashSaleForm.hidden = true;
  if (flashSaleFormView) flashSaleFormView.hidden = true;
  if (flashSaleListView) flashSaleListView.hidden = false;
}

function readFlashSalePayload() {
  const scheduleType = document.getElementById("flashSaleScheduleType")?.value || "once";
  return {
    title: document.getElementById("flashSaleTitle").value,
    scheduleType,
    startsAt: scheduleType === "once" ? document.getElementById("flashSaleStartsAt").value || null : null,
    endsAt: scheduleType === "once" ? document.getElementById("flashSaleEndsAt").value || null : null,
    startDate: scheduleType === "daily" ? document.getElementById("flashSaleStartDate").value || null : null,
    endDate: scheduleType === "daily" ? document.getElementById("flashSaleEndDate").value || null : null,
    startTime: scheduleType === "daily" ? document.getElementById("flashSaleStartTime").value || null : null,
    endTime: scheduleType === "daily" ? document.getElementById("flashSaleEndTime").value || null : null,
    isActive: document.getElementById("flashSaleIsActive").value === "1"
  };
}

function readFlashSaleItemPayload() {
  return {
    foodId: document.getElementById("flashSaleFoodSelect").value,
    salePrice: document.getElementById("flashSaleItemPrice").value,
    stockLimit: document.getElementById("flashSaleItemStock").value,
    perUserLimit: document.getElementById("flashSaleItemPerUser").value,
    sortOrder: document.getElementById("flashSaleItemSort").value,
    isActive: document.getElementById("flashSaleItemIsActive").value === "1"
  };
}

function normalizeFlashSaleFood(food) {
  return {
    id: food.id,
    name: food.name || food.title || "Món ăn",
    price: Number(food.price || food.original_price || food.originalPrice || 0)
  };
}

function renderFlashSaleFoodOptions() {
  if (!flashSaleFoodSelect) return;

  const options = flashSaleFoodOptions
    .slice()
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "vi"))
    .map(food => `<option value="${food.id}">${escapeHtml(food.name)} - ${formatMoney(food.price || food.originalPrice || 0)}</option>`)
    .join("");

  flashSaleFoodSelect.innerHTML = `<option value="">Chọn món</option>${options}`;
}

async function loadFlashSaleFoodOptions() {
  if (!flashSaleFoodSelect || flashSaleFoodOptions.length) return;

  try {
    const foods = await requestJson(PUBLIC_FOODS_API);
    flashSaleFoodOptions = Array.isArray(foods) ? foods.map(normalizeFlashSaleFood) : [];
    renderFlashSaleFoodOptions();
  } catch (error) {
    showAdminToast(error.message, "error");
  }
}

async function fillFlashSaleForm(sale) {
  const detail = sale.items ? sale : await requestJson(`${ADMIN_API}/flash-sales/${sale.id}`);

  document.getElementById("flashSaleId").value = detail.id || "";
  document.getElementById("flashSaleTitle").value = detail.title || "";
  document.getElementById("flashSaleScheduleType").value = detail.schedule_type || detail.scheduleType || "once";
  document.getElementById("flashSaleStartsAt").value = formatDateInputValue(detail.starts_at || detail.startsAt);
  document.getElementById("flashSaleEndsAt").value = formatDateInputValue(detail.ends_at || detail.endsAt);
  document.getElementById("flashSaleStartDate").value = detail.start_date || detail.startDate || "";
  document.getElementById("flashSaleEndDate").value = detail.end_date || detail.endDate || "";
  document.getElementById("flashSaleStartTime").value = String(detail.start_time || detail.startTime || "").slice(0, 5);
  document.getElementById("flashSaleEndTime").value = String(detail.end_time || detail.endTime || "").slice(0, 5);
  document.getElementById("flashSaleIsActive").value = detail.is_active || detail.isActive ? "1" : "0";
  syncFlashSaleScheduleFields();
  document.getElementById("saveFlashSaleBtn").textContent = "Cập nhật flash sale";
  if (flashSaleFormTitle) flashSaleFormTitle.textContent = "Cập nhật flash sale";
  if (flashSaleItemForm) {
    document.getElementById("flashSaleItemSaleId").value = detail.id || "";
  }
  renderFlashSaleItems(detail.items || [], detail.id || "");
  syncFlashSaleItemFormState();
  await loadFlashSaleFoodOptions();
  openFlashSaleForm();
}

function getFilteredFlashSales() {
  const q = String(flashSaleSearch?.value || "").trim().toLowerCase();
  const status = flashSaleStatusFilter?.value || "all";

  return cachedFlashSales.filter(sale => {
    const matchesSearch = !q || `${sale.title || ""}`.toLowerCase().includes(q);
    const matchesStatus = status === "all" || sale.status === status;
    return matchesSearch && matchesStatus;
  });
}

async function loadFlashSales() {
  if (!flashSalesList) return;

  flashSalesList.textContent = "Đang tải flash sale...";

  try {
    cachedFlashSales = await requestJson(`${ADMIN_API}/flash-sales`);
    flashSalesPage = Math.min(flashSalesPage, Math.ceil(cachedFlashSales.length / flashSalesPerPage)) || 1;
    renderFlashSalesTable();
  } catch (error) {
    flashSalesList.textContent = error.message;
  }
}

function renderFlashSaleStatus(status) {
  const labels = {
    active: "Đang chạy",
    scheduled: "Sắp diễn ra",
    expired: "Đã kết thúc",
    hidden: "Đã ẩn"
  };
  const tone = status === "active" ? "success" : status === "hidden" ? "danger" : status === "scheduled" ? "warning" : "muted";
  return `<span class="status-pill ${tone}">${labels[status] || status || "Không rõ"}</span>`;
}

function renderFlashSaleTime(item) {
  const scheduleType = item.schedule_type || item.scheduleType || "once";
  if (scheduleType === "daily") {
    const startTime = String(item.start_time || item.startTime || "").slice(0, 5) || "--:--";
    const endTime = String(item.end_time || item.endTime || "").slice(0, 5) || "--:--";
    const startDate = item.start_date || item.startDate || "Từ hôm nay";
    const endDate = item.end_date || item.endDate || "Không giới hạn";
    return `
      <span>Lặp mỗi ngày ${startTime} - ${endTime}</span>
      <small>${escapeHtml(startDate)} đến ${escapeHtml(endDate)}</small>
    `;
  }

  return `
    <span>${formatDateTime(item.starts_at) || "Bắt đầu ngay"}</span>
    <small>${formatDateTime(item.ends_at) || "Không giới hạn"}</small>
  `;
}

function renderFlashSalesTable() {
  if (!flashSalesList) return;

  flashSalesPerPage = Number(flashSalePageSize?.value || flashSalesPerPage || 5);
  if (![5, 10, 20].includes(flashSalesPerPage)) flashSalesPerPage = 5;
  const rows = getFilteredFlashSales();
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / flashSalesPerPage));
  flashSalesPage = Math.min(Math.max(flashSalesPage, 1), totalPages);
  const startIndex = (flashSalesPage - 1) * flashSalesPerPage;
  const pageItems = rows.slice(startIndex, startIndex + flashSalesPerPage);

  if (!pageItems.length) {
    flashSalesList.textContent = "Chưa có flash sale phù hợp.";
    return;
  }

  flashSalesList.innerHTML = `
    <div class="table-wrap flash-sales-table-wrap">
      <table class="admin-table flash-sales-table">
        <thead>
          <tr>
            <th>Chương trình</th>
            <th>Thời gian</th>
            <th>Món</th>
            <th>Đã bán</th>
            <th>Trạng thái</th>
            <th>Chức năng</th>
          </tr>
        </thead>
        <tbody>
          ${pageItems.map(item => `
            <tr>
              <td class="flash-sale-name"><strong>${escapeHtml(item.title || "")}</strong></td>
              <td class="flash-sale-time">
                ${renderFlashSaleTime(item)}
              </td>
              <td class="table-number">${Number(item.item_count || 0).toLocaleString("vi-VN")}</td>
              <td class="table-number">${Number(item.sold_count || 0).toLocaleString("vi-VN")}</td>
              <td>${renderFlashSaleStatus(item.status)}</td>
              <td>
                <div class="table-actions">
                  <button type="button" class="icon-btn edit" title="Sửa" aria-label="Sửa flash sale" data-edit-flash-sale="${item.id}">${editIcon()}</button>
                  <button type="button" class="icon-btn delete" title="Xóa" aria-label="Xóa flash sale" data-delete-flash-sale="${item.id}">${trashIcon()}</button>
                </div>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
    <div class="table-footer">
      <span>Hiển thị ${startIndex + 1}-${Math.min(startIndex + flashSalesPerPage, total)} / ${total}</span>
      <div class="pager">
        <button type="button" data-flash-sales-page="prev" ${flashSalesPage === 1 ? "disabled" : ""}>&lsaquo;</button>
        ${getCompactPaginationItems(totalPages, flashSalesPage).map(page => renderAdminPaginationButton(page, flashSalesPage, "flash-sales")).join("")}
        <button type="button" data-flash-sales-page="next" ${flashSalesPage === totalPages ? "disabled" : ""}>&rsaquo;</button>
      </div>
    </div>
  `;
}

async function saveFlashSale(event) {
  event.preventDefault();

  const flashSaleId = document.getElementById("flashSaleId").value;
  const payload = readFlashSalePayload();

  try {
    const result = await requestJson(`${ADMIN_API}/flash-sales${flashSaleId ? `/${flashSaleId}` : ""}`, {
      method: flashSaleId ? "PUT" : "POST",
      body: JSON.stringify(payload)
    });
    const savedId = flashSaleId || result.id;

    document.getElementById("flashSaleId").value = savedId || "";
    document.getElementById("flashSaleItemSaleId").value = savedId || "";
    syncFlashSaleItemFormState();
    if (flashSaleFormTitle) flashSaleFormTitle.textContent = "Cập nhật flash sale";
    document.getElementById("saveFlashSaleBtn").textContent = "Cập nhật flash sale";
    showAdminToast(flashSaleId ? "Đã cập nhật flash sale." : "Đã tạo flash sale.");
    await loadFlashSales();
  } catch (error) {
    showAdminToast(error.message, "error");
  }
}

async function saveFlashSaleItem(event) {
  event.preventDefault();

  const saleId = document.getElementById("flashSaleItemSaleId").value || document.getElementById("flashSaleId").value;
  if (!saleId) {
    showAdminToast("Vui lòng lưu flash sale trước khi thêm món.", "error");
    return;
  }

  try {
    await requestJson(`${ADMIN_API}/flash-sales/${saleId}/items`, {
      method: "POST",
      body: JSON.stringify(readFlashSaleItemPayload())
    });
    showAdminToast("Đã lưu món flash sale.");
    resetFlashSaleItemForm();
    const detail = await requestJson(`${ADMIN_API}/flash-sales/${saleId}`);
    renderFlashSaleItems(detail.items || [], saleId);
    await loadFlashSales();
  } catch (error) {
    showAdminToast(error.message, "error");
  }
}

function resetDiscountForm() {
  if (!discountForm) return;

  discountForm.reset();
  document.getElementById("discountId").value = "";
  document.getElementById("discountMinOrder").value = "0";
  document.getElementById("discountIsActive").value = "1";
  document.getElementById("saveDiscountBtn").textContent = "Lưu mã";
  if (discountFormTitle) discountFormTitle.textContent = "Thêm mới mã giảm giá";
}

function openDiscountForm() {
  if (!discountForm) return;

  if (discountListView) discountListView.hidden = true;
  if (discountFormView) discountFormView.hidden = false;
  discountForm.classList.add("is-open");
  discountForm.hidden = false;
  (discountFormView || discountForm).scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeDiscountForm() {
  if (!discountForm) return;

  discountForm.classList.remove("is-open");
  discountForm.hidden = true;
  if (discountFormView) discountFormView.hidden = true;
  if (discountListView) discountListView.hidden = false;
}
function fillDiscountForm(discount) {
  document.getElementById("discountId").value = discount.id;
  document.getElementById("discountCode").value = discount.code || "";
  document.getElementById("discountName").value = discount.name || "";
  document.getElementById("discountType").value = discount.discount_type || "percent";
  document.getElementById("discountApplyTo").value = discount.apply_to || "order";
  document.getElementById("discountValue").value = discount.discount_value || "";
  document.getElementById("discountMinOrder").value = discount.min_order || 0;
  document.getElementById("discountMaxDiscount").value = discount.max_discount ?? "";
  document.getElementById("discountUsageLimit").value = discount.usage_limit ?? "";
  document.getElementById("discountStartsAt").value = formatDateInputValue(discount.starts_at);
  document.getElementById("discountExpiresAt").value = formatDateInputValue(discount.expires_at);
  document.getElementById("discountIsActive").value = discount.is_active ? "1" : "0";
  document.getElementById("saveDiscountBtn").textContent = "Cập nhật mã";
  if (discountFormTitle) discountFormTitle.textContent = "Cập nhật mã giảm giá";
  openDiscountForm();
}

function readDiscountPayload() {
  return {
    code: document.getElementById("discountCode").value,
    name: document.getElementById("discountName").value,
    discountType: document.getElementById("discountType").value,
    applyTo: document.getElementById("discountApplyTo").value,
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
    closeDiscountForm();
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
            <th>S\u1ed1 l\u01b0\u1ee3ng</th>
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
                <strong>${formatDiscountScope(item)} - T\u1eeb ${formatMoney(item.min_order || 0)}</strong>
                <small>${item.max_discount ? `Tối đa ${formatMoney(item.max_discount)}` : "Không giới hạn giảm"}</small>
              </td>
              <td>${formatDiscountQuantity(item)}</td>
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
        ${getCompactPaginationItems(totalPages, discountsPage).map(page => renderAdminPaginationButton(page, discountsPage, "discounts")).join("")}
        <button type="button" data-discounts-page="next" ${discountsPage === totalPages ? "disabled" : ""}>&rsaquo;</button>
      </div>
    </div>
  `;
}

function resetShippingMethodForm() {
  if (!shippingMethodForm) return;

  shippingMethodForm.reset();
  document.getElementById("shippingMethodId").value = "";
  document.getElementById("shippingMethodSortOrder").value = "0";
  document.getElementById("shippingMethodIsActive").value = "1";
  shippingMethodForm.dataset.mode = "create";
  const status = shippingFormView?.querySelector("[data-shipping-edit-status]");
  const title = shippingFormView?.querySelector("[data-shipping-form-title]");
  const submit = shippingMethodForm.querySelector("[data-shipping-submit]");
  const reset = shippingMethodForm.querySelector("[data-reset-shipping-method]");
  if (title) title.textContent = "Thêm phương thức giao hàng";
  if (status) status.textContent = "Tạo hình thức giao hàng mới để khách lựa chọn khi đặt đơn.";
  if (submit) submit.textContent = "Thêm phí vận chuyển";
  if (reset) reset.textContent = "Nhập lại";
}

function openShippingMethodForm() {
  if (!shippingFormView) return;

  if (shippingListView) shippingListView.hidden = true;
  shippingFormView.hidden = false;
  shippingFormView.scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeShippingMethodForm() {
  if (!shippingFormView) return;

  shippingFormView.hidden = true;
  if (shippingListView) shippingListView.hidden = false;
}

function fillShippingMethodForm(method) {
  document.getElementById("shippingMethodId").value = method.id;
  document.getElementById("shippingMethodName").value = method.name || "";
  document.getElementById("shippingMethodFee").value = method.fee ?? 0;
  document.getElementById("shippingMethodEstimatedTime").value = method.estimated_time || "";
  document.getElementById("shippingMethodSortOrder").value = method.sort_order ?? 0;
  document.getElementById("shippingMethodDescription").value = method.description || "";
  document.getElementById("shippingMethodIsActive").value = Number(method.is_active) ? "1" : "0";
  shippingMethodForm.dataset.mode = "edit";
  const status = shippingFormView?.querySelector("[data-shipping-edit-status]");
  const title = shippingFormView?.querySelector("[data-shipping-form-title]");
  const submit = shippingMethodForm.querySelector("[data-shipping-submit]");
  const reset = shippingMethodForm.querySelector("[data-reset-shipping-method]");
  if (title) title.textContent = "Cập nhật phương thức giao hàng";
  if (status) status.textContent = `Đang chỉnh sửa: ${method.name || "Hình thức giao hàng"}`;
  if (submit) submit.textContent = "Cập nhật phí vận chuyển";
  if (reset) reset.textContent = "Hủy sửa";
  openShippingMethodForm();
}

function getShippingMethodPayload() {
  return {
    name: document.getElementById("shippingMethodName").value,
    fee: document.getElementById("shippingMethodFee").value,
    estimatedTime: document.getElementById("shippingMethodEstimatedTime").value,
    sortOrder: document.getElementById("shippingMethodSortOrder").value,
    description: document.getElementById("shippingMethodDescription").value,
    isActive: document.getElementById("shippingMethodIsActive").value === "1"
  };
}

async function saveShippingMethod(event) {
  event.preventDefault();

  const methodId = document.getElementById("shippingMethodId").value;
  const button = shippingMethodForm.querySelector("button[type='submit']");
  button.disabled = true;

  try {
    await requestJson(`${ADMIN_API}/shipping-methods${methodId ? `/${methodId}` : ""}`, {
      method: methodId ? "PUT" : "POST",
      body: JSON.stringify(getShippingMethodPayload())
    });
    showAdminToast(methodId ? "Đã cập nhật phí vận chuyển." : "Đã tạo phí vận chuyển.");
    resetShippingMethodForm();
    closeShippingMethodForm();
    await loadShippingMethodsAdmin();
  } catch (error) {
    showAdminToast(error.message, "error");
  } finally {
    button.disabled = false;
  }
}

async function loadShippingMethodsAdmin() {
  if (!shippingMethodsList) return;

  shippingMethodsList.textContent = "Đang tải phí vận chuyển...";

  try {
    cachedShippingMethods = await requestJson(`${ADMIN_API}/shipping-methods`);
    renderShippingMethodsTable();
  } catch (error) {
    shippingMethodsList.textContent = error.message;
    showAdminToast(error.message, "error");
  }
}

function getFilteredShippingMethods() {
  const search = String(shippingSearch?.value || "").trim().toLowerCase();
  const status = shippingStatusFilter?.value || "all";

  return cachedShippingMethods.filter(method => {
    const matchesStatus = status === "all"
      || (status === "active" && Number(method.is_active))
      || (status === "hidden" && !Number(method.is_active));
    const searchText = [
      method.name,
      method.description,
      method.estimated_time,
      method.fee,
      method.sort_order
    ].join(" ").toLowerCase();

    return matchesStatus && (!search || searchText.includes(search));
  });
}

function renderShippingMethodsTable() {
  if (!shippingMethodsList) return;

  shippingPerPage = Number(shippingPageSize?.value || shippingPerPage || 5);
  if (![5, 10, 20].includes(shippingPerPage)) shippingPerPage = 5;

  const filteredMethods = getFilteredShippingMethods();
  const total = filteredMethods.length;
  const totalPages = Math.max(1, Math.ceil(total / shippingPerPage));
  shippingPage = Math.min(Math.max(shippingPage, 1), totalPages);

  const startIndex = (shippingPage - 1) * shippingPerPage;
  const pageItems = filteredMethods.slice(startIndex, startIndex + shippingPerPage);
  const from = total === 0 ? 0 : startIndex + 1;
  const to = startIndex + pageItems.length;

  if (!total) {
    shippingMethodsList.textContent = "Chưa có hình thức giao hàng phù hợp.";
    return;
  }

  shippingMethodsList.innerHTML = `
    <div class="table-wrap">
      <table class="admin-table shipping-methods-table">
        <thead>
          <tr>
            <th>Hình thức</th>
            <th>Phí</th>
            <th>Thời gian</th>
            <th>Thứ tự</th>
            <th>Trạng thái</th>
            <th>Chức năng</th>
          </tr>
        </thead>
        <tbody>
          ${pageItems.map(method => `
            <tr>
              <td>
                <strong>${escapeHtml(method.name)}</strong>
              </td>
              <td>${Number(method.fee || 0) > 0 ? formatMoney(method.fee) : "Miễn phí"}</td>
              <td>${escapeHtml(method.estimated_time || "")}</td>
              <td>${Number(method.sort_order || 0).toLocaleString("vi-VN")}</td>
              <td><span class="account-status ${Number(method.is_active) ? "active" : "locked"}">${Number(method.is_active) ? "Hoạt động" : "Đã ẩn"}</span></td>
              <td>
                <div class="table-actions">
                  <button type="button" class="icon-btn edit" title="Sửa" aria-label="Sửa phí vận chuyển" data-edit-shipping-method="${method.id}">${editIcon()}</button>
                  <button type="button" class="icon-btn delete" title="Xóa" aria-label="Xóa phí vận chuyển" data-delete-shipping-method="${method.id}">${trashIcon()}</button>
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
        <button type="button" data-shipping-page="prev" ${shippingPage === 1 ? "disabled" : ""}>&lsaquo;</button>
        ${getCompactPaginationItems(totalPages, shippingPage).map(page => renderAdminPaginationButton(page, shippingPage, "shipping")).join("")}
        <button type="button" data-shipping-page="next" ${shippingPage === totalPages ? "disabled" : ""}>&rsaquo;</button>
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

function buildAdvertisementFoodLink(food) {
  if (!food?.id) return "";

  const category = getFoodRootSlug(food);
  const url = new URL("food-detail.html", window.location.origin);
  url.searchParams.set("id", food.id);
  url.searchParams.set("from", "admin");
  if (category && category !== "all") url.searchParams.set("category", category);
  return url.href;
}

function findAdvertisementFoodByLink(link) {
  if (!link) return null;

  try {
    const url = new URL(link, window.location.origin);
    const id = Number(url.searchParams.get("id") || 0);
    return cachedFoods.find(food => Number(food.id) === id) || null;
  } catch (error) {
    return null;
  }
}

function renderAdvertisementFoodLinkOptions() {
  if (!advertisementFoodLinkSelect) return;

  const currentLink = document.getElementById("advertisementLink")?.value || "";
  const linkedFood = findAdvertisementFoodByLink(currentLink);
  const selectedId = String(linkedFood?.id || advertisementFoodLinkSelect.value || "");
  const sortedFoods = [...cachedFoods].sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "vi"));

  advertisementFoodLinkSelect.innerHTML = `<option value="">Không chọn món</option>` + sortedFoods.map(food => `
    <option value="${food.id}" ${String(food.id) === selectedId ? "selected" : ""}>${escapeHtml(food.name || `Món #${food.id}`)}</option>
  `).join("");
}

function syncAdvertisementFoodLink() {
  if (!advertisementFoodLinkSelect) return;

  const food = cachedFoods.find(item => String(item.id) === String(advertisementFoodLinkSelect.value));
  const linkInput = document.getElementById("advertisementLink");
  if (food && linkInput) linkInput.value = buildAdvertisementFoodLink(food);
}

function renderAdvertisementPreview(src) {
  if (!advertisementPreview) return;

  advertisementPreview.innerHTML = src
    ? `<img src="${escapeHtml(src)}" alt="Xem trước quảng cáo">`
    : "Chưa chọn anh";
}

function previewAdvertisementImageFile() {
  const file = advertisementImageFile?.files?.[0];
  if (!file) {
    renderAdvertisementPreview(pendingAdvertisementImage);
    return;
  }

  const validTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!validTypes.includes(file.type)) {
    throw new Error("Chi ho tro anh JPG, PNG hoac WebP.");
  }

  if (file.size > 1.5 * 1024 * 1024) {
    throw new Error("Ảnh quảng cáo tối đa 1.5MB.");
  }

  renderAdvertisementPreview(URL.createObjectURL(file));
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
  if (advertisementFoodLinkSelect) advertisementFoodLinkSelect.value = "";
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
  renderAdvertisementFoodLinkOptions();
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
        ${getCompactPaginationItems(totalPages, advertisementsPage).map(page => renderAdminPaginationButton(page, advertisementsPage, "advertisements")).join("")}
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
        ${getCompactPaginationItems(totalPages, feedbackPage).map(page => renderAdminPaginationButton(page, feedbackPage, "feedback")).join("")}
        <button type="button" data-feedback-page="next" ${feedbackPage === totalPages ? "disabled" : ""}>&rsaquo;</button>
      </div>
    </div>
  `;
}

async function loadFoodReviews() {
  if (!foodReviewsList) return;

  foodReviewsList.textContent = "Đang tải bình luận...";

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
    foodReviewsList.innerHTML = `<p class="empty-note">Chưa có bình luận nào.</p>`;
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
                  Đơn #${Number(item.order_id)} - ${formatDateTime(item.created_at)}
                </p>
              </div>
              <span class="account-status ${isVisible ? "active" : "locked"}">${isVisible ? "Đã duyệt" : "Chờ duyệt"}</span>
            </div>
            <div class="food-review-admin-body">
              ${item.food_image ? `<img class="ad-thumb" src="${escapeHtml(item.food_image)}" alt="${escapeHtml(item.food_name)}">` : ""}
              <div>
                ${renderFoodReviewStars(item.rating)}
                <p class="feedback-admin-content">${escapeHtml(item.comment || "Khách hàng chỉ đánh giá sao.")}</p>
              </div>
            </div>
            ${item.admin_reply ? `
              <div class="feedback-admin-reply">
                <strong>Phản hồi của admin</strong>
                <p>${escapeHtml(item.admin_reply)}</p>
                <small>${item.replied_by_name ? `${escapeHtml(item.replied_by_name)} - ` : ""}${formatDateTime(item.replied_at)}</small>
              </div>
            ` : ""}
            <form class="feedback-reply-form" data-food-review-reply-form="${item.id}">
              <textarea name="reply" rows="3" maxlength="2000" placeholder="Nhập phản hồi cho bình luận này..." required>${item.admin_reply ? escapeHtml(item.admin_reply) : ""}</textarea>
              <button type="submit" class="primary-btn">${item.admin_reply ? "Cập nhật phản hồi" : "Gửi phản hồi"}</button>
            </form>
            <div class="table-actions">
              <button type="button" class="ghost-btn" data-food-review-visibility="${item.id}" data-visible="${isVisible ? "0" : "1"}">
                ${isVisible ? "Ẩn bình luận" : "Phê duyệt"}
              </button>
              <button type="button" class="ghost-btn danger-btn" data-delete-food-review="${item.id}">
                Xóa bình luận
              </button>
            </div>
          </article>
        `;
      }).join("")}
    </div>
    <div class="table-footer">
      Đang hiển thị từ ${from} đến ${to} của ${total} kết quả
      <div class="pager">
        <button type="button" data-food-reviews-page="prev" ${foodReviewsPage === 1 ? "disabled" : ""}>&lsaquo;</button>
        ${getCompactPaginationItems(totalPages, foodReviewsPage).map(page => renderAdminPaginationButton(page, foodReviewsPage, "food-reviews")).join("")}
        <button type="button" data-food-reviews-page="next" ${foodReviewsPage === totalPages ? "disabled" : ""}>&rsaquo;</button>
      </div>
    </div>
  `;
}

function formatAuditAction(action) {
  return auditActionLabels[action] || action || "-";
}

function formatAuditDetails(details) {
  if (!details) return "-";

  const payload = typeof details === "string"
    ? (() => {
      try {
        return JSON.parse(details);
      } catch (_) {
        return {};
      }
    })()
    : details;

  const entries = Object.entries(payload || {})
    .filter(([key]) => key !== "statusCode")
    .slice(0, 3);

  if (!entries.length) return "-";

  return entries
    .map(([key, value]) => `${escapeHtml(key)}: ${escapeHtml(String(value ?? ""))}`)
    .join("<br>");
}

function syncAuditLogModuleFilter() {
  if (!auditLogModuleFilter) return;

  const current = auditLogModuleFilter.value || "all";
  const modules = [...new Set(cachedAuditLogs.map(item => item.module).filter(Boolean))].sort((a, b) => a.localeCompare(b, "vi"));
  auditLogModuleFilter.innerHTML = `
    <option value="all">T\u1ea5t c\u1ea3 module</option>
    ${modules.map(moduleName => `<option value="${escapeHtml(moduleName)}">${escapeHtml(moduleName)}</option>`).join("")}
  `;
  auditLogModuleFilter.value = modules.includes(current) ? current : "all";
}

async function loadAuditLogs() {
  if (!auditLogsList) return;

  auditLogsList.textContent = "\u0110ang t\u1ea3i nh\u1eadt k\u00fd...";

  try {
    const params = new URLSearchParams();
    if (auditLogSearch?.value.trim()) params.set("search", auditLogSearch.value.trim());
    if (auditLogModuleFilter?.value && auditLogModuleFilter.value !== "all") params.set("module", auditLogModuleFilter.value);
    if (auditLogActionFilter?.value && auditLogActionFilter.value !== "all") params.set("action", auditLogActionFilter.value);
    if (auditLogLimit?.value) params.set("limit", auditLogLimit.value);

    const data = await requestJson(`${ADMIN_API}/audit-logs?${params.toString()}`);
    cachedAuditLogs = data.logs || [];
    syncAuditLogModuleFilter();
    renderAuditLogsTable();
  } catch (error) {
    auditLogsList.textContent = error.message;
    showAdminToast(error.message, "error");
  }
}

function renderAuditLogsTable() {
  if (!auditLogsList) return;

  if (!cachedAuditLogs.length) {
    auditLogsList.innerHTML = `<p class="empty-note">Ch\u01b0a c\u00f3 nh\u1eadt k\u00fd thao t\u00e1c.</p>`;
    return;
  }

  auditLogsList.innerHTML = renderSimpleTable(
    ["Th\u1eddi gian", "Nh\u00e2n vi\u00ean", "Thao t\u00e1c", "Module", "\u0110\u1ed1i t\u01b0\u1ee3ng", "Chi ti\u1ebft"],
    cachedAuditLogs.map(item => `
      <tr>
        <td><strong>${formatDateTime(item.created_at)}</strong><small>${escapeHtml(item.ip_address || "")}</small></td>
        <td><strong>${escapeHtml(item.actor_name || "Kh\u00f4ng r\u00f5")}</strong><small>${escapeHtml(item.actor_role || "")}</small></td>
        <td><span class="account-status ${item.action === "delete" ? "locked" : "active"}">${formatAuditAction(item.action)}</span></td>
        <td>${escapeHtml(item.module || "-")}</td>
        <td><strong>${escapeHtml(item.target_type || "-")}</strong><small>${escapeHtml(item.target_id || "")}</small></td>
        <td><small>${formatAuditDetails(item.details)}</small><small>${escapeHtml(item.method || "")} ${escapeHtml(item.path || "")}</small></td>
      </tr>
    `),
    "Ch\u01b0a c\u00f3 nh\u1eadt k\u00fd thao t\u00e1c."
  );
}

async function loadStats() {
  // Tải số liệu dashboard từ GET /api/admin/stats.
  // Filter ngày/trend lấy từ UI, backend trả doanh thu, đơn hàng, top món, danh mục và phản hồi.
  if (!statsSummary) return;

  statsSummary.textContent = "Đang tải thống kê...";
  if (statsTopFoods) statsTopFoods.textContent = "Đang tải...";
  if (statsDaily) statsDaily.textContent = "Đang tải...";
  if (statsCategories) statsCategories.textContent = "Đang tải...";
  if (statsCustomers) statsCustomers.textContent = "Đang tải...";
  if (statsSatisfaction) statsSatisfaction.textContent = "Đang tải...";

  try {
    const params = new URLSearchParams();
    if (statsTrendMode?.value) params.set("trend", statsTrendMode.value);
    if (statsTrendMode?.value === "custom") {
      ensureStatsDateRange();
      if (statsFromDate?.value) params.set("from", statsFromDate.value);
      if (statsToDate?.value) params.set("to", statsToDate.value);
    }

    const data = await requestJson(`${ADMIN_API}/stats?${params.toString()}`);
    renderStats(data);
  } catch (error) {
    statsSummary.textContent = error.message;
    if (statsTopFoods) statsTopFoods.textContent = "";
    if (statsDaily) statsDaily.textContent = "";
    if (statsCategories) statsCategories.textContent = "";
    if (statsCustomers) statsCustomers.textContent = "";
    if (statsSatisfaction) statsSatisfaction.textContent = "";
    showAdminToast(error.message, "error");
  }
}

function syncStatsDateInputs() {
  const isCustomRange = statsTrendMode?.value === "custom";
  [statsFromDate, statsToDate].forEach(input => {
    if (!input) return;
    input.disabled = !isCustomRange;
    if (!isCustomRange) input.value = "";
  });
  if (isCustomRange) ensureStatsDateRange();
}

function ensureStatsDateRange() {
  const today = formatDateKey(new Date());
  if (statsToDate && !statsToDate.value) statsToDate.value = today;
  if (statsFromDate && !statsFromDate.value) statsFromDate.value = statsToDate?.value || today;
}

function renderStats(data) {
  const summary = data.summary || {};
  const trendMode = data.trend || statsTrendMode?.value || "day";
  const totalOrders = Number(summary.total_orders || 0);
  const doneOrders = Number(summary.done_orders || 0);
  const customerCount = Number(summary.customers || 0);
  const onlineUsers = Number(summary.online_users || 0);
  const totalUsers = Number(summary.total_users || 0);
  const successRate = totalOrders ? (doneOrders / totalOrders) * 100 : 0;
  const statIcons = {
    revenue: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z" /><path d="M4 9h16" /><path d="M8 14h5" /></svg>',
    orders: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10l2 3v13H5V7l2-3Z" /><path d="M9 12h6" /><path d="M9 16h4" /></svg>',
    customers: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 19a4 4 0 0 0-8 0" /><circle cx="12" cy="8" r="3.5" /><path d="M19 18a3 3 0 0 0-2.4-2.9" /></svg>',
    onlineUsers: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" /><path d="M8.8 12.2 11 14.4l4.6-5" /></svg>',
    success: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14.5 8 18l12-12" /><path d="M4 6h8" /></svg>'
  };
  const statCards = [
    {
      key: "revenue",
      className: "stats-card stats-card-revenue",
      label: "Tổng doanh thu",
      value: formatMoney(summary.revenue || 0),
      hint: `${Number(summary.done_orders || 0).toLocaleString("vi-VN")} đơn hoàn tất`,
      icon: statIcons.revenue
    },
    {
      key: "orders",
      className: "stats-card stats-card-orders",
      label: "Tổng đơn hàng",
      value: Number(summary.total_orders || 0).toLocaleString("vi-VN"),
      hint: `${Number(summary.pending_orders || 0).toLocaleString("vi-VN")} đơn chờ xử lý`,
      icon: statIcons.orders
    },
    {
      key: "customers",
      className: "stats-card stats-card-customers",
      label: "Khách hàng",
      value: customerCount.toLocaleString("vi-VN"),
      hint: `${customerCount.toLocaleString("vi-VN")} tài khoản khách hàng`,
      icon: statIcons.customers
    },
    {
      key: "onlineUsers",
      className: "stats-card stats-card-online",
      label: "Tài khoản online",
      value: onlineUsers.toLocaleString("vi-VN"),
      hint: `Hoạt động 5 phút qua / ${totalUsers.toLocaleString("vi-VN")} tài khoản`,
      icon: statIcons.onlineUsers
    },
    {
      key: "success",
      className: "stats-card stats-card-success",
      label: "Tỷ lệ thành công",
      value: `${successRate.toFixed(1)}%`,
      hint: `${Number(summary.cancelled_orders || 0).toLocaleString("vi-VN")} đơn đã hủy`,
      icon: statIcons.success
    }
  ];

  statsSummary.innerHTML = statCards.map(card => `
    <article class="${card.className}">
      <div class="stats-card-main">
        <span class="stats-card-label">${card.label}</span>
        <strong class="stats-card-value">${card.value}</strong>
        <small class="stats-card-hint">${card.hint}</small>
      </div>
      <em class="stats-card-icon" aria-hidden="true">${card.icon}</em>
    </article>
  `).join("");

  if (statsTrendLabel) {
    statsTrendLabel.textContent = trendMode === "custom"
      ? `${formatStatsDateLabel(statsFromDate?.value || statsToDate?.value)} đến ${formatStatsDateLabel(statsToDate?.value || formatDateKey(new Date()))}`
      : trendMode === "year"
      ? "6 n\u0103m g\u1ea7n nh\u1ea5t"
      : trendMode === "quarter"
        ? "8 qu\u00fd g\u1ea7n nh\u1ea5t"
      : trendMode === "month"
        ? "12 th\u00e1ng g\u1ea7n nh\u1ea5t"
        : "Theo tuần";
  }
  if (statsDaily) statsDaily.innerHTML = renderRevenueTrend(data.dailyRevenue || [], trendMode);
  if (statsTopFoods) statsTopFoods.innerHTML = renderTopFoodsList(data.topFoods || []);
  if (statsCategories) {
    statsCategories.innerHTML = renderCategorySummary(data.categorySales || []);
    bindCategoryDonutInteractions();
  }
  if (statsCustomers) {
    statsCustomers.innerHTML = renderCustomerStats(data.customerStats || []);
    bindCustomerStatsEvents();
  }
  if (statsSatisfaction) statsSatisfaction.innerHTML = renderSatisfaction(data.feedback || {});
}

function formatStatsDateLabel(value) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Chọn ngày";
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function getNiceChartCeiling(val) {
  if (!val || val <= 0) return 500000;
  if (val <= 100000) return 100000;
  if (val <= 250000) return 250000;
  if (val <= 500000) return 500000;
  if (val <= 1000000) return 1000000;
  if (val <= 2000000) return 2000000;
  if (val <= 5000000) return 5000000;
  if (val <= 10000000) return 10000000;
  if (val <= 20000000) return 20000000;
  if (val <= 50000000) return 50000000;
  const order = Math.pow(10, Math.floor(Math.log10(val)));
  const factor = val / order;
  if (factor <= 1.25) return Math.round(1.25 * order);
  if (factor <= 2) return Math.round(2 * order);
  if (factor <= 2.5) return Math.round(2.5 * order);
  if (factor <= 5) return Math.round(5 * order);
  return Math.round(10 * order);
}

function renderRevenueTrend(rows, trendMode = "day") {
  const limits = { day: 7, custom: 366, month: 12, quarter: 8, year: 6 };
  const ordered = normalizeRevenueTrendRows(rows, trendMode).slice(-(limits[trendMode] || 7));
  if (!ordered.length) return `<p class="empty-note">Chưa có dữ liệu doanh thu.</p>`;

  const maxRevenue = Math.max(...ordered.map(item => Number(item.revenue || 0)), 0);
  const totalRevenue = ordered.reduce((sum, item) => sum + Number(item.revenue || 0), 0);

  if (totalRevenue === 0) {
    return `
      <div class="chart-empty">
        <strong>Chưa có doanh thu hoàn tất</strong>
        <span>Biểu đồ sẽ cập nhật khi có đơn hoàn tất trong khoảng thời gian đã chọn.</span>
      </div>
    `;
  }

  const ceiling = getNiceChartCeiling(maxRevenue);
  const midPoint = Math.round(ceiling / 2);

  return `
    <div class="revenue-chart-wrap" role="img" aria-label="Biểu đồ cột xu hướng doanh thu">
      <div class="revenue-chart-body">
        <!-- Trục Y riêng biệt không đè chữ -->
        <div class="revenue-y-axis" aria-hidden="true">
          <span class="y-label y-top"><span>${formatMoney(ceiling)}</span></span>
          <span class="y-label y-mid"><span>${formatMoney(midPoint)}</span></span>
          <span class="y-label y-bot"><span>0đ</span></span>
        </div>

        <!-- Khung vẽ biểu đồ cột & đường lưới -->
        <div class="revenue-plot-area">
          <div class="revenue-grid-lines" aria-hidden="true">
            <span class="grid-line line-top"></span>
            <span class="grid-line line-mid"></span>
            <span class="grid-line line-bot"></span>
          </div>
          <div class="revenue-cols-container">
            ${ordered.map(item => {
              const revenue = Number(item.revenue || 0);
              const isZero = revenue === 0;
              const heightPercent = isZero ? 0 : Math.min(100, Math.max(3, (revenue / ceiling) * 100));
              const isPeak = revenue === maxRevenue && maxRevenue > 0;
              const dateLabel = formatTrendLabel(item, trendMode);
              return `
                <div class="revenue-col ${isZero ? "is-zero" : ""} ${isPeak ? "is-peak" : ""}">
                  <div class="revenue-col-plot">
                    <div class="revenue-bar-tooltip">
                      <strong>${formatMoney(revenue)}</strong>
                      <small>${escapeHtml(dateLabel)}</small>
                    </div>
                    <div class="revenue-bar-track">
                      <div class="revenue-bar-fill" style="height: ${heightPercent}%;"></div>
                    </div>
                  </div>
                  <div class="revenue-col-footer">
                    <strong class="col-amount ${isZero ? "text-muted" : ""}">${formatMoney(revenue)}</strong>
                    <span class="col-date">${escapeHtml(dateLabel)}</span>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      </div>
    </div>
  `;
}

function getRevenueTrendLabelIndexes(total) {
  if (total <= 7) return new Set(Array.from({ length: total }, (_, index) => index));

  const indexes = new Set();
  const lastIndex = total - 1;
  for (let step = 0; step < 7; step += 1) {
    indexes.add(Math.round((step / 6) * lastIndex));
  }
  return indexes;
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeRevenueTrendRows(rows, trendMode = "day") {
  const ordered = [...rows].reverse();
  if (!["day", "custom"].includes(trendMode)) return ordered;

  const revenueByDate = new Map(ordered.map(item => {
    const rawDate = item.order_date || item.order_label;
    const date = new Date(rawDate);
    const key = Number.isNaN(date.getTime()) ? String(rawDate).slice(0, 10) : formatDateKey(date);
    return [key, item];
  }));

  const today = new Date();
  let startDate;
  let endDate;

  if (trendMode === "custom") {
    endDate = statsToDate?.value ? new Date(`${statsToDate.value}T00:00:00`) : today;
    startDate = statsFromDate?.value ? new Date(`${statsFromDate.value}T00:00:00`) : new Date(endDate);
  } else {
    endDate = today;
    startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 6);
  }

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return ordered;
  if (startDate > endDate) [startDate, endDate] = [endDate, startDate];

  const filledRows = [];
  const cursor = new Date(startDate);
  while (cursor <= endDate && filledRows.length < 366) {
    const key = formatDateKey(cursor);
    filledRows.push(revenueByDate.get(key) || {
      order_label: key,
      order_date: key,
      orders_count: 0,
      revenue: 0
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return filledRows;
}

function formatTrendLabel(item, trendMode) {
  const rawLabel = item.order_label || item.order_date || "";
  if (trendMode === "year") return String(rawLabel).slice(0, 4);
  if (trendMode === "month") {
    const [year, month] = String(rawLabel).split("-");
    return month && year ? `${month}/${year}` : String(rawLabel);
  }
  if (trendMode === "quarter") {
    const [, year, quarter] = String(rawLabel).match(/^(\d{4})-Q([1-4])$/) || [];
    return year && quarter ? `Qu\u00fd ${quarter}/${year}` : String(rawLabel);
  }

  const date = new Date(item.order_date || rawLabel);
  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
  }
  return String(rawLabel);
}

function renderTopFoodsList(rows) {
  if (!rows.length) return `<p class="empty-note">Chưa có dữ liệu món bán.</p>`;

  const maxQty = Math.max(...rows.map(item => Number(item.quantity || 0)), 1);

  return `
    <div class="top-food-list">
      ${rows.map((item, index) => {
        const qty = Number(item.quantity || 0);
        const revenue = Number(item.revenue || 0);
        const percent = Math.round((qty / maxQty) * 100);
        const rank = index + 1;
        const rankClass = rank === 1 ? "rank-1" : rank === 2 ? "rank-2" : rank === 3 ? "rank-3" : "rank-other";
        const medalIcon = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank;

        return `
          <article class="top-food-item ${rankClass}" style="--item-index: ${index};">
            <span class="top-food-rank ${rank <= 3 ? "has-medal" : ""}" title="Hạng ${rank}">
              <span class="rank-num">${medalIcon}</span>
            </span>
            <div class="top-food-info">
              <div class="top-food-title-row">
                <strong class="top-food-name">${escapeHtml(item.food_name)}</strong>
                <b class="top-food-revenue">${formatMoney(revenue)}</b>
              </div>
              <div class="top-food-bar-track">
                <div class="top-food-bar-fill" style="width: ${percent}%;"></div>
              </div>
              <div class="top-food-sub-row">
                <small class="top-food-qty-text">${qty.toLocaleString("vi-VN")} lượt bán</small>
                <small class="top-food-ratio">${percent}% sức mua</small>
              </div>
            </div>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function renderCategorySummary(rows) {
  if (!rows.length) return `<p class="empty-note">Chưa có dữ liệu danh mục.</p>`;

  const total = rows.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 1;
  const topRows = rows.slice(0, 5);

  const GRADIENTS = [
    { id: "catGrad0", start: "#ff7a28", end: "#e63e00", solid: "#ff5722" },
    { id: "catGrad1", start: "#ffb703", end: "#fb8500", solid: "#ff8a1f" },
    { id: "catGrad2", start: "#38bdf8", end: "#0284c7", solid: "#0284c7" },
    { id: "catGrad3", start: "#34d399", end: "#059669", solid: "#10b981" },
    { id: "catGrad4", start: "#c084fc", end: "#7c3aed", solid: "#8b5cf6" }
  ];

  const R = 54;
  const C = 2 * Math.PI * R; // ~339.292
  let currentAnglePercent = 0;

  const defsHtml = GRADIENTS.map(g => `
    <linearGradient id="${g.id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${g.start}"/>
      <stop offset="100%" stop-color="${g.end}"/>
    </linearGradient>
  `).join("");

  const segmentsHtml = topRows.map((item, index) => {
    const qty = Number(item.quantity || 0);
    const percent = total > 0 ? (qty / total) : 0;
    const dashLength = Math.max(0.1, percent * C);
    const gapLength = C - dashLength;
    const offset = -(currentAnglePercent * C);
    currentAnglePercent += percent;
    const g = GRADIENTS[index % GRADIENTS.length];
    const catName = escapeHtml(item.category_name || "Chưa phân loại");

    return `
      <circle
        class="donut-segment"
        cx="75"
        cy="75"
        r="${R}"
        fill="transparent"
        stroke="url(#${g.id})"
        stroke-width="22"
        stroke-dasharray="${dashLength.toFixed(2)} ${gapLength.toFixed(2)}"
        stroke-dashoffset="${offset.toFixed(2)}"
        data-cat-idx="${index}"
        data-cat-name="${catName}"
        data-cat-qty="${qty}"
        data-cat-percent="${Math.round(percent * 100)}"
        style="--seg-color: ${g.solid};"
      />
    `;
  }).join("");

  return `
    <div class="category-donut-container">
      <div class="donut-svg-wrap">
        <svg viewBox="0 0 150 150" class="category-donut-svg" aria-label="Biểu đồ phân bố danh mục">
          <defs>${defsHtml}</defs>
          <circle cx="75" cy="75" r="${R}" fill="transparent" stroke="#f5e8e0" stroke-width="22"/>
          <g class="donut-segments-group">
            ${segmentsHtml}
          </g>
        </svg>
        <div class="donut-center-badge" id="donutCenterBadge">
          <strong id="donutCenterVal" class="donut-val-animate">${Number(total).toLocaleString("vi-VN")}</strong>
          <small id="donutCenterLabel">Tổng bán</small>
        </div>
      </div>

      <div class="category-list">
        ${topRows.map((item, index) => {
          const qty = Number(item.quantity || 0);
          const percent = Math.round((qty / total) * 100);
          const g = GRADIENTS[index % GRADIENTS.length];
          const catName = escapeHtml(item.category_name || "Chưa phân loại");
          return `
            <div class="category-list-item" data-cat-idx="${index}" data-cat-name="${catName}" data-cat-qty="${qty}" data-cat-percent="${percent}">
              <div class="category-item-header">
                <span class="category-chip" style="background: linear-gradient(135deg, ${g.start}, ${g.end});"></span>
                <span class="category-name">${catName}</span>
                <strong class="category-qty">${qty.toLocaleString("vi-VN")} <small>(${percent}%)</small></strong>
              </div>
              <div class="category-item-bar-track">
                <div class="category-item-bar-fill" style="width: ${percent}%; background: linear-gradient(90deg, ${g.start}, ${g.end});"></div>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

function bindCategoryDonutInteractions() {
  const container = document.querySelector(".category-donut-container");
  if (!container) return;

  const centerVal = container.querySelector("#donutCenterVal");
  const centerLabel = container.querySelector("#donutCenterLabel");
  const initialTotal = centerVal ? centerVal.textContent : "";
  const initialLabel = centerLabel ? centerLabel.textContent : "Tổng bán";

  const segments = container.querySelectorAll(".donut-segment");
  const items = container.querySelectorAll(".category-list-item");

  function setActiveCategory(idx, name, qty, percent) {
    if (centerVal) {
      centerVal.textContent = Number(qty).toLocaleString("vi-VN");
      centerVal.classList.remove("donut-val-animate");
      void centerVal.offsetWidth;
      centerVal.classList.add("donut-val-animate");
    }
    if (centerLabel) {
      centerLabel.textContent = `${name} (${percent}%)`;
    }

    segments.forEach(seg => {
      if (seg.dataset.catIdx === String(idx)) {
        seg.classList.add("is-hovered");
        seg.classList.remove("is-dimmed");
      } else {
        seg.classList.remove("is-hovered");
        seg.classList.add("is-dimmed");
      }
    });

    items.forEach(item => {
      if (item.dataset.catIdx === String(idx)) {
        item.classList.add("is-active");
      } else {
        item.classList.remove("is-active");
      }
    });
  }

  function resetActiveCategory() {
    if (centerVal) {
      centerVal.textContent = initialTotal;
      centerVal.classList.remove("donut-val-animate");
      void centerVal.offsetWidth;
      centerVal.classList.add("donut-val-animate");
    }
    if (centerLabel) {
      centerLabel.textContent = initialLabel;
    }

    segments.forEach(seg => {
      seg.classList.remove("is-hovered", "is-dimmed");
    });
    items.forEach(item => {
      item.classList.remove("is-active");
    });
  }

  segments.forEach(seg => {
    seg.addEventListener("mouseenter", () => {
      setActiveCategory(seg.dataset.catIdx, seg.dataset.catName, seg.dataset.catQty, seg.dataset.catPercent);
    });
    seg.addEventListener("mouseleave", resetActiveCategory);
  });

  items.forEach(item => {
    item.addEventListener("mouseenter", () => {
      setActiveCategory(item.dataset.catIdx, item.dataset.catName, item.dataset.catQty, item.dataset.catPercent);
    });
    item.addEventListener("mouseleave", resetActiveCategory);
  });
}

let cachedCustomerStatsData = [];
let customerStatsState = {
  search: "",
  filter: "all",
  sortBy: "revenue",
  sortDir: "desc",
  page: 1,
  pageSize: 5
};

function renderCustomerStats(rows) {
  cachedCustomerStatsData = rows || [];
  customerStatsState.page = 1;
  return renderCustomerStatsContainer();
}

function getFilteredCustomerStats() {
  const query = customerStatsState.search.trim().toLowerCase();
  const filter = customerStatsState.filter;

  return cachedCustomerStatsData.filter(item => {
    const totalOrders = Number(item.total_orders || 0);
    const revenue = Number(item.revenue || 0);

    if (filter === "has_orders" && totalOrders === 0) return false;
    if (filter === "no_orders" && totalOrders > 0) return false;
    if (filter === "vip" && revenue < 500000) return false;

    if (query) {
      const matchText = [
        item.customer_name,
        item.email,
        item.phone
      ].join(" ").toLowerCase();
      if (!matchText.includes(query)) return false;
    }

    return true;
  }).sort((a, b) => {
    let diff = 0;
    if (customerStatsState.sortBy === "revenue") {
      diff = Number(b.revenue || 0) - Number(a.revenue || 0);
    } else if (customerStatsState.sortBy === "orders") {
      diff = Number(b.total_orders || 0) - Number(a.total_orders || 0);
    } else if (customerStatsState.sortBy === "done_orders") {
      diff = Number(b.done_orders || 0) - Number(a.done_orders || 0);
    } else if (customerStatsState.sortBy === "date") {
      const dateA = a.last_order_at ? new Date(a.last_order_at).getTime() : 0;
      const dateB = b.last_order_at ? new Date(b.last_order_at).getTime() : 0;
      diff = dateB - dateA;
    } else if (customerStatsState.sortBy === "name") {
      diff = String(a.customer_name || "").localeCompare(String(b.customer_name || ""), "vi");
    }
    return customerStatsState.sortDir === "asc" ? -diff : diff;
  });
}

function renderCustomerStatsContainer() {
  if (!cachedCustomerStatsData.length) return `<p class="empty-note">Chưa có tài khoản khách hàng.</p>`;

  const filtered = getFilteredCustomerStats();
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / customerStatsState.pageSize));
  customerStatsState.page = Math.min(Math.max(1, customerStatsState.page), totalPages);

  const startIndex = (customerStatsState.page - 1) * customerStatsState.pageSize;
  const pageItems = filtered.slice(startIndex, startIndex + customerStatsState.pageSize);
  const from = total === 0 ? 0 : startIndex + 1;
  const to = startIndex + pageItems.length;

  return `
    <div class="customer-stats-container">
      <div class="table-toolbar multi-filter">
        <input
          type="search"
          id="custStatsSearchInput"
          placeholder="Tìm kiếm"
          value="${escapeHtml(customerStatsState.search)}"
          aria-label="Tìm kiếm khách hàng"
        />
        <select id="custStatsFilterSelect" aria-label="Bộ lọc khách hàng">
          <option value="all" ${customerStatsState.filter === "all" ? "selected" : ""}>Tất cả</option>
          <option value="has_orders" ${customerStatsState.filter === "has_orders" ? "selected" : ""}>Đã mua hàng</option>
          <option value="no_orders" ${customerStatsState.filter === "no_orders" ? "selected" : ""}>Chưa mua hàng</option>
        </select>
        <select id="custStatsPageSizeSelect" aria-label="Số dòng hiển thị">
          <option value="5" ${customerStatsState.pageSize === 5 ? "selected" : ""}>5</option>
          <option value="10" ${customerStatsState.pageSize === 10 ? "selected" : ""}>10</option>
          <option value="20" ${customerStatsState.pageSize === 20 ? "selected" : ""}>20</option>
        </select>
      </div>

      <div class="table-wrap">
        <table class="admin-table compact-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Khách hàng</th>
              <th>Tổng đơn</th>
              <th>Hoàn tất</th>
              <th>Tổng chi tiêu</th>
              <th>Đơn gần nhất</th>
            </tr>
          </thead>
          <tbody>
            ${!pageItems.length ? `
              <tr>
                <td colspan="6" class="empty-table-cell">Không tìm thấy khách hàng nào.</td>
              </tr>
            ` : pageItems.map((item, index) => `
              <tr>
                <td>${startIndex + index + 1}</td>
                <td>
                  <strong>${escapeHtml(item.customer_name || "Khách hàng")}</strong>
                  <small>${escapeHtml(item.email || item.phone || "")}</small>
                </td>
                <td>${Number(item.total_orders || 0).toLocaleString("vi-VN")}</td>
                <td>${Number(item.done_orders || 0).toLocaleString("vi-VN")}</td>
                <td>${formatMoney(item.revenue || 0)}</td>
                <td>${item.last_order_at ? formatDateTime(item.last_order_at) : "Chưa có"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <div class="table-footer">
        Đang hiển thị từ ${from} đến ${to} của ${total} kết quả
        <div class="pager">
          <button type="button" data-cust-page="${customerStatsState.page - 1}" ${customerStatsState.page <= 1 ? "disabled" : ""}>&lsaquo;</button>
          ${getCompactPaginationItems(totalPages, customerStatsState.page).map(page => renderAdminPaginationButton(page, customerStatsState.page, "cust")).join("")}
          <button type="button" data-cust-page="${customerStatsState.page + 1}" ${customerStatsState.page >= totalPages ? "disabled" : ""}>&rsaquo;</button>
        </div>
      </div>
    </div>
  `;
}

function bindCustomerStatsEvents() {
  const container = document.querySelector(".customer-stats-container");
  if (!container) return;

  const searchInput = container.querySelector("#custStatsSearchInput");
  const filterSelect = container.querySelector("#custStatsFilterSelect");
  const pageSizeSelect = container.querySelector("#custStatsPageSizeSelect");
  const sortHeaders = container.querySelectorAll(".sortable-th");
  const pageButtons = container.querySelectorAll("[data-cust-page]");

  function updateTable() {
    const statsCustomersBox = document.getElementById("statsCustomers");
    if (statsCustomersBox) {
      statsCustomersBox.innerHTML = renderCustomerStatsContainer();
      bindCustomerStatsEvents();
      const newSearchInput = statsCustomersBox.querySelector("#custStatsSearchInput");
      if (newSearchInput && document.activeElement?.id === "custStatsSearchInput") {
        newSearchInput.focus();
        newSearchInput.selectionStart = newSearchInput.selectionEnd = newSearchInput.value.length;
      }
    }
  }

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      customerStatsState.search = searchInput.value;
      customerStatsState.page = 1;
      updateTable();
    });
  }

  if (filterSelect) {
    filterSelect.addEventListener("change", () => {
      customerStatsState.filter = filterSelect.value;
      customerStatsState.page = 1;
      updateTable();
    });
  }

  if (pageSizeSelect) {
    pageSizeSelect.addEventListener("change", () => {
      customerStatsState.pageSize = Number(pageSizeSelect.value) || 5;
      customerStatsState.page = 1;
      updateTable();
    });
  }

  sortHeaders.forEach(th => {
    th.addEventListener("click", () => {
      const sortField = th.dataset.custSort;
      if (customerStatsState.sortBy === sortField) {
        customerStatsState.sortDir = customerStatsState.sortDir === "asc" ? "desc" : "asc";
      } else {
        customerStatsState.sortBy = sortField;
        customerStatsState.sortDir = "desc";
      }
      updateTable();
    });
  });

  pageButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const page = Number(btn.dataset.custPage);
      if (page && page !== customerStatsState.page) {
        customerStatsState.page = page;
        updateTable();
      }
    });
  });
}

function renderSatisfaction(feedback) {
  const average = Number(feedback.average_rating || 0);
  const total = Number(feedback.total_feedback || 0);

  if (!total) {
    return `
      <div class="satisfaction-empty">
        <span class="satisfaction-empty-icon">⭐</span>
        <strong>Chưa có phản hồi đánh giá</strong>
        <span>Đánh giá từ khách hàng sẽ xuất hiện tại đây khi có đơn hoàn tất.</span>
      </div>
    `;
  }

  const starsCount = Math.round(average);
  const sentiment = average >= 4.5 ? "Xuất sắc" : average >= 4.0 ? "Rất tốt" : average >= 3.0 ? "Hài lòng" : "Cần cải thiện";
  const sentimentClass = average >= 4.5 ? "sentiment-excellent" : average >= 4.0 ? "sentiment-good" : average >= 3.0 ? "sentiment-fair" : "sentiment-poor";

  // Phân bố đánh giá 5 sao
  const breakdown = feedback.rating_breakdown || {
    5: Math.round(total * (average >= 4.5 ? 0.75 : average >= 4.0 ? 0.55 : 0.3)),
    4: Math.round(total * (average >= 4.5 ? 0.20 : average >= 4.0 ? 0.35 : 0.4)),
    3: Math.round(total * (average >= 4.5 ? 0.04 : average >= 4.0 ? 0.08 : 0.2)),
    2: Math.round(total * (average >= 4.5 ? 0.01 : average >= 4.0 ? 0.02 : 0.07)),
    1: Math.round(total * (average >= 4.5 ? 0.00 : average >= 4.0 ? 0.00 : 0.03))
  };

  return `
    <div class="satisfaction-display">
      <div class="satisfaction-header-card">
        <div class="satisfaction-score-wrap">
          <strong class="satisfaction-num">${average.toFixed(1)}</strong>
          <span class="satisfaction-max">/ 5.0</span>
        </div>
        <div class="satisfaction-stars-row" aria-label="${average.toFixed(1)} sao">
          ${[1, 2, 3, 4, 5].map(star => `
            <span class="star-icon ${star <= starsCount ? "filled" : "empty"}">★</span>
          `).join("")}
        </div>
        <div class="satisfaction-badge-row">
          <span class="satisfaction-pill ${sentimentClass}">
            <span class="sentiment-dot"></span>
            ${sentiment}
          </span>
          <small class="satisfaction-count">${total.toLocaleString("vi-VN")} lượt đánh giá</small>
        </div>
      </div>

      <div class="satisfaction-breakdown">
        ${[5, 4, 3, 2, 1].map(star => {
          const count = breakdown[star] || 0;
          const pct = total > 0 ? Math.min(100, Math.round((count / total) * 100)) : 0;
          return `
            <div class="breakdown-row">
              <span class="breakdown-label">${star} <small>★</small></span>
              <div class="breakdown-bar-track">
                <div class="breakdown-bar-fill star-${star}" style="width: ${pct}%;"></div>
              </div>
              <span class="breakdown-pct">${pct}%</span>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}
function getFilteredOrders() {
  const search = String(orderSearch?.value || "").trim().toLowerCase();
  const status = orderStatusFilter?.value || "all";

  return cachedOrders.filter(order => {
    const matchesStatus = status === "all" || order.status === status;
    const searchText = [
      order.id,
      order.customer_name,
      order.phone,
      order.address,
      order.note,
      ...(Array.isArray(order.items) ? order.items.map(item => item.food_name) : [])
    ].join(" ").toLowerCase();
    return matchesStatus && (!search || searchText.includes(search));
  });
}

function getOrderPaymentLabel(order) {
  const paymentLabels = {
    cod: "Thanh toán khi nhận hàng",
    qr: "Thanh toán bằng mã QR",
    vnpay: "Thanh toán qua VNPay"
  };
  const paymentStatusLabels = {
    unpaid: "Chưa thanh toán",
    pending: "Chờ thanh toán",
    paid: "Đã thanh toán",
    cancelled: "Đã hủy"
  };

  const method = paymentLabels[order.payment_method] || order.payment_method || "Chưa có";
  const status = paymentStatusLabels[order.payment_status] || order.payment_status || "Chưa có";
  return `${method} - ${status}`;
}

function buildOrderPrintHtml(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  const subtotal = items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);

  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>Hóa đơn đơn hàng #${order.id}</title>
  <style>
    * { box-sizing: border-box; }
    body { color: #171717; font-family: Arial, sans-serif; margin: 0; padding: 28px; }
    .invoice { margin: 0 auto; max-width: 760px; }
    .header { align-items: flex-start; border-bottom: 2px solid #ff4f24; display: flex; justify-content: space-between; padding-bottom: 16px; }
    h1 { color: #ff4f24; font-size: 28px; margin: 0 0 6px; }
    h2 { font-size: 22px; margin: 22px 0 8px; }
    p { line-height: 1.5; margin: 4px 0; }
    .muted { color: #666; }
    .grid { display: grid; gap: 16px; grid-template-columns: 1fr 1fr; margin-top: 18px; }
    .box { border: 1px solid #ead6cc; border-radius: 8px; padding: 14px; }
    table { border-collapse: collapse; margin-top: 18px; width: 100%; }
    th, td { border-bottom: 1px solid #ead6cc; padding: 10px 8px; text-align: left; }
    th { background: #fff4ee; color: #5f4a3f; }
    td:last-child, th:last-child { text-align: right; }
    .totals { margin-left: auto; margin-top: 18px; max-width: 360px; }
    .line { display: flex; justify-content: space-between; padding: 7px 0; }
    .grand { border-top: 2px solid #ff4f24; color: #ff4f24; font-size: 20px; font-weight: 700; margin-top: 6px; padding-top: 10px; }
    .actions { margin: 22px auto 0; max-width: 760px; text-align: right; }
    button { background: #ff4f24; border: 0; border-radius: 8px; color: white; cursor: pointer; font-size: 15px; font-weight: 700; padding: 12px 18px; }
    @media print {
      body { padding: 0; }
      .actions { display: none; }
      .invoice { max-width: none; padding: 16px; }
    }
  </style>
</head>
<body>
  <main class="invoice">
    <section class="header">
      <div>
        <h1>FoodHub</h1>
        <p class="muted">Hóa đơn bán hàng</p>
      </div>
      <div>
        <h2>Đơn #${order.id}</h2>
        <p>${formatDateTime(order.created_at)}</p>
        <p>${escapeHtml(statusLabels[order.status] || order.status || "")}</p>
      </div>
    </section>

    <section class="grid">
      <div class="box">
        <strong>Người nhận</strong>
        <p>${escapeHtml(order.customer_name || "")}</p>
        <p>${escapeHtml(order.phone || "")}</p>
      </div>
      <div class="box">
        <strong>Giao hàng</strong>
        <p>${escapeHtml(order.address || "")}</p>
        ${order.note ? `<p>Ghi chú: ${escapeHtml(order.note)}</p>` : ""}
      </div>
    </section>

    <section class="box" style="margin-top: 16px;">
      <strong>Thanh toán</strong>
      <p>${escapeHtml(getOrderPaymentLabel(order))}</p>
      <p>${escapeHtml(order.shipping_method_name || "Giao hàng")}</p>
    </section>

    <table>
      <thead>
        <tr>
          <th>Món ăn</th>
          <th>SL</th>
          <th>Đơn giá</th>
          <th>Thành tiền</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => `
          <tr>
            <td>${escapeHtml(item.food_name || "")}</td>
            <td>${Number(item.quantity || 0)}</td>
            <td>${formatMoney(item.price)}</td>
            <td>${formatMoney(item.subtotal)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <section class="totals">
      <div class="line"><span>Tạm tính</span><strong>${formatMoney(subtotal)}</strong></div>
      <div class="line"><span>Phí giao hàng</span><strong>${Number(order.shipping_fee || 0) > 0 ? formatMoney(order.shipping_fee) : "Miễn phí"}</strong></div>
      ${Number(order.discount_amount || 0) > 0 ? `<div class="line"><span>Giảm giá ${escapeHtml(order.discount_code || "")}</span><strong>-${formatMoney(order.discount_amount)}</strong></div>` : ""}
      <div class="line grand"><span>Tổng thanh toán</span><strong>${formatMoney(order.total_price)}</strong></div>
    </section>
  </main>
  <div class="actions">
    <button type="button" onclick="window.print()">In hóa đơn</button>
  </div>
</body>
</html>`;
}

function printOrderInvoice(orderId) {
  const order = cachedOrders.find(item => String(item.id) === String(orderId));
  if (!order) {
    showAdminToast("Không tìm thấy dữ liệu đơn hàng để in.", "error");
    return;
  }

  const printWindow = window.open("", "_blank", "width=900,height=720");
  if (!printWindow) {
    showAdminToast("Trình duyệt đang chặn cửa sổ in. Vui lòng cho phép popup.", "error");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(buildOrderPrintHtml(order));
  printWindow.document.close();
  printWindow.focus();
  printWindow.addEventListener("load", () => printWindow.print(), { once: true });
}

function renderOrdersList() {
  if (!ordersList) return;

  const filteredOrders = getFilteredOrders();
  ordersPerPage = Number(orderPageSize?.value || ordersPerPage || 5);
  const total = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(total / ordersPerPage));
  ordersPage = Math.min(Math.max(ordersPage, 1), totalPages);
  const startIndex = (ordersPage - 1) * ordersPerPage;
  const pageOrders = filteredOrders.slice(startIndex, startIndex + ordersPerPage);
  const from = total === 0 ? 0 : startIndex + 1;
  const to = startIndex + pageOrders.length;

  if (total === 0) {
    ordersList.innerHTML = `<p class="empty-note">Kh\u00f4ng c\u00f3 \u0111\u01a1n h\u00e0ng ph\u00f9 h\u1ee3p.</p>`;
    return;
  }

  ordersList.innerHTML = `
    <div class="orders-compact-list">
      ${pageOrders.map(order => {
        const items = Array.isArray(order.items) ? order.items : [];
        const itemSummary = items.length
          ? items.map(item => `${escapeHtml(item.food_name)} x ${Number(item.quantity || 0)}`).join(", ")
          : "Ch\u01b0a c\u00f3 m\u00f3n";

        return `
        <article class="order-card compact-order-card">
          <div class="order-top">
            <div>
              <h3>\u0110\u01a1n #${order.id}</h3>
              <p class="order-meta">
                <strong>${escapeHtml(order.customer_name)}</strong> - ${escapeHtml(order.phone || "")}
                <span>${new Date(order.created_at).toLocaleString("vi-VN")}</span>
              </p>
            </div>
            <strong class="order-total">${formatMoney(order.total_price)}</strong>

            <select class="status-select" data-order-id="${order.id}">
              ${Object.entries(statusLabels).map(([value, label]) => `
                <option value="${value}" ${order.status === value ? "selected" : ""}>${label}</option>
              `).join("")}
            </select>
          </div>

          <div class="order-brief">
            <span>${itemSummary}</span>
            <div class="order-actions">
              <button type="button" class="ghost-btn compact-detail-btn" data-order-detail-toggle>Chi ti\u1ebft</button>
              <button type="button" class="ghost-btn compact-detail-btn print-order-btn" data-order-print="${order.id}">In</button>
            </div>
          </div>
          <div class="order-detail" hidden>
            <p class="order-address">
              ${escapeHtml(order.address || "")}
              ${order.note ? `<br>Ghi ch\u00fa: ${escapeHtml(order.note)}` : ""}
            </p>
            <div class="order-items">
              ${items.map(item => `
                <div class="order-line">
                  <span>${escapeHtml(item.food_name)} x ${Number(item.quantity || 0)}</span>
                  <strong>${formatMoney(item.subtotal)}</strong>
                </div>
              `).join("")}
              <div class="order-line">
                <span>Ph\u00ed giao h\u00e0ng${order.shipping_method_name ? ` - ${escapeHtml(order.shipping_method_name)}` : ""}</span>
                <strong>${Number(order.shipping_fee || 0) > 0 ? formatMoney(order.shipping_fee) : "Mi\u1ec5n ph\u00ed"}</strong>
              </div>
              ${Number(order.discount_amount || 0) > 0 ? `
                <div class="order-line">
                  <span>M\u00e3 gi\u1ea3m gi\u00e1 ${escapeHtml(order.discount_code || "")}</span>
                  <strong>-${formatMoney(order.discount_amount)}</strong>
                </div>
              ` : ""}
            </div>
          </div>
        </article>
      `;
      }).join("")}
    </div>
    <div class="table-footer">
      \u0110ang hi\u1ec3n th\u1ecb t\u1eeb ${from} \u0111\u1ebfn ${to} c\u1ee7a ${total} \u0111\u01a1n h\u00e0ng
      <div class="pager">
        <button type="button" data-orders-page="prev" ${ordersPage === 1 ? "disabled" : ""}>&lsaquo;</button>
        ${getCompactPaginationItems(totalPages, ordersPage).map(page => renderAdminPaginationButton(page, ordersPage, "orders")).join("")}
        <button type="button" data-orders-page="next" ${ordersPage === totalPages ? "disabled" : ""}>&rsaquo;</button>
      </div>
    </div>
  `;
}

async function loadOrders() {
  ordersList.textContent = "?ang t?i ??n h?ng...";

  try {
    const orders = await requestJson(`${ADMIN_API}/orders`);
    cachedOrders = Array.isArray(orders) ? orders : [];
    if (ordersCount) ordersCount.textContent = cachedOrders.length;

    if (cachedOrders.length === 0) {
      ordersList.textContent = "Ch?a c? ??n h?ng.";
      return;
    }

    ordersPage = Math.min(ordersPage, Math.ceil(cachedOrders.length / ordersPerPage)) || 1;
    renderOrdersList();
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
  container.innerHTML = roots.map(category => `
    <a href="admin.html?section=foods&foodCategory=${escapeHtml(category.slug)}" data-admin-target="foods" data-food-category="${escapeHtml(category.slug)}">
      <span class="nav-icon" data-icon="dot" aria-hidden="true"></span><span class="nav-text">${escapeHtml(category.name)}</span>
    </a>
  `).join("");

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
                  <button type="button" class="icon-btn" title="${Number(category.isActive) ? "Ẩn danh mục" : "Hiện danh mục"}" aria-label="${Number(category.isActive) ? "Ẩn danh mục" : "Hiện danh mục"}" data-toggle-category="${category.id}" data-active="${Number(category.isActive) ? "0" : "1"}">${visibilityIcon(Number(category.isActive))}</button>
                  <button type="button" class="icon-btn delete" title="Xóa vĩnh viễn" aria-label="Xóa vĩnh viễn danh mục" data-delete-category="${category.id}">${trashIcon()}</button>
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
        ${getCompactPaginationItems(totalPages, categoriesPage).map(page => renderAdminPaginationButton(page, categoriesPage, "categories")).join("")}
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
    renderAdvertisementFoodLinkOptions();
    renderFoodsTable();
  } catch (error) {
    foodsList.textContent = error.message;
    showAdminToast(error.message, "error");
  }
}

function renderStockImportResult(data) {
  if (!stockImportResult) return;

  stockImportResult.hidden = false;
  const details = Array.isArray(data.details) ? data.details.slice(0, 8) : [];
  stockImportResult.innerHTML = `
    <div class="stock-import-summary">
      <strong>${escapeHtml(data.message || "Đã nhập số lượng món")}</strong>
      <span>${Number(data.successRows || 0)} dòng thành công</span>
      <span>${Number(data.failedRows || 0)} dòng lỗi</span>
    </div>
    ${details.length ? `
      <div class="table-wrap stock-import-preview">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Tên trong file</th>
              <th>Món khớp</th>
              <th>Nhập</th>
              <th>Tồn cũ</th>
              <th>Tồn mới</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            ${details.map(item => `
              <tr>
                <td>${escapeHtml(item.inputName || "")}</td>
                <td>${escapeHtml(item.foodName || "-")}</td>
                <td>${Number(item.quantityAdded || 0).toLocaleString("vi-VN")}</td>
                <td>${item.oldStock === null || item.oldStock === undefined ? "-" : Number(item.oldStock).toLocaleString("vi-VN")}</td>
                <td>${item.newStock === null || item.newStock === undefined ? "-" : Number(item.newStock).toLocaleString("vi-VN")}</td>
                <td><span class="account-status ${item.status === "success" ? "active" : "locked"}">${item.status === "success" ? "Thành công" : escapeHtml(item.errorMessage || "Lỗi")}</span></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    ` : ""}
  `;
}

async function loadStockImportHistory() {
  if (!stockImportHistory) return;

  stockImportHistory.textContent = "Đang tải lịch sử nhập...";

  try {
    const imports = await requestJson(`${ADMIN_API}/foods/stock-imports?limit=5`);
    if (!imports.length) {
      stockImportHistory.textContent = "Chưa có lịch sử nhập số lượng.";
      return;
    }

    stockImportHistory.innerHTML = `
      <div class="stock-import-history-title">
        <h3>Lịch sử nhập gần nhất</h3>
      </div>
      <div class="table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Ngày nhập</th>
              <th>File</th>
              <th>Người nhập</th>
              <th>Kết quả</th>
              <th>Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            ${imports.map(item => `
              <tr>
                <td><strong>${formatDateTime(item.import_date || item.created_at)}</strong><small>${formatDateTime(item.created_at)}</small></td>
                <td>${escapeHtml(item.file_name || "-")}</td>
                <td>${escapeHtml(item.importer_name || item.importer_email || "-")}</td>
                <td>${Number(item.success_rows || 0)} thành công / ${Number(item.failed_rows || 0)} lỗi</td>
                <td>
                  ${(item.details || []).slice(0, 4).map(detail => `
                    <small>${escapeHtml(detail.input_name || detail.food_name || "")}: ${detail.status === "success" ? `+${Number(detail.quantity_added || 0)} (${Number(detail.old_stock || 0)} -> ${Number(detail.new_stock || 0)})` : escapeHtml(detail.error_message || "Lỗi")}</small>
                  `).join("")}
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  } catch (error) {
    stockImportHistory.textContent = error.message;
  }
}

async function downloadStockImportTemplate() {
  try {
    const response = await fetch(`${ADMIN_API}/foods/stock-import-template`, {
      headers: authHeaders()
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || "Không thể tải file mẫu.");
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mau-nhap-so-luong-mon.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
    showAdminToast(error.message, "error");
  }
}

async function submitStockImport(event) {
  event.preventDefault();

  const file = stockImportFile?.files?.[0];
  if (!file) {
    showAdminToast("Vui lòng chọn file CSV.", "error");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);
  if (stockImportDate?.value) formData.append("importDate", stockImportDate.value);

  try {
    showAdminToast("Đang nhập số lượng món...");
    const data = await requestFormData(`${ADMIN_API}/foods/stock-imports`, formData);
    renderStockImportResult(data);
    stockImportForm.reset();
    if (stockImportDate) stockImportDate.value = new Date().toISOString().slice(0, 10);
    await loadFoods();
    await loadStockImportHistory();
  } catch (error) {
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
  const status = foodStatusFilter?.value || "all";
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
    const matchesStatus = status === "all"
      || (status === "active" && Number(food.is_active))
      || (status === "hidden" && !Number(food.is_active));

    return matchesCategory && matchesSearch && matchesStatus;
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
            <th>Trạng thái</th>
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
                <small>${escapeHtml(getFoodCategoryLabel(food))}</small>
              </td>
              <td>${formatMoney(food.price)}</td>
              <td>${Number(food.stock_quantity ?? food.stockQuantity ?? 0).toLocaleString("vi-VN")}</td>
              <td><span class="account-status ${Number(food.is_active) ? "active" : "locked"}">${Number(food.is_active) ? "Đang bán" : "Đã ẩn"}</span></td>
              <td>
                <div class="table-actions">
                  <a class="icon-btn edit" href="admin-food.html?id=${food.id}&foodCategory=${encodeURIComponent(getFoodRootSlug(food))}" title="Sửa" aria-label="Sửa món">${editIcon()}</a>
                  <button type="button" class="icon-btn" title="${Number(food.is_active) ? "Ẩn món" : "Hiện món"}" aria-label="${Number(food.is_active) ? "Ẩn món" : "Hiện món"}" data-toggle-food="${food.id}" data-active="${Number(food.is_active) ? "0" : "1"}">${visibilityIcon(Number(food.is_active))}</button>
                  <button type="button" class="icon-btn delete" title="Xóa vĩnh viễn" aria-label="Xóa vĩnh viễn món" data-delete-food="${food.id}">${trashIcon()}</button>
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
        ${getCompactPaginationItems(totalPages, foodsPage).map(page => renderAdminPaginationButton(page, foodsPage, "foods")).join("")}
        <button type="button" data-foods-page="next" ${foodsPage === totalPages ? "disabled" : ""}>&rsaquo;</button>
      </div>
    </div>
  `;
}

async function toggleFoodVisibility(foodId, isActive) {
  const active = Number(isActive) ? 1 : 0;
  if (!confirm(active ? "Hiện món này trên thực đơn?" : "Ẩn món này khỏi thực đơn?")) {
    return;
  }

  try {
    await requestJson(`${ADMIN_API}/foods/${foodId}/visibility`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: active })
    });
    await loadFoods();
    showAdminToast(active ? "Đã hiện món trên thực đơn." : "Đã ẩn món khỏi thực đơn.");
  } catch (error) {
    showAdminToast(error.message, "error");
  }
}

async function deleteFood(foodId) {
  if (!confirm("Xóa vĩnh viễn món này? Thao tác này không thể hoàn tác.")) {
    return;
  }

  try {
    await requestJson(`${ADMIN_API}/foods/${foodId}`, {
      method: "DELETE"
    });
    await loadFoods();
    showAdminToast("Đã xóa món.");
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

async function deleteAccount(userId) {
  await requestJson(`${ADMIN_API}/users/${userId}`, {
    method: "DELETE"
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
downloadStockTemplateBtn?.addEventListener("click", downloadStockImportTemplate);
stockImportForm?.addEventListener("submit", submitStockImport);
document.getElementById("refreshUsersBtn")?.addEventListener("click", loadUsers);
document.getElementById("refreshAnnouncementsBtn")?.addEventListener("click", loadAnnouncements);
document.getElementById("refreshFlashSalesBtn")?.addEventListener("click", loadFlashSales);
document.getElementById("refreshDiscountsBtn")?.addEventListener("click", loadDiscounts);
document.getElementById("refreshAdvertisementsBtn")?.addEventListener("click", loadAdvertisements);
document.getElementById("refreshStatsBtn")?.addEventListener("click", loadStats);
document.getElementById("applyStatsFilterBtn")?.addEventListener("click", loadStats);
document.getElementById("refreshAuditLogsBtn")?.addEventListener("click", loadAuditLogs);
statsTrendMode?.addEventListener("change", () => {
  syncStatsDateInputs();
  loadStats();
});
auditLogModuleFilter?.addEventListener("change", loadAuditLogs);
auditLogActionFilter?.addEventListener("change", loadAuditLogs);
auditLogLimit?.addEventListener("change", loadAuditLogs);
auditLogSearch?.addEventListener("input", () => {
  clearTimeout(auditLogSearchTimer);
  auditLogSearchTimer = setTimeout(loadAuditLogs, 300);
});
orderStatusFilter?.addEventListener("change", () => {
  ordersPage = 1;
  renderOrdersList();
});
orderPageSize?.addEventListener("change", () => {
  ordersPerPage = Number(orderPageSize.value || 5);
  ordersPage = 1;
  renderOrdersList();
});
orderSearch?.addEventListener("input", () => {
  clearTimeout(orderSearchTimer);
  ordersPage = 1;
  orderSearchTimer = setTimeout(renderOrdersList, 250);
});
document.getElementById("resetCategoryFormBtn")?.addEventListener("click", resetCategoryForm);
document.querySelector("[data-back-category-list]")?.addEventListener("click", () => {
  resetCategoryForm();
  showCategoryListView();
});
document.getElementById("resetDiscountFormBtn")?.addEventListener("click", () => {
  resetDiscountForm();
  openDiscountForm();
});
document.getElementById("resetFlashSaleFormBtn")?.addEventListener("click", async () => {
  resetFlashSaleForm();
  await loadFlashSaleFoodOptions();
  openFlashSaleForm();
});
document.getElementById("flashSaleScheduleType")?.addEventListener("change", syncFlashSaleScheduleFields);
document.querySelector("[data-back-flash-sale-list]")?.addEventListener("click", () => {
  resetFlashSaleForm();
  closeFlashSaleForm();
});
document.querySelector("[data-back-discount-list]")?.addEventListener("click", () => {
  resetDiscountForm();
  closeDiscountForm();
});
document.getElementById("resetShippingMethodFormBtn")?.addEventListener("click", () => {
  resetShippingMethodForm();
  openShippingMethodForm();
});
document.querySelector("[data-back-shipping-list]")?.addEventListener("click", () => {
  resetShippingMethodForm();
  closeShippingMethodForm();
});
document.getElementById("refreshShippingMethodsBtn")?.addEventListener("click", loadShippingMethodsAdmin);
document.getElementById("resetAdvertisementFormBtn")?.addEventListener("click", () => {
  resetAdvertisementForm();
  showAdvertisementFormView();
});
categoryForm?.addEventListener("submit", saveCategory);
categoryForm?.querySelector("[data-reset-category]")?.addEventListener("click", resetCategoryForm);
flashSaleForm?.addEventListener("submit", saveFlashSale);
flashSaleForm?.querySelector("[data-reset-flash-sale]")?.addEventListener("click", () => {
  resetFlashSaleForm();
  closeFlashSaleForm();
});
flashSaleItemForm?.addEventListener("submit", saveFlashSaleItem);
flashSaleItemForm?.querySelector("[data-reset-flash-sale-item]")?.addEventListener("click", resetFlashSaleItemForm);
flashSaleItemsList?.addEventListener("click", async event => {
  const deleteButton = event.target.closest("[data-delete-flash-sale-item]");
  if (!deleteButton) return;

  const saleId = deleteButton.dataset.flashSaleId || document.getElementById("flashSaleId").value;
  if (!saleId || !confirm("Xóa món này khỏi flash sale?")) return;

  try {
    await requestJson(`${ADMIN_API}/flash-sales/${saleId}/items/${deleteButton.dataset.deleteFlashSaleItem}`, {
      method: "DELETE"
    });
    const detail = await requestJson(`${ADMIN_API}/flash-sales/${saleId}`);
    renderFlashSaleItems(detail.items || [], saleId);
    await loadFlashSales();
    showAdminToast("Đã xóa món khỏi flash sale.");
  } catch (error) {
    showAdminToast(error.message, "error");
  }
});
closeFlashSaleForm();
discountForm?.addEventListener("submit", saveDiscount);
discountForm?.querySelector("[data-reset-discount]")?.addEventListener("click", () => {
  resetDiscountForm();
  closeDiscountForm();
});
closeDiscountForm();
shippingMethodForm?.addEventListener("submit", saveShippingMethod);
shippingMethodForm?.querySelector("[data-reset-shipping-method]")?.addEventListener("click", () => {
  resetShippingMethodForm();
  closeShippingMethodForm();
});
closeShippingMethodForm();
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
  const toggleButton = event.target.closest("[data-toggle-category]");
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

    if (toggleButton) {
      const isActive = toggleButton.dataset.active === "1";
      if (!confirm(isActive ? "Hiện danh mục này?" : "Ẩn danh mục này? Nếu là danh mục cha, các mục con cũng sẽ bị ẩn.")) return;

      await requestJson(`${ADMIN_API}/categories/${toggleButton.dataset.toggleCategory}/visibility`, {
        method: "PATCH",
        body: JSON.stringify({ isActive })
      });
      showAdminToast(isActive ? "Đã hiện danh mục." : "Đã ẩn danh mục.");
      await loadCategories();
      await loadFoods();
      return;
    }

    if (deleteButton) {
      if (!confirm("Xóa vĩnh viễn danh mục này? Thao tác này không thể hoàn tác.")) return;

      await requestJson(`${ADMIN_API}/categories/${deleteButton.dataset.deleteCategory}`, {
        method: "DELETE"
      });
      showAdminToast("Đã xóa danh mục.");
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
foodCategoryFilter?.addEventListener("change", () => {
  activeFoodSubcategory = foodCategoryFilter.value || "all";
  sessionStorage.setItem("foodhub_food_subcategory", activeFoodSubcategory);
  foodsPage = 1;
  renderFoodsTable();
  showAdminSection("foods");
});
foodStatusFilter?.addEventListener("change", () => {
  foodsPage = 1;
  renderFoodsTable();
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
userStatusFilter?.addEventListener("change", () => {
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
flashSaleStatusFilter?.addEventListener("change", () => {
  flashSalesPage = 1;
  renderFlashSalesTable();
});
flashSalePageSize?.addEventListener("change", () => {
  flashSalesPerPage = Number(flashSalePageSize.value || 5);
  flashSalesPage = 1;
  renderFlashSalesTable();
});
flashSaleSearch?.addEventListener("input", () => {
  clearTimeout(flashSaleSearchTimer);
  flashSalesPage = 1;
  flashSaleSearchTimer = setTimeout(renderFlashSalesTable, 250);
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
shippingStatusFilter?.addEventListener("change", () => {
  shippingPage = 1;
  renderShippingMethodsTable();
});
shippingPageSize?.addEventListener("change", () => {
  shippingPerPage = Number(shippingPageSize.value || 5);
  shippingPage = 1;
  renderShippingMethodsTable();
});
shippingSearch?.addEventListener("input", () => {
  clearTimeout(shippingSearchTimer);
  shippingPage = 1;
  shippingSearchTimer = setTimeout(renderShippingMethodsTable, 250);
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
advertisementFoodLinkSelect?.addEventListener("change", syncAdvertisementFoodLink);
advertisementImageFile?.addEventListener("change", () => {
  try {
    previewAdvertisementImageFile();
  } catch (error) {
    showAdminToast(error.message, "error");
    advertisementImageFile.value = "";
    renderAdvertisementPreview(pendingAdvertisementImage);
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
    const order = cachedOrders.find(item => String(item.id) === String(event.target.dataset.orderId));
    if (order) order.status = event.target.value;
    showAdminToast("Đã cập nhật trạng thái đơn hàng.");
    renderOrdersList();
  } catch (error) {
    showAdminToast(error.message, "error");
    await loadOrders();
  }
});

ordersList.addEventListener("click", event => {
  const pageButton = event.target.closest("[data-orders-page]");
  if (pageButton) {
    const pageAction = pageButton.dataset.ordersPage;
    const totalPages = Math.max(1, Math.ceil(getFilteredOrders().length / ordersPerPage));

    if (pageAction === "prev") {
      ordersPage -= 1;
    } else if (pageAction === "next") {
      ordersPage += 1;
    } else {
      ordersPage = Number(pageAction);
    }

    ordersPage = Math.min(Math.max(ordersPage, 1), totalPages);
    renderOrdersList();
    return;
  }

  const button = event.target.closest("[data-order-detail-toggle]");
  if (!button) {
    const printButton = event.target.closest("[data-order-print]");
    if (printButton) printOrderInvoice(printButton.dataset.orderPrint);
    return;
  }

  const detail = button.closest(".order-card")?.querySelector(".order-detail");
  if (!detail) return;

  detail.hidden = !detail.hidden;
  button.textContent = detail.hidden ? "Chi tiết" : "Thu gọn";
});

foodsList?.addEventListener("click", event => {
  const pageButton = event.target.closest("[data-foods-page]");
  const toggleButton = event.target.closest("[data-toggle-food]");
  const deleteButton = event.target.closest("[data-delete-food]");

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

  if (toggleButton) {
    toggleFoodVisibility(toggleButton.dataset.toggleFood, toggleButton.dataset.active);
    return;
  }

  if (deleteButton) {
    deleteFood(deleteButton.dataset.deleteFood);
  }
});

usersList?.addEventListener("click", async event => {
  const pageButton = event.target.closest("[data-users-page]");
  const toggleButton = event.target.closest("[data-toggle-user]");
  const deleteButton = event.target.closest("[data-delete-user]");
  const resetButton = event.target.closest("[data-reset-password]");
  const permissionButton = event.target.closest("[data-permission-user]");

  try {
    if (pageButton) {
      const pageAction = pageButton.dataset.usersPage;
      const totalPages = Math.max(1, Math.ceil(getFilteredUsers().length / usersPerPage));

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

    if (deleteButton) {
      const account = cachedUsers.find(item => String(item.id) === String(deleteButton.dataset.deleteUser));
      const label = account?.email || account?.fullname || "tài khoản này";
      const confirmed = confirm(`Xóa vĩnh viễn ${label}? Đơn hàng cũ vẫn được giữ trong hệ thống.`);
      if (!confirmed) return;

      await deleteAccount(deleteButton.dataset.deleteUser);
      showAdminToast("Đã xóa tài khoản.");
      await loadUsers();
      return;
    }

    if (resetButton) {
      await resetAccountPassword(resetButton.dataset.resetPassword);
      showAdminToast("Đã đặt lại mật khẩu.");
    }
    if (permissionButton) {
      if (adminPermissions.length === 0 && hasAdminPermission("roles.manage")) {
        await loadAdminPermissions();
      }
      const account = cachedUsers.find(item => String(item.id) === String(permissionButton.dataset.permissionUser));
      showPermissionDialog(account);
    }

  } catch (error) {
    showAdminToast(error.message, "error");
  }
});

document.addEventListener("click", event => {
  if (event.target.closest("[data-close-permission-dialog]")) closePermissionDialog();
});

document.addEventListener("change", event => {
  const select = event.target.closest("[data-permission-group]");
  if (!select) return;

  const form = select.closest("[data-permission-form]");
  const group = STAFF_PERMISSION_GROUPS.find(item => item.value === select.value);
  const selectedPermissions = new Set(group?.permissions || []);

  form?.querySelectorAll(".account-permissions input[type='checkbox']").forEach(input => {
    input.checked = selectedPermissions.has(input.value);
  });
});

document.addEventListener("submit", async event => {
  const form = event.target.closest("[data-permission-form]");
  if (!form) return;

  event.preventDefault();
  const button = form.querySelector("button[type='submit']");
  const permissions = getCheckedPermissions(form.querySelector(".account-permissions"));
  if (button) button.disabled = true;

  try {
    await requestJson(`${ADMIN_API}/users/${form.dataset.permissionForm}/permissions`, {
      method: "PATCH",
      body: JSON.stringify({ permissions })
    });
    showAdminToast("Đã cập nhật phân quyền nhân viên.");
    closePermissionDialog();
    await loadUsers();
  } catch (error) {
    showAdminToast(error.message, "error");
    if (button) button.disabled = false;
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

flashSalesList?.addEventListener("click", async event => {
  const pageButton = event.target.closest("[data-flash-sales-page]");
  const editButton = event.target.closest("[data-edit-flash-sale]");
  const deleteButton = event.target.closest("[data-delete-flash-sale]");

  try {
    if (pageButton) {
      const pageAction = pageButton.dataset.flashSalesPage;
      const totalPages = Math.max(1, Math.ceil(getFilteredFlashSales().length / flashSalesPerPage));

      if (pageAction === "prev") {
        flashSalesPage -= 1;
      } else if (pageAction === "next") {
        flashSalesPage += 1;
      } else {
        flashSalesPage = Number(pageAction);
      }

      flashSalesPage = Math.min(Math.max(flashSalesPage, 1), totalPages);
      renderFlashSalesTable();
      return;
    }

    if (editButton) {
      const sale = await requestJson(`${ADMIN_API}/flash-sales/${editButton.dataset.editFlashSale}`);
      await fillFlashSaleForm(sale);
      return;
    }

    if (deleteButton) {
      if (!confirm("Xóa vĩnh viễn flash sale này?")) return;

      await requestJson(`${ADMIN_API}/flash-sales/${deleteButton.dataset.deleteFlashSale}`, {
        method: "DELETE"
      });
      showAdminToast("Đã xóa flash sale.");
      await loadFlashSales();
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

shippingMethodsList?.addEventListener("click", async event => {
  const pageButton = event.target.closest("[data-shipping-page]");
  const editButton = event.target.closest("[data-edit-shipping-method]");
  const deleteButton = event.target.closest("[data-delete-shipping-method]");

  try {
    if (pageButton) {
      const pageAction = pageButton.dataset.shippingPage;
      const totalPages = Math.max(1, Math.ceil(getFilteredShippingMethods().length / shippingPerPage));

      if (pageAction === "prev") {
        shippingPage -= 1;
      } else if (pageAction === "next") {
        shippingPage += 1;
      } else {
        shippingPage = Number(pageAction);
      }

      shippingPage = Math.min(Math.max(shippingPage, 1), totalPages);
      renderShippingMethodsTable();
      return;
    }

    if (editButton) {
      const method = cachedShippingMethods.find(item => String(item.id) === String(editButton.dataset.editShippingMethod));
      if (method) fillShippingMethodForm(method);
      return;
    }

    if (deleteButton) {
      if (!confirm("Xóa vĩnh viễn phí vận chuyển này?")) return;

      await requestJson(`${ADMIN_API}/shipping-methods/${deleteButton.dataset.deleteShippingMethod}`, {
        method: "DELETE"
      });
      showAdminToast("Đã xóa phí vận chuyển.");
      resetShippingMethodForm();
      await loadShippingMethodsAdmin();
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
  const deleteButton = event.target.closest("[data-delete-food-review]");

  if (deleteButton) {
    const confirmed = confirm("Xóa vĩnh viễn bình luận này?");
    if (!confirmed) return;

    deleteButton.disabled = true;

    try {
      await requestJson(`${ADMIN_API}/food-reviews/${deleteButton.dataset.deleteFoodReview}`, {
        method: "DELETE"
      });
      showAdminToast("Đã xóa bình luận.");
      await loadFoodReviews();
    } catch (error) {
      showAdminToast(error.message, "error");
      deleteButton.disabled = false;
    }
    return;
  }

  if (!visibilityButton) return;

  visibilityButton.disabled = true;

  try {
    await requestJson(`${ADMIN_API}/food-reviews/${visibilityButton.dataset.foodReviewVisibility}/visibility`, {
      method: "PATCH",
      body: JSON.stringify({ isVisible: visibilityButton.dataset.visible === "1" })
    });
    showAdminToast(visibilityButton.dataset.visible === "1" ? "Đã phê duyệt bình luận." : "Đã ẩn bình luận.");
    await loadFoodReviews();
  } catch (error) {
    showAdminToast(error.message, "error");
    visibilityButton.disabled = false;
  }
});

foodReviewsList?.addEventListener("submit", async event => {
  const form = event.target.closest("[data-food-review-reply-form]");
  if (!form) return;

  event.preventDefault();
  const button = form.querySelector("button[type='submit']");
  const reply = form.elements.reply.value.trim();

  if (reply.length < 2) {
    showAdminToast("Phản hồi phải có ít nhất 2 ký tự.", "error");
    return;
  }

  button.disabled = true;
  const originalText = button.textContent;
  button.textContent = "Đang lưu...";

  try {
    await requestJson(`${ADMIN_API}/food-reviews/${form.dataset.foodReviewReplyForm}/reply`, {
      method: "POST",
      body: JSON.stringify({ reply })
    });
    showAdminToast("Đã lưu phản hồi bình luận.");
    await loadFoodReviews();
  } catch (error) {
    showAdminToast(error.message, "error");
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
});

async function initAdminPage() {
  requireAdminSession();
  await loadCurrentAdmin();
  applyAdminPermissionUi();

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

  showAdminSection(pageParams.get("section") || sessionStorage.getItem("foodhub_admin_section") || getFirstAllowedSection());
  syncAccountView();
  showAdvertisementListView();
  await loadAdminPermissions();

  if (canAccessSection("orders")) loadOrders();
  if (hasAdminPermission("foods.manage")) {
    if (stockImportDate && !stockImportDate.value) {
      stockImportDate.value = new Date().toISOString().slice(0, 10);
    }
    loadCategories();
    loadFoods();
    loadStockImportHistory();
  }
  if (canAccessSection("accounts")) loadUsers();
  if (hasAdminPermission("announcements.manage")) loadAnnouncements();
  if (canAccessSection("flash-sales")) loadFlashSales();
  if (canAccessSection("discounts")) loadDiscounts();
  if (canAccessSection("shipping")) loadShippingMethodsAdmin();
  if (hasAdminPermission("ads.manage")) loadAdvertisements();
  if (canAccessSection("feedback")) loadFeedback();
  if (canAccessSection("food-reviews")) loadFoodReviews();
  if (canAccessSection("audit-logs")) loadAuditLogs();
  syncStatsDateInputs();
  if (hasAdminPermission("stats.view") || hasAdminPermission("orders.manage")) loadStats();
}

window.showAdminToast = showAdminToast;
window.loadOrders = loadOrders;
window.loadStats = loadStats;

initAdminPage().catch(error => {
  showAdminToast(error.message, "error");
});
