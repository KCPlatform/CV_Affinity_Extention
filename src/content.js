let lastProcessedData = null;
let lastKaporAiUrl = null;
let iframeWasLoaded = false;
let isDataLoaded = false;
let globalSheetName = 'Sheet1';
let sheetObserver = null;

// Global cache object
let cache = {
    sheetsData: {
      data: null,
      timestamp: 0
    },
    selection: {
      data: null,
      timestamp: 0
    }
  };
  
const SHEETS_CACHE_DURATION = 1 * 60 * 1000; // 1 minute for sheet data
const SELECTION_CACHE_DURATION = 5 * 1000; // 5 seconds for selection data
  
// Function to check if the URL has changed
function hasUrlChanged() {
    const currentUrl = window.location.href;
    if (currentUrl !== hasUrlChanged.lastUrl) {
      hasUrlChanged.lastUrl = currentUrl;
      return true;
    }
    return false;
}
hasUrlChanged.lastUrl = '';

// Function to handle URL changes
function handleUrlChange() {
    if (hasUrlChanged()) {
      console.log('URL changed, processing data');
      processGoogleSheetsData();
    }
  }
  

// Function to check if we're on a relevant service
function isRelevantService() {
    if (window.location.href.match(/https:\/\/[^\/]+\.affinity\.co/)) {
        return 'affinity';
    } else if (window.location.href.match(/https:\/\/docs\.google\.com\/spreadsheets/)) {
        return 'googlesheets';
    }
    return null;
}

// Function to run our main logic
function runMain() {
    let service = isRelevantService();
    if (service) {
        processAndAppendCompanyLink(service);
    }
}

if ( !isDataLoaded ) {
    runMain();
    isDataLoaded = true;
    initializeSheetObserver();
}

// Function to handle cell clicks
function handleCellClick(event) {
    let nameBox = document.querySelector('input#t-name-box');
    let selectedDataRow = null;

    if (nameBox) {
        console.log('Name box found:', nameBox.value);
        let nameBoxValue = nameBox.value;
        selectedDataRow = nameBoxValue.replace(/^[A-Za-z]+/, '');
        selectedDataRow = selectedDataRow - 1;
        console.log('Selected data row:', selectedDataRow);

        processAndHandleEntry(selectedDataRow)
        .then(companyInfo => {
            if (companyInfo) {
                console.log('Company info:', companyInfo);
                buildKaporAiUrl(companyInfo.company, companyInfo.website, 'googlesheets');
            } else {
                console.log('No company info available');
            }
        })
        .catch(error => {
            console.error('Error getting company info:', error);
        });
    }
}

// Set up event listener for cell clicks
document.addEventListener('click', handleCellClick);
  
// Also run when the URL changes (for single-page apps)
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        runMain();
        adjustKciViewPosition(); 
        if (url.includes('docs.google.com/spreadsheets')) {
            initializeSheetObserver();
        }
    }
}).observe(document, {subtree: true, childList: true});


function loadProxyIntoIframe(service = 'chrome') {
  const iframe = document.getElementById('kci__iframe');
  if (iframe) {
      const proxyUrl = chrome.runtime.getURL('templates/proxy.html');
      console.log('Loading proxy URL into iframe:', proxyUrl);
      
      iframe.src = proxyUrl;
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      
      iframe.onload = function() {
          console.log('Proxy iframe loaded successfully');
          iframeWasLoaded = true;
          iframe.contentWindow.postMessage({
              type: 'loadUrl',
              config: { KAPOR_AI_BASE_URL: CONFIG.KAPOR_AI_BASE_URL },
              url: `${CONFIG.KAPOR_AI_BASE_URL}?hide_header=true&source=${service}`
          }, '*');
      };
      
      iframe.onerror = function() {
          console.error('Proxy iframe failed to load');
      };
  } else {
      console.error('kci__iframe not found');
  }
}

  // Load the HTML
fetch(chrome.runtime.getURL('templates/panel.html'))
.then(response => response.text())
.then(data => {

    let container = document.getElementById('kci');
    if (!container) {
        container = document.createElement("div");
        container.classList.add("kci");
        container.id = "kci";
        document.body.appendChild(container);
    }
    container.innerHTML = data;  // Add this line to set the HTML content

    kciRunAfterPanelLoad();
    loadProxyIntoIframe(); 
    runMain();
    
})
.catch(error => {
    console.error("There was an error:", error);
});

function kciChatToggle() {
  let chatElement = document.getElementById('kci__chat');
  chatElement.style.display = (chatElement.style.display === 'none') ? 'block' : 'none';
}

function kciHotKeys() {

  let cCount = 0;
  let lastKeypressTime = 0;

  document.addEventListener('keydown', function(event) {

      if (event.key === 'c') {
          let currentTime = new Date();
          if (currentTime - lastKeypressTime <= 300) {
              cCount++;
          } else {
              cCount = 1;
          }
          lastKeypressTime = currentTime;
          if (cCount === 3) {
              kciChatToggle();
              cCount = 0;
          }
      } else {
          cCount = 0;
      }
  });

}


function kciRunAfterPanelLoad() {
  kciHotKeys();
  kciMainButtons();
  adjustKciViewPosition();
}


function kciMainButtons() {
  const targetDiv = document.getElementById("kci__menu--float");
  if (!targetDiv) {
    console.error("Element with ID 'kci__menu--float' not found");
    return;
  }

  const iconURL = chrome.runtime.getURL("icon-128.png");
  const iconElement = document.createElement("img");
  iconElement.alt = "KCI Tools";
  iconElement.src = iconURL;
  iconElement.id = "kci__btn--open";
  iconElement.classList.add("kci__btn--open");
  
  targetDiv.appendChild(iconElement);

  document.getElementById('kci__btn--open').addEventListener('click', function() {
      const kciView = document.getElementById('kci__view');
      kciView.style.display = 'block';
      document.getElementById('kci__menu--float').style.display = 'none';
      
      adjustKciViewPosition();
      updateIframeIfVisible();
  });

  document.getElementById('kci__btn--close').addEventListener('click', function() {
      document.getElementById('kci__view').style.display = 'none';
      document.getElementById('kci__menu--float').style.display = 'block';
  });

  // Add full-screen button and functionality
  const fullScreenButton = document.createElement('button');
  fullScreenButton.textContent = 'Full Screen';
  fullScreenButton.id = 'kci__btn--full-screen';
  fullScreenButton.style.fontSize = '12px';
  fullScreenButton.style.marginRight = '10px';
  fullScreenButton.style.width = '150px';
  
  const closeButton = document.getElementById('kci__btn--close');
  closeButton.parentNode.insertBefore(fullScreenButton, closeButton);

  let isFullScreen = false;

  fullScreenButton.addEventListener('click', function() {
    const kciView = document.getElementById('kci__view');
    if (!isFullScreen) {
      kciView.style.position = 'fixed';
      kciView.style.top = '0';
      kciView.style.right = '0';
      kciView.style.width = '100vw';
      kciView.style.height = '100vh';
      kciView.style.zIndex = '9999';
      fullScreenButton.textContent = 'Exit Full Screen';
    } else {
      kciView.style.position = '';
      kciView.style.top = '';
      kciView.style.left = '';
      kciView.style.width = '';
      kciView.style.height = '';
      kciView.style.zIndex = '';
      fullScreenButton.textContent = 'Full Screen';
    }
    isFullScreen = !isFullScreen;
  });
}


function updateIframeIfVisible(url = null) {
    const kciView = document.getElementById('kci__view');
    const iframe = document.getElementById('kci__iframe');

    if ( !kciView || kciView.style.display == 'none' || !iframe || !iframe.contentWindow ) {
        return;
    }

    if ( url ) {
        console.log('Updating iframe with new URL:', url);
        iframe.contentWindow.postMessage({
            type: 'loadUrl',
            url: url
        }, '*');
    
    } else if ( lastKaporAiUrl ) {
        console.log('Updating iframe with last URL:', lastKaporAiUrl);
        iframe.contentWindow.postMessage({
            type: 'loadUrl',
            url: lastKaporAiUrl
        }, '*');
    } 

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

function processAndHandleEntry(selectedDataRow) {
    
    return new Promise((resolve, reject) => {
        if (!hasUrlChanged()) {
            processSelectedRow(selectedDataRow)
                .then(entry => {
                    if (entry) {
                        resolve(entry);
                    } else {
                        console.log('No valid entry found');
                        resolve(null); 
                    }
                })
                .catch(error => {
                    console.error('Error processing selected row:', error);
                    reject(error); 
                });
        } else {
            console.log('URL has changed, resetting process');
            clearCache('all');
            resolve(null); 
        }
    });
}

function processSelectedRow(selectedDataRow) {
    return new Promise((resolve, reject) => {
        if (!selectedDataRow && selectedDataRow !== 0) {
            console.log('No row selected');
            resolve(null);
            return;
        }

        console.log('Selected data row:', selectedDataRow);

        getCachedOrFetchedData()
            .then(sheetsData => {
                if (!sheetsData || sheetsData.length <= selectedDataRow) {
                    console.log('Selected row is out of range, fetching updated data');
                    clearCache('all');
                    return getCachedOrFetchedData();
                }
                return sheetsData;
            })
            .then(sheetsData => {
                if (!sheetsData || sheetsData.length <= selectedDataRow) {
                    console.log('Selected row is still out of range after update');
                    resolve(null);
                } else {
                    resolve(extractEntryFromRow(sheetsData, selectedDataRow));
                }
            })
            .catch(reject);
    });
}

function getCachedOrFetchedData() {
    const now = Date.now();
    if (cache.sheetsData.data && (now - cache.sheetsData.timestamp < SHEETS_CACHE_DURATION)) {
        console.log('Using cached sheets data');
        return Promise.resolve(cache.sheetsData.data);
    }

    console.log('Fetching fresh sheets data');
    return getGoogleSheetsData()
        .then(freshData => {
            cache.sheetsData = { data: freshData, timestamp: now };
            return freshData;
        });
}

function extractEntryFromRow(sheetsData, rowIndex) {
    const headers = sheetsData[0];
    const selectedRowData = sheetsData[rowIndex];

    const relevantColumns = {
        company: headers.findIndex(header => {
            const lowerHeader = header.toLowerCase().trim();
            return lowerHeader.includes('company') || lowerHeader.includes('organization');
        }),
        website: headers.findIndex(header => {
            const lowerHeader = header.toLowerCase().trim();
            return lowerHeader.includes('website') || lowerHeader.includes('url') || lowerHeader.includes('web address');
        }),
        email: headers.findIndex(header => {
            const lowerHeader = header.toLowerCase().trim();
            return lowerHeader.includes('email') || lowerHeader.includes('email address') || lowerHeader.includes('e-mail');
        })
    };

    let entry = {};
    if (relevantColumns.company !== -1) {
        entry.company = selectedRowData[relevantColumns.company];
    }
    if (relevantColumns.website !== -1) {
        entry.website = selectedRowData[relevantColumns.website];
    }
    if (relevantColumns.email !== -1) {
        entry.email = selectedRowData[relevantColumns.email];
    }

    // If company doesn't exist but website does, set company to website
    if (!entry.company && entry.website) {
        entry.company = entry.website;
    }

    if ( !entry.company && !entry.website && entry.email ) {
        // strip email domain from email
        let emailParts = entry.email.split('@');
        if (emailParts.length > 1) {
            entry.company = emailParts[1];
            entry.website = emailParts[1];
        }
    }

    if ( !entry.company && !entry.website ) {
        console.log('No company, website, or email found');
        return null;
    }

    console.log('Extracted entry:', entry);
    return entry;
}


function processAndAppendCompanyLink(service) {
    let companyInfo;
    let companyName;
    let companyWebsite;

    if (service === 'googlesheets') {

        console.log('Getting Google Sheets company info');

        let nameBox = document.querySelector('input#t-name-box');
        let selectedDataRow = null;

        if (nameBox) {
            console.log('Name box found:', nameBox.value);
            let nameBoxValue = nameBox.value;
            selectedDataRow = nameBoxValue.replace(/^[A-Za-z]+/, '');
            selectedDataRow = selectedDataRow - 1;
            console.log('Selected data row:', selectedDataRow);
        }

        // Don't run on initial load wait for click
        if ( isDataLoaded && selectedDataRow != 0 ) {
            processAndHandleEntry(selectedDataRow)
            .then(companyInfo => {
                if (companyInfo) {
                    console.log('Company info:', companyInfo);
                    buildKaporAiUrl(companyInfo.company, companyInfo.website, 'googlesheets');
                } else {
                    console.log('No company info available');
                }
            })
            .catch(error => {
                console.error('Error getting company info:', error);
            });
        }

    }

    if (service === 'affinity') {

        console.log('Getting Affinity company info');
        companyInfo = getAffinityCompanyInfo();
    
        if (companyInfo) {

            buildKaporAiUrl(companyInfo.companyName, companyInfo.website, 'affinity');

        }

    } 

}

function buildKaporAiUrl(company, website, service = 'chrome') {

    if (company && website) {

        console.log('Company name found:', company);    
        console.log('Website found:', website);
    
        const kaporAiUrl = createKaporAiUrl(company, website, service);
        console.log('Kapor AI URL:', kaporAiUrl);
        console.log('Last Kapor AI URL:', lastKaporAiUrl);
        lastKaporAiUrl = kaporAiUrl;
        console.log('Updated Kapor AI URL:', lastKaporAiUrl);

        if (kaporAiUrl) {
      
            const iframe = ensureIframeExists();

            if (iframe && iframeWasLoaded == false) {
                loadProxyIntoIframe(service);
            }

            if ( service === 'affinity') {
                addKaporAiTab(kaporAiUrl);
            }

            updateIframeIfVisible(kaporAiUrl);

        }

    } else {
        console.log('Company information not found');
    }

}

function ensureIframeExists() {
    let iframe = document.querySelector('#kci__iframe');
    if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'kci__iframe';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        
        const kciView = document.getElementById('kci__view');
        if (kciView) {
            kciView.appendChild(iframe);
        } else {
            console.error('kci__view element not found');
            return null;
        }
    }
    return iframe;
}


function getAffinityCompanyInfo() {
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
        return {
            companyName: nameElement.textContent.trim(),
            website: websiteElement.textContent.trim()
        };
    }
    return null;
}


function createKaporAiUrl(company, website, service = 'chrome') {

    if ( company && website ) {
        return `${CONFIG.KAPOR_AI_BASE_URL}/company-report?company_website=${encodeURIComponent(website)}&company_name=${encodeURIComponent(company)}&source=${service}&hide_header=true`;
    } else {
        return `${CONFIG.KAPOR_AI_BASE_URL}?&source=${service}&hide_header=true`;
    }
}

function addKaporAiTab(kaporAiUrl) {
    const tabsContainer = document.querySelector('.profile-content.displaying-tabs [role="tablist"]');
    if (tabsContainer && !document.querySelector('.kapor-ai-tab-button')) {
        const kaporAiTabButton = createKaporAiTabButton();
        const otherTabButtons = tabsContainer.querySelectorAll('button[role="tab"]:not(.kapor-ai-tab-button)');

        addKaporAiTabClickListener(kaporAiTabButton, kaporAiUrl, otherTabButtons);
        addOtherTabsClickListeners(otherTabButtons, kaporAiTabButton);

        tabsContainer.appendChild(kaporAiTabButton);
    }
}

function createKaporAiTabButton() {
    const kaporAiTabButton = document.createElement('button');
    kaporAiTabButton.type = 'button';
    kaporAiTabButton.role = 'tab';

    const siblingButton = document.querySelector('button[role="tab"]:not(.kapor-ai-tab-button)');
    if (siblingButton) {
        const siblingClasses = Array.from(siblingButton.classList)
            .filter(className => className.startsWith('affinity-css-') || className.startsWith('ergfh8s'));
        kaporAiTabButton.className = `kapor-ai-tab-button ${siblingClasses.join(' ')}`;
    } else {
        kaporAiTabButton.className = 'kapor-ai-tab-button';
    }

    const innerDiv = document.createElement('div');
    innerDiv.className = 'affinity-css-j2rosk e1ny9v0z0';
    innerDiv.textContent = 'Kapor AI';

    kaporAiTabButton.appendChild(innerDiv);
    return kaporAiTabButton;
}

function addKaporAiTabClickListener(kaporAiTabButton, kaporAiUrl, otherTabButtons) {
    kaporAiTabButton.addEventListener('click', function() {
        const profileContentTabs = document.querySelector('.profile-content-tabs');
        if (profileContentTabs) {
            removeKaporAiContent();
            hideOtherContent(profileContentTabs);
            addKaporAiContent(profileContentTabs, kaporAiUrl);
            setActiveTab(kaporAiTabButton, otherTabButtons);
        }
    });
}

function addOtherTabsClickListeners(otherTabButtons, kaporAiTabButton) {
    otherTabButtons.forEach(button => {
        button.addEventListener('click', function() {
            removeKaporAiContent();
            this.setAttribute('data-state', 'active');
            kaporAiTabButton.removeAttribute('data-state');
        });
    });
}

function removeKaporAiContent() {
    const kaporAiTab = document.querySelector('.kapor-ai-tab');
    if (kaporAiTab) {
        kaporAiTab.remove();
        const siblingContent = document.querySelector('.profile-content-tabs > :not(.kapor-ai-tab)');
        if (siblingContent) {
            siblingContent.style.display = '';
        }
    }
}

function hideOtherContent(profileContentTabs) {
    const siblingContent = profileContentTabs.firstElementChild;
    if (siblingContent) {
        siblingContent.style.display = 'none';
    }
}

function addKaporAiContent(profileContentTabs, kaporAiUrl) {
    const kaporAiTabContent = document.createElement('div');
    kaporAiTabContent.className = 'kapor-ai-tab';
    
    const iframe = document.createElement('iframe');
    iframe.src = kaporAiUrl;
    iframe.style.width = '100%';
    iframe.style.height = '100%'; 
    iframe.style.border = 'none';
    
    kaporAiTabContent.appendChild(iframe);
    profileContentTabs.appendChild(kaporAiTabContent);
}

function setActiveTab(activeButton, inactiveButtons) {
    activeButton.setAttribute('data-state', 'active');
    inactiveButtons.forEach(button => button.removeAttribute('data-state'));
}

function getActiveSheetName() {
    const activeTab = document.querySelector('.docs-sheet-active-tab .docs-sheet-tab-name');
    return activeTab ? activeTab.textContent : null;
}

function observeActiveSheetChange(callback) {
    if (sheetObserver) {
        sheetObserver.disconnect();
    }

    const sheetTabsContainer = document.querySelector('.docs-sheet-container');
    if (!sheetTabsContainer) {
        console.error('Sheet tabs container not found');
        setTimeout(() => observeActiveSheetChange(callback), 1000);
        return;
    }

    sheetObserver = new MutationObserver(() => {
        const activeSheetName = getActiveSheetName();
        if (activeSheetName && activeSheetName !== globalSheetName) {
            globalSheetName = activeSheetName;
            callback(activeSheetName);
        }
    });

    sheetObserver.observe(sheetTabsContainer, { 
        childList: true, 
        subtree: true, 
        attributes: true, 
        attributeFilter: ['class'] 
    });

    // Initial check
    const initialSheetName = getActiveSheetName();
    if (initialSheetName) {
        globalSheetName = initialSheetName;
        callback(initialSheetName);
    }
}

// Function to initialize the observer
function initializeSheetObserver() {
    observeActiveSheetChange((activeSheetName) => {
        console.log('Active sheet changed to:', activeSheetName);
        clearCache('all');
        processAndAppendCompanyLink('googlesheets');
    });
}

function getSpreadsheetInfoFromUrl() {
    const url = window.location.href;
    const spreadsheetIdMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);    
    const spreadsheetId = spreadsheetIdMatch ? spreadsheetIdMatch[1] : null;
    console.log('Spreadsheet ID:', spreadsheetId);
    
    return { spreadsheetId };
  }


function getGoogleSheetsData() {
  const { spreadsheetId } = getSpreadsheetInfoFromUrl();
  if (!spreadsheetId) {
    return Promise.reject(new Error('No spreadsheet ID found in URL'));
  }

  const now = Date.now();
  if (cache.sheetsData.data && (now - cache.sheetsData.timestamp < SHEETS_CACHE_DURATION)) {
    console.log('Using cached sheets data');
    return Promise.resolve(cache.sheetsData.data);
  }

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ 
      action: "getGoogleSheetsData",
      spreadsheetId: spreadsheetId,
      sheetName: globalSheetName
    }, response => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else if (response.error) {
        reject(new Error(response.error));
      } else {
        console.log('RESOLVED Google Sheets data:', response.data);
        cache.sheetsData.data = response.data;
        cache.sheetsData.timestamp = now;
        resolve(response.data);
      }
    });
  });
}

function clearCache(type = 'all') {
  const now = 0;
  if (type === 'all' || type === 'sheets') {
    cache.sheetsData = { data: null, timestamp: now };
  }
  if (type === 'all' || type === 'selection') {
    cache.selection = { data: null, timestamp: now };
  }
}


function updateIframeWithUrl(url) {
    const iframe = document.getElementById('kci__iframe');
    if (iframe) {
        if ( iframe.src !== url) {
            iframe.src = url;
        }
    }
}

function isGoogleSpreadsheet(url) {
  return url.startsWith('https://docs.google.com/spreadsheets/');
}
