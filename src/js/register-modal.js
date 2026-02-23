(function (window, document) {
  // Controls register/login modal open-close state, focus trap, and placeholder actions.
  const app = (window.PrinceSite = window.PrinceSite || {});
  const modalUtils = app.modalUtils || {};
  const coreUtils = app.utils || {};
  const MODAL_OPEN_CLASS = "is-open";
  const BODY_LOCK_CLASS = "register-modal-open";
  const CLOSE_SELECTOR = "[data-register-modal-close]";
  const ACTION_SELECTOR = "[data-modal-action]";
  const TRANSITION_MS = 240;
  let modalRoot = null;
  let usernameInput = null;
  let registerForm = null;
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
        if (!isOpenState || !usernameInput) {
          return;
        }
        // Move focus into the form after the open animation starts.
        safeFocus(usernameInput, { preventScroll: true });
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

    // Persist the opener so focus can be restored on close for keyboard users.
    lastTrigger = captureFocusTrigger(trigger, document);

    // If launched from the mobile overlay, close it first to avoid stacked focus traps.
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
    const action = event.currentTarget.dataset.modalAction;
    if (action === "signup") {
      // Placeholder button action: replace with signup flow.
      alert("Register action not added yet.");
      return;
    }
    if (action === "forgot") {
      // Placeholder button action: replace with forgot-password flow.
      alert("Forgot password action not added yet.");
      return;
    }
    if (action === "login") {
      // Placeholder button action: replace with login API request.
      alert("Login action not added yet.");
    }
  }

  function onRegisterSubmit(event) {
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
      if (actionButton.dataset.modalAction === "login") {
        return;
      }
      actionButton.addEventListener("click", onModalActionClick);
    });

    if (registerForm) {
      registerForm.addEventListener("submit", onRegisterSubmit);
    }
  }

  function initRegisterModal() {
    if (isInitialized) {
      return;
    }
    isInitialized = true;

    modalRoot = document.getElementById("register-modal");
    if (!modalRoot) {
      return;
    }

    usernameInput = modalRoot.querySelector("#register-username");
    registerForm = modalRoot.querySelector(".register-modal-form");

    bindModalEvents();
  }

  app.registerModal = {
    open: open,
    close: close,
    isOpen: isOpen
  };
  app.initRegisterModal = initRegisterModal;
})(window, document);
