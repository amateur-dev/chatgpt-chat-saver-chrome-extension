# AI Chat Saver – Chrome Extension for ChatGPT & Gemini

> **For researchers, developers, and power users who need private, local archives of AI conversations.**

[![Chrome Extension](https://img.shields.io/badge/Chrome%20Web%20Store-Coming%20Soon-blue?logo=google-chrome)](https://chrome.google.com/webstore)
[![Version](https://img.shields.io/badge/version-3.0.0-green)](https://github.com/amateur-dev/chatgpt-chat-saver-chrome-extension/releases)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

Save your ChatGPT and Gemini conversations locally in **TXT, Markdown, HTML, or JSON** formats—with smart filenames, metadata headers, and zero data sent to external servers.

<!-- TODO: Add screenshot.png and demo.gif to assets/ folder -->
<!-- ![Extension Screenshot](assets/screenshot.png) -->

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📄 **Multiple Export Formats** | TXT, Markdown, HTML, JSON—choose the best format for your workflow |
| 🏷️ **Smart Filenames** | Includes chat title, model, and timestamp (e.g., `ChatGPT_Refactor_Plan_GPT-4_2026-01-13.md`) |
| 📋 **Metadata Headers** | Each export includes platform, model, URL, and save timestamp |
| 🤖 **Multi-Platform** | Works on ChatGPT and Google Gemini |
| 🔒 **100% Private** | All processing happens locally—no external servers, no tracking |
| 🎯 **Robust Detection** | 4-tier extraction strategy handles DOM changes gracefully |
| 🔔 **Inline Feedback** | Toast notifications for success/error states—no console needed |

---

## 🚀 Quick Install (1 minute)

### Option 1: Chrome Web Store (Recommended)
> **Coming Soon** – We're submitting to the Chrome Web Store. [Star this repo](https://github.com/amateur-dev/chatgpt-chat-saver-chrome-extension) to get notified!

### Option 2: Manual Installation

1. **Download** the [latest release](https://github.com/amateur-dev/chatgpt-chat-saver-chrome-extension/releases) or clone this repo
2. Open Chrome → `chrome://extensions/`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked** → Select the extension folder
5. Done! The extension icon appears in your toolbar

---

## 📖 Usage

1. Open [ChatGPT](https://chatgpt.com/) or [Gemini](https://gemini.google.com/)
2. Start or open a conversation
3. Click the extension icon in your toolbar
4. Select your **Export Format** (TXT, Markdown, HTML, JSON)
5. Click **💾 Save Chat**
6. File downloads to your default folder!

### Example Filename
```
ChatGPT_Refactor_Plan_GPT-4_2026-01-13_14-30.md
```

### Example Markdown Output
```markdown
# Refactor Plan

> **Platform:** ChatGPT  
> **Model:** GPT-4  
> **Saved:** 1/13/2026, 2:30:00 PM  
> **URL:** https://chatgpt.com/c/abc123  

---

## 👤 User

How should I refactor my authentication module?

---

## 🤖 ChatGPT

Here's a recommended approach...
```

---

## 🔐 Why These Permissions?

| Permission | Reason |
|------------|--------|
| `tabs` | To detect when you're on ChatGPT/Gemini |
| `scripting` | To inject the save functionality into the page |
| `Host: chatgpt.com, chat.openai.com, gemini.google.com` | Only runs on these domains—no access to other sites |

**Privacy Guarantee:** This extension:
- ✅ Never sends data to external servers
- ✅ Never accesses other tabs or websites
- ✅ Never stores or transmits your conversations
- ✅ Works entirely offline after installation

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| **"No conversation found"** | Make sure you have an open conversation with messages visible |
| **Button not responding** | Hard refresh the page (`Cmd+Shift+R` / `Ctrl+Shift+R`) then try again |
| **File not downloading** | Check your browser's download settings; ensure downloads aren't blocked |
| **Extension not appearing** | Go to `chrome://extensions/`, verify it's enabled, click the puzzle icon to pin it |
| **Wrong model detected** | Model detection is best-effort; the DOM may not expose model info |

**Still stuck?** [Open an issue](https://github.com/amateur-dev/chatgpt-chat-saver-chrome-extension/issues/new/choose) with your browser version and console errors.

---

## 🌐 Browser Support

| Browser | Status |
|---------|--------|
| Chrome | ✅ Fully supported |
| Edge | ✅ Works (Chromium-based) |
| Brave | ✅ Works (Chromium-based) |
| Arc | ⚠️ Should work, not officially tested |
| Firefox | ❌ Requires manifest changes (MV3 differences) |
| Safari | ❌ Not supported |

---

## 💡 Workflow Ideas

### Researchers & Academics
Save conversations as **Markdown** for easy import into:
- **Obsidian** – Drop `.md` files into your vault
- **Notion** – Import Markdown directly
- **Zotero** – Attach exports to research notes

### Developers
Export as **JSON** for:
- Programmatic analysis with Python/Node.js
- Fine-tuning dataset preparation
- Integration with local search tools (e.g., `grep`, `jq`)

### Legal & Compliance
Use **HTML** exports for:
- Archival with timestamps and URLs
- Audit trails with embedded metadata
- Print-friendly documentation

---

## 🏗️ Technical Details

### 4-Tier Message Detection Strategy

The extension uses multiple strategies to ensure reliable extraction:

1. **Strategy 1:** `[data-message-id]` attributes (ChatGPT standard)
2. **Strategy 2:** `.group` class selectors (alternative layouts)
3. **Strategy 3:** `[role="main"]` container (semantic HTML)
4. **Strategy 4:** Fallback text extraction (always works)

This ensures the extension continues working even when ChatGPT/Gemini updates their UI.

### File Structure
```
chatgpt-chat-saver-chrome-extension/
├── manifest.json       # Extension manifest (v3)
├── content.js          # Message extraction & formatting
├── popup.html          # Extension popup UI
├── popup.js            # Popup interactions
├── styles.css          # Injected button styling
└── icons/              # Extension icons
```

---

## 📦 Changelog

### v3.0.0 (2026-01-13)
- ✅ **Multiple export formats**: TXT, Markdown, HTML, JSON
- ✅ **Smart filenames** with chat title, model, and timestamp
- ✅ **Metadata headers** in all exports
- ✅ **Toast notifications** for success/error feedback
- ✅ **Overhauled README** with workflows and permissions
- ✅ **GitHub issue templates** for bugs and features

### v2.0.4 (2025-12-16)
- Auto-injection of content script for reliability
- Added `scripting` permission

### v2.0.3 (2025-12-16)
- Added Google Gemini support
- Improved extraction fallbacks

### v2.0.0
- Complete rewrite using native JavaScript
- Changed from PDF to TXT export (no CSP issues)
- Implemented 4-tier message detection

> ⚠️ **Breaking Change (v1 → v2):** PDF export was removed due to CSP restrictions. Use v2+ for reliable exports.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test on both ChatGPT and Gemini
5. Submit a pull request

Please use the [issue templates](https://github.com/amateur-dev/chatgpt-chat-saver-chrome-extension/issues/new/choose) for bug reports and feature requests.

---

## 📄 License

MIT License – see [LICENSE](LICENSE) for details.

---

**Note:** This extension is not affiliated with OpenAI or Google. It's an independent, privacy-focused tool for saving your AI conversations locally.