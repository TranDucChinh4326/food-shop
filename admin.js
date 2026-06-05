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
const statusLabels = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  delivering: "Đang giao",
  done: "Hoàn tất",
  cancelled: "Đã hủy"
};

let toastTimer;

function formatMoney(number) {
  return Number(number).toLocaleString("vi-VN") + "đ";
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
  if (!token || String(user?.role || "").toUpperCase() !== "ADMIN") {
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
  window.scrollTo({ top: 0, behavior: "smooth" });
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

document.getElementById("logoutBtn").addEventListener("click", () => {
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_USER_KEY);
  sessionStorage.removeItem("foodhub_cart");
  window.location.href = "login.html";
});

document.getElementById("refreshOrdersBtn").addEventListener("click", loadOrders);
document.getElementById("refreshFoodsBtn").addEventListener("click", loadFoods);
document.getElementById("resetFoodFormBtn").addEventListener("click", resetFoodForm);
foodForm.addEventListener("submit", saveFood);

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

requireAdminSession();
loadOrders();
loadFoods();
