// We'll use chrome.runtime.getURL to load content.js as a module
const contentScriptUrl = chrome.runtime.getURL('content.js');

// Use dynamic import to load the module
import(contentScriptUrl).then((contentModule) => {
    const { createKaporAiUrl } = contentModule;

    function initializeSidePanel() {
        // Set up message listener for communication with content script
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === "updateSidePanel") {
                updateSidePanelContent(message.data);
            }
        });

        // Initial load of Google Sheets data
        // getGoogleSheetsData().then(({ companyName, website }) => {
        //     updateSidePanelContent(companyName, website);
        // });
    }

    function updateSidePanelContent(data) {
        if (data.needsLogin) {
            document.getElementById('error').textContent = 'Please log in to access Google Sheets data.';
            document.getElementById('kaporAiFrame').style.display = 'none';
            document.getElementById('loginButton').style.display = 'block';
        } else if (data.error) {
            document.getElementById('error').textContent = data.error;
            document.getElementById('kaporAiFrame').style.display = 'none';
            document.getElementById('loginButton').style.display = 'none';
        } else {
            document.getElementById('error').textContent = '';
            document.getElementById('kaporAiFrame').style.display = 'block';
            document.getElementById('loginButton').style.display = 'none';
            document.getElementById('kaporAiFrame').src = data.kaporAiUrl;
        }
    }

    document.getElementById('loginButton').addEventListener('click', function() {
        chrome.runtime.sendMessage({ action: "initiateLogin" });
    });

    // Call initialize function
    initializeSidePanel();
}).catch(error => {
    console.error('Error loading content script:', error);
});