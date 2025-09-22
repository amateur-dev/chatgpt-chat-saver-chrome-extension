#!/bin/bash
# Setup script for ChatGPT Chat Saver Chrome Extension
# This script downloads the required client-side libraries

echo "Setting up ChatGPT Chat Saver Chrome Extension..."
echo "=================================================="

# Check if libs directory exists
if [ ! -d "libs" ]; then
    echo "Creating libs directory..."
    mkdir -p libs
fi

# Download jsPDF
echo "Downloading jsPDF library..."
if curl -L -o libs/jspdf.umd.min.js "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"; then
    echo "✓ jsPDF downloaded successfully"
else
    echo "✗ Failed to download jsPDF. Please download manually:"
    echo "  URL: https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
    echo "  Save as: libs/jspdf.umd.min.js"
fi

# Download html2canvas
echo "Downloading html2canvas library..."
if curl -L -o libs/html2canvas.min.js "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"; then
    echo "✓ html2canvas downloaded successfully"
else
    echo "✗ Failed to download html2canvas. Please download manually:"
    echo "  URL: https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"
    echo "  Save as: libs/html2canvas.min.js"
fi

echo ""
echo "Setup complete!"
echo ""
echo "Next steps:"
echo "1. Open Chrome and go to chrome://extensions/"
echo "2. Enable 'Developer mode'"
echo "3. Click 'Load unpacked' and select this directory"
echo "4. Navigate to chat.openai.com and look for the 'Save as PDF' button"
echo ""
echo "For detailed instructions, see README.md"