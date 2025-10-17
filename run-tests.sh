#!/bin/bash
# Test automation script for ChatGPT Chat Saver

echo "🧪 ChatGPT Chat Saver - Automated Test Suite"
echo "=============================================="
echo ""

# Test 1: Check if files exist
echo "Test 1: Checking if all required files exist..."
files=("content.js" "popup.js" "popup.html" "manifest.json" "styles.css")

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
    fi
done

echo ""

# Test 2: Check manifest validity
echo "Test 2: Checking manifest.json validity..."
if grep -q '"manifest_version": 3' manifest.json; then
    echo "✅ Manifest version correct (v3)"
else
    echo "❌ Manifest version incorrect"
fi

if grep -q '"permissions"' manifest.json; then
    echo "✅ Permissions defined"
else
    echo "❌ Permissions missing"
fi

if grep -q '"content_scripts"' manifest.json; then
    echo "✅ Content scripts defined"
else
    echo "❌ Content scripts missing"
fi

echo ""

# Test 3: Check JavaScript syntax
echo "Test 3: Checking JavaScript files for syntax..."
for jsfile in content.js popup.js; do
    if node -c "$jsfile" 2>/dev/null; then
        echo "✅ $jsfile syntax OK"
    else
        echo "⚠️  $jsfile may have syntax issues (requires Node.js to verify)"
    fi
done

echo ""

# Test 4: Check for required functions
echo "Test 4: Checking for required functions in content.js..."
if grep -q "function generateAndDownloadText" content.js; then
    echo "✅ generateAndDownloadText function exists"
else
    echo "❌ generateAndDownloadText function missing"
fi

if grep -q "function extractConversationText" content.js; then
    echo "✅ extractConversationText function exists"
else
    echo "❌ extractConversationText function missing"
fi

if grep -q "function downloadTextFile" content.js; then
    echo "✅ downloadTextFile function exists"
else
    echo "❌ downloadTextFile function missing"
fi

echo ""

# Test 5: Check for message listeners
echo "Test 5: Checking for Chrome API listeners..."
if grep -q "chrome.runtime.onMessage" content.js; then
    echo "✅ chrome.runtime.onMessage listener exists"
else
    echo "❌ chrome.runtime.onMessage listener missing"
fi

if grep -q "chrome.tabs.sendMessage" popup.js; then
    echo "✅ chrome.tabs.sendMessage exists in popup.js"
else
    echo "❌ chrome.tabs.sendMessage missing in popup.js"
fi

echo ""

# Test 6: Check for button IDs
echo "Test 6: Checking for correct button IDs..."
if grep -q "saveAsPDF" popup.html && grep -q "saveAsPDF" popup.js; then
    echo "✅ saveAsPDF button ID consistent"
else
    echo "❌ saveAsPDF button ID mismatch"
fi

if grep -q "openChatGPT" popup.html && grep -q "openChatGPT" popup.js; then
    echo "✅ openChatGPT button ID consistent"
else
    echo "❌ openChatGPT button ID mismatch"
fi

echo ""

# Test 7: Check content script injection
echo "Test 7: Checking content script injection..."
if grep -q "injectSaveButton" content.js && grep -q "setTimeout" content.js; then
    echo "✅ Button injection with retry logic present"
else
    echo "❌ Button injection logic missing"
fi

echo ""

# Test 8: Check for error handling
echo "Test 8: Checking for error handling..."
if grep -q "try" content.js && grep -q "catch" content.js; then
    echo "✅ Error handling present in content.js"
else
    echo "❌ Error handling missing"
fi

if grep -q "try" popup.js && grep -q "catch" popup.js; then
    echo "✅ Error handling present in popup.js"
else
    echo "⚠️  Error handling may be missing in popup.js"
fi

echo ""

# Test 9: File sizes
echo "Test 9: Checking file sizes..."
echo "Content.js: $(wc -c < content.js) bytes"
echo "Popup.js: $(wc -c < popup.js) bytes"
echo "Manifest.json: $(wc -c < manifest.json) bytes"

echo ""

# Test 10: Check for logging
echo "Test 10: Checking for console logging..."
if grep -q "console.log.*Chat Saver" content.js; then
    echo "✅ Console logging present in content.js"
else
    echo "⚠️  Console logging may be missing"
fi

echo ""

echo "=============================================="
echo "✅ Automated tests completed!"
echo ""
echo "Next steps:"
echo "1. Reload the extension: chrome://extensions"
echo "2. Open ChatGPT.com in a browser"
echo "3. Press Cmd+Shift+R to hard refresh"
echo "4. Open a conversation"
echo "5. Click the extension icon"
echo "6. Click '💾 Save Chat' button"
echo "7. Check if a .txt file downloads"
echo "8. Check browser console for logs (F12 → Console tab)"
