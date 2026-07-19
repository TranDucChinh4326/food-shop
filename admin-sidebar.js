const ADMIN_SIDEBAR_COLLAPSED_KEY = "foodhub_admin_sidebar_collapsed";

const ADMIN_ICONS = {
  menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14"/></svg>',
  home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 11 8-7 8 7"/><path d="M6.5 10.5V20h11v-9.5"/><path d="M10 20v-5h4v5"/></svg>',
  orders: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h11v14H7z"/><path d="M4 8h3M4 12h3M4 16h3"/><path d="M10 9h5M10 13h5"/></svg>',
  categories: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6.5h14"/><path d="M5 12h14"/><path d="M5 17.5h14"/><path d="M7.5 4.5v4"/><path d="M16.5 10v4"/><path d="M11 15.5v4"/></svg>',
  utensils: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4v6M6 4v6M10 4v6"/><path d="M6 10h4l-2 10"/><path d="M16 4v16"/><path d="M16 4c1.9 1.5 3 3.3 3 5.8 0 2.1-1.1 3.7-3 4.7"/></svg>',
  account: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5.5 20c1.1-3.4 3.3-5 6.5-5s5.4 1.6 6.5 5"/></svg>',
  bell: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10a5 5 0 0 1 10 0v4l2 3H5l2-3z"/><path d="M10 20h4"/></svg>',
  ticket: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4Z"/><path d="M9 9h.01M15 15h.01M16 8l-8 8"/></svg>',
  stats: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19V5"/><path d="M5 19h14"/><path d="M9 16v-5"/><path d="M13 16V8"/><path d="M17 16v-3"/></svg>',
  dot: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/></svg>',
  logout: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 6H6v12h4"/><path d="M14 8l4 4-4 4"/><path d="M8 12h10"/></svg>'
};

function renderAdminIcons() {
  document.querySelectorAll("[data-icon]").forEach(icon => {
    const name = icon.getAttribute("data-icon");
    if (ADMIN_ICONS[name]) icon.innerHTML = ADMIN_ICONS[name];
  });

  const toggle = document.querySelector("[data-sidebar-toggle]");
  if (toggle) toggle.innerHTML = ADMIN_ICONS.menu;
}

function syncAdminUserName() {
  let user = null;

  try {
    user = JSON.parse(sessionStorage.getItem("foodhub_user") || "null");
  } catch (_) {
    user = null;
  }

  const name = user?.fullname || user?.name || user?.email || "admin";
  document.querySelectorAll("[data-admin-user-name]").forEach(el => {
    el.textContent = name;
  });
}

function initAdminSidebar() {
  const sidebar = document.querySelector(".admin-sidebar");
  const toggle = document.querySelector("[data-sidebar-toggle]");

  renderAdminIcons();
  syncAdminUserName();

  if (!sidebar || !toggle) return;

  const setCollapsed = collapsed => {
    document.body.classList.toggle("sidebar-collapsed", collapsed);
    toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
    sessionStorage.setItem(ADMIN_SIDEBAR_COLLAPSED_KEY, collapsed ? "1" : "0");
  };

  setCollapsed(sessionStorage.getItem(ADMIN_SIDEBAR_COLLAPSED_KEY) === "1");

  toggle.addEventListener("click", () => {
    setCollapsed(!document.body.classList.contains("sidebar-collapsed"));
  });
}

initAdminSidebar();
