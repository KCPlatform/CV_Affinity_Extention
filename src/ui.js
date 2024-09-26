// ui.js
window.MyExtension = window.MyExtension || {};

window.MyExtension.ui = {
  loadHtmlTemplate: function() {
    var self = this;
    fetch(chrome.runtime.getURL('templates/panel.html'))
      .then(function(response) { return response.text(); })
      .then(function(data) {
        let container = document.getElementById('kci');
        if (!container) {
          container = document.createElement("div");
          container.classList.add("kci");
          container.id = "kci";
          document.body.appendChild(container);
        }
        container.innerHTML = data;

        self.kciRunAfterPanelLoad();
        self.loadProxyIntoIframe();
        // No need to call runMain() here if it's already called elsewhere
      })
      .catch(function(error) {
        console.error("There was an error:", error);
      });
  },

  loadProxyIntoIframe: function(service = 'chrome') {
    const constants = window.MyExtension.constants;

    const iframe = document.getElementById('kci__iframe');
    if (iframe) {
      const proxyUrl = chrome.runtime.getURL('templates/proxy.html');
      console.log('Loading proxy URL into iframe:', proxyUrl);

      iframe.src = proxyUrl;
      iframe.style.width = '100%';
      iframe.style.height = '100%';

      iframe.onload = function() {
        console.log('Proxy iframe loaded successfully');
        constants.iframeWasLoaded = true;
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
  },

  kciRunAfterPanelLoad: function() {
    this.kciHotKeys();
    this.kciMainButtons();
    window.MyExtension.utils.adjustKciViewPosition();
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
      console.error('kci__chat element not found');
    }
  },

  kciMainButtons: function() {
    var self = this;
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
      console.error("Element with ID 'kci__btn--close' not found");
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
      window.MyExtension.utils.adjustKciViewPosition();
      this.updateIframeIfVisible();
    } else {
      console.error('kci__view element not found');
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
      console.error('kci__view element not found');
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
      console.error('kci__view or kci__btn--full-screen element not found');
    }
  },

  updateIframeIfVisible: function(url = null) {
    const constants = window.MyExtension.constants;
    const CONFIG = window.MyExtension.CONFIG;

    const kciView = document.getElementById('kci__view');
    const iframe = document.getElementById('kci__iframe');

    if (!kciView || kciView.style.display === 'none' || !iframe || !iframe.contentWindow) {
      return;
    }

    if (url) {
      console.log('Updating iframe with new URL:', url);
      iframe.contentWindow.postMessage({
        type: 'loadUrl',
        url: url
      }, '*');
    } else if (constants.lastKaporAiUrl) {
      console.log('Updating iframe with last URL:', constants.lastKaporAiUrl);
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
    iframe.src = kaporAiUrl;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';

    kaporAiTabContent.appendChild(iframe);
    profileContentTabs.appendChild(kaporAiTabContent);
  },

  setActiveTab: function(activeButton, inactiveButtons) {
    activeButton.setAttribute('data-state', 'active');
    inactiveButtons.forEach(function(button) {
      button.removeAttribute('data-state');
    });
  },
};
