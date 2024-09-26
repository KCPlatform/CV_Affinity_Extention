function isGoogleSpreadsheet(url) {
    return url.startsWith('https://docs.google.com/spreadsheets/');
  }
  
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getGoogleSheetsData") {
      console.log('Received request for Google Sheets data', request);
      fetchGoogleSheetsData(request.spreadsheetId, request.sheetName)
        .then(data => {
          console.log('Fetched Google Sheets data:', data);
          sendResponse({ data: data });
        })
        .catch(error => {
          console.error('Error fetching Google Sheets data:', error);
          sendResponse({ error: error.message });
        });
      return true; // Indicates we will send a response asynchronously
    } 
  });


  function fetchGoogleSheetsData(spreadsheetId, sheetName) {
    console.log('Fetching Google Sheets data for spreadsheet ID:', spreadsheetId, 'and sheet name:', sheetName);
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, function(token) {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        let range;

        if (sheetName) {
          range = sheetName
        } else {
          range = 'Sheet1'
        }

        fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          if (data.values) {
            resolve(data.values);
          } else {
            reject(new Error('No data found in the response'));
          }
        })
        .catch(error => reject(error));
      });
    });
  }