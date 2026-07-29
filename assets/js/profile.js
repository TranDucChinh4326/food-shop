const PROFILE_AUTH_API = `${API_BASE_URL}/auth`;
const PROFILE_GOOGLE_CLIENT_ID = window.FOODHUB_CONFIG?.GOOGLE_CLIENT_ID || "";
const PROFILE_FACEBOOK_APP_ID = window.FOODHUB_CONFIG?.FACEBOOK_APP_ID || "";
const PROFILE_FACEBOOK_SDK_VERSION = "v25.0";

let profileGoogleTokenClient;
let profileFacebookSdkPromise;
let savedAddresses = [];
let selectedAvatarData = "";

function getProfileAuthHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getAuthToken()}`
  };
}

async function requestProfileJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getProfileAuthHeaders(),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
    requireLogin(data.message || "Phien dang nhap da het han.", "profile.html");
    throw new Error(data.message || "Phien dang nhap da het han.");
  }

  if (!response.ok) {
    throw new Error(data.message || "Khong the xu ly yeu cau.");
  }

  return data;
}

function loadProfileScript(src, id) {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderSocialAccounts(accounts = []) {
  const container = document.getElementById("socialAccounts");
  if (!container) return;

  const linked = accounts.reduce((result, account) => {
    result[account.provider] = account;
    return result;
  }, {});

  const providers = [
    { id: "google", label: "Google", icon: "G" },
    { id: "facebook", label: "Facebook", icon: "f" }
  ];

  container.innerHTML = providers.map(provider => {
    const account = linked[provider.id];
    const statusClass = account ? "linked" : "missing";
    const statusText = account ? "Da lien ket" : "Chua lien ket";
    const meta = escapeHtml(account
      ? account.provider_email || account.provider_name || "Tai khoan social da xac thuc"
      : "Bam nut ben duoi de lien ket");

    return `
      <div class="social-account-item">
        <div>
          <div class="social-account-name">
            <span class="social-account-icon">${provider.icon}</span>
            ${provider.label}
          </div>
          <div class="social-account-meta">${meta}</div>
        </div>
        <span class="social-account-status ${statusClass}">${statusText}</span>
      </div>
    `;
  }).join("");
}

function renderEmailVerifyStatus(user) {
  const status = document.getElementById("emailVerifyStatus");
  if (!status) return;

  const isVerified = Boolean(user?.emailVerified);
  status.className = `verify-status ${isVerified ? "verified" : "pending"}`;
  status.textContent = isVerified
    ? "Email da duoc xac thuc. Google cung email se tu dong dong bo vao tai khoan nay."
    : "Email chua xac thuc. Ban can xac thuc truoc khi dang nhap bang mat khau.";
}

function renderPasswordMode(user) {
  const form = document.getElementById("passwordForm");
  const currentPassword = document.getElementById("currentPassword");
  const newPassword = document.getElementById("newPassword");

  if (!form || !currentPassword || !newPassword) return;

  const title = form.querySelector(".section-heading h2");
  const hint = form.querySelector(".section-heading p");
  const button = form.querySelector("button[type='submit']");
  const currentLabel = currentPassword.closest("label");
  const hasPasswordSet = Boolean(user?.passwordSet);

  currentPassword.required = hasPasswordSet;
  if (currentLabel) {
    currentLabel.hidden = !hasPasswordSet;
  }

  if (title) {
    title.textContent = hasPasswordSet ? "Doi mat khau" : "Tao mat khau dang nhap";
  }

  if (hint) {
    hint.textContent = hasPasswordSet
      ? "Nhap mat khau hien tai de doi sang mat khau moi."
      : "Tai khoan nay vua duoc tao bang Google/Facebook. Hay tao mat khau de hoan tat tai khoan chinh.";
  }

  if (button) {
    button.textContent = hasPasswordSet ? "Doi mat khau" : "Tao mat khau";
  }
}

function renderAccountSummary(user) {
  const name = document.getElementById("profileDisplayName");
  const email = document.getElementById("profileDisplayEmail");
  const avatar = document.getElementById("profileAvatar");

  if (name) name.textContent = user?.fullname || "FoodHub User";
  if (email) email.textContent = user?.email || "";

  if (avatar) {
    const avatarSource = selectedAvatarData || user?.avatar;

    if (avatarSource) {
      avatar.innerHTML = `<img src="${escapeHtml(avatarSource)}" alt="${escapeHtml(user.fullname || "FoodHub User")}">`;
    } else {
      const initials = String(user?.fullname || user?.email || "FH")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(part => part.charAt(0).toUpperCase())
        .join("") || "FH";
      avatar.textContent = initials;
    }
  }
}

async function loadSocialAccounts() {
  try {
    const data = await requestProfileJson(`${PROFILE_AUTH_API}/social/accounts`);
    renderSocialAccounts(data.accounts || []);
  } catch (error) {
    showSiteToast(error.message, "error");
  }
}

function setProfileTab(tab) {
  document.querySelectorAll("[data-profile-tab]").forEach(button => {
    button.classList.toggle("active", button.dataset.profileTab === tab);
  });

  document.querySelectorAll("[data-profile-panel]").forEach(panel => {
    panel.hidden = panel.dataset.profilePanel !== tab;
  });
}

function renderSavedAddresses() {
  const container = document.getElementById("savedAddressList");
  if (!container) return;

  if (!savedAddresses.length) {
    container.innerHTML = `<p class="empty-cart">Chưa có địa chỉ giao hàng nào.</p>`;
    return;
  }

  container.innerHTML = savedAddresses.map(address => `
    <article class="saved-address-card">
      <div>
        <h3>${escapeHtml(address.label || "Địa chỉ giao hàng")} ${address.isDefault ? "<span>Mặc định</span>" : ""}</h3>
        <p>${escapeHtml(address.receiverName || "")}${address.phone ? ` - ${escapeHtml(address.phone)}` : ""}</p>
        <small>${escapeHtml(address.address)}</small>
      </div>
      <div class="saved-address-actions">
        <button type="button" data-edit-address="${address.id}">Sửa</button>
        <button type="button" data-delete-address="${address.id}">Xóa</button>
      </div>
    </article>
  `).join("");
}

async function loadSavedAddresses() {
  try {
    const data = await requestProfileJson(`${PROFILE_AUTH_API}/addresses`);
    savedAddresses = data.addresses || [];
    renderSavedAddresses();
  } catch (error) {
    showSiteToast(error.message, "error");
  }
}

function resetAddressForm() {
  document.getElementById("addressBookId").value = "";
  document.getElementById("addressBookForm")?.reset();
  fillAddressForm({
    cityId: "addressBookCity",
    districtId: "addressBookDistrict",
    wardId: "addressBookWard",
    detailId: "addressBookDetail"
  }, "");
}

async function saveAddressBook(event) {
  event.preventDefault();

  const addressId = document.getElementById("addressBookId").value;
  const payload = {
    label: document.getElementById("addressBookLabel").value,
    receiverName: document.getElementById("addressBookReceiver").value,
    phone: document.getElementById("addressBookPhone").value,
    address: buildAddressString(
      document.getElementById("addressBookCity")?.value || "",
      document.getElementById("addressBookDistrict")?.value || "",
      document.getElementById("addressBookWard")?.value || "",
      document.getElementById("addressBookDetail")?.value || ""
    ),
    isDefault: document.getElementById("addressBookDefault").checked
  };
  const url = addressId
    ? `${PROFILE_AUTH_API}/addresses/${addressId}`
    : `${PROFILE_AUTH_API}/addresses`;

  try {
    const data = await requestProfileJson(url, {
      method: addressId ? "PUT" : "POST",
      body: JSON.stringify(payload)
    });
    resetAddressForm();
    await loadSavedAddresses();
    await loadProfile();
    showSiteToast(data.message || "Da luu dia chi.");
  } catch (error) {
    showSiteToast(error.message, "error");
  }
}

async function deleteAddress(addressId) {
  try {
    const data = await requestProfileJson(`${PROFILE_AUTH_API}/addresses/${addressId}`, {
      method: "DELETE"
    });
    await loadSavedAddresses();
    await loadProfile();
    showSiteToast(data.message || "Da xoa dia chi.");
  } catch (error) {
    showSiteToast(error.message, "error");
  }
}

function editAddress(addressId) {
  const address = savedAddresses.find(item => String(item.id) === String(addressId));
  if (!address) return;

  document.getElementById("addressBookId").value = address.id;
  document.getElementById("addressBookLabel").value = address.label || "";
  document.getElementById("addressBookReceiver").value = address.receiverName || "";
  document.getElementById("addressBookPhone").value = address.phone || "";
  fillAddressForm({
    cityId: "addressBookCity",
    districtId: "addressBookDistrict",
    wardId: "addressBookWard",
    detailId: "addressBookDetail"
  }, address.address || "");
  document.getElementById("addressBookDefault").checked = Boolean(address.isDefault);
}

async function postSocialLink(provider, accessToken) {
  const data = await requestProfileJson(`${PROFILE_AUTH_API}/social/link/${provider}`, {
    method: "POST",
    body: JSON.stringify({ accessToken })
  });

  renderSocialAccounts(data.accounts || []);
  await loadProfile();
  showSiteToast(data.message || "Da lien ket tai khoan.");
}

async function linkGoogleAccount() {
  if (!PROFILE_GOOGLE_CLIENT_ID) {
    showSiteToast("Google chua duoc cau hinh Client ID.", "error");
    return;
  }

  try {
    await loadProfileScript("https://accounts.google.com/gsi/client", "google-identity-script");

    if (!profileGoogleTokenClient) {
      profileGoogleTokenClient = google.accounts.oauth2.initTokenClient({
        client_id: PROFILE_GOOGLE_CLIENT_ID,
        scope: "openid email profile",
        callback: async response => {
          if (!response.access_token) {
            showSiteToast("Google khong tra ve access token.", "error");
            return;
          }

          try {
            await postSocialLink("google", response.access_token);
          } catch (error) {
            showSiteToast(error.message, "error");
          }
        }
      });
    }

    profileGoogleTokenClient.requestAccessToken({ prompt: "select_account" });
  } catch (error) {
    console.error(error);
    showSiteToast("Khong tai duoc Google Login.", "error");
  }
}

function initProfileFacebookSdk() {
  if (!PROFILE_FACEBOOK_APP_ID) {
    return Promise.reject(new Error("Facebook chua duoc cau hinh App ID."));
  }

  if (window.FB) {
    FB.init({
      appId: PROFILE_FACEBOOK_APP_ID,
      cookie: false,
      xfbml: false,
      status: true,
      version: PROFILE_FACEBOOK_SDK_VERSION
    });
    return Promise.resolve();
  }

  if (!profileFacebookSdkPromise) {
    profileFacebookSdkPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Facebook SDK tai qua lau hoac bi trinh duyet chan."));
      }, 10000);

      window.fbAsyncInit = () => {
        clearTimeout(timeout);
        FB.init({
          appId: PROFILE_FACEBOOK_APP_ID,
          cookie: false,
          xfbml: false,
          status: true,
          version: PROFILE_FACEBOOK_SDK_VERSION
        });
        resolve();
      };

      loadProfileScript("https://connect.facebook.net/vi_VN/sdk.js", "facebook-sdk-script")
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  return profileFacebookSdkPromise;
}

async function linkFacebookAccount() {
  try {
    await initProfileFacebookSdk();

    FB.login(response => {
      handleFacebookLinkResponse(response);
    }, { scope: "public_profile" });
  } catch (error) {
    console.error(error);
    showSiteToast(error.message || "Khong tai duoc Facebook Login.", "error");
  }
}

async function handleFacebookLinkResponse(response) {
  if (!response.authResponse?.accessToken) {
    showSiteToast("Facebook chua cap quyen dang nhap hoac popup da bi dong.", "info");
    return;
  }

  try {
    await postSocialLink("facebook", response.authResponse.accessToken);
  } catch (error) {
    showSiteToast(error.message, "error");
  }
}

async function loadProfile() {
  if (!isLoggedIn()) {
    requireLogin("Vui long dang nhap de xem tai khoan.", "profile.html");
    return;
  }

  try {
    await initAddressSelectors();
    const data = await requestProfileJson(`${PROFILE_AUTH_API}/me`);
    selectedAvatarData = "";
    document.getElementById("profileFullname").value = data.user.fullname || "";
    document.getElementById("profileUsername").value = data.user.username || "";
    document.getElementById("profileEmail").value = data.user.email || "";
    document.getElementById("profilePhone").value = data.user.phone || "";
    fillAddressForm({
      cityId: "profileCity",
      districtId: "profileDistrict",
      wardId: "profileWard",
      detailId: "profileAddressDetail"
    }, data.user.address);
    renderEmailVerifyStatus(data.user);
    renderPasswordMode(data.user);
    renderAccountSummary(data.user);
    if (data.user.requiresAccountSetup || new URLSearchParams(window.location.search).get("setup") === "1") {
      showSiteToast("Vui long tao username va mat khau de hoan tat tai khoan.", "info");
    }
    sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
    renderUser();
    await loadSocialAccounts();
    await loadSavedAddresses();
  } catch (error) {
    showSiteToast(error.message, "error");
  }
}

async function saveProfile(event) {
  event.preventDefault();

  const payload = {
    username: document.getElementById("profileUsername").value,
    fullname: document.getElementById("profileFullname").value,
    email: document.getElementById("profileEmail").value,
    avatar: selectedAvatarData || document.querySelector("#profileAvatar img")?.getAttribute("src") || "",
    phone: document.getElementById("profilePhone").value,
    address: buildAddressString(
      document.getElementById("profileCity")?.value || "",
      document.getElementById("profileDistrict")?.value || "",
      document.getElementById("profileWard")?.value || "",
      document.getElementById("profileAddressDetail")?.value || ""
    )
  };

  try {
    const data = await requestProfileJson(`${PROFILE_AUTH_API}/me`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
    sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
    selectedAvatarData = "";
    renderEmailVerifyStatus(data.user);
    renderAccountSummary(data.user);
    renderUser();
    if (data.verificationUrl) {
      showSiteToast(data.message || "Vui long xac thuc email moi.");
      setTimeout(() => {
        window.location.href = data.verificationUrl;
      }, 900);
      return;
    }

    showSiteToast(data.message || "Da cap nhat thong tin tai khoan.");
  } catch (error) {
    showSiteToast(error.message, "error");
  }
}

function initAvatarUpload() {
  const button = document.getElementById("avatarUploadButton");
  const input = document.getElementById("avatarUploadInput");

  if (!button || !input) return;

  button.addEventListener("click", () => input.click());
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showSiteToast("Vui long chon tep hinh anh.", "error");
      input.value = "";
      return;
    }

    compressAvatarImage(file)
      .then(dataUrl => {
        selectedAvatarData = dataUrl;
        renderAccountSummary({
          fullname: document.getElementById("profileFullname")?.value,
          email: document.getElementById("profileEmail")?.value,
          avatar: selectedAvatarData
        });
        showSiteToast("Da chon anh dai dien. Bam Luu thay doi de cap nhat.");
      })
      .catch(error => {
        console.error(error);
        showSiteToast("Khong the xu ly anh dai dien.", "error");
      })
      .finally(() => {
        input.value = "";
      });
  });
}

function compressAvatarImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = reject;
    reader.onload = () => {
      const image = new Image();
      image.onerror = reject;
      image.onload = () => {
        const maxSize = 320;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        canvas.width = width;
        canvas.height = height;
        context.drawImage(image, 0, 0, width, height);

        let quality = 0.82;
        let dataUrl = canvas.toDataURL("image/jpeg", quality);

        while (dataUrl.length > 420000 && quality > 0.45) {
          quality -= 0.08;
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }

        resolve(dataUrl);
      };

      image.src = String(reader.result || "");
    };

    reader.readAsDataURL(file);
  });
}

async function changePassword(event) {
  event.preventDefault();

  const payload = {
    currentPassword: document.getElementById("currentPassword").value,
    newPassword: document.getElementById("newPassword").value
  };

  try {
    await requestProfileJson(`${PROFILE_AUTH_API}/password`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
    event.currentTarget.reset();
    await loadProfile();
    showSiteToast("Da doi mat khau.");
  } catch (error) {
    showSiteToast(error.message, "error");
  }
}

document.getElementById("profileForm").addEventListener("submit", saveProfile);
document.getElementById("passwordForm").addEventListener("submit", changePassword);
document.getElementById("linkGoogleButton").addEventListener("click", linkGoogleAccount);
document.getElementById("linkFacebookButton").addEventListener("click", linkFacebookAccount);
initAvatarUpload();
document.getElementById("addressBookForm")?.addEventListener("submit", saveAddressBook);
document.getElementById("cancelAddressEdit")?.addEventListener("click", resetAddressForm);
document.getElementById("savedAddressList")?.addEventListener("click", event => {
  const editButton = event.target.closest("[data-edit-address]");
  const deleteButton = event.target.closest("[data-delete-address]");

  if (editButton) editAddress(editButton.dataset.editAddress);
  if (deleteButton) deleteAddress(deleteButton.dataset.deleteAddress);
});
document.querySelectorAll("[data-profile-tab]").forEach(button => {
  button.addEventListener("click", () => setProfileTab(button.dataset.profileTab));
});
loadProfile();
