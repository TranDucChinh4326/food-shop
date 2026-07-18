const API_BASE_URL = window.FOODHUB_CONFIG?.API_BASE_URL || "http://localhost:3000/api";
const API_URL = `${API_BASE_URL}/foods`;
const ORDERS_API = `${API_BASE_URL}/orders`;
const ANNOUNCEMENTS_API = `${API_BASE_URL}/announcements`;
const AUTH_TOKEN_KEY = "foodhub_token";
const AUTH_USER_KEY = "foodhub_user";
const CART_KEY = "foodhub_cart";

let foods = [];
let cart = JSON.parse(sessionStorage.getItem(CART_KEY) || "[]");
let toastTimer;
let announcementTimer;
let announcementArchive = [];
let announcementArchivePage = 1;

localStorage.removeItem(AUTH_TOKEN_KEY);
localStorage.removeItem(AUTH_USER_KEY);
localStorage.removeItem(CART_KEY);

function showSiteToast(message, type = "success") {
  let toast = document.getElementById("site-toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "site-toast";
    toast.className = "site-toast";
    document.body.appendChild(toast);
  }

  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.className = `site-toast ${type} show`;

  toastTimer = setTimeout(() => {
    toast.className = `site-toast ${type}`;
  }, 2400);
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatMoney(number) {
  return Number(number).toLocaleString("vi-VN") + "đ";
}

function formatDateTime(value) {
  if (!value) return "Chua dat";

  return new Date(value).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function saveCart() {
  sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function getAuthToken() {
  return sessionStorage.getItem(AUTH_TOKEN_KEY);
}

function getCurrentUser() {
  return JSON.parse(sessionStorage.getItem(AUTH_USER_KEY) || "null");
}

function isLoggedIn() {
  return Boolean(getAuthToken() && getCurrentUser());
}

function requireLogin(message = "Vui long dang nhap de tiep tuc.", target = window.location.href) {
  sessionStorage.setItem("foodhub_after_login", target);
  showSiteToast(message, "error");

  setTimeout(() => {
    window.location.href = `login.html?redirect=${encodeURIComponent(target)}`;
  }, 700);
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

async function loadPublicAnnouncements() {
  const box = document.getElementById("publicAnnouncements");

  if (!box) return;

  try {
    const response = await fetch(`${ANNOUNCEMENTS_API}?limit=20`);
    const announcements = await response.json();

    if (!response.ok || announcements.length === 0) {
      box.innerHTML = `<span class="announcement-empty">Hien chua co thong bao moi.</span>`;
      return;
    }

    const tickerItems = announcements.length > 1 ? [...announcements, announcements[0]] : announcements;

    box.innerHTML = `
      <div class="announcement-track">
        ${tickerItems.map(item => {
      const title = escapeHtml(item.title);
      return `
        <div class="announcement-item">
          <span class="announcement-title">${title}</span>
        </div>
      `;
    }).join("")}
      </div>
    `;

    startAnnouncementTicker(box, announcements.length);
  } catch (error) {
    box.innerHTML = `<span class="announcement-empty">Khong the tai thong bao.</span>`;
    console.error(error);
  }
}

function getAnnouncementStatusText(status) {
  const labels = {
    active: "Dang hoat dong",
    hidden: "Da an",
    expired: "Het han",
    scheduled: "Sap hien thi"
  };

  return labels[status] || status || "Khong ro";
}

function getDateInputValue(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 10);
}

function getFilteredAnnouncementArchive() {
  const search = document.getElementById("announcementArchiveSearch")?.value.trim().toLowerCase() || "";
  const status = document.getElementById("announcementArchiveStatus")?.value || "all";
  const date = document.getElementById("announcementArchiveDate")?.value || "";

  return announcementArchive.filter(item => {
    const haystack = `${item.title || ""} ${item.content || ""}`.toLowerCase();
    const matchesSearch = !search || haystack.includes(search);
    const matchesStatus = status === "all" || item.status === status;
    const matchesDate = !date || getDateInputValue(item.published_at) === date;

    return matchesSearch && matchesStatus && matchesDate;
  });
}

function renderAnnouncementArchive() {
  const list = document.getElementById("announcementArchiveList");
  const pager = document.getElementById("announcementArchivePager");
  const pageSize = Number(document.getElementById("announcementArchivePageSize")?.value || 5);

  if (!list) return;

  const filtered = getFilteredAnnouncementArchive();
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  announcementArchivePage = Math.min(Math.max(announcementArchivePage, 1), totalPages);

  const start = (announcementArchivePage - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);
  const from = total === 0 ? 0 : start + 1;
  const to = start + pageItems.length;

  if (total === 0) {
    list.innerHTML = `<p>Khong co thong bao phu hop.</p>`;
    if (pager) pager.innerHTML = "";
    return;
  }

  list.innerHTML = pageItems.map(item => `
    <article class="archive-announcement ${escapeHtml(item.status)}">
      <div>
        <span class="archive-status ${escapeHtml(item.status)}">${escapeHtml(getAnnouncementStatusText(item.status))}</span>
        <h2>${escapeHtml(item.title)}</h2>
        ${item.content ? `<p>${escapeHtml(item.content)}</p>` : ""}
      </div>
      <dl>
        <div>
          <dt>Ngay dang</dt>
          <dd>${formatDateTime(item.published_at)}</dd>
        </div>
        <div>
          <dt>Het hieu luc</dt>
          <dd>${item.expires_at ? formatDateTime(item.expires_at) : "Khong gioi han"}</dd>
        </div>
      </dl>
    </article>
  `).join("");

  if (!pager) return;

  pager.innerHTML = `
    <span>Dang hien thi tu ${from} den ${to} cua ${total} thong bao</span>
    <div class="archive-pager-buttons">
      <button type="button" data-archive-page="prev" ${announcementArchivePage === 1 ? "disabled" : ""}>&lsaquo;</button>
      ${Array.from({ length: totalPages }, (_, index) => `
        <button type="button" class="${announcementArchivePage === index + 1 ? "active" : ""}" data-archive-page="${index + 1}">${index + 1}</button>
      `).join("")}
      <button type="button" data-archive-page="next" ${announcementArchivePage === totalPages ? "disabled" : ""}>&rsaquo;</button>
    </div>
  `;
}

async function loadAnnouncementArchive() {
  const list = document.getElementById("announcementArchiveList");

  if (!list) return;

  list.innerHTML = `<p>Dang tai thong bao...</p>`;

  try {
    const response = await fetch(`${ANNOUNCEMENTS_API}/archive`);
    const announcements = await response.json();

    if (!response.ok) {
      throw new Error(announcements.message || "Khong the tai thong bao.");
    }

    announcementArchive = announcements;
    announcementArchivePage = 1;
    renderAnnouncementArchive();
  } catch (error) {
    list.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
  }
}

function initAnnouncementArchiveFilters() {
  const search = document.getElementById("announcementArchiveSearch");
  const status = document.getElementById("announcementArchiveStatus");
  const date = document.getElementById("announcementArchiveDate");
  const pageSize = document.getElementById("announcementArchivePageSize");
  const pager = document.getElementById("announcementArchivePager");

  if (!search && !status && !date && !pageSize && !pager) return;

  [search, status, date, pageSize].forEach(control => {
    control?.addEventListener("input", () => {
      announcementArchivePage = 1;
      renderAnnouncementArchive();
    });

    control?.addEventListener("change", () => {
      announcementArchivePage = 1;
      renderAnnouncementArchive();
    });
  });

  pager?.addEventListener("click", event => {
    const button = event.target.closest("[data-archive-page]");
    if (!button) return;

    const action = button.dataset.archivePage;
    const totalPages = Math.max(1, Math.ceil(getFilteredAnnouncementArchive().length / Number(pageSize?.value || 5)));

    if (action === "prev") {
      announcementArchivePage -= 1;
    } else if (action === "next") {
      announcementArchivePage += 1;
    } else {
      announcementArchivePage = Number(action);
    }

    announcementArchivePage = Math.min(Math.max(announcementArchivePage, 1), totalPages);
    renderAnnouncementArchive();
  });
}

function startAnnouncementTicker(box, itemCount) {
  const track = box.querySelector(".announcement-track");

  clearInterval(announcementTimer);

  if (!track || itemCount <= 1) return;

  let index = 0;
  const rowHeight = 28;

  announcementTimer = setInterval(() => {
    index += 1;
    track.style.transition = "transform 0.45s ease";
    track.style.transform = `translateY(-${index * rowHeight}px)`;

    if (index === itemCount) {
      setTimeout(() => {
        track.style.transition = "none";
        track.style.transform = "translateY(0)";
        index = 0;
      }, 480);
    }
  }, 2800);
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
  if (!isLoggedIn()) {
    requireLogin("Vui long dang nhap de them mon vao gio hang.", "menu.html");
    return;
  }

  const food = foods.find(item => item.id === foodId);

  if (!food) {
    showSiteToast("Không tìm thấy món ăn.", "error");
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
  showSiteToast(`Đã thêm ${food.name} vào giỏ hàng`);
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

  if (!isLoggedIn()) {
    requireLogin("Vui long dang nhap de dat hang.", "cart.html");
    return;
  }

  if (cart.length === 0) {
    showSiteToast("Giỏ hàng đang trống. Vui lòng chọn món trước.", "error");
    return;
  }

  const name = document.getElementById("customerName").value;
  const phone = document.getElementById("customerPhone").value;
  const address = document.getElementById("customerAddress").value;
  const note = document.getElementById("customerNote").value;
  const submitButton = document.querySelector("#orderForm button[type='submit']");
  const token = getAuthToken();

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

    if (response.status === 401) {
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
      sessionStorage.removeItem(AUTH_USER_KEY);
      requireLogin(data.message || "Phien dang nhap da het han. Vui long dang nhap lai.", "cart.html");
      return;
    }

    if (!response.ok) {
      showSiteToast(data.message || "Không thể đặt hàng. Vui lòng thử lại.", "error");
      return;
    }

    cart = [];
    saveCart();
    renderCart();
    document.getElementById("orderForm").reset();
    showSiteToast("Đặt hàng thành công. Đang chuyển sang trang tra cứu...");

    setTimeout(() => {
      window.location.href = "track.html";
    }, 900);
  } catch (error) {
    showSiteToast("Không kết nối được server đặt hàng.", "error");
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

async function loadOrderHistory(event) {
  if (event) event.preventDefault();

  const resultBox = document.getElementById("track-result");
  const searchInput = document.getElementById("orderSearch");
  const dateInput = document.getElementById("orderDate");

  if (!resultBox) return;

  if (!isLoggedIn()) {
    requireLogin("Vui long dang nhap de xem lich su don hang.", "track.html");
    return;
  }

  const params = new URLSearchParams();
  const searchValue = searchInput?.value.trim();
  const dateValue = dateInput?.value;

  if (searchValue) params.set("q", searchValue);
  if (dateValue) params.set("date", dateValue);

  resultBox.innerHTML = "<p>Dang tai lich su don hang...</p>";

  try {
    const response = await fetch(`${ORDERS_API}?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`
      }
    });
    const data = await response.json();

    if (response.status === 401) {
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
      sessionStorage.removeItem(AUTH_USER_KEY);
      requireLogin(data.message || "Phien dang nhap da het han. Vui long dang nhap lai.", "track.html");
      return;
    }

    if (!response.ok) {
      resultBox.innerHTML = `<p>${data.message || "Khong the tai lich su don hang."}</p>`;
      return;
    }

    renderOrderHistory(data);
  } catch (error) {
    resultBox.innerHTML = "<p>Khong ket noi duoc server.</p>";
    console.error(error);
  }
}

function renderOrderHistory(orders) {
  const resultBox = document.getElementById("track-result");

  if (!resultBox) return;

  if (!orders.length) {
    resultBox.innerHTML = `
      <div class="empty-history">
        <h3>Chua co don hang phu hop</h3>
        <p>Ban co the quay lai thuc don de dat mon hoac thu bo loc khac.</p>
        <a href="menu.html" class="btn">Dat mon ngay</a>
      </div>
    `;
    return;
  }

  resultBox.innerHTML = orders.map(order => `
    <article class="track-card">
      <div class="order-history-top">
        <div>
          <h3>Don #${order.id} - ${formatMoney(order.total_price)}</h3>
          <p>${new Date(order.created_at).toLocaleString("vi-VN")}</p>
        </div>
        <span class="status-pill">${getOrderStatusLabel(order.status)}</span>
      </div>

      <div class="history-info">
        <p><strong>Khach hang:</strong> ${order.customer_name}</p>
        <p><strong>So dien thoai:</strong> ${order.phone}</p>
        <p><strong>Dia chi:</strong> ${order.address}</p>
        ${order.note ? `<p><strong>Ghi chu:</strong> ${order.note}</p>` : ""}
      </div>

      <div class="history-items">
        ${order.items.map(item => `
          <div class="track-line">
            <span>${item.food_name} x ${item.quantity}</span>
            <strong>${formatMoney(item.subtotal)}</strong>
          </div>
        `).join("")}
      </div>
    </article>
  `).join("");
}

function resetOrderHistoryFilter() {
  const searchInput = document.getElementById("orderSearch");
  const dateInput = document.getElementById("orderDate");

  if (searchInput) searchInput.value = "";
  if (dateInput) dateInput.value = "";

  loadOrderHistory();
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

  const user = getCurrentUser();

  if (user) {
    const isAdmin = String(user.role || "").toUpperCase() === "ADMIN";
    const menuLink = isAdmin
      ? `<a href="admin.html" class="account-menu-link">Quản trị</a>`
      : `<a href="profile.html" class="account-menu-link">Hồ sơ cá nhân</a>`;
    const initial = escapeHtml(String(user.fullname || "U").trim().charAt(0).toUpperCase() || "U");

    userArea.innerHTML = `
      <div class="account-menu">
        <button type="button" class="account-toggle" aria-label="Mở tài khoản" aria-expanded="false">
          <span class="account-avatar">${initial}</span>
        </button>
        <div class="account-dropdown">
          <div class="account-summary">
            <strong>${escapeHtml(user.fullname)}</strong>
            <small>${escapeHtml(isAdmin ? "Quản trị viên" : "Khách hàng")}</small>
          </div>
          ${menuLink}
          <button type="button" class="account-menu-link danger" onclick="logout()">Đăng xuất</button>
        </div>
      </div>
    `;
  } else {
    userArea.innerHTML = `
      <a href="login.html" class="header-action primary">Đăng nhập</a>
      <a href="register.html" class="header-action secondary">Đăng ký</a>
    `;
  }
}

function initAccountMenu() {
  document.addEventListener("click", event => {
    const currentMenu = event.target.closest(".account-menu");

    document.querySelectorAll(".account-menu.open").forEach(menu => {
      if (menu !== currentMenu) {
        menu.classList.remove("open");
        menu.querySelector(".account-toggle")?.setAttribute("aria-expanded", "false");
      }
    });

    const toggle = event.target.closest(".account-toggle");
    if (!toggle) return;

    const menu = toggle.closest(".account-menu");
    const isOpen = menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
}

function initMobileMenu() {
  const header = document.querySelector("header");
  const headerTop = document.querySelector(".header-top");

  if (!header || header.querySelector(".mobile-menu-toggle")) return;

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "mobile-menu-toggle";
  toggle.setAttribute("aria-label", "Mo menu");
  toggle.setAttribute("aria-expanded", "false");
  toggle.innerHTML = "<span></span><span></span><span></span>";

  const overlay = document.createElement("div");
  overlay.className = "mobile-menu-overlay";

  toggle.addEventListener("click", () => {
    const isOpen = header.classList.toggle("mobile-menu-open");
    document.body.classList.toggle("menu-lock", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  overlay.addEventListener("click", () => {
    header.classList.remove("mobile-menu-open");
    document.body.classList.remove("menu-lock");
    toggle.setAttribute("aria-expanded", "false");
  });

  (headerTop || header).prepend(toggle);
  header.appendChild(overlay);
}

function logout() {
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_USER_KEY);
  sessionStorage.removeItem(CART_KEY);
  cart = [];
  showSiteToast("Đã đăng xuất");

  setTimeout(() => {
    window.location.href = "index.html";
  }, 500);
}

function initTrackPage() {
  const resultBox = document.getElementById("track-result");

  if (resultBox) loadOrderHistory();
}

function protectCheckoutPage() {
  const orderForm = document.getElementById("orderForm");
  const orderHistory = document.getElementById("orderSearch");
  const profileForm = document.getElementById("profileForm");

  if (!orderForm && !orderHistory && !profileForm) return true;
  if (isLoggedIn()) return true;

  const target = profileForm ? "profile.html" : orderHistory ? "track.html" : "cart.html";
  requireLogin("Vui long dang nhap de tiep tuc.", target);
  return false;
}

function initSupportWidget() {
  if (document.getElementById("support-widget")) return;

  const widget = document.createElement("div");
  widget.id = "support-widget";
  widget.className = "support-widget";
  widget.innerHTML = `
    <div class="support-panel" aria-label="Kenh ho tro FoodHub">
      <a href="https://zalo.me/" target="_blank" rel="noopener" class="support-link zalo">
        <span>Z</span>
        <strong>Zalo</strong>
      </a>
      <a href="https://m.me/" target="_blank" rel="noopener" class="support-link messenger">
        <span>f</span>
        <strong>Messenger</strong>
      </a>
      <a href="tel:0123456789" class="support-link phone">
        <span>☎</span>
        <strong>Hotline</strong>
      </a>
      <a href="mailto:foodhub@gmail.com" class="support-link email">
        <span>@</span>
        <strong>Email</strong>
      </a>
    </div>
    <button type="button" class="support-toggle" aria-label="Mo ho tro" aria-expanded="false">
      <span>🤖</span>
    </button>
  `;

  const button = widget.querySelector(".support-toggle");
  button.addEventListener("click", () => {
    const isOpen = widget.classList.toggle("open");
    button.setAttribute("aria-expanded", String(isOpen));
  });

  document.body.appendChild(widget);
}

function initChatSupportWidget() {
  if (document.getElementById("support-widget")) return;

  const user = getCurrentUser();
  const displayName = user?.fullname || "ban";
  const widget = document.createElement("div");
  widget.id = "support-widget";
  widget.className = "support-widget";
  widget.innerHTML = `
    <div class="support-panel chat-panel" aria-label="Hop chat ho tro FoodHub">
      <div class="chat-header">
        <div>
          <strong>FoodHub Support</strong>
          <small>Dang truc tuyen</small>
        </div>
        <button type="button" class="chat-close" aria-label="Dong ho tro">x</button>
      </div>
      <div class="chat-messages" aria-live="polite">
        <div class="chat-message bot">Xin chao ${escapeHtml(displayName)}, FoodHub co the ho tro gi cho ban?</div>
        <div class="chat-message bot muted">Day la khung chat tam thoi. Sau nay minh se ket noi du lieu he thong de tra loi tu dong.</div>
      </div>
      <form class="chat-form">
        <input type="text" class="chat-input" placeholder="Nhap tin nhan..." aria-label="Nhap tin nhan ho tro">
        <button type="submit">Gui</button>
      </form>
    </div>
    <button type="button" class="support-toggle" aria-label="Mo ho tro" aria-expanded="false">
      <span>🤖</span>
    </button>
  `;

  const button = widget.querySelector(".support-toggle");
  const closeButton = widget.querySelector(".chat-close");
  const chatForm = widget.querySelector(".chat-form");
  const chatInput = widget.querySelector(".chat-input");
  const chatMessages = widget.querySelector(".chat-messages");

  button.addEventListener("click", () => {
    const isOpen = widget.classList.toggle("open");
    button.setAttribute("aria-expanded", String(isOpen));
    if (isOpen) chatInput.focus();
  });

  closeButton.addEventListener("click", () => {
    widget.classList.remove("open");
    button.setAttribute("aria-expanded", "false");
  });

  chatForm.addEventListener("submit", event => {
    event.preventDefault();

    const message = chatInput.value.trim();
    if (!message) return;

    chatMessages.insertAdjacentHTML("beforeend", `
      <div class="chat-message user">${escapeHtml(message)}</div>
      <div class="chat-message bot muted">FoodHub da nhan tin nhan cua ban. Chuc nang tra loi tu dong se duoc cap nhat sau.</div>
    `);
    chatInput.value = "";
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });

  document.body.appendChild(widget);
}

if (protectCheckoutPage()) {
  loadFoods();
  loadPublicAnnouncements();
  renderCart();
  renderUser();
  initAccountMenu();
  initMobileMenu();
  initTrackPage();
  initAnnouncementArchiveFilters();
  loadAnnouncementArchive();
  initChatSupportWidget();
}
