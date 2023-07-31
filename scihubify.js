// UTILITIES

// constants
const amazonRegex = /dp\/\d{10}/;
const doiRegex = /10\.\d{4,9}\/[-._;()/:A-Z0-9]+/gi;
const isbnRegex = /^(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+$/;

const getMirror = async () => {
  const { mirror } = await browser.storage.sync.get('mirror');
  return mirror || 'https://sci-hub.se/';
};

// opens a new browser tab with the given URL
const openNewTab = (url) => {
  browser.tabs.create({ url });
};

// shows a notification with the given message
const showNotification = (message) => {
  browser.notifications.create({
    type: "basic",
    iconUrl: browser.runtime.getURL("graduate-hat.png"),
    title: "Notification",
    message: message,
  });
};

function getActiveTabUrl() {
  return new Promise((resolve) => {
    browser.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      const tab = tabs[0];
      const url = tab.url;
      resolve([url, tab.id]);
    });
  });
}

function findLongestString(arr) {
  let longestString = "";
  for (const element of arr) {
    if (element.length > longestString.length) {
      longestString = element;
    }
  }
  return longestString;
}

// script to return proper URLs 
const handlePDFUrl = async (data, isDoi) => {
  const scihubMirror = await getMirror();
  if (isDoi) {
    const nexusURL = `https://standard--template--construct-org.ipns.dweb.link/#/nexus_science/doi:${data}`;
    const scihubURL = `${scihubMirror}${data}`;
    return [nexusURL, scihubURL];
  } else {
    const openLibraryApiUrl = `https://openlibrary.org/isbn/${data}.json`;
    return [openLibraryApiUrl, null];
  }
};

// script to get ISBN from Goodreads or Google Books
const getISBNFromTab = async (tabId, script) => {
  try {
    const result = await browser.tabs.executeScript(tabId, { code: script });
    const resultArr = result[0];
    const longest = findLongestString(resultArr);
    const isbn = longest.replace(/\D/g, '');
    return isbn || false;
  } catch (error) {
    console.error("Error executing content script:", error);
    return false;
  }
};

const getISBNFromURL = async (url) => {
  if (amazonRegex.test(url)) {
    const isbn = url.match(amazonRegex)[0].replace('dp/', '');
    return isbn || null;
  } else {
    return null;
  }
};

const getDOIFromURL = async (url) => {
  if (doiRegex.test(url)) {
    const doi = url.match(doiRegex)[0];
    return doi || null;
  } else {
    return null;
  }
};

async function openLibraryHandler(properURL) {
  try {
    const response = await fetch(properURL[0]);
    const data = await response.json();
    const title = data["title"];
    const searchURL = `https://libgen.is/search.php?req=${title}&open=0&res=25&view=simple&phrase=1&column=def`;
    return searchURL || null;
  } catch {
    showNotification('Could not acquire data from Open Library.');
    return null;
  }
}

async function urlHandler(url, tabID) {
  if (url.includes("goodreads.com")) {
    const isbn = await getISBNFromTab(tabID, goodreadsContentScript);
    if (!isbn) {
      showNotification('Could not extract ISBN from page.');
      return null;
    }
    const properURL = await handlePDFUrl(isbn, false);
    const finalURL = await openLibraryHandler(properURL);
    return finalURL || null;
  } else if (url.includes("books.google")) {
    const isbn = await getISBNFromTab(tabID, googleBooksScript);
    const properURL = await handlePDFUrl(isbn, false);
    const finalURL = await openLibraryHandler(properURL);
    return finalURL || null;
  } else if (url.includes("amazon")) {
    const isbn = await getISBNFromURL(url);
    const properURL = await handlePDFUrl(isbn, false);
    const finalURL = await openLibraryHandler(properURL);
    return finalURL || null;
  } else {
    const doi = await getDOIFromURL(url);
    if (doi) {
      const [nexusURL, scihubURL] = await handlePDFUrl(doi, true);
      return [nexusURL, scihubURL] || [null, null];
    } else {
      showNotification('Could not find DOI or ISBN.');
      return null;
    }
  }
}

async function checkScihub(scihubURL) {
  try {
    const response = await fetch(scihubURL);
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const saveBtn = doc.querySelector('button[onclick^="location.href=\'"]');
    return Boolean(saveBtn);
  } catch (error) {
    console.error("Error checking Sci-hub:", error);
    return false;
  }
}

async function run(url, tabID) {
  const result = await urlHandler(url, tabID);
  if (Array.isArray(result)) {
    // It returned an array, which means it's a DOI URL and has two values
    const [nexusURL, scihubURL] = result;
    const isAvailableFromScihub = await checkScihub(scihubURL);
    if (isAvailableFromScihub) {
      openNewTab(scihubURL);
    } else {
      showNotification('PDF not available on Sci-hub, trying Nexus.');
      openNewTab(nexusURL);
    }
  } else {
    // It returned a single value, which means it's a goodreads, Google Books, or Amazon URL
    const bookURL = result;
    if (bookURL) {
      openNewTab(bookURL);
    }
  }
}

async function main() {
  const [urlTemp, tabID] = await getActiveTabUrl();
  if (urlTemp) {
    const url = urlTemp.replace('/full', '').replace('/text', ''); // Edge cases
    run(url, tabID);
  }
}

// CONTENT SCRIPTS

// content script to get ISBN from Goodreads
const goodreadsContentScript = `
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
        isbn = secondChild.innerText.split(" ");
      }
    }
  });

  isbn;
`;

// content script to get ISBN from Google Books
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

  const ISBN = dataObject['ISBN']?.split(', ');
  ISBN;
`;

// LISTENERS AND CONTEXT MENU

// Menu
browser.menus.create({
  id: "download",
  title: "Download PDF",
  contexts: ["link"],
});

// listener for the menu item click
browser.menus.onClicked.addListener(async (info) => {
  if (info.menuItemId === "download") {
    const link = info.linkUrl;
    if (link.includes('goodreads.com') || link.includes('books.google')) {
      showNotification("Download Not Available: Open the page and use the menubar icon.");
    } else {
      run(link, null)
    }
  }
});

// listener for when the browser-action is clicked
browser.browserAction.onClicked.addListener(main);

