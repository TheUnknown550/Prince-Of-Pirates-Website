(function () {
  const MOBILE_BREAKPOINT = 900;
  const SNAP_LOCK_MS = 680;
  const SNAP_ANCHOR_LOCK_MS = 320;
  const WHEEL_THRESHOLD = 16;
  const SWIPE_THRESHOLD = 42;
  const SNAP_EDGE_TOLERANCE = 10;
  const SNAP_SETTLE_TOLERANCE = 2;
  const SNAP_QUEUE_DELAY_MS = 220;
  const FEATURE_SLIDE_INTERVAL_MS = 5000;
  const FEATURE_TRANSITION_MS = 420;
  const FEATURE_SLIDES = [
    { src: "assests/main_web/page2/Game/Game.png", alt: "Gameplay preview 1" },
    { src: "assests/main_web/page2/Game/Game%20copy.png", alt: "Gameplay preview 2" },
    { src: "assests/main_web/page2/Game/Game%20copy%202.png", alt: "Gameplay preview 3" },
    { src: "assests/main_web/page2/Game/Game%20copy%203.png", alt: "Gameplay preview 4" }
  ];
  const mobileMenu = document.getElementById("mobile-nav-overlay");
  const mobileMenuToggle = document.querySelector(".mobile-menu-toggle");
  let sectionSteps = [];
  let isSnapLocked = false;
  let touchStartY = null;
  let snapUnlockTimer = null;
  let snapLockStartedAt = 0;
  let queuedSnapDirection = 0;
  let featureImageElement = null;
  let featureSlideIndex = 0;
  let featureAutoTimer = null;
  let featureTransitionTimer = null;
  let featurePendingSlideIndex = null;
  let featurePendingDirection = 1;
  let isFeatureAnimating = false;
  let isMobileMenuOpen = false;

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
    "feature-prev": function () {
      shiftFeatureSlide(-1);
    },
    "feature-next": function () {
      shiftFeatureSlide(1);
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

  function normalizeFeatureSlideIndex(index) {
    if (!FEATURE_SLIDES.length) {
      return 0;
    }
    return (index + FEATURE_SLIDES.length) % FEATURE_SLIDES.length;
  }

  function applyFeatureSlide(index) {
    if (!featureImageElement || !FEATURE_SLIDES.length) {
      return;
    }

    featureSlideIndex = normalizeFeatureSlideIndex(index);
    const slide = FEATURE_SLIDES[featureSlideIndex];
    featureImageElement.src = slide.src;
    featureImageElement.alt = slide.alt;
  }

  function removeFeatureIncomingImages() {
    if (!featureImageElement || !featureImageElement.parentElement) {
      return;
    }
    const incomingImages = featureImageElement.parentElement.querySelectorAll(
      ".feature-screen-image.is-feature-incoming"
    );
    incomingImages.forEach(function (image) {
      image.remove();
    });
  }

  function clearFeatureTransitionTimers() {
    if (featureTransitionTimer) {
      clearTimeout(featureTransitionTimer);
      featureTransitionTimer = null;
    }
  }

  function resetFeatureImageClasses() {
    if (!featureImageElement) {
      return;
    }

    featureImageElement.classList.remove(
      "is-sliding",
      "is-feature-incoming",
      "is-enter-from-right",
      "is-enter-from-left",
      "is-leave-to-left",
      "is-leave-to-right"
    );
  }

  function getFeatureSlideDirection(currentIndex, targetIndex, explicitDirection) {
    if (explicitDirection === 1 || explicitDirection === -1) {
      return explicitDirection;
    }
    if (targetIndex === currentIndex) {
      return 0;
    }
    return targetIndex > currentIndex ? 1 : -1;
  }

  function finishFeatureAnimation() {
    isFeatureAnimating = false;
    if (
      featurePendingSlideIndex === null ||
      featurePendingSlideIndex === featureSlideIndex
    ) {
      featurePendingSlideIndex = null;
      featurePendingDirection = 1;
      return;
    }

    const pendingIndex = featurePendingSlideIndex;
    const pendingDirection = featurePendingDirection;
    featurePendingSlideIndex = null;
    featurePendingDirection = 1;
    setFeatureSlide(pendingIndex, { direction: pendingDirection, force: true });
  }

  function runFeatureSlideTransition(targetIndex, direction) {
    if (!featureImageElement || !featureImageElement.parentElement) {
      applyFeatureSlide(targetIndex);
      finishFeatureAnimation();
      return;
    }

    const container = featureImageElement.parentElement;
    const currentImage = featureImageElement;
    const targetSlide = FEATURE_SLIDES[targetIndex];
    const incomingImage = currentImage.cloneNode(false);

    incomingImage.src = targetSlide.src;
    incomingImage.alt = targetSlide.alt;
    incomingImage.classList.add("is-feature-incoming");
    incomingImage.classList.add(
      direction > 0 ? "is-enter-from-left" : "is-enter-from-right"
    );
    container.insertBefore(incomingImage, currentImage.nextSibling);

    requestAnimationFrame(function () {
      currentImage.classList.add("is-sliding");
      currentImage.classList.add(
        direction > 0 ? "is-leave-to-right" : "is-leave-to-left"
      );

      incomingImage.classList.add("is-sliding");
      incomingImage.classList.remove("is-enter-from-right", "is-enter-from-left");
    });

    clearFeatureTransitionTimers();
    featureTransitionTimer = setTimeout(function () {
      applyFeatureSlide(targetIndex);
      resetFeatureImageClasses();
      removeFeatureIncomingImages();
      clearFeatureTransitionTimers();
      finishFeatureAnimation();
    }, FEATURE_TRANSITION_MS);
  }

  function setFeatureSlide(index, options) {
    if (!featureImageElement || !FEATURE_SLIDES.length) {
      return;
    }

    const normalizedIndex = normalizeFeatureSlideIndex(index);
    const instant = options && options.instant;
    const force = options && options.force;
    const direction = getFeatureSlideDirection(
      featureSlideIndex,
      normalizedIndex,
      options && options.direction
    );

    if (!force && normalizedIndex === featureSlideIndex && !isFeatureAnimating) {
      return;
    }

    if (instant) {
      clearFeatureTransitionTimers();
      resetFeatureImageClasses();
      removeFeatureIncomingImages();
      isFeatureAnimating = false;
      featurePendingSlideIndex = null;
      featurePendingDirection = 1;
      applyFeatureSlide(normalizedIndex);
      return;
    }

    if (isFeatureAnimating) {
      featurePendingSlideIndex = normalizedIndex;
      if (direction === 1 || direction === -1) {
        featurePendingDirection = direction;
      }
      return;
    }

    if (!force && direction === 0) {
      return;
    }

    isFeatureAnimating = true;
    featurePendingSlideIndex = null;
    featurePendingDirection = 1;
    clearFeatureTransitionTimers();
    runFeatureSlideTransition(normalizedIndex, direction || 1);
  }

  function clearFeatureAutoTimer() {
    if (!featureAutoTimer) {
      return;
    }
    clearInterval(featureAutoTimer);
    featureAutoTimer = null;
  }

  function startFeatureAutoTimer() {
    clearFeatureAutoTimer();
    if (!featureImageElement || FEATURE_SLIDES.length < 2) {
      return;
    }

    featureAutoTimer = setInterval(function () {
      setFeatureSlide(featureSlideIndex + 1, { direction: 1 });
    }, FEATURE_SLIDE_INTERVAL_MS);
  }

  function shiftFeatureSlide(step) {
    if (!featureImageElement || FEATURE_SLIDES.length < 2) {
      return;
    }
    const direction = step >= 0 ? 1 : -1;
    setFeatureSlide(featureSlideIndex + step, { direction: direction });
    startFeatureAutoTimer();
  }

  function onDocumentVisibilityChange() {
    if (document.hidden) {
      clearFeatureAutoTimer();
      return;
    }
    startFeatureAutoTimer();
  }

  function initFeatureCarousel() {
    featureImageElement = document.querySelector(".feature-screen-image");
    if (!featureImageElement) {
      return;
    }

    FEATURE_SLIDES.forEach(function (slide) {
      const preloadImage = new Image();
      preloadImage.src = slide.src;
    });

    setFeatureSlide(0, { instant: true, force: true });
    startFeatureAutoTimer();
    document.addEventListener("visibilitychange", onDocumentVisibilityChange);
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

  function collectSectionSteps() {
    return Array.prototype.slice.call(
      document.querySelectorAll(".bg-frame, .site-footer")
    );
  }

  function isEditableTarget(target) {
    if (!target) {
      return false;
    }
    const tag = target.tagName ? target.tagName.toLowerCase() : "";
    return (
      tag === "input" ||
      tag === "textarea" ||
      tag === "select" ||
      tag === "button" ||
      tag === "a" ||
      target.isContentEditable
    );
  }

  function getClosestSectionIndex() {
    if (!sectionSteps.length) {
      return 0;
    }

    const viewportMid = window.scrollY + window.innerHeight / 2;
    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;

    sectionSteps.forEach(function (section, index) {
      const sectionMid = section.offsetTop + section.offsetHeight / 2;
      const distance = Math.abs(sectionMid - viewportMid);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });

    return bestIndex;
  }

  function getScrollSectionIndex() {
    if (!sectionSteps.length) {
      return 0;
    }

    const y = window.scrollY + SNAP_SETTLE_TOLERANCE;
    for (let i = sectionSteps.length - 1; i >= 0; i -= 1) {
      if (y >= sectionSteps[i].offsetTop - SNAP_SETTLE_TOLERANCE) {
        return i;
      }
    }

    return 0;
  }

  function getSectionAnchors(index) {
    if (index < 0 || index >= sectionSteps.length) {
      return null;
    }

    const section = sectionSteps[index];
    if (!section) {
      return null;
    }

    const top = section.offsetTop;
    const bottom = Math.max(top, top + section.offsetHeight - window.innerHeight);
    return { top: top, bottom: bottom };
  }

  function scrollToPosition(top) {
    window.scrollTo({ top: top, behavior: "smooth" });
  }

  function lockSnapScroll(duration) {
    isSnapLocked = true;
    snapLockStartedAt = Date.now();
    if (snapUnlockTimer) {
      clearTimeout(snapUnlockTimer);
    }
    const lockDuration = typeof duration === "number" ? duration : SNAP_LOCK_MS;
    snapUnlockTimer = setTimeout(function () {
      isSnapLocked = false;
      if (!queuedSnapDirection) {
        return;
      }
      const direction = queuedSnapDirection;
      queuedSnapDirection = 0;
      moveBySection(direction);
    }, lockDuration);
  }

  function requestSectionMove(direction) {
    if (!direction) {
      return;
    }

    if (isSnapLocked) {
      if (Date.now() - snapLockStartedAt < SNAP_QUEUE_DELAY_MS) {
        return;
      }
      queuedSnapDirection = direction;
      return;
    }

    moveBySection(direction);
  }

  function scrollToSectionIndex(index) {
    if (!sectionSteps.length) {
      return;
    }
    const clampedIndex = Math.max(0, Math.min(index, sectionSteps.length - 1));
    const target = sectionSteps[clampedIndex];
    if (!target) {
      return;
    }
    scrollToPosition(target.offsetTop);
  }

  function moveBySection(direction) {
    if (isMobileMenuOpen || isSnapLocked || !sectionSteps.length) {
      return;
    }

    const currentIndex = getScrollSectionIndex();
    const anchors = getSectionAnchors(currentIndex);
    if (!anchors) {
      return;
    }

    const currentY = window.scrollY;
    const lastIndex = sectionSteps.length - 1;

    if (direction > 0) {
      if (currentY < anchors.bottom - SNAP_EDGE_TOLERANCE) {
        lockSnapScroll(SNAP_ANCHOR_LOCK_MS);
        scrollToPosition(anchors.bottom);
        return;
      }

      const nextIndex = Math.min(currentIndex + 1, lastIndex);
      if (nextIndex !== currentIndex) {
        lockSnapScroll();
        scrollToSectionIndex(nextIndex);
        return;
      }

      if (Math.abs(currentY - anchors.bottom) > SNAP_SETTLE_TOLERANCE) {
        lockSnapScroll(SNAP_ANCHOR_LOCK_MS);
        scrollToPosition(anchors.bottom);
      }
      return;
    }

    if (direction < 0) {
      if (currentY > anchors.top + SNAP_EDGE_TOLERANCE) {
        lockSnapScroll(SNAP_ANCHOR_LOCK_MS);
        scrollToPosition(anchors.top);
        return;
      }

      const prevIndex = Math.max(currentIndex - 1, 0);
      if (prevIndex !== currentIndex) {
        lockSnapScroll();
        scrollToSectionIndex(prevIndex);
        return;
      }

      if (Math.abs(currentY - anchors.top) > SNAP_SETTLE_TOLERANCE) {
        lockSnapScroll(SNAP_ANCHOR_LOCK_MS);
        scrollToPosition(anchors.top);
      }
      return;
    }
  }

  function onSnapWheel(event) {
    if (isMobileMenuOpen) {
      return;
    }

    if (Math.abs(event.deltaY) < WHEEL_THRESHOLD) {
      return;
    }

    event.preventDefault();
    const direction = event.deltaY > 0 ? 1 : -1;
    requestSectionMove(direction);
  }

  function onSnapKeyDown(event) {
    if (isMobileMenuOpen || isEditableTarget(event.target)) {
      return;
    }

    const isDownIntent =
      event.key === "ArrowDown" ||
      event.key === "PageDown" ||
      (event.key === " " && !event.shiftKey);

    if (isDownIntent) {
      event.preventDefault();
      requestSectionMove(1);
      return;
    }

    const isUpIntent =
      event.key === "ArrowUp" ||
      event.key === "PageUp" ||
      (event.key === " " && event.shiftKey);

    if (isUpIntent) {
      event.preventDefault();
      requestSectionMove(-1);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      lockSnapScroll();
      scrollToSectionIndex(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      lockSnapScroll();
      scrollToSectionIndex(sectionSteps.length - 1);
    }
  }

  function onSnapTouchStart(event) {
    if (!event.touches || !event.touches.length) {
      return;
    }
    touchStartY = event.touches[0].clientY;
  }

  function onSnapTouchEnd(event) {
    if (touchStartY === null || !event.changedTouches || !event.changedTouches.length) {
      touchStartY = null;
      return;
    }

    const touchEndY = event.changedTouches[0].clientY;
    const deltaY = touchStartY - touchEndY;
    touchStartY = null;

    if (Math.abs(deltaY) < SWIPE_THRESHOLD) {
      return;
    }

    const direction = deltaY > 0 ? 1 : -1;
    requestSectionMove(direction);
  }

  function onSnapResize() {
    sectionSteps = collectSectionSteps();
  }

  function initSectionSnapScroll() {
    sectionSteps = collectSectionSteps();
    if (sectionSteps.length < 2) {
      return;
    }

    document.documentElement.classList.add("section-snap-enabled");
    document.body.classList.add("section-snap-enabled");

    window.addEventListener("wheel", onSnapWheel, { passive: false });
    window.addEventListener("touchstart", onSnapTouchStart, { passive: true });
    window.addEventListener("touchend", onSnapTouchEnd, { passive: true });
    window.addEventListener("keydown", onSnapKeyDown);
    window.addEventListener("resize", onSnapResize);
  }

  function initScrollAnimations() {
    const revealGroups = [
      { selector: ".logo-button, .header-nav-button", animation: "reveal-pop", step: 45, startDelay: 0 },
      { selector: ".hero-title-image, .hero-detail-image", animation: "reveal-left", step: 90, startDelay: 80 },
      { selector: ".store-buttons .image-button, .play-btn, .action-buttons .image-button", animation: "reveal-pop", step: 70, startDelay: 120 },
      { selector: ".hero-character-wrap", animation: "reveal-pop", step: 0, startDelay: 140 },
      { selector: ".feature-title-image, .feature-detail-image", animation: "reveal-left", step: 0, startDelay: 60 },
      { selector: ".feature-screen", animation: "reveal-left", step: 0, startDelay: 170 },
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

    function revealTogether(selector) {
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

  bindActionButtons();
  bindMobileMenuEvents();
  initFeatureCarousel();
  initSectionSnapScroll();
  initScrollAnimations();
})();
