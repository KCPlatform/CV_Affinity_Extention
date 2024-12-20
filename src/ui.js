// ui.js
window.KaporAIExt = window.KaporAIExt || {};

window.KaporAIExt.ui = {
    isExtensionContextValid: function() {
        try {
            chrome.runtime.getURL("");
            return true;
        } catch (e) {
            return false;
        }
    },
    loadHtmlTemplate: function() {
        var self = this;
        if (!this.isExtensionContextValid()) {
            console.log("Extension context is invalid. Attempting to reload...");
            if (chrome.runtime.reload) {
                chrome.runtime.reload();
            }
            return;
        }
        fetch(chrome.runtime.getURL('templates/panel.html'))
          .then(function(response) { return response.text(); })
          .then(function(data) {
            let container = document.getElementById('kci');
            if (!container) {
              try {
                container = document.createElement("div");
                container.classList.add("kci");
                container.id = "kci";
                if (document.body) {
                  document.body.appendChild(container);
                } else {
                  console.log("Document body not found");
                  return;
                }
              } catch (error) {
                console.log("Error creating container:", error);
                return;
              }
            }
            
            try {
              container.innerHTML = data;
              self.kciRunAfterPanelLoad();
              self.loadProxyIntoIframe();
            } catch (error) {
              console.log("Error setting container innerHTML or running after-load functions:", error);
            }
          })
          .catch(function(error) {
            console.log("There was an error loading the HTML template:", error);
          });
    },

  loadProxyIntoIframe: function(service = 'chrome') {

    if (!this.isExtensionContextValid()) {
        console.log("Extension context is invalid. Skipping loadProxyIntoIframe.");
        return;
    }
    
    const constants = window.KaporAIExt.constants;
    const CONFIG = window.KaporAIExt.CONFIG;

    const iframe = document.getElementById('kci__iframe');
    if (iframe) {
      const proxyUrl = chrome.runtime.getURL('templates/proxy.html');

      iframe.src = proxyUrl;
      iframe.style.width = '100%';
      iframe.style.height = '100%';

      iframe.onload = function() {
        constants.iframeWasLoaded = true;
        iframe.contentWindow.postMessage({
          type: 'loadUrl',
          url: `${CONFIG.KAPOR_AI_BASE_URL}?hide_header=true&source=${service}`
        }, '*');
      };

      iframe.onerror = function() {
        console.log('Proxy iframe failed to load');
      };
    } else {
      console.log('kci__iframe not found');
    }
  },

  kciRunAfterPanelLoad: function() {
    this.kciHotKeys();
    this.kciMainButtons();
    window.KaporAIExt.utils.adjustKciViewPosition();
  },

  kciHotKeys: function() {
    var self = this;
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
          self.kciChatToggle();
          cCount = 0;
        }
      } else {
        cCount = 0;
      }
    });
  },

  kciChatToggle: function() {
    let chatElement = document.getElementById('kci__chat');
    if (chatElement) {
      chatElement.style.display = (chatElement.style.display === 'none') ? 'block' : 'none';
    } else {
      console.log('kci__chat element not found');
    }
  },

  kciMainButtons: function() {
    var self = this;
    const targetDiv = document.getElementById("kci__menu--float");
    if (!targetDiv) {
      console.log("Element with ID 'kci__menu--float' not found");
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
      self.openKciView();
    });

    document.getElementById('kci__btn--close').addEventListener('click', function() {
      self.closeKciView();
    });

    // Add full-screen button and functionality
    const fullScreenButton = document.createElement('button');
    fullScreenButton.textContent = 'Full Screen';
    fullScreenButton.id = 'kci__btn--full-screen';
    fullScreenButton.style.fontSize = '12px';
    fullScreenButton.style.marginRight = '10px';
    fullScreenButton.style.width = '150px';

    const closeButton = document.getElementById('kci__btn--close');
    if (closeButton) {
      closeButton.parentNode.insertBefore(fullScreenButton, closeButton);

      let isFullScreen = false;

      fullScreenButton.addEventListener('click', function() {
        self.toggleFullScreen();
      });
    } else {
      console.log("Element with ID 'kci__btn--close' not found");
    }
  },

  openKciView: function() {
    const kciView = document.getElementById('kci__view');
    if (kciView) {
      kciView.style.display = 'block';
      const menuFloat = document.getElementById('kci__menu--float');
      if (menuFloat) {
        menuFloat.style.display = 'none';
      }
      window.KaporAIExt.utils.adjustKciViewPosition();
      this.updateIframeIfVisible();
    } else {
      console.log('kci__view element not found');
    }
  },

  closeKciView: function() {
    const kciView = document.getElementById('kci__view');
    if (kciView) {
      kciView.style.display = 'none';
      const menuFloat = document.getElementById('kci__menu--float');
      if (menuFloat) {
        menuFloat.style.display = 'block';
      }
    } else {
      console.log('kci__view element not found');
    }
  },

  toggleFullScreen: function() {
    const kciView = document.getElementById('kci__view');
    const fullScreenButton = document.getElementById('kci__btn--full-screen');
    if (kciView && fullScreenButton) {
      let isFullScreen = fullScreenButton.textContent === 'Exit Full Screen';

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
    } else {
      console.log('kci__view or kci__btn--full-screen element not found');
    }
  },

  updateIframeIfVisible: function(url = null) {
    const constants = window.KaporAIExt.constants;

    const kciView = document.getElementById('kci__view');
    const iframe = document.getElementById('kci__iframe');

    if (!kciView || kciView.style.display === 'none' || !iframe || !iframe.contentWindow) {
      return;
    }

    if (url) {
      iframe.contentWindow.postMessage({
        type: 'loadUrl',
        url: url
      }, '*');
    } else if (constants.lastKaporAiUrl) {
      iframe.contentWindow.postMessage({
        type: 'loadUrl',
        url: constants.lastKaporAiUrl
      }, '*');
    }
  },

  addKaporAiTab: function(kaporAiUrl) {
    var self = this;
    const tabsContainer = document.querySelector('.profile-content.displaying-tabs [role="tablist"]');
    if (tabsContainer && !document.querySelector('.kapor-ai-tab-button')) {
      const kaporAiTabButton = self.createKaporAiTabButton();
      const otherTabButtons = tabsContainer.querySelectorAll('button[role="tab"]:not(.kapor-ai-tab-button)');

      self.addKaporAiTabClickListener(kaporAiTabButton, kaporAiUrl, otherTabButtons);
      self.addOtherTabsClickListeners(otherTabButtons, kaporAiTabButton);

      tabsContainer.appendChild(kaporAiTabButton);
    }
  },

  createKaporAiTabButton: function() {
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
  },

  addKaporAiTabClickListener: function(kaporAiTabButton, kaporAiUrl, otherTabButtons) {
    var self = this;
    kaporAiTabButton.addEventListener('click', function() {
      const profileContentTabs = document.querySelector('.profile-content-tabs');
      if (profileContentTabs) {
        self.removeKaporAiContent();
        self.hideOtherContent(profileContentTabs);
        self.addKaporAiContent(profileContentTabs, kaporAiUrl);
        self.setActiveTab(kaporAiTabButton, otherTabButtons);
      }
    });
  },

  addOtherTabsClickListeners: function(otherTabButtons, kaporAiTabButton) {
    var self = this;
    otherTabButtons.forEach(function(button) {
      button.addEventListener('click', function() {
        self.removeKaporAiContent();
        this.setAttribute('data-state', 'active');
        kaporAiTabButton.removeAttribute('data-state');
      });
    });
  },

  removeKaporAiContent: function() {
    const kaporAiTab = document.querySelector('.kapor-ai-tab');
    if (kaporAiTab) {
      kaporAiTab.remove();
      const siblingContent = document.querySelector('.profile-content-tabs > :not(.kapor-ai-tab)');
      if (siblingContent) {
        siblingContent.style.display = '';
      }
    }
  },

  hideOtherContent: function(profileContentTabs) {
    const siblingContent = profileContentTabs.firstElementChild;
    if (siblingContent) {
      siblingContent.style.display = 'none';
    }
  },

  addKaporAiContent: function(profileContentTabs, kaporAiUrl) {
    const kaporAiTabContent = document.createElement('div');
    kaporAiTabContent.className = 'kapor-ai-tab';

    const iframe = document.createElement('iframe');
    const proxyUrl = chrome.runtime.getURL('templates/proxy.html');
    iframe.src = proxyUrl;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';

    iframe.onload = function() {
        iframe.contentWindow.postMessage({
            type: 'loadUrl',
            url: kaporAiUrl
        }, '*');
    };

    kaporAiTabContent.appendChild(iframe);
    profileContentTabs.appendChild(kaporAiTabContent);
  },

  setActiveTab: function(activeButton, inactiveButtons) {
    activeButton.setAttribute('data-state', 'active');
    inactiveButtons.forEach(function(button) {
      button.removeAttribute('data-state');
    });
  },

  initializeModal: function() {
    if (!document.getElementById('kapor-modal')) {
      const modalHTML = `
        <div id="kapor-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
             background: rgba(0,0,0,0.5); z-index: 10000;">
          <div style="position: relative; width: 80%; max-width: 600px; margin: 100px auto; 
               background: white; padding: 20px; border-radius: 8px;">
            <button id="kapor-modal-close" style="position: absolute; right: 10px; top: 10px;">×</button>
            <iframe id="kapor-modal-iframe" style="width: 100%; height: 600px; border: none;"></iframe>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHTML);
      
      // Add close button event listener
      document.getElementById('kapor-modal-close').addEventListener('click', () => {
        this.closePassModal();
      });

      // Add message listener for clipboard operations
      window.addEventListener('message', function(event) {
        console.log('Received message:', event.data);
        if (event.data.type === 'copy-to-clipboard') {
          navigator.clipboard.writeText(event.data.data)
            .then(() => {
              console.log('Text successfully copied to clipboard');
            })
            .catch(err => {
              console.error('Failed to copy text: ', err);
            });
        }
      });
    }
  },

  showPassModal: function(companyInfo) {
    const modal = document.getElementById('kapor-modal');
    if (!modal) {
      this.initializeModal();
    }
    
    // Remove existing iframe
    const oldIframe = document.getElementById('kapor-modal-iframe');
    if (oldIframe) {
      oldIframe.remove();
    }
    
    // Create and append new iframe
    const modalContent = modal.querySelector('div');
    const newIframe = document.createElement('iframe');
    newIframe.id = 'kapor-modal-iframe';
    newIframe.style.width = '100%';
    newIframe.style.height = '600px';
    newIframe.style.border = 'none';
    
    if (companyInfo) {
      const CONFIG = window.KaporAIExt.CONFIG;
      const url = `${CONFIG.KAPOR_AI_BASE_URL}/reply?company_name=${encodeURIComponent(companyInfo.companyName || '')}&company_website=${encodeURIComponent(companyInfo.website || '')}&hide_header=true&hide_footer=true&source=chrome`;
      newIframe.src = url;
    }
    
    modalContent.appendChild(newIframe);
    modal.style.display = 'block';
  },

  closePassModal: function() {
    const modal = document.getElementById('kapor-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }
};

window.KaporAIExt.ui.initializeModal();
