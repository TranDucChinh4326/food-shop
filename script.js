const API_URL = "https://2206-171-252-153-58.ngrok-free.app/api/foods";

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

async function loadFoods() {
  const foodList = document.getElementById("food-list");
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
  const searchValue = document.getElementById("searchInput").value.toLowerCase();
  const categoryValue = document.getElementById("categoryFilter").value;

  const filteredFoods = foods.filter(food => {
    const matchSearch = food.name.toLowerCase().includes(searchValue);
    const matchCategory = categoryValue === "all" || food.category === categoryValue;
    return matchSearch && matchCategory;
  });

  foodList.innerHTML = "";

  if (filteredFoods.length === 0) {
    foodList.innerHTML = "<p>Không tìm thấy món ăn phù hợp.</p>";
    return;
  }

  filteredFoods.forEach(food => {
    foodList.innerHTML += `
      <div class="food-card">
        <img src="${food.image}" alt="${food.name}">
        <h3>${food.name}</h3>
        <p>${food.desc}</p>
        <span>${formatMoney(food.price)}</span>
        <button onclick="addToCart(${food.id})">Thêm vào giỏ</button>
      </div>
    `;
  });
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
  alert("Đã thêm " + food.name + " vào giỏ hàng!");
}

function renderCart() {
  const cartItems = document.getElementById("cart-items");
  const totalPrice = document.getElementById("total-price");
  const cartCount = document.getElementById("cart-count");

  cartItems.innerHTML = "";

  if (cart.length === 0) {
    cartItems.innerHTML = `<p class="empty-cart">Giỏ hàng đang trống.</p>`;
    totalPrice.textContent = "0đ";
    cartCount.textContent = "0";
    return;
  }

  let total = 0;
  let count = 0;

  cart.forEach(item => {
    const itemTotal = Number(item.price) * Number(item.quantity);
    total += itemTotal;
    count += Number(item.quantity);

    cartItems.innerHTML += `
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
  });

  totalPrice.textContent = formatMoney(total);
  cartCount.textContent = count;
}

function changeQuantity(foodId, amount) {
  const item = cart.find(item => item.id === foodId);

  if (!item) return;

  item.quantity += amount;

  if (item.quantity <= 0) {
    cart = cart.filter(item => item.id !== foodId);
  }

  saveCart();
  renderCart();
}

function removeItem(foodId) {
  cart = cart.filter(item => item.id !== foodId);
  saveCart();
  renderCart();
}

function submitOrder(event) {
  event.preventDefault();

  if (cart.length === 0) {
    alert("Giỏ hàng đang trống. Vui lòng chọn món trước.");
    return;
  }

  const name = document.getElementById("customerName").value;
  const phone = document.getElementById("customerPhone").value;
  const address = document.getElementById("customerAddress").value;

  alert(
    "Đặt hàng thành công!\n\n" +
    "Khách hàng: " + name + "\n" +
    "Số điện thoại: " + phone + "\n" +
    "Địa chỉ: " + address + "\n\n" +
    "Cảm ơn bạn đã đặt hàng tại FoodHub."
  );

  cart = [];
  saveCart();
  renderCart();
  document.getElementById("orderForm").reset();
}

loadFoods();
renderCart();
function renderUser() {
  const userArea = document.getElementById("user-area");

  if (!userArea) return;

  const user = JSON.parse(localStorage.getItem("foodhub_user"));

  if (user) {
    userArea.innerHTML = `
      <span class="user-name">👤 ${user.fullname}</span>
      <button onclick="logout()" class="logout-btn">Đăng xuất</button>
    `;
  } else {
    userArea.innerHTML = `<a href="login.html">Đăng nhập</a>`;
  }
}

function logout() {
  localStorage.removeItem("foodhub_token");
  localStorage.removeItem("foodhub_user");
  alert("Đã đăng xuất");
  window.location.href = "index.html";
}

renderUser();