/**
 * ChatGPT Chat Saver - Content Script
 * Injects a "Save as PDF" button into ChatGPT interface
 * Captures full conversation and exports to PDF using client-side libraries
 */

(function() {
    'use strict';

    // Configuration
    const BUTTON_ID = 'chatgpt-pdf-saver-btn';
    const SAVE_BUTTON_HTML = `
        <button id="${BUTTON_ID}" class="chatgpt-pdf-save-btn" title="Save conversation as PDF">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
            Save as PDF
        </button>
    `;

    // State management
    let saveButton = null;
    let isGenerating = false;

    /**
     * Wait for libraries to be available
     */
    function waitForLibraries() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 50; // 5 seconds max
            
            function checkLibraries() {
                attempts++;
                
                console.log(`ChatGPT PDF Saver: Checking libraries (attempt ${attempts})`);
                console.log('jsPDF:', typeof window.jsPDF, window.jsPDF);
                console.log('html2canvas:', typeof window.html2canvas, window.html2canvas);
                console.log('Global jsPDF:', typeof jsPDF);
                console.log('Global html2canvas:', typeof html2canvas);
                
                // Check multiple possible locations where libraries might be
                const jsPDFAvailable = window.jsPDF || window.jspdf || (typeof jsPDF !== 'undefined' ? jsPDF : null);
                const html2canvasAvailable = window.html2canvas || (typeof html2canvas !== 'undefined' ? html2canvas : null);
                
                if (jsPDFAvailable && html2canvasAvailable) {
                    // Make sure they're globally accessible
                    window.jsPDF = jsPDFAvailable;
                    window.html2canvas = html2canvasAvailable;
                    console.log('ChatGPT PDF Saver: Libraries found and ready!');
                    resolve(true);
                } else if (attempts < maxAttempts) {
                    setTimeout(checkLibraries, 100);
                } else {
                    console.error('ChatGPT PDF Saver: Libraries not found after maximum attempts');
                    resolve(false);
                }
            }
            
            checkLibraries();
        });
    }

    /**
     * Initialize the extension
     */
    async function init() {
        console.log('ChatGPT PDF Saver: Initializing...');
        
        // Wait for libraries to be available
        const librariesReady = await waitForLibraries();
        
        if (!librariesReady) {
            console.error('ChatGPT PDF Saver: Failed to load required libraries');
        }
        
        // Setup button regardless
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupSaveButton);
        } else {
            setupSaveButton();
        }
        
        // Watch for navigation changes (SPA)
        observePageChanges();
    }

    /**
     * Set up the save button in the ChatGPT interface
     */
    function setupSaveButton() {
        // Remove existing button if present
        const existingButton = document.getElementById(BUTTON_ID);
        if (existingButton) {
            existingButton.remove();
        }

        // Create floating container
        const targetContainer = createFloatingContainer();
        injectSaveButton(targetContainer);
        console.log('ChatGPT PDF Saver: Save button injected successfully');
    }

    /**
     * Create a floating container for the save button
     */
    function createFloatingContainer() {
        // Remove existing container if present
        const existing = document.getElementById('chatgpt-pdf-saver-container');
        if (existing) {
            existing.remove();
        }

        const container = document.createElement('div');
        container.id = 'chatgpt-pdf-saver-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            background: #ffffff;
            border: 1px solid #e5e5e5;
            border-radius: 8px;
            padding: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        `;
        document.body.appendChild(container);
        return container;
    }

    /**
     * Inject the save button into the target container
     */
    function injectSaveButton(container) {
        const buttonWrapper = document.createElement('div');
        buttonWrapper.innerHTML = SAVE_BUTTON_HTML;
        saveButton = buttonWrapper.firstElementChild;
        
        // Add event listener
        saveButton.addEventListener('click', handleSaveClick);
        
        // Append to container
        container.appendChild(saveButton);
    }

    /**
     * Handle save button click
     */
    async function handleSaveClick(event) {
        event.preventDefault();
        event.stopPropagation();

        if (isGenerating) {
            return;
        }

        // Check if libraries are available
        if (typeof window.jsPDF === 'undefined' || typeof window.html2canvas === 'undefined') {
            alert('PDF libraries are not loaded. Please reload the page and try again.');
            console.error('ChatGPT PDF Saver: Libraries not available');
            return;
        }

        try {
            isGenerating = true;
            updateButtonState('Generating PDF...');
            
            await generatePDF();
            
        } catch (error) {
            console.error('ChatGPT PDF Saver: Error generating PDF:', error);
            alert('Error generating PDF. Please check the console for details.');
        } finally {
            isGenerating = false;
            updateButtonState('Save as PDF');
        }
    }

    /**
     * Update button state and text
     */
    function updateButtonState(text) {
        if (saveButton) {
            const textNode = saveButton.lastChild;
            if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                textNode.textContent = text;
            }
            saveButton.disabled = isGenerating;
        }
    }

    /**
     * Generate PDF from the current conversation
     */
    async function generatePDF() {
        console.log('ChatGPT PDF Saver: Starting PDF generation...');
        
        // Find the conversation container
        const conversationContainer = findConversationContainer();
        if (!conversationContainer) {
            throw new Error('Could not find conversation container. Make sure you have an active ChatGPT conversation.');
        }

        // Find all messages in the conversation
        const messages = findAllMessages(conversationContainer);
        if (messages.length === 0) {
            throw new Error('No conversation messages found. Start a conversation with ChatGPT first.');
        }

        console.log(`ChatGPT PDF Saver: Found ${messages.length} messages to save`);

        // Create PDF with conversation content
        await createPDFFromMessages(messages);
        
        console.log('ChatGPT PDF Saver: PDF generated successfully');
    }

    /**
     * Find the main conversation container
     */
    function findConversationContainer() {
        const selectors = [
            '[role="main"]',
            '.flex.flex-col.text-sm',
            'main',
            '.conversation-container',
            '.flex-1.overflow-hidden',
            '.w-full.h-full.overflow-auto'
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                // Verify this container actually has messages
                const hasMessages = element.querySelectorAll('[data-message-id], .group\\/conversation-turn, [role="article"]').length > 0;
                if (hasMessages) {
                    console.log('ChatGPT PDF Saver: Found conversation container with selector:', selector);
                    return element;
                }
            }
        }

        // Fallback: find by looking for message elements
        const messages = document.querySelectorAll('[data-message-id], .group\\/conversation-turn, [role="article"]');
        if (messages.length > 0) {
            console.log('ChatGPT PDF Saver: Using fallback container detection');
            return messages[0].closest('main') || messages[0].parentElement;
        }

        return null;
    }

    /**
     * Find all messages in the conversation
     */
    function findAllMessages(container) {
        const messageSelectors = [
            '[data-message-id]',
            '.group\\/conversation-turn',
            '[role="article"]',
            '.flex.w-full.flex-col.gap-1.empty\\:hidden.first\\:pt-\\[3px\\]',
            '.group.w-full.text-token-text-primary'
        ];

        let messages = [];
        
        for (const selector of messageSelectors) {
            messages = container.querySelectorAll(selector);
            if (messages.length > 0) {
                console.log(`ChatGPT PDF Saver: Found ${messages.length} messages with selector: ${selector}`);
                break;
            }
        }

        return Array.from(messages);
    }

    /**
     * Create PDF from messages
     */
    async function createPDFFromMessages(messages) {
        const { jsPDF } = window.jsPDF;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // PDF dimensions
        const pageWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const margin = 15;
        const contentWidth = pageWidth - (margin * 2);
        
        let currentY = margin;
        const lineHeight = 6;
        const fontSize = 10;
        const headerFontSize = 12;

        // Set font
        pdf.setFont('helvetica');

        // Add title
        pdf.setFontSize(headerFontSize + 2);
        pdf.setFont('helvetica', 'bold');
        pdf.text('ChatGPT Conversation', margin, currentY);
        currentY += 10;

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Generated on: ${new Date().toLocaleString()}`, margin, currentY);
        pdf.text(`URL: ${window.location.href}`, margin, currentY + 5);
        currentY += 15;

        // Process each message
        for (let i = 0; i < messages.length; i++) {
            const message = messages[i];
            const messageData = extractMessageData(message);
            
            if (!messageData.text.trim()) {
                console.log(`Skipping empty message ${i}`);
                continue;
            }

            console.log(`Processing message ${i}: ${messageData.sender} - ${messageData.text.substring(0, 50)}...`);

            // Check if we need a new page
            if (currentY > pageHeight - 40) {
                pdf.addPage();
                currentY = margin;
            }

            // Add message header with background
            pdf.setFillColor(messageData.sender === 'You' ? 240 : 250, 248, 255);
            pdf.rect(margin, currentY - 4, contentWidth, 8, 'F');
            
            pdf.setFontSize(headerFontSize);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(messageData.sender === 'You' ? 0 : 50);
            pdf.text(`${messageData.sender}:`, margin + 2, currentY + 2);
            currentY += 12;

            // Add message content
            pdf.setFontSize(fontSize);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(0);
            
            // Better text wrapping
            const textLines = pdf.splitTextToSize(messageData.text, contentWidth - 4);
            
            for (const line of textLines) {
                if (currentY > pageHeight - 20) {
                    pdf.addPage();
                    currentY = margin;
                }
                pdf.text(line, margin + 2, currentY);
                currentY += lineHeight;
            }

            currentY += 8; // Space between messages
        }

        // Save the PDF
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `chatgpt-conversation-${timestamp}.pdf`;
        
        pdf.save(filename);
    }

    /**
     * Extract text and sender information from a message element
     */
    function extractMessageData(messageElement) {
        let sender = 'Unknown';
        let text = '';

        // Better detection of message type
        const isUserMessage = 
            messageElement.hasAttribute('data-message-author-role') && 
            messageElement.getAttribute('data-message-author-role') === 'user' ||
            messageElement.querySelector('[data-message-author-role="user"]') ||
            messageElement.closest('[data-message-author-role="user"]') ||
            messageElement.classList.contains('bg-token-main-surface-secondary');

        const isAssistantMessage = 
            messageElement.hasAttribute('data-message-author-role') && 
            messageElement.getAttribute('data-message-author-role') === 'assistant' ||
            messageElement.querySelector('[data-message-author-role="assistant"]') ||
            messageElement.closest('[data-message-author-role="assistant"]');

        if (isUserMessage) {
            sender = 'You';
        } else if (isAssistantMessage) {
            sender = 'ChatGPT';
        } else {
            // Fallback detection based on content structure
            const hasUserIndicators = messageElement.textContent.includes('You said:') ||
                                    messageElement.querySelector('.bg-token-main-surface-secondary');
            sender = hasUserIndicators ? 'You' : 'ChatGPT';
        }

        // Better text extraction
        const contentSelectors = [
            '.prose.w-full.break-words',
            '[data-message-content="true"]',
            '.markdown.prose',
            '.whitespace-pre-wrap',
            '.text-base',
            '.prose',
            'p'
        ];

        let contentElement = null;
        
        // Try each selector
        for (const selector of contentSelectors) {
            const elements = messageElement.querySelectorAll(selector);
            for (const element of elements) {
                if (element && element.textContent.trim().length > 10) {
                    contentElement = element;
                    break;
                }
            }
            if (contentElement) break;
        }

        if (contentElement) {
            // Get text content while preserving some structure
            text = extractTextWithStructure(contentElement);
        } else {
            // Fallback: get all text but clean it up
            text = messageElement.textContent || messageElement.innerText || '';
            
            // Remove common UI elements and artifacts
            text = text.replace(/^(You said:|ChatGPT said:)/i, '').trim();
            text = text.replace(/Copy code/g, '').trim();
            text = text.replace(/^\d+\s*\/\s*\d+$/, '').trim(); // Remove pagination
            text = text.replace(/^(User|Assistant):\s*/i, '').trim();
        }

        // Final text cleanup
        text = text.replace(/\s+/g, ' ').trim();
        text = text.replace(/\n\s*\n/g, '\n\n'); // Normalize line breaks
        
        return { sender, text };
    }

    /**
     * Extract text while preserving some structure (paragraphs, line breaks)
     */
    function extractTextWithStructure(element) {
        let text = '';
        
        function processNode(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                const nodeText = node.textContent.trim();
                if (nodeText) {
                    text += nodeText + ' ';
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const tagName = node.tagName.toLowerCase();
                
                // Add line breaks for block elements
                if (['p', 'div', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
                    if (text && !text.endsWith('\n')) {
                        text += '\n';
                    }
                }
                
                // Process child nodes
                for (const child of node.childNodes) {
                    processNode(child);
                }
                
                // Add line breaks after block elements
                if (['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
                    if (!text.endsWith('\n')) {
                        text += '\n';
                    }
                }
            }
        }
        
        processNode(element);
        
        // Clean up excessive whitespace and line breaks
        text = text.replace(/[ \t]+/g, ' '); // Multiple spaces to single space
        text = text.replace(/\n\s+/g, '\n'); // Remove spaces at start of lines
        text = text.replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive line breaks
        
        return text.trim();
    }

    /**
     * Observe page changes for SPA navigation
     */
    function observePageChanges() {
        // Watch for URL changes and content changes
        let currentURL = location.href;
        const observer = new MutationObserver(() => {
            if (location.href !== currentURL) {
                currentURL = location.href;
                setTimeout(setupSaveButton, 1000);
            } else if (!document.getElementById(BUTTON_ID)) {
                setTimeout(setupSaveButton, 500);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Initialize the extension
    init();

})();