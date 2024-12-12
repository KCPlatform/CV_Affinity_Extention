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
    let previousCounts = {
      Lost: 0,
      Pass: 0
    };
    let isInitialized = false;
    let observer = null;
    let lastUrl = window.location.href;

    const initializeObserver = () => {
      // Clean up existing observer if it exists
      if (observer) {
        observer.disconnect();
      }

      // Reset counts and initialization
      previousCounts = { Lost: 0, Pass: 0 };
      isInitialized = false;

      observer = new MutationObserver((mutations) => {
        if (!isInitialized) return;
        
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            document.querySelectorAll('.kb-column-header-title-liner').forEach(titleElement => {
              const columnTitle = titleElement.textContent.trim();
              if (columnTitle === 'Lost' || columnTitle === 'Pass') {
                const column = titleElement.closest('.kb-column');
                const currentCount = column.querySelectorAll('.kb-card').length;
                
                if (currentCount > previousCounts[columnTitle]) {
                  console.log(`Card moved to ${columnTitle} column (count: ${currentCount})`);
                  const companyInfo = window.KaporAIExt.affinity.getAffinityCompanyInfo();
                  ui.showPassModal(companyInfo);
                }
                
                previousCounts[columnTitle] = currentCount;
              }
            });
          }
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // Initialize counts after a short delay
      setTimeout(() => {
        document.querySelectorAll('.kb-column-header-title-liner').forEach(titleElement => {
          const columnTitle = titleElement.textContent.trim();
          if (columnTitle === 'Lost' || columnTitle === 'Pass') {
            const column = titleElement.closest('.kb-column');
            previousCounts[columnTitle] = column.querySelectorAll('.kb-card').length;
          }
        });
        isInitialized = true;
      }, 1000);
    };

    // Watch for clicks on the chooser suggestions
    document.addEventListener('click', (e) => {
      const suggestionElement = e.target.closest('.chooser-suggestion');
      if (suggestionElement) {
        const statusText = suggestionElement.querySelector('.text-with-icon-text.truncated')?.textContent.trim();
        if (statusText === 'Lost' || statusText === 'Pass') {
          console.log('Status changed to Lost/Pass via dropdown');
          const companyInfo = window.KaporAIExt.affinity.getAffinityCompanyInfo();
          ui.showPassModal(companyInfo);
        }
      }
    });

    // Watch for bucket drops
    const bucketDropObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // Look for newly added or modified subtitle elements
        const checkSubtitle = (element) => {
          if (element?.classList?.contains('kb-bucket-success-subtitle')) {
            const text = element.textContent;
            if (text && text.includes('moved to status Lost')) {
              console.log('Status changed to Lost via bucket');
              // Get company info before showing modal
              const companyInfo = window.KaporAIExt.affinity.getAffinityCompanyInfo();
              ui.showPassModal(companyInfo);
            }
          }
        };

        // Check new nodes
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) { // Element node
              checkSubtitle(node);
              // Also check children if it's a container
              const subtitle = node.querySelector?.('.kb-bucket-success-subtitle');
              if (subtitle) checkSubtitle(subtitle);
            }
          });
        }

        // Check modified nodes
        if (mutation.type === 'characterData') {
          const subtitle = mutation.target.parentElement;
          if (subtitle) checkSubtitle(subtitle);
        }
      });
    });

    // Start observing for bucket drops
    bucketDropObserver.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    // Initialize the observer for the first time
    initializeObserver();

    // Watch for URL changes
    setInterval(() => {
      if (lastUrl !== window.location.href) {
        console.log('URL changed, reinitializing observer');
        lastUrl = window.location.href;
        initializeObserver();
      }
    }, 1000);

    // Watch for status switch changes
    const statusSwitchObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'aria-checked' || mutation.attributeName === 'data-state')) {
          console.log('Status switch changed, reinitializing observer');
          initializeObserver();
        }
      });
    });

    // Start observing the status switch
    const observeStatusSwitch = () => {
      const statusSwitch = document.querySelector('button[data-testid="status-category-layout-switch"]');
      if (statusSwitch) {
        statusSwitchObserver.observe(statusSwitch, {
          attributes: true,
          attributeFilter: ['aria-checked', 'data-state']
        });
      }
    };

    // Initial observation of status switch
    observeStatusSwitch();

    // Also check for status switch when DOM changes (in case it loads after initial page load)
    const switchDetectionObserver = new MutationObserver((mutations) => {
      const statusSwitch = document.querySelector('button[data-testid="status-category-layout-switch"]');
      if (statusSwitch) {
        observeStatusSwitch();
        switchDetectionObserver.disconnect();
      }
    });

    switchDetectionObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

};
