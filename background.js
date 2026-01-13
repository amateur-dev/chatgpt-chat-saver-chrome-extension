/**
 * Background Script for AI Chat Saver
 * Handles keyboard shortcuts and background tasks
 */

// Listen for keyboard commands
chrome.commands.onCommand.addListener(async (command) => {
    if (command === 'quick-save') {
        console.log('Background: Quick save triggered');

        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            const tab = tabs[0];

            if (!tab) return;

            // Check URL
            if (!tab.url || (!tab.url.includes('chatgpt.com') && !tab.url.includes('chat.openai.com') && !tab.url.includes('gemini.google.com'))) {
                console.log('Background: Not a chat tab, ignoring shortcut');
                return;
            }

            // Send message to content script
            chrome.tabs.sendMessage(tab.id, {
                action: 'generateText',
                format: 'txt',        // Default to TXT for quick save
                selectionMode: 'full' // Default to full conversation
            }, (response) => {
                if (chrome.runtime.lastError) {
                    // If connection failed, it might be because script isn't injected
                    console.log('Background: Connection failed, trying to inject script');
                    chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        files: ['content.js']
                    }, () => {
                        // Retry
                        setTimeout(() => {
                            chrome.tabs.sendMessage(tab.id, {
                                action: 'generateText',
                                format: 'txt',
                                selectionMode: 'full'
                            });
                        }, 100);
                    });
                }
            });

        } catch (error) {
            console.error('Background: Error in quick save', error);
        }
    }
});
