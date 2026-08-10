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
let selectedRootSlug = params.get("foodCategory") || params.get("type") || sessionStorage.getItem("foodhub_food_category") || "all";

const foodPageForm = document.getElementById("foodPageForm");
const foodId = document.getElementById("foodId");
const foodName = document.getElementById("foodName");
const foodType = document.getElementById("foodType");
const foodTypeLabel = document.getElementById("foodTypeLabel");
const foodCategory = document.getElementById("foodCategory");
const foodPrice = document.getElementById("foodPrice");
const foodStockQuantity = document.getElementById("foodStockQuantity");
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
    alert("Vui lòng đăng nhập bang tài khoản quản trị.");
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
    throw new Error(data.message || "Phiên đăng nhập da hết hạn.");
  }

  if (!response.ok) {
    throw new Error(data.message || "Không thể xử lý yêu cầu.");
  }

  return data;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

function normalizeCategory(category) {
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

function normalizeRootSlug(slug) {
  if (slug === "food") return "do-an";
  if (slug === "drink") return "nuoc-uong";
  return slug || "all";
}

function getRootCategories() {
  return foodCategories
    .filter(category => !category.parentId && category.isActive)
    .sort((first, second) => first.sortOrder - second.sortOrder || String(first.name).localeCompare(String(second.name), "vi"));
}

function getCategoryById(categoryId) {
  return foodCategories.find(category => String(category.id) === String(categoryId));
}

function getCategoryBySlug(slug) {
  return foodCategories.find(category => String(category.slug) === String(slug));
}

function getRootCategory(category) {
  if (!category) return null;
  return category.parentId ? getCategoryById(category.parentId) || category : category;
}

function getSelectedRootCategory() {
  const roots = getRootCategories();
  const current = selectedRootSlug === "all" ? null : getCategoryBySlug(selectedRootSlug);
  const root = current && !current.parentId ? current : roots[0];

  if (root) selectedRootSlug = root.slug;
  return root || null;
}

function getSubCategories() {
  const root = getSelectedRootCategory();

  if (!root) return [];

  const children = foodCategories
    .filter(category => String(category.parentId || "") === String(root.id) && category.isActive)
    .sort((first, second) => first.sortOrder - second.sortOrder || String(first.name).localeCompare(String(second.name), "vi"));

  return children.length ? children : [root];
}

function setModeText() {
  const root = getSelectedRootCategory();
  const typeText = root?.name ? root.name.toLowerCase() : "mon";

  if (isEditMode) {
    foodFormTitle.textContent = `Cập nhật ${typeText}`;
    foodBreadcrumb.textContent = `Cập nhật ${typeText}`;
    return;
  }

  foodFormTitle.textContent = `Thêm mới ${typeText}`;
  foodBreadcrumb.textContent = `Thêm mới ${typeText}`;
}

function syncFoodTypeField() {
  const root = getSelectedRootCategory();

  foodType.value = selectedRootSlug;

  if (foodTypeLabel) {
    foodTypeLabel.value = root?.name || "Danh mục mon";
  }
}

function renderCategoryOptions(selectedId = "") {
  const categories = getSubCategories();

  if (categories.length === 0) {
    foodCategory.innerHTML = `<option value="">Chưa có danh mục</option>`;
    return;
  }

  foodCategory.innerHTML = categories.map(category => `
    <option value="${category.id}" ${String(category.id) === String(selectedId) ? "selected" : ""}>
      ${escapeHtml(category.name)}
    </option>
  `).join("");

  if (!selectedId || !categories.some(category => String(category.id) === String(selectedId))) {
    foodCategory.value = categories[0].id;
  }
}

async function loadCategories() {
  try {
    foodCategories = (await requestJson(`${ADMIN_API}/categories`)).map(normalizeCategory);
    selectedRootSlug = normalizeRootSlug(selectedRootSlug);
    getSelectedRootCategory();
  } catch (error) {
    foodCategories = [
      { id: 100, name: "Đồ ăn", slug: "do-an", parentId: null, sortOrder: 1, isActive: 1 },
      { id: 101, name: "Nước uống", slug: "nuoc-uong", parentId: null, sortOrder: 2, isActive: 1 }
    ];
    selectedRootSlug = "do-an";
    showAdminToast(error.message, "error");
  }

  syncFoodTypeField();
  setModeText();
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
      reject(new Error("Vui lòng chọn tệp hình ảnh."));
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      reject(new Error("Ảnh tối đa 1.5MB để web tải nhanh hơn."));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Không thể doc tệp ảnh."));
    reader.readAsDataURL(file);
  });
}

async function handleImageFileChange() {
  const file = foodImageFile.files?.[0];

  if (!file) return;

  try {
    foodImage.value = await readImageFile(file);
    renderPreview();
    showAdminToast("Đã chọn ảnh món.");
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
    showAdminToast("Không tìm thấy món ăn.", "error");
    return;
  }

  const directCategory = getCategoryById(food.category_id);
  const rootCategory = getRootCategory(directCategory) || getCategoryById(food.parent_category_id);
  if (rootCategory) selectedRootSlug = rootCategory.slug;

  foodId.value = food.id;
  syncFoodTypeField();
  setModeText();
  renderCategoryOptions(food.category_id || "");
  foodCategory.value = food.category_id || foodCategory.value;
  foodName.value = food.name || "";
  foodPrice.value = food.price || "";
  foodStockQuantity.value = food.stock_quantity ?? food.stockQuantity ?? 0;
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
    stockQuantity: foodStockQuantity.value,
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
    sessionStorage.setItem("foodhub_food_category", selectedRootSlug);
    sessionStorage.setItem("foodhub_food_subcategory", "all");
    showAdminToast(currentFoodId ? "Đã cập nhật món." : "Đã thêm món.");
    setTimeout(() => {
      window.location.href = `admin.html?section=foods&foodCategory=${encodeURIComponent(selectedRootSlug)}`;
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
foodName.addEventListener("input", renderPreview);
foodPrice.addEventListener("input", renderPreview);
foodImageFile.addEventListener("change", handleImageFileChange);

requireAdminSession();
loadCategories()
  .then(loadFood)
  .catch(error => showAdminToast(error.message, "error"));
