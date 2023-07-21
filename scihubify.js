// handles mirror fetching and default setting
const getMirror = async () => {
    const value = await browser.storage.sync.get('mirror');
    return value.mirror ?? 'https://sci-hub.se/';
}

// updates the browser tab with the given URL
const updateTabURL = (url) => {
    browser.tabs.update({ url });
}

// fetches the active tab's URL and manages its handling
function getURL() {
    browser.tabs.query({ active: true, lastFocusedWindow: true }, function(tabs) {
      // and use that tab to fill in out title and url
      var tab = tabs[0];
      var url = tab.url; 
  
      if (url.includes("goodreads.com")) {
         
        browser.tabs.executeScript(tab.id, { code: goodreadsScript })
        .then(results => {
            // get the ISBN from the results
            var isbn = results[0];

            goodreadify(isbn)
        });
      } 
      else if (url.includes("amazon")) {
        libgenify(url);
      } 
      else {
        scihubify(url);
      }
    });
  }
  

// handles Amazon URLs
const libgenify = async (url) => {
    const urlList = url.split("/")
    const isbn = url.includes('keywords') ? urlList[urlList.length-2] : urlList[urlList.length-1];
    const apiUrl = `https://openlibrary.org/isbn/${isbn}.json`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        const title = data["title"];
        const searchURL = `https://libgen.is/search.php?req=${title}&open=0&res=25&view=simple&phrase=1&column=def`;

        updateTabURL(searchURL);
    } catch (error) {
        throw error;
    }
}

// handles goodreads
const goodreadify = async (isbn) => {
    const apiUrl = `https://openlibrary.org/isbn/${isbn}.json`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        const title = data["title"];
        const searchURL = `https://libgen.is/search.php?req=${title}&open=0&res=25&view=simple&phrase=1&column=def`;

        updateTabURL(searchURL);
    } catch (error) {
        throw error;
    }
}

// handles non-Amazon URLs
const scihubify = async (url) => {
    const mirror = await getMirror();
    const fullURL = `${mirror}${url}`;

    updateTabURL(fullURL);
}

// listener for when the browser-action is clicked
browser.browserAction.onClicked.addListener(getURL);

// Menu
browser.menus.create({
    id: "download",
    title: "Download PDF",
    contexts: ["link"]
});

browser.menus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "download") {
        const link = info.linkUrl;
        if (link.includes('goodreads.com')) {
            browser.notifications.create({
                type: "basic",
                iconUrl: browser.extension.getURL("graduate-hat.png"),
                title: "Download Not Available",
                message: "This option does not work for Goodreads. Open the page and use the menubar icon.",
            });
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
}

// handles PDF download
const downloadPDF = async (scihubLink) => {
    try {
        const response = await fetch(scihubLink);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const saveBtn = doc.getElementsByTagName('button')[0].getAttribute('onclick').slice(17, -1);

        updateTabURL(`http://${saveBtn}`);
    } catch {
        browser.notifications.create({
            type: "basic",
            iconUrl: browser.extension.getURL("graduate-hat.png"),
            title: "Your PDF could not be downloaded.",
            message: "Could not download the PDF, maybe try manually?",
        });
    }
}

// content script to get isbn from Goodreads
var goodreadsScript = `
    var buttons = Array.from(document.querySelectorAll('span'));
    var buttonToClick = buttons.find(button => button.innerText === 'Book details & editions');

    if (buttonToClick) {
    buttonToClick.click();
    }

    var elements = document.querySelectorAll('.DescListItem');
    var isbn = null;

    elements.forEach(element => {
    if (element.firstElementChild && element.firstElementChild.innerText === "ISBN") {
        var secondChild = element.firstElementChild.nextElementSibling;
        if (secondChild) {
        isbn = secondChild.innerText.split(" ")[0];
        }
    }
    });

    isbn;
`;