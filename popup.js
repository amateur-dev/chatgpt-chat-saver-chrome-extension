/**
 * Popup Script for AI Chat Saver
 * Handles user interactions in the extension popup
 * v3.0.0 - Added multi-tab support and selection modes
 */

document.addEventListener('DOMContentLoaded', async function () {
    const saveButton = document.getElementById('saveAsPDF');
    const saveAllButton = document.getElementById('saveAllTabs');
    const openButton = document.getElementById('openChatGPT');
    const formatSelector = document.getElementById('formatSelector');
    const selectionMode = document.getElementById('selectionMode');
    const lastNInput = document.getElementById('lastNInput');
    const tabSelectorContainer = document.getElementById('tabSelectorContainer');
    const tabSelector = document.getElementById('tabSelector');
    const tabCount = document.getElementById('tabCount');

    // Track all chat tabs
    let chatTabs = [];

    // Initialize: discover all chat tabs
    await discoverChatTabs();

    // Selection mode toggle
    if (selectionMode) {
        selectionMode.addEventListener('change', function () {
            if (this.value === 'lastN') {
                lastNInput.classList.remove('hidden');
            } else {
                lastNInput.classList.add('hidden');
            }
        });
    }

    /**
     * Discover all open ChatGPT/Gemini tabs
     */
    async function discoverChatTabs() {
        try {
            const tabs = await chrome.tabs.query({
                url: [
                    'https://chat.openai.com/*',
                    'https://chatgpt.com/*',
                    'https://gemini.google.com/*'
                ]
            });

            chatTabs = tabs;

            if (tabs.length > 1) {
                // Show multi-tab UI
                tabSelectorContainer.classList.remove('hidden');
                saveAllButton.classList.remove('hidden');

                // Populate tab selector
                tabSelector.innerHTML = '';
                tabs.forEach((tab, index) => {
                    const option = document.createElement('option');
                    option.value = tab.id;
                    const platform = tab.url.includes('gemini') ? '🔷' : '🟢';
                    const title = tab.title.substring(0, 40) + (tab.title.length > 40 ? '...' : '');
                    option.textContent = `${platform} ${title}`;
                    if (tab.active) option.selected = true;
                    tabSelector.appendChild(option);
                });

                tabCount.textContent = `${tabs.length} chat tabs open`;
            }
        } catch (error) {
            console.error('Error discovering tabs:', error);
        }
    }

    /**
     * Get save options from UI
     */
    function getSaveOptions() {
        return {
            format: formatSelector ? formatSelector.value : 'txt',
            selectionMode: selectionMode ? selectionMode.value : 'full',
            lastN: lastNInput ? parseInt(lastNInput.value, 10) || 10 : 10
        };
    }

    /**
     * Save chat from a specific tab
     */
    async function saveChatFromTab(tabId, options) {
        return new Promise((resolve, reject) => {
            const message = {
                action: 'generateText',
                format: options.format,
                selectionMode: options.selectionMode,
                lastN: options.lastN
            };

            chrome.tabs.sendMessage(tabId, message, function (response) {
                if (chrome.runtime.lastError) {
                    // Try to inject script first
                    chrome.scripting.executeScript({
                        target: { tabId: tabId },
                        files: ['content.js']
                    }, () => {
                        if (chrome.runtime.lastError) {
                            reject(new Error('Could not connect to tab'));
                            return;
                        }

                        setTimeout(() => {
                            chrome.tabs.sendMessage(tabId, message, function (retryResponse) {
                                if (chrome.runtime.lastError) {
                                    reject(new Error('Connection failed after injection'));
                                } else if (retryResponse && retryResponse.success) {
                                    resolve(retryResponse);
                                } else {
                                    reject(new Error(retryResponse?.error || 'Unknown error'));
                                }
                            });
                        }, 100);
                    });
                } else if (response && response.success) {
                    resolve(response);
                } else {
                    reject(new Error(response?.error || 'Unknown error'));
                }
            });
        });
    }

    // Save single chat button
    if (saveButton) {
        saveButton.addEventListener('click', async function () {
            saveButton.disabled = true;
            const originalText = saveButton.textContent;
            saveButton.textContent = '⏳ Saving...';

            const options = getSaveOptions();

            try {
                // Determine which tab to save from
                let targetTabId;

                if (chatTabs.length > 1 && tabSelector.value) {
                    targetTabId = parseInt(tabSelector.value, 10);
                } else {
                    // Get active tab
                    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
                    const tab = tabs[0];

                    if (!tab.url || (!tab.url.includes('chatgpt.com') && !tab.url.includes('chat.openai.com') && !tab.url.includes('gemini.google.com'))) {
                        alert('Please visit ChatGPT or Gemini first and open a conversation.');
                        saveButton.disabled = false;
                        saveButton.textContent = originalText;
                        return;
                    }

                    targetTabId = tab.id;
                }

                await saveChatFromTab(targetTabId, options);
                saveButton.textContent = '✅ Saved!';
                setTimeout(() => window.close(), 500);

            } catch (error) {
                saveButton.textContent = originalText;
                alert(error.message || 'Failed to save. Please reload the page and try again.');
            } finally {
                saveButton.disabled = false;
                setTimeout(() => {
                    saveButton.textContent = originalText;
                }, 2000);
            }
        });
    }

    // Save all tabs button
    if (saveAllButton) {
        saveAllButton.addEventListener('click', async function () {
            if (chatTabs.length === 0) {
                alert('No chat tabs found.');
                return;
            }

            saveAllButton.disabled = true;
            const originalText = saveAllButton.textContent;
            const options = getSaveOptions();

            let saved = 0;
            let failed = 0;

            for (let i = 0; i < chatTabs.length; i++) {
                saveAllButton.textContent = `⏳ Saving ${i + 1}/${chatTabs.length}...`;

                try {
                    await saveChatFromTab(chatTabs[i].id, options);
                    saved++;
                    // Small delay between saves to avoid overwhelming
                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch (error) {
                    console.error(`Failed to save tab ${chatTabs[i].id}:`, error);
                    failed++;
                }
            }

            saveAllButton.disabled = false;

            if (failed === 0) {
                saveAllButton.textContent = `✅ Saved ${saved} chats!`;
            } else {
                saveAllButton.textContent = `⚠️ Saved ${saved}, failed ${failed}`;
            }

            setTimeout(() => {
                saveAllButton.textContent = originalText;
            }, 3000);
        });
    }

    // Open chat app button
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
