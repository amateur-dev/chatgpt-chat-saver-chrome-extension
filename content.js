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
    let librariesLoaded = false;

    /**
     * Load libraries dynamically
     */
    function loadLibraries() {
        return new Promise((resolve, reject) => {
            // Check if libraries are already loaded
            if (window.jsPDF && window.html2canvas) {
                librariesLoaded = true;
                resolve();
                return;
            }

            let loadedCount = 0;
            const totalLibraries = 2;

            function checkComplete() {
                loadedCount++;
                if (loadedCount === totalLibraries) {
                    if (window.jsPDF && window.html2canvas) {
                        librariesLoaded = true;
                        resolve();
                    } else {
                        reject(new Error('Libraries failed to load'));
                    }
                }
            }

            // Load jsPDF
            const jsPDFScript = document.createElement('script');
            jsPDFScript.src = chrome.runtime.getURL('libs/jspdf.umd.min.js');
            jsPDFScript.onload = checkComplete;
            jsPDFScript.onerror = () => reject(new Error('Failed to load jsPDF'));
            document.head.appendChild(jsPDFScript);

            // Load html2canvas
            const html2canvasScript = document.createElement('script');
            html2canvasScript.src = chrome.runtime.getURL('libs/html2canvas.min.js');
            html2canvasScript.onload = checkComplete;
            html2canvasScript.onerror = () => reject(new Error('Failed to load html2canvas'));
            document.head.appendChild(html2canvasScript);
        });
    }

    /**
     * Initialize the extension
     */
    async function init() {
        console.log('ChatGPT PDF Saver: Initializing...');
        
        try {
            // Load libraries first
            await loadLibraries();
            console.log('ChatGPT PDF Saver: Libraries loaded successfully');
        } catch (error) {
            console.error('ChatGPT PDF Saver: Failed to load libraries:', error);
            return;
        }
        
        // Wait for page to be ready
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

        // Find the best location to inject the button
        const targetContainer = findButtonContainer();
        if (targetContainer) {
            injectSaveButton(targetContainer);
        } else {
            // Retry after a short delay
            setTimeout(setupSaveButton, 1000);
        }
    }

    /**
     * Find the appropriate container for the save button
     */
    function findButtonContainer() {
        // Try multiple selectors to find the right place to inject the button
        const selectors = [
            'nav[aria-label="Chat history"]',
            '.flex.flex-col.w-full.h-full',
            '[data-testid="conversation-turn"]',
            '.sticky.top-0',
            'nav',
            'header'
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                return element;
            }
        }

        // Fallback: create a floating button container
        return createFloatingContainer();
    }

    /**
     * Create a floating container for the save button
     */
    function createFloatingContainer() {
        const container = document.createElement('div');
        container.id = 'chatgpt-pdf-saver-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            background: var(--main-surface-primary, #ffffff);
            border: 1px solid var(--border-light, #e5e5e5);
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
        if (container.id === 'chatgpt-pdf-saver-container') {
            container.appendChild(saveButton);
        } else {
            container.insertBefore(buttonWrapper, container.firstChild);
        }
        
        console.log('ChatGPT PDF Saver: Save button injected successfully');
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

        if (!librariesLoaded) {
            alert('Libraries are still loading. Please wait a moment and try again.');
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
        // Check if libraries are loaded
        if (typeof window.jsPDF === 'undefined') {
            throw new Error('jsPDF library not loaded. Please run setup.sh or download the actual library files. See README.md for instructions.');
        }
        if (typeof html2canvas === 'undefined') {
            throw new Error('html2canvas library not loaded. Please run setup.sh or download the actual library files. See README.md for instructions.');
        }

        // Find the conversation container
        const conversationContainer = findConversationContainer();
        if (!conversationContainer) {
            throw new Error('Could not find conversation container. Make sure you have an active ChatGPT conversation.');
        }

        // Check if there are any messages
        const messages = conversationContainer.querySelectorAll('[data-message-id], .group\\/conversation-turn, [role="article"]');
        if (messages.length === 0) {
            throw new Error('No conversation messages found. Start a conversation with ChatGPT first.');
        }

        console.log(`ChatGPT PDF Saver: Found ${messages.length} messages to save`);

        // Prepare the content for PDF generation
        const clonedContainer = await prepareContentForPDF(conversationContainer);
        
        // Generate PDF
        await createPDFFromElement(clonedContainer);
        
        // Clean up
        clonedContainer.remove();
    }

    /**
     * Find the main conversation container
     */
    function findConversationContainer() {
        const selectors = [
            '[role="main"]',
            '.flex.flex-col.text-sm',
            '.conversation-container',
            '.flex-1.overflow-hidden',
            '.w-full.h-full.overflow-auto',
            'main',
            '[data-testid="conversation"]'
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                // Verify this container actually has messages
                const hasMessages = element.querySelectorAll('[data-message-id], .group\\/conversation-turn, [role="article"]').length > 0;
                if (hasMessages) {
                    return element;
                }
            }
        }

        // Fallback: find by looking for message elements
        const messages = document.querySelectorAll('[data-message-id], .group\\/conversation-turn, [role="article"]');
        if (messages.length > 0) {
            // Find the common parent container
            let commonParent = messages[0];
            for (let i = 1; i < messages.length; i++) {
                commonParent = findCommonParent(commonParent, messages[i]);
            }
            return commonParent;
        }

        return null;
    }

    /**
     * Find common parent of two elements
     */
    function findCommonParent(el1, el2) {
        const parents1 = [];
        let current = el1;
        while (current) {
            parents1.push(current);
            current = current.parentElement;
        }
        
        current = el2;
        while (current) {
            if (parents1.includes(current)) {
                return current;
            }
            current = current.parentElement;
        }
        
        return document.body; // fallback
    }

    /**
     * Prepare content for PDF generation
     */
    async function prepareContentForPDF(container) {
        // Clone the container
        const clone = container.cloneNode(true);
        
        // Style the clone for PDF
        clone.style.cssText = `
            position: absolute;
            top: 0;
            left: -9999px;
            width: 800px;
            background: white;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #374151;
        `;

        // Add PDF-specific styles to child elements
        styleElementsForPDF(clone);
        
        // Append to body temporarily
        document.body.appendChild(clone);
        
        return clone;
    }

    /**
     * Apply PDF-specific styling to elements
     */
    function styleElementsForPDF(container) {
        // Style messages
        const messages = container.querySelectorAll('[data-message-id], .group\\/conversation-turn');
        messages.forEach(message => {
            message.style.cssText += `
                margin-bottom: 20px;
                padding: 15px;
                border-radius: 8px;
                background: #f9fafb;
                border-left: 4px solid #3b82f6;
            `;
        });

        // Style code blocks
        const codeBlocks = container.querySelectorAll('pre, code');
        codeBlocks.forEach(code => {
            code.style.cssText += `
                background: #1f2937;
                color: #f9fafb;
                padding: 12px;
                border-radius: 6px;
                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                overflow-x: auto;
                margin: 10px 0;
            `;
        });

        // Style links
        const links = container.querySelectorAll('a');
        links.forEach(link => {
            link.style.cssText += `
                color: #3b82f6;
                text-decoration: underline;
            `;
        });

        // Hide interactive elements that shouldn't be in PDF
        const elementsToHide = container.querySelectorAll('button, .cursor-pointer, [role="button"]');
        elementsToHide.forEach(el => {
            if (!el.closest('#' + BUTTON_ID)) {
                el.style.display = 'none';
            }
        });
    }

    /**
     * Create PDF from the prepared element
     */
    async function createPDFFromElement(element) {
        try {
            // Capture element as canvas
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: false
            });

            // Create PDF
            const { jsPDF } = window.jsPDF;
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            // Calculate dimensions
            const imgWidth = 210; // A4 width in mm
            const pageHeight = 295; // A4 height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;

            // Add image to PDF
            const imgData = canvas.toDataURL('image/png');
            let position = 0;

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
            
            console.log('ChatGPT PDF Saver: PDF generated successfully');
            
        } catch (error) {
            console.error('ChatGPT PDF Saver: Error in PDF generation:', error);
            throw error;
        }
    }

    /**
     * Observe page changes for SPA navigation
     */
    function observePageChanges() {
        // Watch for URL changes
        let currentURL = location.href;
        new MutationObserver(() => {
            if (location.href !== currentURL) {
                currentURL = location.href;
                setTimeout(setupSaveButton, 1000);
            }
        }).observe(document, { subtree: true, childList: true });

        // Watch for dynamic content changes
        const targetNode = document.body;
        const observer = new MutationObserver((mutations) => {
            let shouldRecheck = false;
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    shouldRecheck = true;
                }
            });
            
            if (shouldRecheck && !document.getElementById(BUTTON_ID)) {
                setTimeout(setupSaveButton, 500);
            }
        });

        observer.observe(targetNode, {
            childList: true,
            subtree: true
        });
    }

    // Initialize the extension
    init();

})();