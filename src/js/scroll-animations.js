(function (window, document) {
  // Adds reveal-on-scroll classes and triggers visibility with IntersectionObserver.
  const app = (window.PrinceSite = window.PrinceSite || {});
  let isInitialized = false;

  function initScrollAnimations() {
    if (isInitialized) {
      return;
    }
    isInitialized = true;

    const revealGroups = [
      // Header and hero call-to-action groupings.
      {
        selector: ".logo-button, .header-nav-button",
        animation: "reveal-pop",
        step: 45,
        startDelay: 0
      },
      {
        selector: ".hero-title-image, .hero-detail-image",
        animation: "reveal-left",
        step: 90,
        startDelay: 80
      },
      {
        selector: ".store-buttons .image-button, .play-btn, .action-buttons .image-button",
        animation: "reveal-pop",
        step: 70,
        startDelay: 120
      },
      {
        selector: ".hero-character-wrap",
        animation: "reveal-pop",
        step: 0,
        startDelay: 140
      },
      {
        selector: ".feature-title-image, .feature-detail-image",
        animation: "reveal-left",
        step: 0,
        startDelay: 60
      },
      { selector: ".feature-screen", animation: "reveal-left", step: 0, startDelay: 170 },
      { selector: ".feature-portrait", animation: "reveal-right", step: 0, startDelay: 120 },
      {
        selector: ".character-title-image, .character-nameplate, .character-copy, .character-tabs",
        animation: "reveal-left",
        step: 85,
        startDelay: 60
      },
      { selector: ".character-right", animation: "reveal-right", step: 0, startDelay: 120 }
    ];

    const revealElements = [];
    const seen = new Set();

    revealGroups.forEach(function (group) {
      const items = document.querySelectorAll(group.selector);
      items.forEach(function (item, index) {
        if (seen.has(item)) {
          return;
        }
        seen.add(item);
        item.classList.add("reveal-on-scroll");
        item.classList.add(group.animation);
        item.style.setProperty(
          "--reveal-delay",
          group.startDelay + index * group.step + "ms"
        );
        revealElements.push(item);
      });
    });

    if (!revealElements.length) {
      return;
    }

    const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotionQuery.matches || !("IntersectionObserver" in window)) {
      revealElements.forEach(function (item) {
        item.classList.add("is-visible");
      });
      return;
    }

    function revealTogether(selector) {
      // Some paired elements should appear as a single visual unit.
      const groupItems = document.querySelectorAll(selector);
      groupItems.forEach(function (item) {
        item.classList.add("is-visible");
        observer.unobserve(item);
      });
    }

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            return;
          }
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);

          if (
            entry.target.matches(".feature-title-image") ||
            entry.target.matches(".feature-detail-image")
          ) {
            revealTogether(".feature-title-image, .feature-detail-image");
          }
        });
      },
      {
        threshold: 0.16,
        rootMargin: "0px 0px -10% 0px"
      }
    );

    revealElements.forEach(function (item) {
      observer.observe(item);
    });

    requestAnimationFrame(function () {
      revealElements.forEach(function (item) {
        const rect = item.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.9) {
          item.classList.add("is-visible");
          observer.unobserve(item);

          if (
            item.matches(".feature-title-image") ||
            item.matches(".feature-detail-image")
          ) {
            revealTogether(".feature-title-image, .feature-detail-image");
          }
        }
      });
    });
  }

  app.initScrollAnimations = initScrollAnimations;
})(window, document);
