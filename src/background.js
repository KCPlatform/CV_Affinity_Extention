function isGoogleSpreadsheet(url) {
    return url.startsWith('https://docs.google.com/spreadsheets/');
  }
  
  // Listen for tab updates
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
      if (isGoogleSpreadsheet(tab.url)) {
        // If it's a Google Spreadsheet, enable the side panel
        chrome.sidePanel.setOptions({
          tabId: tabId,
          path: 'side_panel.html',
          enabled: true
        });
      } else {
        // If it's not a Google Spreadsheet, disable the side panel
        chrome.sidePanel.setOptions({
          tabId: tabId,
          enabled: false
        });
      }
    }
  });
  
  // Listen for tab activation
  chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
      if (isGoogleSpreadsheet(tab.url)) {
        // If it's a Google Spreadsheet, enable the side panel
        chrome.sidePanel.setOptions({
          tabId: activeInfo.tabId,
          path: 'side_panel.html',
          enabled: true
        });
      } else {
        // If it's not a Google Spreadsheet, disable the side panel
        chrome.sidePanel.setOptions({
          tabId: activeInfo.tabId,
          enabled: false
        });
      }
    });
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "updateSidePanel" && message.data && message.data.url) {
        chrome.sidePanel.setOptions({
            tabId: sender.tab.id,
            path: 'side_panel.html',
            enabled: true
        });
        chrome.sidePanel.open({ tabId: sender.tab.id });
    } else if (message.action === "initiateLogin") {
        chrome.identity.getAuthToken({ interactive: true }, function(token) {
            if (chrome.runtime.lastError) {
                console.error('Login failed:', chrome.runtime.lastError.message);
            } else {
                // Refresh the content script to fetch data with the new token
                chrome.tabs.sendMessage(sender.tab.id, { action: "refreshAfterLogin" });
            }
        });
    }
  });

  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "someAction"}, function(response) {
            if (chrome.runtime.lastError) {
                console.log(chrome.runtime.lastError.message);
            } else {
                // Handle response
            }
        });
    }
  });

  chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url.includes('docs.google.com/spreadsheets')) {
        chrome.tabs.sendMessage(tabId, {action: "init"}, function(response) {
            if (chrome.runtime.lastError) {
                console.log(chrome.runtime.lastError.message);
            } else {
                // Handle response
            }
        });
    }
  });

  chrome.runtime.onInstalled.addListener(() => {
    chrome.action.onClicked.addListener((tab) => {
        // Your code here
    });
  });

  chrome.runtime.onConnect.addListener(function(port) {
    port.onDisconnect.addListener(function() {
        if (chrome.runtime.lastError) {
            console.log(chrome.runtime.lastError.message);
        }
        // Handle disconnection
    });
  });

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getGoogleSheetsData") {
      chrome.identity.getAuthToken({ interactive: true }, function(token) {
        if (chrome.runtime.lastError) {
          sendResponse({ error: chrome.runtime.lastError.message });
        } else {
          // Use the token to make API requests
          fetchGoogleSheetsData(token)
            .then(data => sendResponse({ data: data }))
            .catch(error => sendResponse({ error: error.message }));
        }
      });
      return true; // Indicates that the response is sent asynchronously
    }
  });

  function fetchGoogleSheetsData(token) {
    // Implement your Google Sheets API requests here
    // Return a promise that resolves with the data
  }