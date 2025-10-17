// Debug script for ChatGPT PDF Saver
// Run this in the browser console while on a ChatGPT conversation page

console.log('=== ChatGPT PDF Saver Debug Info ===');

// Check page structure
console.log('\n1. Basic DOM Structure:');
console.log('- Elements with [role="main"]:', document.querySelectorAll('[role="main"]').length);
console.log('- Elements with <main> tag:', document.querySelectorAll('main').length);
console.log('- Elements with [data-message-id]:', document.querySelectorAll('[data-message-id]').length);
console.log('- Elements with [role="article"]:', document.querySelectorAll('[role="article"]').length);
console.log('- Elements with .group/conversation-turn:', document.querySelectorAll('.group\\/conversation-turn').length);

// Check for message content
console.log('\n2. Message Content:');
const allTextElements = document.querySelectorAll('[role="article"], [data-message-id]');
if (allTextElements.length > 0) {
    console.log(`Found ${allTextElements.length} potential message elements`);
    console.log('First element class:', allTextElements[0].className);
    console.log('First element attributes:', Array.from(allTextElements[0].attributes).map(a => a.name + '="' + a.value + '"').join(', '));
}

// Check main content area
console.log('\n3. Main Content Area:');
const mainArea = document.querySelector('[role="main"]') || document.querySelector('main');
if (mainArea) {
    console.log('Main area found');
    console.log('Main area classes:', mainArea.className);
    console.log('Main area text length:', (mainArea.innerText || mainArea.textContent).length);
} else {
    console.log('No main area found - this is likely the problem!');
}

// Check for conversation container
console.log('\n4. Conversation Container Candidates:');
const candidates = document.querySelectorAll('.flex.flex-col, .flex-1, [class*="conversation"]');
console.log('Potential containers found:', candidates.length);
candidates.forEach((el, i) => {
    if (i < 5) { // Show first 5
        console.log(`  [${i}] Classes: ${el.className.substring(0, 100)}`);
    }
});

// Try to find actual messages
console.log('\n5. Actual Message Detection:');
const messages = document.querySelectorAll('[data-message-id], .group\\/conversation-turn, [role="article"]');
console.log('Total potential messages:', messages.length);
if (messages.length > 0) {
    console.log('First message preview:', messages[0].innerText?.substring(0, 100));
    console.log('Message sender detection:');
    const isUser = messages[0].querySelector('[data-message-author-role="user"]');
    console.log('  - Has [data-message-author-role]:', !!isUser);
}

// Alert the user with findings
if (messages.length === 0) {
    console.error('❌ NO MESSAGES FOUND - This is why PDF generation fails!');
    console.log('\nPossible causes:');
    console.log('1. You may not have an active conversation');
    console.log('2. ChatGPT HTML structure has changed');
    console.log('3. Messages are in an iframe (less likely)');
} else {
    console.log('✅ Messages found! The issue might be elsewhere.');
}

console.log('\n=== End Debug ===');
