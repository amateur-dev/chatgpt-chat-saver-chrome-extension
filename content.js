/**
 * ChatGPT Chat Saver - Content Script
 * Extracts conversations and enables download as text
 */

console.log('ChatGPT Chat Saver: Content script loaded');

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content Script: Message received', request);
  
  if (request.action === 'generateText') {
    try {
      generateAndDownloadText();
      sendResponse({ success: true, message: 'Text file generated' });
    } catch (error) {
      console.error('Error generating text:', error);
      sendResponse({ success: false, error: error.message });
    }
  }
  
  return true;
});

/**
 * Generate and download conversation as text
 */
function generateAndDownloadText() {
  console.log('ChatGPT Chat Saver: Starting text generation');
  
  // Extract conversation text
  const conversationText = extractConversationText();
  
  if (!conversationText || conversationText.trim().length === 0) {
    throw new Error('No conversation found. Please open a conversation and try again.');
  }
  
  console.log(`ChatGPT Chat Saver: Extracted ${conversationText.length} characters`);
  
  // Create and download file
  downloadTextFile(conversationText);
}

/**
 * Extract conversation text from the page
 */
function extractConversationText() {
  console.log('ChatGPT Chat Saver: Extracting conversation text');
  
  let conversationText = '';
  
  // Strategy 1: Try to find message elements with data-message-id
  const messageElements = document.querySelectorAll('[data-message-id]');
  if (messageElements.length > 0) {
    console.log(`ChatGPT Chat Saver: Found ${messageElements.length} messages via [data-message-id]`);
    return extractFromMessageElements(messageElements);
  }
  
  // Strategy 2: Try to find message groups
  const groups = document.querySelectorAll('.group');
  if (groups.length > 0) {
    console.log(`ChatGPT Chat Saver: Found ${groups.length} message groups via .group`);
    return extractFromElements(groups);
  }
  
  // Strategy 3: Extract from main content area
  const mainContent = document.querySelector('[role="main"]') || 
                     document.querySelector('main') ||
                     document.querySelector('div[class*="prose"]');
  
  if (mainContent && mainContent.innerText.length > 100) {
    console.log('ChatGPT Chat Saver: Extracting from main content area');
    conversationText = mainContent.innerText;
    return cleanText(conversationText);
  }
  
  // Strategy 4: Fallback - get all visible text
  console.log('ChatGPT Chat Saver: Using fallback - extracting all visible text');
  conversationText = document.body.innerText;
  
  // Filter to only conversation-like content
  const lines = conversationText.split('\n');
  const filtered = lines.filter(line => {
    const trimmed = line.trim();
    return trimmed.length > 0 && !isNavigationText(trimmed);
  });
  
  conversationText = filtered.join('\n');
  return cleanText(conversationText);
}

/**
 * Extract text from message elements
 */
function extractFromMessageElements(elements) {
  let text = '';
  
  elements.forEach((element, index) => {
    // Try to determine sender
    const sender = determineSender(element);
    
    // Extract message content
    const content = element.innerText || element.textContent || '';
    
    if (content.trim()) {
      text += `[${sender}]:\n${content}\n\n${'='.repeat(80)}\n\n`;
    }
  });
  
  return cleanText(text);
}

/**
 * Extract text from generic elements
 */
function extractFromElements(elements) {
  let text = '';
  
  elements.forEach((element) => {
    const content = element.innerText || element.textContent || '';
    if (content.trim().length > 20) {
      text += content + '\n\n' + '='.repeat(80) + '\n\n';
    }
  });
  
  return cleanText(text);
}

/**
 * Determine if element is from user or assistant
 */
function determineSender(element) {
  // Check for user indicators
  if (element.textContent.toLowerCase().includes('you') ||
      element.querySelector('[data-message-author-role="user"]') ||
      element.className.includes('user')) {
    return 'User';
  }
  
  // Check for assistant indicators
  if (element.textContent.toLowerCase().includes('assistant') ||
      element.textContent.toLowerCase().includes('gpt') ||
      element.querySelector('[data-message-author-role="assistant"]')) {
    return 'Assistant';
  }
  
  // Default based on index or content length
  return 'Message';
}

/**
 * Check if text is navigation/UI text
 */
function isNavigationText(text) {
  const navPatterns = [
    /^(menu|home|explore|new chat|settings|logout|upgrade|plus|conversations|sidebar)/i,
    /^(copy|regenerate|delete|edit|share|fork)/i,
    /^(dark mode|light mode|settings)/i,
    /^(feedback|help|about)/i
  ];
  
  return navPatterns.some(pattern => pattern.test(text));
}

/**
 * Clean and normalize text
 */
function cleanText(text) {
  if (!text) return '';
  
  // Remove multiple consecutive newlines
  text = text.replace(/\n\n\n+/g, '\n\n');
  
  // Remove leading/trailing whitespace
  text = text.trim();
  
  // Remove common UI elements
  text = text.replace(/Copy code\n/g, '\n');
  text = text.replace(/Regenerate response\n/g, '\n');
  
  return text;
}

/**
 * Download text file
 */
function downloadTextFile(content) {
  try {
    console.log('ChatGPT Chat Saver: Creating blob and initiating download');
    
    // Create blob
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    
    // Create object URL
    const url = URL.createObjectURL(blob);
    
    // Create anchor element
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ChatGPT_Conversation_${getTimestamp()}.txt`);
    link.style.display = 'none';
    
    // Append to body and click
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('ChatGPT Chat Saver: Download completed successfully');
  } catch (error) {
    console.error('ChatGPT Chat Saver: Download failed', error);
    throw error;
  }
}

/**
 * Get current timestamp for filename
 */
function getTimestamp() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Inject save button into ChatGPT UI
 */
function injectSaveButton() {
  try {
    // Only inject once
    if (document.getElementById('chatgpt-chat-saver-btn')) {
      return;
    }
    
    // Find the header area
    const header = document.querySelector('header') || 
                   document.querySelector('nav');
    
    if (!header) {
      console.log('ChatGPT Chat Saver: Header not found, cannot inject button');
      return;
    }
    
    // Create button
    const button = document.createElement('button');
    button.id = 'chatgpt-chat-saver-btn';
    button.textContent = '💾 Save Chat';
    button.style.cssText = `
      padding: 8px 16px;
      margin: 0 10px;
      background-color: #10a37f;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.2s;
    `;
    
    button.onmouseover = () => {
      button.style.backgroundColor = '#0d8c6e';
      button.style.transform = 'scale(1.05)';
    };
    button.onmouseout = () => {
      button.style.backgroundColor = '#10a37f';
      button.style.transform = 'scale(1)';
    };
    button.onclick = () => {
      button.disabled = true;
      button.textContent = '💾 Saving...';
      generateAndDownloadText();
      setTimeout(() => {
        button.disabled = false;
        button.textContent = '💾 Save Chat';
      }, 1000);
    };
    
    header.appendChild(button);
    console.log('ChatGPT Chat Saver: Save button injected successfully');
  } catch (error) {
    console.error('ChatGPT Chat Saver: Failed to inject button', error);
  }
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectSaveButton);
} else {
  injectSaveButton();
}

// Try injecting button after a delay in case DOM loads dynamically
setTimeout(injectSaveButton, 2000);
setTimeout(injectSaveButton, 5000);

console.log('ChatGPT Chat Saver: Content script initialized');
