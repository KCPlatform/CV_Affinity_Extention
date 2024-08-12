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
      
      // Create a new anchor element
      const newLink = document.createElement('a');
      newLink.href = `https://beta.kapor.ai/company-report/?company_website=${encodeURIComponent(website)}&company_name=${encodeURIComponent(companyName)}&source=affinity`;
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