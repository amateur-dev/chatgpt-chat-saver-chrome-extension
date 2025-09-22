# ChatGPT Chat Saver Chrome Extension

A privacy-focused Chrome extension that adds a "Save as PDF" button to ChatGPT conversations. Capture your entire conversation with full formatting preservation using only client-side processing—no external servers required.

## Features

- 🔒 **Privacy First**: All processing happens locally in your browser
- 📄 **Full Conversation Capture**: Saves complete chat history with formatting
- 🎨 **Styled Output**: Maintains ChatGPT's visual design in the PDF
- 💻 **Code Preservation**: Properly formats code blocks and syntax highlighting
- 🖼️ **Image Support**: Includes images and visual content in the PDF
- 📐 **Formula Support**: Preserves mathematical formulas and equations
- 🚀 **Client-Side Only**: Uses jsPDF and html2canvas libraries locally

## Installation

### Method 1: Manual Installation (Recommended)

1. **Download the Extension**
   - Clone or download this repository
   - Extract the files to a folder on your computer

2. **Download Required Libraries**
   - Download [jsPDF](https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js) and save as `libs/jspdf.umd.min.js`
   - Download [html2canvas](https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js) and save as `libs/html2canvas.min.js`

3. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the folder containing the extension files
   - The extension should now appear in your extensions list

4. **Verify Installation**
   - Navigate to [ChatGPT](https://chat.openai.com/)
   - Look for the green "Save as PDF" button in the interface
   - Start a conversation and test the save functionality

### Method 2: Quick Setup Script

If you have `curl` available, you can use this script to download the required libraries:

```bash
# Navigate to the extension directory
cd chatgpt-chat-saver-chrome-extension

# Download jsPDF
curl -L -o libs/jspdf.umd.min.js "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"

# Download html2canvas  
curl -L -o libs/html2canvas.min.js "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"

echo "Libraries downloaded successfully!"
```

## Usage

1. **Open ChatGPT**: Navigate to [chat.openai.com](https://chat.openai.com/)
2. **Start a Conversation**: Have a conversation with ChatGPT
3. **Save as PDF**: Click the green "Save as PDF" button that appears in the interface
4. **Wait for Generation**: The extension will process your conversation (this may take a few seconds for long conversations)
5. **Download**: Your PDF will automatically download to your default download folder

### File Naming

PDFs are automatically named with the format: `chatgpt-conversation-YYYY-MM-DDTHH-MM-SS.pdf`

## File Structure

```
chatgpt-chat-saver-chrome-extension/
├── manifest.json           # Chrome extension manifest (v3)
├── content.js              # Main content script
├── styles.css              # Button and interface styling
├── libs/                   # External libraries
│   ├── jspdf.umd.min.js   # PDF generation library
│   └── html2canvas.min.js  # HTML to canvas conversion
├── icons/                  # Extension icons
│   ├── icon16.png         # 16x16 icon
│   ├── icon48.png         # 48x48 icon
│   └── icon128.png        # 128x128 icon
└── README.md              # This file
```

## Technical Details

### Libraries Used

- **jsPDF**: Client-side PDF generation
- **html2canvas**: Converts HTML content to canvas for PDF embedding

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
- `https://chat.openai.com/*`: Host permission for ChatGPT

## Troubleshooting

### Button Not Appearing
- Refresh the ChatGPT page
- Ensure the extension is enabled in `chrome://extensions/`
- Check that you're on the correct ChatGPT URL (`chat.openai.com`)

### PDF Generation Fails
- Verify that the library files are properly downloaded
- Check the browser console for error messages
- Ensure you have a conversation to save

### Large Conversations
- Very long conversations may take time to process
- Consider saving conversations in chunks if they're extremely long
- The extension handles multi-page PDFs automatically

## Development

### Building from Source

1. Clone the repository
2. Download the required libraries (see installation instructions)
3. Load the extension in developer mode

### Customization

You can customize the button appearance by modifying `styles.css`. The content script in `content.js` handles the PDF generation logic.

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Changelog

### v1.0.0
- Initial release
- Basic PDF generation functionality
- ChatGPT interface integration
- Privacy-focused design

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all files are properly installed
3. Check the browser console for error messages
4. Create an issue on the GitHub repository

---

**Note**: This extension is not affiliated with OpenAI. It's an independent tool designed to help users save their ChatGPT conversations locally.