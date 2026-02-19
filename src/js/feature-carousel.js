(function (window, document) {
  const FEATURE_SLIDE_INTERVAL_MS = 5000;
  const FEATURE_TRANSITION_MS = 420;
  const FEATURE_TRANSITION_SETTLE_MS = 48;
  const FEATURE_SLIDES = [
    { src: "assests/main_web/page2/Game/Game.png", alt: "Gameplay preview 1" },
    { src: "assests/main_web/page2/Game/Game%20copy.png", alt: "Gameplay preview 2" },
    { src: "assests/main_web/page2/Game/Game%20copy%202.png", alt: "Gameplay preview 3" },
    { src: "assests/main_web/page2/Game/Game%20copy%203.png", alt: "Gameplay preview 4" }
  ];
  const app = (window.PrinceSite = window.PrinceSite || {});
  let featureImageElement = null;
  let featureSlideIndex = 0;
  let featureAutoTimer = null;
  let featureTransitionTimer = null;
  let featurePendingSlideIndex = null;
  let featurePendingDirection = 1;
  let featureIndicatorDots = [];
  let isFeatureAnimating = false;
  let isInitialized = false;

  function normalizeFeatureSlideIndex(index) {
    if (!FEATURE_SLIDES.length) {
      return 0;
    }
    return (index + FEATURE_SLIDES.length) % FEATURE_SLIDES.length;
  }

  function updateFeatureSlideIndicator() {
    if (!featureIndicatorDots.length) {
      return;
    }

    featureIndicatorDots.forEach(function (dot, index) {
      dot.classList.toggle("is-active", index === featureSlideIndex);
    });
  }

  function applyFeatureSlide(index) {
    if (!featureImageElement || !FEATURE_SLIDES.length) {
      return;
    }

    featureSlideIndex = normalizeFeatureSlideIndex(index);
    const slide = FEATURE_SLIDES[featureSlideIndex];
    featureImageElement.src = slide.src;
    featureImageElement.alt = slide.alt;
    updateFeatureSlideIndicator();
  }

  function initFeatureSlideIndicator() {
    const indicator = document.querySelector(".feature-slide-indicator");
    if (!indicator) {
      featureIndicatorDots = [];
      return;
    }

    indicator.textContent = "";
    featureIndicatorDots = FEATURE_SLIDES.map(function (_slide, index) {
      const dot = document.createElement("span");
      dot.className = "feature-slide-dot";
      dot.dataset.slideIndex = String(index);
      indicator.appendChild(dot);
      return dot;
    });
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
      incomingImage.classList.add("is-sliding");

      requestAnimationFrame(function () {
        currentImage.classList.add(
          direction > 0 ? "is-leave-to-right" : "is-leave-to-left"
        );
        incomingImage.classList.remove(
          "is-enter-from-right",
          "is-enter-from-left"
        );
      });
    });

    clearFeatureTransitionTimers();
    featureTransitionTimer = setTimeout(function () {
      applyFeatureSlide(targetIndex);
      resetFeatureImageClasses();
      removeFeatureIncomingImages();
      clearFeatureTransitionTimers();
      finishFeatureAnimation();
    }, FEATURE_TRANSITION_MS + FEATURE_TRANSITION_SETTLE_MS);
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
      shiftFeatureSlide(1, { restartTimer: false });
    }, FEATURE_SLIDE_INTERVAL_MS);
  }

  function shiftFeatureSlide(step, options) {
    if (!featureImageElement || FEATURE_SLIDES.length < 2) {
      return;
    }

    const direction = step >= 0 ? 1 : -1;
    setFeatureSlide(featureSlideIndex + step, { direction: direction });
    if (!options || options.restartTimer !== false) {
      startFeatureAutoTimer();
    }
  }

  function onDocumentVisibilityChange() {
    if (document.hidden) {
      clearFeatureAutoTimer();
      return;
    }
    startFeatureAutoTimer();
  }

  function onFeatureControlClick(event) {
    const action = event.currentTarget.dataset.action;
    if (action === "feature-prev") {
      shiftFeatureSlide(-1);
      return;
    }
    if (action === "feature-next") {
      shiftFeatureSlide(1);
    }
  }

  function bindFeatureControls() {
    const controls = document.querySelectorAll(
      '[data-action="feature-prev"], [data-action="feature-next"]'
    );
    controls.forEach(function (control) {
      control.addEventListener("click", onFeatureControlClick);
    });
  }

  function initFeatureCarousel() {
    if (isInitialized) {
      return;
    }
    isInitialized = true;

    featureImageElement = document.querySelector(".feature-screen-image");
    if (!featureImageElement) {
      return;
    }

    FEATURE_SLIDES.forEach(function (slide) {
      const preloadImage = new Image();
      preloadImage.src = slide.src;
    });

    bindFeatureControls();
    initFeatureSlideIndicator();
    setFeatureSlide(0, { instant: true, force: true });
    startFeatureAutoTimer();
    document.addEventListener("visibilitychange", onDocumentVisibilityChange);
  }

  app.featureCarousel = {
    shiftSlide: shiftFeatureSlide
  };
  app.initFeatureCarousel = initFeatureCarousel;
})(window, document);
