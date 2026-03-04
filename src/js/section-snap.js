(function (window, document) {
  // Implements smooth section-by-section snap scrolling for wheel, keyboard, and touch.
  // The refactor keeps every threshold and timing value identical so scrolling
  // behavior remains pixel-for-pixel consistent with prior implementation.
  const WHEEL_THRESHOLD = 22;
  const SWIPE_THRESHOLD = 42;
  const SNAP_EDGE_TOLERANCE = 10;
  const SNAP_SETTLE_TOLERANCE = 2;
  const TWEEN_DURATION_MIN = 720;
  const TWEEN_DURATION_MAX = 2240;
  const TWEEN_DURATION_FACTOR = 1.84;
  const HYBRID_CHAIN_WINDOW_MS = 260;
  const app = (window.PrinceSite = window.PrinceSite || {});
  const coreUtils = app.utils || {};
  const clamp = coreUtils.clamp || function (value, min, max) {
    return Math.min(max, Math.max(min, value));
  };
  
  const normalizeDirection = coreUtils.normalizeDirection || function (direction) {
    if (direction > 0) {
      return 1;
    }
    if (direction < 0) {
      return -1;
    }
    return 0;
  };
  const createReducedMotionQuery =
    coreUtils.createReducedMotionQuery || function (windowRef) {
      if (!windowRef || typeof windowRef.matchMedia !== "function") {
        return { matches: false };
      }
      return windowRef.matchMedia("(prefers-reduced-motion: reduce)");
    };

  let sectionSteps = [];
  let touchStartY = null;
  let wheelAccumulator = 0;
  let queuedSnapDirection = 0;
  let queuedSnapAt = 0;
  let activeTweenId = null;
  let activeFromY = 0;
  let activeToY = 0;
  let activeStartedAt = 0;
  let activeDurationMs = 0;
  let activeDirection = 0;
  let activeTargetIndex = -1;
  let activeMoveKind = "none";
  let isAnimating = false;
  let isInitialized = false;

  const reduceMotionQuery = createReducedMotionQuery(window);

  function isMenuOpen() {
    // Suspend snap behavior while overlays are active.
    return (
      document.body.classList.contains("menu-open") ||
      document.body.classList.contains("login-modal-open") ||
      document.body.classList.contains("register-modal-open") ||
      document.body.classList.contains("server-modal-open")
    );
  }

  function collectSectionSteps() {
    // Snap targets include all full-page sections and the footer.
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

  function getMaxScrollTop() {
    return Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight
    );
  }

  function normalizeScrollTop(top) {
    return clamp(top, 0, getMaxScrollTop());
  }

  function easeInOutCubic(progress) {
    return progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
  }

  function refreshSectionSteps() {
    sectionSteps = collectSectionSteps();
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

  function clearQueuedSnap() {
    queuedSnapDirection = 0;
    queuedSnapAt = 0;
  }

  function stopAnimation(options) {
    const shouldClearQueue = options && options.clearQueue;
    if (activeTweenId !== null) {
      window.cancelAnimationFrame(activeTweenId);
    }

    activeTweenId = null;
    isAnimating = false;
    activeFromY = window.scrollY;
    activeToY = window.scrollY;
    activeStartedAt = 0;
    activeDurationMs = 0;
    activeDirection = 0;
    activeTargetIndex = -1;
    activeMoveKind = "none";
    wheelAccumulator = 0;

    if (shouldClearQueue) {
      clearQueuedSnap();
    }
  }

  function resolveTweenDuration(distance) {
    return clamp(
      distance * TWEEN_DURATION_FACTOR,
      TWEEN_DURATION_MIN,
      TWEEN_DURATION_MAX
    );
  }

  function moveBySection(direction) {
    if (isMenuOpen() || isAnimating || !sectionSteps.length || !direction) {
      return;
    }

    const currentIndex = getScrollSectionIndex();
    const anchors = getSectionAnchors(currentIndex);
    if (!anchors) {
      return;
    }

    const lastIndex = sectionSteps.length - 1;
    const currentY = window.scrollY;

    if (direction > 0) {
      if (currentY < anchors.bottom - SNAP_EDGE_TOLERANCE) {
        animateTo(anchors.bottom, {
          direction: 1,
          targetIndex: currentIndex,
          moveKind: "boundary"
        });
        return;
      }

      const nextIndex = Math.min(currentIndex + 1, lastIndex);
      if (nextIndex !== currentIndex) {
        animateTo(sectionSteps[nextIndex].offsetTop, {
          direction: 1,
          targetIndex: nextIndex,
          moveKind: "section"
        });
        return;
      }

      if (Math.abs(currentY - anchors.bottom) > SNAP_SETTLE_TOLERANCE) {
        animateTo(anchors.bottom, {
          direction: 1,
          targetIndex: currentIndex,
          moveKind: "boundary"
        });
      }
      return;
    }

    if (direction < 0) {
      if (currentY > anchors.top + SNAP_EDGE_TOLERANCE) {
        animateTo(anchors.top, {
          direction: -1,
          targetIndex: currentIndex,
          moveKind: "boundary"
        });
        return;
      }

      const prevIndex = Math.max(currentIndex - 1, 0);
      if (prevIndex !== currentIndex) {
        animateTo(sectionSteps[prevIndex].offsetTop, {
          direction: -1,
          targetIndex: prevIndex,
          moveKind: "section"
        });
        return;
      }

      if (Math.abs(currentY - anchors.top) > SNAP_SETTLE_TOLERANCE) {
        animateTo(anchors.top, {
          direction: -1,
          targetIndex: currentIndex,
          moveKind: "boundary"
        });
      }
    }
  }

  function maybeChainQueuedSnap(completedMoveKind, completedDirection) {
    // Chain only after boundary moves. This enables the hybrid "edge then section"
    // feel while preventing accidental multi-step jumps from stale wheel input.
    if (completedMoveKind !== "boundary") {
      clearQueuedSnap();
      return;
    }

    if (!queuedSnapDirection || queuedSnapDirection !== completedDirection) {
      clearQueuedSnap();
      return;
    }

    if (Date.now() - queuedSnapAt > HYBRID_CHAIN_WINDOW_MS) {
      // Expire queued direction quickly so delayed wheel events do not
      // trigger surprise navigation after user pauses.
      clearQueuedSnap();
      return;
    }

    const direction = queuedSnapDirection;
    clearQueuedSnap();
    moveBySection(direction);
  }

  function animateTo(top, options) {
    const targetTop = normalizeScrollTop(top);
    const distance = Math.abs(window.scrollY - targetTop);

    if (distance <= SNAP_SETTLE_TOLERANCE) {
      window.scrollTo({ top: targetTop, behavior: "auto" });
      return;
    }

    if (reduceMotionQuery.matches) {
      stopAnimation({ clearQueue: true });
      window.scrollTo({ top: targetTop, behavior: "auto" });
      return;
    }

    const nextDirection = normalizeDirection(
      options && typeof options.direction === "number" ? options.direction : 0
    );
    const nextTargetIndex =
      options && typeof options.targetIndex === "number"
        ? options.targetIndex
        : -1;
    const nextMoveKind =
      options && options.moveKind === "boundary" ? "boundary" : "section";

    stopAnimation({ clearQueue: false });
    isAnimating = true;
    activeFromY = window.scrollY;
    activeToY = targetTop;
    activeStartedAt = performance.now();
    activeDurationMs = resolveTweenDuration(distance);
    activeDirection = nextDirection;
    activeTargetIndex = nextTargetIndex;
    activeMoveKind = nextMoveKind;

    function step(now) {
      if (!isAnimating) {
        return;
      }

      if (isMenuOpen()) {
        stopAnimation({ clearQueue: true });
        return;
      }

      const elapsed = now - activeStartedAt;
      const progress = clamp(elapsed / activeDurationMs, 0, 1);
      const easedProgress = easeInOutCubic(progress);
      // Manual tweening is used instead of smooth-scroll so we can:
      // - interrupt/replace animations deterministically
      // - chain boundary->section moves
      // - suspend motion immediately when overlays open
      const nextTop = activeFromY + (activeToY - activeFromY) * easedProgress;
      window.scrollTo({ top: nextTop, behavior: "auto" });

      if (progress < 1) {
        activeTweenId = window.requestAnimationFrame(step);
        return;
      }

      const completedDirection = activeDirection;
      const completedMoveKind = activeMoveKind;
      window.scrollTo({ top: activeToY, behavior: "auto" });
      stopAnimation({ clearQueue: false });
      maybeChainQueuedSnap(completedMoveKind, completedDirection);
    }

    activeTweenId = window.requestAnimationFrame(step);
  }

  function requestSectionMove(direction) {
    if (!direction || isMenuOpen()) {
      return;
    }

    refreshSectionSteps();
    if (!sectionSteps.length) {
      return;
    }

    const normalizedDirection = normalizeDirection(direction);
    if (normalizedDirection === 0) {
      return;
    }

    if (isAnimating) {
      if (normalizedDirection === activeDirection) {
        // Same-direction input while animating stores a short-lived intent
        // that may chain after a boundary snap completes.
        queuedSnapDirection = normalizedDirection;
        queuedSnapAt = Date.now();
        return;
      }

      // Opposite-direction input cancels and immediately starts the new intent.
      stopAnimation({ clearQueue: true });
      moveBySection(normalizedDirection);
      return;
    }

    moveBySection(normalizedDirection);
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

    animateTo(target.offsetTop, {
      direction: 0,
      targetIndex: clampedIndex,
      moveKind: "section"
    });
  }

  function scrollToSectionById(sectionId) {
    if (!sectionId) {
      return;
    }

    refreshSectionSteps();
    const section = document.getElementById(sectionId);
    if (!section) {
      return;
    }

    const targetIndex = sectionSteps.indexOf(section);
    animateTo(section.offsetTop, {
      direction: 0,
      targetIndex: targetIndex,
      moveKind: "section"
    });
  }

  function onSnapWheel(event) {
    if (isMenuOpen()) {
      return;
    }

    event.preventDefault();
    wheelAccumulator += event.deltaY;

    if (Math.abs(wheelAccumulator) < WHEEL_THRESHOLD) {
      return;
    }

    const direction = wheelAccumulator > 0 ? 1 : -1;
    wheelAccumulator = 0;
    requestSectionMove(direction);
  }

  function onSnapKeyDown(event) {
    if (isMenuOpen() || isEditableTarget(event.target)) {
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
      scrollToSectionIndex(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
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
    stopAnimation({ clearQueue: true });
    refreshSectionSteps();
  }

  function initSectionSnapScroll() {
    if (isInitialized) {
      return;
    }
    isInitialized = true;

    refreshSectionSteps();
    if (sectionSteps.length < 2) {
      return;
    }

    document.documentElement.classList.add("section-snap-enabled");
    document.body.classList.add("section-snap-enabled");

    // Wheel listener must be non-passive so we can prevent default scrolling.
    window.addEventListener("wheel", onSnapWheel, { passive: false });
    window.addEventListener("touchstart", onSnapTouchStart, { passive: true });
    window.addEventListener("touchend", onSnapTouchEnd, { passive: true });
    window.addEventListener("keydown", onSnapKeyDown);
    window.addEventListener("resize", onSnapResize);
  }

  app.sectionSnap = {
    scrollToSectionById: scrollToSectionById,
    move: function (direction) {
      requestSectionMove(normalizeDirection(direction));
    },
    cancel: function () {
      stopAnimation({ clearQueue: true });
    },
    refresh: function () {
      refreshSectionSteps();
    }
  };

  app.initSectionSnapScroll = initSectionSnapScroll;
})(window, document);
