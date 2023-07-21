const saveOptions = (e) => {
  e.preventDefault();
  const mirrorValue = document.querySelector("input[name='mirror']:checked").value;
  browser.storage.sync.set({ mirror: mirrorValue });
}

const restoreOptions = async () => {
  try {
    const result = await browser.storage.sync.get("mirror");
    const currentChoice = result.mirror || "https://sci-hub.se/";
    document.querySelector("input[name='mirror']:checked").value = currentChoice;
  } catch (error) {
    console.log(`Error: ${error}`);
  }
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);