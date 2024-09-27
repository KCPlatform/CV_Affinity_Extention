function loadKaporAI(url) {
    const iframe = document.getElementById('kapor-iframe');
    if (iframe) {
        if (iframe.src !== url) {
            iframe.src = url;
        } else {
            console.log("Kapor AI iframe already loaded with URL", url);
        }
    } else {
        console.log("Kapor AI iframe not found", url);
    }
}


window.addEventListener('message', function(event) {
    
    if ( event.data && event.data.type === 'loadUrl' ) {

        if ( event.data.url ) {
            
            loadKaporAI(event.data.url);

        } 

    }

});