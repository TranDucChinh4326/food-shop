const VERIFY_API_BASE_URL = window.FOODHUB_CONFIG?.API_BASE_URL || "http://localhost:3000/api";
const VERIFY_AUTH_API = `${VERIFY_API_BASE_URL}/auth`;

async function verifyEmail() {
  // Đọc token xác minh từ URL và gửi lên backend.
  // Backend kiểm tra hash trong email_verification_tokens rồi cập nhật trạng thái email_verified của user.
  const message = document.getElementById("verifyMessage");
  const action = document.getElementById("verifyAction");
  const token = new URLSearchParams(window.location.search).get("token");

  if (!token) {
    message.textContent = "Link xác thực không hợp lệ.";
    action.textContent = "Ve trang đăng ký";
    action.href = "register.html";
    return;
  }

  try {
    const response = await fetch(`${VERIFY_AUTH_API}/verify-email?token=${encodeURIComponent(token)}`);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Không thể xác thực email.");
    }

    message.textContent = data.message || "Email đã được xác thực thành công.";
    action.textContent = "Đăng nhập ngay";
    action.href = "login.html";
  } catch (error) {
    message.textContent = error.message;
    action.textContent = "Ve trang đăng nhập";
    action.href = "login.html";
  }
}

verifyEmail();
