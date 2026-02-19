(function (window, document) {
  const app = (window.PrinceSite = window.PrinceSite || {});
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

  function clearHideTimer() {
    if (!hideTimer) {
      return;
    }
    clearTimeout(hideTimer);
    hideTimer = null;
  }

  function getFocusableElements() {
    if (!modalRoot) {
      return [];
    }

    const nodes = modalRoot.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
    );
    return Array.prototype.filter.call(nodes, function (node) {
      return !node.hidden && node.offsetParent !== null;
    });
  }

  function trapFocus(event) {
    if (event.key !== "Tab") {
      return;
    }

    const focusables = getFocusableElements();
    if (!focusables.length) {
      event.preventDefault();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function restoreTriggerFocus() {
    if (!lastTrigger || typeof lastTrigger.focus !== "function") {
      return;
    }
    if (!document.contains(lastTrigger)) {
      return;
    }
    lastTrigger.focus({ preventScroll: true });
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
        usernameInput.focus({ preventScroll: true });
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
      restoreTriggerFocus();
    }, TRANSITION_MS);
  }

  function open(trigger) {
    if (!modalRoot) {
      return;
    }

    if (trigger && typeof trigger.focus === "function") {
      lastTrigger = trigger;
    } else if (document.activeElement && typeof document.activeElement.focus === "function") {
      lastTrigger = document.activeElement;
    } else {
      lastTrigger = null;
    }

    if (
      trigger &&
      typeof trigger.closest === "function" &&
      trigger.closest(".mobile-menu-overlay") &&
      app.navigation &&
      typeof app.navigation.closeMobileMenu === "function"
    ) {
      app.navigation.closeMobileMenu();
    }

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

    trapFocus(event);
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
      alert("Register action not added yet.");
      return;
    }
    if (action === "forgot") {
      alert("Forgot password action not added yet.");
      return;
    }
    if (action === "login") {
      alert("Login action not added yet.");
    }
  }

  function onRegisterSubmit(event) {
    event.preventDefault();
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
