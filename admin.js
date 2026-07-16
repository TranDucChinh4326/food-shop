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
const foodForm = document.getElementById("foodForm");
const ordersCount = document.getElementById("ordersCount");
const foodsCount = document.getElementById("foodsCount");
const usersList = document.getElementById("usersList");
const staffForm = document.getElementById("staffForm");
const staffPermissions = document.getElementById("staffPermissions");
const userTypeFilter = document.getElementById("userTypeFilter");
const userSearch = document.getElementById("userSearch");
const navButtons = [...document.querySelectorAll("[data-admin-target]")];
const adminSections = [...document.querySelectorAll("[data-admin-section]")];
const shortcutButtons = [...document.querySelectorAll("[data-admin-shortcut]")];
const statusLabels = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  delivering: "Đang giao",
  done: "Hoàn tất",
  cancelled: "Đã hủy"
};

let toastTimer;
let adminPermissions = [];
let userSearchTimer;
let cachedUsers = [];
let usersPage = 1;
const USERS_PER_PAGE = 5;

function showAdminSection(sectionId) {
  const target = adminSections.some(section => section.dataset.adminSection === sectionId) ? sectionId : "overview";

  navButtons.forEach(button => {
    button.classList.toggle("active", button.dataset.adminTarget === target);
  });

  adminSections.forEach(section => {
    section.classList.toggle("active", section.dataset.adminSection === target);
  });

  sessionStorage.setItem("foodhub_admin_section", target);
}

function formatMoney(number) {
  return Number(number).toLocaleString("vi-VN") + "đ";
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

async function loadOrders() {
  ordersList.textContent = "Đang tải đơn hàng...";

  try {
    const orders = await requestJson(`${ADMIN_API}/orders`);
    ordersCount.textContent = orders.length;

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
  foodsList.textContent = "Đang tải món ăn...";

  try {
    const foods = await requestJson(`${ADMIN_API}/foods`);
    foodsCount.textContent = foods.length;

    if (foods.length === 0) {
      foodsList.textContent = "Chưa có món ăn.";
      return;
    }

    foodsList.innerHTML = foods.map(food => `
      <div class="food-row">
        <img src="${food.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"}" alt="${food.name}">
        <div>
          <h3>${food.name}</h3>
          <p>${food.category_name || "Chưa phân loại"} - ${formatMoney(food.price)}</p>
          <p class="muted">${food.is_active ? "Đang bán" : "Đã ẩn"}</p>
        </div>
        <div class="food-actions">
          <button type="button" data-edit-food="${food.id}">Sửa</button>
          <button type="button" data-hide-food="${food.id}">Ẩn</button>
        </div>
      </div>
    `).join("");

    window.foodhubAdminFoods = foods;
  } catch (error) {
    foodsList.textContent = error.message;
    showAdminToast(error.message, "error");
  }
}

function resetFoodForm() {
  foodForm.reset();
  document.getElementById("foodId").value = "";
  document.getElementById("foodActive").checked = true;
}

function fillFoodForm(food) {
  document.getElementById("foodId").value = food.id;
  document.getElementById("foodName").value = food.name;
  document.getElementById("foodCategory").value = food.category_id;
  document.getElementById("foodPrice").value = food.price;
  document.getElementById("foodImage").value = food.image || "";
  document.getElementById("foodDescription").value = food.description || "";
  document.getElementById("foodActive").checked = Boolean(food.is_active);
  showAdminSection("foods");
  foodForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function saveFood(event) {
  event.preventDefault();

  const foodId = document.getElementById("foodId").value;
  const payload = {
    name: document.getElementById("foodName").value,
    categoryId: document.getElementById("foodCategory").value,
    price: document.getElementById("foodPrice").value,
    image: document.getElementById("foodImage").value,
    description: document.getElementById("foodDescription").value,
    isActive: document.getElementById("foodActive").checked ? 1 : 0
  };

  try {
    await requestJson(foodId ? `${ADMIN_API}/foods/${foodId}` : `${ADMIN_API}/foods`, {
      method: foodId ? "PUT" : "POST",
      body: JSON.stringify(payload)
    });

    resetFoodForm();
    await loadFoods();
    showAdminToast("Đã lưu món ăn.");
  } catch (error) {
    showAdminToast(error.message, "error");
  }
}

async function hideFood(foodId) {
  if (!confirm("Ẩn món này khỏi thực đơn?")) {
    return;
  }

  try {
    await requestJson(`${ADMIN_API}/foods/${foodId}`, {
      method: "DELETE"
    });
    await loadFoods();
    showAdminToast("Đã ẩn món khỏi thực đơn.");
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
document.getElementById("refreshFoodsBtn").addEventListener("click", loadFoods);
document.getElementById("resetFoodFormBtn").addEventListener("click", resetFoodForm);
document.getElementById("refreshUsersBtn")?.addEventListener("click", loadUsers);
navButtons.forEach(button => {
  button.addEventListener("click", () => showAdminSection(button.dataset.adminTarget));
});
shortcutButtons.forEach(button => {
  button.addEventListener("click", () => showAdminSection(button.dataset.adminShortcut));
});
foodForm.addEventListener("submit", saveFood);
staffForm?.addEventListener("submit", createStaff);
userTypeFilter?.addEventListener("change", () => {
  usersPage = 1;
  loadUsers();
});
userSearch?.addEventListener("input", () => {
  clearTimeout(userSearchTimer);
  usersPage = 1;
  userSearchTimer = setTimeout(loadUsers, 300);
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

foodsList.addEventListener("click", event => {
  const editId = event.target.dataset.editFood;
  const hideId = event.target.dataset.hideFood;

  if (editId) {
    const food = window.foodhubAdminFoods.find(item => String(item.id) === String(editId));
    if (food) fillFoodForm(food);
  }

  if (hideId) {
    hideFood(hideId);
  }
});

usersList?.addEventListener("click", async event => {
  const pageAction = event.target.dataset.usersPage;
  const toggleId = event.target.dataset.toggleUser;
  const resetId = event.target.dataset.resetPassword;

  try {
    if (pageAction) {
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

    if (toggleId) {
      await toggleAccount(toggleId, event.target.dataset.active === "1");
      showAdminToast("Da cap nhat trang thai tai khoan.");
      await loadUsers();
    }

    if (resetId) {
      await resetAccountPassword(resetId);
      showAdminToast("Da dat lai mat khau.");
    }
  } catch (error) {
    showAdminToast(error.message, "error");
  }
});

requireAdminSession();
showAdminSection(sessionStorage.getItem("foodhub_admin_section") || "overview");
loadAdminPermissions().then(loadUsers);
loadOrders();
loadFoods();
