(function (window, document) {
  // Controls download modal open-close state, focus trap, and target-link placeholders.
  const app = (window.PrinceSite = window.PrinceSite || {});
  const modalUtils = app.modalUtils || {};
  const coreUtils = app.utils || {};
  const MODAL_OPEN_CLASS = "is-open";
  const BODY_LOCK_CLASS = "download-modal-open";
  const CLOSE_SELECTOR = "[data-download-modal-close]";
  const TARGET_SELECTOR = "[data-download-target]";
  const TRANSITION_MS = 240;
  let modalRoot = null;
  let firstTargetButton = null;
  let lastTrigger = null;
  let hideTimer = null;
  let isOpenState = false;
  let isInitialized = false;

  const trapFocusWithin = modalUtils.trapFocusWithin || function () {};
  const captureFocusTrigger = modalUtils.captureFocusTrigger || function (trigger) {
    if (trigger && typeof trigger.focus === "function") {
      return trigger;
    }
    if (document.activeElement && typeof document.activeElement.focus === "function") {
      return document.activeElement;
    }
    return null;
  };
  const restoreFocusTrigger = modalUtils.restoreFocusTrigger || function (trigger) {
    if (!trigger || typeof trigger.focus !== "function" || !document.contains(trigger)) {
      return;
    }
    trigger.focus({ preventScroll: true });
  };
  const closeMobileMenuIfTriggeredFromOverlay =
    modalUtils.closeMobileMenuIfTriggeredFromOverlay || function () {};
  const safeFocus = coreUtils.safeFocus || function (node, options) {
    if (!node || typeof node.focus !== "function") {
      return;
    }
    node.focus(options || { preventScroll: true });
  };

  function clearHideTimer() {
    if (!hideTimer) {
      return;
    }
    clearTimeout(hideTimer);
    hideTimer = null;
  }

  function setModalOpenState(nextState) {
    if (!modalRoot) {
      return;
    }

    isOpenState = nextState;
    modalRoot.setAttribute("aria-hidden", nextState ? "false" : "true");

    if (nextState) {
      clearHideTimer();
      modalRoot.hidden = false;
      document.body.classList.add(BODY_LOCK_CLASS);
      requestAnimationFrame(function () {
        if (!modalRoot || !isOpenState) {
          return;
        }
        modalRoot.classList.add(MODAL_OPEN_CLASS);
      });

      window.setTimeout(function () {
        if (!isOpenState || !firstTargetButton) {
          return;
        }
        // Move focus into the download choices after open animation starts.
        safeFocus(firstTargetButton, { preventScroll: true });
      }, 90);
      return;
    }

    modalRoot.classList.remove(MODAL_OPEN_CLASS);
    document.body.classList.remove(BODY_LOCK_CLASS);
    clearHideTimer();
    hideTimer = window.setTimeout(function () {
      if (!modalRoot || isOpenState) {
        return;
      }
      modalRoot.hidden = true;
      restoreFocusTrigger(lastTrigger, document);
    }, TRANSITION_MS);
  }

  function open(trigger) {
    if (!modalRoot) {
      return;
    }

    // Persist opener for focus restoration when the modal closes.
    lastTrigger = captureFocusTrigger(trigger, document);

    // Keep only one overlay system open when launched from mobile navigation.
    closeMobileMenuIfTriggeredFromOverlay(trigger, app.navigation);

    if (isOpenState) {
      return;
    }
    setModalOpenState(true);
  }

  function close() {
    if (!modalRoot || (!isOpenState && modalRoot.hidden)) {
      return;
    }
    setModalOpenState(false);
  }

  function isOpen() {
    return isOpenState;
  }

  function onDocumentKeydown(event) {
    if (!isOpenState) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }

    // Keep tab focus cycling inside the active download modal controls.
    trapFocusWithin(modalRoot, event);
  }

  function onModalClick(event) {
    const closeTarget = event.target.closest(CLOSE_SELECTOR);
    if (closeTarget) {
      close();
      return;
    }

    if (event.target === modalRoot) {
      close();
    }
  }

  function onDownloadTargetClick(event) {
    const target = event.currentTarget.dataset.downloadTarget;
    if (target === "apk") {
      alert("APK download link not added yet.");
      return;
    }

    if (target === "ios") {
      alert("iOS download link not added yet.");
      return;
    }

    if (target === "windows") {
      alert("Windows download link not added yet.");
      return;
    }

    if (target === "browser") {
      alert("Browser download link not added yet.");
    }
  }

  function bindModalEvents() {
    if (!modalRoot) {
      return;
    }

    modalRoot.addEventListener("click", onModalClick);
    document.addEventListener("keydown", onDocumentKeydown);

    const targets = modalRoot.querySelectorAll(TARGET_SELECTOR);
    targets.forEach(function (targetButton) {
      targetButton.addEventListener("click", onDownloadTargetClick);
    });
  }

  function initDownloadModal() {
    if (isInitialized) {
      return;
    }
    isInitialized = true;

    modalRoot = document.getElementById("download-modal");
    if (!modalRoot) {
      return;
    }

    firstTargetButton = modalRoot.querySelector(TARGET_SELECTOR);
    bindModalEvents();
  }

  app.downloadModal = {
    open: open,
    close: close,
    isOpen: isOpen
  };
  app.initDownloadModal = initDownloadModal;
})(window, document);
