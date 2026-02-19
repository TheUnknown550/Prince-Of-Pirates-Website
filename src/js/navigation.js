(function (window, document) {
  const MOBILE_BREAKPOINT = 900;
  const app = (window.PrinceSite = window.PrinceSite || {});
  const mobileMenu = document.getElementById("mobile-nav-overlay");
  const mobileMenuToggle = document.querySelector(".mobile-menu-toggle");
  let isMobileMenuOpen = false;
  let isInitialized = false;

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

  const actionHandlers = {
    "reload-page": function () {
      window.location.reload();
    },
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
    "toggle-mobile-menu": function () {
      toggleMobileMenu();
    },
    "close-mobile-menu": function () {
      closeMobileMenu();
    }
  };

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

  function initNavigation() {
    if (isInitialized) {
      return;
    }
    isInitialized = true;
    bindActionButtons();
    bindMobileMenuEvents();
  }

  app.navigation = {
    scrollToSection: scrollToSection,
    closeMobileMenu: closeMobileMenu,
    isMenuOpen: function () {
      return isMobileMenuOpen;
    }
  };
  app.initNavigation = initNavigation;
})(window, document);
