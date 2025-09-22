#!/bin/bash
# Validation script for ChatGPT Chat Saver Chrome Extension

echo "ChatGPT Chat Saver Extension - Validation Check"
echo "=============================================="

# Check if required files exist
echo "Checking required files..."

required_files=(
    "manifest.json"
    "content.js"
    "styles.css"
    "libs/jspdf.umd.min.js"
    "libs/html2canvas.min.js"
    "icons/icon16.png"
    "icons/icon48.png"
    "icons/icon128.png"
    "README.md"
)

missing_files=()

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ $file"
    else
        echo "✗ $file (missing)"
        missing_files+=("$file")
    fi
done

# Check if libraries are actual files or placeholders
echo ""
echo "Checking library files..."

if grep -q "placeholder" libs/jspdf.umd.min.js 2>/dev/null; then
    echo "⚠ jspdf.umd.min.js is a placeholder - download the actual library"
    echo "  URL: https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
else
    echo "✓ jspdf.umd.min.js appears to be the actual library"
fi

if grep -q "placeholder" libs/html2canvas.min.js 2>/dev/null; then
    echo "⚠ html2canvas.min.js is a placeholder - download the actual library"
    echo "  URL: https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"
else
    echo "✓ html2canvas.min.js appears to be the actual library"
fi

# Validate manifest.json
echo ""
echo "Validating manifest.json..."
if python3 -m json.tool manifest.json > /dev/null 2>&1; then
    echo "✓ manifest.json is valid JSON"
    
    # Check manifest version
    if grep -q '"manifest_version": 3' manifest.json; then
        echo "✓ Using Manifest V3"
    else
        echo "✗ Not using Manifest V3"
    fi
    
    # Check permissions
    if grep -q '"activeTab"' manifest.json; then
        echo "✓ activeTab permission included"
    else
        echo "✗ activeTab permission missing"
    fi
    
    if grep -q 'chat.openai.com' manifest.json; then
        echo "✓ ChatGPT host permission included"
    else
        echo "✗ ChatGPT host permission missing"
    fi
else
    echo "✗ manifest.json has JSON syntax errors"
fi

# Summary
echo ""
echo "Validation Summary:"
if [ ${#missing_files[@]} -eq 0 ]; then
    echo "✓ All required files are present"
else
    echo "✗ Missing files: ${missing_files[*]}"
fi

echo ""
echo "Installation Instructions:"
echo "1. Download the required libraries using setup.sh or manually"
echo "2. Open Chrome and go to chrome://extensions/"
echo "3. Enable 'Developer mode'"
echo "4. Click 'Load unpacked' and select this directory"
echo "5. Navigate to chat.openai.com to test the extension"

echo ""
echo "Privacy Note: This extension processes all data locally and does not"
echo "communicate with any external servers."