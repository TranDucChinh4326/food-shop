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

const LEGACY_ADDRESS_LOOKUP = {
  "HÃ  Ná»™i": {
    "Quáº­n Ba ÄÃ¬nh": ["PhÆ°á»ng PhÃºc XÃ¡", "PhÆ°á»ng TrÃºc Báº¡ch", "PhÆ°á»ng Kim MÃ£", "PhÆ°á»ng Cá»‘ng Vá»‹"],
    "Quáº­n HoÃ n Kiáº¿m": ["PhÆ°á»ng ChÆ°Æ¡ng DÆ°Æ¡ng Äá»™", "PhÆ°á»ng HÃ ng Trá»‘ng", "PhÆ°á»ng HÃ ng Báº¡c", "PhÆ°á»ng LÃ½ ThÃ¡i Tá»•"],
    "Quáº­n Äá»‘ng Äa": ["PhÆ°á»ng Nam Äá»“ng", "PhÆ°á»ng Trung Liá»‡t", "PhÆ°á»ng KhÃ¢m ThiÃªn", "PhÆ°á»ng CÃ¡t Linh"]
  },
  "Há»“ ChÃ­ Minh": {
    "Quáº­n 1": ["PhÆ°á»ng Báº¿n NghÃ©", "PhÆ°á»ng Äa Kao", "PhÆ°á»ng TÃ¢n Äá»‹nh", "PhÆ°á»ng Nguyá»…n ThÃ¡i BÃ¬nh"],
    "Quáº­n 3": ["PhÆ°á»ng VÃµ Thá»‹ SÃ¡u", "PhÆ°á»ng Nguyá»…n CÆ° Trinh", "PhÆ°á»ng Pháº¡m NgÅ© LÃ£o", "PhÆ°á»ng Äa Kao"],
    "Quáº­n 7": ["PhÆ°á»ng TÃ¢n PhÃº", "PhÆ°á»ng TÃ¢n HÆ°ng", "PhÆ°á»ng TÃ¢n Thuáº­n ÄÃ´ng", "PhÆ°á»ng TÃ¢n Quy"]
  },
  "ÄÃ  Náºµng": {
    "Quáº­n Háº£i ChÃ¢u": ["PhÆ°á»ng Tháº¡ch Thang", "PhÆ°á»ng BÃ¬nh HiÃªn", "PhÆ°á»ng Nam DÆ°Æ¡ng", "PhÆ°á»ng Thanh BÃ¬nh"],
    "Quáº­n Cáº©m Lá»‡": ["PhÆ°á»ng HÃ²a An", "PhÆ°á»ng HÃ²a Thá» TÃ¢y", "PhÆ°á»ng HÃ²a XuÃ¢n", "PhÆ°á»ng KhuÃª Trung"],
    "Quáº­n NgÅ© HÃ nh SÆ¡n": ["PhÆ°á»ng HÃ²a Háº£i", "PhÆ°á»ng Má»¹ An", "PhÆ°á»ng KhuÃª Má»¹", "PhÆ°á»ng MÃ¢n ThÃ¡i"]
  },
  "Háº£i PhÃ²ng": {
    "Quáº­n Há»“ng BÃ ng": ["PhÆ°á»ng Sá»Ÿ Dáº§u", "PhÆ°á»ng QuÃ¡n Toan", "PhÆ°á»ng Phan Bá»™i ChÃ¢u", "PhÆ°á»ng Gia Viá»…n"],
    "Quáº­n NgÃ´ Quyá»n": ["PhÆ°á»ng Láº¡ch Tray", "PhÆ°á»ng MÃ¡y Chai", "PhÆ°á»ng Cáº§u Tre", "PhÆ°á»ng VÄ©nh Niá»‡m"],
    "Quáº­n LÃª ChÃ¢n": ["PhÆ°á»ng Tráº¡i Cau", "PhÆ°á»ng KÃªnh DÆ°Æ¡ng", "PhÆ°á»ng Lam SÆ¡n", "PhÆ°á»ng áº¨n BiÃªn"]
  }
};

const VIETNAM_ADDRESS_API = "https://provinces.open-api.vn/api/v2/?depth=2";
const ADDRESS_CACHE_KEY = "foodhub_vietnam_addresses_v2";
let ADDRESS_LOOKUP = {};
let addressLookupPromise;

const DEFAULT_ADDRESS_SUGGESTIONS = [
  "Sá»‘ nhÃ , tÃªn Ä‘Æ°á»ng, khu phá»‘",
  "TÃ²a nhÃ , láº§u, sá»‘ phÃ²ng",
  "NgÃµ, ngÃ¡ch, háº»m gáº§n khu vá»±c"
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
  return Number(number).toLocaleString("vi-VN") + "Ä‘";
}

function formatDateTime(value) {
  if (!value) return "ChÆ°a Ä‘áº·t";

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

function requireLogin(message = "Vui lÃ²ng Ä‘Äƒng nháº­p Ä‘á»ƒ tiáº¿p tá»¥c.", target = window.location.href) {
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
    .replace(/Ä‘/g, "d")
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
      : `<a href="${getCategoryUrl(root.slug)}">Táº¥t cáº£ ${escapeHtml(root.name)}</a>`;

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
    if (!response.ok) throw new Error("KhÃ´ng thá»ƒ táº£i danh má»¥c");

    publicCategories = await response.json();
    renderPublicNavCategories();
    renderMenuCategoryOptions();
    if (foods.length) renderFoods();
  } catch (error) {
    console.error("Lá»—i táº£i danh má»¥c:", error);
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
    || (categoryValue === "all" ? "Táº¥t cáº£ mÃ³n" : categoryValue.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" "));

  if (heading) heading.textContent = label;

  if (description) {
    description.textContent = categoryValue === "all"
      ? "Hiá»ƒn thá»‹ táº¥t cáº£ mÃ³n theo thá»© tá»± danh má»¥c."
      : `Äang hiá»ƒn thá»‹ cÃ¡c mÃ³n thuá»™c ${label}.`;
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
        "KhÃ´ng dÃ¹ng cáº¥p huyá»‡n": province.wards
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
      if (!response.ok) throw new Error("KhÃ´ng táº£i Ä‘Æ°á»£c danh sÃ¡ch tá»‰nh thÃ nh.");

      const provinces = await response.json();
      const lookup = normalizeVietnamAddressData(Array.isArray(provinces) ? provinces : []);
      if (Object.keys(lookup).length === 0) throw new Error("Danh sÃ¡ch tá»‰nh thÃ nh khÃ´ng há»£p lá»‡.");

      ADDRESS_LOOKUP = lookup;
      sessionStorage.setItem(ADDRESS_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), lookup }));
    } catch (error) {
      console.warn(error);
      ADDRESS_LOOKUP = LEGACY_ADDRESS_LOOKUP;
      showSiteToast("Táº¡m thá»i dung danh sÃ¡ch Ä‘á»‹a chá»‰ dá»± phÃ²ng.", "info");
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
  setSelectOptions(citySelect, cityNames, "Chá»n thanh pho");

  if (cityNames.includes(parsedAddress.city)) {
    citySelect.value = parsedAddress.city;
  }

  const districtNames = Object.keys(ADDRESS_LOOKUP[citySelect.value] || {});
  const selectedDistrict = districtNames.includes(parsedAddress.district) ? parsedAddress.district : districtNames[0] || "";

  if (districtSelect) {
    setSelectOptions(districtSelect, districtNames, "Chá»n quan huyen");
    districtSelect.value = selectedDistrict;
  }

  const wardNames = ADDRESS_LOOKUP[citySelect.value]?.[selectedDistrict] || [];
  setSelectOptions(wardSelect, wardNames, "Chá»n phuong xa");
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

    setSelectOptions(citySelect, cityNames, "Chá»n thÃ nh phá»‘");
    setSelectOptions(districtSelect, [], "Chá»n quáº­n huyá»‡n");
    setSelectOptions(wardSelect, [], "Chá»n phÆ°á»ng xÃ£");

    if (datalist) {
      datalist.innerHTML = DEFAULT_ADDRESS_SUGGESTIONS.map(suggestion => `<option value="${escapeHtml(suggestion)}"></option>`).join("");
    }

    citySelect.addEventListener("change", () => {
      const districts = Object.keys(ADDRESS_LOOKUP[citySelect.value] || {});
      setSelectOptions(districtSelect, districts, "Chá»n quáº­n huyá»‡n");
      setSelectOptions(wardSelect, [], "Chá»n phÆ°á»ng xÃ£");
      if (detailInput) detailInput.value = "";
    });

    districtSelect?.addEventListener("change", () => {
      const wards = ADDRESS_LOOKUP[citySelect.value]?.[districtSelect.value] || [];
      setSelectOptions(wardSelect, wards, "Chá»n phÆ°á»ng xÃ£");
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
    setSelectOptions(districtSelect, districtList, "Chá»n quáº­n huyá»‡n");
    districtSelect.value = parsedAddress.district || "";

    const wardList = ADDRESS_LOOKUP[parsedAddress.city]?.[parsedAddress.district] || [];
    setSelectOptions(wardSelect, wardList, "Chá»n phÆ°á»ng xÃ£");
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
        setSelectOptions(districtSelect, districts, "Chá»n quan huyen");
        districtSelect.value = selectedDistrict;
      }
      setSelectOptions(wardSelect, ADDRESS_LOOKUP[citySelect.value]?.[selectedDistrict] || [], "Chá»n phuong xa");
      if (detailInput) detailInput.value = "";
    });

    districtSelect?.addEventListener("change", () => {
      setSelectOptions(wardSelect, ADDRESS_LOOKUP[citySelect.value]?.[districtSelect.value] || [], "Chá»n phuong xa");
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
      : `${escapeHtml(message || "Báº¡n cáº§n cáº­p nháº­t Ä‘á»‹a chá»‰ giao hÃ ng trÆ°á»›c khi Ä‘áº·t hÃ ng.")} <a href="profile.html">Cáº­p nháº­t ngay</a>`;
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
    console.error("KhÃ´ng táº£i Ä‘Æ°á»£c há»“ sÆ¡ Ä‘áº·t hÃ ng:", error);
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
    select.innerHTML = `<option value="">Nháº­p Ä‘á»‹a chá»‰ má»›i</option>` + data.addresses.map(address => (
      `<option value="${address.id}" data-address="${escapeHtml(address.address)}" data-name="${escapeHtml(address.receiverName || "")}" data-phone="${escapeHtml(address.phone || "")}">
        ${escapeHtml(address.label || "Äá»‹a chá»‰ giao hÃ ng")}${address.isDefault ? " - Máº·c Ä‘á»‹nh" : ""}
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
    console.error("KhÃ´ng táº£i Ä‘Æ°á»£c Ä‘á»‹a chá»‰ Ä‘Ã£ lÆ°u:", error);
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

  if (foodList) foodList.innerHTML = "<p>Äang táº£i mÃ³n Äƒn...</p>";

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
    console.error("Lá»—i táº£i mÃ³n Äƒn:", error);
    if (foodList) foodList.innerHTML = "<p>KhÃ´ng thá»ƒ táº£i mÃ³n Äƒn tá»« database.</p>";
    if (bestSellerBox) bestSellerBox.innerHTML = "<p>KhÃ´ng thá»ƒ táº£i mÃ³n bÃ¡n cháº¡y tá»« database.</p>";
    if (homeSectionBox) homeSectionBox.innerHTML = "<p>KhÃ´ng thá»ƒ táº£i thá»±c Ä‘Æ¡n tá»« database.</p>";
  }
}
function getFoodDisplayCategory(food) {
  return food.parentCategoryName || food.categoryName || "MÃ³n Äƒn";
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
    console.error("Lá»—i táº£i Ä‘Ã¡nh giÃ¡ mÃ³n Äƒn:", error);
    foodReviews = [];
  }

  renderHomeReviews();
  renderFoodDetailPage();
}

function getReviewFood(review) {
  return foods.find(food => String(food.id) === String(review.foodId)) || null;
}

function getReviewCustomerName(review) {
  return review.customerName || "KhÃ¡ch hÃ ng FoodHub";
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
  return "â˜…".repeat(value) + "â˜†".repeat(5 - value);
}

function renderRatingLabel(rating, reviewCount = 0) {
  if (!Number(reviewCount)) return "ChÆ°a cÃ³ Ä‘Ã¡nh giÃ¡";
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
      <a class="home-food-detail-trigger" href="${getFoodDetailUrl(food.id, { from: "home" })}" aria-label="Xem chi tiáº¿t ${escapeHtml(food.name)}"></a>
      <img src="${escapeHtml(food.image || "")}" alt="${escapeHtml(food.name)}">
      <div class="home-food-card-body">
        <span class="home-food-category">${escapeHtml(getFoodDisplayCategory(food))}</span>
        <h3>${escapeHtml(food.name)}</h3>
        <p>${escapeHtml(food.desc || "")}</p>
        <div class="home-food-meta">
          <span>${renderRatingLabel(food.rating, food.reviewCount)}</span>
          <span>ÄÃ£ bÃ¡n ${sold}</span>
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
      <a class="home-food-detail-trigger" href="${getFoodDetailUrl(food.id, { from: "home" })}" aria-label="Xem chi tiáº¿t ${escapeHtml(food.name)}"></a>
      <img src="${escapeHtml(food.image || "")}" alt="${escapeHtml(food.name)}">
      <div class="best-seller-overlay">
        <span>BÃ¡n cháº¡y</span>
        <h3>${escapeHtml(food.name)}</h3>
        <p>${renderRatingLabel(food.rating, food.reviewCount)} â€¢ ÄÃ£ bÃ¡n ${Number(food.soldCount || 0)}</p>
      </div>
    </article>
  `;
}

function renderHomeFoodSections() {
  const bestSellerBox = document.getElementById("homeBestSellers");
  const sectionBox = document.getElementById("homeFoodSections");

  if (!bestSellerBox && !sectionBox) return;

  if (!foods.length) {
    if (bestSellerBox) bestSellerBox.innerHTML = "<p>ChÆ°a cÃ³ mÃ³n Äƒn.</p>";
    if (sectionBox) sectionBox.innerHTML = "<p>ChÆ°a cÃ³ mÃ³n Äƒn.</p>";
    return;
  }

  if (bestSellerBox) {
    const bestSellers = [...foods]
      .filter(food => Number(food.soldCount || 0) > 0)
      .sort((first, second) => Number(second.soldCount || 0) - Number(first.soldCount || 0) || Number(second.id) - Number(first.id))
      .slice(0, 5);

    if (!bestSellers.length) {
      bestSellerBox.innerHTML = "<p>ChÆ°a cÃ³ mÃ³n nÃ o phÃ¡t sinh lÆ°á»£t bÃ¡n.</p>";
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
          <a href="menu.html?category=${encodeURIComponent(group.items[0]?.subcategory || group.items[0]?.category || "all")}">Xem táº¥t cáº£</a>
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
        <header class="review-list-head">
          <div>
            <strong>${escapeHtml(customerName)}</strong>
            <small>${escapeHtml(formatReviewDate(review.createdAt))}</small>
          </div>
          <span class="review-list-stars">${renderStarText(review.rating)}</span>
        </header>
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
      <label>
        <span>S&#7889; sao</span>
        <select data-review-filter="rating">
          <option value="all" ${state.rating === "all" ? "selected" : ""}>T&#7845;t c&#7843;</option>
          ${[5, 4, 3, 2, 1].map(star => `<option value="${star}" ${String(state.rating) === String(star) ? "selected" : ""}>${star} sao</option>`).join("")}
        </select>
      </label>
      <label>
        <span>M&oacute;n &#259;n</span>
        <select data-review-filter="food">
          ${getReviewFoodOptions(state.food, options)}
        </select>
      </label>
      <label>
        <span>S&#7855;p x&#7871;p</span>
        <select data-review-filter="sort">
          <option value="newest" ${state.sort === "newest" ? "selected" : ""}>M&#7899;i nh&#7845;t</option>
          <option value="oldest" ${state.sort === "oldest" ? "selected" : ""}>C&#361; nh&#7845;t</option>
        </select>
      </label>
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
    ? `
      ${pageReviews.map(review => renderReviewListCard(review, options)).join("")}
      ${renderReviewPagination(totalPages, state.page)}
    `
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
    return `<span class="order-review-done">ÄÃ£ Ä‘Ã¡nh giÃ¡</span>`;
  }

  const panelId = `review-panel-${order.id}-${item.food_id}`;

  return `
    <div class="order-review">
      <button type="button" class="order-review-toggle" onclick="toggleOrderReviewForm('${panelId}')">ÄÃ¡nh giÃ¡</button>
      <form id="${panelId}" class="order-review-form" onsubmit="submitFoodReview(event, ${order.id}, ${item.food_id})" hidden>
        <fieldset class="order-review-stars" aria-label="Chá»n sá»‘ sao">
          <legend>Sá»‘ sao <small>báº¯t buá»™c</small></legend>
          <div class="order-review-star-options">
            ${[5, 4, 3, 2, 1].map(star => `
              <input type="radio" id="${panelId}-star-${star}" name="rating" value="${star}" required>
              <label for="${panelId}-star-${star}" title="${star} sao">â˜…</label>
            `).join("")}
          </div>
        </fieldset>
        <label>
          <span>Nháº­n xÃ©t</span>
          <textarea name="comment" rows="3" maxlength="1000" placeholder="Báº¡n cÃ³ thá»ƒ Ä‘á»ƒ trá»‘ng náº¿u chá»‰ muá»‘n cháº¥m sao."></textarea>
        </label>
        <div class="order-review-actions">
          <button type="submit" class="btn">Gá»­i Ä‘Ã¡nh giÃ¡</button>
          <button type="button" class="btn muted-btn" onclick="toggleOrderReviewForm('${panelId}', true)">Há»§y</button>
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
    showSiteToast("Vui lÃ²ng chá»n sá»‘ sao trÆ°á»›c khi gá»­i Ä‘Ã¡nh giÃ¡.", "error");
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
      throw new Error(data.message || "KhÃ´ng thá»ƒ gá»­i Ä‘Ã¡nh giÃ¡.");
    }

    showSiteToast(data.message || "ÄÃ¡nh giÃ¡ mÃ³n Äƒn thÃ nh cÃ´ng.");
    await loadFoodReviews();
    await loadOrderHistory();
  } catch (error) {
    showSiteToast(error.message || "KhÃ´ng thá»ƒ gá»­i Ä‘Ã¡nh giÃ¡.", "error");
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
}

function renderRatingBreakdown(rating = 0, reviewCount = 0) {
  const value = Math.max(0, Math.min(5, Number(rating) || 0));
  return [5, 4, 3, 2, 1].map(star => {
    const width = Number(reviewCount) ? Math.max(8, Math.min(96, star === 5 ? value * 18 : (6 - star) * 7)) : 0;
    return `
      <div class="food-rating-row">
        <span>${star}</span>
        <div><i style="width:${width}%"></i></div>
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
      { label: "Trang chá»§", href: "index.html" },
      { label: "Chi tiáº¿t mÃ³n Äƒn" }
    ];
  }

  if (from === "cart") {
    return [
      { label: "Giá» hÃ ng", href: "cart.html" },
      { label: "Chi tiáº¿t mÃ³n Äƒn" }
    ];
  }

  return [
    { label: rootLabel, href: `menu.html?category=${encodeURIComponent(food.category || "all")}` },
    { label: categoryLabel, href: `menu.html?category=${encodeURIComponent(categoryValue)}` },
    { label: "Chi tiáº¿t mÃ³n Äƒn" }
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
      <button type="button" class="food-detail-close" aria-label="ÄÃ³ng">&times;</button>
      <div class="food-detail-main">
        <div class="food-detail-gallery">
          <img class="food-detail-image" src="${escapeHtml(image)}" alt="${escapeHtml(food.name)}">
          <div class="food-detail-thumbs" aria-label="áº¢nh mÃ³n Äƒn">
            <button type="button" class="active"><img src="${escapeHtml(image)}" alt="${escapeHtml(food.name)}"></button>
            <button type="button"><img src="${escapeHtml(image)}" alt="${escapeHtml(food.name)}"></button>
            <button type="button"><img src="${escapeHtml(image)}" alt="${escapeHtml(food.name)}"></button>
          </div>
        </div>
        <div class="food-detail-info">
          <span class="food-detail-category">${escapeHtml(category)}</span>
          <h2 id="foodDetailTitle">${escapeHtml(food.name)}</h2>
          <div class="food-detail-stats">
            <span class="food-detail-stars">${renderStarText(rating)}</span>
            <span>${rating.toFixed(1)} sao</span>
            <span>${sold} lÆ°á»£t mua</span>
            <span>${reviewCount} Ä‘Ã¡nh giÃ¡</span>
          </div>
          <strong class="food-detail-price">${formatMoney(food.price)}</strong>
          <p>${escapeHtml(food.desc || "FoodHub Ä‘ang cáº­p nháº­t mÃ´ táº£ chi tiáº¿t cho mÃ³n Äƒn nÃ y.")}</p>
          <div class="food-detail-options">
            <h3>TÃ¹y chá»n thÃªm</h3>
            <label><input type="checkbox" disabled> ThÃªm phÃ´ mai <span>+15.000Ä‘</span></label>
            <label><input type="checkbox" disabled> ThÃªm topping <span>+25.000Ä‘</span></label>
            <label><input type="checkbox" disabled> KhÃ´ng hÃ nh tÃ¢y <span>Miá»…n phÃ­</span></label>
          </div>
          <div class="food-detail-actions">
            <div class="food-detail-qty">
              <button type="button" data-food-qty-step="-1" ${stock <= 0 ? "disabled" : ""}>-</button>
              <input type="number" min="1" max="${Math.max(stock, 1)}" value="1" data-food-qty="${food.id}" ${stock <= 0 ? "disabled" : ""}>
              <button type="button" data-food-qty-step="1" ${stock <= 0 ? "disabled" : ""}>+</button>
            </div>
            <button type="button" class="btn food-detail-add" onclick="addToCart(${food.id})" ${stock <= 0 ? "disabled" : ""}>${stock > 0 ? "ThÃªm vÃ o giá» hÃ ng" : "Háº¿t hÃ ng"}</button>
          </div>
        </div>
      </div>
      <section class="food-detail-reviews">
        <h3>ÄÃ¡nh giÃ¡ & Nháº­n xÃ©t</h3>
        <div class="food-review-summary">
          <div class="food-review-score">
            <strong>${rating.toFixed(1)}</strong>
            <span>${renderStarText(rating)}</span>
            <small>Dá»±a trÃªn ${reviewCount} Ä‘Ã¡nh giÃ¡</small>
          </div>
          <div class="food-rating-bars">${renderRatingBreakdown(rating, reviewCount)}</div>
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
        <h1>KhÃ´ng tÃ¬m tháº¥y mÃ³n Äƒn</h1>
        <p>MÃ³n Äƒn cÃ³ thá»ƒ Ä‘Ã£ bá»‹ áº©n hoáº·c Ä‘Æ°á»ng dáº«n khÃ´ng cÃ²n há»£p lá»‡.</p>
        <a class="btn" href="menu.html">Quay láº¡i thá»±c Ä‘Æ¡n</a>
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
            <div class="food-detail-thumbs" aria-label="áº¢nh mÃ³n Äƒn">
              <button type="button" class="active"><img src="${escapeHtml(image)}" alt="${escapeHtml(food.name)}"></button>
              <button type="button"><img src="${escapeHtml(image)}" alt="${escapeHtml(food.name)}"></button>
              <button type="button"><img src="${escapeHtml(image)}" alt="${escapeHtml(food.name)}"></button>
            </div>
          </div>
          <div class="food-detail-info">
            <span class="food-detail-category">${escapeHtml(category)}</span>
            <h1>${escapeHtml(food.name)}</h1>
            <div class="food-detail-stats">
              <span class="food-detail-stars">${renderStarText(rating)}</span>
              <span>${rating.toFixed(1)} sao</span>
              <span>${sold} lÆ°á»£t mua</span>
              <span>${reviewCount} Ä‘Ã¡nh giÃ¡</span>
            </div>
            <strong class="food-detail-price">${formatMoney(food.price)}</strong>
            <p>${escapeHtml(food.desc || "FoodHub Ä‘ang cáº­p nháº­t mÃ´ táº£ chi tiáº¿t cho mÃ³n Äƒn nÃ y.")}</p>
            <div class="food-detail-actions">
              <div class="food-detail-qty">
                <button type="button" data-food-qty-step="-1" ${stock <= 0 ? "disabled" : ""}>-</button>
                <input type="number" min="1" max="${Math.max(stock, 1)}" value="1" data-food-qty="${food.id}" ${stock <= 0 ? "disabled" : ""}>
                <button type="button" data-food-qty-step="1" ${stock <= 0 ? "disabled" : ""}>+</button>
              </div>
              <button type="button" class="btn food-detail-add" onclick="addToCart(${food.id})" ${stock <= 0 ? "disabled" : ""}>${stock > 0 ? "ThÃªm vÃ o giá» hÃ ng" : "Háº¿t hÃ ng"}</button>
            </div>
          </div>
        </div>
        <section class="food-detail-reviews">
          <h3>ÄÃ¡nh giÃ¡ & Nháº­n xÃ©t</h3>
          <div class="food-review-summary">
            <div class="food-review-score">
              <strong>${rating.toFixed(1)}</strong>
              <span>${renderStarText(rating)}</span>
              <small>Dá»±a trÃªn ${reviewCount} Ä‘Ã¡nh giÃ¡</small>
            </div>
            <div class="food-rating-bars">${renderRatingBreakdown(rating, reviewCount)}</div>
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
      box.innerHTML = `<span class="announcement-empty">Hien chÆ°a cÃ³ thÃ´ng bÃ¡o má»›i.</span>`;
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
    box.innerHTML = `<span class="announcement-empty">KhÃ´ng thá»ƒ táº£i thÃ´ng bÃ¡o.</span>`;
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
    <a class="floating-ad floating-ad-left" data-floating-ad-slot="left" aria-label="Quáº£ng cÃ¡o bÃªn trÃ¡i" hidden></a>
    <a class="floating-ad floating-ad-right" data-floating-ad-slot="right" aria-label="Quáº£ng cÃ¡o bÃªn pháº£i" hidden></a>
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

  slot.innerHTML = `<img src="${escapeHtml(advertisement.image)}" alt="${escapeHtml(advertisement.title || "Quáº£ng cÃ¡o FoodHub")}">`;
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
    console.error("Lá»—i táº£i quáº£ng cÃ¡o:", error);
  }
}

function getAnnouncementStatusText(status) {
  const labels = {
    active: "Äang hoáº¡t Ä‘á»™ng",
    hidden: "ÄÃ£ áº©n",
    expired: "Háº¿t háº¡n",
    scheduled: "Sáº¯p hiá»ƒn thá»‹"
  };

  return labels[status] || status || "KhÃ´ng rÃµ";
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
    list.innerHTML = `<p>KhÃ´ng cÃ³ thÃ´ng bÃ¡o phÃ¹ há»£p.</p>`;
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
          <dt>NgÃ y Ä‘Äƒng</dt>
          <dd>${formatDateTime(item.published_at)}</dd>
        </div>
        <div>
          <dt>Háº¿t hiá»‡u lá»±c</dt>
          <dd>${item.expires_at ? formatDateTime(item.expires_at) : "KhÃ´ng giá»›i háº¡n"}</dd>
        </div>
      </dl>
    </article>
  `).join("");

  if (!pager) return;

  pager.innerHTML = `
    <span>Äang hiá»ƒn thá»‹ tá»« ${from} Ä‘áº¿n ${to} cá»§a ${total} thÃ´ng bÃ¡o</span>
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

  list.innerHTML = `<p>Äang táº£i thÃ´ng bÃ¡o...</p>`;

  try {
    const response = await fetch(`${ANNOUNCEMENTS_API}/archive`);
    const announcements = await response.json();

    if (!response.ok) {
      throw new Error(announcements.message || "KhÃ´ng thá»ƒ táº£i thÃ´ng bÃ¡o.");
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
    foodList.innerHTML = "<p>KhÃ´ng tÃ¬m tháº¥y mÃ³n Äƒn phÃ¹ há»£p.</p>";
    return;
  }

  foodList.innerHTML = filteredFoods.map(food => {
    const stock = Number(food.stockQuantity || 0);
    const quantityInput = `<input type="number" min="1" max="${Math.max(stock, 1)}" value="1" data-food-qty="${food.id}" ${stock <= 0 ? "disabled" : ""}>`;
    const buttonLabel = stock > 0 ? "ThÃªm vÃ o giá»" : "Háº¿t hÃ ng";
    const stockLabel = stock > 0 ? `CÃ²n ${stock}` : "Háº¿t hÃ ng";

    return `
      <div class="food-card" data-open-food-detail="${food.id}" data-detail-from="menu" data-detail-category="${escapeHtml(food.subcategory || food.category || getMenuCategoryValue())}">
        <a class="food-card-detail-link" href="${getFoodDetailUrl(food.id, { from: "menu", category: food.subcategory || food.category || getMenuCategoryValue() })}" aria-label="Xem chi tiáº¿t ${escapeHtml(food.name)}">
          <img src="${escapeHtml(food.image || "")}" alt="${escapeHtml(food.name)}">
          <h3>${escapeHtml(food.name)}</h3>
          <p>${escapeHtml(food.desc || "")}</p>
        </a>
        <div class="food-price-row">
          <span>${formatMoney(food.price)}</span>
          <span class="food-stock-badge ${stock > 0 ? "in-stock" : "out-stock"}">${stockLabel}</span>
        </div>
        <div class="food-qty-row">
          <label for="food-qty-${food.id}">Sá»‘ lÆ°á»£ng</label>
          ${quantityInput}
        </div>
        <button type="button" onclick="addToCart(${food.id})" ${stock <= 0 ? "disabled" : ""}>${buttonLabel}</button>
      </div>
    `;
  }).join("");
}

function addToCart(foodId) {
  if (!isLoggedIn()) {
    requireLogin("Vui lÃ²ng Ä‘Äƒng nháº­p Ä‘á»ƒ thÃªm mÃ³n vÃ o giá» hÃ ng.", "menu.html");
    return;
  }

  const food = foods.find(item => String(item.id) === String(foodId));

  if (!food) {
    showSiteToast("KhÃ´ng tÃ¬m tháº¥y mÃ³n Äƒn.", "error");
    return;
  }

  const stock = Number(food.stockQuantity || 0);
  if (stock <= 0) {
    showSiteToast("MÃ³n nÃ y hiá»‡n Ä‘Ã£ háº¿t hÃ ng.", "error");
    return;
  }

  const requestedInput = document.querySelector(`[data-food-qty="${foodId}"]`);
  const requestedQuantity = Math.max(1, Math.round(Number(requestedInput?.value || 1)));
  const cappedQuantity = Math.min(requestedQuantity, stock);

  if (requestedQuantity > stock) {
    showSiteToast(`Chá»‰ cÃ²n ${stock} pháº§n cho mÃ³n ${food.name}.`, "error");
    if (requestedInput) {
      requestedInput.value = String(stock);
    }
    return;
  }

  const itemInCart = cart.find(item => item.id === foodId);
  const totalRequestedQuantity = (itemInCart?.quantity || 0) + cappedQuantity;

  if (totalRequestedQuantity > stock) {
    showSiteToast(`Báº¡n Ä‘ang Ä‘áº·t quÃ¡ sá»‘ lÆ°á»£ng cÃ²n cá»§a ${food.name}.`, "error");
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
  showSiteToast(`ÄÃ£ thÃªm ${food.name} x ${cappedQuantity} vÃ o giá» hÃ ng`);
}

function renderCart() {
  const cartItems = document.getElementById("cart-items");
  const totalPrice = document.getElementById("total-price");
  const checkoutSummary = document.getElementById("checkoutSummary");

  updateCartCount();

  if (!cartItems || !totalPrice) return;

  if (cart.length === 0) {
    cartItems.innerHTML = `<p class="empty-cart">Giá» hÃ ng Ä‘ang trá»‘ng.</p>`;
    totalPrice.textContent = "0Ä‘";
    if (checkoutSummary) {
      checkoutSummary.innerHTML = `
        <div><span>Tá»•ng máº·t hÃ ng</span><strong>0</strong></div>
        <div><span>Táº¡m tÃ­nh</span><strong>0Ä‘</strong></div>
        <div><span>PhÃ­ giao hÃ ng</span><strong>ChÆ°a Ã¡p dá»¥ng</strong></div>
        <div class="checkout-summary-total"><span>Tá»•ng thanh toÃ¡n</span><strong>0Ä‘</strong></div>
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
        <button class="remove-btn" onclick="removeItem(${item.id})">XÃ³a</button>
      </div>
    `;
  }).join("");

  totalPrice.textContent = formatMoney(total);

  if (checkoutSummary) {
    checkoutSummary.innerHTML = `
      <div><span>Tá»•ng máº·t hÃ ng</span><strong>${totalQuantity}</strong></div>
      <div><span>Táº¡m tÃ­nh</span><strong>${formatMoney(total)}</strong></div>
      <div><span>PhÃ­ giao hÃ ng</span><strong>ChÆ°a Ã¡p dá»¥ng</strong></div>
      <div class="checkout-summary-total"><span>Tá»•ng thanh toÃ¡n</span><strong>${formatMoney(total)}</strong></div>
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
    showSiteToast(`Sá»‘ lÆ°á»£ng tá»‘i Ä‘a cÃ²n láº¡i cho mÃ³n nÃ y lÃ  ${stock}.`, "error");
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
    "970424": "Shinhan Bank Viá»‡t Nam"
  };

  return bankNames[String(bankCode || "")] || bankCode || "NgÃ¢n hÃ ng";
}

async function cancelActiveQrPayment(reason = "manual") {
  if (!activeQrPayment?.orderId) return;

  const orderId = activeQrPayment.orderId;
  activeQrPayment = null;

  if (qrPaymentCountdownTimer) {
    clearInterval(qrPaymentCountdownTimer);
    qrPaymentCountdownTimer = null;
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
    console.error("KhÃ´ng há»§y Ä‘Æ°á»£c giao dá»‹ch QR:", error);
  }
}

function closeQrPaymentDialog({ cancel = true } = {}) {
  const dialog = document.getElementById("qrPaymentDialog");

  if (dialog) dialog.remove();
  document.body.classList.remove("qr-payment-open");
  if (cancel) cancelActiveQrPayment("closed");
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
          <h2 id="qrPaymentTitle">Thanh toÃ¡n QR Ä‘Æ¡n #${order.id}</h2>
          <p>KhÃ´ng rá»i trang trong lÃºc giao dá»‹ch Ä‘ang chá» xá»­ lÃ½.</p>
        </div>
        <button type="button" class="qr-payment-close" aria-label="Há»§y thanh toÃ¡n">Ã—</button>
      </div>
      <img class="qr-payment-image" src="${escapeHtml(session.qrUrl)}" alt="MÃ£ QR thanh toÃ¡n Ä‘Æ¡n ${order.id}">
      <div class="qr-payment-info">
        <div><span>Sá»‘ tiá»n</span><strong>${formatMoney(session.amount)}</strong></div>
        <div><span>NgÃ¢n hÃ ng</span><strong>${escapeHtml(getBankDisplayName(session.bankCode))}</strong></div>
        <div><span>Sá»‘ tÃ i khoáº£n</span><strong>${escapeHtml(session.bankAccountNo)}</strong></div>
        <div><span>Chá»§ tÃ i khoáº£n</span><strong>${escapeHtml(session.bankAccountName)}</strong></div>
        <div><span>Ná»™i dung</span><strong>${escapeHtml(session.transferContent)}</strong></div>
        <div><span>Thá»i gian cÃ²n láº¡i</span><strong id="qrPaymentCountdown">${formatCountdown(session.expiresInSeconds || 600)}</strong></div>
      </div>
      <div class="qr-payment-actions">
        <button type="button" class="social-link-btn" data-qr-cancel>Há»§y giao dá»‹ch</button>
        <a class="btn" href="track.html">TÃ´i Ä‘Ã£ chuyá»ƒn khoáº£n</a>
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
      showSiteToast("Giao dá»‹ch QR Ä‘Ã£ háº¿t háº¡n vÃ  Ä‘Æ°á»£c há»§y.", "error");
    }
  }, 1000);

  dialog.querySelector(".qr-payment-close")?.addEventListener("click", () => closeQrPaymentDialog({ cancel: true }));
  dialog.querySelector("[data-qr-cancel]")?.addEventListener("click", () => {
    closeQrPaymentDialog({ cancel: true });
    showSiteToast("ÄÃ£ há»§y giao dich QR.");
  });
  dialog.querySelector("a.btn")?.addEventListener("click", () => {
    activeQrPayment = null;
    if (qrPaymentCountdownTimer) {
      clearInterval(qrPaymentCountdownTimer);
      qrPaymentCountdownTimer = null;
    }
  });
}

async function submitOrder(event) {
  event.preventDefault();

  if (!isLoggedIn()) {
    requireLogin("Vui lÃ²ng Ä‘Äƒng nháº­p Ä‘á»ƒ Ä‘áº·t hÃ ng.", "cart.html");
    return;
  }

  if (cart.length === 0) {
    showSiteToast("Giá» hÃ ng Ä‘ang trá»‘ng. Vui lÃ²ng chá»n mÃ³n trÆ°á»›c.", "error");
    return;
  }

  const stockIssue = foods.length
    ? cart.some(item => {
        const food = foods.find(entry => entry.id === item.id);
        return !food || Number(food.stockQuantity || 0) < Number(item.quantity);
      })
    : false;

  if (stockIssue) {
    showSiteToast("Má»™t sá»‘ mÃ³n trong giá» hÃ ng vÆ°á»£t quÃ¡ sá»‘ lÆ°á»£ng cÃ²n. Vui lÃ²ng cáº­p nháº­t láº¡i.", "error");
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
    showSiteToast("Vui lÃ²ng cáº­p nháº­t Ä‘áº§y Ä‘á»§ thÃ´ng tin giao hÃ ng trÆ°á»›c khi Ä‘áº·t hÃ ng.", "error");
    setCheckoutAddressRequiredState(false, "Báº¡n cáº§n cáº­p nháº­t Ä‘áº§y Ä‘á»§ Ä‘á»‹a chá»‰ giao hÃ ng trÆ°á»›c khi Ä‘áº·t hÃ ng.");
    return;
  }

  if (!["cod", "qr", "wallet"].includes(paymentMethod)) {
    showSiteToast("PhÆ°Æ¡ng thá»©c thanh toÃ¡n khÃ´ng há»£p lá»‡.", "error");
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Äang gá»­i Ä‘Æ¡n...";

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
      requireLogin(data.message || "PhiÃªn Ä‘Äƒng nháº­p da háº¿t háº¡n. Vui lÃ²ng Ä‘Äƒng nháº­p lai.", "cart.html");
      return;
    }

    if (!response.ok) {
      showSiteToast(data.message || "KhÃ´ng thá»ƒ Ä‘áº·t hÃ ng. Vui lÃ²ng thá»­ láº¡i.", "error");
      return;
    }

    cart = [];
    saveCart();
    renderCart();
    document.getElementById("orderForm").reset();

    if (data.order?.paymentMethod === "qr" && data.order?.paymentSession) {
      showQrPaymentDialog(data.order);
      showSiteToast("ÄÃ£ táº¡o mÃ£ QR. Vui lÃ²ng hoÃ n táº¥t thanh toan.");
      return;
    }
    showSiteToast("Äáº·t hÃ ng thÃ nh cÃ´ng. Äang chuyá»ƒn sang trang tra cá»©u...");

    setTimeout(() => {
      window.location.href = "track.html";
    }, 900);
  } catch (error) {
    showSiteToast("KhÃ´ng káº¿t ná»‘i Ä‘Æ°á»£c server Ä‘áº·t hÃ ng.", "error");
    console.error(error);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "XÃ¡c nháº­n Ä‘áº·t hÃ ng";
  }
}

async function trackOrder(event) {
  if (event) event.preventDefault();

  const input = document.getElementById("trackOrderId");
  const resultBox = document.getElementById("track-result");

  if (!input || !resultBox || !input.value) return;

  resultBox.innerHTML = "<p>Äang tra cá»©u Ä‘Æ¡n hÃ ng...</p>";

  try {
    const response = await fetch(`${ORDERS_API}/${input.value}`);
    const data = await response.json();

    if (!response.ok) {
      resultBox.innerHTML = `<p>${data.message || "KhÃ´ng tÃ¬m tháº¥y Ä‘Æ¡n hÃ ng."}</p>`;
      return;
    }

    resultBox.innerHTML = `
      <div class="track-card">
        <h3>ÄÆ¡n #${data.id} - ${formatMoney(data.total_price)}</h3>
        <p><strong>Tráº¡ng thÃ¡i:</strong> ${getOrderStatusLabel(data.status)}</p>
        <p><strong>KhÃ¡ch hÃ ng:</strong> ${data.customer_name}</p>
        <p><strong>Sá»‘ Ä‘iá»‡n thoáº¡i:</strong> ${data.phone}</p>
        <p><strong>Äá»‹a chá»‰:</strong> ${data.address}</p>
        <p><strong>Thanh toÃ¡n:</strong> ${getPaymentMethodLabel(data.payment_method)} - ${getPaymentStatusLabel(data.payment_status)}</p>
        ${data.note ? `<p><strong>Ghi chÃº:</strong> ${data.note}</p>` : ""}
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
    resultBox.innerHTML = "<p>KhÃ´ng káº¿t ná»‘i Ä‘Æ°á»£c server.</p>";
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
    requireLogin("Vui lÃ²ng Ä‘Äƒng nháº­p Ä‘á»ƒ xem lá»‹ch sá»­ Ä‘Æ¡n hÃ ng.", "track.html");
    return;
  }

  const params = new URLSearchParams();
  const searchValue = searchInput?.value.trim();
  const dateValue = dateInput?.value;

  if (searchValue) params.set("q", searchValue);
  if (dateValue) params.set("date", dateValue);

  resultBox.innerHTML = "<p>Äang táº£i lá»‹ch sá»­ Ä‘Æ¡n hÃ ng...</p>";

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
      requireLogin(data.message || "PhiÃªn Ä‘Äƒng nháº­p da háº¿t háº¡n. Vui lÃ²ng Ä‘Äƒng nháº­p lai.", "track.html");
      return;
    }

    if (!response.ok) {
      resultBox.innerHTML = `<p>${data.message || "KhÃ´ng thá»ƒ táº£i lá»‹ch sá»­ Ä‘Æ¡n hÃ ng."}</p>`;
      return;
    }

    await loadFoodReviews();
    renderOrderHistory(data);
  } catch (error) {
    resultBox.innerHTML = "<p>KhÃ´ng káº¿t ná»‘i Ä‘Æ°á»£c server.</p>";
    console.error(error);
  }
}

function renderOrderHistory(orders) {
  const resultBox = document.getElementById("track-result");

  if (!resultBox) return;

  if (!orders.length) {
    resultBox.innerHTML = `
      <div class="empty-history">
        <h3>ChÆ°a cÃ³ Ä‘Æ¡n hÃ ng phÃ¹ há»£p</h3>
        <p>Báº¡n cÃ³ thá»ƒ quay láº¡i thá»±c Ä‘Æ¡n Ä‘á»ƒ Ä‘áº·t mÃ³n hoáº·c thá»­ bá»™ lá»c khÃ¡c.</p>
        <a href="menu.html" class="btn">Dat mon ngay</a>
      </div>
    `;
    return;
  }

  resultBox.innerHTML = orders.map(order => `
    <article class="track-card order-card">
      <div class="order-history-top">
        <div>
          <p class="order-code">ÄÆ¡n hÃ ng #${order.id}</p>
          <h3>${formatMoney(order.total_price)}</h3>
          <span>${new Date(order.created_at).toLocaleString("vi-VN")}</span>
        </div>
        <span class="status-pill">${getOrderStatusLabel(order.status)}</span>
      </div>

      <div class="history-info">
        <div>
          <small>NgÆ°á»i nháº­n</small>
          <p>${escapeHtml(order.customer_name)} - ${escapeHtml(order.phone)}</p>
        </div>
        <div>
          <small>Äá»‹a chá»‰ giao hÃ ng</small>
          <p>${escapeHtml(order.address)}</p>
        </div>
        <div>
          <small>Thanh toÃ¡n</small>
          <p>${getPaymentMethodLabel(order.payment_method)} - ${getPaymentStatusLabel(order.payment_status)}</p>
        </div>
        ${order.note ? `<div><small>Ghi chÃº</small><p>${escapeHtml(order.note)}</p></div>` : ""}
      </div>

      <div class="history-items">
        ${order.items.map(item => `
          <div class="track-line order-item-row">
            <div class="order-item-main">
              <span>${escapeHtml(item.food_name)}</span>
              <small>Sá»‘ lÆ°á»£ng: ${Number(item.quantity)}</small>
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
    pending: "Chá» xÃ¡c nháº­n",
    confirmed: "ÄÃ£ xÃ¡c nháº­n",
    delivering: "Äang giao",
    done: "HoÃ n táº¥t",
    cancelled: "ÄÃ£ há»§y",
    pending_payment: "Chá» thanh toÃ¡n"
  };

  return labels[status] || status;
}

function getPaymentMethodLabel(method) {
  const labels = {
    cod: "Thanh toÃ¡n khi nháº­n hÃ ng",
    qr: "Thanh toÃ¡n báº±ng mÃ£ QR",
    wallet: "Tiá»n trong tÃ i khoáº£n"
  };

  return labels[method] || "ChÆ°a xÃ¡c Ä‘á»‹nh";
}

function getPaymentStatusLabel(status) {
  const labels = {
    unpaid: "ChÆ°a thanh toÃ¡n",
    pending: "Chá» thanh toÃ¡n",
    paid: "ÄÃ£ thanh toÃ¡n",
    failed: "Thanh toÃ¡n tháº¥t báº¡i",
    refunded: "ÄÃ£ hoÃ n tiá»n"
  };

  return labels[status] || "ChÆ°a xÃ¡c Ä‘á»‹nh";
}

function renderUser() {
  const userArea = document.getElementById("user-area");

  if (!userArea) return;

  const user = getCurrentUser();

  if (user) {
    const isAdmin = String(user.role || "").toUpperCase() === "ADMIN";
    const menuLink = isAdmin
      ? `<a href="admin.html?section=overview" class="account-menu-link">Quáº£n trá»‹</a>`
      : `<a href="profile.html" class="account-menu-link">Há»“ sÆ¡ cÃ¡ nhÃ¢n</a>`;
    const initial = escapeHtml(String(user.fullname || "U").trim().charAt(0).toUpperCase() || "U");
    const avatarSource = String(user.avatar || "").trim() || getDefaultAvatarDataUrl();
    const avatarContent = `<img src="${escapeHtml(avatarSource)}" alt="${escapeHtml(user.fullname || "FoodHub User")}" onerror="this.remove(); this.parentElement.textContent='${initial}';">`;

    userArea.innerHTML = `
      <div class="account-menu">
        <button type="button" class="account-toggle" aria-label="Má»Ÿ tÃ i khoáº£n" aria-expanded="false">
          <span class="account-avatar">${avatarContent}</span>
        </button>
        <div class="account-dropdown">
          <div class="account-summary">
            <strong>${escapeHtml(user.fullname)}</strong>
            <small>${escapeHtml(isAdmin ? "Quáº£n trá»‹ viÃªn" : "KhÃ¡ch hÃ ng")}</small>
          </div>
          ${menuLink}
          <button type="button" class="account-menu-link danger" onclick="logout()">ÄÄƒng xuáº¥t</button>
        </div>
      </div>
    `;
  } else {
    userArea.innerHTML = `
      <a href="login.html" class="header-action primary">ÄÄƒng nháº­p</a>
      <a href="register.html" class="header-action secondary">ÄÄƒng kÃ½</a>
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
  showSiteToast("ÄÃ£ Ä‘Äƒng xuáº¥t");

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
  requireLogin("Vui lÃ²ng Ä‘Äƒng nháº­p Ä‘á»ƒ tiáº¿p tá»¥c.", target);
  return false;
}

function initSupportWidget() {
  if (document.getElementById("support-widget")) return;

  const robotIcon = getFoodHubRobotIcon(true);

  const widget = document.createElement("div");
  widget.id = "support-widget";
  widget.className = "support-widget";
  widget.innerHTML = `
    <div class="support-panel" aria-label="Kenh há»— trá»£ FoodHub">
      <a href="https://zalo.me/" target="_blank" rel="noopener" class="support-link zalo">
        <span>Z</span>
        <strong>Zalo</strong>
      </a>
      <a href="https://m.me/" target="_blank" rel="noopener" class="support-link messenger">
        <span>f</span>
        <strong>Messenger</strong>
      </a>
      <a href="tel:0123456789" class="support-link phone">
        <span>â˜Ž</span>
        <strong>Hotline</strong>
      </a>
      <a href="mailto:foodhub@gmail.com" class="support-link email">
        <span>@</span>
        <strong>Email</strong>
      </a>
    </div>
    <div class="chat-bubble-tip" hidden>
      <strong>FoodHub Ä‘Ã¢y!</strong>
      <span>Báº¡n cÃ³ cáº§n tÃ´i há»— trá»£ gÃ¬ khÃ´ng?</span>
    </div>
    <button type="button" class="support-toggle" aria-label="Mo há»— trá»£" aria-expanded="false">
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
    <div class="support-panel chat-panel" aria-label="Hop chat há»— trá»£ FoodHub">
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
          <button type="button" class="chat-menu" aria-label="Menu há»— trá»£">
            <span></span><span></span><span></span>
          </button>
          <button type="button" class="chat-close" aria-label="ÄÃ³ng há»— trá»£">&times;</button>
        </div>
      </div>
      <div class="chat-quick-menu" hidden>
        <a href="menu.html">Xem thá»±c Ä‘Æ¡n</a>
        <a href="track.html">Lá»‹ch sá»­ Ä‘Æ¡n hÃ ng</a>
        <a href="contact.html">LiÃªn há»‡ FoodHub</a>
      </div>
      <div class="chat-messages" aria-live="polite">
        <div class="chat-message bot">Xin chÃ o ${escapeHtml(displayName)}, FoodHub cÃ³ thá»ƒ há»— trá»£ gÃ¬ cho báº¡n?</div>
        <div class="chat-message bot muted">ÄÃ¢y lÃ  khung chat táº¡m thá»i. Sau nÃ y mÃ¬nh sáº½ káº¿t ná»‘i dá»¯ liá»‡u há»‡ thá»‘ng Ä‘á»ƒ tráº£ lá»i tá»± Ä‘á»™ng.</div>
      </div>
      <form class="chat-form">
        <input type="file" class="chat-file" aria-label="ÄÃ­nh kÃ¨m tá»‡p" hidden>
        <div class="chat-form-main">
          <input type="text" class="chat-input" placeholder="Nháº­p ná»™i dung..." aria-label="Nháº­p tin nháº¯n há»— trá»£">
          <div class="chat-tools">
            <button type="button" class="chat-tool chat-like" aria-label="Gá»­i like">
              <svg viewBox="0 0 24 24" focusable="false">
                <path d="M7 10v10H4V10h3Zm4.2-7c.8 0 1.4.6 1.4 1.4v3.2H18c1.2 0 2 .9 1.8 2.1l-1.1 7.7c-.2 1-1 1.7-2 1.7H9V9.8l2-5.6c.2-.7.8-1.2 1.5-1.2h-1.3Z"></path>
              </svg>
            </button>
            <button type="button" class="chat-tool chat-attach" aria-label="ÄÃ­nh kÃ¨m tá»‡p">
              <svg viewBox="0 0 24 24" focusable="false">
                <path d="M18.4 11.2 11 18.6a4.2 4.2 0 0 1-6-6L14 3.7a2.9 2.9 0 0 1 4.1 4.1L9.5 16.4a1.5 1.5 0 0 1-2.1-2.1l7.5-7.5"></path>
              </svg>
            </button>
            <button type="button" class="chat-tool chat-emoji" aria-label="Chá»n biá»ƒu tÆ°á»£ng">
              <svg viewBox="0 0 24 24" focusable="false">
                <circle cx="12" cy="12" r="9"></circle>
                <circle cx="9" cy="10" r="1"></circle>
                <circle cx="15" cy="10" r="1"></circle>
                <path d="M8 14c1 1.4 2.3 2 4 2s3-.6 4-2"></path>
              </svg>
            </button>
            <button type="submit" class="chat-send" aria-label="Gá»­i tin nháº¯n">
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
      <strong>FoodHub Ä‘Ã¢y!</strong>
      <span>Báº¡n cÃ³ cáº§n tÃ´i há»— trá»£ gÃ¬ khÃ´ng?</span>
    </div>
    <button type="button" class="support-toggle" aria-label="Má»Ÿ há»— trá»£" aria-expanded="false">
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
      <div class="chat-message user file-message">ÄÃ£ Ä‘Ã­nh kÃ¨m: ${escapeHtml(file.name)}</div>
      <div class="chat-message bot muted">FoodHub Ä‘Ã£ nháº­n thÃ´ng tin tá»‡p. TÃ­nh nÄƒng gá»­i tá»‡p tháº­t sáº½ Ä‘Æ°á»£c káº¿t ná»‘i sau.</div>
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
      <div class="chat-message bot muted">Cáº£m Æ¡n ${escapeHtml(displayName)}, FoodHub Ä‘Ã£ nháº­n pháº£n há»“i cá»§a báº¡n.</div>
    `);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });

  chatForm.addEventListener("submit", event => {
    event.preventDefault();

    const message = chatInput.value.trim();
    if (!message) return;

    chatMessages.insertAdjacentHTML("beforeend", `
      <div class="chat-message user">${escapeHtml(message)}</div>
      <div class="chat-message bot muted">FoodHub Ä‘Ã£ nháº­n tin nháº¯n cá»§a báº¡n. Chá»©c nÄƒng tráº£ lá»i tá»± Ä‘á»™ng sáº½ Ä‘Æ°á»£c cáº­p nháº­t sau.</div>
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
  setCheckoutAddressRequiredState(hasCheckoutAddress, "Báº¡n cáº§n cáº­p nháº­t Ä‘á»‹a chá»‰ giao hÃ ng trong tÃ i khoáº£n trÆ°á»›c khi Ä‘áº·t hÃ ng.");

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
