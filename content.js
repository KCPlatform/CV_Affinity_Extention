// Function to process the company information and append a new link
function processAndAppendCompanyLink() {
    let nameElement, websiteElement, companyName, website;

    if (window.location.href.includes('affinity.co/lists')) {
        // For lists page
        const companyDiv = document.querySelector('div.affinity-css-bagv5u.ectaxxz4');
        if (companyDiv) {
            nameElement = companyDiv.querySelector('a.affinity-css-bagv5u.ectaxxz3 span');
            websiteElement = companyDiv.querySelector('a[href^="http"]');
        }
    } else {
        // For company page (existing logic)
        nameElement = document.querySelector('div.affinity-css-bagv5u.ectaxxz4 > div.affinity-css-1blk04o.ectaxxz2 > div.affinity-css-bagv5u.ectaxxz4');
        websiteElement = document.querySelector('a.e12u4leb5.affinity-css-1s0bvmj.e1mhvozk0');
    }
    
    if (nameElement && websiteElement && !websiteElement.nextElementSibling?.classList.contains('kapor-ai-link')) {
        companyName = nameElement.textContent.trim();
        website = websiteElement.textContent.trim();
        console.log('Company name found:', companyName);
        console.log('Website found:', website);
      
        const kaporAiUrl = `${CONFIG.KAPOR_AI_BASE_URL}/company-report/?company_website=${encodeURIComponent(website)}&company_name=${encodeURIComponent(companyName)}&source=affinity&hide_header=true`;
      
        // Store the URL to load
        lastKaporAiUrl = kaporAiUrl;
      
        // Update the iframe only if kci__view is visible
        updateIframeIfVisible();

        // Add Kapor AI tab
        // const tabsContainer = document.querySelector('.profile-content.displaying-tabs .affinity-css-vc9gfs');
        const tabsContainer = document.querySelector('.profile-content.displaying-tabs [role="tablist"]');
        if (tabsContainer && !document.querySelector('.kapor-ai-tab-button')) {
            const kaporAiTabButton = document.createElement('button');
            const siblingButton = tabsContainer.querySelector('button[role="tab"]:not(.kapor-ai-tab-button)');

            kaporAiTabButton.type = 'button';
            kaporAiTabButton.role = 'tab';

            if (siblingButton) {
                const siblingClasses = Array.from(siblingButton.classList)
                    .filter(className => className.startsWith('affinity-css-') || className.startsWith('ergfh8s'));
                kaporAiTabButton.className = `kapor-ai-tab-button ${siblingClasses.join(' ')}`;
            } else {
                kaporAiTabButton.className = 'kapor-ai-tab-button';
            }


            // Create the inner div
            const innerDiv = document.createElement('div');
            innerDiv.className = 'affinity-css-j2rosk e1ny9v0z0';
            innerDiv.textContent = 'Kapor AI';

            // Append the inner div to the button
            kaporAiTabButton.appendChild(innerDiv);
            
            // Function to remove Kapor AI content and restore sibling visibility
            function removeKaporAiContent() {
                const kaporAiTab = document.querySelector('.kapor-ai-tab');
                if (kaporAiTab) {
                    kaporAiTab.remove();
                    // Restore visibility of sibling content
                    const siblingContent = document.querySelector('.profile-content-tabs > :not(.kapor-ai-tab)');
                    if (siblingContent) {
                        siblingContent.style.display = ''; // Reset to inherited display value
                    }
                }
                // Remove active state from Kapor AI button
                kaporAiTabButton.removeAttribute('data-state');
            }

            // Add click event listener to Kapor AI tab button
            kaporAiTabButton.addEventListener('click', function() {
                const profileContentTabs = document.querySelector('.profile-content-tabs');
                if (profileContentTabs) {
                    // Remove existing Kapor AI content
                    removeKaporAiContent();
                    
                    // Hide sibling content
                    const siblingContent = profileContentTabs.firstElementChild;
                    if (siblingContent) {
                        siblingContent.style.display = 'none';
                    }
                    
                    // Create new div for Kapor AI content
                    const kaporAiTabContent = document.createElement('div');
                    kaporAiTabContent.className = 'kapor-ai-tab';
                    
                    // Create iframe
                    const iframe = document.createElement('iframe');
                    iframe.src = kaporAiUrl;
                    iframe.style.width = '100%';
                    iframe.style.height = '100%'; 
                    iframe.style.border = 'none';
                    
                    // Append iframe to the new div
                    kaporAiTabContent.appendChild(iframe);
                    
                    // Append the new div to profile-content-tabs
                    profileContentTabs.appendChild(kaporAiTabContent);

                    // Set active state on Kapor AI button
                    kaporAiTabButton.setAttribute('data-state', 'active');

                    // Remove active state from other buttons
                    otherTabButtons.forEach(button => {
                        button.removeAttribute('data-state');
                    });
                }
            });
            
            // Add click event listeners to other tab buttons
            const otherTabButtons = tabsContainer.querySelectorAll('button[role="tab"]:not(.kapor-ai-tab-button)');
            otherTabButtons.forEach(button => {
                button.addEventListener('click', function() {
                    removeKaporAiContent();
                    // Set active state on clicked button
                    this.setAttribute('data-state', 'active');
                    // Remove active state from Kapor AI button
                    kaporAiTabButton.removeAttribute('data-state');
                });
            });

            tabsContainer.appendChild(kaporAiTabButton);
        }
    } else {
        if (!nameElement) console.log('Company name element not found');
        if (!websiteElement) console.log('Website element not found');
    }
}

// Function to check if we're on a relevant page
function isRelevantPage() {
    return window.location.href.match(/https:\/\/[^\/]+\.affinity\.co/) || 
    window.location.href.match(/https:\/\/docs\.google\.com\/spreadsheets/);
}

// Function to run our main logic
function runMain() {
    if (isRelevantPage()) {
        processAndAppendCompanyLink();
    }
}

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


function loadProxyIntoIframe() {
  const iframe = document.getElementById('kci__iframe');
  if (iframe) {
      const proxyUrl = chrome.runtime.getURL('templates/proxy.html');
      console.log('Loading proxy URL into iframe:', proxyUrl);
      
      iframe.src = proxyUrl;
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      
      iframe.onload = function() {
          console.log('Proxy iframe loaded successfully');
          // Pass the CONFIG to the proxy
          iframe.contentWindow.postMessage({
              type: 'config',
              config: { KAPOR_AI_BASE_URL: CONFIG.KAPOR_AI_BASE_URL }
          }, '*');
          // Send initial URL to load
          iframe.contentWindow.postMessage({
              type: 'loadUrl',
              url: `${CONFIG.KAPOR_AI_BASE_URL}/search?hide_header=true&source=affinity`
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

    var container= document.createElement("div");
    container.classList.add("kci");
    container.id = "kci";
    container.innerHTML = data;

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
    }
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