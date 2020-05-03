document.getElementById('save_button').addEventListener('click', e => {
    chrome.tabs.getSelected(null, tab => {
        chrome.pageCapture.saveAsMHTML({
            tabId: tab.id
        }, bin => {
            bin.text().then((ttt) => {
                chrome.runtime.sendMessage(
                    { contentScriptQuery: "mhtml", content: ttt },
                    response => {
                        if (response['result_code'] === 'ok') {
                            document.getElementById("save_status").innerHTML = "<a href='<site url>/saved/" + response['page'] + "' target='_blank'><site url>/saved/" + response['page'] + "</a>";
                        } else {
                            document.getElementById("save_status").innerText = 'error saving page';
                        }
                    });
            }
            );
        });
    }
    );
});