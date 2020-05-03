chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.contentScriptQuery == "mhtml") {
            fetch("<site url>/savemhtml", {
                method: "POST",
                body: JSON.stringify({ "mhtml": request.content }),
                headers: {
                    'Content-Type': 'application/json'
                },
            })
                .then(response => response.json())
                .then(jsn => sendResponse(jsn))
            return true;
        }
    }
);