const FEEDBACK_API_BASE_URL = window.FOODHUB_CONFIG?.API_BASE_URL || "http://localhost:3000/api";
// Trang phản hồi khách hàng.
// User phải đăng nhập; frontend gửi token để backend lưu/xem phản hồi đúng tài khoản.
const FEEDBACK_API = `${FEEDBACK_API_BASE_URL}/feedback`;
const FEEDBACK_TOKEN_KEY = "foodhub_token";

const feedbackForm = document.getElementById("customerFeedbackForm");
const myFeedbackList = document.getElementById("myFeedbackList");

function getFeedbackToken() {
  return sessionStorage.getItem(FEEDBACK_TOKEN_KEY);
}

function feedbackEscapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function feedbackStatusLabel(status) {
  const labels = {
    new: "Mới gửi",
    in_progress: "Đang xử lý",
    replied: "Đã phản hồi",
    closed: "Đã đóng"
  };

  return labels[status] || "Không rõ";
}

function feedbackCategoryLabel(category) {
  const labels = {
    general: "Trải nghiệm chung",
    order: "Đặt hàng",
    food: "Chất lượng món ăn",
    delivery: "Giao hàng",
    payment: "Thanh toán",
    account: "Tài khoản"
  };

  return labels[category] || "Trải nghiệm chung";
}

function renderFeedbackStars(rating) {
  const value = Math.max(1, Math.min(5, Number(rating) || 1));
  return "★".repeat(value) + "☆".repeat(5 - value);
}

function requireFeedbackLogin() {
  if (getFeedbackToken()) return true;

  sessionStorage.setItem("foodhub_after_login", "feedback.html");
  window.location.href = "login.html?redirect=feedback.html";
  return false;
}

async function feedbackRequest(url, options = {}) {
  // Wrapper gọi API feedback, tự gắn JWT và chuyển về login nếu phiên hết hạn.
  // Output là JSON đã parse hoặc throw Error để UI hiển thị toast/trạng thái lỗi.
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getFeedbackToken()}`,
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    requireFeedbackLogin();
    throw new Error(data.message || "Vui lòng đăng nhập");
  }

  if (!response.ok) {
    throw new Error(data.message || "Không thể xử lý yêu cầu");
  }

  return data;
}

async function loadMyFeedback() {
  // Tải các phản hồi đã gửi của người dùng hiện tại.
  // Dữ liệu liên kết với customer_feedback và phần admin quản lý phản hồi.
  if (!myFeedbackList) return;

  myFeedbackList.textContent = "Đang tải phản hồi...";

  try {
    const data = await feedbackRequest(FEEDBACK_API);
    const items = data.feedback || [];

    if (!items.length) {
      myFeedbackList.innerHTML = `<p class="empty-note">Bạn chưa gửi phản hồi nào.</p>`;
      return;
    }

    myFeedbackList.innerHTML = items.map(item => `
      <article class="feedback-history-card">
        <div class="feedback-history-head">
          <div>
            <strong>${feedbackEscapeHtml(item.title)}</strong>
            <small>${feedbackCategoryLabel(item.category)} - ${new Date(item.created_at).toLocaleString("vi-VN")}</small>
          </div>
          <span class="feedback-status ${feedbackEscapeHtml(item.status)}">${feedbackStatusLabel(item.status)}</span>
        </div>
        <div class="feedback-stars" aria-label="${Number(item.rating)} trên 5">${renderFeedbackStars(item.rating)}</div>
        <p>${feedbackEscapeHtml(item.content)}</p>
        ${item.admin_reply ? `
          <div class="feedback-reply-box">
            <strong>FoodHub phản hồi</strong>
            <p>${feedbackEscapeHtml(item.admin_reply)}</p>
            <small>${item.replied_at ? new Date(item.replied_at).toLocaleString("vi-VN") : ""}</small>
          </div>
        ` : ""}
      </article>
    `).join("");
  } catch (error) {
    myFeedbackList.textContent = error.message;
  }
}

feedbackForm?.addEventListener("submit", async event => {
  event.preventDefault();
  if (!requireFeedbackLogin()) return;

  const submitButton = feedbackForm.querySelector("button[type='submit']");
  const payload = {
    rating: Number(feedbackForm.querySelector("input[name='feedbackRating']:checked")?.value || 5),
    category: document.getElementById("feedbackCategory")?.value,
    title: document.getElementById("feedbackTitle")?.value,
    content: document.getElementById("feedbackContent")?.value
  };

  submitButton.disabled = true;
  submitButton.textContent = "Đang gửi...";

  try {
    const data = await feedbackRequest(FEEDBACK_API, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    feedbackForm.reset();
    const defaultRating = feedbackForm.querySelector("input[name='feedbackRating'][value='5']");
    if (defaultRating) defaultRating.checked = true;
    if (typeof showSiteToast === "function") {
      showSiteToast(data.message || "Đã gửi phản hồi.");
    }
    await loadMyFeedback();
  } catch (error) {
    if (typeof showSiteToast === "function") {
      showSiteToast(error.message, "error");
    }
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Gửi phản hồi";
  }
});

if (requireFeedbackLogin()) {
  loadMyFeedback();
}
