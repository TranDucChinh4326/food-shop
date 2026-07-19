const API_BASE_URL = window.FOODHUB_CONFIG?.API_BASE_URL || "http://localhost:3000/api";
const API_URL = `${API_BASE_URL}/foods`;
const CATEGORIES_API = `${API_BASE_URL}/foods/categories`;
const ORDERS_API = `${API_BASE_URL}/orders`;
const ANNOUNCEMENTS_API = `${API_BASE_URL}/announcements`;
const AUTH_TOKEN_KEY = "foodhub_token";
const AUTH_USER_KEY = "foodhub_user";
const CART_KEY = "foodhub_cart";

let foods = [];
let publicCategories = [];
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

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getCategoryKey(food) {
  const type = String(food.category_type || "").toLowerCase();

  if (type === "food" || type === "drink") {
    return type;
  }

  switch (Number(food.category_id)) {
    case 1:
    case 2:
    case 3:
      return "food";
    default:
      return Number(food.category_id) === 4 ? "drink" : "food";
  }
}

function getSubCategoryKey(food) {
  return food.category_slug || slugify(food.category_name || food.category_id || "khac");
}

function getCategoryQueryValue() {
  const params = new URLSearchParams(window.location.search);
  return params.get("category") || "all";
}

function getCategoryUrl(value) {
  return `menu.html?category=${encodeURIComponent(value || "all")}`;
}

function normalizePublicCategory(category) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug || slugify(category.name || category.id),
    type: String(category.type || "").toLowerCase() === "drink" ? "drink" : "food",
    parentId: category.parentId ?? category.parent_id ?? null,
    parentName: category.parentName ?? category.parent_name ?? null,
    parentSlug: category.parentSlug ?? category.parent_slug ?? null,
    sortOrder: Number(category.sortOrder ?? category.sort_order ?? category.id ?? 0)
  };
}

function getCategoryChildren(type) {
  const categories = publicCategories
    .map(normalizePublicCategory)
    .filter(category => category.type === type);
  const baseRootSlugs = type === "drink" ? ["nuoc-uong"] : ["do-an"];
  const customRoots = categories.filter(category => !category.parentId && !baseRootSlugs.includes(category.slug));
  const childCategories = categories.filter(category => category.parentId);

  return (customRoots.length || childCategories.length ? [...customRoots, ...childCategories] : categories)
    .sort((first, second) => first.sortOrder - second.sortOrder || first.name.localeCompare(second.name, "vi"));
}

function renderPublicNavCategory(type) {
  const menu = document.querySelector(`[data-public-category-menu="${type}"]`);
  if (!menu) return;

  const label = type === "drink" ? "Do uong" : "Do an";
  const children = getCategoryChildren(type);
  const panel = children.length
    ? children.map(category => `<a href="${getCategoryUrl(category.slug)}">${escapeHtml(category.name)}</a>`).join("")
    : menu.querySelector(".nav-dropdown-panel")?.innerHTML || "";

  menu.innerHTML = `
    <a class="nav-dropdown-toggle" href="${getCategoryUrl(type)}">${label} <span aria-hidden="true">&#9662;</span></a>
    <div class="nav-dropdown-panel">${panel}</div>
  `;
}

function renderPublicNavCategories() {
  renderPublicNavCategory("food");
  renderPublicNavCategory("drink");
}

async function loadPublicCategories() {
  if (!document.querySelector("[data-public-category-menu]")) return;

  try {
    const response = await fetch(CATEGORIES_API);
    if (!response.ok) throw new Error("Khong the tai danh muc");

    publicCategories = await response.json();
    renderPublicNavCategories();
  } catch (error) {
    console.error("Loi tai danh muc:", error);
  }
}

function renderMenuCategoryOptions() {
  const categoryFilter = document.getElementById("categoryFilter");

  if (!categoryFilter) return;

  const oldValue = categoryFilter.value || getCategoryQueryValue() || "all";
  const groups = {
    food: new Map(),
    drink: new Map()
  };

  foods.forEach(food => {
    const key = food.subcategory || food.category;
    const label = food.categoryName || (food.category === "drink" ? "Do uong" : "Do an");

    if (!groups[food.category].has(key)) {
      groups[food.category].set(key, label);
    }
  });

  categoryFilter.innerHTML = `
    <option value="all">Tat ca</option>
    <option value="food">Do an</option>
    <option value="drink">Nuoc uong</option>
    ${groups.food.size ? `
      <optgroup label="Do an">
        ${[...groups.food.entries()].map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`).join("")}
      </optgroup>
    ` : ""}
    ${groups.drink.size ? `
      <optgroup label="Nuoc uong">
        ${[...groups.drink.entries()].map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`).join("")}
      </optgroup>
    ` : ""}
  `;

  if ([...categoryFilter.options].some(option => option.value === oldValue)) {
    categoryFilter.value = oldValue;
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
      category: getCategoryKey(food),
      subcategory: getSubCategoryKey(food),
      categoryName: food.category_name,
      parentCategoryName: food.parent_category_name,
      price: food.price,
      desc: food.description,
      image: food.image
    }));

    renderMenuCategoryOptions();
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
    const matchCategory = categoryValue === "all" || food.category === categoryValue || food.subcategory === categoryValue;
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
      ? `<a href="admin.html?section=overview" class="account-menu-link">Quản trị</a>`
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

function initCompactHeader() {
  const header = document.querySelector("header");
  if (!header) return;

  let isCompact = false;

  const updateHeaderState = () => {
    if (window.innerWidth <= 900) {
      isCompact = false;
      header.classList.remove("header-compact");
      return;
    }

    if (!isCompact && window.scrollY > 170) {
      isCompact = true;
      header.classList.add("header-compact");
      return;
    }

    if (isCompact && window.scrollY < 48) {
      isCompact = false;
      header.classList.remove("header-compact");
    }
  };

  updateHeaderState();
  window.addEventListener("scroll", updateHeaderState, { passive: true });
  window.addEventListener("resize", updateHeaderState);
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
      <span aria-hidden="true">
        <svg class="support-robot-icon" viewBox="0 0 64 64" focusable="false">
          <rect class="robot-face" x="13" y="18" width="38" height="32" rx="14"></rect>
          <path class="robot-antenna" d="M32 18v-7"></path>
          <circle class="robot-dot" cx="32" cy="8" r="3"></circle>
          <circle class="robot-eye" cx="25" cy="33" r="3"></circle>
          <circle class="robot-eye" cx="39" cy="33" r="3"></circle>
          <path class="robot-mouth" d="M26 42h12"></path>
        </svg>
      </span>
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
        <div class="chat-agent">
          <span class="chat-avatar" aria-hidden="true">
            <svg viewBox="0 0 64 64" focusable="false">
              <rect x="13" y="18" width="38" height="32" rx="14"></rect>
              <path d="M32 18v-7"></path>
              <circle cx="32" cy="8" r="3"></circle>
              <circle cx="25" cy="33" r="3"></circle>
              <circle cx="39" cy="33" r="3"></circle>
              <path d="M26 42h12"></path>
            </svg>
          </span>
          <div>
            <strong>FoodHub</strong>
            <small>Chat voi chung toi</small>
          </div>
        </div>
        <div class="chat-header-actions">
          <button type="button" class="chat-menu" aria-label="Menu ho tro">
            <span></span><span></span><span></span>
          </button>
          <button type="button" class="chat-close" aria-label="Dong ho tro">x</button>
        </div>
      </div>
      <div class="chat-quick-menu" hidden>
        <a href="menu.html">Xem thuc don</a>
        <a href="track.html">Lich su don hang</a>
        <a href="contact.html">Lien he FoodHub</a>
      </div>
      <div class="chat-messages" aria-live="polite">
        <div class="chat-message bot">Xin chao ${escapeHtml(displayName)}, FoodHub co the ho tro gi cho ban?</div>
        <div class="chat-message bot muted">Day la khung chat tam thoi. Sau nay minh se ket noi du lieu he thong de tra loi tu dong.</div>
      </div>
      <form class="chat-form">
        <input type="file" class="chat-file" aria-label="Dinh kem tep" hidden>
        <div class="chat-form-main">
          <input type="text" class="chat-input" placeholder="Nhap noi dung..." aria-label="Nhap tin nhan ho tro">
          <div class="chat-tools">
            <button type="button" class="chat-tool chat-like" aria-label="Gui like">
              <svg viewBox="0 0 24 24" focusable="false">
                <path d="M7 10v10H4V10h3Zm4.2-7c.8 0 1.4.6 1.4 1.4v3.2H18c1.2 0 2 .9 1.8 2.1l-1.1 7.7c-.2 1-1 1.7-2 1.7H9V9.8l2-5.6c.2-.7.8-1.2 1.5-1.2h-1.3Z"></path>
              </svg>
            </button>
            <button type="button" class="chat-tool chat-attach" aria-label="Dinh kem tep">
              <svg viewBox="0 0 24 24" focusable="false">
                <path d="M18.4 11.2 11 18.6a4.2 4.2 0 0 1-6-6L14 3.7a2.9 2.9 0 0 1 4.1 4.1L9.5 16.4a1.5 1.5 0 0 1-2.1-2.1l7.5-7.5"></path>
              </svg>
            </button>
            <button type="button" class="chat-tool chat-emoji" aria-label="Chon bieu tuong">
              <svg viewBox="0 0 24 24" focusable="false">
                <circle cx="12" cy="12" r="9"></circle>
                <circle cx="9" cy="10" r="1"></circle>
                <circle cx="15" cy="10" r="1"></circle>
                <path d="M8 14c1 1.4 2.3 2 4 2s3-.6 4-2"></path>
              </svg>
            </button>
            <button type="submit" class="chat-send" aria-label="Gui tin nhan">
              <svg viewBox="0 0 24 24" focusable="false">
                <path d="M4 12 20 4l-4 16-4-7-8-1Z"></path>
              </svg>
            </button>
          </div>
        </div>
        <div class="chat-emoji-picker" hidden>
          <button type="button" data-code="128522">&#128522;</button>
          <button type="button" data-code="128525">&#128525;</button>
          <button type="button" data-code="128523">&#128523;</button>
          <button type="button" data-code="128077">&#128077;</button>
          <button type="button" data-code="10084">&#10084;</button>
        </div>
      </form>
    </div>
    <button type="button" class="support-toggle" aria-label="Mo ho tro" aria-expanded="false">
      <span aria-hidden="true">
        <svg class="support-robot-icon" viewBox="0 0 64 64" focusable="false">
          <rect class="robot-face" x="13" y="18" width="38" height="32" rx="14"></rect>
          <path class="robot-antenna" d="M32 18v-7"></path>
          <circle class="robot-dot" cx="32" cy="8" r="3"></circle>
          <circle class="robot-eye" cx="25" cy="33" r="3"></circle>
          <circle class="robot-eye" cx="39" cy="33" r="3"></circle>
          <path class="robot-mouth" d="M26 42h12"></path>
        </svg>
      </span>
    </button>
  `;

  const button = widget.querySelector(".support-toggle");
  const closeButton = widget.querySelector(".chat-close");
  const menuButton = widget.querySelector(".chat-menu");
  const quickMenu = widget.querySelector(".chat-quick-menu");
  const chatForm = widget.querySelector(".chat-form");
  const chatInput = widget.querySelector(".chat-input");
  const chatFile = widget.querySelector(".chat-file");
  const attachButton = widget.querySelector(".chat-attach");
  const emojiButton = widget.querySelector(".chat-emoji");
  const emojiPicker = widget.querySelector(".chat-emoji-picker");
  const likeButton = widget.querySelector(".chat-like");
  const chatMessages = widget.querySelector(".chat-messages");

  button.addEventListener("click", () => {
    const isOpen = widget.classList.toggle("open");
    button.setAttribute("aria-expanded", String(isOpen));
    if (isOpen) chatInput.focus();
  });

  closeButton.addEventListener("click", () => {
    widget.classList.remove("open");
    button.setAttribute("aria-expanded", "false");
    quickMenu.hidden = true;
    emojiPicker.hidden = true;
  });

  menuButton.addEventListener("click", () => {
    quickMenu.hidden = !quickMenu.hidden;
  });

  attachButton.addEventListener("click", () => {
    chatFile.click();
  });

  chatFile.addEventListener("change", () => {
    const file = chatFile.files?.[0];
    if (!file) return;

    chatMessages.insertAdjacentHTML("beforeend", `
      <div class="chat-message user file-message">Da dinh kem: ${escapeHtml(file.name)}</div>
      <div class="chat-message bot muted">FoodHub da nhan thong tin tep. Tinh nang gui tep that se duoc ket noi sau.</div>
    `);
    chatFile.value = "";
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });

  emojiButton.addEventListener("click", () => {
    emojiPicker.hidden = !emojiPicker.hidden;
  });

  emojiPicker.addEventListener("click", event => {
    const emojiOption = event.target.closest("button[data-code]");
    if (!emojiOption) return;

    chatInput.value += String.fromCodePoint(Number(emojiOption.dataset.code));
    emojiPicker.hidden = true;
    chatInput.focus();
  });

  likeButton.addEventListener("click", () => {
    chatMessages.insertAdjacentHTML("beforeend", `
      <div class="chat-message user">&#128077;</div>
      <div class="chat-message bot muted">Cam on ${escapeHtml(displayName)}, FoodHub da nhan phan hoi cua ban.</div>
    `);
    chatMessages.scrollTop = chatMessages.scrollHeight;
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
    emojiPicker.hidden = true;
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });

  document.addEventListener("click", event => {
    if (emojiPicker.hidden) return;
    if (emojiPicker.contains(event.target) || emojiButton.contains(event.target)) return;
    emojiPicker.hidden = true;
  });

  document.body.appendChild(widget);
}

if (protectCheckoutPage()) {
  loadPublicCategories();
  loadFoods();
  loadPublicAnnouncements();
  renderCart();
  renderUser();
  initAccountMenu();
  initMobileMenu();
  initCompactHeader();
  initTrackPage();
  initAnnouncementArchiveFilters();
  loadAnnouncementArchive();
  initChatSupportWidget();
}
