# 🔧 Quick Diagnostic Steps

Follow these steps to help me fix the issue:

## Step 1: Reload Extension and Hard Refresh

```
1. chrome://extensions
2. Find "ChatGPT PDF Saver" 
3. Click reload 🔄
4. Go to ChatGPT
5. Press Cmd+Shift+R (Mac) or Ctrl+Shift+F5 (Windows/Linux) to hard refresh
6. Start a new conversation or open existing one
7. Type a message and get a response from ChatGPT
```

## Step 2: Check if Content Script is Loading

```javascript
// Open DevTools: Right-click → Inspect → Console
// Paste this:
typeof window.html2canvas === 'function'

// If true → libraries are loaded ✅
// If false → extension not running ❌
```

## Step 3: Check for Messages on Page

```javascript
// In Console, paste this:
document.querySelectorAll('[data-message-id]').length

// If > 0 → Messages found ✅
// If 0 → Need to check other selectors
```

## Step 4: Run Full Debug Script

```javascript
// Copy the entire contents from DEBUG_SCRIPT.js
// Paste into Console
// Press Enter
// Screenshot the output and send it to me
```

## Step 5: If Still Failing - Inspect HTML Structure

```javascript
// In Console:
const firstMsg = document.querySelector('[data-message-id]');
if (firstMsg) {
  console.log('HTML:', firstMsg.outerHTML.substring(0, 500));
  console.log('Classes:', firstMsg.className);
  console.log('Role:', firstMsg.getAttribute('role'));
} else {
  console.log('No [data-message-id] found, checking alternatives...');
  const alt = document.querySelector('[role="article"]');
  if (alt) console.log('Found [role="article"]:', alt.outerHTML.substring(0, 500));
}
```

## What to Send Me

Please provide:

1. **Screenshot of the error message**
2. **Output from Debug Script** (copy-paste entire console output)
3. **One of these:**
   - Total number of messages found: `document.querySelectorAll('[data-message-id]').length`
   - Or screenshot showing console output with message count

---

## Most Likely Issue: ChatGPT's HTML Changed

ChatGPT frequently updates their HTML. If the debug shows:
- `[data-message-id]: 0`
- But you can see messages on the page

Then we need to update the selectors to match the new HTML structure.

**I can fix this quickly if you:**
1. Run the debug script
2. Send me the output
3. Or inspect one message element and tell me its attributes/classes

---

## Try This Alternative Fix (Temporary)

If you want to test if the issue is just HTML selectors:

1. Open Console (F12)
2. Paste this:

```javascript
// Check what's actually on the page
const allText = document.body.innerText;
console.log('Page text length:', allText.length);
console.log('First 500 chars:', allText.substring(0, 500));

// Check different message selectors
console.log('Selectors found:');
console.log('[data-message-id]:', document.querySelectorAll('[data-message-id]').length);
console.log('[role="article"]:', document.querySelectorAll('[role="article"]').length);  
console.log('.group/conversation-turn:', document.querySelectorAll('.group\\/conversation-turn').length);
console.log('[role="main"]:', document.querySelectorAll('[role="main"]').length);
```

3. Screenshot and send me the output

---

Once you provide the debug info, I can give you the exact fix!
