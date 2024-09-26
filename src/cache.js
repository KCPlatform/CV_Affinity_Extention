// cache.js
window.MyExtension = window.MyExtension || {};

window.MyExtension.cache = {
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
    const constants = window.MyExtension.constants;
    const cache = window.MyExtension.cache;
    const googleSheets = window.MyExtension.googleSheets;

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
