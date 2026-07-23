const VERIFY_API_BASE_URL = window.FOODHUB_CONFIG?.API_BASE_URL || "http://localhost:3000/api";
const VERIFY_AUTH_API = `${VERIFY_API_BASE_URL}/auth`;

async function verifyEmail() {
  const message = document.getElementById("verifyMessage");
  const action = document.getElementById("verifyAction");
  const token = new URLSearchParams(window.location.search).get("token");

  if (!token) {
    message.textContent = "Link xac thuc khong hop le.";
    action.textContent = "Ve trang dang ky";
    action.href = "register.html";
    return;
  }

  try {
    const response = await fetch(`${VERIFY_AUTH_API}/verify-email?token=${encodeURIComponent(token)}`);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Khong the xac thuc email.");
    }

    message.textContent = data.message || "Email da duoc xac thuc thanh cong.";
    action.textContent = "Dang nhap ngay";
    action.href = "login.html";
  } catch (error) {
    message.textContent = error.message;
    action.textContent = "Ve trang dang nhap";
    action.href = "login.html";
  }
}

verifyEmail();
