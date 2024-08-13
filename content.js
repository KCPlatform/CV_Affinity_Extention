// Function to process the company information and append a new link
function processAndAppendCompanyLink() {
    // Find the element with the specified class for the company name
    const nameElement = document.querySelector('div.affinity-css-bagv5u.ectaxxz4 > div.affinity-css-1blk04o.ectaxxz2 > div.affinity-css-bagv5u.ectaxxz4');
    
    // Find the element with the specified class for the website
    const websiteElement = document.querySelector('a.e12u4leb5.affinity-css-1s0bvmj.e1mhvozk0');
    
    if (nameElement && websiteElement && !websiteElement.nextElementSibling?.classList.contains('kapor-ai-link')) {
      const companyName = nameElement.textContent.trim();
      const website = websiteElement.textContent.trim();
      console.log('Company name found:', companyName);
      console.log('Website found:', website);
      
      const kaporAiUrl = `https://develop.kapor.ai/company-report/?company_website=${encodeURIComponent(website)}&company_name=${encodeURIComponent(companyName)}&source=affinity&hide_header=true`;
      
      // Store the URL to load
      lastKaporAiUrl = kaporAiUrl;
      
      // Update the iframe only if kci__view is visible
      updateIframeIfVisible();
      
      // Create a new anchor element
      const newLink = document.createElement('a');
      newLink.href = kaporAiUrl;
      newLink.textContent = 'View on Kapor AI';
      newLink.className = 'kapor-ai-link';
      newLink.target = '_blank';
      newLink.rel = 'noopener noreferrer';
      newLink.style.marginLeft = '10px';
      newLink.style.color = '#007bff';
      newLink.style.textDecoration = 'none';

      // Append the new link after the website link
      websiteElement.parentNode.insertBefore(newLink, websiteElement.nextSibling);
    } else {
      if (!nameElement) console.log('Company name element not found');
      if (!websiteElement) console.log('Website element not found');
    }
  }
  
  // Function to check if we're on a relevant page
  function isRelevantPage() {
    return window.location.href.match(/https:\/\/[^\/]+\.affinity\.co\/companies\/\d+/);
  }
  
  // Function to run our main logic
  function runMain() {
    if (isRelevantPage()) {
      processAndAppendCompanyLink();
    }
  }
  
  // Run immediately
  runMain();
  
  // Set up a MutationObserver to watch for changes
  const observer = new MutationObserver((mutations) => {
    for (let mutation of mutations) {
      if (mutation.type === 'childList' || mutation.type === 'subtree') {
        runMain();
        break;
      }
    }
  });
  
  // Start observing the document with the configured parameters
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Also run when the URL changes (for single-page apps)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      runMain();
    }
  }).observe(document, {subtree: true, childList: true});


function loadProxyIntoIframe() {
  const iframe = document.getElementById('kci__iframe');
  if (iframe) {
      const proxyUrl = chrome.runtime.getURL('proxy.html');
      console.log('Loading proxy URL into iframe:', proxyUrl);
      
      iframe.src = proxyUrl;
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      
      iframe.onload = function() {
          console.log('Proxy iframe loaded successfully');
          // Send initial URL to load
          iframe.contentWindow.postMessage({
              type: 'loadUrl',
              url: 'https://develop.kapor.ai/search?hide_header=true'
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

}


function kciMainButtons() {

  const iconURL = chrome.runtime.getURL("icon-48.png");
  const iconElement = document.createElement("img");
  iconElement.alt = "KCI Tools";
  iconElement.src = iconURL;
  iconElement.id = "kci__btn--open";
  iconElement.classList.add("kci__btn--open");
  
  const targetDiv = document.getElementById("kci__menu--float");
  targetDiv.appendChild(iconElement);

  document.getElementById('kci__btn--open').addEventListener('click', function() {
      document.getElementById('kci__view').style.display = 'block';
      document.getElementById('kci__menu--float').style.display = 'none';
      updateIframeIfVisible(); // Add this line to update iframe when opened
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