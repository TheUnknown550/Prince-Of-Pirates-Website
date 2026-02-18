(function () {
  const actionHandlers = {
    main: handleMain,
    register: handleRegister,
    topup: handleTopup,
    "game-guide": handleGameGuide,
    news: handleNews,
    community: handleCommunity
  };

  function onHeaderButtonClick(event) {
    const button = event.currentTarget;
    const action = button.dataset.action;
    const handler = actionHandlers[action];

    if (typeof handler === "function") {
      handler();
    }
  }

  function bindHeaderButtons() {
    const buttons = document.querySelectorAll("[data-action]");
    buttons.forEach(function (button) {
      button.addEventListener("click", onHeaderButtonClick);
    });
  }

  function handleMain() {
    window.location.hash = "main";
    console.log("Main button clicked");
  }

  function handleRegister() {
    window.location.hash = "register";
    console.log("Register button clicked");
  }

  function handleTopup() {
    window.location.hash = "topup";
    console.log("Topup button clicked");
  }

  function handleGameGuide() {
    window.location.hash = "game-guide";
    console.log("Game Guide button clicked");
  }

  function handleNews() {
    window.location.hash = "news";
    console.log("News button clicked");
  }

  function handleCommunity() {
    window.location.hash = "community";
    console.log("Community button clicked");
  }

  bindHeaderButtons();
})();
