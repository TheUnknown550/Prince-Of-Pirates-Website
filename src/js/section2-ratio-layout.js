(function (window, document) {
  // Applies ratio-based layout and fit-to-section scaling for Section 2 on desktop/tablet.
  const MOBILE_BREAKPOINT = 900;
  const SCALE_START = 0.2;
  const SCALE_SCAN_START = 1;
  const SCALE_SCAN_STEP = 1.35;
  const SCALE_SCAN_MAX = 8;
  const BINARY_SEARCH_STEPS = 14;
  const OVERFLOW_TOLERANCE = 0.5;
  const ROUNDING_GUARD_STEPS = 6;
  const ROUNDING_GUARD_RATIO = 0.98;
  const MIN_FALLBACK_SCALE = 0.05;

  const CLASS_MODE = "section2-ratio-mode";
  const CLASS_PORTRAIT = "section2-ratio-portrait";
  const CLASS_LANDSCAPE = "section2-ratio-landscape";
  const RUNTIME_VARS = [
    "--s2-scale",
    "--s2-title-w",
    "--s2-screen-w",
    "--s2-detail-w",
    "--s2-zoro-w",
    "--s2-title-stage-gap",
    "--s2-stage-gap",
    "--s2-detail-gap"
  ];
  const DESIGN = {
    titleWidth: 690,
    screenWidth: 1230,
    detailWidth: 630,
    zoroWidth: 375,
    titleStageGap: 14,
    detailGap: 18,
    landscapeStageGap: 21,
    portraitStageGap: 24
  };

  const app = (window.PrinceSite = window.PrinceSite || {});
  let isInitialized = false;
  let frameId = null;
  let sectionObserver = null;
  let gameGuide = null;
  let sectionContent = null;
  let featureStage = null;
  let featureMain = null;
  let titleImage = null;
  let detailImage = null;
  let featurePortrait = null;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function cacheElements() {
    gameGuide = document.getElementById("game-guide");
    if (!gameGuide) {
      return false;
    }

    sectionContent = gameGuide.querySelector(".section-content");
    featureStage = gameGuide.querySelector(".feature-stage");
    featureMain = gameGuide.querySelector(".feature-main");
    titleImage = gameGuide.querySelector(".feature-title-image img");
    detailImage = gameGuide.querySelector(".feature-detail-image img");
    featurePortrait = gameGuide.querySelector(".feature-portrait");

    return Boolean(
      sectionContent &&
        featureStage &&
        featureMain &&
        titleImage &&
        detailImage &&
        featurePortrait
    );
  }

  function isDesktopOrTablet() {
    return window.innerWidth > MOBILE_BREAKPOINT;
  }

  function clearRuntimeVars() {
    if (!gameGuide) {
      return;
    }

    RUNTIME_VARS.forEach(function (name) {
      gameGuide.style.removeProperty(name);
    });
  }

  function clearRuntimeState() {
    if (!gameGuide) {
      return;
    }

    gameGuide.classList.remove(CLASS_MODE, CLASS_PORTRAIT, CLASS_LANDSCAPE);
    clearRuntimeVars();
  }

  function setModeClasses(isPortrait) {
    if (!gameGuide) {
      return;
    }

    gameGuide.classList.add(CLASS_MODE);
    gameGuide.classList.toggle(CLASS_PORTRAIT, isPortrait);
    gameGuide.classList.toggle(CLASS_LANDSCAPE, !isPortrait);
  }

  function setRuntimeScaleVars(scale, isPortrait) {
    if (!gameGuide) {
      return;
    }

    const stageGap = (isPortrait ? DESIGN.portraitStageGap : DESIGN.landscapeStageGap) * scale;
    gameGuide.style.setProperty("--s2-scale", scale.toFixed(6));
    gameGuide.style.setProperty("--s2-title-w", (DESIGN.titleWidth * scale).toFixed(3) + "px");
    gameGuide.style.setProperty("--s2-screen-w", (DESIGN.screenWidth * scale).toFixed(3) + "px");
    gameGuide.style.setProperty("--s2-detail-w", (DESIGN.detailWidth * scale).toFixed(3) + "px");
    gameGuide.style.setProperty("--s2-zoro-w", (DESIGN.zoroWidth * scale).toFixed(3) + "px");
    gameGuide.style.setProperty(
      "--s2-title-stage-gap",
      (DESIGN.titleStageGap * scale).toFixed(3) + "px"
    );
    gameGuide.style.setProperty("--s2-stage-gap", stageGap.toFixed(3) + "px");
    gameGuide.style.setProperty("--s2-detail-gap", (DESIGN.detailGap * scale).toFixed(3) + "px");
  }

  function doesContentOverflow(maxWidth, maxHeight) {
    if (!sectionContent) {
      return true;
    }

    const contentRect = sectionContent.getBoundingClientRect();
    return (
      contentRect.width > maxWidth + OVERFLOW_TOLERANCE ||
      contentRect.height > maxHeight + OVERFLOW_TOLERANCE
    );
  }

  function applyRoundingGuard(scale, maxWidth, maxHeight, isPortrait) {
    let guardedScale = scale;
    setRuntimeScaleVars(guardedScale, isPortrait);

    for (let i = 0; i < ROUNDING_GUARD_STEPS; i += 1) {
      if (!doesContentOverflow(maxWidth, maxHeight)) {
        break;
      }

      guardedScale *= ROUNDING_GUARD_RATIO;
      setRuntimeScaleVars(guardedScale, isPortrait);
    }

    return guardedScale;
  }

  function fitScaleToBounds(maxWidth, maxHeight, isPortrait) {
    let low = SCALE_START;
    let high = SCALE_SCAN_START;

    setRuntimeScaleVars(low, isPortrait);
    let lowOverflows = doesContentOverflow(maxWidth, maxHeight);
    while (lowOverflows && low > MIN_FALLBACK_SCALE) {
      low *= 0.85;
      setRuntimeScaleVars(low, isPortrait);
      lowOverflows = doesContentOverflow(maxWidth, maxHeight);
    }

    if (lowOverflows) {
      return applyRoundingGuard(low, maxWidth, maxHeight, isPortrait);
    }

    high = Math.max(high, low);
    setRuntimeScaleVars(high, isPortrait);
    let highOverflows = doesContentOverflow(maxWidth, maxHeight);

    while (!highOverflows && high < SCALE_SCAN_MAX) {
      low = high;
      high = Math.min(SCALE_SCAN_MAX, high * SCALE_SCAN_STEP);
      setRuntimeScaleVars(high, isPortrait);
      highOverflows = doesContentOverflow(maxWidth, maxHeight);
    }

    if (!highOverflows) {
      return applyRoundingGuard(high, maxWidth, maxHeight, isPortrait);
    }

    for (let i = 0; i < BINARY_SEARCH_STEPS; i += 1) {
      const mid = (low + high) / 2;
      setRuntimeScaleVars(mid, isPortrait);

      if (doesContentOverflow(maxWidth, maxHeight)) {
        high = mid;
      } else {
        low = mid;
      }
    }

    return applyRoundingGuard(low, maxWidth, maxHeight, isPortrait);
  }

  function updateLayout() {
    if (!cacheElements()) {
      return;
    }

    if (!isDesktopOrTablet()) {
      clearRuntimeState();
      return;
    }

    const sectionRect = gameGuide.getBoundingClientRect();
    if (sectionRect.width <= 0 || sectionRect.height <= 0) {
      return;
    }

    const isPortrait = sectionRect.width < sectionRect.height;
    setModeClasses(isPortrait);

    const safeX = clamp(sectionRect.width * 0.02, 16, 40);
    const safeY = clamp(sectionRect.height * 0.02, 12, 36);
    const availableWidth = Math.max(1, sectionRect.width - safeX * 2);
    const availableHeight = Math.max(1, sectionRect.height - safeY * 2);

    fitScaleToBounds(availableWidth, availableHeight, isPortrait);
  }

  function scheduleLayout() {
    if (frameId !== null) {
      return;
    }

    frameId = window.requestAnimationFrame(function () {
      frameId = null;
      updateLayout();
    });
  }

  function bindImageLoadRelayout() {
    if (!gameGuide) {
      return;
    }

    const images = gameGuide.querySelectorAll("img");
    images.forEach(function (image) {
      if (image.complete) {
        return;
      }

      image.addEventListener("load", scheduleLayout, { once: true });
      image.addEventListener("error", scheduleLayout, { once: true });
    });
  }

  function initResizeObserver() {
    if (!("ResizeObserver" in window) || !gameGuide) {
      return;
    }

    sectionObserver = new window.ResizeObserver(function () {
      scheduleLayout();
    });
    sectionObserver.observe(gameGuide);
  }

  function initSection2RatioLayout() {
    if (isInitialized) {
      return;
    }
    isInitialized = true;

    if (!cacheElements()) {
      return;
    }

    window.addEventListener("resize", scheduleLayout);
    window.addEventListener("orientationchange", scheduleLayout);

    initResizeObserver();
    bindImageLoadRelayout();
    scheduleLayout();
  }

  app.initSection2RatioLayout = initSection2RatioLayout;
})(window, document);
