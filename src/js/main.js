(function (window) {
  // Boots each feature module after scripts are loaded.
  const app = window.PrinceSite || {};

  if (typeof app.initNavigation === "function") {
    app.initNavigation();
  }
  if (typeof app.initCharacterTabs === "function") {
    app.initCharacterTabs();
  }
  if (typeof app.initFeatureCarousel === "function") {
    app.initFeatureCarousel();
  }
  if (typeof app.initSectionSnapScroll === "function") {
    app.initSectionSnapScroll();
  }
  if (typeof app.initScrollAnimations === "function") {
    app.initScrollAnimations();
  }
  if (typeof app.initRegisterModal === "function") {
    app.initRegisterModal();
  }
  if (typeof app.initServerModal === "function") {
    app.initServerModal();
  }
})(window);
