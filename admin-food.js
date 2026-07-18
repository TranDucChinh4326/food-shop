const API_BASE_URL = window.FOODHUB_CONFIG?.API_BASE_URL || "http://localhost:3000/api";
const ADMIN_API = `${API_BASE_URL}/admin`;
const AUTH_TOKEN_KEY = "foodhub_token";
const AUTH_USER_KEY = "foodhub_user";

localStorage.removeItem(AUTH_TOKEN_KEY);
localStorage.removeItem(AUTH_USER_KEY);

const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
const user = JSON.parse(sessionStorage.getItem(AUTH_USER_KEY) || "null");
const params = new URLSearchParams(window.location.search);
const foodIdParam = params.get("id");
const isEditMode = Boolean(foodIdParam);

const foodPageForm = document.getElementById("foodPageForm");
const foodId = document.getElementById("foodId");
const foodName = document.getElementById("foodName");
const foodType = document.getElementById("foodType");
const foodCategory = document.getElementById("foodCategory");
const foodPrice = document.getElementById("foodPrice");
const foodImage = document.getElementById("foodImage");
const foodImageFile = document.getElementById("foodImageFile");
const foodDescription = document.getElementById("foodDescription");
const foodActive = document.getElementById("foodActive");
const foodFormTitle = document.getElementById("foodFormTitle");
const foodBreadcrumb = document.getElementById("foodBreadcrumb");
const foodPreview = document.getElementById("foodPreview");

let toastTimer;
let foodCategories = [];
const MAX_IMAGE_SIZE = 1.5 * 1024 * 1024;

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
    alert("Vui long dang nhap bang tai khoan quan tri.");
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
    throw new Error(data.message || "Khong the xu ly yeu cau.");
  }

  return data;
}

function setModeText() {
  if (isEditMode) {
    foodFormTitle.textContent = "Cap nhat thong tin mon";
    foodBreadcrumb.textContent = "Cap nhat";
    return;
  }

  foodFormTitle.textContent = "Them moi mon";
  foodBreadcrumb.textContent = "Them moi";
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getCategoryType(category) {
  const type = String(category.type || "").toLowerCase();

  if (type === "drink" || type === "food") return type;

  const text = String(category.name || "").toLowerCase();
  if (Number(category.id) === 4 || text.includes("uong") || text.includes("tra") || text.includes("ca phe")) {
    return "drink";
  }

  return "food";
}

function getSubCategories(type) {
  const selectedType = type || foodType.value || "food";
  const children = foodCategories.filter(category => {
    const parentId = Number(category.parentId || category.parent_id || 0);
    return parentId > 0 && getCategoryType(category) === selectedType;
  });

  if (children.length > 0) return children;

  return foodCategories.filter(category => getCategoryType(category) === selectedType);
}

function renderCategoryOptions(selectedId = "") {
  const categories = getSubCategories();

  if (categories.length === 0) {
    foodCategory.innerHTML = `<option value="">Chua co danh muc con</option>`;
    return;
  }

  foodCategory.innerHTML = categories.map(category => `
    <option value="${category.id}" ${String(category.id) === String(selectedId) ? "selected" : ""}>
      ${escapeHtml(category.name)}
    </option>
  `).join("");

  if (selectedId && !categories.some(category => String(category.id) === String(selectedId))) {
    foodCategory.value = categories[0].id;
  }
}

async function loadCategories() {
  try {
    foodCategories = await requestJson(`${ADMIN_API}/categories`);
  } catch (error) {
    foodCategories = [
      { id: 1, name: "Burger", type: "food" },
      { id: 2, name: "Pizza", type: "food" },
      { id: 3, name: "Mi & Pho", type: "food" },
      { id: 4, name: "Do uong", type: "drink" }
    ];
    showAdminToast(error.message, "error");
  }

  renderCategoryOptions();
}

function renderPreview() {
  const imageUrl = foodImage.value.trim();

  if (!imageUrl) {
    foodPreview.hidden = true;
    foodPreview.innerHTML = "";
    return;
  }

  foodPreview.hidden = false;
  foodPreview.innerHTML = `
    <img src="${escapeHtml(imageUrl)}" alt="">
    <div>
      <strong>${escapeHtml(foodName.value.trim() || "Ten mon")}</strong>
      <small>${Number(foodPrice.value || 0).toLocaleString("vi-VN")}d</small>
    </div>
  `;
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Vui long chon tep hinh anh."));
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      reject(new Error("Anh toi da 1.5MB de web tai nhanh hon."));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Khong the doc tep anh."));
    reader.readAsDataURL(file);
  });
}

async function handleImageFileChange() {
  const file = foodImageFile.files?.[0];

  if (!file) return;

  try {
    foodImage.value = await readImageFile(file);
    renderPreview();
    showAdminToast("Da chon anh mon.");
  } catch (error) {
    foodImageFile.value = "";
    showAdminToast(error.message, "error");
  }
}

async function loadFood() {
  if (!isEditMode) return;

  const foods = await requestJson(`${ADMIN_API}/foods`);
  const food = foods.find(item => String(item.id) === String(foodIdParam));

  if (!food) {
    showAdminToast("Khong tim thay mon an.", "error");
    return;
  }

  foodId.value = food.id;
  foodName.value = food.name || "";
  foodType.value = getCategoryType({
    id: food.category_id,
    name: food.category_name,
    type: food.category_type
  });
  renderCategoryOptions(food.category_id || "");
  foodCategory.value = food.category_id || foodCategory.value;
  foodPrice.value = food.price || "";
  foodImage.value = food.image || "";
  foodDescription.value = food.description || "";
  foodActive.checked = Boolean(food.is_active);
  renderPreview();
}

async function saveFood(event) {
  event.preventDefault();

  const currentFoodId = foodId.value;
  const payload = {
    name: foodName.value.trim(),
    categoryId: foodCategory.value,
    price: foodPrice.value,
    image: foodImage.value.trim(),
    description: foodDescription.value.trim(),
    isActive: foodActive.checked ? 1 : 0
  };

  try {
    await requestJson(currentFoodId ? `${ADMIN_API}/foods/${currentFoodId}` : `${ADMIN_API}/foods`, {
      method: currentFoodId ? "PUT" : "POST",
      body: JSON.stringify(payload)
    });

    sessionStorage.setItem("foodhub_admin_section", "foods");
    showAdminToast(currentFoodId ? "Da cap nhat mon." : "Da them mon.");
    setTimeout(() => {
      window.location.href = "admin.html";
    }, 700);
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

foodPageForm.addEventListener("submit", saveFood);
foodType.addEventListener("change", () => renderCategoryOptions());
foodName.addEventListener("input", renderPreview);
foodPrice.addEventListener("input", renderPreview);
foodImageFile.addEventListener("change", handleImageFileChange);

requireAdminSession();
setModeText();
loadCategories()
  .then(loadFood)
  .catch(error => showAdminToast(error.message, "error"));
