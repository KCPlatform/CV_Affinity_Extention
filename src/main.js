// main.js
window.KaporAIExt = window.KaporAIExt || {};

window.KaporAIExt.main = {
  runMain: function() {
    const utils = window.KaporAIExt.utils;
    const process = window.KaporAIExt.process;
    const googleSheets = window.KaporAIExt.googleSheets;
    const airtable = window.KaporAIExt.airtable;
    const affinity = window.KaporAIExt.affinity;
    const constants = window.KaporAIExt.constants;
    const ui = window.KaporAIExt.ui;

    let service = utils.isRelevantService();

    if (service) {
      
      process.processAndAppendCompanyLink(service);

      if (service === 'googlesheets') {
        googleSheets.initializeSheetObserver();
      }

      if (service === 'airtable') {
        airtable.initializeAirtableObserver();
      }

      if (service === 'affinity') {
        affinity.initializeAffinityObserver();
      }

    }

    if (!constants.isDataLoaded) {
      constants.isDataLoaded = true;
    }

    // Load the HTML template and set up UI
    ui.loadHtmlTemplate();
  },
};