(function () {
  const MOBILE_BREAKPOINT = 900;
  const mobileMenu = document.getElementById("mobile-nav-overlay");
  const mobileMenuToggle = document.querySelector(".mobile-menu-toggle");
  let isMobileMenuOpen = false;

  const actionHandlers = {
    main: function () {
      scrollToSection("main");
    },
    register: function () {
      alert("Register page link not added yet.");
    },
    topup: function () {
      alert("Topup page link not added yet.");
    },
    "game-guide": function () {
      scrollToSection("game-guide");
    },
    news: function () {
      alert("News page link not added yet.");
    },
    community: function () {
      alert("Community page link not added yet.");
    },
    "app-store": function () {
      alert("App Store link not added yet.");
    },
    "google-play": function () {
      alert("Google Play link not added yet.");
    },
    "google-play-games": function () {
      alert("Google Play Games link not added yet.");
    },
    "play-game": function () {
      alert("Play Game action not added yet.");
    },
    download: function () {
      alert("Download action not added yet.");
    },
    member: function () {
      alert("Member action not added yet.");
    },
    "character-luffy": function () {
      setCharacterTab("character-luffy");
    },
    "character-zoro": function () {
      setCharacterTab("character-zoro");
    },
    "character-nami": function () {
      setCharacterTab("character-nami");
    },
    "character-prev": function () {
      cycleCharacter(-1);
    },
    "character-next": function () {
      cycleCharacter(1);
    },
    "toggle-mobile-menu": function () {
      toggleMobileMenu();
    },
    "close-mobile-menu": function () {
      closeMobileMenu();
    }
  };

  function setMobileMenuOpen(nextState) {
    if (!mobileMenu || !mobileMenuToggle) {
      return;
    }

    if (!nextState && mobileMenu.contains(document.activeElement)) {
      mobileMenuToggle.focus();
    }

    isMobileMenuOpen = nextState;
    mobileMenu.inert = !nextState;
    mobileMenu.classList.toggle("is-open", nextState);
    mobileMenu.hidden = !nextState;
    mobileMenuToggle.setAttribute("aria-expanded", String(nextState));
    document.body.classList.toggle("menu-open", nextState);

    if (nextState) {
      const firstMenuControl = mobileMenu.querySelector(
        ".mobile-menu-close, .mobile-menu-link"
      );
      if (firstMenuControl) {
        firstMenuControl.focus();
      }
    }
  }

  function toggleMobileMenu() {
    setMobileMenuOpen(!isMobileMenuOpen);
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) {
      return;
    }
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function setCharacterTab(activeAction) {
    const tabs = document.querySelectorAll(".char-tab-image");
    tabs.forEach(function (tab) {
      tab.classList.toggle("is-active", tab.dataset.action === activeAction);
    });
  }

  function cycleCharacter(direction) {
    const actions = ["character-luffy", "character-zoro", "character-nami"];
    const tabs = document.querySelectorAll(".char-tab-image");
    let activeIndex = 0;

    tabs.forEach(function (tab, index) {
      if (tab.classList.contains("is-active")) {
        activeIndex = index;
      }
    });

    const nextIndex = (activeIndex + direction + actions.length) % actions.length;
    setCharacterTab(actions[nextIndex]);
  }

  function onActionClick(event) {
    const button = event.currentTarget;
    const action = button.dataset.action;
    const handler = actionHandlers[action];
    if (typeof handler === "function") {
      handler();
    }

    if (
      button.closest(".mobile-menu-overlay") &&
      action !== "toggle-mobile-menu" &&
      action !== "close-mobile-menu"
    ) {
      closeMobileMenu();
    }
  }

  function onWindowResize() {
    if (window.innerWidth > MOBILE_BREAKPOINT && isMobileMenuOpen) {
      closeMobileMenu();
    }
  }

  function onDocumentKeyDown(event) {
    if (event.key === "Escape" && isMobileMenuOpen) {
      closeMobileMenu();
    }
  }

  function onMenuOverlayClick(event) {
    if (event.target === mobileMenu) {
      closeMobileMenu();
    }
  }

  function bindActionButtons() {
    const buttons = document.querySelectorAll("[data-action]");
    buttons.forEach(function (button) {
      button.addEventListener("click", onActionClick);
    });
  }

  function bindMobileMenuEvents() {
    if (mobileMenu) {
      mobileMenu.inert = true;
    }

    window.addEventListener("resize", onWindowResize);
    document.addEventListener("keydown", onDocumentKeyDown);

    if (mobileMenu) {
      mobileMenu.addEventListener("click", onMenuOverlayClick);
    }
  }

  function initScrollAnimations() {
    const revealGroups = [
      { selector: ".logo-button, .header-nav-button", animation: "reveal-pop", step: 45, startDelay: 0 },
      { selector: ".hero-title-image, .hero-detail-image", animation: "reveal-left", step: 90, startDelay: 80 },
      { selector: ".store-buttons .image-button, .play-btn, .action-buttons .image-button", animation: "reveal-pop", step: 70, startDelay: 120 },
      { selector: ".hero-character-wrap", animation: "reveal-right", step: 0, startDelay: 140 },
      { selector: ".feature-title-image, .feature-screen, .feature-detail-image", animation: "reveal-left", step: 110, startDelay: 60 },
      { selector: ".feature-portrait", animation: "reveal-right", step: 0, startDelay: 120 },
      { selector: ".character-title-image, .character-nameplate, .character-copy, .character-tabs", animation: "reveal-left", step: 85, startDelay: 60 },
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
        item.style.setProperty("--reveal-delay", group.startDelay + index * group.step + "ms");
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

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            return;
          }
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
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
        }
      });
    });
  }

  bindActionButtons();
  bindMobileMenuEvents();
  initScrollAnimations();
})();
