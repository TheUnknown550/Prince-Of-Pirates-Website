(function (window, document) {
  // Modal-specific helpers shared by register and server modal modules.
  // Keeping these behaviors in one place avoids subtle drift in focus trap,
  // trigger capture/restore, and mobile overlay interaction handling.
  const app = (window.PrinceSite = window.PrinceSite || {});
  const existingModalUtils = app.modalUtils || {};
  const utils = app.utils || {};
  const safeFocus = utils.safeFocus || function (target, options) {
    if (!target || typeof target.focus !== "function") {
      return false;
    }
    target.focus(options || { preventScroll: true });
    return true;
  };

  function getFocusableElements(container) {
    if (!container) {
      return [];
    }

    const nodes = container.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
    );
    return Array.prototype.filter.call(nodes, function (node) {
      return !node.hidden && node.offsetParent !== null;
    });
  }

  function trapFocusWithin(container, event) {
    if (!event || event.key !== "Tab") {
      return false;
    }

    const focusables = getFocusableElements(container);
    if (!focusables.length) {
      event.preventDefault();
      return true;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const ownerDoc = container && container.ownerDocument ? container.ownerDocument : document;
    const active = ownerDoc.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      safeFocus(last, { preventScroll: true });
      return true;
    }

    if (!event.shiftKey && active === last) {
      event.preventDefault();
      safeFocus(first, { preventScroll: true });
      return true;
    }

    return true;
  }

  function captureFocusTrigger(trigger, docRef) {
    if (trigger && typeof trigger.focus === "function") {
      return trigger;
    }

    const ownerDoc = docRef || document;
    const active = ownerDoc.activeElement;
    if (active && typeof active.focus === "function") {
      return active;
    }
    return null;
  }

  function restoreFocusTrigger(trigger, docRef) {
    if (!trigger || typeof trigger.focus !== "function") {
      return false;
    }

    const ownerDoc = docRef || document;
    if (!ownerDoc.contains(trigger)) {
      return false;
    }

    return safeFocus(trigger, { preventScroll: true });
  }

  function closeMobileMenuIfTriggeredFromOverlay(trigger, navigationApi) {
    if (
      !trigger ||
      typeof trigger.closest !== "function" ||
      !trigger.closest(".mobile-menu-overlay") ||
      !navigationApi ||
      typeof navigationApi.closeMobileMenu !== "function"
    ) {
      return false;
    }

    navigationApi.closeMobileMenu();
    return true;
  }

  app.modalUtils = Object.assign(existingModalUtils, {
    getFocusableElements: getFocusableElements,
    trapFocusWithin: trapFocusWithin,
    captureFocusTrigger: captureFocusTrigger,
    restoreFocusTrigger: restoreFocusTrigger,
    closeMobileMenuIfTriggeredFromOverlay: closeMobileMenuIfTriggeredFromOverlay
  });
})(window, document);
