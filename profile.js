const PROFILE_AUTH_API = `${API_BASE_URL}/auth`;

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

async function loadProfile() {
  if (!isLoggedIn()) {
    requireLogin("Vui long dang nhap de xem tai khoan.", "profile.html");
    return;
  }

  try {
    const data = await requestProfileJson(`${PROFILE_AUTH_API}/me`);
    document.getElementById("profileFullname").value = data.user.fullname || "";
    document.getElementById("profileEmail").value = data.user.email || "";
    sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
    renderUser();
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
    renderUser();
    showSiteToast("Da cap nhat thong tin tai khoan.");
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
loadProfile();
