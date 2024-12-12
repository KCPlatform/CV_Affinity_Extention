// affinity.js
window.KaporAIExt = window.KaporAIExt || {};

window.KaporAIExt.affinity = {
  getAffinityCompanyInfo: function() {
    let nameElement, websiteElement;

    if (window.location.href.includes('affinity.co/lists')) {
      // For lists page
      const companyDiv = document.querySelector('div.affinity-css-bagv5u.ectaxxz4');
      if (companyDiv) {
        nameElement = companyDiv.querySelector('a.affinity-css-bagv5u.ectaxxz3 span');
        websiteElement = companyDiv.querySelector('a[href^="http"]');
      }
    } else {
      // For company page
      nameElement = document.querySelector('div.affinity-css-bagv5u.ectaxxz4 > div.affinity-css-1blk04o.ectaxxz2 > div.affinity-css-bagv5u.ectaxxz4');
      websiteElement = document.querySelector('a.e12u4leb5.affinity-css-1s0bvmj.e1mhvozk0');
    }

    if (nameElement && websiteElement) {

        const companyName = nameElement.textContent ? nameElement.textContent.trim() : null;
        const website = websiteElement.textContent ? websiteElement.textContent.trim() : null;
  
        if (companyName && website) {
            
            return {
              companyName: companyName,
              website: website,
            };

        }
    }
    return null;
  },

  initializeAffinityObserver: function() {
    const ui = window.KaporAIExt.ui;

    // Watch for clicks on the chooser suggestions
    document.addEventListener('click', (e) => {
      const suggestionElement = e.target.closest('.chooser-suggestion');
      if (suggestionElement) {
        const statusText = suggestionElement.querySelector('.text-with-icon-text.truncated')?.textContent.trim();
        if (statusText === 'Lost' || statusText === 'Pass') {
          console.log('Status changed to Lost');
          ui.showPassModal();
        }
      }
    });
  }

};
