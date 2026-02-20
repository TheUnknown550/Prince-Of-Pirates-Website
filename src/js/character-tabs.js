(function (window, document) {
  // Handles Section 3 character carousel ordering and selection state.
  const app = (window.PrinceSite = window.PrinceSite || {});
  const VISIBLE_COUNT = 3;
  const ANIM_MS = 220;
  const EASING = "cubic-bezier(0.22, 0.61, 0.36, 1)";
  const SWIPE_THRESHOLD_PX = 36;

  let isInitialized = false;
  let tabsContainer = null;
  let prevArrow = null;
  let nextArrow = null;
  let viewport = null;
  let track = null;

  let allActions = [];
  let tabByAction = Object.create(null);
  let activeAction = null;
  let windowStartIndex = 0;

  let isAnimating = false;
  let queuedDirection = 0;
  let activeTrackAnimation = null;
  let resizeRafId = 0;

  let touchStartX = 0;
  let touchStartY = 0;

  const reduceMotionQuery = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;

  function shouldReduceMotion() {
    return Boolean(reduceMotionQuery && reduceMotionQuery.matches);
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

  function getContainerGapPx() {
    if (!tabsContainer) {
      return 0;
    }
    const styles = window.getComputedStyle(tabsContainer);
    return toNumber(styles.columnGap || styles.gap);
  }

  function getTrackGapPx() {
    if (!track) {
      return 0;
    }
    const styles = window.getComputedStyle(track);
    return toNumber(styles.columnGap || styles.gap);
  }

  function modIndex(index) {
    const count = allActions.length;
    if (count === 0) {
      return 0;
    }
    return ((index % count) + count) % count;
  }

  function getVisibleCount() {
    return Math.min(VISIBLE_COUNT, allActions.length);
  }

  function getVisibleActions(startIndex) {
    const count = getVisibleCount();
    const actions = [];
    for (let i = 0; i < count; i += 1) {
      actions.push(allActions[modIndex(startIndex + i)]);
    }
    return actions;
  }

  function buildStateFromDom() {
    tabsContainer = document.querySelector(".character-tabs");
    if (!tabsContainer) {
      return false;
    }

    prevArrow = tabsContainer.querySelector('[data-action="character-prev"]');
    nextArrow = tabsContainer.querySelector('[data-action="character-next"]');
    if (!prevArrow || !nextArrow) {
      return false;
    }

    const tabs = Array.from(tabsContainer.querySelectorAll(".char-tab-image"));
    allActions = [];
    tabByAction = Object.create(null);

    tabs.forEach(function (tab) {
      const action = tab.dataset.action;
      if (!action) {
        return;
      }
      allActions.push(action);
      tabByAction[action] = tab;
    });

    if (allActions.length === 0) {
      return false;
    }

    const domActiveTab = tabs.find(function (tab) {
      return tab.classList.contains("is-active");
    });
    activeAction = domActiveTab && domActiveTab.dataset.action
      ? domActiveTab.dataset.action
      : allActions[0];
    windowStartIndex = 0;
    return true;
  }

  function ensureState() {
    if (tabsContainer && prevArrow && nextArrow && allActions.length > 0) {
      return true;
    }
    return buildStateFromDom();
  }

  function ensureCarouselStructure() {
    if (!ensureState()) {
      return false;
    }
    if (viewport && track) {
      return true;
    }

    viewport = document.createElement("div");
    viewport.className = "character-tab-viewport";

    track = document.createElement("div");
    track.className = "character-tab-track";
    viewport.appendChild(track);

    tabsContainer.insertBefore(viewport, nextArrow);
    return true;
  }

  function applyActiveState() {
    if (!activeAction || !tabByAction[activeAction]) {
      activeAction = allActions[0] || null;
    }

    Object.keys(tabByAction).forEach(function (action) {
      tabByAction[action].classList.toggle("is-active", action === activeAction);
    });
  }

  function syncTrackGapWithContainer() {
    if (!track) {
      return;
    }
    const gapPx = getContainerGapPx();
    track.style.columnGap = gapPx + "px";
  }

  function clearNodeInlineWidth(node) {
    if (!node) {
      return;
    }

    node.style.width = "";
    const image = node.querySelector("img");
    if (image) {
      image.style.width = "";
    }
  }

  function clearNodesInlineWidth(nodes) {
    nodes.forEach(function (node) {
      clearNodeInlineWidth(node);
    });
  }

  function getNodesTotalWidth(nodes) {
    return nodes.reduce(function (sum, node) {
      return sum + node.getBoundingClientRect().width;
    }, 0);
  }

  function applyScaleToNodes(nodes, ratio) {
    nodes.forEach(function (node) {
      const baseWidth = node.getBoundingClientRect().width;
      const scaledWidth = Math.max(1, baseWidth * ratio);
      const image = node.querySelector("img");

      if (image) {
        image.style.width = scaledWidth.toFixed(2) + "px";
        return;
      }

      node.style.width = scaledWidth.toFixed(2) + "px";
    });
  }

  function setViewportWidthForNodes(nodes, scaleTargets) {
    if (!viewport || !tabsContainer || nodes.length === 0) {
      return;
    }

    const nodesToScale =
      Array.isArray(scaleTargets) && scaleTargets.length ? scaleTargets : nodes;
    clearNodesInlineWidth(nodesToScale);

    const trackGap = getTrackGapPx();
    const gapTotal = trackGap * Math.max(0, nodes.length - 1);
    let cardsWidth = getNodesTotalWidth(nodes);
    let desiredWidth = cardsWidth + gapTotal;

    const containerGap = getContainerGapPx();
    const arrowsWidth = prevArrow.getBoundingClientRect().width + nextArrow.getBoundingClientRect().width;
    const maxAvailable = tabsContainer.clientWidth - arrowsWidth - containerGap * 2;

    if (maxAvailable > 0 && desiredWidth > maxAvailable && cardsWidth > 0) {
      const availableCardsWidth = Math.max(0, maxAvailable - gapTotal);
      const fitRatio = Math.max(0, Math.min(1, availableCardsWidth / cardsWidth));
      applyScaleToNodes(nodesToScale, fitRatio);
      cardsWidth = getNodesTotalWidth(nodes);
      desiredWidth = cardsWidth + gapTotal;
    }

    const finalWidth = maxAvailable > 0 ? Math.min(desiredWidth, maxAvailable) : desiredWidth;

    viewport.style.width = Math.max(0, Math.floor(finalWidth)) + "px";
  }

  function renderVisibleTabs() {
    if (!ensureCarouselStructure()) {
      return;
    }

    syncTrackGapWithContainer();
    track.textContent = "";

    const visibleActions = getVisibleActions(windowStartIndex);
    const visibleNodes = visibleActions
      .map(function (action) {
        return tabByAction[action];
      })
      .filter(Boolean);

    visibleNodes.forEach(function (tab) {
      track.appendChild(tab);
    });

    applyActiveState();
    setViewportWidthForNodes(visibleNodes, visibleNodes);
    track.style.transform = "translateX(0px)";
  }

  function cloneForSlide(action) {
    const source = tabByAction[action];
    if (!source) {
      return null;
    }
    const clone = source.cloneNode(true);
    clone.classList.remove("is-active");
    clone.classList.add("char-tab-clone");
    clone.removeAttribute("data-action");
    clone.setAttribute("aria-hidden", "true");
    clone.tabIndex = -1;
    return clone;
  }

  function clearActiveTrackAnimation() {
    if (activeTrackAnimation) {
      activeTrackAnimation.cancel();
      activeTrackAnimation = null;
    }
  }

  function flushQueuedDirection() {
    if (queuedDirection === 0) {
      return;
    }
    const nextDirection = queuedDirection;
    queuedDirection = 0;
    rotateCharacterOrder(nextDirection);
  }

  function finishSimpleReorder() {
    activeTrackAnimation = null;
    isAnimating = false;
    flushQueuedDirection();
  }

  function runSimpleReorderAnimation(direction, nextStartIndex) {
    if (!track) {
      windowStartIndex = nextStartIndex;
      renderVisibleTabs();
      flushQueuedDirection();
      return;
    }

    if (shouldReduceMotion() || typeof track.animate !== "function") {
      windowStartIndex = nextStartIndex;
      renderVisibleTabs();
      flushQueuedDirection();
      return;
    }

    const baseWidth = viewport ? viewport.clientWidth : track.clientWidth;
    const distance = Math.max(18, Math.round(baseWidth * 0.06));
    const outX = direction > 0 ? distance : -distance;
    const outDuration = Math.round(ANIM_MS * 0.45);
    const inDuration = Math.round(ANIM_MS * 0.55);

    clearActiveTrackAnimation();
    isAnimating = true;

    const outAnimation = track.animate(
      [
        { transform: "translateX(0px)", opacity: 1 },
        { transform: "translateX(" + outX + "px)", opacity: 0.72 }
      ],
      {
        duration: outDuration,
        easing: EASING,
        fill: "forwards"
      }
    );

    activeTrackAnimation = outAnimation;

    outAnimation.onfinish = function () {
      windowStartIndex = nextStartIndex;
      renderVisibleTabs();

      const inAnimation = track.animate(
        [
          { transform: "translateX(" + -outX + "px)", opacity: 0.72 },
          { transform: "translateX(0px)", opacity: 1 }
        ],
        {
          duration: inDuration,
          easing: EASING,
          fill: "forwards"
        }
      );

      activeTrackAnimation = inAnimation;

      inAnimation.onfinish = function () {
        finishSimpleReorder();
      };

      inAnimation.oncancel = function () {
        renderVisibleTabs();
        finishSimpleReorder();
      };
    };

    outAnimation.oncancel = function () {
      renderVisibleTabs();
      finishSimpleReorder();
    };
  }

  function startSlide(direction) {
    const visibleCount = getVisibleCount();
    if (!track || visibleCount < 1) {
      return;
    }

    const nextStartIndex = modIndex(windowStartIndex + (direction > 0 ? -1 : 1));

    // When all tabs are already visible (current setup), rotating order directly
    // is more reliable than building a 4-card strip animation.
    if (allActions.length <= visibleCount) {
      runSimpleReorderAnimation(direction, nextStartIndex);
      return;
    }

    const currentVisible = getVisibleActions(windowStartIndex);
    const nextVisible = getVisibleActions(nextStartIndex);

    let stripActions;
    let viewportNodes;
    if (direction > 0) {
      stripActions = [nextVisible[0]].concat(currentVisible);
      viewportNodes = [1, 2, 3].slice(0, visibleCount).map(function (index) {
        return index;
      });
    } else {
      stripActions = currentVisible.concat(nextVisible[visibleCount - 1]);
      viewportNodes = [0, 1, 2].slice(0, visibleCount).map(function (index) {
        return index;
      });
    }

    track.textContent = "";
    syncTrackGapWithContainer();

    const stripNodes = stripActions
      .map(function (action) {
        return cloneForSlide(action);
      })
      .filter(Boolean);

    stripNodes.forEach(function (node) {
      track.appendChild(node);
    });

    const viewportMeasureNodes = viewportNodes
      .map(function (index) {
        return stripNodes[index];
      })
      .filter(Boolean);

    setViewportWidthForNodes(viewportMeasureNodes, stripNodes);

    const leadingWidth = stripNodes[0] ? stripNodes[0].getBoundingClientRect().width : 0;
    const offset = leadingWidth + getTrackGapPx();
    const fromX = direction > 0 ? -offset : 0;
    const toX = direction > 0 ? 0 : -offset;

    clearActiveTrackAnimation();
    isAnimating = true;
    track.style.transform = "translateX(" + fromX + "px)";

    if (typeof track.animate !== "function") {
      isAnimating = false;
      windowStartIndex = nextStartIndex;
      renderVisibleTabs();
      flushQueuedDirection();
      return;
    }

    activeTrackAnimation = track.animate(
      [
        { transform: "translateX(" + fromX + "px)" },
        { transform: "translateX(" + toX + "px)" }
      ],
      {
        duration: ANIM_MS,
        easing: EASING,
        fill: "forwards"
      }
    );

    activeTrackAnimation.onfinish = function () {
      activeTrackAnimation = null;
      isAnimating = false;
      windowStartIndex = nextStartIndex;
      renderVisibleTabs();
      flushQueuedDirection();
    };

    activeTrackAnimation.oncancel = function () {
      activeTrackAnimation = null;
      isAnimating = false;
      renderVisibleTabs();
      flushQueuedDirection();
    };
  }

  function setCharacterTab(action) {
    if (!ensureState() || !tabByAction[action]) {
      return;
    }
    activeAction = action;
    applyActiveState();
  }

  function rotateCharacterOrder(direction) {
    if (!ensureCarouselStructure()) {
      return;
    }

    const normalizedDirection = normalizeDirection(direction);
    if (normalizedDirection === 0 || allActions.length <= 1) {
      return;
    }

    if (isAnimating) {
      queuedDirection = normalizedDirection;
      return;
    }

    if (shouldReduceMotion()) {
      windowStartIndex = modIndex(windowStartIndex + (normalizedDirection > 0 ? -1 : 1));
      renderVisibleTabs();
      return;
    }

    startSlide(normalizedDirection);
  }

  function onTabClick(event) {
    if (isAnimating) {
      return;
    }
    const action = event.currentTarget.dataset.action;
    if (action) {
      setCharacterTab(action);
    }
  }

  function onPrevClick() {
    rotateCharacterOrder(-1);
  }

  function onNextClick() {
    rotateCharacterOrder(1);
  }

  function onTouchStart(event) {
    if (!event.changedTouches || event.changedTouches.length === 0) {
      return;
    }
    touchStartX = event.changedTouches[0].clientX;
    touchStartY = event.changedTouches[0].clientY;
  }

  function onTouchEnd(event) {
    if (!event.changedTouches || event.changedTouches.length === 0) {
      return;
    }

    const endX = event.changedTouches[0].clientX;
    const endY = event.changedTouches[0].clientY;
    const deltaX = endX - touchStartX;
    const deltaY = endY - touchStartY;

    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX || Math.abs(deltaX) <= Math.abs(deltaY)) {
      return;
    }

    if (deltaX < 0) {
      rotateCharacterOrder(1);
    } else {
      rotateCharacterOrder(-1);
    }
  }

  function refreshLayout() {
    if (!ensureCarouselStructure() || isAnimating) {
      return;
    }
    renderVisibleTabs();
  }

  function onResize() {
    if (resizeRafId) {
      window.cancelAnimationFrame(resizeRafId);
    }
    resizeRafId = window.requestAnimationFrame(function () {
      resizeRafId = 0;
      refreshLayout();
    });
  }

  function bindCharacterActions() {
    if (!ensureCarouselStructure()) {
      return;
    }

    prevArrow.addEventListener("click", onPrevClick);
    nextArrow.addEventListener("click", onNextClick);

    allActions.forEach(function (action) {
      const tab = tabByAction[action];
      if (tab) {
        tab.addEventListener("click", onTabClick);
      }
    });

    viewport.addEventListener("touchstart", onTouchStart, { passive: true });
    viewport.addEventListener("touchend", onTouchEnd, { passive: true });

    window.addEventListener("resize", onResize);
    window.addEventListener("load", refreshLayout, { once: true });
  }

  function initCharacterTabs() {
    if (isInitialized) {
      return;
    }
    if (!ensureCarouselStructure()) {
      return;
    }

    renderVisibleTabs();
    bindCharacterActions();
    isInitialized = true;
  }

  app.characterTabs = {
    setCharacterTab: setCharacterTab,
    rotateCharacterOrder: rotateCharacterOrder,
    cycleCharacter: rotateCharacterOrder,
    refreshLayout: refreshLayout
  };
  app.initCharacterTabs = initCharacterTabs;
})(window, document);
