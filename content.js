/**
 * ChatGPT Chat Saver - Content Script
 * Extracts conversations and enables download in multiple formats
 * v3.0.0 - Added Markdown, HTML, JSON export with metadata
 */

console.log('ChatGPT Chat Saver: Content script loaded');

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content Script: Message received', request);

  if (request.action === 'generateText') {
    try {
      const format = request.format || 'txt';
      const options = {
        selectionMode: request.selectionMode || 'full',
        lastN: request.lastN || 10
      };

      generateAndDownload(format, options);
      sendResponse({ success: true, message: `${format.toUpperCase()} file generated` });
    } catch (error) {
      console.error('Error generating file:', error);
      showToast(error.message, 'error');
      sendResponse({ success: false, error: error.message });
    }
  }

  return true;
});

/**
 * Generate and download conversation in specified format
 */
function generateAndDownload(format, options = {}) {
  console.log(`ChatGPT Chat Saver: Starting ${format} generation with options:`, options);

  // Extract messages as structured data
  let messages = extractMessages();

  if (!messages || messages.length === 0) {
    throw new Error('No conversation found. Please open a conversation and try again.');
  }

  // Apply filtering
  if (options.selectionMode === 'lastN' && options.lastN > 0) {
    const originalCount = messages.length;
    messages = messages.slice(-options.lastN);
    console.log(`ChatGPT Chat Saver: Filtered from ${originalCount} to last ${messages.length} messages`);
  }

  // Extract metadata
  const metadata = extractMetadata(messages);

  console.log(`ChatGPT Chat Saver: Final count ${messages.length} messages`);

  // Format content based on selected format
  let content, mimeType, extension;

  switch (format) {
    case 'md':
      content = formatAsMarkdown(messages, metadata);
      mimeType = 'text/markdown;charset=utf-8';
      extension = 'md';
      break;
    case 'html':
      content = formatAsHTML(messages, metadata);
      mimeType = 'text/html;charset=utf-8';
      extension = 'html';
      break;
    case 'json':
      content = formatAsJSON(messages, metadata);
      mimeType = 'application/json;charset=utf-8';
      extension = 'json';
      break;
    case 'txt':
    default:
      content = formatAsText(messages, metadata);
      mimeType = 'text/plain;charset=utf-8';
      extension = 'txt';
      break;
  }

  // Create and download file
  downloadFile(content, mimeType, extension, metadata);
  showToast('Chat saved successfully!', 'success');
}

/**
 * Extract messages as structured array
 */
function extractMessages() {
  console.log('ChatGPT Chat Saver: Extracting messages');

  // Check if we are on Gemini
  if (window.location.hostname.includes('gemini.google.com')) {
    console.log('ChatGPT Chat Saver: Detected Gemini');
    return extractGeminiMessages();
  }

  // ChatGPT extraction
  let messages = [];

  // Strategy 1: Try to find message elements with data-message-id
  const messageElements = document.querySelectorAll('[data-message-id]');
  if (messageElements.length > 0) {
    console.log(`ChatGPT Chat Saver: [Strategy 1] Found ${messageElements.length} messages via [data-message-id]`);
    messages = Array.from(messageElements).map(el => ({
      role: determineSender(el),
      content: cleanText(el.innerText || el.textContent || '')
    })).filter(m => m.content.trim().length > 0);

    if (messages.length > 0) return messages;
  }

  // Strategy 2: Try to find message groups
  const groups = document.querySelectorAll('.group');
  if (groups.length > 0) {
    console.log(`ChatGPT Chat Saver: [Strategy 2] Found ${groups.length} message groups via .group`);
    messages = Array.from(groups).map(el => ({
      role: 'Unknown',
      content: cleanText(el.innerText || el.textContent || '')
    })).filter(m => m.content.trim().length > 20);

    if (messages.length > 0) return messages;
  }

  // Strategy 3: Extract from main content area
  const mainContent = document.querySelector('[role="main"]') ||
    document.querySelector('main') ||
    document.querySelector('div[class*="prose"]');

  if (mainContent && mainContent.innerText.length > 100) {
    console.log('ChatGPT Chat Saver: [Strategy 3] Extracting from main content area');
    return [{
      role: 'Conversation',
      content: cleanText(mainContent.innerText)
    }];
  }

  // Strategy 4: Fallback - get all visible text
  console.log('ChatGPT Chat Saver: [Strategy 4] Using fallback - extracting all visible text');
  const bodyText = document.body.innerText;
  const lines = bodyText.split('\n').filter(line => {
    const trimmed = line.trim();
    return trimmed.length > 0 && !isNavigationText(trimmed);
  });

  return [{
    role: 'Conversation',
    content: cleanText(lines.join('\n'))
  }];
}

/**
 * Extract messages from Gemini
 */
function extractGeminiMessages() {
  const messageElements = document.querySelectorAll('user-query, model-response');
  let messages = [];

  if (messageElements.length === 0) {
    console.log('ChatGPT Chat Saver: No Gemini messages found with standard selectors');

    // Fallback 1: Try infinite scroller
    const scroller = document.querySelector('infinite-scroller');
    if (scroller && scroller.innerText.length > 100) {
      console.log('ChatGPT Chat Saver: Extracting from infinite-scroller');
      return [{
        role: 'Conversation',
        content: cleanText(scroller.innerText)
      }];
    }

    // Fallback 2: Main content
    const main = document.querySelector('main');
    if (main && main.innerText.length > 100) {
      return [{
        role: 'Conversation',
        content: cleanText(main.innerText)
      }];
    }

    // Fallback 3: Body text
    console.log('ChatGPT Chat Saver: Using body text fallback for Gemini');
    return [{
      role: 'Conversation',
      content: cleanText(document.body.innerText)
    }];
  }

  messageElements.forEach(msg => {
    let role = 'Unknown';
    let content = '';

    if (msg.tagName.toLowerCase() === 'user-query') {
      role = 'User';
      const queryText = msg.querySelector('.query-text') || msg.querySelector('.query-content') || msg;
      content = queryText.innerText;
    } else if (msg.tagName.toLowerCase() === 'model-response') {
      role = 'Gemini';
      const markdown = msg.querySelector('.markdown') || msg.querySelector('.model-response-text') || msg;
      content = markdown.innerText;
    }

    if (content && content.trim()) {
      messages.push({
        role: role,
        content: cleanText(content.trim())
      });
    }
  });

  return messages;
}

/**
 * Extract metadata from the page
 */
function extractMetadata(messages) {
  const isGemini = window.location.hostname.includes('gemini.google.com');
  const platform = isGemini ? 'Gemini' : 'ChatGPT';

  // Try to extract title
  let title = 'Conversation';

  // Method 1: Document title
  const docTitle = document.title;
  if (docTitle) {
    title = docTitle
      .replace(' | ChatGPT', '')
      .replace(' - ChatGPT', '')
      .replace(' | Gemini', '')
      .replace(' - Gemini', '')
      .trim();
  }

  // Method 2: Try to find active conversation in sidebar (ChatGPT)
  if (!isGemini) {
    const activeNav = document.querySelector('nav [aria-current="page"]');
    if (activeNav && activeNav.textContent) {
      title = activeNav.textContent.trim();
    }
  }

  // Fallback to first user message
  if (title === 'Conversation' || title === 'ChatGPT' || title === 'Gemini') {
    const firstUserMsg = messages.find(m => m.role === 'User');
    if (firstUserMsg) {
      title = firstUserMsg.content.substring(0, 50).replace(/\n/g, ' ').trim();
      if (firstUserMsg.content.length > 50) title += '...';
    }
  }

  // Try to extract model version
  let model = 'Unknown';

  // Look for model selector or indicator in ChatGPT
  const modelSelector = document.querySelector('[data-testid="model-switcher"]');
  if (modelSelector) {
    model = modelSelector.textContent.trim();
  }

  // Alternative: Look for GPT-4 or other model mentions
  const modelIndicators = ['GPT-4o', 'GPT-4', 'GPT-3.5', 'Gemini Pro', 'Gemini Advanced', 'Gemini'];
  modelIndicators.forEach(indicator => {
    if (document.body.innerText.includes(indicator) && model === 'Unknown') {
      model = indicator;
    }
  });

  return {
    title: title,
    platform: platform,
    model: model,
    url: window.location.href,
    savedAt: new Date().toISOString(),
    messageCount: messages.length
  };
}

/**
 * Sanitize string for use in filename
 */
function sanitizeFilename(str) {
  return str
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid chars
    .replace(/\s+/g, '_')         // Replace spaces with underscores
    .replace(/_+/g, '_')          // Collapse multiple underscores
    .substring(0, 50)             // Limit length
    .replace(/_+$/, '');          // Remove trailing underscores
}

/**
 * Format messages as plain text
 */
function formatAsText(messages, metadata) {
  let text = '';

  // Add metadata header
  text += `=== ${metadata.platform} Conversation ===\n`;
  text += `Title: ${metadata.title}\n`;
  text += `Model: ${metadata.model}\n`;
  text += `URL: ${metadata.url}\n`;
  text += `Saved: ${new Date(metadata.savedAt).toLocaleString()}\n`;
  text += `Messages: ${metadata.messageCount}\n`;
  text += '='.repeat(80) + '\n\n';

  // Add messages
  messages.forEach(msg => {
    text += `[${msg.role}]:\n${msg.content}\n\n${'='.repeat(80)}\n\n`;
  });

  return text;
}

/**
 * Format messages as Markdown
 */
function formatAsMarkdown(messages, metadata) {
  let md = '';

  // Add metadata front matter
  md += `# ${metadata.title}\n\n`;
  md += `> **Platform:** ${metadata.platform}  \n`;
  md += `> **Model:** ${metadata.model}  \n`;
  md += `> **Saved:** ${new Date(metadata.savedAt).toLocaleString()}  \n`;
  md += `> **URL:** [${metadata.url}](${metadata.url})  \n`;
  md += `> **Messages:** ${metadata.messageCount}\n\n`;
  md += '---\n\n';

  // Add messages
  messages.forEach(msg => {
    const icon = msg.role === 'User' ? '👤' : '🤖';
    md += `## ${icon} ${msg.role}\n\n`;
    md += `${msg.content}\n\n`;
    md += '---\n\n';
  });

  return md;
}

/**
 * Format messages as HTML
 */
function formatAsHTML(messages, metadata) {
  const escapedTitle = escapeHtml(metadata.title);

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapedTitle}</title>
  <style>
    :root {
      --bg: #f9fafb;
      --card-bg: #ffffff;
      --text: #1f2937;
      --text-muted: #6b7280;
      --user-bg: #eff6ff;
      --user-border: #3b82f6;
      --assistant-bg: #f0fdf4;
      --assistant-border: #22c55e;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #111827;
        --card-bg: #1f2937;
        --text: #f9fafb;
        --text-muted: #9ca3af;
        --user-bg: #1e3a5f;
        --user-border: #60a5fa;
        --assistant-bg: #14532d;
        --assistant-border: #4ade80;
      }
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding: 20px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    header {
      background: var(--card-bg);
      padding: 24px;
      border-radius: 12px;
      margin-bottom: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    h1 { font-size: 1.5rem; margin-bottom: 16px; }
    .meta { font-size: 0.875rem; color: var(--text-muted); }
    .meta p { margin: 4px 0; }
    .message {
      background: var(--card-bg);
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 16px;
      border-left: 4px solid var(--assistant-border);
    }
    .message.user {
      background: var(--user-bg);
      border-left-color: var(--user-border);
    }
    .message.assistant {
      background: var(--assistant-bg);
    }
    .role {
      font-weight: 600;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
      color: var(--text-muted);
    }
    .content { white-space: pre-wrap; }
    pre {
      background: #1f2937;
      color: #f9fafb;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 12px 0;
    }
    code {
      background: rgba(0,0,0,0.1);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>${escapedTitle}</h1>
      <div class="meta">
        <p><strong>Platform:</strong> ${escapeHtml(metadata.platform)}</p>
        <p><strong>Model:</strong> ${escapeHtml(metadata.model)}</p>
        <p><strong>Saved:</strong> ${new Date(metadata.savedAt).toLocaleString()}</p>
        <p><strong>URL:</strong> <a href="${escapeHtml(metadata.url)}">${escapeHtml(metadata.url)}</a></p>
      </div>
    </header>
`;

  messages.forEach(msg => {
    const roleClass = msg.role.toLowerCase().includes('user') ? 'user' : 'assistant';
    html += `    <article class="message ${roleClass}">
      <div class="role">${escapeHtml(msg.role)}</div>
      <div class="content">${escapeHtml(msg.content)}</div>
    </article>
`;
  });

  html += `  </div>
</body>
</html>`;

  return html;
}

/**
 * Format messages as JSON
 */
function formatAsJSON(messages, metadata) {
  const data = {
    metadata: metadata,
    messages: messages.map((msg, index) => ({
      index: index,
      role: msg.role,
      content: msg.content
    }))
  };

  return JSON.stringify(data, null, 2);
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Determine if element is from user or assistant
 */
function determineSender(element) {
  // Check for explicit role attributes first (most reliable)
  if (element.hasAttribute('data-message-author-role')) {
    const role = element.getAttribute('data-message-author-role');
    if (role === 'user') return 'User';
    if (role === 'assistant') return 'ChatGPT';
  }

  // Check for nested role attributes
  const roleElement = element.querySelector('[data-message-author-role]');
  if (roleElement) {
    const role = roleElement.getAttribute('data-message-author-role');
    if (role === 'user') return 'User';
    if (role === 'assistant') return 'ChatGPT';
  }

  // Check for class-based indicators
  if (element.className) {
    const className = element.className.toLowerCase();
    if (className.includes('user-message') || className.includes('user-')) return 'User';
    if (className.includes('assistant-message') || className.includes('assistant-')) return 'ChatGPT';
  }

  return 'ChatGPT';
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

  text = text.replace(/\n\n\n+/g, '\n\n');
  text = text.trim();
  text = text.replace(/Copy code\n/g, '\n');
  text = text.replace(/Regenerate response\n/g, '\n');

  return text;
}

/**
 * Download file with proper naming
 */
function downloadFile(content, mimeType, extension, metadata) {
  try {
    console.log('ChatGPT Chat Saver: Creating blob and initiating download');

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);

    // Build smart filename
    const titleSlug = sanitizeFilename(metadata.title);
    const modelSlug = sanitizeFilename(metadata.model);
    const timestamp = getTimestamp();
    const filename = `${metadata.platform}_${titleSlug}_${modelSlug}_${timestamp}.${extension}`;

    link.setAttribute('download', filename);
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log(`ChatGPT Chat Saver: Download completed - ${filename}`);
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
  const date = now.toISOString().split('T')[0];
  const time = now.toTimeString().split(' ')[0].replace(/:/g, '-').substring(0, 5);
  return `${date}_${time}`;
}

/**
 * Show toast notification
 */
function showToast(message, type = 'success') {
  // Remove existing toast
  const existing = document.getElementById('chat-saver-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'chat-saver-toast';
  toast.className = `chat-saver-toast chat-saver-toast-${type}`;
  toast.textContent = message;

  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    padding: 12px 20px;
    border-radius: 8px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    font-weight: 500;
    z-index: 999999;
    animation: chat-saver-slide-in 0.3s ease;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    ${type === 'success' ? 'background: #10b981; color: white;' : ''}
    ${type === 'error' ? 'background: #ef4444; color: white;' : ''}
    ${type === 'warning' ? 'background: #f59e0b; color: white;' : ''}
  `;

  // Add animation keyframes if not exists
  if (!document.getElementById('chat-saver-toast-styles')) {
    const style = document.createElement('style');
    style.id = 'chat-saver-toast-styles';
    style.textContent = `
      @keyframes chat-saver-slide-in {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);

  // Auto-dismiss after 4 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/**
 * Inject save button into ChatGPT UI
 */
function injectSaveButton() {
  try {
    if (document.getElementById('chatgpt-chat-saver-btn')) return;

    const header = document.querySelector('header') || document.querySelector('nav');
    if (!header) {
      console.log('ChatGPT Chat Saver: Header not found, cannot inject button');
      return;
    }

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
      try {
        generateAndDownload('txt'); // Default to TXT for injected button
        button.textContent = '✅ Saved!';
      } catch (error) {
        button.textContent = '❌ Error';
        showToast(error.message, 'error');
      }
      setTimeout(() => {
        button.disabled = false;
        button.textContent = '💾 Save Chat';
      }, 2000);
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

setTimeout(injectSaveButton, 2000);
setTimeout(injectSaveButton, 5000);

console.log('ChatGPT Chat Saver: Content script initialized v3.0');
