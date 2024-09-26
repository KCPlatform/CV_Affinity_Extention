// events.js
window.KaporAIExt = window.KaporAIExt || {};

window.KaporAIExt.events = {
  initializeEventListeners: function() {
    const googleSheets = window.KaporAIExt.googleSheets;
    const main = window.KaporAIExt.main;
    const utils = window.KaporAIExt.utils;

    // Handle cell clicks in Google Sheets
    document.addEventListener('click', googleSheets.handleCellClick);

    // Handle URL changes for single-page apps
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        main.runMain();
        utils.adjustKciViewPosition();
        if (url.includes('docs.google.com/spreadsheets')) {
          googleSheets.initializeSheetObserver();
        }
      }
    }).observe(document, { subtree: true, childList: true });
  },
};
