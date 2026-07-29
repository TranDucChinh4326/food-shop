const API_BASE_URL = window.FOODHUB_CONFIG?.API_BASE_URL || "http://localhost:3000/api";
const API_URL = `${API_BASE_URL}/foods`;
const CATEGORIES_API = `${API_BASE_URL}/foods/categories`;
const ORDERS_API = `${API_BASE_URL}/orders`;
const ANNOUNCEMENTS_API = `${API_BASE_URL}/announcements`;
const ADVERTISEMENTS_API = `${API_BASE_URL}/advertisements`;
const AUTH_TOKEN_KEY = "foodhub_token";
const AUTH_USER_KEY = "foodhub_user";
const CART_KEY = "foodhub_cart";

let foods = [];
let publicCategories = [];
let cart = JSON.parse(sessionStorage.getItem(CART_KEY) || "[]");
let toastTimer;
let announcementTimer;
let floatingAdTimers = [];
let announcementArchive = [];
let announcementArchivePage = 1;

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
    "Quận Lê Chân": ["Phường Trại Cau", "Phường Kênh Dương", "Phường Lam Sơn", "Phường An Biên"]
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
      : `<a href="${getCategoryUrl(root.slug)}">Tat ca ${escapeHtml(root.name)}</a>`;

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
    if (!response.ok) throw new Error("Khong the tai danh muc");

    publicCategories = await response.json();
    renderPublicNavCategories();
    renderMenuCategoryOptions();
    if (foods.length) renderFoods();
  } catch (error) {
    console.error("Loi tai danh muc:", error);
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

  return {
    city: parts[0] || "",
    district: parts[1] || "",
    ward: parts[2] || "",
    detail: parts[3] || ""
  };
}

function buildAddressString(city, district, ward, detail) {
  return [city, district, ward, detail]
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
      if (!response.ok) throw new Error("Khong tai duoc danh sach tinh thanh.");

      const provinces = await response.json();
      const lookup = normalizeVietnamAddressData(Array.isArray(provinces) ? provinces : []);
      if (Object.keys(lookup).length === 0) throw new Error("Danh sach tinh thanh khong hop le.");

      ADDRESS_LOOKUP = lookup;
      sessionStorage.setItem(ADDRESS_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), lookup }));
    } catch (error) {
      console.warn(error);
      ADDRESS_LOOKUP = LEGACY_ADDRESS_LOOKUP;
      showSiteToast("Tam thoi dung danh sach dia chi du phong.", "info");
    }

    return ADDRESS_LOOKUP;
  })();

  return addressLookupPromise;
}

function refreshAddressSelectorOptions(config, selectedAddress = "") {
  const citySelect = document.getElementById(config.cityId);
  const districtSelect = document.getElementById(config.districtId);
  const wardSelect = document.getElementById(config.wardId);
  const detailInput = document.getElementById(config.detailId);

  if (!citySelect || !districtSelect || !wardSelect) return;

  const parsedAddress = parseAddressString(selectedAddress);
  const cityNames = Object.keys(ADDRESS_LOOKUP);
  setSelectOptions(citySelect, cityNames, "Chon thanh pho");

  if (cityNames.includes(parsedAddress.city)) {
    citySelect.value = parsedAddress.city;
  }

  const districtNames = Object.keys(ADDRESS_LOOKUP[citySelect.value] || {});
  setSelectOptions(districtSelect, districtNames, "Chon quan huyen");
  if (districtNames.includes(parsedAddress.district)) {
    districtSelect.value = parsedAddress.district;
  } else if (districtNames.length === 1) {
    districtSelect.value = districtNames[0];
  }

  const wardNames = ADDRESS_LOOKUP[citySelect.value]?.[districtSelect.value] || [];
  setSelectOptions(wardSelect, wardNames, "Chon phuong xa");
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
      districtId: "customerDistrict",
      wardId: "customerWard",
      detailId: "customerAddress",
      datalistId: "customerAddressSuggestions"
    },
    {
      cityId: "profileCity",
      districtId: "profileDistrict",
      wardId: "profileWard",
      detailId: "profileAddressDetail",
      datalistId: "profileAddressSuggestions"
    },
    {
      cityId: "addressBookCity",
      districtId: "addressBookDistrict",
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
      districtId: "customerDistrict",
      wardId: "customerWard",
      detailId: "customerAddress",
      datalistId: "customerAddressSuggestions"
    },
    {
      cityId: "profileCity",
      districtId: "profileDistrict",
      wardId: "profileWard",
      detailId: "profileAddressDetail",
      datalistId: "profileAddressSuggestions"
    },
    {
      cityId: "addressBookCity",
      districtId: "addressBookDistrict",
      wardId: "addressBookWard",
      detailId: "addressBookDetail",
      datalistId: "addressBookSuggestions"
    }
  ];

  addressConfigs.forEach(config => {
    const citySelect = document.getElementById(config.cityId);
    const districtSelect = document.getElementById(config.districtId);
    const wardSelect = document.getElementById(config.wardId);
    const detailInput = document.getElementById(config.detailId);
    const datalist = document.getElementById(config.datalistId);

    if (!citySelect || !districtSelect || !wardSelect) return;
    if (citySelect.dataset.addressSelectorInitialized === "true") return;

    citySelect.dataset.addressSelectorInitialized = "true";
    refreshAddressSelectorOptions(config);

    if (datalist) {
      datalist.innerHTML = DEFAULT_ADDRESS_SUGGESTIONS.map(suggestion => `<option value="${escapeHtml(suggestion)}"></option>`).join("");
    }

    citySelect.addEventListener("change", () => {
      const districts = Object.keys(ADDRESS_LOOKUP[citySelect.value] || {});
      setSelectOptions(districtSelect, districts, "Chon quan huyen");
      if (districts.length === 1) {
        districtSelect.value = districts[0];
        setSelectOptions(wardSelect, ADDRESS_LOOKUP[citySelect.value]?.[districtSelect.value] || [], "Chon phuong xa");
      } else {
        setSelectOptions(wardSelect, [], "Chon phuong xa");
      }
      if (detailInput) detailInput.value = "";
    });

    districtSelect.addEventListener("change", () => {
      setSelectOptions(wardSelect, ADDRESS_LOOKUP[citySelect.value]?.[districtSelect.value] || [], "Chon phuong xa");
    });
  });
}

function fillAddressForm(addressConfig, userAddress) {
  refreshAddressSelectorOptions(addressConfig, userAddress);
}

async function loadCheckoutSavedAddresses() {
  const select = document.getElementById("savedAddressSelect");
  const wrap = document.getElementById("savedAddressSelectWrap");

  if (!select || !wrap || !isLoggedIn()) return;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/addresses`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`
      }
    });
    const data = await response.json();

    if (!response.ok || !Array.isArray(data.addresses) || data.addresses.length === 0) return;

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
  } catch (error) {
    console.error("Khong tai duoc dia chi da luu:", error);
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
    districtId: "customerDistrict",
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
      stockQuantity: Number(food.stock_quantity ?? food.quantity ?? 0),
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
    <a class="floating-ad floating-ad-left" data-floating-ad-slot="left" aria-label="Quang cao ben trai" hidden></a>
    <a class="floating-ad floating-ad-right" data-floating-ad-slot="right" aria-label="Quang cao ben phai" hidden></a>
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

  slot.innerHTML = `<img src="${escapeHtml(advertisement.image)}" alt="${escapeHtml(advertisement.title || "Quang cao FoodHub")}">`;
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
    console.error("Loi tai quang cao:", error);
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
      <div class="food-card">
        <img src="${escapeHtml(food.image || "")}" alt="${escapeHtml(food.name)}">
        <h3>${escapeHtml(food.name)}</h3>
        <p>${escapeHtml(food.desc || "")}</p>
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
    requireLogin("Vui long dang nhap de them mon vao gio hang.", "menu.html");
    return;
  }

  const food = foods.find(item => item.id === foodId);

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
  const districtName = document.getElementById("customerDistrict")?.value || "";
  const wardName = document.getElementById("customerWard")?.value || "";
  const addressDetail = document.getElementById("customerAddress").value;
  const address = buildAddressString(cityName, districtName, wardName, addressDetail);
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
  const robotIcon = `
    <svg class="support-robot-icon" viewBox="0 0 64 64" focusable="false">
      <rect class="robot-face" x="13" y="18" width="38" height="32" rx="14"></rect>
      <path class="robot-antenna" d="M32 18v-7"></path>
      <circle class="robot-dot" cx="32" cy="8" r="3"></circle>
      <circle class="robot-eye" cx="25" cy="33" r="3"></circle>
      <circle class="robot-eye" cx="39" cy="33" r="3"></circle>
      <path class="robot-mouth" d="M26 42h12"></path>
    </svg>
  `;
  const widget = document.createElement("div");
  widget.id = "support-widget";
  widget.className = "support-widget";
  widget.innerHTML = `
    <div class="support-panel chat-panel" aria-label="Hop chat ho tro FoodHub">
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
          <button type="button" class="chat-menu" aria-label="Menu ho tro">
            <span></span><span></span><span></span>
          </button>
          <button type="button" class="chat-close" aria-label="Dong ho tro">&times;</button>
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
        ${robotIcon}
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
      <div class="chat-message user file-message">Da dinh kem: ${escapeHtml(file.name)}</div>
      <div class="chat-message bot muted">FoodHub da nhan thong tin tep. Tinh nang gui tep that se duoc ket noi sau.</div>
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
}

if (protectCheckoutPage()) {
  (async () => {
    await initAddressSelectors();
  const currentUser = getCurrentUser();

  if (currentUser?.address) {
    fillAddressForm({
      cityId: "customerCity",
      districtId: "customerDistrict",
      wardId: "customerWard",
      detailId: "customerAddress"
    }, currentUser.address);
  }
  loadCheckoutSavedAddresses();

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
