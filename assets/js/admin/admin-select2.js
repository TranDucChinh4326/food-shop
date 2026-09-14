(function initAdminSelect2() {
  const $ = window.jQuery;
  if (!$ || !$.fn?.select2) {
    console.warn("Select2 is unavailable; admin dropdowns will use native selects.");
    return;
  }

  function getPlaceholder(select) {
    const firstOption = select.options?.[0];
    if (!firstOption || String(firstOption.value) !== "") return undefined;
    return firstOption.textContent.trim() || undefined;
  }

  function enhanceSelect(select) {
    if (!(select instanceof HTMLSelectElement) || select.dataset.nativeSelect === "true") return;

    const $select = $(select);
    if ($select.hasClass("select2-hidden-accessible")) {
      $select.trigger("change.select2");
      return;
    }

    const placeholder = getPlaceholder(select);
    $select.select2({
      width: "100%",
      placeholder,
      allowClear: Boolean(placeholder) && !select.required,
      minimumResultsForSearch: 0,
      language: {
        noResults: () => "Không tìm thấy kết quả",
        searching: () => "Đang tìm kiếm..."
      }
    });
  }

  function enhanceWithin(root = document) {
    if (root instanceof HTMLSelectElement) enhanceSelect(root);
    root.querySelectorAll?.("select").forEach(enhanceSelect);
  }

  enhanceWithin();

  let refreshFrame = 0;
  const pendingSelects = new Set();
  const scheduleRefresh = select => {
    if (select instanceof HTMLSelectElement) pendingSelects.add(select);
    if (refreshFrame) return;

    refreshFrame = requestAnimationFrame(() => {
      pendingSelects.forEach(enhanceSelect);
      pendingSelects.clear();
      refreshFrame = 0;
    });
  };

  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      const targetSelect = mutation.target instanceof Element
        ? mutation.target.closest("select")
        : null;
      if (targetSelect) scheduleRefresh(targetSelect);

      mutation.addedNodes.forEach(node => {
        if (!(node instanceof Element)) return;
        if (node instanceof HTMLSelectElement) scheduleRefresh(node);
        node.querySelectorAll?.("select").forEach(scheduleRefresh);
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
  window.refreshAdminSelect2 = enhanceWithin;
})();
