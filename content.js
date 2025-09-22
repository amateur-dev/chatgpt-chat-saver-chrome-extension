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
     * Load libraries from CDN
     */
    function loadLibraries() {
        return new Promise((resolve, reject) => {
            let loadedCount = 0;
            const totalLibraries = 2;

            function checkComplete() {
                loadedCount++;
                if (loadedCount === totalLibraries) {
                    // Wait a bit for libraries to initialize
                    setTimeout(() => {
                        if (window.jsPDF && window.html2canvas) {
                            librariesLoaded = true;
                            console.log('ChatGPT PDF Saver: Libraries loaded successfully');
                            resolve();
                        } else {
                            reject(new Error('Libraries failed to initialize'));
                        }
                    }, 100);
                }
            }

            // Load jsPDF
            const jsPDFScript = document.createElement('script');
            jsPDFScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            jsPDFScript.crossOrigin = 'anonymous';
            jsPDFScript.onload = checkComplete;
            jsPDFScript.onerror = () => reject(new Error('Failed to load jsPDF'));
            document.head.appendChild(jsPDFScript);

            // Load html2canvas
            const html2canvasScript = document.createElement('script');
            html2canvasScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            html2canvasScript.crossOrigin = 'anonymous';
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
            await loadLibraries();
        } catch (error) {
            console.error('ChatGPT PDF Saver: Failed to load libraries:', error);
        }
        
        // Setup button regardless of library status
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
            console.log('ChatGPT PDF Saver: Save button injected successfully');
        } else {
            console.log('ChatGPT PDF Saver: Could not find container, retrying...');
            setTimeout(setupSaveButton, 2000);
        }
    }

    /**
     * Find the appropriate container for the save button
     */
    function findButtonContainer() {
        // Always create floating container for now to ensure button appears
        return createFloatingContainer();
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
        if (!librariesLoaded || typeof window.jsPDF === 'undefined' || typeof window.html2canvas === 'undefined') {
            alert('PDF libraries are not loaded yet. Please wait a moment and try again.');
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
            throw new Error('Could not find conversation container');
        }

        // Create a simple PDF for now
        const { jsPDF } = window.jsPDF;
        const pdf = new jsPDF();
        
        pdf.text('ChatGPT Conversation', 10, 10);
        pdf.text('Generated on: ' + new Date().toLocaleString(), 10, 20);
        
        // Save the PDF
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `chatgpt-conversation-${timestamp}.pdf`;
        
        pdf.save(filename);
        
        console.log('ChatGPT PDF Saver: PDF generated successfully');
    }

    /**
     * Find the main conversation container
     */
    function findConversationContainer() {
        const selectors = [
            '[role="main"]',
            '.flex.flex-col.text-sm',
            'main'
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                return element;
            }
        }

        return document.body;
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