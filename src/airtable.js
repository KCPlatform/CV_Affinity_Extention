window.KaporAIExt = window.KaporAIExt || {};

window.KaporAIExt.airtable = {
    handleGridViewChange: function() {
        const companyInfo = this.getAirtableCompanyInfo();
        if (companyInfo) {
          window.KaporAIExt.process.buildKaporAiUrl(companyInfo.companyName, companyInfo.website, 'airtable');
        }
      },
      handleDetailViewChange: function() {
        const companyInfo = this.getAirtableCompanyInfo();
        if (companyInfo) {
            window.KaporAIExt.process.buildKaporAiUrl(companyInfo.companyName, companyInfo.website, 'airtable');
        }
      },
      initializeAirtableObserver: function() {
        const targetNode = document.body;
        const config = { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] };

        const callback = function(mutationsList, observer) {
            for(let mutation of mutationsList) {
                if (mutation.type === 'childList' || 
                    (mutation.type === 'attributes' && mutation.attributeName === 'class')) {
                    const gridView = document.querySelector('.gridView');
                    const detailViewDialog = document.querySelector('[data-tutorial-selector-id="detailViewDialog"]');
                    
                    if (gridView) {
                        const cursorCell = gridView.querySelector('.cursorCell');
                        if (cursorCell) {
                            window.KaporAIExt.airtable.handleGridViewChange();
                        }
                    } else if (detailViewDialog) {
                        // Handle detail view changes
                        window.KaporAIExt.airtable.handleDetailViewChange();
                    }
                }
            }
        };

        const observer = new MutationObserver(callback);
        observer.observe(targetNode, config);

        // Add click event listeners for both grid and detail views
        document.addEventListener('click', (event) => {
            const gridView = document.querySelector('.gridView');
            const detailViewDialog = document.querySelector('[data-tutorial-selector-id="detailViewDialog"]');
            
            if (gridView && gridView.contains(event.target)) {
                setTimeout(() => {
                    window.KaporAIExt.airtable.handleGridViewChange();
                }, 300); // Small delay to ensure the DOM has updated
            } else if (detailViewDialog && detailViewDialog.contains(event.target)) {
                setTimeout(() => {
                    window.KaporAIExt.airtable.handleDetailViewChange();
                }, 300); // Small delay to ensure the DOM has updated
            }
        });
      },
      getAirtableCompanyInfo: function() {

        const detailView = document.querySelector('.detailView');

        if (detailView) {
            return this.getDetailViewCompanyInfo(detailView);
        }

        let nameIndex = -1, websiteIndex = -1, emailIndex = -1;

        // Find the column indices
        const headers = document.querySelectorAll('.headerRow .cell.header');
        headers.forEach((header, index) => {
            const nameDesc = header.querySelector('.nameAndDescription');
            if (nameDesc) {
                const headerText = nameDesc.textContent.toLowerCase().trim();
                if (headerText.includes('company name') || headerText === 'company') {
                    nameIndex = index;
                } else if (headerText.includes('company website') || headerText.includes('website')) {
                    websiteIndex = index;
                } else if ( headerText.includes('email') || headerText.includes('e-mail')) {
                    emailIndex = index;
                }
            }
        });

        // Find the selected row (cursorCell)
        const selectedRow = document.querySelector('.dataRow.cursorCell');
        if (selectedRow && nameIndex !== -1 && websiteIndex !== -1) {
            const rowIndex = selectedRow.querySelector('.cell').getAttribute('data-rowindex');
            const nameElement = document.querySelector(`[data-columnindex="${nameIndex}"][data-rowindex="${rowIndex}"]`);
            const websiteElement = document.querySelector(`[data-columnindex="${websiteIndex}"][data-rowindex="${rowIndex}"]`);
            const emailElement = document.querySelector(`[data-columnindex="${emailIndex}"][data-rowindex="${rowIndex}"]`);

            if (nameElement && websiteElement) {
                const companyName = nameElement.textContent ? nameElement.textContent.trim() : null;
                const website = websiteElement.textContent ? websiteElement.textContent.trim() : null;
                if (companyName && website) {
                    return {
                        companyName: companyName,
                        website: website,
                    };
                }
                if (website) {
                    return {
                        companyName: website,
                        website: website,
                    };
                }
                if (emailElement) {
                    const email = emailElement.textContent ? emailElement.textContent.trim() : null;                    
                    let splitEmail = email.split('@');
                    return {
                        companyName: splitEmail[1],
                        website: splitEmail[1],
                    };
                }
            }
        }

        return null;
    },
    getDetailViewCompanyInfo: function(detailView) {
        let companyName = null;
        let website = null;
        let email = null;
    
        // Find the company name, website, and email fields
        const labelCellPairs = detailView.querySelectorAll('.labelCellPair');
        labelCellPairs.forEach(pair => {
            const label = pair.querySelector('.fieldLabel');
            if (label) {
                const labelText = label.textContent.toLowerCase().trim();
                const cellContainer = pair.querySelector('.cellContainer');
                if (labelText.includes('company name') || labelText === 'company') {
                    companyName = cellContainer.textContent.trim();
                } else if (labelText.includes('company website') || labelText.includes('website')) {
                    website = cellContainer.textContent.trim();
                } else if (labelText.includes('email') || labelText.includes('e-mail')) {
                    email = cellContainer.textContent.trim();
                }
            }
        });
    
        if (companyName && website) {
            return { companyName, website };
        }
        if (website) {
            return { companyName: website, website };
        }
        if (email) {
            let splitEmail = email.split('@');
            return {
                companyName: splitEmail[1],
                website: splitEmail[1],
            };
        }
    
        return null;
    }
};