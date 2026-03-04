(function (window, document) {
  // Controls login modal open-close state, focus trap, and auth-link placeholders.
  const app = (window.PrinceSite = window.PrinceSite || {});
  const modalUtils = app.modalUtils || {};
  const coreUtils = app.utils || {};
  const MODAL_OPEN_CLASS = "is-open";
  const BODY_LOCK_CLASS = "login-modal-open";
  const CLOSE_SELECTOR = "[data-login-modal-close]";
  const ACTION_SELECTOR = "[data-login-modal-action]";
  const TRANSITION_MS = 240;
  let modalRoot = null;
  let usernameInput = null;
  let loginForm = null;
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

  function setModalOpenState(nextState, options) {
    if (!modalRoot) {
      return;
    }

    const closeOptions = options || {};
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
        if (!isOpenState || !usernameInput) {
          return;
        }
        // Move focus into the form after the open animation starts.
        safeFocus(usernameInput, { preventScroll: true });
      }, 90);
      return;
    }

    const shouldRestoreFocus = !closeOptions.suppressFocusRestore;
    modalRoot.classList.remove(MODAL_OPEN_CLASS);
    document.body.classList.remove(BODY_LOCK_CLASS);
    clearHideTimer();
    hideTimer = window.setTimeout(function () {
      if (!modalRoot || isOpenState) {
        return;
      }
      modalRoot.hidden = true;
      if (shouldRestoreFocus) {
        restoreFocusTrigger(lastTrigger, document);
      }
    }, TRANSITION_MS);
  }

  function open(trigger) {
    if (!modalRoot) {
      return;
    }

    // Persist the opener so focus can be restored on close for keyboard users.
    lastTrigger = captureFocusTrigger(trigger, document);

    // If launched from the mobile overlay, close it first to avoid stacked focus traps.
    closeMobileMenuIfTriggeredFromOverlay(trigger, app.navigation);

    if (isOpenState) {
      return;
    }
    setModalOpenState(true);
  }

  function close(options) {
    if (!modalRoot || (!isOpenState && modalRoot.hidden)) {
      return;
    }
    setModalOpenState(false, options || {});
  }

  function isOpen() {
    return isOpenState;
  }

  function switchToRegisterModal() {
    const switchTrigger = lastTrigger;
    close({ suppressFocusRestore: true });
    window.setTimeout(function () {
      if (app.registerModal && typeof app.registerModal.open === "function") {
        app.registerModal.open(switchTrigger);
        return;
      }
      alert("Register modal is not available yet.");
    }, TRANSITION_MS);
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

    // Constrain tab focus to controls inside the active modal.
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

  function onModalActionClick(event) {
    const action = event.currentTarget.dataset.loginModalAction;
    if (action === "signup") {
      switchToRegisterModal();
      return;
    }

    if (action === "forgot") {
      // Placeholder button action: replace with forgot-password flow.
      alert("Forgot password action not added yet.");
    }
  }

  function onLoginSubmit(event) {
    event.preventDefault();
    // Placeholder form submit action: replace with real authentication logic.
    alert("Login action not added yet.");
  }

  function bindModalEvents() {
    if (!modalRoot) {
      return;
    }

    modalRoot.addEventListener("click", onModalClick);
    document.addEventListener("keydown", onDocumentKeydown);

    const actions = modalRoot.querySelectorAll(ACTION_SELECTOR);
    actions.forEach(function (actionButton) {
      actionButton.addEventListener("click", onModalActionClick);
    });

    if (loginForm) {
      loginForm.addEventListener("submit", onLoginSubmit);
    }
  }

  function initLoginModal() {
    if (isInitialized) {
      return;
    }
    isInitialized = true;

    modalRoot = document.getElementById("login-modal");
    if (!modalRoot) {
      return;
    }

    usernameInput = modalRoot.querySelector("#login-username");
    loginForm = modalRoot.querySelector(".login-modal-form");

    bindModalEvents();
  }

  app.loginModal = {
    open: open,
    close: close,
    isOpen: isOpen
  };
  app.initLoginModal = initLoginModal;
})(window, document);
