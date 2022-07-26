function saveOptions(e) {
  e.preventDefault();
  browser.storage.sync.set({
    mirror: document.querySelector("input[name='mirror']:checked").value,
  });
}

function restoreOptions() {
  function setCurrentChoice(result) {
    document.querySelector("input[name='mirror']:checked").value =
      result.mirror || "https://sci-hub.se/";
  }

  function onError(error) {
    console.log(`Error: ${error}`);
  }

  let getting = browser.storage.sync.get("mirror");
  getting.then(setCurrentChoice, onError);
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
