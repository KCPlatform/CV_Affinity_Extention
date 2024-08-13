console.log("PROXY.JS LOADED");

function loadKaporAI(url) {
    console.log("Loading Kapor AI URL:", url);
    const iframe = document.getElementById('kapor-iframe');
    if (iframe) {
        iframe.src = url;
        iframe.onload = function() {
            console.log("Kapor AI iframe loaded successfully");
        };
        iframe.onerror = function() {
            console.error("Kapor AI iframe failed to load");
        };
    } else {
        console.error("Kapor AI iframe not found");
    }
}

// Initial load
loadKaporAI('https://develop.kapor.ai');

// Add a message listener to handle URL changes from the parent
window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'loadUrl') {
        loadKaporAI(event.data.url);
    }
});