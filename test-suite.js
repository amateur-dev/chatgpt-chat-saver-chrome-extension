/**
 * Programmatic Test Suite for ChatGPT PDF Saver
 * Run this in the browser console to diagnose issues
 */

class ChatGPTExtensionTester {
  constructor() {
    this.results = [];
    this.errors = [];
  }

  log(test, passed, details = '') {
    const result = {
      test,
      passed,
      details,
      timestamp: new Date().toISOString()
    };
    this.results.push(result);
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${test}${details ? ': ' + details : ''}`);
  }

  // Test 1: Check if we're on ChatGPT
  testOnChatGPT() {
    const url = window.location.href;
    const onChatGPT = url.includes('chatgpt.com') || url.includes('chat.openai.com');
    this.log('On ChatGPT domain', onChatGPT, url.substring(0, 50));
    return onChatGPT;
  }

  // Test 2: Check if conversation exists
  testConversationExists() {
    const strategies = [
      { name: '[data-message-id]', selector: '[data-message-id]' },
      { name: '.group', selector: '.group' },
      { name: '[role="main"]', selector: '[role="main"]' },
      { name: 'main', selector: 'main' }
    ];

    let found = false;
    let foundStrategy = '';

    for (const strategy of strategies) {
      const elements = document.querySelectorAll(strategy.selector);
      if (elements.length > 0) {
        found = true;
        foundStrategy = `${strategy.name} (${elements.length} elements)`;
        this.log(`Found messages via ${strategy.name}`, true, foundStrategy);
        break;
      }
    }

    if (!found) {
      this.log('Found conversation elements', false, 'No messages found via any strategy');
    }

    return found;
  }

  // Test 3: Check if text can be extracted
  testTextExtraction() {
    try {
      const mainContent = document.querySelector('[role="main"]') || 
                         document.querySelector('main') ||
                         document.querySelector('#__next');
      
      if (!mainContent) {
        this.log('Text extraction - main content found', false, 'No main content element');
        return false;
      }

      const text = mainContent.innerText || mainContent.textContent || '';
      const length = text.length;
      
      if (length > 0) {
        this.log('Text extraction', true, `${length} characters extracted`);
        return true;
      } else {
        this.log('Text extraction', false, 'Main content is empty');
        return false;
      }
    } catch (error) {
      this.log('Text extraction', false, error.message);
      return false;
    }
  }

  // Test 4: Check if files can be downloaded
  testDownloadCapability() {
    try {
      const testBlob = new Blob(['test'], { type: 'text/plain' });
      const url = URL.createObjectURL(testBlob);
      
      if (url) {
        this.log('Download capability', true, 'Blob URL created successfully');
        URL.revokeObjectURL(url);
        return true;
      }
    } catch (error) {
      this.log('Download capability', false, error.message);
      return false;
    }
  }

  // Test 5: Check DOM structure
  testDOMStructure() {
    const analysis = {
      bodyHeight: document.body.scrollHeight,
      bodyText: document.body.innerText.length,
      messageElements: {
        dataMessageId: document.querySelectorAll('[data-message-id]').length,
        group: document.querySelectorAll('.group').length,
        article: document.querySelectorAll('[role="article"]').length,
        main: document.querySelectorAll('[role="main"]').length
      }
    };

    const hasSomeMessages = Object.values(analysis.messageElements).some(count => count > 0);
    this.log('DOM structure analysis', hasSomeMessages, JSON.stringify(analysis));
    return analysis;
  }

  // Test 6: Extract sample conversation
  testSampleConversationExtraction() {
    try {
      const messages = document.querySelectorAll('[data-message-id]');
      
      if (messages.length === 0) {
        this.log('Sample conversation extraction', false, 'No messages found');
        return '';
      }

      let sample = '';
      let count = 0;

      messages.forEach((msg) => {
        if (count < 2) {
          const text = msg.innerText || msg.textContent || '';
          if (text.trim()) {
            sample += `\nMessage ${count + 1}:\n${text.substring(0, 100)}...\n`;
            count++;
          }
        }
      });

      if (sample) {
        this.log('Sample conversation extraction', true, `${count} messages found`);
        return sample;
      } else {
        this.log('Sample conversation extraction', false, 'Messages are empty');
        return '';
      }
    } catch (error) {
      this.log('Sample conversation extraction', false, error.message);
      return '';
    }
  }

  // Test 7: Check window.Blob and Blob functionality
  testBlobSupport() {
    try {
      const blob = new Blob(['test content'], { type: 'text/plain' });
      const isBlob = blob instanceof Blob;
      const hasSize = blob.size > 0;
      
      this.log('Blob support', isBlob && hasSize, `Blob size: ${blob.size} bytes`);
      return isBlob && hasSize;
    } catch (error) {
      this.log('Blob support', false, error.message);
      return false;
    }
  }

  // Test 8: Check if extension globals exist
  testExtensionGlobals() {
    const chromeExists = typeof chrome !== 'undefined';
    this.log('Chrome API available', chromeExists, chromeExists ? 'chrome object found' : 'chrome is undefined');
    
    if (chromeExists) {
      const hasRuntime = typeof chrome.runtime !== 'undefined';
      const hasTabs = typeof chrome.tabs !== 'undefined';
      this.log('Chrome.runtime available', hasRuntime);
      this.log('Chrome.tabs available', hasTabs);
    }
    
    return chromeExists;
  }

  // Run all tests
  async runAllTests() {
    console.clear();
    console.log('%c🧪 ChatGPT PDF Saver - Diagnostic Test Suite', 'color: blue; font-size: 16px; font-weight: bold');
    console.log('\n');
    console.log('═'.repeat(60));

    this.testOnChatGPT();
    this.testConversationExists();
    this.testTextExtraction();
    this.testDownloadCapability();
    this.testDOMStructure();
    this.testSampleConversationExtraction();
    this.testBlobSupport();
    this.testExtensionGlobals();

    console.log('\n' + '═'.repeat(60));
    
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;

    console.log(`\n📊 Test Summary:`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Total: ${this.results.length}`);
    console.log(`\n${passed === this.results.length ? '🎉 All tests passed!' : '⚠️ Some tests failed'}`);

    return {
      passed,
      failed,
      total: this.results.length,
      results: this.results,
      exportJSON: () => this.exportResults()
    };
  }

  // Export results as JSON
  exportResults() {
    return JSON.stringify({
      url: window.location.href,
      timestamp: new Date().toISOString(),
      passed: this.results.filter(r => r.passed).length,
      failed: this.results.filter(r => !r.passed).length,
      results: this.results
    }, null, 2);
  }
}

// Create global tester instance
window.chatgptTester = new ChatGPTExtensionTester();

// Log instructions
console.log('%c🧪 ChatGPT PDF Saver Test Suite Ready', 'color: blue; font-size: 16px; font-weight: bold');
console.log('%cRun: window.chatgptTester.runAllTests()', 'color: green; font-size: 14px');
console.log('%cExport: window.chatgptTester.exportResults()', 'color: green; font-size: 14px');
