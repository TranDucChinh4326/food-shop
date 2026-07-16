const PROFILE_AUTH_API = `${API_BASE_URL}/auth`;
const PROFILE_GOOGLE_CLIENT_ID = window.FOODHUB_CONFIG?.GOOGLE_CLIENT_ID || "";
const PROFILE_FACEBOOK_APP_ID = window.FOODHUB_CONFIG?.FACEBOOK_APP_ID || "";
const PROFILE_FACEBOOK_SDK_VERSION = "v25.0";

let profileGoogleTokenClient;
let profileFacebookSdkPromise;

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
      : "Tai khoan nay dang dang nhap bang Google/Facebook. Hay tao mat khau neu ban muon dang nhap bang email.";
  }

  if (button) {
    button.textContent = hasPasswordSet ? "Doi mat khau" : "Tao mat khau";
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
    const data = await requestProfileJson(`${PROFILE_AUTH_API}/me`);
    document.getElementById("profileFullname").value = data.user.fullname || "";
    document.getElementById("profileEmail").value = data.user.email || "";
    renderEmailVerifyStatus(data.user);
    renderPasswordMode(data.user);
    sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
    renderUser();
    await loadSocialAccounts();
  } catch (error) {
    showSiteToast(error.message, "error");
  }
}

async function saveProfile(event) {
  event.preventDefault();

  const payload = {
    fullname: document.getElementById("profileFullname").value,
    email: document.getElementById("profileEmail").value
  };

  try {
    const data = await requestProfileJson(`${PROFILE_AUTH_API}/me`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
    sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
    renderEmailVerifyStatus(data.user);
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
    showSiteToast("Da doi mat khau.");
  } catch (error) {
    showSiteToast(error.message, "error");
  }
}

document.getElementById("profileForm").addEventListener("submit", saveProfile);
document.getElementById("passwordForm").addEventListener("submit", changePassword);
document.getElementById("linkGoogleButton").addEventListener("click", linkGoogleAccount);
document.getElementById("linkFacebookButton").addEventListener("click", linkFacebookAccount);
loadProfile();
