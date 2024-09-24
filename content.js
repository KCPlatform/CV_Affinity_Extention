// Function to process the company information and append a new link
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

function createKaporAiUrl(companyName, website) {
    return `${CONFIG.KAPOR_AI_BASE_URL}/company-report/?company_website=${encodeURIComponent(website)}&company_name=${encodeURIComponent(companyName)}&source=affinity&hide_header=true`;
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

function processAndAppendCompanyLink(service) {
    let companyInfo;

    if (service === 'googlesheets') {
        companyInfo = getGoogleSheetsCompanyInfo();
    } else if (service === 'affinity') {
        companyInfo = getAffinityCompanyInfo();
    }
    
    if (companyInfo) {
        const { companyName, website } = companyInfo;
        console.log('Company name found:', companyName);
        console.log('Website found:', website);
      
        const kaporAiUrl = createKaporAiUrl(companyName, website, service);
        lastKaporAiUrl = kaporAiUrl;
      
        const iframe = ensureIframeExists();
        if (iframe) {
            if (service === 'googlesheets') {
                iframe.src = kaporAiUrl;
            } else {
                // For Affinity, we'll load the proxy first
                loadProxyIntoIframe(kaporAiUrl);
            }
        }

        if (service === 'affinity') {
            addKaporAiTab(kaporAiUrl);
        }
    } else {
        console.log('Company information not found');
    }
}

// Function to check if we're on a relevant servce
function isRelevantPage() {
    if (window.location.href.match(/https:\/\/[^\/]+\.affinity\.co/)) {
        return 'affinity';
    } else if (window.location.href.match(/https:\/\/docs\.google\.com\/spreadsheets/)) {
        return 'googlesheets';
    }
    return null;
}

// Function to run our main logic
function runMain() {
    const service = isRelevantPage();
    if (service) {
        ensureKciElementsExist(); // Ensure elements exist before trying to use them
        setupButtonListeners();
        processAndAppendCompanyLink(service);
        if (service === 'googlesheets') {
            // For Google Sheets, we need to show the KCI view
            const kciView = document.getElementById('kci__view');
            if (kciView) {
                kciView.style.display = 'block';
            } else {
                console.warn('kci__view element not found');
            }
            
            const floatMenu = document.getElementById('kci__menu--float');
            if (floatMenu) {
                floatMenu.style.display = 'none';
            } else {
                console.warn('kci__menu--float element not found');
            }
            
            adjustKciViewPosition();
        }
    }
}

function ensureKciElementsExist() {
    // Remove any existing duplicate elements
    const existingKci = document.querySelectorAll('.kci');
    existingKci.forEach((el, index) => {
        if (index > 0) el.remove(); // Keep the first one, remove others
    });

    let kciContainer = document.querySelector('.kci');
    if (!kciContainer) {
        kciContainer = document.createElement('div');
        kciContainer.className = 'kci';
        kciContainer.id = 'kci';
        document.body.appendChild(kciContainer);
    }

    let kciView = document.getElementById('kci__view');
    if (!kciView) {
        kciView = document.createElement('div');
        kciView.id = 'kci__view';
        kciView.className = 'kci__view';
        kciContainer.appendChild(kciView);
    }
    // Set display to 'none' regardless of whether it was just created or already existed
    kciView.style.display = 'none';

    // Create or ensure existence of the button container
    let buttonContainer = kciView.querySelector('.kci__button-container');
    if (!buttonContainer) {
        buttonContainer = document.createElement('div');
        buttonContainer.className = 'kci__button-container';
        kciView.appendChild(buttonContainer);
    }

    // Create or ensure existence of the full screen button
    let fullScreenButton = buttonContainer.querySelector('#kci__btn--fullscreen');
    if (!fullScreenButton) {
        fullScreenButton = document.createElement('button');
        fullScreenButton.id = 'kci__btn--fullscreen';
        fullScreenButton.className = 'kci__btn kci__btn--fullscreen';
        fullScreenButton.textContent = 'Full Screen';
        buttonContainer.appendChild(fullScreenButton);
    }

    // Create or ensure existence of the close button
    let closeButton = buttonContainer.querySelector('#kci__btn--close');
    if (!closeButton) {
        closeButton = document.createElement('button');
        closeButton.id = 'kci__btn--close';
        closeButton.className = 'kci__btn kci__btn--close';
        closeButton.textContent = 'Close';
        buttonContainer.appendChild(closeButton);
    }

    if (!document.getElementById('kci__menu--float')) {
        const floatMenu = document.createElement('div');
        floatMenu.id = 'kci__menu--float';
        floatMenu.className = 'kci__menu--float';
        kciContainer.appendChild(floatMenu);
    }
}

// Call this function before runMain
ensureKciElementsExist();
setupButtonListeners();
runMain();
adjustKciViewPosition(); 

// Set up a MutationObserver to watch for changes
const observer = new MutationObserver((mutations) => {
    for (let mutation of mutations) {
        if (mutation.type === 'childList' || mutation.type === 'subtree') {
            runMain();
            break;
        }
    }
});
observer.observe(document.body, { childList: true, subtree: true });
  
// Also run when the URL changes (for single-page apps)
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        runMain();
        adjustKciViewPosition(); 
    }
}).observe(document, {subtree: true, childList: true});


function loadProxyIntoIframe(finalUrl) {
    const iframe = document.getElementById('kci__iframe');
    if (iframe) {
        const proxyUrl = chrome.runtime.getURL('templates/proxy.html');
        console.log('Loading proxy URL into iframe:', proxyUrl);
        
        iframe.src = proxyUrl;
        
        iframe.onload = function() {
            console.log('Proxy iframe loaded successfully');
            // Now that the proxy is loaded, we can send the final URL
            iframe.contentWindow.postMessage({ type: 'loadUrl', url: finalUrl }, '*');
        };
        
        iframe.onerror = function() {
            console.error('Failed to load proxy iframe');
        };
    } else {
        console.error('kci__iframe not found');
    }
}

  // Load the HTML
fetch(chrome.runtime.getURL('templates/panel.html'))
.then(response => response.text())
.then(data => {

    var container= document.createElement("div");
    container.classList.add("kci");
    container.id = "kci";
    container.innerHTML = data;

    console.log('Appending container to body');
    document.body.appendChild(container);

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
  const iconURL = chrome.runtime.getURL("icon-128.png");
  const iconElement = document.createElement("img");
  iconElement.alt = "KCI Tools";
  iconElement.src = iconURL;
  iconElement.id = "kci__btn--open";
  iconElement.classList.add("kci__btn--open");
  
  const targetDiv = document.getElementById("kci__menu--float");
  targetDiv.appendChild(iconElement);

  document.getElementById('kci__btn--open').addEventListener('click', function() {
      document.getElementById('kci__view').style.display = 'block';
      
      adjustKciViewPosition();
      updateIframeIfVisible();
  });

  document.getElementById('kci__btn--close').addEventListener('click', function() {
      document.getElementById('kci__view').style.display = 'none';
    //   document.getElementById('kci__menu--float').style.display = 'block';
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

let lastKaporAiUrl = null;

function updateIframeIfVisible() {
    const kciView = document.getElementById('kci__view');
    const iframe = document.getElementById('kci__iframe');
    
    if (kciView && kciView.style.display !== 'none' && iframe && iframe.contentWindow && lastKaporAiUrl) {
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
    } else {
        console.warn('kci__view element not found in adjustKciViewPosition');
    }
}


function getGoogleSheetsCompanyInfo() {
    // Find the active cell
    const activeCell = document.querySelector('.active-cell-border');
    if (!activeCell) return null;

    // Get the row and column of the active cell
    const row = activeCell.getAttribute('data-row');
    const col = activeCell.getAttribute('data-col');

    if (!row || !col) return null;

    // Find the header cells
    const headerCells = document.querySelectorAll('.column-headers-background .column-header-clip');
    
    // Find company name and website columns
    let nameColumnIndex = -1;
    let websiteColumnIndex = -1;

    headerCells.forEach((cell, index) => {
        const text = cell.textContent.toLowerCase().trim();
        if (text === 'company name' || text === 'company') nameColumnIndex = index;
        if (text === 'company website' || text === 'website') websiteColumnIndex = index;
    });

    console.log('Name column index:', nameColumnIndex);
    console.log('Website column index:', websiteColumnIndex);

    if (nameColumnIndex === -1 || websiteColumnIndex === -1) return null;

    // Get the values from the active row
    const rowCells = document.querySelectorAll(`[data-row="${row}"] .cell-content`);
    
    if (rowCells.length <= Math.max(nameColumnIndex, websiteColumnIndex)) return null;

    const companyName = rowCells[nameColumnIndex].textContent.trim();
    const website = rowCells[websiteColumnIndex].textContent.trim();

    if (!companyName || !website) return null;

    return { companyName, website };
}

function extractCompanyInfoFromGoogleSheets() {
    const rows = document.querySelectorAll('.row-header-wrapper');
    if (rows.length === 0) return null;

    const headerRow = rows[0];
    const cells = headerRow.querySelectorAll('.cell-content');
    
    let nameColumnIndex = -1;
    let websiteColumnIndex = -1;

    cells.forEach((cell, index) => {
        const text = cell.textContent.toLowerCase().trim();
        if (text === 'company name') nameColumnIndex = index;
        if (text === 'company website') websiteColumnIndex = index;
    });

    if (nameColumnIndex === -1 || websiteColumnIndex === -1) return null;

    const selectedRow = document.querySelector('.focused');
    if (!selectedRow) return null;

    const selectedCells = selectedRow.querySelectorAll('.cell-content');
    const companyName = selectedCells[nameColumnIndex].textContent.trim();
    const website = selectedCells[websiteColumnIndex].textContent.trim();

    return { companyName, website };
}


function setupGoogleSheetsListener() {
    if (window.location.href.includes('docs.google.com/spreadsheets')) {
        document.addEventListener('click', function(event) {
            if (event.target.closest('.row-header-wrapper')) {
                setTimeout(runMain, 100); // Small delay to ensure the row is selected
            }
        });
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


function setupButtonListeners() {
    const fullScreenButton = document.getElementById('kci__btn--fullscreen');
    const closeButton = document.getElementById('kci__btn--close');
    const kciView = document.getElementById('kci__view');

    let isFullScreen = false;

    if (fullScreenButton) {
        fullScreenButton.addEventListener('click', function() {
            isFullScreen = !isFullScreen;
            if (isFullScreen) {
                kciView.style.width = '100%';
                kciView.style.height = '100%';
                fullScreenButton.textContent = 'Exit Full Screen';
            } else {
                kciView.style.width = '550px';
                kciView.style.height = '100vh';
                fullScreenButton.textContent = 'Full Screen';
            }
        });
    }

    if (closeButton) {
        closeButton.addEventListener('click', function() {
            kciView.style.display = 'none';
        });
    }
}