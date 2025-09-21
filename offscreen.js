// Offscreen document for handling blob downloads in Manifest V3
// This runs in a DOM context where URL.createObjectURL is available

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'createDownloadUrl') {
        try {
            // Create blob from the content
            const blob = new Blob([message.content], { type: message.mimeType });
            
            // Create object URL (this works in offscreen document)
            const url = URL.createObjectURL(blob);
            
            sendResponse({ success: true, url: url });
            
            // Clean up the URL after a delay to prevent memory leaks
            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 60000); // 1 minute should be enough for download to start
            
        } catch (error) {
            console.error('Error creating download URL:', error);
            sendResponse({ success: false, error: error.message });
        }
    }
    
    return true; // Keep message channel open for async response
});
