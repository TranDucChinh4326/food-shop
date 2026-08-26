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

  return labels[status] || "Mới gửi";
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
  if (!myFeedbackList) return;

  myFeedbackList.textContent = "Đang tải phản hồi...";

  try {
    const data = await feedbackRequest(FEEDBACK_API);
    const items = data.feedback || [];

    if (!items.length) {
      myFeedbackList.innerHTML = `
        <div class="feedback-empty-state">
          <span class="empty-icon">📝</span>
          <strong>Chưa có phản hồi nào</strong>
          <span>Mọi đóng góp ý kiến của bạn sẽ được hiển thị và phản hồi tại đây.</span>
        </div>
      `;
      return;
    }

    myFeedbackList.innerHTML = items.map(item => {
      const status = item.status || "new";
      const statusClass = status === "replied" ? "replied" : status === "in_progress" ? "in_progress" : "new";
      const statusText = feedbackStatusLabel(status);

      return `
        <article class="feedback-history-card">
          <div class="feedback-history-head">
            <div>
              <strong class="feedback-item-title">${feedbackEscapeHtml(item.title)}</strong>
              <small class="feedback-item-meta">
                <span class="category-tag">${feedbackCategoryLabel(item.category)}</span>
                <span class="dot-sep">•</span>
                <span>${new Date(item.created_at).toLocaleString("vi-VN")}</span>
              </small>
            </div>
            <span class="feedback-status ${statusClass}">
              <span class="status-dot"></span>
              ${statusText}
            </span>
          </div>
          <div class="feedback-stars" aria-label="${Number(item.rating)} trên 5">${renderFeedbackStars(item.rating)}</div>
          <p class="feedback-item-text">${feedbackEscapeHtml(item.content)}</p>
          ${item.admin_reply ? `
            <div class="feedback-reply-box">
              <div class="reply-box-head">
                <span class="reply-badge-icon">👑</span>
                <strong>Quản trị viên FoodHub phản hồi:</strong>
              </div>
              <p>${feedbackEscapeHtml(item.admin_reply)}</p>
              <small class="reply-time">${item.replied_at ? new Date(item.replied_at).toLocaleString("vi-VN") : ""}</small>
            </div>
          ` : ""}
        </article>
      `;
    }).join("");
  } catch (error) {
    myFeedbackList.textContent = error.message;
  }
}

// Đồng bộ Topic Chips với Category Select
const topicChips = document.querySelectorAll(".topic-chip");
const categorySelect = document.getElementById("feedbackCategory");
const feedbackContentInput = document.getElementById("feedbackContent");
const charCounter = document.getElementById("feedbackCharCount");

if (topicChips.length && categorySelect) {
  topicChips.forEach(chip => {
    chip.addEventListener("click", () => {
      const topic = chip.dataset.topic;
      categorySelect.value = topic;
      topicChips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
    });
  });

  categorySelect.addEventListener("change", () => {
    topicChips.forEach(c => {
      c.classList.toggle("active", c.dataset.topic === categorySelect.value);
    });
  });
}

if (feedbackContentInput && charCounter) {
  feedbackContentInput.addEventListener("input", () => {
    const len = feedbackContentInput.value.length;
    charCounter.textContent = `${len} / 2000`;
  });
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
  submitButton.innerHTML = `<span>Đang gửi...</span>`;

  try {
    const data = await feedbackRequest(FEEDBACK_API, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    feedbackForm.reset();
    const defaultRating = feedbackForm.querySelector("input[name='feedbackRating'][value='5']");
    if (defaultRating) defaultRating.checked = true;
    if (charCounter) charCounter.textContent = "0 / 2000";
    if (topicChips.length) {
      topicChips.forEach((c, idx) => c.classList.toggle("active", idx === 0));
    }
    if (typeof showSiteToast === "function") {
      showSiteToast(data.message || "Đã gửi phản hồi thành công!");
    }
    await loadMyFeedback();
  } catch (error) {
    if (typeof showSiteToast === "function") {
      showSiteToast(error.message, "error");
    }
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = `<span>Gửi phản hồi</span><span class="btn-arrow">→</span>`;
  }
});

if (requireFeedbackLogin()) {
  loadMyFeedback();
}
