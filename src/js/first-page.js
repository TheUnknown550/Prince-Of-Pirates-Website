(function () {
  const actionHandlers = {
    main: function () {
      scrollToSection("main");
    },
    register: function () {
      alert("Register page link not added yet.");
    },
    topup: function () {
      alert("Topup page link not added yet.");
    },
    "game-guide": function () {
      scrollToSection("game-guide");
    },
    news: function () {
      alert("News page link not added yet.");
    },
    community: function () {
      alert("Community page link not added yet.");
    },
    "app-store": function () {
      alert("App Store link not added yet.");
    },
    "google-play": function () {
      alert("Google Play link not added yet.");
    },
    "google-play-games": function () {
      alert("Google Play Games link not added yet.");
    },
    "play-game": function () {
      alert("Play Game action not added yet.");
    },
    download: function () {
      alert("Download action not added yet.");
    },
    member: function () {
      alert("Member action not added yet.");
    },
    "character-luffy": function () {
      setCharacterTab("character-luffy");
    },
    "character-zoro": function () {
      setCharacterTab("character-zoro");
    },
    "character-nami": function () {
      setCharacterTab("character-nami");
    }
  };

  function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) {
      return;
    }
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function setCharacterTab(activeAction) {
    const tabs = document.querySelectorAll(".char-tab");
    tabs.forEach(function (tab) {
      tab.classList.toggle("is-active", tab.dataset.action === activeAction);
    });
  }

  function onActionClick(event) {
    const button = event.currentTarget;
    const action = button.dataset.action;
    const handler = actionHandlers[action];
    if (typeof handler === "function") {
      handler();
    }
  }

  function bindActionButtons() {
    const buttons = document.querySelectorAll("[data-action]");
    buttons.forEach(function (button) {
      button.addEventListener("click", onActionClick);
    });
  }

  bindActionButtons();
})();
