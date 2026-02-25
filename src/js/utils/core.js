(function (window) {
  // Shared pure utilities used across feature modules.
  // These helpers intentionally avoid DOM coupling so stateful modules can
  // import common math/focus behavior without changing their public APIs.
  const app = (window.PrinceSite = window.PrinceSite || {});
  const existingUtils = app.utils || {};
  const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }
  

  function toNumber(value) {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function normalizeDirection(direction) {
    if (direction > 0) {
      return 1;
    }
    if (direction < 0) {
      return -1;
    }
    return 0;
  }

  function createReducedMotionQuery(windowRef) {
    const targetWindow = windowRef || window;
    if (!targetWindow || typeof targetWindow.matchMedia !== "function") {
      return { matches: false };
    }
    return targetWindow.matchMedia(REDUCED_MOTION_QUERY);
  }

  function shouldReduceMotion(query) {
    return Boolean(query && query.matches);
  }

  function safeFocus(target, options) {
    if (!target || typeof target.focus !== "function") {
      return false;
    }

    try {
      target.focus(options || { preventScroll: true });
      return true;
    } catch (_error) {
      target.focus();
      return true;
    }
  }

  app.utils = Object.assign(existingUtils, {
    clamp: clamp,
    toNumber: toNumber,
    normalizeDirection: normalizeDirection,
    createReducedMotionQuery: createReducedMotionQuery,
    shouldReduceMotion: shouldReduceMotion,
    safeFocus: safeFocus
  });
})(window);
