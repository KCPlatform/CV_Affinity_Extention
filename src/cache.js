// cache.js
window.KaporAIExt = window.KaporAIExt || {};

window.KaporAIExt.cache = {
  sheetsData: {
    data: null,
    timestamp: 0,
  },
  selection: {
    data: null,
    timestamp: 0,
  },

  getCachedOrFetchedData: function() {
    const now = Date.now();
    const constants = window.KaporAIExt.constants;
    const cache = window.KaporAIExt.cache;
    const googleSheets = window.KaporAIExt.googleSheets;

    if (cache.sheetsData.data && (now - cache.sheetsData.timestamp < constants.SHEETS_CACHE_DURATION)) {
      console.log('Using cached sheets data');
      return Promise.resolve(cache.sheetsData.data);
    }

    console.log('Fetching fresh sheets data');
    return googleSheets.getGoogleSheetsData().then(freshData => {
      cache.sheetsData = { data: freshData, timestamp: now };
      return freshData;
    });
  },

  clearCache: function(type = 'all') {
    if (type === 'all' || type === 'sheets') {
      this.sheetsData = { data: null, timestamp: 0 };
    }
    if (type === 'all' || type === 'selection') {
      this.selection = { data: null, timestamp: 0 };
    }
  },
};
