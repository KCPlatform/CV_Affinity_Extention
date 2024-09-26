// main.js
window.MyExtension = window.MyExtension || {};

window.MyExtension.main = {
  runMain: function() {
    const utils = window.MyExtension.utils;
    const process = window.MyExtension.process;
    const googleSheets = window.MyExtension.googleSheets;
    const constants = window.MyExtension.constants;
    const ui = window.MyExtension.ui;

    let service = utils.isRelevantService();
    if (service) {
      process.processAndAppendCompanyLink(service);
    }

    if (!constants.isDataLoaded) {
      constants.isDataLoaded = true;
      googleSheets.initializeSheetObserver();
    }

    // Load the HTML template and set up UI
    ui.loadHtmlTemplate();
  },
};