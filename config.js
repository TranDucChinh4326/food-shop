// Cấu hình runtime cho frontend Bếp 1979.
// Các file JS đọc FOODHUB_CONFIG để biết backend API và ID đăng nhập mạng xã hội đang dùng.
window.FOODHUB_CONFIG = {
  API_BASE_URL: "https://food-backend-xrb9.onrender.com/api",
  GOOGLE_CLIENT_ID: "1035084433038-7ab68das8hl0s2b2mgv4b27b9k00enmi.apps.googleusercontent.com",
  FACEBOOK_APP_ID: "1385223216785892"
};

// Chia sẻ đúng một phiên web giữa các tab trong cùng trình duyệt.
for (const key of ["foodhub_token", "foodhub_user"]) {
  const legacyValue = sessionStorage.getItem(key);
  if (!localStorage.getItem(key) && legacyValue) {
    localStorage.setItem(key, legacyValue);
  }
  sessionStorage.removeItem(key);
}

window.addEventListener("storage", event => {
  if (event.key === "foodhub_token" && event.oldValue !== event.newValue) {
    window.location.reload();
  }
});

function disableBrowserInputSuggestions(root = document) {
  const ignoredTypes = new Set(["button", "checkbox", "file", "hidden", "image", "radio", "reset", "submit"]);

  root.querySelectorAll?.("form").forEach(form => {
    form.setAttribute("autocomplete", "off");
  });

  root.querySelectorAll?.("input, textarea, select").forEach(field => {
    const type = String(field.getAttribute("type") || "").toLowerCase();
    if (ignoredTypes.has(type)) return;

    field.setAttribute("autocomplete", "off");
    field.setAttribute("autocorrect", "off");
    field.setAttribute("autocapitalize", "none");
    field.setAttribute("spellcheck", "false");
  });
}

function initBrowserInputSuggestionGuard() {
  disableBrowserInputSuggestions();

  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          disableBrowserInputSuggestions(node);
        }
      });
    });
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initBrowserInputSuggestionGuard);
} else {
  initBrowserInputSuggestionGuard();
}
