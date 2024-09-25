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

runMain();
// adjustKciViewPosition(); 

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
              url: `${CONFIG.KAPOR_AI_BASE_URL}?hide_header=true&source=affinity`
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


function processAndAppendCompanyLink(service) {
    let companyInfo;

    if (service === 'googlesheets') {
        getGoogleSheetsData()
            .then(({ companyName, website }) => {
                const kaporAiUrl = createKaporAiUrl(companyName, website, 'googlesheets');
                sendDataToSidePanel({ companyName, website, kaporAiUrl });
            })
            .catch(error => {
                if (error.needsLogin) {
                    sendDataToSidePanel({ needsLogin: true });
                } else {
                    console.error('Error processing Google Sheets data:', error);
                    sendDataToSidePanel({ error: error.message });
                }
            });
    }

    if (service === 'affinity') {

        console.log('Getting Affinity company info');
        companyInfo = getAffinityCompanyInfo();
    
        if (companyInfo) {
            const { companyName, website } = companyInfo;
            console.log('Company name found:', companyName);
            console.log('Website found:', website);
        
            const kaporAiUrl = createKaporAiUrl(companyName, website, service);
            lastKaporAiUrl = kaporAiUrl;

            if (kaporAiUrl) {
          
                const iframe = ensureIframeExists();
                if (iframe) {
                    loadProxyIntoIframe(kaporAiUrl);
                }

                addKaporAiTab(kaporAiUrl);

            }
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


function createKaporAiUrl(companyName, website) {

    if ( companyName && website ) {
        return `${CONFIG.KAPOR_AI_BASE_URL}/company-report/?company_website=${encodeURIComponent(website)}&company_name=${encodeURIComponent(companyName)}&source=affinity&hide_header=true`;
    } else {
        return `${CONFIG.KAPOR_AI_BASE_URL}?&source=affinity&hide_header=true`;
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


function getGoogleSheetsData() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: "getGoogleSheetsData" }, response => {
      if (response.error) {
        if (response.error === "browser_signin_disabled") {
          reject(new Error("Browser sign-in is disabled"));
        } else {
          reject(new Error(response.error));
        }
      } else {
        resolve(response.data);
      }
    });
  });
}

function handleGoogleSheetsData() {
  getGoogleSheetsData()
    .then(data => {
      console.log("Google Sheets data:", data);
      // Process the data
      updateUI(data);
    })
    .catch(error => {
      console.error("Error processing Google Sheets data:", error);
      if (error.message === "Browser sign-in is disabled") {
        showSignInPrompt();
      } else {
        showErrorMessage(error.message);
      }
    });
}

function showSignInPrompt() {
  const message = `
    To use this feature, you need to enable browser sign-in for Chrome. 
    Please follow these steps:
    1. Open Chrome settings (chrome://settings/)
    2. Go to the "You and Google" section
    3. Turn on "Allow Chrome sign-in"
    4. Sign in to your Google account in Chrome
    5. Refresh this page and try again
  `;
  
  // Display this message in your UI
  // For example:
  const errorDiv = document.createElement('div');
  errorDiv.textContent = message;
  errorDiv.style.color = 'red';
  errorDiv.style.padding = '10px';
  errorDiv.style.border = '1px solid red';
  document.body.insertBefore(errorDiv, document.body.firstChild);
}

function showErrorMessage(message) {
  // Display a generic error message in your UI
  const errorDiv = document.createElement('div');
  errorDiv.textContent = `An error occurred: ${message}`;
  errorDiv.style.color = 'red';
  document.body.insertBefore(errorDiv, document.body.firstChild);
}

function updateUI(data) {
  // Update your UI with the fetched data
}

// Call this function when you need to fetch Google Sheets data
handleGoogleSheetsData();

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

function sendDataToSidePanel(data) {
  if (isGoogleSpreadsheet(window.location.href)) {
    if (chrome.runtime && chrome.runtime.id) {
        chrome.runtime.sendMessage({action: "updateSidePanel", data: data}, function(response) {
            if (chrome.runtime.lastError) {
                console.log(chrome.runtime.lastError.message);
            } else {
                // Handle response
            }
        });
    } else {
        console.log("Extension context invalid");
    }
  }
}

// Call this function when you have new data to send to the side panel
sendDataToSidePanel({ companyName: "Example Corp", website: "example.com" });

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "getKaporAiUrl") {
        console.log("Received message to get Kapor AI URL");
        const url = createKaporAiUrl(request.data.companyName, request.data.website);
        console.log("Kapor AI URL:", url);
        sendResponse({url: url});
    }
    return true;  // Indicates that the response is sent asynchronously
});

window.kaporAiExtension = {
    createKaporAiUrl: createKaporAiUrl,
    getGoogleSheetsData: getGoogleSheetsData
};