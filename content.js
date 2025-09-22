// ...existing code...
    async function createPDFFromHTML(element) {
      const canvas = await window.html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const JsPDF = getJsPDF();
      const pdf = new JsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;   // A4 width in mm
      const pageHeight = 297; // A4 height in mm
-     const imgHeight = (canvas.height * imgWidth) / canvas.width;
+     const imgHeight = (canvas.height * imgWidth) / canvas.width;

-     const imgData = canvas.toDataURL('image/png');
+     // JPEG keeps size small; 0.92 is a good default
+     const imgData = canvas.toDataURL('image/jpeg', 0.92);

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

-     while (heightLeft >= 0) {
+     while (heightLeft > 0) { // avoid an extra blank/overlapping page
        position = heightLeft - imgHeight;
        pdf.addPage();
-       pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
+       pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      pdf.save(`chatgpt-conversation-${timestamp}.pdf`);
    }
// ...existing code.../**
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

    // Normalize jsPDF ctor from UMD
    function getJsPDF() {
      return (window.jspdf && window.jspdf.jsPDF) ||
             (window.jsPDF && window.jsPDF.jsPDF) ||
             window.jsPDF; // some builds expose ctor directly
    }

    /**
     * Wait for libraries to be available
     */
    function waitForLibraries(maxMs = 5000) {
      const start = Date.now();
      return new Promise((resolve) => {
        (function check() {
          const hasH2C = typeof window.html2canvas === 'function';
          const JsPDF = getJsPDF();
          if (hasH2C && JsPDF) return resolve(true);
          if (Date.now() - start > maxMs) return resolve(false);
          setTimeout(check, 100);
        })();
      });
    }

    /**
     * Initialize the extension
     */
    async function init() {
        console.log('ChatGPT PDF Saver: Initializing...');
        const ok = await waitForLibraries();
        console.log('jsPDF available:', !!getJsPDF());
        console.log('html2canvas available:', typeof window.html2canvas);
        
        if (!ok) {
            console.error('ChatGPT PDF Saver: Failed to load required libraries');
        }
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupSaveButton);
        } else {
            setupSaveButton();
        }
        
        observePageChanges();
    }

    /**
     * Set up the save button in the ChatGPT interface
     */
    function setupSaveButton() {
        const existingButton = document.getElementById(BUTTON_ID);
        if (existingButton) {
            existingButton.remove();
        }

        const targetContainer = createFloatingContainer();
        injectSaveButton(targetContainer);
        console.log('ChatGPT PDF Saver: Save button injected successfully');
    }

    /**
     * Create a floating container for the save button
     */
    function createFloatingContainer() {
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
        
        saveButton.addEventListener('click', handleSaveClick);
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

        const JsPDFCtor = getJsPDF();
        if (!JsPDFCtor || typeof window.html2canvas !== 'function') {
            console.error('PDF libs missing', { JsPDFCtor, html2canvas: typeof window.html2canvas });
            alert('PDF libraries are not loaded. Please reload the page and try again.');
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
     * Generate PDF from the current conversation using html2canvas
     */
    async function generatePDF() {
        console.log('ChatGPT PDF Saver: Starting PDF generation...');
        
        // Find the conversation container
        const conversationContainer = findConversationContainer();
        if (!conversationContainer) {
            throw new Error('Could not find conversation container. Make sure you have an active ChatGPT conversation.');
        }

        // Create a clean copy of the conversation for PDF
        const cleanContainer = await createCleanConversationCopy(conversationContainer);
        
        try {
            // Generate PDF from the clean container
            await createPDFFromHTML(cleanContainer);
            console.log('ChatGPT PDF Saver: PDF generated successfully');
        } finally {
            // Clean up
            cleanContainer.remove();
        }
    }

    /**
     * Find the main conversation container
     */
    function findConversationContainer() {
        const selectors = [
            '[role="main"]',
            'main',
            '.flex.flex-col.text-sm',
            '.conversation-container',
            '.flex-1.overflow-hidden'
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                const hasMessages = element.querySelectorAll('[data-message-id], .group\\/conversation-turn, [role="article"]').length > 0;
                if (hasMessages) {
                    console.log('ChatGPT PDF Saver: Found conversation container');
                    return element;
                }
            }
        }

        console.error('ChatGPT PDF Saver: Could not find conversation container');
        return null;
    }

    /**
     * Create a clean copy of the conversation optimized for PDF
     */
    async function createCleanConversationCopy(container) {
        // Find all message elements
        const messageElements = container.querySelectorAll('[data-message-id], .group\\/conversation-turn, [role="article"]');
        
        // Create a new container for the clean copy
        const cleanContainer = document.createElement('div');
        cleanContainer.style.cssText = `
            position: absolute;
            top: -9999px;
            left: 0;
            width: 800px;
            background: white;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            line-height: 1.6;
            color: #374151;
        `;

        // Add title
        const title = document.createElement('h1');
        title.textContent = 'ChatGPT Conversation';
        title.style.cssText = `
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #1f2937;
        `;
        cleanContainer.appendChild(title);

        // Add timestamp
        const timestamp = document.createElement('p');
        timestamp.textContent = `Generated on: ${new Date().toLocaleString()}`;
        timestamp.style.cssText = `
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 20px;
        `;
        cleanContainer.appendChild(timestamp);

        // Process each message
        for (let i = 0; i < messageElements.length; i++) {
            const messageElement = messageElements[i];
            const messageData = extractMessageData(messageElement);
            
            if (!messageData.text.trim()) continue;

            // Create message container
            const messageDiv = document.createElement('div');
            messageDiv.style.cssText = `
                margin-bottom: 20px;
                padding: 15px;
                border-radius: 8px;
                background: ${messageData.sender === 'You' ? '#f3f4f6' : '#ffffff'};
                border-left: 4px solid ${messageData.sender === 'You' ? '#3b82f6' : '#10b981'};
                border: 1px solid #e5e7eb;
            `;

            // Add sender header
            const senderHeader = document.createElement('div');
            senderHeader.textContent = `${messageData.sender}:`;
            senderHeader.style.cssText = `
                font-weight: bold;
                font-size: 16px;
                margin-bottom: 8px;
                color: ${messageData.sender === 'You' ? '#1e40af' : '#059669'};
            `;
            messageDiv.appendChild(senderHeader);

            // Add message content
            const contentDiv = document.createElement('div');
            contentDiv.style.cssText = `
                white-space: pre-wrap;
                word-wrap: break-word;
                font-size: 14px;
                line-height: 1.6;
            `;
            contentDiv.textContent = messageData.text;
            messageDiv.appendChild(contentDiv);

            cleanContainer.appendChild(messageDiv);
        }

        // Add to DOM temporarily for rendering
        document.body.appendChild(cleanContainer);
        
        return cleanContainer;
    }

    /**
     * Extract message data (reusing the improved version from before)
     */
    function extractMessageData(messageElement) {
        let sender = 'ChatGPT';
        
        // Detect sender
        if (messageElement.hasAttribute('data-message-author-role')) {
            const role = messageElement.getAttribute('data-message-author-role');
            sender = role === 'user' ? 'You' : 'ChatGPT';
        } else {
            const isUser = messageElement.querySelector('[data-message-author-role="user"]') ||
                          messageElement.closest('[data-message-author-role="user"]') ||
                          messageElement.querySelector('.bg-token-main-surface-secondary');
            sender = isUser ? 'You' : 'ChatGPT';
        }

        // Extract text
        let text = extractCleanText(messageElement);
        
        return { sender, text };
    }

    /**
     * Extract clean text from message element
     */
    function extractCleanText(element) {
        const clone = element.cloneNode(true);
        
        // Remove unwanted elements
        const elementsToRemove = [
            'button',
            '.sr-only',
            '[aria-hidden="true"]',
            '.copy-code-button',
            '.text-token-text-tertiary'
        ];
        
        elementsToRemove.forEach(selector => {
            const elements = clone.querySelectorAll(selector);
            elements.forEach(el => el.remove());
        });
        
        // Find content area
        const contentSelectors = [
            '.prose.w-full.break-words',
            '[data-message-content="true"]',
            '.markdown.prose',
            '.whitespace-pre-wrap',
            '.prose'
        ];
        
        let contentElement = null;
        for (const selector of contentSelectors) {
            contentElement = clone.querySelector(selector);
            if (contentElement && contentElement.textContent.trim().length > 5) {
                break;
            }
        }
        
        if (!contentElement) {
            contentElement = clone;
        }
        
        let text = contentElement.textContent || contentElement.innerText || '';
        
        // Clean up
        text = text.replace(/\s+/g, ' ').trim();
        text = text.replace(/\n\s+/g, '\n');
        text = text.replace(/\n{3,}/g, '\n\n');
        
        return text;
    }

    /**
     * Create PDF from HTML using html2canvas
     */
    async function createPDFFromHTML(element) {
      const canvas = await window.html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const JsPDF = getJsPDF();
      const pdf = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      // Calculate dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm  
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      const imgData = canvas.toDataURL('image/png');
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
      }

      // Save the PDF
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `chatgpt-conversation-${timestamp}.pdf`;
      
      pdf.save(filename);
    }

    /**
     * Observe page changes for SPA navigation
     */
    function observePageChanges() {
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