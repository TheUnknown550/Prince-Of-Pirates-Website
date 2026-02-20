(function (window, document) {
  // Implements section-by-section snap scrolling for wheel, keyboard, and touch.
  const SNAP_LOCK_MS = 680;
  const SNAP_ANCHOR_LOCK_MS = 320;
  const WHEEL_THRESHOLD = 16;
  const SWIPE_THRESHOLD = 42;
  const SNAP_EDGE_TOLERANCE = 10;
  const SNAP_SETTLE_TOLERANCE = 2;
  const SNAP_QUEUE_DELAY_MS = 220;
  const app = (window.PrinceSite = window.PrinceSite || {});
  let sectionSteps = [];
  let isSnapLocked = false;
  let touchStartY = null;
  let snapUnlockTimer = null;
  let snapLockStartedAt = 0;
  let queuedSnapDirection = 0;
  let isInitialized = false;

  function isMenuOpen() {
    // Suspend snap behavior while overlays are active.
    return (
      document.body.classList.contains("menu-open") ||
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
    // Guard against repeated input while smooth scrolling is settling.
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
      // Queue one move to run after lock release if user keeps scrolling.
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
    if (isMenuOpen() || isSnapLocked || !sectionSteps.length) {
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
      // Downward intent: snap to current section bottom first, then next section.
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
      // Upward intent: snap to current section top first, then previous section.
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
    }
  }

  function onSnapWheel(event) {
    if (isMenuOpen()) {
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
    if (isInitialized) {
      return;
    }
    isInitialized = true;

    sectionSteps = collectSectionSteps();
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

  app.initSectionSnapScroll = initSectionSnapScroll;
})(window, document);
