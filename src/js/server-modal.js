(function (window, document) {
  // Controls server-select modal open-close state, focus trap, and server selection syncing.
  const app = (window.PrinceSite = window.PrinceSite || {});
  const modalUtils = app.modalUtils || {};
  const coreUtils = app.utils || {};
  const MODAL_OPEN_CLASS = "is-open";
  const BODY_LOCK_CLASS = "server-modal-open";
  const CLOSE_SELECTOR = "[data-server-modal-close]";
  const SERVER_SELECTOR = ".server-option[data-server-id]";
  const TRANSITION_MS = 240;
  const DEFAULT_SERVER_ID = "1";
  let modalRoot = null;
  let joinButton = null;
  let lastTrigger = null;
  let hideTimer = null;
  let selectedServerId = DEFAULT_SERVER_ID;
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

  function setSelectedServer(serverId) {
    if (!modalRoot) {
      return;
    }

    selectedServerId = String(serverId || DEFAULT_SERVER_ID);
    const options = modalRoot.querySelectorAll(SERVER_SELECTOR);
    options.forEach(function (option) {
      const isSelected = option.dataset.serverId === selectedServerId;
      option.classList.toggle("is-selected", isSelected);
      option.setAttribute("aria-pressed", String(isSelected));
    });

    if (joinButton) {
      joinButton.dataset.selectedServerId = selectedServerId;
    }
  }

  function focusInitialElement() {
    if (!modalRoot) {
      return;
    }
    const selectedOption = modalRoot.querySelector(
      SERVER_SELECTOR + '.is-selected'
    );
    const firstOption = modalRoot.querySelector(SERVER_SELECTOR);
    const initialFocusTarget = selectedOption || firstOption || joinButton;
    safeFocus(initialFocusTarget, { preventScroll: true });
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
        if (!isOpenState) {
          return;
        }
        // Move focus into the server selector after the open animation starts.
        focusInitialElement();
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

    setSelectedServer(DEFAULT_SERVER_ID);
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

    // Keep tab focus cycling inside the active server modal controls.
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

  function onServerOptionClick(event) {
    const selectedId = event.currentTarget.dataset.serverId;
    if (!selectedId) {
      return;
    }
    setSelectedServer(selectedId);
  }

  function onJoinClick(event) {
    // Placeholder button action: keep this no-op until real server join flow is added.
    event.preventDefault();
  }

  function bindModalEvents() {
    if (!modalRoot) {
      return;
    }

    modalRoot.addEventListener("click", onModalClick);
    document.addEventListener("keydown", onDocumentKeydown);

    const serverOptions = modalRoot.querySelectorAll(SERVER_SELECTOR);
    serverOptions.forEach(function (option) {
      option.addEventListener("click", onServerOptionClick);
    });

    if (joinButton) {
      joinButton.addEventListener("click", onJoinClick);
    }
  }

  function initServerModal() {
    if (isInitialized) {
      return;
    }
    isInitialized = true;

    modalRoot = document.getElementById("server-modal");
    if (!modalRoot) {
      return;
    }

    joinButton = modalRoot.querySelector("[data-server-modal-join]");
    setSelectedServer(DEFAULT_SERVER_ID);
    bindModalEvents();
  }

  app.serverModal = {
    open: open,
    close: close,
    isOpen: isOpen
  };
  app.initServerModal = initServerModal;
})(window, document);
