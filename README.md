# AI Chat Saver Chrome Extension (ChatGPT & Gemini)

A privacy-focused Chrome extension that saves ChatGPT and Gemini conversations as text files. Capture your entire conversation with robust message detection using only native JavaScript—no external libraries or servers required.

## Features

- 🔒 **Privacy First**: All processing happens locally in your browser
- 🤖 **Multi-Platform**: Supports both ChatGPT and Google Gemini
- 📄 **Full Conversation Capture**: Saves complete chat history in clean text format
- 🎯 **Robust Detection**: 4-tier strategy ensures messages are always found
- 💪 **No Dependencies**: Pure JavaScript - no external libraries needed
- 🚫 **No CSP Issues**: Works perfectly on ChatGPT's secure site
- 📁 **Easy Export**: Downloads as `.txt` file with timestamps
- 🔄 **Smart Fallback**: Always extracts conversation even if DOM changes
- ⚡ **Fast & Reliable**: Instant download, no processing delays

## Installation

### Method 1: Manual Installation (Recommended)

1. **Download the Extension**
   - Clone or download this repository
   - Extract the files to a folder on your computer

2. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the folder containing the extension files
   - The extension should now appear in your extensions list

3. **Verify Installation**
   - Navigate to [ChatGPT](https://chatgpt.com/) or [Gemini](https://gemini.google.com/)
   - Click the extension icon in your toolbar
   - You should see the "Save Chat" button in the popup
   - Start a conversation and test the save functionality

## Usage

1. **Open Chat App**: Navigate to [ChatGPT](https://chatgpt.com/) or [Gemini](https://gemini.google.com/)
2. **Start a Conversation**: Have a conversation with the AI
3. **Click Extension Icon**: Click the extension icon in your browser toolbar
4. **Save Chat**: Click the "💾 Save Chat" button in the popup
5. **Download**: Your text file will automatically download to your default download folder

### File Naming

Text files are automatically named with the format: `ChatGPT_Conversation_YYYY-MM-DD.txt` when saving from ChatGPT, and `Gemini_Conversation_YYYY-MM-DD.txt` when saving from Gemini.

### Gemini Notes

- When using Gemini, the extension will attempt to extract visible messages from the conversation container (including `infinite-scroller`), and will fallback to page text if needed.
- If you don't see a download, reload the Gemini page after updating the extension and check the browser console for errors (F12 → Console).

### Example Output

```
[User]:
Hello, can you help me with JavaScript?
================================================================================

[Assistant]:
Of course! I'd be happy to help. What would you like to know about JavaScript?
================================================================================

[User]:
How do I fetch data from an API?
...
```

## File Structure

```
chatgpt-chat-saver-chrome-extension/
├── manifest.json           # Chrome extension manifest (v3)
├── content.js              # Main content script with 4-tier detection
├── popup.js                # Popup script for Save Chat button
├── popup.html              # Extension popup UI
├── styles.css              # Button and interface styling
├── icons/                  # Extension icons
│   ├── icon16.png         # 16x16 icon
│   ├── icon48.png         # 48x48 icon
│   └── icon128.png        # 128x128 icon
├── test-suite.js          # Automated test suite
├── run-tests.sh           # Test runner script
└── README.md              # This file
```

## Technical Details

### 4-Tier Message Detection Strategy

The extension uses a robust 4-tier strategy to detect messages, ensuring it works even when ChatGPT's HTML structure changes:

1. **Strategy 1**: `[data-message-id]` attributes - Current ChatGPT standard
2. **Strategy 2**: `.group` class selectors - Alternative layout support
3. **Strategy 3**: `[role="main"]` container - Semantic HTML extraction
4. **Strategy 4**: Fallback text extraction - Always works! Extracts all visible text

### No External Dependencies

Unlike PDF generation which requires external libraries (html2canvas, jspdf) that can be blocked by Content Security Policy (CSP), this extension:

- ✅ Uses only native JavaScript
- ✅ Has no CSP violations
- ✅ Works on ChatGPT's locked-down site
- ✅ Is lightweight and fast
- ✅ Has no external dependencies

### Privacy & Security

- ✅ No external API calls
- ✅ No data transmission to external servers
- ✅ All processing happens in your browser
- ✅ No personal data collection
- ✅ No analytics or tracking

### Browser Compatibility

- Chrome (recommended)
- Chromium-based browsers (Edge, Brave, etc.)
- Requires Chrome Extension Manifest V3 support

### Permissions

The extension requires minimal permissions:
- `activeTab`: To interact with the current ChatGPT tab
- `tabs`: To query active tab information
- `scripting`: For content script injection
- `https://chat.openai.com/*`: Host permission for ChatGPT (OpenAI domain)
- `https://chatgpt.com/*`: Host permission for ChatGPT (new domain)

## Troubleshooting

### Button Not Appearing in Popup
- Refresh the extension: Go to `chrome://extensions/` and click the reload icon
- Ensure the extension is enabled
- Try disabling and re-enabling the extension

### Save Not Working
- Ensure you're on ChatGPT (chat.openai.com or chatgpt.com)
- Hard refresh ChatGPT page: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+F5` (Windows)
- Check browser console for error messages (F12 → Console tab)
- Ensure you have an active conversation

### No Text Downloaded
- Check your browser's download folder
- Verify downloads are not blocked in browser settings
- Check browser console for errors (F12 → Console)

### Testing the Extension
Run the automated test suite:
```bash
bash run-tests.sh
```

## Development

### Building from Source

1. Clone the repository
2. Load the extension in developer mode (see Installation)
3. Make your changes
4. Reload the extension in `chrome://extensions/`

### Customization

You can customize:
- **Button appearance**: Modify `popup.html` styles
- **Output format**: Edit `extractFromMessageElements()` in `content.js`
- **Detection strategies**: Modify `extractConversationText()` in `content.js`
- **File naming**: Edit `downloadTextFile()` in `content.js`

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly (run `bash run-tests.sh`)
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Changelog

### v2.0 (Current)
- ✅ Complete rewrite using native JavaScript (no external libraries)
- ✅ Changed from PDF export to text export (no CSP issues)
- ✅ Implemented 4-tier robust message detection
- ✅ Added direct "Save Chat" button in popup
- ✅ Added smart fallback for text extraction
- ✅ Enhanced error handling and logging
- ✅ Updated all documentation

### v2.0.3 (2025-12-16)
- ✅ Added support for Google Gemini (`gemini.google.com`) to extract and save conversations
- ✅ Use `Gemini_Conversation_YYYY-MM-DD.txt` filename when saving from Gemini
- ✅ Improved Gemini extraction with `infinite-scroller` and fallback strategies
- ✅ Fixed a content script syntax issue that could prevent downloads
- ✅ Bumped extension version to `v2.0.3` for Chrome Web Store update

### v1.0
- Initial release
- Basic PDF generation functionality
- ChatGPT interface integration
- Privacy-focused design

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Run the test suite: `bash run-tests.sh`
3. Check the browser console for error messages
4. Create an issue on the GitHub repository with:
   - Browser version
   - Error messages from console
   - Steps to reproduce

---

**Note**: This extension is not affiliated with OpenAI. It's an independent tool designed to help users save their ChatGPT conversations locally.