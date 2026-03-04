(function (window) {
  // Boots each feature module after scripts are loaded.
  const app = window.PrinceSite || {};
  const bootstrapSequence = [
    "initNavigation",
    "initCharacterTabs",
    "initFeatureCarousel",
    "initSection2RatioLayout",
    "initSectionSnapScroll",
    "initScrollAnimations",
    "initLoginModal",
    "initRegisterModal",
    "initDownloadModal",
    "initServerModal"
  ];
  

  // Preserve feature start order; each module can rely on prior registrations.
  bootstrapSequence.forEach(function (initKey) {
    if (typeof app[initKey] === "function") {
      app[initKey]();
    }
  });
})(window);
