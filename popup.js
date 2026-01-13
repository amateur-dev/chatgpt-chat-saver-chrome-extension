/**
 * Popup Script for ChatGPT Chat Saver
 * Handles user interactions in the extension popup
 */

document.addEventListener('DOMContentLoaded', function () {
    const saveButton = document.getElementById('saveAsPDF');
    const openButton = document.getElementById('openChatGPT');
    const formatSelector = document.getElementById('formatSelector');

    if (saveButton) {
        saveButton.addEventListener('click', async function () {
            saveButton.disabled = true;
            const originalText = saveButton.textContent;
            saveButton.textContent = '⏳ Saving...';

            // Get selected format
            const format = formatSelector ? formatSelector.value : 'txt';

            try {
                // Get the active tab
                const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
                const tab = tabs[0];

                // Check if we're on ChatGPT or Gemini
                if (!tab.url || (!tab.url.includes('chatgpt.com') && !tab.url.includes('chat.openai.com') && !tab.url.includes('gemini.google.com'))) {
                    alert('Please visit ChatGPT or Gemini first and open a conversation.');
                    saveButton.disabled = false;
                    saveButton.textContent = originalText;
                    return;
                }

                // Helper to handle response
                const handleResponse = (response) => {
                    saveButton.disabled = false;
                    saveButton.textContent = originalText;

                    if (response && response.success) {
                        setTimeout(() => window.close(), 500);
                    } else {
                        const errorMsg = response && response.error ? response.error : 'Failed to save conversation. Please ensure you have an active conversation and try again.';
                        alert(errorMsg);
                    }
                };

                // Send message to content script to generate file with selected format
                chrome.tabs.sendMessage(tab.id, { action: 'generateText', format: format }, function (response) {
                    if (chrome.runtime.lastError) {
                        console.log('Connection failed, attempting to inject content script...');

                        // Try to inject the script dynamically
                        chrome.scripting.executeScript({
                            target: { tabId: tab.id },
                            files: ['content.js']
                        }, () => {
                            if (chrome.runtime.lastError) {
                                console.error('Injection failed:', chrome.runtime.lastError);
                                alert('Connection failed. Please reload the page and try again.');
                                saveButton.disabled = false;
                                saveButton.textContent = originalText;
                                return;
                            }

                            // Retry sending message after injection
                            setTimeout(() => {
                                chrome.tabs.sendMessage(tab.id, { action: 'generateText', format: format }, function (retryResponse) {
                                    if (chrome.runtime.lastError) {
                                        alert('Connection failed even after injection. Please reload the page.');
                                        saveButton.disabled = false;
                                        saveButton.textContent = originalText;
                                    } else {
                                        handleResponse(retryResponse);
                                    }
                                });
                            }, 100);
                        });
                    } else {
                        handleResponse(response);
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
        openButton.addEventListener('click', function () {
            chrome.tabs.query({ url: ['https://chat.openai.com/*', 'https://chatgpt.com/*', 'https://gemini.google.com/*'] }, function (tabs) {
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
