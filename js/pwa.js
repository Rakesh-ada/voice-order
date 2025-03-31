// Register Service Worker for PWA functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('/service-worker.js');
            console.log('ServiceWorker registration successful with scope:', registration.scope);
        } catch (error) {
            console.error('ServiceWorker registration failed:', error);
        }
    });
}

// PWA Install prompt handling
let deferredPrompt;
const installButton = document.getElementById('installApp');

// Initially hide the install button
installButton.style.display = 'none';

// Listen for the beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    
    // Show the install button
    installButton.style.display = 'block';
});

// Install button click handler
installButton.addEventListener('click', async () => {
    if (!deferredPrompt) {
        return;
    }
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    // We've used the prompt, and can't use it again, throw it away
    deferredPrompt = null;
    
    // Hide the install button
    installButton.style.display = 'none';
});

// Listen for the appinstalled event
window.addEventListener('appinstalled', (event) => {
    console.log('App was installed');
    // Hide install button after successful installation
    installButton.style.display = 'none';
}); 