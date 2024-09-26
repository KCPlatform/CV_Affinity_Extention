let CONFIG = {};

function loadKaporAI(url) {
    const iframe = document.getElementById('kapor-iframe');
    if (iframe) {
        if (iframe.src !== url) {
            iframe.src = url;
            iframe.onload = function() {
                console.log("Kapor AI iframe loaded successfully", url);
            };
            iframe.onerror = function() {
                console.error("Kapor AI iframe failed to load", url);
            };
        } else {
            console.log("Kapor AI iframe already loaded with URL", url);
        }
    } else {
        console.error("Kapor AI iframe not found", url);
    }
}


window.addEventListener('message', function(event) {
    
    console.log('Received message:', event.data);

    if ( event.data && event.data.type === 'loadUrl' ) {

        if ( event.data.url == null ) {
            
            if (event.data.config) {
                loadKaporAI(`${event.data.config.KAPOR_AI_BASE_URL}/search?hide_header=true&source=chrome`);
            }

        } else {

            loadKaporAI(event.data.url);

        }

    }
});