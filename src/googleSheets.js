// googleSheets.js
window.MyExtension = window.MyExtension || {};

window.MyExtension.googleSheets = {
  handleCellClick: function(event) {
    const constants = window.MyExtension.constants;
    const process = window.MyExtension.process;
    const utils = window.MyExtension.utils;

    let nameBox = document.querySelector('input#t-name-box');
    if (nameBox) {
      let nameBoxValue = nameBox.value;
      let selectedDataRow = parseInt(nameBoxValue.replace(/^[A-Za-z]+/, '')) - 1;

      process.processAndHandleEntry(selectedDataRow)
        .then(companyInfo => {
          if (companyInfo) {
            console.log('Company info:', companyInfo);
            process.buildKaporAiUrl(companyInfo.company, companyInfo.website, 'googlesheets');
          }
        })
        .catch(error => {
          console.error('Error getting company info:', error);
        });
    }
  },

  getGoogleSheetsData: function() {
    const utils = window.MyExtension.utils;
    const constants = window.MyExtension.constants;
    const cache = window.MyExtension.cache;

    const { spreadsheetId } = this.getSpreadsheetInfoFromUrl();
    if (!spreadsheetId) {
      return Promise.reject(new Error('No spreadsheet ID found in URL'));
    }

    const now = Date.now();
    if (cache.sheetsData.data && (now - cache.sheetsData.timestamp < constants.SHEETS_CACHE_DURATION)) {
      console.log('Using cached sheets data');
      return Promise.resolve(cache.sheetsData.data);
    }

    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'getGoogleSheetsData',
        spreadsheetId: spreadsheetId,
        sheetName: constants.globalSheetName,
      }, response => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (response.error) {
          reject(new Error(response.error));
        } else {
          console.log('Resolved Google Sheets data:', response.data);
          cache.sheetsData = { data: response.data, timestamp: now };
          resolve(response.data);
        }
      });
    });
  },

  getSpreadsheetInfoFromUrl: function() {
    const url = window.location.href;
    const spreadsheetIdMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    const spreadsheetId = spreadsheetIdMatch ? spreadsheetIdMatch[1] : null;
    console.log('Spreadsheet ID:', spreadsheetId);

    return { spreadsheetId };
  },

  initializeSheetObserver: function() {
    const constants = window.MyExtension.constants;
    const process = window.MyExtension.process;

    const observeActiveSheetChange = (callback) => {
      if (constants.sheetObserver) {
        constants.sheetObserver.disconnect();
      }

      const sheetTabsContainer = document.querySelector('.docs-sheet-container');
      if (!sheetTabsContainer) {
        console.error('Sheet tabs container not found');
        setTimeout(() => observeActiveSheetChange(callback), 1000);
        return;
      }

      constants.sheetObserver = new MutationObserver(() => {
        const activeSheetName = this.getActiveSheetName();
        if (activeSheetName && activeSheetName !== constants.globalSheetName) {
          constants.globalSheetName = activeSheetName;
          callback(activeSheetName);
        }
      });

      constants.sheetObserver.observe(sheetTabsContainer, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class'],
      });

      // Initial check
      const initialSheetName = this.getActiveSheetName();
      if (initialSheetName) {
        constants.globalSheetName = initialSheetName;
        callback(initialSheetName);
      }
    };

    observeActiveSheetChange((activeSheetName) => {
      console.log('Active sheet changed to:', activeSheetName);
      window.MyExtension.cache.clearCache('all');
      window.MyExtension.process.processAndAppendCompanyLink('googlesheets');
    });
  },

  getActiveSheetName: function() {
    const activeTab = document.querySelector('.docs-sheet-active-tab .docs-sheet-tab-name');
    return activeTab ? activeTab.textContent : null;
  },

  // Add other Google Sheets-specific functions here...
};
