/**
 * Popup Script for ChatGPT Chat Saver
 * Handles user interactions in the extension popup
 */

document.addEventListener('DOMContentLoaded', function() {
    const saveButton = document.getElementById('saveAsPDF');
    const openButton = document.getElementById('openChatGPT');
    
    if (saveButton) {
        saveButton.addEventListener('click', async function() {
            saveButton.disabled = true;
            const originalText = saveButton.textContent;
            saveButton.textContent = '⏳ Saving...';
            
            try {
                // Get the active tab
                const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
                const tab = tabs[0];
                
                // Check if we're on ChatGPT
                if (!tab.url || (!tab.url.includes('chatgpt.com') && !tab.url.includes('chat.openai.com'))) {
                    alert('Please visit ChatGPT first and open a conversation.');
                    saveButton.disabled = false;
                    saveButton.textContent = originalText;
                    return;
                }
                
                // Send message to content script to generate text file
                chrome.tabs.sendMessage(tab.id, { action: 'generateText' }, function(response) {
                    saveButton.disabled = false;
                    saveButton.textContent = originalText;
                    
                    if (chrome.runtime.lastError) {
                        console.log('Message sent (content script will handle)');
                        // Close popup - the content script will handle the download
                        setTimeout(() => window.close(), 500);
                    } else if (response && response.success) {
                        // Close popup after successful generation
                        setTimeout(() => window.close(), 500);
                    } else {
                        const errorMsg = response && response.error ? response.error : 'Failed to save conversation. Please ensure you have an active conversation and try again.';
                        alert(errorMsg);
                    }
                });
            } catch (error) {
                saveButton.disabled = false;
                saveButton.textContent = originalText;
                alert('Error: ' + error.message);
            }
        });
    }
    
    if (openButton) {
        openButton.addEventListener('click', function() {
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
