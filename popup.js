/**
 * Popup Script for ChatGPT PDF Saver
 * Handles user interactions in the extension popup
 */

document.addEventListener('DOMContentLoaded', function() {
    const openChatGPTButton = document.getElementById('openChatGPT');
    
    if (openChatGPTButton) {
        openChatGPTButton.addEventListener('click', function() {
            // Try to find an existing ChatGPT tab first
            chrome.tabs.query({ url: ['https://chat.openai.com/*', 'https://chatgpt.com/*'] }, function(tabs) {
                if (tabs.length > 0) {
                    // If a ChatGPT tab exists, switch to it
                    chrome.tabs.update(tabs[0].id, { active: true });
                    chrome.windows.update(tabs[0].windowId, { focused: true });
                } else {
                    // Otherwise, open a new ChatGPT tab
                    chrome.tabs.create({ url: 'https://chatgpt.com/' });
                }
                // Close the popup
                window.close();
            });
        });
    }
});
