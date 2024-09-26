// main.js
window.KaporAIExt = window.KaporAIExt || {};

window.KaporAIExt.main = {
  runMain: function() {
    const utils = window.KaporAIExt.utils;
    const process = window.KaporAIExt.process;
    const googleSheets = window.KaporAIExt.googleSheets;
    const constants = window.KaporAIExt.constants;
    const ui = window.KaporAIExt.ui;

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