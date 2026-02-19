(function (window) {
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
})(window);
