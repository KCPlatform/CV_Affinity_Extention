// process.js
window.KaporAIExt = window.KaporAIExt || {};

window.KaporAIExt.process = {
  processAndAppendCompanyLink: function(service) {
    const affinity = window.KaporAIExt.affinity;
    const googleSheets = window.KaporAIExt.googleSheets;
    const airtable = window.KaporAIExt.airtable;
    const constants = window.KaporAIExt.constants;
    const ui = window.KaporAIExt.ui;

    const processCompanyInfo = (info, service) => {
        if (info) {
          this.buildKaporAiUrl(info.companyName, info.website, service);
        }
    };

    if (service === 'googlesheets') {

      let nameBox = document.querySelector('input#t-name-box');
      if (nameBox) {
        let nameBoxValue = nameBox.value;
        let selectedDataRow = parseInt(nameBoxValue.replace(/^[A-Za-z]+/, ''), 10) - 1;

        // Don't run on initial load, wait for click
        if (constants.isDataLoaded && selectedDataRow !== -1) {
          this.processAndHandleEntry(selectedDataRow)
            .then(companyInfo => {
              if (companyInfo) {
                this.buildKaporAiUrl(companyInfo.company, companyInfo.website, 'googlesheets');
              } else {
                console.log('No company info available');
              }
            })
            .catch(error => {
              console.log('Error getting company info:', error);
            });
        }
      }
    } else if (service === 'affinity') {
      
  
        const retryGetCompanyInfo = (attemptCount = 0) => {
          let companyInfo = affinity.getAffinityCompanyInfo();
          
          if (companyInfo) {
            processCompanyInfo(companyInfo, 'affinity');
          } else if (attemptCount < 4) { 
            setTimeout(() => retryGetCompanyInfo(attemptCount + 1), 300);
          } 
        };
  
        retryGetCompanyInfo();

    } else if (service === 'airtable') {

        let companyInfo = airtable.getAirtableCompanyInfo();

        if (companyInfo) {
          processCompanyInfo(companyInfo, service);
        }
      
    }
  },

  processAndHandleEntry: function(selectedDataRow) {
    const utils = window.KaporAIExt.utils;
    const cache = window.KaporAIExt.cache;
    const constants = window.KaporAIExt.constants;

    return new Promise((resolve, reject) => {
      if (!utils.hasUrlChanged()) {
        this.processSelectedRow(selectedDataRow)
          .then(entry => {
            if (entry) {
              resolve(entry);
            } else {
              console.log('No valid entry found');
              resolve(null);
            }
          })
          .catch(error => {
            console.log('Error processing selected row:', error);
            reject(error);
          });
      } else {
        cache.clearCache('all');
        resolve(null);
      }
    });
  },

  processSelectedRow: function(selectedDataRow) {
    const cache = window.KaporAIExt.cache;

    return new Promise((resolve, reject) => {
      if (selectedDataRow == null || isNaN(selectedDataRow)) {
        resolve(null);
        return;
      }

      cache.getCachedOrFetchedData()
        .then(sheetsData => {
          if (!sheetsData || sheetsData.length <= selectedDataRow) {
            cache.clearCache('all');
            return cache.getCachedOrFetchedData();
          }
          return sheetsData;
        })
        .then(sheetsData => {
          if (!sheetsData || sheetsData.length <= selectedDataRow) {
            resolve(null);
          } else {
            resolve(this.extractEntryFromRow(sheetsData, selectedDataRow));
          }
        })
        .catch(reject);
    });
  },

  extractEntryFromRow: function(sheetsData, rowIndex) {
    const headers = sheetsData[0];
    const selectedRowData = sheetsData[rowIndex];

    const relevantColumns = {
      company: headers.findIndex(header => {
        const lowerHeader = header.toLowerCase().trim();
        return lowerHeader.includes('company name') || lowerHeader.includes('organization') || lowerHeader === 'company';
      }),
      website: headers.findIndex(header => {
        const lowerHeader = header.toLowerCase().trim();
        return lowerHeader.includes('website') || lowerHeader.includes('url') || lowerHeader.includes('web address');
      }),
      email: headers.findIndex(header => {
        const lowerHeader = header.toLowerCase().trim();
        return lowerHeader.includes('email') || lowerHeader.includes('email address') || lowerHeader.includes('e-mail');
      }),
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

    if (!entry.company && !entry.website && entry.email) {
      // Extract domain from email
      let emailParts = entry.email.split('@');
      if (emailParts.length > 1) {
        entry.company = emailParts[1];
        entry.website = emailParts[1];
      }
    }

    if (!entry.company && !entry.website) {
      console.log('No company, website, or email found');
      return null;
    }

    return entry;
  },

  buildKaporAiUrl: function(company, website, service = 'chrome') {
    const constants = window.KaporAIExt.constants;
    const ui = window.KaporAIExt.ui;
    const CONFIG = window.KaporAIExt.CONFIG;

    if (company && website) {

      const kaporAiUrl = `${CONFIG.KAPOR_AI_BASE_URL}/company-report?company_website=${encodeURIComponent(website)}&company_name=${encodeURIComponent(company)}&source=${service}&hide_header=true`;
      constants.lastKaporAiUrl = kaporAiUrl;

      if (service === 'affinity') {
        ui.addKaporAiTab(kaporAiUrl);
      }

      ui.updateIframeIfVisible(kaporAiUrl);

    } else {
      console.log('Company information not found');
    }
  },
};
