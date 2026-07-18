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
const userTypeFilter = document.getElementById("userTypeFilter");
const userSearch = document.getElementById("userSearch");
const announcementSearch = document.getElementById("announcementSearch");
const announcementStatusFilter = document.getElementById("announcementStatusFilter");
const announcementsCount = document.getElementById("announcementsCount");
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

function renderFoodsTable() {
  if (!foodsList) return;

  activeFoodCategory = foodCategoryFilter?.value || activeFoodCategory || "all";
  foodsPerPage = Number(foodPageSize?.value || foodsPerPage || 5);
  sessionStorage.setItem("foodhub_food_category", activeFoodCategory);
  sessionStorage.setItem("foodhub_food_page_size", String(foodsPerPage));

  if (foodCategoryTitle) {
    foodCategoryTitle.textContent = FOOD_CATEGORY_TITLES[activeFoodCategory] || FOOD_CATEGORY_TITLES.all;
  }

  const search = String(foodSearch?.value || "").trim().toLowerCase();
  const filteredFoods = cachedFoods.filter(food => {
    const matchesCategory = activeFoodCategory === "all" || getFoodType(food) === activeFoodCategory;
    const matchesSearch = !search
      || String(food.name || "").toLowerCase().includes(search)
      || String(getFoodCategoryLabel(food)).toLowerCase().includes(search)
      || String(food.price || "").includes(search);

    return matchesCategory && matchesSearch;
  });
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
                  <a class="icon-btn edit" href="admin-food.html?id=${food.id}" title="Sua" aria-label="Sua mon">${editIcon()}</a>
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
navButtons.forEach(button => {
  button.addEventListener("click", () => {
    if (button.dataset.foodCategory && foodCategoryFilter) {
      activeFoodCategory = button.dataset.foodCategory;
      foodCategoryFilter.value = activeFoodCategory;
      sessionStorage.setItem("foodhub_food_category", activeFoodCategory);
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
      foodCategoryFilter.value = activeFoodCategory;
      foodsPage = 1;
      renderFoodsTable();
    }

    showAdminSection(button.dataset.adminShortcut);
  });
});
staffForm?.addEventListener("submit", createStaff);
foodCategoryFilter?.addEventListener("change", () => {
  activeFoodCategory = foodCategoryFilter.value;
  sessionStorage.setItem("foodhub_food_category", activeFoodCategory);
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
    const search = String(foodSearch?.value || "").trim().toLowerCase();
    const totalFilteredFoods = cachedFoods.filter(food => {
      const matchesCategory = activeFoodCategory === "all" || getFoodType(food) === activeFoodCategory;
      const matchesSearch = !search
        || String(food.name || "").toLowerCase().includes(search)
        || String(getFoodCategoryLabel(food)).toLowerCase().includes(search)
        || String(food.price || "").includes(search);

      return matchesCategory && matchesSearch;
    }).length;
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

requireAdminSession();
const initialFoodCategory = pageParams.get("foodCategory") || sessionStorage.getItem("foodhub_food_category") || "all";
const initialFoodPageSize = Number(sessionStorage.getItem("foodhub_food_page_size") || "5");

if (["all", "food", "drink"].includes(initialFoodCategory) && foodCategoryFilter) {
  activeFoodCategory = initialFoodCategory;
  foodCategoryFilter.value = activeFoodCategory;
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
