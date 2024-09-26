// constants.js
window.MyExtension = window.MyExtension || {};

window.MyExtension.constants = {
  lastProcessedData: null,
  lastKaporAiUrl: null,
  iframeWasLoaded: false,
  isDataLoaded: false,
  globalSheetName: 'Sheet1',
  sheetObserver: null,

  // Cache durations
  SHEETS_CACHE_DURATION: 1 * 60 * 1000, // 1 minute
  SELECTION_CACHE_DURATION: 5 * 1000,   // 5 seconds
};
