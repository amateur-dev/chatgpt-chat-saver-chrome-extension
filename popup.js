/**
 * Popup Script for ChatGPT PDF Saver
 * Handles user interactions in the extension popup
 */

document.addEventListener('DOMContentLoaded', function() {
    const openChatGPTButton = document.getElementById('openChatGPT');
    const savePDFButton = document.getElementById('savePDF');
    
    if (savePDFButton) {
        savePDFButton.addEventListener('click', function() {
            savePDFButton.disabled = true;
            savePDFButton.textContent = 'Generating PDF...';
            
            // Get the active tab
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                const tab = tabs[0];
                
                // Check if we're on ChatGPT
                if (!tab.url || (!tab.url.includes('chatgpt.com') && !tab.url.includes('chat.openai.com'))) {
                    alert('Please visit ChatGPT and open a conversation first.');
                    savePDFButton.disabled = false;
                    savePDFButton.textContent = 'Save as PDF';
                    return;
                }
                
                // Send message to content script to generate PDF
                chrome.tabs.sendMessage(tab.id, { action: 'generatePDF' }, function(response) {
                    savePDFButton.disabled = false;
                    savePDFButton.textContent = 'Save as PDF';
                    
                    if (response && response.success) {
                        // Close popup after successful generation
                        setTimeout(() => window.close(), 500);
                    } else {
                        const errorMsg = response && response.error ? response.error : 'Failed to generate PDF. Please ensure you have an active conversation.';
                        alert(errorMsg);
                    }
                });
            });
        });
    }
    
    if (openChatGPTButton) {
        openChatGPTButton.addEventListener('click', function() {
            chrome.tabs.query({ url: ['https://chat.openai.com/*', 'https://chatgpt.com/*'] }, function(tabs) {
                if (tabs.length > 0) {
                    chrome.tabs.update(tabs[0].id, { active: true });
                    chrome.windows.update(tabs[0].windowId, { focused: true });
                } else {
                    chrome.tabs.create({ url: 'https://chatgpt.com/' });
                }
                window.close();
            });
        });
    }
});
