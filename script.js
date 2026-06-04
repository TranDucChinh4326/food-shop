const foods = [
  {
    id: 1,
    name: "Burger bò phô mai",
    category: "burger",
    price: 59000,
    desc: "Burger bò mềm, phô mai béo ngậy, rau tươi và sốt đặc biệt.",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd"
  },
  {
    id: 2,
    name: "Pizza hải sản",
    category: "pizza",
    price: 129000,
    desc: "Pizza giòn thơm, topping hải sản tươi ngon, phô mai kéo sợi.",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591"
  },
  {
    id: 3,
    name: "Mì cay đặc biệt",
    category: "noodle",
    price: 49000,
    desc: "Mì cay nóng hổi, nước dùng đậm vị, topping đầy đủ.",
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624"
  },
  {
    id: 4,
    name: "Gà rán giòn cay",
    category: "burger",
    price: 69000,
    desc: "Gà rán vàng giòn, vị cay nhẹ, ăn kèm tương ớt.",
    image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58"
  },
  {
    id: 5,
    name: "Trà đào cam sả",
    category: "drink",
    price: 29000,
    desc: "Trà đào thanh mát, hương cam sả thơm nhẹ.",
    image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc"
  },
  {
    id: 6,
    name: "Phở bò tái",
    category: "noodle",
    price: 55000,
    desc: "Phở bò nóng hổi, nước dùng ngọt thanh, thịt bò mềm.",
    image: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43"
  }
];

let cart = JSON.parse(localStorage.getItem("foodhub_cart")) || [];

function formatMoney(number) {
  return number.toLocaleString("vi-VN") + "đ";
}

function saveCart() {
  localStorage.setItem("foodhub_cart", JSON.stringify(cart));
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
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    count += item.quantity;

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

renderFoods();
renderCart();