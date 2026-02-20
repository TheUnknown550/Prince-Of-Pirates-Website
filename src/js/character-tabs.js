(function (window, document) {
  // Handles character tab activation and previous/next cycling controls.
  const app = (window.PrinceSite = window.PrinceSite || {});
  let isInitialized = false;

  function setCharacterTab(activeAction) {
    const tabs = document.querySelectorAll(".char-tab-image");
    tabs.forEach(function (tab) {
      tab.classList.toggle("is-active", tab.dataset.action === activeAction);
    });
  }

  function cycleCharacter(direction) {
    const actions = ["character-luffy", "character-zoro", "character-nami"];
    const tabs = document.querySelectorAll(".char-tab-image");
    let activeIndex = 0;

    tabs.forEach(function (tab, index) {
      if (tab.classList.contains("is-active")) {
        activeIndex = index;
      }
    });

    const nextIndex = (activeIndex + direction + actions.length) % actions.length;
    setCharacterTab(actions[nextIndex]);
  }

  const actionHandlers = {
    "character-luffy": function () {
      setCharacterTab("character-luffy");
    },
    "character-zoro": function () {
      setCharacterTab("character-zoro");
    },
    "character-nami": function () {
      setCharacterTab("character-nami");
    },
    "character-prev": function () {
      cycleCharacter(-1);
    },
    "character-next": function () {
      cycleCharacter(1);
    }
  };

  function onCharacterActionClick(event) {
    const action = event.currentTarget.dataset.action;
    const handler = actionHandlers[action];
    if (typeof handler === "function") {
      handler();
    }
  }

  function bindCharacterActions() {
    const controls = document.querySelectorAll("[data-action^='character-']");
    controls.forEach(function (control) {
      control.addEventListener("click", onCharacterActionClick);
    });
  }

  function initCharacterTabs() {
    if (isInitialized) {
      return;
    }
    isInitialized = true;
    bindCharacterActions();
  }

  app.characterTabs = {
    setCharacterTab: setCharacterTab,
    cycleCharacter: cycleCharacter
  };
  app.initCharacterTabs = initCharacterTabs;
})(window, document);
