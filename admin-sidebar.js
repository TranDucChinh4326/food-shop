const ADMIN_SIDEBAR_COLLAPSED_KEY = "foodhub_admin_sidebar_collapsed";

function initAdminSidebar() {
  const sidebar = document.querySelector(".admin-sidebar");
  const toggle = document.querySelector("[data-sidebar-toggle]");

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
