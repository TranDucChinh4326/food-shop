const API_BASE_URL = window.FOODHUB_CONFIG?.API_BASE_URL || "http://localhost:3000/api";
const API_URL = `${API_BASE_URL}/foods`;
const ORDERS_API = `${API_BASE_URL}/orders`;

let foods = [];
let cart = JSON.parse(localStorage.getItem("foodhub_cart")) || [];

function formatMoney(number) {
  return Number(number).toLocaleString("vi-VN") + "đ";
}

function saveCart() {
  localStorage.setItem("foodhub_cart", JSON.stringify(cart));
}

function getCategoryKey(categoryId) {
  switch (Number(categoryId)) {
    case 1:
      return "burger";
    case 2:
      return "pizza";
    case 3:
      return "noodle";
    case 4:
      return "drink";
    default:
      return "other";
  }
}

function updateCartCount() {
  const cartCount = document.getElementById("cart-count");

  if (!cartCount) return;

  cartCount.textContent = cart.reduce((sum, item) => sum + Number(item.quantity), 0);
}

async function loadFoods() {
  const foodList = document.getElementById("food-list");

  if (!foodList) return;

  foodList.innerHTML = "<p>Đang tải món ăn...</p>";

  try {
    const response = await fetch(API_URL);
    foods = await response.json();
    foods = foods.map(food => ({
      id: food.id,
      name: food.name,
      category: getCategoryKey(food.category_id),
      price: food.price,
      desc: food.description,
      image: food.image
    }));

    renderFoods();
  } catch (error) {
    console.error("Lỗi tải món ăn:", error);
    foodList.innerHTML = "<p>Không thể tải món ăn từ database.</p>";
  }
}

function renderFoods() {
  const foodList = document.getElementById("food-list");
  const searchInput = document.getElementById("searchInput");
  const categoryFilter = document.getElementById("categoryFilter");

  if (!foodList || !searchInput || !categoryFilter) return;

  const searchValue = searchInput.value.toLowerCase();
  const categoryValue = categoryFilter.value;
  const filteredFoods = foods.filter(food => {
    const matchSearch = food.name.toLowerCase().includes(searchValue);
    const matchCategory = categoryValue === "all" || food.category === categoryValue;
    return matchSearch && matchCategory;
  });

  if (filteredFoods.length === 0) {
    foodList.innerHTML = "<p>Không tìm thấy món ăn phù hợp.</p>";
    return;
  }

  foodList.innerHTML = filteredFoods.map(food => `
    <div class="food-card">
      <img src="${food.image}" alt="${food.name}">
      <h3>${food.name}</h3>
      <p>${food.desc || ""}</p>
      <span>${formatMoney(food.price)}</span>
      <button onclick="addToCart(${food.id})">Thêm vào giỏ</button>
    </div>
  `).join("");
}

function addToCart(foodId) {
  const food = foods.find(item => item.id === foodId);

  if (!food) {
    alert("Không tìm thấy món ăn.");
    return;
  }

  const itemInCart = cart.find(item => item.id === foodId);

  if (itemInCart) {
    itemInCart.quantity++;
  } else {
    cart.push({
      id: food.id,
      name: food.name,
      price: food.price,
      quantity: 1
    });
  }

  saveCart();
  renderCart();
  updateCartCount();
  alert(`Đã thêm ${food.name} vào giỏ hàng!`);
}

function renderCart() {
  const cartItems = document.getElementById("cart-items");
  const totalPrice = document.getElementById("total-price");

  updateCartCount();

  if (!cartItems || !totalPrice) return;

  if (cart.length === 0) {
    cartItems.innerHTML = `<p class="empty-cart">Giỏ hàng đang trống.</p>`;
    totalPrice.textContent = "0đ";
    return;
  }

  let total = 0;

  cartItems.innerHTML = cart.map(item => {
    const itemTotal = Number(item.price) * Number(item.quantity);
    total += itemTotal;

    return `
      <div class="cart-item">
        <div>
          <h4>${item.name}</h4>
          <p>${formatMoney(item.price)}</p>
        </div>

        <div class="qty-box">
          <button class="qty-btn" onclick="changeQuantity(${item.id}, -1)">-</button>
          <strong>${item.quantity}</strong>
          <button class="qty-btn" onclick="changeQuantity(${item.id}, 1)">+</button>
        </div>

        <strong>${formatMoney(itemTotal)}</strong>
        <button class="remove-btn" onclick="removeItem(${item.id})">Xóa</button>
      </div>
    `;
  }).join("");

  totalPrice.textContent = formatMoney(total);
}

function changeQuantity(foodId, amount) {
  const item = cart.find(item => item.id === foodId);

  if (!item) return;

  item.quantity += amount;

  if (item.quantity <= 0) {
    cart = cart.filter(cartItem => cartItem.id !== foodId);
  }

  saveCart();
  renderCart();
}

function removeItem(foodId) {
  cart = cart.filter(item => item.id !== foodId);
  saveCart();
  renderCart();
}

async function submitOrder(event) {
  event.preventDefault();

  if (cart.length === 0) {
    alert("Giỏ hàng đang trống. Vui lòng chọn món trước.");
    return;
  }

  const name = document.getElementById("customerName").value;
  const phone = document.getElementById("customerPhone").value;
  const address = document.getElementById("customerAddress").value;
  const note = document.getElementById("customerNote").value;
  const submitButton = document.querySelector("#orderForm button[type='submit']");
  const token = localStorage.getItem("foodhub_token");

  submitButton.disabled = true;
  submitButton.textContent = "Đang gửi đơn...";

  try {
    const response = await fetch(ORDERS_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        customerName: name,
        customerPhone: phone,
        customerAddress: address,
        customerNote: note,
        items: cart.map(item => ({
          foodId: item.id,
          quantity: item.quantity
        }))
      })
    });
    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Không thể đặt hàng. Vui lòng thử lại.");
      return;
    }

    alert(
      "Đặt hàng thành công!\n\n" +
      `Mã đơn: #${data.order.id}\n` +
      `Khách hàng: ${name}\n` +
      `Số điện thoại: ${phone}\n` +
      `Địa chỉ: ${address}\n\n` +
      "Cảm ơn bạn đã đặt hàng tại FoodHub."
    );

    cart = [];
    saveCart();
    renderCart();
    document.getElementById("orderForm").reset();
    window.location.href = `track.html?order=${data.order.id}`;
  } catch (error) {
    alert("Không kết nối được server đặt hàng.");
    console.error(error);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Xác nhận đặt hàng";
  }
}

async function trackOrder(event) {
  if (event) event.preventDefault();

  const input = document.getElementById("trackOrderId");
  const resultBox = document.getElementById("track-result");

  if (!input || !resultBox || !input.value) return;

  resultBox.innerHTML = "<p>Đang tra cứu đơn hàng...</p>";

  try {
    const response = await fetch(`${ORDERS_API}/${input.value}`);
    const data = await response.json();

    if (!response.ok) {
      resultBox.innerHTML = `<p>${data.message || "Không tìm thấy đơn hàng."}</p>`;
      return;
    }

    resultBox.innerHTML = `
      <div class="track-card">
        <h3>Đơn #${data.id} - ${formatMoney(data.total_price)}</h3>
        <p><strong>Trạng thái:</strong> ${getOrderStatusLabel(data.status)}</p>
        <p><strong>Khách hàng:</strong> ${data.customer_name}</p>
        <p><strong>Số điện thoại:</strong> ${data.phone}</p>
        <p><strong>Địa chỉ:</strong> ${data.address}</p>
        ${data.note ? `<p><strong>Ghi chú:</strong> ${data.note}</p>` : ""}
        <div>
          ${data.items.map(item => `
            <div class="track-line">
              <span>${item.food_name} x ${item.quantity}</span>
              <strong>${formatMoney(item.subtotal)}</strong>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  } catch (error) {
    resultBox.innerHTML = "<p>Không kết nối được server.</p>";
    console.error(error);
  }
}

function getOrderStatusLabel(status) {
  const labels = {
    pending: "Chờ xác nhận",
    confirmed: "Đã xác nhận",
    delivering: "Đang giao",
    done: "Hoàn tất",
    cancelled: "Đã hủy"
  };

  return labels[status] || status;
}

function renderUser() {
  const userArea = document.getElementById("user-area");

  if (!userArea) return;

  const user = JSON.parse(localStorage.getItem("foodhub_user"));

  if (user) {
    const adminLink = String(user.role || "").toUpperCase() === "ADMIN"
      ? `<a href="admin.html" class="header-action secondary">Quản trị</a>`
      : "";

    userArea.innerHTML = `
      <span class="user-name">👤 ${user.fullname}</span>
      ${adminLink}
      <button onclick="logout()" class="logout-btn">Đăng xuất</button>
    `;
  } else {
    userArea.innerHTML = `
      <a href="login.html" class="header-action primary">Đăng nhập</a>
      <a href="register.html" class="header-action secondary">Đăng ký</a>
    `;
  }
}

function logout() {
  localStorage.removeItem("foodhub_token");
  localStorage.removeItem("foodhub_user");
  alert("Đã đăng xuất");
  window.location.href = "index.html";
}

function initTrackPage() {
  const input = document.getElementById("trackOrderId");
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("order");

  if (input && orderId) {
    input.value = orderId;
    trackOrder();
  }
}

loadFoods();
renderCart();
renderUser();
initTrackPage();
