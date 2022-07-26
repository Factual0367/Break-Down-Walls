function getURL() {
    browser.tabs.query({
        active: true,
        lastFocusedWindow: true
    }, function(tabs) {
        // and use that tab to fill in out title and url
        var tab = tabs[0];
        url = tab.url; 
        scihubify(url);
        }
    )};

function scihubify(currenturl) {
    console.log("Scihubifying.");
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
