// events.js
window.MyExtension = window.MyExtension || {};

window.MyExtension.events = {
  initializeEventListeners: function() {
    const googleSheets = window.MyExtension.googleSheets;
    const main = window.MyExtension.main;
    const utils = window.MyExtension.utils;

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
