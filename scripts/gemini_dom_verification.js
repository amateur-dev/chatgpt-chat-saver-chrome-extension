// DOM Verification Script for Gemini
// Paste this into the Console at gemini.google.com to verify selectors

(function verifyGeminiDOM() {
    console.log("🔍 Starting Gemini DOM Verification...");

    // 1. Check Scroll Container
    const scroller = document.querySelector('infinite-scroller[data-test-id="chat-history-container"]');
    if (scroller) {
        console.log("✅ Scroll Container found:", scroller);
    } else {
        console.error("❌ Scroll Container NOT found. Tried: infinite-scroller[data-test-id='chat-history-container']");
    }

    // 2. Check User Queries
    const userQueries = document.querySelectorAll('user-query');
    console.log(`🔎 Found ${userQueries.length} 'user-query' elements.`);
    
    if (userQueries.length > 0) {
        const firstUserQuery = userQueries[0];
        const textDiv = firstUserQuery.querySelector('div.query-text');
        const bubble = firstUserQuery.querySelector('span.user-query-bubble-with-background');
        
        if (textDiv) console.log("✅ User Query Text (div.query-text) found:", textDiv.innerText.substring(0, 50) + "...");
        else if (bubble) console.log("✅ User Query Bubble found:", bubble.innerText.substring(0, 50) + "...");
        else console.warn("⚠️ 'user-query' found but text container (div.query-text) missing.");
    }

    // 3. Check Model Responses
    const modelResponses = document.querySelectorAll('model-response');
    console.log(`🔎 Found ${modelResponses.length} 'model-response' elements.`);

    if (modelResponses.length > 0) {
        const firstResponse = modelResponses[0];
        const markdownPanel = firstResponse.querySelector('.markdown.markdown-main-panel');
        
        if (markdownPanel) {
            console.log("✅ Model Response Text (.markdown.markdown-main-panel) found.");
            console.log("   Preview:", markdownPanel.innerText.substring(0, 50) + "...");
        } else {
            console.warn("⚠️ 'model-response' found but content (.markdown.markdown-main-panel) missing.");
            // Try fallback
            console.log("   Inner HTML of first response:", firstResponse.innerHTML.substring(0, 200));
        }
    }

    // 4. Mutation Observer Test (Run this, then send a message)
    console.log("👀 Attaching MutationObserver to body to watch for new messages...");
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === 1) {
                    if (node.tagName === 'MODEL-RESPONSE' || node.querySelector?.('model-response')) {
                        console.log("🚀 New Model Response detected via Observer!");
                    }
                }
            }
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

})();
