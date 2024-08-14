let CONFIG = {};

function loadKaporAI(url) {
    const iframe = document.getElementById('kapor-iframe');
    console.log("Loading Kapor AI URL:", url);
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

// Add a message listener to handle URL changes and config from the parent
window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'config') {
        CONFIG = event.data.config;
        console.log("Received config:", CONFIG);
        // Initial load after receiving config
        loadKaporAI(`${CONFIG.KAPOR_AI_BASE_URL}/search?hide_header=true&source=affinity`);
    } else if (event.data && event.data.type === 'loadUrl') {
        loadKaporAI(event.data.url);
    }
});