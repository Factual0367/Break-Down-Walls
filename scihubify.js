const amazonRegex = /dp\/\d{10}/;
const doiRegex = /\b10\.\d{4}\/\w+\b/g;

// handles mirror fetching and default setting
const getMirror = async () => {
  const { mirror } = await browser.storage.sync.get('mirror');
  return mirror ?? 'https://sci-hub.se/';
};

// updates the browser tab with the given URL
const openNewTab = (url) => {
  browser.tabs.create({ url });
};

// fetches the active tab's URL and manages its handling
function getURL() {
  browser.tabs.query({ active: true, lastFocusedWindow: true }, async function(tabs) {
    const tab = tabs[0];
    const url = tab.url;

    if (url.includes("goodreads.com")) {
      const isbn = await getISBNFromTab(tab.id, goodreadsScript);
      if (isbn) {
        goodreadify(isbn);
      } else {
        showNotification("Could not extract ISBN from the page.");
      }
    } else if (url.includes("books.google")) {
      const isbn = await getISBNFromTab(tab.id, googleBooksScript);
      if (isbn) {
        googleify(isbn);
      } else {
        showNotification("Could not extract ISBN from the page.");
      }
    } else if (url.includes("amazon")) {
      libgenify(url);
    } else {
      scihubify(url);
    }
  });
}

// handles Amazon URLs
const libgenify = async (url) => {
  if (amazonRegex.test(url)) {
    const isbn = url.match(amazonRegex)[0].replace('dp/', '');
    const apiUrl = `https://openlibrary.org/isbn/${isbn}.json`;

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      const title = data["title"];
      const searchURL = `https://libgen.is/search.php?req=${title}&open=0&res=25&view=simple&phrase=1&column=def`;

      openNewTab(searchURL);
    } catch (error) {
      throw error;
    }
  } else {
    showNotification("Could not extract ISBN from the URL.");
  }
};

// handles Google Books
const googleify = async (isbn) => {
  const apiUrl = `https://openlibrary.org/isbn/${isbn}.json`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    const title = data["title"];
    const searchURL = `https://libgen.is/search.php?req=${title}&open=0&res=25&view=simple&phrase=1&column=def`;

    openNewTab(searchURL);
  } catch (error) {
    throw error;
  }
};

// handles goodreads
const goodreadify = async (isbn) => {
  const apiUrl = `https://openlibrary.org/isbn/${isbn}.json`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    const title = data["title"];
    const searchURL = `https://libgen.is/search.php?req=${title}&open=0&res=25&view=simple&phrase=1&column=def`;

    openNewTab(searchURL);
  } catch (error) {
    throw error;
  }
};

// handles non-Amazon URLs
const scihubify = async (url) => {
  try {
    const doi = url.match(doiRegex)[0];
    const mirror = await getMirror();
    const fullURL = `${mirror}${doi}`;
    openNewTab(fullURL);
  } catch {
    showNotification("Could not extract DOI or ISBN from the URL.");
    return null
  }
};

// content script to get isbn from Goodreads or Google Books
const getISBNFromTab = async (tabId, script) => {
  try {
    const results = await browser.tabs.executeScript(tabId, { code: script });
    return results[0];
  } catch (error) {
    console.error("Error executing content script:", error);
    return null;
  }
};

// shows a notification with the given message
const showNotification = (message) => {
  browser.notifications.create({
    type: "basic",
    iconUrl: browser.extension.getURL("graduate-hat.png"),
    title: "Notification",
    message: message,
  });
};

// listener for when the browser-action is clicked
browser.browserAction.onClicked.addListener(getURL);

// Menu
browser.menus.create({
  id: "download",
  title: "Download PDF",
  contexts: ["link"],
});

browser.menus.onClicked.addListener(async (info) => {
  if (info.menuItemId === "download") {
    const link = info.linkUrl;
    if (link.includes('goodreads.com') || link.includes('books.google')) {
      showNotification("Download Not Available: Open the page and use the menubar icon.");
    } else if (link.includes('amazon')) {
      await libgenify(link);
    } else {
      await constructLink(link);
    }
  }
});

// constructs the link for download
const constructLink = async (link) => {
  const mirror = await getMirror();
  const url = `${mirror}${link}`;
  await downloadPDF(url);
};

// handles PDF download
const downloadPDF = async (scihubLink) => {
  try {
    const response = await fetch(scihubLink);
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const saveBtn = doc.querySelector('button[onclick^="location.href=\'"]');

    if (saveBtn) {
      const pdfUrl = saveBtn.getAttribute('onclick').slice(17, -1);
      openNewTab(`http://${pdfUrl}`);
    } else {
      throw new Error("Save button not found.");
    }
  } catch {
    showNotification("Your PDF could not be downloaded. Maybe try manually?");
  }
};

// content script to get isbn from Goodreads
const goodreadsScript = `
  const buttons = Array.from(document.querySelectorAll('span'));
  const buttonToClick = buttons.find(button => button.innerText === 'Book details & editions');

  if (buttonToClick) {
    buttonToClick.click();
  }

  const elements = document.querySelectorAll('.DescListItem');
  let isbn = null;

  elements.forEach(element => {
    if (element.firstElementChild && element.firstElementChild.innerText === "ISBN") {
      const secondChild = element.firstElementChild.nextElementSibling;
      if (secondChild) {
        isbn = secondChild.innerText.split(" ")[0];
      }
    }
  });

  isbn;
`;

// content script to get isbn from Google Books
const googleBooksScript = `
  const table = document.getElementById('metadata_content_table');
  const dataObject = {};

  const rows = table.getElementsByTagName('tr');

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const cells = row.getElementsByTagName('td');

    if (cells.length >= 2) {
      const key = cells[0].textContent.trim(); // Get the text content of the first cell (key)
      const value = cells[1].textContent.trim(); // Get the text content of the second cell (value)
      dataObject[key] = value;
    }
  }

  const ISBN = dataObject['ISBN']?.split(', ')[0];
  ISBN;
`;
