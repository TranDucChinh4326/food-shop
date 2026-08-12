const API_BASE_URL = window.FOODHUB_CONFIG?.API_BASE_URL || "http://localhost:3000/api";
const API_URL = `${API_BASE_URL}/foods`;
const CATEGORIES_API = `${API_BASE_URL}/foods/categories`;
const ORDERS_API = `${API_BASE_URL}/orders`;
const ANNOUNCEMENTS_API = `${API_BASE_URL}/announcements`;
const ADVERTISEMENTS_API = `${API_BASE_URL}/advertisements`;
const FOOD_REVIEWS_API = `${API_BASE_URL}/food-reviews`;
const AUTH_TOKEN_KEY = "foodhub_token";
const AUTH_USER_KEY = "foodhub_user";
const CART_KEY = "foodhub_cart";

let foods = [];
let foodReviews = [];
let publicCategories = [];
let cart = JSON.parse(sessionStorage.getItem(CART_KEY) || "[]");
let toastTimer;
let announcementTimer;
let floatingAdTimers = [];
let announcementArchive = [];
let announcementArchivePage = 1;
let activeQrPayment = null;
let qrPaymentCountdownTimer = null;
let qrPaymentStatusTimer = null;

const LEGACY_ADDRESS_LOOKUP = {
  "Hà Nội": {
    "Quận Ba Đình": ["Phường Phúc Xá", "Phường Trúc Bạch", "Phường Kim Mã", "Phường Cống Vị"],
    "Quận Hoàn Kiếm": ["Phường Chương Dương Độ", "Phường Hàng Trống", "Phường Hàng Bạc", "Phường Lý Thái Tổ"],
    "Quận Đống Đa": ["Phường Nam Đồng", "Phường Trung Liệt", "Phường Khâm Thiên", "Phường Cát Linh"]
  },
  "Hồ Chí Minh": {
    "Quận 1": ["Phường Bến Nghé", "Phường Đa Kao", "Phường Tân Định", "Phường Nguyễn Thái Bình"],
    "Quận 3": ["Phường Võ Thị Sáu", "Phường Nguyễn Cư Trinh", "Phường Phạm Ngũ Lão", "Phường Đa Kao"],
    "Quận 7": ["Phường Tân Phú", "Phường Tân Hưng", "Phường Tân Thuận Đông", "Phường Tân Quy"]
  },
  "Đà Nẵng": {
    "Quận Hải Châu": ["Phường Thạch Thang", "Phường Bình Hiên", "Phường Nam Dương", "Phường Thanh Bình"],
    "Quận Cẩm Lệ": ["Phường Hòa An", "Phường Hòa Thọ Tây", "Phường Hòa Xuân", "Phường Khuê Trung"],
    "Quận Ngũ Hành Sơn": ["Phường Hòa Hải", "Phường Mỹ An", "Phường Khuê Mỹ", "Phường Mân Thái"]
  },
  "Hải Phòng": {
    "Quận Hồng Bàng": ["Phường Sở Dầu", "Phường Quán Toan", "Phường Phan Bội Châu", "Phường Gia Viễn"],
    "Quận Ngô Quyền": ["Phường Lạch Tray", "Phường Máy Chai", "Phường Cầu Tre", "Phường Vĩnh Niệm"],
    "Quận Lê Chân": ["Phường Trại Cau", "Phường Kênh Dương", "Phường Lam Sơn", "Phường Ẩn Biên"]
  }
};

const VIETNAM_ADDRESS_API = "https://provinces.open-api.vn/api/v2/?depth=2";
const ADDRESS_CACHE_KEY = "foodhub_vietnam_addresses_v2";
let ADDRESS_LOOKUP = {};
let addressLookupPromise;

const DEFAULT_ADDRESS_SUGGESTIONS = [
  "Số nhà, tên đường, khu phố",
  "Tòa nhà, lầu, số phòng",
  "Ngõ, ngách, hẻm gần khu vực"
];

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

function getDefaultAvatarDataUrl() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#ff7a2f"/>
          <stop offset="1" stop-color="#ff4b20"/>
        </linearGradient>
      </defs>
      <rect width="96" height="96" rx="48" fill="url(#bg)"/>
      <circle cx="48" cy="36" r="17" fill="#fff7f2"/>
      <path d="M20 82c4.8-18.5 17.1-28 28-28s23.2 9.5 28 28" fill="#fff7f2"/>
      <circle cx="48" cy="48" r="44" fill="none" stroke="#fff" stroke-width="5"/>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function formatMoney(number) {
  return Number(number).toLocaleString("vi-VN") + "đ";
}

function formatDateTime(value) {
  if (!value) return "Chưa đặt";

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

function requireLogin(message = "Vui lòng đăng nhập để tiếp tục.", target = window.location.href) {
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
  return food.parent_category_slug || getPublicRootCategoryByFood(food)?.slug || food.category_slug || "all";
}

function getSubCategoryKey(food) {
  return food.category_slug || slugify(food.category_name || food.category_id || "khac");
}

function getCategoryQueryValue() {
  const params = new URLSearchParams(window.location.search);
  return params.get("category") || "all";
}

function getMenuCategoryValue() {
  const value = getCategoryQueryValue();

  if (value === "food") return "do-an";
  if (value === "drink") return "nuoc-uong";

  return value || "all";
}

function getCategoryUrl(value) {
  return `menu.html?category=${encodeURIComponent(value || "all")}`;
}

function normalizePublicCategory(category) {
  return {
    id: Number(category.id),
    name: category.name,
    slug: category.slug || slugify(category.name || category.id),
    type: category.type || "",
    parentId: category.parentId ?? category.parent_id ?? null,
    parentName: category.parentName ?? category.parent_name ?? null,
    parentSlug: category.parentSlug ?? category.parent_slug ?? null,
    sortOrder: Number(category.sortOrder ?? category.sort_order ?? category.id ?? 0),
    isActive: Number(category.isActive ?? category.is_active ?? 1)
  };
}

function getPublicCategories() {
  return publicCategories
    .map(normalizePublicCategory)
    .filter(category => category.isActive)
    .sort((first, second) => first.sortOrder - second.sortOrder || first.name.localeCompare(second.name, "vi"));
}

function getPublicRootCategories() {
  return getPublicCategories().filter(category => !category.parentId);
}

function getPublicCategoryById(categoryId) {
  return getPublicCategories().find(category => String(category.id) === String(categoryId));
}

function getPublicCategoryBySlug(slug) {
  return getPublicCategories().find(category => String(category.slug) === String(slug));
}

function getPublicRootCategory(category) {
  if (!category) return null;
  return category.parentId ? getPublicCategoryById(category.parentId) || category : category;
}

function getPublicRootCategoryByFood(food) {
  const directCategory = getPublicCategoryById(food.category_id);
  if (directCategory) return getPublicRootCategory(directCategory);

  if (food.parent_category_id) return getPublicCategoryById(food.parent_category_id);

  const legacyType = String(food.category_type || "").toLowerCase();
  if (legacyType === "drink") return getPublicCategoryBySlug("nuoc-uong");
  if (legacyType === "food") return getPublicCategoryBySlug("do-an");

  return null;
}

function getRootChildren(rootId) {
  return getPublicCategories().filter(category => String(category.parentId || "") === String(rootId));
}

function renderPublicNavCategories() {
  const menus = [...document.querySelectorAll("[data-public-category-menu]")];
  if (!menus.length) return;

  const roots = getPublicRootCategories();
  if (!roots.length) return;

  const html = roots.map(root => {
    const children = getRootChildren(root.id);
    const panel = children.length
      ? children.map(category => `<a href="${getCategoryUrl(category.slug)}">${escapeHtml(category.name)}</a>`).join("")
      : `<a href="${getCategoryUrl(root.slug)}">Tất cả ${escapeHtml(root.name)}</a>`;

    return `
      <div class="nav-dropdown" data-public-category-menu="${escapeHtml(root.slug)}">
        <a class="nav-dropdown-toggle" href="${getCategoryUrl(root.slug)}">${escapeHtml(root.name)} <span aria-hidden="true">&#9662;</span></a>
        <div class="nav-dropdown-panel">${panel}</div>
      </div>
    `;
  }).join("");

  menus[0].outerHTML = html;
  menus.slice(1).forEach(menu => menu.remove());
}

async function loadPublicCategories() {
  if (!document.querySelector("[data-public-category-menu]")) return;

  try {
    const response = await fetch(CATEGORIES_API);
    if (!response.ok) throw new Error("Không thể tải danh mục");

    publicCategories = await response.json();
    renderPublicNavCategories();
    renderMenuCategoryOptions();
    if (foods.length) renderFoods();
  } catch (error) {
    console.error("Lỗi tải danh mục:", error);
  }
}

function renderMenuCategoryOptions() {
  const heading = document.getElementById("menuCategoryHeading");
  const description = document.getElementById("menuCategoryDescription");

  if (!heading && !description) return;

  const categoryValue = getMenuCategoryValue();
  const category = getPublicCategoryBySlug(categoryValue);
  const foodMatch = foods.find(food => food.subcategory === categoryValue || food.category === categoryValue);
  const label = category?.name
    || (foodMatch?.subcategory === categoryValue ? foodMatch.categoryName : foodMatch?.parentCategoryName || foodMatch?.categoryName)
    || (categoryValue === "all" ? "Tất cả món" : categoryValue.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" "));

  if (heading) heading.textContent = label;

  if (description) {
    description.textContent = categoryValue === "all"
      ? "Hiển thị tất cả món theo thứ tự danh mục."
      : `Đang hiển thị các món thuộc ${label}.`;
  }
}

function setSelectOptions(select, options, placeholder) {
  if (!select) return;

  const optionList = [
    { value: "", label: placeholder },
    ...options.map(option => typeof option === "string"
      ? { value: option, label: option }
      : { value: String(option.value || ""), label: option.label || option.value || "" })
  ];

  select.innerHTML = optionList.map((option, index) => {
    const value = String(option.value || "");
    const label = String(option.label || value || "");
    return `<option value="${escapeHtml(value)}" ${index === 0 ? "selected" : ""}>${escapeHtml(label)}</option>`;
  }).join("");
}

function parseAddressString(address) {
  const parts = String(address || "").split("|").map(part => part.trim());
  const city = parts[0] || "";
  const district = parts.length >= 4 ? parts[1] || "" : "";
  const ward = parts.length >= 4 ? parts[2] || "" : parts[1] || "";
  const detail = parts.length >= 4 ? parts[3] || "" : parts[2] || "";

  return {
    city,
    district,
    ward,
    detail
  };
}

function buildAddressString(city, district, ward, detail) {
  return [city, ward, detail]
    .map(value => String(value || "").trim())
    .filter(Boolean)
    .join("|");
}

function normalizeVietnamAddressData(provinces) {
  return provinces.reduce((lookup, province) => {
    const provinceName = String(province.name || "").trim();
    if (!provinceName) return lookup;

    if (Array.isArray(province.wards)) {
      lookup[provinceName] = {
        "Không dùng cấp huyện": province.wards
          .map(ward => String(ward.name || "").trim())
          .filter(Boolean)
      };
      return lookup;
    }

    lookup[provinceName] = (province.districts || []).reduce((districtLookup, district) => {
      const districtName = String(district.name || "").trim();
      if (!districtName) return districtLookup;

      districtLookup[districtName] = (district.wards || [])
        .map(ward => String(ward.name || "").trim())
        .filter(Boolean);
      return districtLookup;
    }, {});

    return lookup;
  }, {});
}

async function loadVietnamAddressLookup() {
  if (Object.keys(ADDRESS_LOOKUP).length > 0) return ADDRESS_LOOKUP;
  if (addressLookupPromise) return addressLookupPromise;

  addressLookupPromise = (async () => {
    try {
      const cached = JSON.parse(sessionStorage.getItem(ADDRESS_CACHE_KEY) || "null");
      if (cached?.savedAt && cached?.lookup && Date.now() - cached.savedAt < 24 * 60 * 60 * 1000) {
        ADDRESS_LOOKUP = cached.lookup;
        return ADDRESS_LOOKUP;
      }
    } catch (error) {
      sessionStorage.removeItem(ADDRESS_CACHE_KEY);
    }

    try {
      const response = await fetch(VIETNAM_ADDRESS_API);
      if (!response.ok) throw new Error("Không tải được danh sách tỉnh thành.");

      const provinces = await response.json();
      const lookup = normalizeVietnamAddressData(Array.isArray(provinces) ? provinces : []);
      if (Object.keys(lookup).length === 0) throw new Error("Danh sách tỉnh thành không hợp lệ.");

      ADDRESS_LOOKUP = lookup;
      sessionStorage.setItem(ADDRESS_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), lookup }));
    } catch (error) {
      console.warn(error);
      ADDRESS_LOOKUP = LEGACY_ADDRESS_LOOKUP;
      showSiteToast("Tạm thời dung danh sách địa chỉ dự phòng.", "info");
    }

    return ADDRESS_LOOKUP;
  })();

  return addressLookupPromise;
}

function refreshAddressSelectorOptions(config, selectedAddress = "") {
  const citySelect = document.getElementById(config.cityId);
  const districtSelect = config.districtId ? document.getElementById(config.districtId) : null;
  const wardSelect = document.getElementById(config.wardId);
  const detailInput = document.getElementById(config.detailId);

  if (!citySelect || !wardSelect) return;

  const parsedAddress = parseAddressString(selectedAddress);
  const cityNames = Object.keys(ADDRESS_LOOKUP);
  setSelectOptions(citySelect, cityNames, "Chọn thanh pho");

  if (cityNames.includes(parsedAddress.city)) {
    citySelect.value = parsedAddress.city;
  }

  const districtNames = Object.keys(ADDRESS_LOOKUP[citySelect.value] || {});
  const selectedDistrict = districtNames.includes(parsedAddress.district) ? parsedAddress.district : districtNames[0] || "";

  if (districtSelect) {
    setSelectOptions(districtSelect, districtNames, "Chọn quan huyen");
    districtSelect.value = selectedDistrict;
  }

  const wardNames = ADDRESS_LOOKUP[citySelect.value]?.[selectedDistrict] || [];
  setSelectOptions(wardSelect, wardNames, "Chọn phuong xa");
  if (wardNames.includes(parsedAddress.ward)) {
    wardSelect.value = parsedAddress.ward;
  }

  if (detailInput && selectedAddress) {
    detailInput.value = parsedAddress.detail || "";
  }
}

async function legacyInitAddressSelectors() {
  await loadVietnamAddressLookup();

  const addressConfigs = [
    {
      cityId: "customerCity",
      wardId: "customerWard",
      detailId: "customerAddress",
      datalistId: "customerAddressSuggestions"
    },
    {
      cityId: "addressBookCity",
      wardId: "addressBookWard",
      detailId: "addressBookDetail",
      datalistId: "addressBookSuggestions"
    }
  ];

  const cityNames = Object.keys(ADDRESS_LOOKUP);

  addressConfigs.forEach(config => {
    const citySelect = document.getElementById(config.cityId);
    const districtSelect = document.getElementById(config.districtId);
    const wardSelect = document.getElementById(config.wardId);
    const detailInput = document.getElementById(config.detailId);
    const datalist = document.getElementById(config.datalistId);

    if (!citySelect) return;
    if (citySelect.dataset.addressSelectorInitialized === "true") return;

    citySelect.dataset.addressSelectorInitialized = "true";

    setSelectOptions(citySelect, cityNames, "Chọn thành phố");
    setSelectOptions(districtSelect, [], "Chọn quận huyện");
    setSelectOptions(wardSelect, [], "Chọn phường xã");

    if (datalist) {
      datalist.innerHTML = DEFAULT_ADDRESS_SUGGESTIONS.map(suggestion => `<option value="${escapeHtml(suggestion)}"></option>`).join("");
    }

    citySelect.addEventListener("change", () => {
      const districts = Object.keys(ADDRESS_LOOKUP[citySelect.value] || {});
      setSelectOptions(districtSelect, districts, "Chọn quận huyện");
      setSelectOptions(wardSelect, [], "Chọn phường xã");
      if (detailInput) detailInput.value = "";
    });

    districtSelect?.addEventListener("change", () => {
      const wards = ADDRESS_LOOKUP[citySelect.value]?.[districtSelect.value] || [];
      setSelectOptions(wardSelect, wards, "Chọn phường xã");
    });
  });
}

function legacyFillAddressForm(addressConfig, userAddress) {
  const citySelect = document.getElementById(addressConfig.cityId);
  const districtSelect = document.getElementById(addressConfig.districtId);
  const wardSelect = document.getElementById(addressConfig.wardId);
  const detailInput = document.getElementById(addressConfig.detailId);

  if (!citySelect || !districtSelect || !wardSelect) return;

  const parsedAddress = parseAddressString(userAddress);
  const cityList = Object.keys(ADDRESS_LOOKUP);
  const hasCityOption = cityList.includes(parsedAddress.city);

  if (hasCityOption) {
    citySelect.value = parsedAddress.city;
    const districtList = Object.keys(ADDRESS_LOOKUP[parsedAddress.city] || {});
    setSelectOptions(districtSelect, districtList, "Chọn quận huyện");
    districtSelect.value = parsedAddress.district || "";

    const wardList = ADDRESS_LOOKUP[parsedAddress.city]?.[parsedAddress.district] || [];
    setSelectOptions(wardSelect, wardList, "Chọn phường xã");
    wardSelect.value = parsedAddress.ward || "";
  }

  if (detailInput) {
    detailInput.value = parsedAddress.detail || "";
  }
}

async function initAddressSelectors() {
  await loadVietnamAddressLookup();

  const addressConfigs = [
    {
      cityId: "customerCity",
      wardId: "customerWard",
      detailId: "customerAddress",
      datalistId: "customerAddressSuggestions"
    },
    {
      cityId: "addressBookCity",
      wardId: "addressBookWard",
      detailId: "addressBookDetail",
      datalistId: "addressBookSuggestions"
    }
  ];

  addressConfigs.forEach(config => {
    const citySelect = document.getElementById(config.cityId);
    const districtSelect = config.districtId ? document.getElementById(config.districtId) : null;
    const wardSelect = document.getElementById(config.wardId);
    const detailInput = document.getElementById(config.detailId);
    const datalist = document.getElementById(config.datalistId);

    if (!citySelect || !wardSelect) return;
    if (citySelect.dataset.addressSelectorInitialized === "true") return;

    citySelect.dataset.addressSelectorInitialized = "true";
    refreshAddressSelectorOptions(config);

    if (datalist) {
      datalist.innerHTML = DEFAULT_ADDRESS_SUGGESTIONS.map(suggestion => `<option value="${escapeHtml(suggestion)}"></option>`).join("");
    }

    citySelect.addEventListener("change", () => {
      const districts = Object.keys(ADDRESS_LOOKUP[citySelect.value] || {});
      const selectedDistrict = districts[0] || "";
      if (districtSelect) {
        setSelectOptions(districtSelect, districts, "Chọn quan huyen");
        districtSelect.value = selectedDistrict;
      }
      setSelectOptions(wardSelect, ADDRESS_LOOKUP[citySelect.value]?.[selectedDistrict] || [], "Chọn phuong xa");
      if (detailInput) detailInput.value = "";
    });

    districtSelect?.addEventListener("change", () => {
      setSelectOptions(wardSelect, ADDRESS_LOOKUP[citySelect.value]?.[districtSelect.value] || [], "Chọn phuong xa");
    });
  });
}

function fillAddressForm(addressConfig, userAddress) {
  refreshAddressSelectorOptions(addressConfig, userAddress);
}

function setCheckoutAddressRequiredState(hasAddress, message = "") {
  const warning = document.getElementById("checkoutProfileWarning");
  const submitButton = document.querySelector("#orderForm button[type='submit']");

  if (warning) {
    warning.hidden = hasAddress;
    warning.innerHTML = hasAddress
      ? ""
      : `${escapeHtml(message || "Bạn cần cập nhật địa chỉ giao hàng trước khi đặt hàng.")} <a href="profile.html">Cập nhật ngay</a>`;
  }

  if (submitButton) {
    submitButton.disabled = !hasAddress;
  }
}

async function loadCheckoutProfile() {
  if (!isLoggedIn()) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`
      }
    });
    const data = await response.json();

    if (!response.ok || !data.user) return null;

    sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));

    const nameInput = document.getElementById("customerName");
    const phoneInput = document.getElementById("customerPhone");

    if (nameInput && !nameInput.value) nameInput.value = data.user.fullname || "";
    if (phoneInput && !phoneInput.value) phoneInput.value = data.user.phone || "";

    if (data.user.address) {
      fillAddressForm({
        cityId: "customerCity",
        wardId: "customerWard",
        detailId: "customerAddress"
      }, data.user.address);
    }

    return data.user;
  } catch (error) {
    console.error("Không tải được hồ sơ đặt hàng:", error);
    return null;
  }
}

async function loadCheckoutSavedAddresses() {
  const select = document.getElementById("savedAddressSelect");
  const wrap = document.getElementById("savedAddressSelectWrap");

  if (!select || !wrap || !isLoggedIn()) return [];

  try {
    const response = await fetch(`${API_BASE_URL}/auth/addresses`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`
      }
    });
    const data = await response.json();

    if (!response.ok || !Array.isArray(data.addresses) || data.addresses.length === 0) return [];

    wrap.hidden = false;
    select.innerHTML = `<option value="">Nhập địa chỉ mới</option>` + data.addresses.map(address => (
      `<option value="${address.id}" data-address="${escapeHtml(address.address)}" data-name="${escapeHtml(address.receiverName || "")}" data-phone="${escapeHtml(address.phone || "")}">
        ${escapeHtml(address.label || "Địa chỉ giao hàng")}${address.isDefault ? " - Mặc định" : ""}
      </option>`
    )).join("");

    const defaultAddress = data.addresses.find(address => address.isDefault) || data.addresses[0];
    if (defaultAddress) {
      select.value = String(defaultAddress.id);
      applySavedCheckoutAddress(defaultAddress);
    }

    select.addEventListener("change", () => {
      const option = select.selectedOptions[0];
      if (!option?.value) return;
      applySavedCheckoutAddress({
        address: option.dataset.address || "",
        receiverName: option.dataset.name || "",
        phone: option.dataset.phone || ""
      });
    });

    return data.addresses;
  } catch (error) {
    console.error("Không tải được địa chỉ đã lưu:", error);
    return [];
  }
}

function applySavedCheckoutAddress(address) {
  if (address.receiverName && document.getElementById("customerName")) {
    document.getElementById("customerName").value = address.receiverName;
  }

  if (address.phone && document.getElementById("customerPhone")) {
    document.getElementById("customerPhone").value = address.phone;
  }

  fillAddressForm({
    cityId: "customerCity",
    wardId: "customerWard",
    detailId: "customerAddress"
  }, address.address);
}

function updateCartCount() {
  const cartCount = document.getElementById("cart-count");

  if (!cartCount) return;

  cartCount.textContent = cart.reduce((sum, item) => sum + Number(item.quantity), 0);
}

async function loadFoods() {
  const foodList = document.getElementById("food-list");
  const bestSellerBox = document.getElementById("homeBestSellers");
  const homeSectionBox = document.getElementById("homeFoodSections");
  const foodDetailPage = document.getElementById("foodDetailPage");

  if (!foodList && !bestSellerBox && !homeSectionBox && !foodDetailPage) return;

  if (foodList) foodList.innerHTML = "<p>Đang tải món ăn...</p>";

  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`Foods API returned ${response.status}`);

    foods = await response.json();
    foods = foods.map(food => ({
      id: food.id,
      name: food.name,
      category: getCategoryKey(food),
      subcategory: getSubCategoryKey(food),
      categoryName: food.category_name,
      parentCategoryName: food.parent_category_name,
      price: food.price,
      stockQuantity: Number(food.stock_quantity ?? food.quantity ?? 0),
      soldCount: Number(food.sold_count || 0),
      rating: Number(food.rating || 0),
      reviewCount: Number(food.review_count || 0),
      desc: food.description,
      image: food.image
    }));

    renderMenuCategoryOptions();
    renderFoods();
    renderHomeFoodSections();
    renderFoodDetailPage();
    loadFoodReviews();
  } catch (error) {
    console.error("Lỗi tải món ăn:", error);
    if (foodList) foodList.innerHTML = "<p>Không thể tải món ăn từ database.</p>";
    if (bestSellerBox) bestSellerBox.innerHTML = "<p>Không thể tải món bán chạy từ database.</p>";
    if (homeSectionBox) homeSectionBox.innerHTML = "<p>Không thể tải thực đơn từ database.</p>";
  }
}
function getFoodDisplayCategory(food) {
  return food.parentCategoryName || food.categoryName || "Món ăn";
}

function getFoodComments(food) {
  return foodReviews.filter(review => String(review.foodId) === String(food.id));
}

async function loadFoodReviews() {
  const homeReviewBox = document.getElementById("homeReviewList");
  const homeReviewFilters = document.getElementById("homeReviewFilters");
  const foodDetailPage = document.getElementById("foodDetailPage");
  const orderHistoryBox = document.getElementById("track-result");

  if (!homeReviewBox && !homeReviewFilters && !foodDetailPage && !orderHistoryBox) return;

  try {
    const response = await fetch(`${FOOD_REVIEWS_API}?limit=40`);
    if (!response.ok) throw new Error(`Reviews API returned ${response.status}`);

    foodReviews = await response.json();
  } catch (error) {
    console.error("Lỗi tải đánh giá món ăn:", error);
    foodReviews = [];
  }

  renderHomeReviews();
  renderFoodDetailPage();
}

function getReviewFood(review) {
  return foods.find(food => String(food.id) === String(review.foodId)) || null;
}

function getReviewCustomerName(review) {
  return review.customerName || "Khách hàng FoodHub";
}

function getReviewInitials(name) {
  const words = String(name || "KH").trim().split(/\s+/).filter(Boolean);
  const initials = words.length > 1 ? `${words[0][0]}${words[words.length - 1][0]}` : String(words[0] || "KH").slice(0, 2);
  return initials.toUpperCase();
}

function renderReviewAvatar(review, className) {
  const customerName = getReviewCustomerName(review);
  const initials = escapeHtml(getReviewInitials(customerName));
  const avatar = String(review?.avatar || "").trim();

  if (!avatar) {
    return `<span class="${className}">${initials}</span>`;
  }

  return `
    <span class="${className}">
      <img src="${escapeHtml(avatar)}" alt="${escapeHtml(customerName)}" onerror="this.remove(); this.parentElement.textContent='${initials}';">
    </span>
  `;
}

function formatReviewDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("vi-VN");
}

function renderStarText(rating = 5) {
  const value = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return "★".repeat(value) + "☆".repeat(5 - value);
}

function renderRatingLabel(rating, reviewCount = 0) {
  if (!Number(reviewCount)) return "Chưa có đánh giá";
  return `${renderStarText(rating)} ${Number(rating || 0).toFixed(1)}`;
}

function getFoodDetailUrl(foodId, options = {}) {
  const params = new URLSearchParams({ id: String(foodId) });

  if (options.from) params.set("from", options.from);
  if (options.category) params.set("category", options.category);

  return `food-detail.html?${params.toString()}`;
}

function renderCompactFoodCard(food, options = {}) {
  const stock = Number(food.stockQuantity || 0);
  const sold = Number(food.soldCount || 0);
  const cardClass = options.compact ? "home-food-card compact" : "home-food-card";

  return `
    <article class="${cardClass}" data-open-food-detail="${food.id}">
      <a class="home-food-detail-trigger" href="${getFoodDetailUrl(food.id, { from: "home" })}" aria-label="Xem chi tiết ${escapeHtml(food.name)}"></a>
      <img src="${escapeHtml(food.image || "")}" alt="${escapeHtml(food.name)}">
      <div class="home-food-card-body">
        <span class="home-food-category">${escapeHtml(getFoodDisplayCategory(food))}</span>
        <h3>${escapeHtml(food.name)}</h3>
        <p>${escapeHtml(food.desc || "")}</p>
        <div class="home-food-meta">
          <span>${renderRatingLabel(food.rating, food.reviewCount)}</span>
          <span>Đã bán ${sold}</span>
        </div>
        <div class="home-food-bottom">
          <strong>${formatMoney(food.price)}</strong>
          <button type="button" class="home-add-btn" onclick="event.stopPropagation(); addToCart(${food.id})" ${stock <= 0 ? "disabled" : ""}>+</button>
        </div>
      </div>
    </article>
  `;
}

function renderBestSellerCard(food) {
  return `
    <article class="best-seller-card" data-open-food-detail="${food.id}">
      <a class="home-food-detail-trigger" href="${getFoodDetailUrl(food.id, { from: "home" })}" aria-label="Xem chi tiết ${escapeHtml(food.name)}"></a>
      <img src="${escapeHtml(food.image || "")}" alt="${escapeHtml(food.name)}">
      <div class="best-seller-overlay">
        <span>Bán chạy</span>
        <h3>${escapeHtml(food.name)}</h3>
        <p>${renderRatingLabel(food.rating, food.reviewCount)} • Đã bán ${Number(food.soldCount || 0)}</p>
      </div>
    </article>
  `;
}

function renderHomeFoodSections() {
  const bestSellerBox = document.getElementById("homeBestSellers");
  const sectionBox = document.getElementById("homeFoodSections");

  if (!bestSellerBox && !sectionBox) return;

  if (!foods.length) {
    if (bestSellerBox) bestSellerBox.innerHTML = "<p>Chưa có món ăn.</p>";
    if (sectionBox) sectionBox.innerHTML = "<p>Chưa có món ăn.</p>";
    return;
  }

  if (bestSellerBox) {
    const bestSellers = [...foods]
      .filter(food => Number(food.soldCount || 0) > 0)
      .sort((first, second) => Number(second.soldCount || 0) - Number(first.soldCount || 0) || Number(second.id) - Number(first.id))
      .slice(0, 5);

    if (!bestSellers.length) {
      bestSellerBox.innerHTML = "<p>Chưa có món nào phát sinh lượt bán.</p>";
    } else {
      const sellerCards = bestSellers.map(renderBestSellerCard).join("");
      const duplicatedCards = bestSellers.length > 1 ? sellerCards + sellerCards : sellerCards;
      bestSellerBox.innerHTML = `
        <div class="best-seller-track ${bestSellers.length > 1 ? "is-animated" : ""}">
          ${duplicatedCards}
        </div>
      `;
    }
  }

  if (sectionBox) {
    const categoryMap = new Map();
    foods.forEach(food => {
      const key = food.subcategory || food.category || "khac";
      const title = food.categoryName || getFoodDisplayCategory(food);
      if (!categoryMap.has(key)) categoryMap.set(key, { title, items: [] });
      categoryMap.get(key).items.push(food);
    });

    sectionBox.innerHTML = [...categoryMap.values()].map(group => `
      <section class="home-category-block">
        <div class="home-category-heading">
          <h3>${escapeHtml(group.title)}</h3>
          <a href="menu.html?category=${encodeURIComponent(group.items[0]?.subcategory || group.items[0]?.category || "all")}">Xem tất cả</a>
        </div>
        <div class="home-food-grid">
          ${getFeaturedCategoryItems(group.items, 4).map(food => renderCompactFoodCard(food)).join("")}
        </div>
      </section>
    `).join("");
  }
}

const REVIEW_PAGE_SIZE = 3;
const reviewListState = {
  home: { rating: "all", food: "all", sort: "newest", page: 1 },
  detailDialog: { rating: "all", food: "current", sort: "newest", page: 1 },
  detailPage: { rating: "all", food: "current", sort: "newest", page: 1 }
};

function getReviewFoodName(review) {
  const food = getReviewFood(review);
  return food?.name || review.foodName || "M\u00f3n \u0103n";
}

function getReviewFoodImage(review) {
  const food = getReviewFood(review);
  return food?.image || review.foodImage || "";
}

function renderReviewListCard(review, options = {}) {
  const customerName = getReviewCustomerName(review);
  const foodName = getReviewFoodName(review);
  const image = getReviewFoodImage(review);
  const showFood = options.showFood !== false;

  return `
    <article class="review-list-card">
      <div class="review-list-avatar">${renderReviewAvatar(review, "food-review-avatar")}</div>
      <div class="review-list-main">
        <div class="review-list-head">
          <div>
            <strong>${escapeHtml(customerName)}</strong>
            <small>${escapeHtml(formatReviewDate(review.createdAt))}</small>
          </div>
          <span class="review-list-stars">${renderStarText(review.rating)}</span>
        </div>
        <p>${escapeHtml(review.comment || "Kh\u00e1ch h\u00e0ng \u0111\u00e3 \u0111\u00e1nh gi\u00e1 m\u00f3n \u0103n n\u00e0y.")}</p>
        ${showFood ? `
          <a class="review-list-food" href="${getFoodDetailUrl(review.foodId, { from: "home" })}">
            <img src="${escapeHtml(image)}" alt="${escapeHtml(foodName)}">
            <span>${escapeHtml(foodName)}</span>
          </a>
        ` : ""}
      </div>
    </article>
  `;
}

function getReviewFoodOptions(selectedFood, options = {}) {
  const currentFoodId = options.currentFoodId ? String(options.currentFoodId) : "";
  const ids = new Set(foodReviews.map(review => String(review.foodId)));
  const currentOption = options.includeCurrent && currentFoodId
    ? `<option value="current" ${selectedFood === "current" ? "selected" : ""}>M&oacute;n hi&#7879;n t&#7841;i</option>`
    : "";

  return `
    ${currentOption}
    <option value="all" ${selectedFood === "all" ? "selected" : ""}>T&#7845;t c&#7843; m&oacute;n</option>
    ${foods
      .filter(food => ids.has(String(food.id)))
      .map(food => `<option value="${food.id}" ${String(selectedFood) === String(food.id) ? "selected" : ""}>${escapeHtml(food.name)}</option>`)
      .join("")}
  `;
}

function filterAndSortReviews(reviews, state, options = {}) {
  const currentFoodId = options.currentFoodId ? String(options.currentFoodId) : "";
  const foodFilter = state.food === "current" ? currentFoodId : state.food;

  return [...reviews]
    .filter(review => state.rating === "all" || String(review.rating) === String(state.rating))
    .filter(review => !foodFilter || foodFilter === "all" || String(review.foodId) === String(foodFilter))
    .sort((first, second) => {
      const firstDate = new Date(first.createdAt || 0).getTime();
      const secondDate = new Date(second.createdAt || 0).getTime();
      return state.sort === "oldest" ? firstDate - secondDate : secondDate - firstDate;
    });
}

function renderReviewPagination(totalPages, currentPage) {
  if (totalPages <= 1) return "";

  return `
    <div class="review-pagination" aria-label="Ph&acirc;n trang b&igrave;nh lu&#7853;n">
      <button type="button" data-review-page="${Math.max(1, currentPage - 1)}" ${currentPage <= 1 ? "disabled" : ""}>&lsaquo;</button>
      ${Array.from({ length: totalPages }, (_, index) => index + 1).map(page => `
        <button type="button" class="${page === currentPage ? "active" : ""}" data-review-page="${page}">${page}</button>
      `).join("")}
      <button type="button" data-review-page="${Math.min(totalPages, currentPage + 1)}" ${currentPage >= totalPages ? "disabled" : ""}>&rsaquo;</button>
    </div>
  `;
}

function renderReviewPanel(scope, controlsElement, listElement, reviews, options = {}) {
  if (!listElement) return;

  const state = reviewListState[scope] || reviewListState.home;
  const filteredReviews = filterAndSortReviews(reviews, state, options);
  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / REVIEW_PAGE_SIZE));
  state.page = Math.min(Math.max(1, Number(state.page || 1)), totalPages);
  const startIndex = (state.page - 1) * REVIEW_PAGE_SIZE;
  const pageReviews = filteredReviews.slice(startIndex, startIndex + REVIEW_PAGE_SIZE);

  if (controlsElement) {
    controlsElement.innerHTML = `
      <label><span>S&#7889; sao</span><select data-review-filter="rating">
        <option value="all" ${state.rating === "all" ? "selected" : ""}>T&#7845;t c&#7843;</option>
        ${[5, 4, 3, 2, 1].map(star => `<option value="${star}" ${String(state.rating) === String(star) ? "selected" : ""}>${star} sao</option>`).join("")}
      </select></label>
      <label><span>M&oacute;n &#259;n</span><select data-review-filter="food">${getReviewFoodOptions(state.food, options)}</select></label>
      <label><span>S&#7855;p x&#7871;p</span><select data-review-filter="sort">
        <option value="newest" ${state.sort === "newest" ? "selected" : ""}>M&#7899;i nh&#7845;t</option>
        <option value="oldest" ${state.sort === "oldest" ? "selected" : ""}>C&#361; nh&#7845;t</option>
      </select></label>
    `;

    controlsElement.querySelectorAll("[data-review-filter]").forEach(control => {
      control.addEventListener("change", () => {
        state[control.dataset.reviewFilter] = control.value;
        state.page = 1;
        renderReviewPanel(scope, controlsElement, listElement, reviews, options);
      });
    });
  }

  listElement.innerHTML = pageReviews.length
    ? `${pageReviews.map(review => renderReviewListCard(review, options)).join("")}${renderReviewPagination(totalPages, state.page)}`
    : `<p class="home-review-empty">Ch&#432;a c&oacute; b&igrave;nh lu&#7853;n ph&ugrave; h&#7907;p.</p>`;

  listElement.querySelectorAll("[data-review-page]").forEach(button => {
    button.addEventListener("click", () => {
      state.page = Number(button.dataset.reviewPage || 1);
      renderReviewPanel(scope, controlsElement, listElement, reviews, options);
    });
  });
}

function renderHomeReviews() {
  const reviewBox = document.getElementById("homeReviewList");
  const filterBox = document.getElementById("homeReviewFilters");
  if (!reviewBox && !filterBox) return;
  renderReviewPanel("home", filterBox, reviewBox, foodReviews, { showFood: true });
}
function hasReviewedOrderItem(orderId, foodId) {
  return foodReviews.some(review => String(review.orderId) === String(orderId) && String(review.foodId) === String(foodId));
}

function renderOrderReviewControl(order, item) {
  if (order.status !== "done") return "";

  if (hasReviewedOrderItem(order.id, item.food_id)) {
    return `<span class="order-review-done">Đã đánh giá</span>`;
  }

  const panelId = `review-panel-${order.id}-${item.food_id}`;

  return `
    <div class="order-review">
      <button type="button" class="order-review-toggle" onclick="toggleOrderReviewForm('${panelId}')">Đánh giá</button>
      <form id="${panelId}" class="order-review-form" onsubmit="submitFoodReview(event, ${order.id}, ${item.food_id})" hidden>
        <fieldset class="order-review-stars" aria-label="Chọn số sao">
          <legend>Số sao <small>bắt buộc</small></legend>
          <div class="order-review-star-options">
            ${[5, 4, 3, 2, 1].map(star => `
              <input type="radio" id="${panelId}-star-${star}" name="rating" value="${star}" required>
              <label for="${panelId}-star-${star}" title="${star} sao">★</label>
            `).join("")}
          </div>
        </fieldset>
        <label>
          <span>Nhận xét</span>
          <textarea name="comment" rows="3" maxlength="1000" placeholder="Bạn có thể để trống nếu chỉ muốn chấm sao."></textarea>
        </label>
        <div class="order-review-actions">
          <button type="submit" class="btn">Gửi đánh giá</button>
          <button type="button" class="btn muted-btn" onclick="toggleOrderReviewForm('${panelId}', true)">Hủy</button>
        </div>
      </form>
    </div>
  `;
}

function toggleOrderReviewForm(panelId, forceClose = false) {
  const panel = document.getElementById(panelId);
  if (!panel) return;
  panel.hidden = forceClose ? true : !panel.hidden;
}

async function submitFoodReview(event, orderId, foodId) {
  event.preventDefault();

  const form = event.target;
  const submitButton = form.querySelector("button[type='submit']");
  const rating = Number(form.rating?.value || 0);
  const comment = form.comment.value.trim();

  if (!rating) {
    showSiteToast("Vui lòng chọn số sao trước khi gửi đánh giá.", "error");
    return;
  }

  try {
    if (submitButton) submitButton.disabled = true;

    const response = await fetch(FOOD_REVIEWS_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({ orderId, foodId, rating, comment })
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Không thể gửi đánh giá.");
    }

    showSiteToast(data.message || "Đánh giá món ăn thành công.");
    await loadFoodReviews();
    await loadOrderHistory();
  } catch (error) {
    showSiteToast(error.message || "Không thể gửi đánh giá.", "error");
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
}

function renderRatingBreakdown(reviews = []) {
  const total = reviews.length;
  const counts = reviews.reduce((summary, review) => {
    const value = Math.max(1, Math.min(5, Math.round(Number(review.rating) || 0)));
    summary[value] = (summary[value] || 0) + 1;
    return summary;
  }, {});

  return [5, 4, 3, 2, 1].map(star => {
    const count = counts[star] || 0;
    const width = total ? Math.round((count / total) * 100) : 0;
    return `
      <div class="food-rating-row">
        <span>${star}</span>
        <div><i style="width:${width}%"></i></div>
        <small>${count}</small>
      </div>
    `;
  }).join("");
}

function getFeaturedCategoryItems(items, limit = 4) {
  const hasSoldItems = items.some(food => Number(food.soldCount || 0) > 0);

  if (!hasSoldItems) {
    return items.slice(0, limit);
  }

  return [...items]
    .sort((first, second) => Number(second.soldCount || 0) - Number(first.soldCount || 0))
    .slice(0, limit);
}

function getFoodDetailBreadcrumb(food) {
  const params = new URLSearchParams(window.location.search);
  const from = params.get("from");
  const categoryValue = params.get("category") || food.subcategory || food.category || "all";
  const categoryLabel = food.categoryName || getFoodDisplayCategory(food);
  const rootLabel = food.parentCategoryName || getFoodDisplayCategory(food);

  if (from === "home") {
    return [
      { label: "Trang chủ", href: "index.html" },
      { label: "Chi tiết món ăn" }
    ];
  }

  if (from === "cart") {
    return [
      { label: "Giỏ hàng", href: "cart.html" },
      { label: "Chi tiết món ăn" }
    ];
  }

  return [
    { label: rootLabel, href: `menu.html?category=${encodeURIComponent(food.category || "all")}` },
    { label: categoryLabel, href: `menu.html?category=${encodeURIComponent(categoryValue)}` },
    { label: "Chi tiết món ăn" }
  ];
}

function renderFoodDetailBreadcrumb(food) {
  return `
    <nav class="food-detail-breadcrumb" aria-label="Duong dan trang">
      ${getFoodDetailBreadcrumb(food).map((item, index, items) => `
        ${item.href ? `<a href="${item.href}">${escapeHtml(item.label)}</a>` : `<span>${escapeHtml(item.label)}</span>`}
        ${index < items.length - 1 ? `<b aria-hidden="true">&gt;</b>` : ""}
      `).join("")}
    </nav>
  `;
}

function showFoodDetail(foodId) {
  const food = foods.find(item => String(item.id) === String(foodId));
  if (!food) return;

  const oldDialog = document.getElementById("foodDetailDialog");
  if (oldDialog) oldDialog.remove();

  const sold = Number(food.soldCount || 0);
  const reviewCount = Number(food.reviewCount || 0);
  const stock = Number(food.stockQuantity || 0);
  const rating = Number(food.rating || 4.8);
  const comments = getFoodComments(food);
  const category = getFoodDisplayCategory(food);
  const image = food.image || "";
  const dialog = document.createElement("div");
  dialog.id = "foodDetailDialog";
  dialog.className = "food-detail-dialog";
  dialog.innerHTML = `
    <div class="food-detail-card" role="dialog" aria-modal="true" aria-labelledby="foodDetailTitle">
      <button type="button" class="food-detail-close" aria-label="Đóng">&times;</button>
      <div class="food-detail-main">
        <div class="food-detail-gallery">
          <img class="food-detail-image" src="${escapeHtml(image)}" alt="${escapeHtml(food.name)}">
        </div>
        <div class="food-detail-info">
          <span class="food-detail-category">${escapeHtml(category)}</span>
          <h2 id="foodDetailTitle">${escapeHtml(food.name)}</h2>
          <div class="food-detail-stats">
            <span class="food-detail-stars">${renderStarText(rating)}</span>
            <span>${rating.toFixed(1)} sao</span>
            <span>${sold} lượt mua</span>
            <span>${reviewCount} đánh giá</span>
          </div>
          <strong class="food-detail-price">${formatMoney(food.price)}</strong>
          <p>${escapeHtml(food.desc || "FoodHub đang cập nhật mô tả chi tiết cho món ăn này.")}</p>
          <div class="food-detail-options">
            <h3>Tùy chọn thêm</h3>
            <label><input type="checkbox" disabled> Thêm phô mai <span>+15.000đ</span></label>
            <label><input type="checkbox" disabled> Thêm topping <span>+25.000đ</span></label>
            <label><input type="checkbox" disabled> Không hành tây <span>Miễn phí</span></label>
          </div>
          <div class="food-detail-actions">
            <div class="food-detail-qty">
              <button type="button" data-food-qty-step="-1" ${stock <= 0 ? "disabled" : ""}>-</button>
              <span data-food-qty-display="${food.id}">1</span>
              <input type="hidden" value="1" data-food-qty="${food.id}">
              <button type="button" data-food-qty-step="1" ${stock <= 0 ? "disabled" : ""}>+</button>
            </div>
            <button type="button" class="btn food-detail-add" onclick="addToCart(${food.id})" ${stock <= 0 ? "disabled" : ""}>${stock > 0 ? "Thêm vào giỏ hàng" : "Hết hàng"}</button>
          </div>
        </div>
      </div>
      <section class="food-detail-reviews">
        <h3>Đánh giá & Nhận xét</h3>
        <div class="food-review-summary">
          <div class="food-review-score">
            <strong>${rating.toFixed(1)}</strong>
            <span>${renderStarText(rating)}</span>
            <small>Dựa trên ${reviewCount} đánh giá</small>
          </div>
          <div class="food-rating-bars">${renderRatingBreakdown(comments)}</div>
        </div>
        <div id="foodDetailDialogReviewControls" class="review-filter-bar"></div>
        <div id="foodDetailDialogReviewList" class="review-list"></div>
      </section>
    </div>
  `;

  document.body.appendChild(dialog);
  document.body.classList.add("food-detail-open");
  renderReviewPanel("detailDialog", dialog.querySelector("#foodDetailDialogReviewControls"), dialog.querySelector("#foodDetailDialogReviewList"), foodReviews, {
    currentFoodId: food.id,
    includeCurrent: true,
    showFood: true
  });
  dialog.querySelector(".food-detail-close")?.addEventListener("click", closeFoodDetail);
  dialog.querySelectorAll("[data-food-qty-step]").forEach(button => {
    button.addEventListener("click", () => {
      const input = dialog.querySelector(`[data-food-qty="${food.id}"]`);
      if (!input) return;
      const step = Number(button.dataset.foodQtyStep || 0);
      const nextValue = Math.max(1, Math.min(Math.max(stock, 1), Number(input.value || 1) + step));
      input.value = String(nextValue);
      const display = dialog.querySelector(`[data-food-qty-display="${food.id}"]`);
      if (display) display.textContent = String(nextValue);
    });
  });
  dialog.addEventListener("click", event => {
    if (event.target === dialog) closeFoodDetail();
  });
}
function closeFoodDetail() {
  document.getElementById("foodDetailDialog")?.remove();
  document.body.classList.remove("food-detail-open");
}

function renderFoodDetailPage() {
  const page = document.getElementById("foodDetailPage");
  if (!page) return;

  const foodId = new URLSearchParams(window.location.search).get("id");
  const food = foods.find(item => String(item.id) === String(foodId));

  if (!food) {
    page.innerHTML = `
      <section class="food-detail-page-empty">
        <h1>Không tìm thấy món ăn</h1>
        <p>Món ăn có thể đã bị ẩn hoặc đường dẫn không còn hợp lệ.</p>
        <a class="btn" href="menu.html">Quay lại thực đơn</a>
      </section>
    `;
    return;
  }

  const sold = Number(food.soldCount || 0);
  const reviewCount = Number(food.reviewCount || 0);
  const stock = Number(food.stockQuantity || 0);
  const rating = Number(food.rating || 4.8);
  const comments = getFoodComments(food);
  const category = getFoodDisplayCategory(food);
  const image = food.image || "";

  document.title = `${food.name} - FoodHub`;
  page.innerHTML = `
    <section class="food-detail-page-shell">
      ${renderFoodDetailBreadcrumb(food)}
      <div class="food-detail-card food-detail-page-card">
        <div class="food-detail-main">
          <div class="food-detail-gallery">
            <img class="food-detail-image" src="${escapeHtml(image)}" alt="${escapeHtml(food.name)}">
          </div>
          <div class="food-detail-info">
            <span class="food-detail-category">${escapeHtml(category)}</span>
            <h1>${escapeHtml(food.name)}</h1>
            <div class="food-detail-stats">
              <span class="food-detail-stars">${renderStarText(rating)}</span>
              <span>${rating.toFixed(1)} sao</span>
              <span>${sold} lượt mua</span>
              <span>${reviewCount} đánh giá</span>
            </div>
            <strong class="food-detail-price">${formatMoney(food.price)}</strong>
            <p>${escapeHtml(food.desc || "FoodHub đang cập nhật mô tả chi tiết cho món ăn này.")}</p>
            <div class="food-detail-actions">
              <div class="food-detail-qty">
                <button type="button" data-food-qty-step="-1" ${stock <= 0 ? "disabled" : ""}>-</button>
                <span data-food-qty-display="${food.id}">1</span>
                <input type="hidden" value="1" data-food-qty="${food.id}">
                <button type="button" data-food-qty-step="1" ${stock <= 0 ? "disabled" : ""}>+</button>
              </div>
              <button type="button" class="btn food-detail-add" onclick="addToCart(${food.id})" ${stock <= 0 ? "disabled" : ""}>${stock > 0 ? "Thêm vào giỏ hàng" : "Hết hàng"}</button>
            </div>
          </div>
        </div>
        <section class="food-detail-reviews">
          <h3>Đánh giá & Nhận xét</h3>
          <div class="food-review-summary">
            <div class="food-review-score">
              <strong>${rating.toFixed(1)}</strong>
              <span>${renderStarText(rating)}</span>
              <small>Dựa trên ${reviewCount} đánh giá</small>
            </div>
            <div class="food-rating-bars">${renderRatingBreakdown(comments)}</div>
          </div>
          <div id="foodDetailPageReviewControls" class="review-filter-bar"></div>
          <div id="foodDetailPageReviewList" class="review-list"></div>
        </section>
      </div>
    </section>
  `;

  page.querySelectorAll("[data-food-qty-step]").forEach(button => {
    button.addEventListener("click", () => {
      const input = page.querySelector(`[data-food-qty="${food.id}"]`);
      if (!input) return;
      const step = Number(button.dataset.foodQtyStep || 0);
      const nextValue = Math.max(1, Math.min(Math.max(stock, 1), Number(input.value || 1) + step));
      input.value = String(nextValue);
      const display = page.querySelector(`[data-food-qty-display="${food.id}"]`);
      if (display) display.textContent = String(nextValue);
    });
  });
  renderReviewPanel("detailPage", page.querySelector("#foodDetailPageReviewControls"), page.querySelector("#foodDetailPageReviewList"), foodReviews, {
    currentFoodId: food.id,
    includeCurrent: true,
    showFood: true
  });
}

async function loadPublicAnnouncements() {
  const box = document.getElementById("publicAnnouncements");

  if (!box) return;

  try {
    const response = await fetch(`${ANNOUNCEMENTS_API}?limit=20`);
    const announcements = await response.json();

    if (!response.ok || announcements.length === 0) {
      box.innerHTML = `<span class="announcement-empty">Hien chưa có thông báo mới.</span>`;
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
    box.innerHTML = `<span class="announcement-empty">Không thể tải thông báo.</span>`;
    console.error(error);
  }
}

function clearFloatingAdTimers() {
  floatingAdTimers.forEach(timer => clearInterval(timer));
  floatingAdTimers = [];
}

function getFloatingAdvertisementsShell() {
  let shell = document.querySelector("[data-floating-ads]");

  if (shell) return shell;

  shell = document.createElement("div");
  shell.className = "floating-ads";
  shell.dataset.floatingAds = "true";
  shell.hidden = true;
  shell.innerHTML = `
    <a class="floating-ad floating-ad-left" data-floating-ad-slot="left" aria-label="Quảng cáo bên trái" hidden></a>
    <a class="floating-ad floating-ad-right" data-floating-ad-slot="right" aria-label="Quảng cáo bên phải" hidden></a>
  `;
  document.body.appendChild(shell);

  return shell;
}

function renderFloatingAdItem(slot, advertisement) {
  const linkUrl = advertisement.link_url || advertisement.linkUrl || "";

  if (linkUrl) {
    slot.href = linkUrl;
    slot.target = "_blank";
    slot.rel = "noopener noreferrer";
  } else {
    slot.removeAttribute("href");
    slot.removeAttribute("target");
    slot.removeAttribute("rel");
  }

  slot.innerHTML = `<img src="${escapeHtml(advertisement.image)}" alt="${escapeHtml(advertisement.title || "Quảng cáo FoodHub")}">`;
  slot.hidden = false;
}

function setFloatingAdSlot(shell, side, advertisements) {
  const slot = shell.querySelector(`[data-floating-ad-slot="${side}"]`);

  if (!slot) return;

  if (!advertisements.length) {
    slot.hidden = true;
    slot.innerHTML = "";
    return;
  }

  let activeIndex = 0;
  renderFloatingAdItem(slot, advertisements[activeIndex]);

  if (advertisements.length > 1) {
    const timer = setInterval(() => {
      activeIndex = (activeIndex + 1) % advertisements.length;
      slot.classList.add("is-switching");

      setTimeout(() => {
        renderFloatingAdItem(slot, advertisements[activeIndex]);
        slot.classList.remove("is-switching");
      }, 180);
    }, 4500);

    floatingAdTimers.push(timer);
  }
}

async function loadFloatingAdvertisements() {
  clearFloatingAdTimers();

  const shell = getFloatingAdvertisementsShell();
  shell.hidden = true;

  try {
    const response = await fetch(`${ADVERTISEMENTS_API}?limit=20`);
    const advertisements = await response.json();

    if (!response.ok || !Array.isArray(advertisements) || !advertisements.length) {
      return;
    }

    const leftAdvertisements = advertisements.filter(item => item.position === "left" || item.position === "both");
    const rightAdvertisements = advertisements.filter(item => item.position === "right" || item.position === "both");

    if (!leftAdvertisements.length && !rightAdvertisements.length) return;

    shell.hidden = false;
    setFloatingAdSlot(shell, "left", leftAdvertisements);
    setFloatingAdSlot(shell, "right", rightAdvertisements);
  } catch (error) {
    shell.hidden = true;
    console.error("Lỗi tải quảng cáo:", error);
  }
}

function getAnnouncementStatusText(status) {
  const labels = {
    active: "Đang hoạt động",
    hidden: "Đã ẩn",
    expired: "Hết hạn",
    scheduled: "Sắp hiển thị"
  };

  return labels[status] || status || "Không rõ";
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
    list.innerHTML = `<p>Không có thông báo phù hợp.</p>`;
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
          <dt>Ngày đăng</dt>
          <dd>${formatDateTime(item.published_at)}</dd>
        </div>
        <div>
          <dt>Hết hiệu lực</dt>
          <dd>${item.expires_at ? formatDateTime(item.expires_at) : "Không giới hạn"}</dd>
        </div>
      </dl>
    </article>
  `).join("");

  if (!pager) return;

  pager.innerHTML = `
    <span>Đang hiển thị từ ${from} đến ${to} của ${total} thông báo</span>
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

  list.innerHTML = `<p>Đang tải thông báo...</p>`;

  try {
    const response = await fetch(`${ANNOUNCEMENTS_API}/archive`);
    const announcements = await response.json();

    if (!response.ok) {
      throw new Error(announcements.message || "Không thể tải thông báo.");
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

  if (!foodList || !searchInput) return;

  const searchValue = searchInput.value.toLowerCase();
  const categoryValue = getMenuCategoryValue();
  renderMenuCategoryOptions();

  const filteredFoods = foods.filter(food => {
    const matchSearch = food.name.toLowerCase().includes(searchValue);
    const matchCategory = categoryValue === "all" || food.category === categoryValue || food.subcategory === categoryValue;
    return matchSearch && matchCategory;
  }).sort((first, second) =>
    String(first.category || "").localeCompare(String(second.category || ""), "vi") ||
    String(first.subcategory || "").localeCompare(String(second.subcategory || ""), "vi") ||
    String(first.name || "").localeCompare(String(second.name || ""), "vi")
  );

  if (filteredFoods.length === 0) {
    foodList.innerHTML = "<p>Không tìm thấy món ăn phù hợp.</p>";
    return;
  }

  foodList.innerHTML = filteredFoods.map(food => {
    const stock = Number(food.stockQuantity || 0);
    const quantityInput = `<input type="number" min="1" max="${Math.max(stock, 1)}" value="1" data-food-qty="${food.id}" ${stock <= 0 ? "disabled" : ""}>`;
    const buttonLabel = stock > 0 ? "Thêm vào giỏ" : "Hết hàng";
    const stockLabel = stock > 0 ? `Còn ${stock}` : "Hết hàng";

    return `
      <div class="food-card" data-open-food-detail="${food.id}" data-detail-from="menu" data-detail-category="${escapeHtml(food.subcategory || food.category || getMenuCategoryValue())}">
        <a class="food-card-detail-link" href="${getFoodDetailUrl(food.id, { from: "menu", category: food.subcategory || food.category || getMenuCategoryValue() })}" aria-label="Xem chi tiết ${escapeHtml(food.name)}">
          <img src="${escapeHtml(food.image || "")}" alt="${escapeHtml(food.name)}">
          <h3>${escapeHtml(food.name)}</h3>
          <p>${escapeHtml(food.desc || "")}</p>
        </a>
        <div class="food-price-row">
          <span>${formatMoney(food.price)}</span>
          <span class="food-stock-badge ${stock > 0 ? "in-stock" : "out-stock"}">${stockLabel}</span>
        </div>
        <div class="food-qty-row">
          <label for="food-qty-${food.id}">Số lượng</label>
          ${quantityInput}
        </div>
        <button type="button" onclick="addToCart(${food.id})" ${stock <= 0 ? "disabled" : ""}>${buttonLabel}</button>
      </div>
    `;
  }).join("");
}

function addToCart(foodId) {
  if (!isLoggedIn()) {
    requireLogin("Vui lòng đăng nhập để thêm món vào giỏ hàng.", "menu.html");
    return;
  }

  const food = foods.find(item => String(item.id) === String(foodId));

  if (!food) {
    showSiteToast("Không tìm thấy món ăn.", "error");
    return;
  }

  const stock = Number(food.stockQuantity || 0);
  if (stock <= 0) {
    showSiteToast("Món này hiện đã hết hàng.", "error");
    return;
  }

  const requestedInput = document.querySelector(`[data-food-qty="${foodId}"]`);
  const requestedQuantity = Math.max(1, Math.round(Number(requestedInput?.value || 1)));
  const cappedQuantity = Math.min(requestedQuantity, stock);

  if (requestedQuantity > stock) {
    showSiteToast(`Chỉ còn ${stock} phần cho món ${food.name}.`, "error");
    if (requestedInput) {
      requestedInput.value = String(stock);
    }
    return;
  }

  const itemInCart = cart.find(item => item.id === foodId);
  const totalRequestedQuantity = (itemInCart?.quantity || 0) + cappedQuantity;

  if (totalRequestedQuantity > stock) {
    showSiteToast(`Bạn đang đặt quá số lượng còn của ${food.name}.`, "error");
    return;
  }

  if (itemInCart) {
    itemInCart.quantity = totalRequestedQuantity;
  } else {
    cart.push({
      id: food.id,
      name: food.name,
      price: food.price,
      quantity: cappedQuantity
    });
  }

  saveCart();
  renderCart();
  updateCartCount();
  showSiteToast(`Đã thêm ${food.name} x ${cappedQuantity} vào giỏ hàng`);
}

function renderCart() {
  const cartItems = document.getElementById("cart-items");
  const totalPrice = document.getElementById("total-price");
  const checkoutSummary = document.getElementById("checkoutSummary");

  updateCartCount();

  if (!cartItems || !totalPrice) return;

  if (cart.length === 0) {
    cartItems.innerHTML = `<p class="empty-cart">Giỏ hàng đang trống.</p>`;
    totalPrice.textContent = "0đ";
    if (checkoutSummary) {
      checkoutSummary.innerHTML = `
        <div><span>Tổng mặt hàng</span><strong>0</strong></div>
        <div><span>Tạm tính</span><strong>0đ</strong></div>
        <div><span>Phí giao hàng</span><strong>Chưa áp dụng</strong></div>
        <div class="checkout-summary-total"><span>Tổng thanh toán</span><strong>0đ</strong></div>
      `;
    }
    return;
  }

  let total = 0;
  let totalQuantity = 0;

  cartItems.innerHTML = cart.map(item => {
    const itemTotal = Number(item.price) * Number(item.quantity);
    total += itemTotal;
    totalQuantity += Number(item.quantity);

    return `
      <div class="cart-item" data-open-food-detail="${item.id}" data-detail-from="cart">
        <div>
          <h4><a class="cart-item-detail-link" href="${getFoodDetailUrl(item.id, { from: "cart" })}">${escapeHtml(item.name)}</a></h4>
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

  if (checkoutSummary) {
    checkoutSummary.innerHTML = `
      <div><span>Tổng mặt hàng</span><strong>${totalQuantity}</strong></div>
      <div><span>Tạm tính</span><strong>${formatMoney(total)}</strong></div>
      <div><span>Phí giao hàng</span><strong>Chưa áp dụng</strong></div>
      <div class="checkout-summary-total"><span>Tổng thanh toán</span><strong>${formatMoney(total)}</strong></div>
    `;
  }
}

function changeQuantity(foodId, amount) {
  const item = cart.find(item => item.id === foodId);

  if (!item) return;

  const food = foods.find(entry => entry.id === foodId);
  const stock = Number(food?.stockQuantity ?? Number.MAX_SAFE_INTEGER);
  const nextQuantity = item.quantity + amount;

  if (nextQuantity > stock) {
    showSiteToast(`Số lượng tối đa còn lại cho món này là ${stock}.`, "error");
    return;
  }

  item.quantity = nextQuantity;

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

function formatCountdown(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function getBankDisplayName(bankCode) {
  const bankNames = {
    "970424": "Shinhan Bank Việt Nam"
  };

  return bankNames[String(bankCode || "")] || bankCode || "Ngân hàng";
}

async function cancelActiveQrPayment(reason = "manual") {
  if (!activeQrPayment?.orderId) return;

  const orderId = activeQrPayment.orderId;
  activeQrPayment = null;

  if (qrPaymentCountdownTimer) {
    clearInterval(qrPaymentCountdownTimer);
    qrPaymentCountdownTimer = null;
  }

  if (qrPaymentStatusTimer) {
    clearInterval(qrPaymentStatusTimer);
    qrPaymentStatusTimer = null;
  }

  try {
    await fetch(`${ORDERS_API}/${orderId}/payment/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({ reason })
    });
  } catch (error) {
    console.error("Không hủy được giao dịch QR:", error);
  }
}

function stopQrPaymentTimers() {
  if (qrPaymentCountdownTimer) {
    clearInterval(qrPaymentCountdownTimer);
    qrPaymentCountdownTimer = null;
  }

  if (qrPaymentStatusTimer) {
    clearInterval(qrPaymentStatusTimer);
    qrPaymentStatusTimer = null;
  }
}

function closeQrPaymentDialog({ cancel = true } = {}) {
  const dialog = document.getElementById("qrPaymentDialog");

  if (dialog) dialog.remove();
  document.body.classList.remove("qr-payment-open");
  if (cancel) cancelActiveQrPayment("closed");
  if (!cancel) stopQrPaymentTimers();
}

async function checkQrPaymentStatus(orderId) {
  try {
    const response = await fetch(`${ORDERS_API}/${orderId}/payment/status`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`
      }
    });

    if (!response.ok) return;

    const data = await response.json();

    if (data.paymentStatus === "paid") {
      activeQrPayment = null;
      closeQrPaymentDialog({ cancel: false });
      showSiteToast("Thanh toan QR thanh cong. Don hang dang cho xac nhan.");
      setTimeout(() => {
        window.location.href = "track.html";
      }, 900);
    }
  } catch (error) {
    console.error("Cannot check QR payment status:", error);
  }
}

function showQrPaymentDialog(order) {
  const session = order.paymentSession;
  if (!session?.qrUrl) return;

  activeQrPayment = {
    orderId: order.id,
    startedAt: Date.now()
  };

  const oldDialog = document.getElementById("qrPaymentDialog");
  if (oldDialog) oldDialog.remove();
  document.body.classList.add("qr-payment-open");

  const dialog = document.createElement("div");
  dialog.id = "qrPaymentDialog";
  dialog.className = "qr-payment-dialog";
  dialog.innerHTML = `
    <div class="qr-payment-card" role="dialog" aria-modal="true" aria-labelledby="qrPaymentTitle">
      <div class="qr-payment-head">
        <div>
          <h2 id="qrPaymentTitle">Thanh toán QR đơn #${order.id}</h2>
          <p>Không rời trang trong lúc giao dịch đang chờ xử lý.</p>
        </div>
        <button type="button" class="qr-payment-close" aria-label="Hủy thanh toán">×</button>
      </div>
      <img class="qr-payment-image" src="${escapeHtml(session.qrUrl)}" alt="Mã QR thanh toán đơn ${order.id}">
      <div class="qr-payment-info">
        <div><span>Số tiền</span><strong>${formatMoney(session.amount)}</strong></div>
        <div><span>Ngân hàng</span><strong>${escapeHtml(getBankDisplayName(session.bankCode))}</strong></div>
        <div><span>Số tài khoản</span><strong>${escapeHtml(session.bankAccountNo)}</strong></div>
        <div><span>Chủ tài khoản</span><strong>${escapeHtml(session.bankAccountName)}</strong></div>
        <div><span>Nội dung</span><strong>${escapeHtml(session.transferContent)}</strong></div>
        <div><span>Thời gian còn lại</span><strong id="qrPaymentCountdown">${formatCountdown(session.expiresInSeconds || 600)}</strong></div>
      </div>
      <div class="qr-payment-actions">
        <button type="button" class="social-link-btn" data-qr-cancel>Hủy giao dịch</button>
        <a class="btn" href="track.html">Tôi đã chuyển khoản</a>
      </div>
    </div>
  `;

  document.body.appendChild(dialog);

  let remaining = Number(session.expiresInSeconds || 600);
  qrPaymentCountdownTimer = setInterval(() => {
    remaining -= 1;
    const countdown = document.getElementById("qrPaymentCountdown");
    if (countdown) countdown.textContent = formatCountdown(Math.max(remaining, 0));

    if (remaining <= 0) {
      closeQrPaymentDialog({ cancel: true });
      showSiteToast("Giao dịch QR đã hết hạn và được hủy.", "error");
    }
  }, 1000);

  qrPaymentStatusTimer = setInterval(() => {
    if (activeQrPayment?.orderId) checkQrPaymentStatus(activeQrPayment.orderId);
  }, 3000);

  dialog.querySelector(".qr-payment-close")?.addEventListener("click", () => closeQrPaymentDialog({ cancel: true }));
  dialog.querySelector("[data-qr-cancel]")?.addEventListener("click", () => {
    closeQrPaymentDialog({ cancel: true });
    showSiteToast("Đã hủy giao dich QR.");
  });
  dialog.querySelector("a.btn")?.addEventListener("click", () => {
    activeQrPayment = null;
    stopQrPaymentTimers();
  });
}

async function submitOrder(event) {
  event.preventDefault();

  if (!isLoggedIn()) {
    requireLogin("Vui lòng đăng nhập để đặt hàng.", "cart.html");
    return;
  }

  if (cart.length === 0) {
    showSiteToast("Giỏ hàng đang trống. Vui lòng chọn món trước.", "error");
    return;
  }

  const stockIssue = foods.length
    ? cart.some(item => {
        const food = foods.find(entry => entry.id === item.id);
        return !food || Number(food.stockQuantity || 0) < Number(item.quantity);
      })
    : false;

  if (stockIssue) {
    showSiteToast("Một số món trong giỏ hàng vượt quá số lượng còn. Vui lòng cập nhật lại.", "error");
    return;
  }

  const name = document.getElementById("customerName").value;
  const phone = document.getElementById("customerPhone").value;
  const cityName = document.getElementById("customerCity")?.value || "";
  const wardName = document.getElementById("customerWard")?.value || "";
  const addressDetail = document.getElementById("customerAddress").value;
  const address = buildAddressString(cityName, "", wardName, addressDetail);
  const note = document.getElementById("customerNote").value;
  const paymentMethod = document.querySelector("input[name='paymentMethod']:checked")?.value || "cod";
  const submitButton = document.querySelector("#orderForm button[type='submit']");
  const token = getAuthToken();

  if (!name.trim() || !phone.trim() || !cityName || !wardName || !addressDetail.trim()) {
    showSiteToast("Vui lòng cập nhật đầy đủ thông tin giao hàng trước khi đặt hàng.", "error");
    setCheckoutAddressRequiredState(false, "Bạn cần cập nhật đầy đủ địa chỉ giao hàng trước khi đặt hàng.");
    return;
  }

  if (!["cod", "qr", "wallet"].includes(paymentMethod)) {
    showSiteToast("Phương thức thanh toán không hợp lệ.", "error");
    return;
  }

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
        paymentMethod,
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
      requireLogin(data.message || "Phiên đăng nhập da hết hạn. Vui lòng đăng nhập lai.", "cart.html");
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

    if (data.order?.paymentMethod === "qr" && data.order?.paymentSession) {
      showQrPaymentDialog(data.order);
      showSiteToast("Đã tạo mã QR. Vui lòng hoàn tất thanh toan.");
      return;
    }
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
        <p><strong>Thanh toán:</strong> ${getPaymentMethodLabel(data.payment_method)} - ${getPaymentStatusLabel(data.payment_status)}</p>
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
    requireLogin("Vui lòng đăng nhập để xem lịch sử đơn hàng.", "track.html");
    return;
  }

  const params = new URLSearchParams();
  const searchValue = searchInput?.value.trim();
  const dateValue = dateInput?.value;

  if (searchValue) params.set("q", searchValue);
  if (dateValue) params.set("date", dateValue);

  resultBox.innerHTML = "<p>Đang tải lịch sử đơn hàng...</p>";

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
      requireLogin(data.message || "Phiên đăng nhập da hết hạn. Vui lòng đăng nhập lai.", "track.html");
      return;
    }

    if (!response.ok) {
      resultBox.innerHTML = `<p>${data.message || "Không thể tải lịch sử đơn hàng."}</p>`;
      return;
    }

    await loadFoodReviews();
    renderOrderHistory(data);
  } catch (error) {
    resultBox.innerHTML = "<p>Không kết nối được server.</p>";
    console.error(error);
  }
}

function renderOrderHistory(orders) {
  const resultBox = document.getElementById("track-result");

  if (!resultBox) return;

  if (!orders.length) {
    resultBox.innerHTML = `
      <div class="empty-history">
        <h3>Chưa có đơn hàng phù hợp</h3>
        <p>Bạn có thể quay lại thực đơn để đặt món hoặc thử bộ lọc khác.</p>
        <a href="menu.html" class="btn">Dat mon ngay</a>
      </div>
    `;
    return;
  }

  resultBox.innerHTML = orders.map(order => `
    <article class="track-card order-card">
      <div class="order-history-top">
        <div>
          <p class="order-code">Đơn hàng #${order.id}</p>
          <h3>${formatMoney(order.total_price)}</h3>
          <span>${new Date(order.created_at).toLocaleString("vi-VN")}</span>
        </div>
        <span class="status-pill">${getOrderStatusLabel(order.status)}</span>
      </div>

      <div class="history-info">
        <div>
          <small>Người nhận</small>
          <p>${escapeHtml(order.customer_name)} - ${escapeHtml(order.phone)}</p>
        </div>
        <div>
          <small>Địa chỉ giao hàng</small>
          <p>${escapeHtml(order.address)}</p>
        </div>
        <div>
          <small>Thanh toán</small>
          <p>${getPaymentMethodLabel(order.payment_method)} - ${getPaymentStatusLabel(order.payment_status)}</p>
        </div>
        ${order.note ? `<div><small>Ghi chú</small><p>${escapeHtml(order.note)}</p></div>` : ""}
      </div>

      <div class="history-items">
        ${order.items.map(item => `
          <div class="track-line order-item-row">
            <div class="order-item-main">
              <span>${escapeHtml(item.food_name)}</span>
              <small>Số lượng: ${Number(item.quantity)}</small>
              ${renderOrderReviewControl(order, item)}
            </div>
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
    cancelled: "Đã hủy",
    pending_payment: "Chờ thanh toán"
  };

  return labels[status] || status;
}

function getPaymentMethodLabel(method) {
  const labels = {
    cod: "Thanh toán khi nhận hàng",
    qr: "Thanh toán bằng mã QR",
    wallet: "Tiền trong tài khoản"
  };

  return labels[method] || "Chưa xác định";
}

function getPaymentStatusLabel(status) {
  const labels = {
    unpaid: "Chưa thanh toán",
    pending: "Chờ thanh toán",
    paid: "Đã thanh toán",
    failed: "Thanh toán thất bại",
    refunded: "Đã hoàn tiền"
  };

  return labels[status] || "Chưa xác định";
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
    const avatarSource = String(user.avatar || "").trim() || getDefaultAvatarDataUrl();
    const avatarContent = `<img src="${escapeHtml(avatarSource)}" alt="${escapeHtml(user.fullname || "FoodHub User")}" onerror="this.remove(); this.parentElement.textContent='${initial}';">`;

    userArea.innerHTML = `
      <div class="account-menu">
        <button type="button" class="account-toggle" aria-label="Mở tài khoản" aria-expanded="false">
          <span class="account-avatar">${avatarContent}</span>
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

  const isMobile = () => window.matchMedia("(max-width: 560px)").matches;
  const closeMenu = () => {
    header.classList.remove("mobile-menu-open");
    document.body.classList.remove("menu-lock");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", () => {
    const isOpen = header.classList.toggle("mobile-menu-open");
    document.body.classList.toggle("menu-lock", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  overlay.addEventListener("click", closeMenu);

  header.querySelectorAll(".nav-dropdown-toggle").forEach(dropdownToggle => {
    dropdownToggle.addEventListener("click", event => {
      if (!isMobile()) return;
      event.preventDefault();
      event.stopPropagation();
      dropdownToggle.closest(".nav-dropdown")?.classList.toggle("open");
    });
  });

  header.querySelectorAll("nav a").forEach(link => {
    link.addEventListener("click", () => {
      if (isMobile() && !link.classList.contains("nav-dropdown-toggle")) closeMenu();
    });
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeMenu();
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
  requireLogin("Vui lòng đăng nhập để tiếp tục.", target);
  return false;
}

function initSupportWidget() {
  if (document.getElementById("support-widget")) return;

  const robotIcon = getFoodHubRobotIcon(true);

  const widget = document.createElement("div");
  widget.id = "support-widget";
  widget.className = "support-widget";
  widget.innerHTML = `
    <div class="support-panel" aria-label="Kenh hỗ trợ FoodHub">
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
    <div class="chat-bubble-tip" hidden>
      <strong>FoodHub đây!</strong>
      <span>Bạn có cần tôi hỗ trợ gì không?</span>
    </div>
    <button type="button" class="support-toggle" aria-label="Mo hỗ trợ" aria-expanded="false">
      <span aria-hidden="true">${robotIcon}</span>
    </button>
  `;

  const button = widget.querySelector(".support-toggle");
  button.addEventListener("click", () => {
    const isOpen = widget.classList.toggle("open");
    button.setAttribute("aria-expanded", String(isOpen));
  });

  document.body.appendChild(widget);
  maybeShowChatBubble(widget);
}

function getFoodHubRobotIcon(showWordmark = false) {
  return `
    <svg class="support-robot-icon ${showWordmark ? "with-wordmark" : ""}" viewBox="0 0 160 160" focusable="false">
      ${showWordmark ? `
        <circle class="robot-badge-bg" cx="80" cy="80" r="70"></circle>
        <circle class="robot-badge-ring" cx="80" cy="80" r="70"></circle>
      ` : ""}
      <g class="foodhub-robot-mark">
        <path class="robot-antenna" d="M80 48V33"></path>
        <circle class="robot-ring" cx="80" cy="28" r="8"></circle>
        <rect class="robot-ear" x="29" y="73" width="18" height="38" rx="9"></rect>
        <rect class="robot-ear" x="113" y="73" width="18" height="38" rx="9"></rect>
        <rect class="robot-face" x="43" y="58" width="74" height="62" rx="24"></rect>
        <circle class="robot-eye" cx="68" cy="88" r="7"></circle>
        <circle class="robot-eye" cx="92" cy="88" r="7"></circle>
        <path class="robot-mouth" d="M66 101c7 8 21 8 28 0"></path>
      </g>
    </svg>
  `;
}

function initChatSupportWidget() {
  if (document.getElementById("support-widget")) return;

  const user = getCurrentUser();
  const displayName = user?.fullname || "ban";
  const robotIcon = getFoodHubRobotIcon(false);
  const robotLogo = getFoodHubRobotIcon(true);
  const widget = document.createElement("div");
  widget.id = "support-widget";
  widget.className = "support-widget";
  widget.innerHTML = `
    <div class="support-panel chat-panel" aria-label="Hop chat hỗ trợ FoodHub">
      <div class="chat-header">
        <div class="chat-agent">
          <span class="chat-avatar" aria-hidden="true">
            ${robotIcon}
          </span>
          <div>
            <strong>FoodHub</strong>
            <small>Chat voi chung toi</small>
          </div>
        </div>
        <div class="chat-header-actions">
          <button type="button" class="chat-menu" aria-label="Menu hỗ trợ">
            <span></span><span></span><span></span>
          </button>
          <button type="button" class="chat-close" aria-label="Đóng hỗ trợ">&times;</button>
        </div>
      </div>
      <div class="chat-quick-menu" hidden>
        <a href="menu.html">Xem thực đơn</a>
        <a href="track.html">Lịch sử đơn hàng</a>
        <a href="contact.html">Liên hệ FoodHub</a>
      </div>
      <div class="chat-messages" aria-live="polite">
        <div class="chat-message bot">Xin chào ${escapeHtml(displayName)}, FoodHub có thể hỗ trợ gì cho bạn?</div>
        <div class="chat-message bot muted">Đây là khung chat tạm thời. Sau này mình sẽ kết nối dữ liệu hệ thống để trả lời tự động.</div>
      </div>
      <form class="chat-form">
        <input type="file" class="chat-file" aria-label="Đính kèm tệp" hidden>
        <div class="chat-form-main">
          <input type="text" class="chat-input" placeholder="Nhập nội dung..." aria-label="Nhập tin nhắn hỗ trợ">
          <div class="chat-tools">
            <button type="button" class="chat-tool chat-like" aria-label="Gửi like">
              <svg viewBox="0 0 24 24" focusable="false">
                <path d="M7 10v10H4V10h3Zm4.2-7c.8 0 1.4.6 1.4 1.4v3.2H18c1.2 0 2 .9 1.8 2.1l-1.1 7.7c-.2 1-1 1.7-2 1.7H9V9.8l2-5.6c.2-.7.8-1.2 1.5-1.2h-1.3Z"></path>
              </svg>
            </button>
            <button type="button" class="chat-tool chat-attach" aria-label="Đính kèm tệp">
              <svg viewBox="0 0 24 24" focusable="false">
                <path d="M18.4 11.2 11 18.6a4.2 4.2 0 0 1-6-6L14 3.7a2.9 2.9 0 0 1 4.1 4.1L9.5 16.4a1.5 1.5 0 0 1-2.1-2.1l7.5-7.5"></path>
              </svg>
            </button>
            <button type="button" class="chat-tool chat-emoji" aria-label="Chọn biểu tượng">
              <svg viewBox="0 0 24 24" focusable="false">
                <circle cx="12" cy="12" r="9"></circle>
                <circle cx="9" cy="10" r="1"></circle>
                <circle cx="15" cy="10" r="1"></circle>
                <path d="M8 14c1 1.4 2.3 2 4 2s3-.6 4-2"></path>
              </svg>
            </button>
            <button type="submit" class="chat-send" aria-label="Gửi tin nhắn">
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
    <div class="chat-bubble-tip" hidden>
      <strong>FoodHub đây!</strong>
      <span>Bạn có cần tôi hỗ trợ gì không?</span>
    </div>
    <button type="button" class="support-toggle" aria-label="Mở hỗ trợ" aria-expanded="false">
      <span aria-hidden="true">${robotLogo}</span>
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

  const hideChatPopovers = () => {
    quickMenu.hidden = true;
    emojiPicker.hidden = true;
  };

  button.addEventListener("click", () => {
    const isOpen = widget.classList.toggle("open");
    button.setAttribute("aria-expanded", String(isOpen));
    if (isOpen) {
      chatInput.focus();
    } else {
      hideChatPopovers();
    }
  });

  closeButton.addEventListener("click", () => {
    widget.classList.remove("open");
    button.setAttribute("aria-expanded", "false");
    hideChatPopovers();
  });

  menuButton.addEventListener("click", event => {
    event.stopPropagation();
    const willOpen = quickMenu.hidden;
    hideChatPopovers();
    quickMenu.hidden = !willOpen;
  });

  attachButton.addEventListener("click", () => {
    hideChatPopovers();
    chatFile.click();
  });

  chatFile.addEventListener("change", () => {
    const file = chatFile.files?.[0];
    if (!file) return;

    chatMessages.insertAdjacentHTML("beforeend", `
      <div class="chat-message user file-message">Đã đính kèm: ${escapeHtml(file.name)}</div>
      <div class="chat-message bot muted">FoodHub đã nhận thông tin tệp. Tính năng gửi tệp thật sẽ được kết nối sau.</div>
    `);
    chatFile.value = "";
    hideChatPopovers();
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });

  emojiButton.addEventListener("click", event => {
    event.stopPropagation();
    const willOpen = emojiPicker.hidden;
    hideChatPopovers();
    emojiPicker.hidden = !willOpen;
  });

  emojiPicker.addEventListener("click", event => {
    event.stopPropagation();
    const emojiOption = event.target.closest("button[data-code]");
    if (!emojiOption) return;

    chatInput.value += String.fromCodePoint(Number(emojiOption.dataset.code));
    emojiPicker.hidden = true;
    chatInput.focus();
  });

  likeButton.addEventListener("click", () => {
    hideChatPopovers();
    chatMessages.insertAdjacentHTML("beforeend", `
      <div class="chat-message user">&#128077;</div>
      <div class="chat-message bot muted">Cảm ơn ${escapeHtml(displayName)}, FoodHub đã nhận phản hồi của bạn.</div>
    `);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });

  chatForm.addEventListener("submit", event => {
    event.preventDefault();

    const message = chatInput.value.trim();
    if (!message) return;

    chatMessages.insertAdjacentHTML("beforeend", `
      <div class="chat-message user">${escapeHtml(message)}</div>
      <div class="chat-message bot muted">FoodHub đã nhận tin nhắn của bạn. Chức năng trả lời tự động sẽ được cập nhật sau.</div>
    `);
    chatInput.value = "";
    hideChatPopovers();
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });

  document.addEventListener("click", event => {
    if (!quickMenu.hidden && !quickMenu.contains(event.target) && !menuButton.contains(event.target)) {
      quickMenu.hidden = true;
    }

    if (!emojiPicker.hidden && !emojiPicker.contains(event.target) && !emojiButton.contains(event.target)) {
      emojiPicker.hidden = true;
    }
  });

  document.body.appendChild(widget);
  maybeShowChatBubble(widget);
}

function maybeShowChatBubble(widget) {
  const bubble = widget.querySelector(".chat-bubble-tip");
  if (!bubble) return;

  const isHomePage = /(^|\/)index\.html$/.test(window.location.pathname) || window.location.pathname.endsWith("/");
  const shouldShowAfterLogin = sessionStorage.getItem("foodhub_show_chat_bubble") === "1";
  const shouldShowFirstHome = isHomePage && localStorage.getItem("foodhub_home_chat_bubble_seen") !== "1";

  if (!shouldShowAfterLogin && !shouldShowFirstHome) return;

  if (shouldShowAfterLogin) {
    sessionStorage.removeItem("foodhub_show_chat_bubble");
  }

  if (shouldShowFirstHome) {
    localStorage.setItem("foodhub_home_chat_bubble_seen", "1");
  }

  bubble.hidden = false;
  requestAnimationFrame(() => {
    bubble.classList.add("show");
  });

  setTimeout(() => {
    bubble.classList.remove("show");
    setTimeout(() => {
      bubble.hidden = true;
    }, 220);
  }, 5000);
}

window.addEventListener("beforeunload", event => {
  if (!activeQrPayment) return;

  event.preventDefault();
  event.returnValue = "";
});

window.addEventListener("pagehide", () => {
  if (!activeQrPayment?.orderId) return;

  const token = getAuthToken();
  const payload = JSON.stringify({ reason: "pagehide" });
  const blob = new Blob([payload], { type: "application/json" });

  navigator.sendBeacon(`${ORDERS_API}/${activeQrPayment.orderId}/payment/cancel?token=${encodeURIComponent(token || "")}`, blob);
});

document.addEventListener("click", event => {
  const detailCard = event.target.closest("[data-open-food-detail]");
  if (!detailCard || event.target.closest("button, input, a, select, textarea")) return;
  window.location.href = getFoodDetailUrl(detailCard.dataset.openFoodDetail, {
    from: detailCard.dataset.detailFrom || "home",
    category: detailCard.dataset.detailCategory || ""
  });
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeFoodDetail();
});

if (protectCheckoutPage()) {
  (async () => {
    await initAddressSelectors();
  const currentUser = await loadCheckoutProfile() || getCurrentUser();
  const savedAddresses = await loadCheckoutSavedAddresses();
  const hasCheckoutAddress = Boolean(
    savedAddresses.length
      || currentUser?.address
      || (
        document.getElementById("customerCity")?.value
        && document.getElementById("customerWard")?.value
        && document.getElementById("customerAddress")?.value
      )
  );
  setCheckoutAddressRequiredState(hasCheckoutAddress, "Bạn cần cập nhật địa chỉ giao hàng trong tài khoản trước khi đặt hàng.");

  loadPublicCategories();
  loadFoods();
  loadPublicAnnouncements();
  loadFloatingAdvertisements();
  renderCart();
  renderUser();
  initAccountMenu();
  initMobileMenu();
  initCompactHeader();
  initTrackPage();
  initAnnouncementArchiveFilters();
  loadAnnouncementArchive();
  initChatSupportWidget();
  })();
}
