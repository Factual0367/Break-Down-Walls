function getURL() {
    browser.tabs.query({
        active: true,
        lastFocusedWindow: true
    }, function(tabs) {
        // and use that tab to fill in out title and url
        var tab = tabs[0];
        url = tab.url; 
        if (url.includes("amazon")) {
            libgenify(url)
            } else {
            scihubify(url);
        }
    });
}

function libgenify(url) {
    var urlList = url.split("/")
    if (url.includes('keywords')) {
        var isbn = urlList[urlList.length-2]
    } else {
        var isbn = urlList[urlList.length-1]
    }
    var apiUrl = "https://openlibrary.org/isbn/" + isbn + ".json";
    var data = fetch(apiUrl)
    .then(res => res.json())  
    .then((out) => {  
        title = out["title"];
        var url = "https://libgen.is/search.php?req=" + title + "&open=0&res=25&view=simple&phrase=1&column=def"
        browser.tabs.update({ url: url });
    })  
    .catch(err => {  
        throw err  
    });
}

function scihubify(currenturl) {
    // get the preferred mirror set by user 
    // default is sci-hub.se
    const p = Promise.resolve(browser.storage.sync.get('mirror'))
    p.then(value => {
        if (value.mirror == undefined) {
            var mirror = 'https://sci-hub.se/'
            var url = mirror + currenturl;
            browser.tabs.update({url : url});
        } else {
            var mirror = value.mirror;
            var url = mirror + currenturl;
            browser.tabs.update({ url: url });
        }
    }).catch(err => {
        console.log(err);

    });

};

// execute getURL when the browser-action is clicked
browser.browserAction.onClicked.addListener(getURL);

// context menu stuff

async function downloadPDF(scihubLink) {
    fetch(scihubLink)
    .then(function(response) {
        // When the page is loaded convert it to text
        return response.text()
    })
    .then(function(html) {
        // Initialize the DOM parser
        var parser = new DOMParser();

        // Parse the text
        try {
            var doc = parser.parseFromString(html, "text/html");
            var saveBtn = doc.getElementsByTagName('button')[0].getAttribute('onclick').slice(17,-1)
            browser.tabs.create({url:'http://'+saveBtn})        
        } catch {
            browser.notifications.create({
            type: "basic",
            iconUrl: browser.extension.getURL("graduate-hat.png"),
            title: "Your PDF could not be downloaded.",
            message: "Could not download the PDF, maybe try manually?",
            });

        }

    })
}

async function constructLink(link) {
    const p = Promise.resolve(browser.storage.sync.get('mirror'))
    p.then(value => {
        if (value.mirror == undefined) {
            var mirror = 'https://sci-hub.se/'
            var url = mirror + link;
            downloadPDF(url)
        } else {
            var mirror = value.mirror;
            var url = mirror + link;
            downloadPDF(url)
        }})
}

browser.menus.create({
    id: "download",
    title: "Download PDF",
    contexts: ["link"]
  });

browser.menus.onClicked.addListener(async function (info, tab) {
if (info.menuItemId == "download") {
    link = info.linkUrl;
    if (link.includes('amazon')) {
        libgenify(link)
    } else {
        constructLink(link)
    }
}});   