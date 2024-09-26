// utils.js
window.MyExtension = window.MyExtension || {};

window.MyExtension.utils = (function() {
  let lastUrl = '';

  function hasUrlChanged() {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      return true;
    }
    return false;
  }

  function isRelevantService() {
    if (window.location.href.match(/https:\/\/[^\/]+\.affinity\.co/)) {
      return 'affinity';
    } else if (window.location.href.match(/https:\/\/docs\.google\.com\/spreadsheets/)) {
      return 'googlesheets';
    }
    return null;
  }

  function adjustKciViewPosition() {
    const kciView = document.getElementById('kci__view');
    if (kciView) {
      if (window.location.href.includes('affinity.co/lists')) {
        kciView.style.left = '0';
        kciView.style.right = 'auto';
      } else {
        kciView.style.right = '0';
        kciView.style.left = 'auto';
      }
    }
  }


  return {
    hasUrlChanged,
    isRelevantService,
    adjustKciViewPosition,
  };
})();
