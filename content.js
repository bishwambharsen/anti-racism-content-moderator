// Mock extension API fallbacks for standalone page preview testing
if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
  console.log("Moderator Extension: Running in standalone webpage mode (Mock APIs active)");
  window.chrome = {
    storage: {
      local: {
        get: (defaults, cb) => cb(defaults),
        set: (data, cb) => cb && cb()
      }
    },
    runtime: {
      sendMessage: (msg, cb) => {
        if (msg.action === 'analyzeText') {
          // Fallback keyword checker for direct webpage double-click testing
          const localRules = [
            { pattern: /test hate speech/i, score: 0.95 },
            { pattern: /go back to (your country|where (you|they) came from)/i, score: 0.90 }
          ];
          let isFlagged = false;
          let confidenceScore = 0;
          let reason = "None";
          for (const rule of localRules) {
            if (rule.pattern.test(msg.text)) {
              isFlagged = true;
              confidenceScore = rule.score;
              reason = "Mock match";
              break;
            }
          }
          setTimeout(() => {
            cb({ success: true, result: { isFlagged, isHateSpeech: isFlagged, confidenceScore, reason } });
          }, 50);
        }
      },
      onMessage: {
        addListener: () => {}
      }
    }
  };
}

// Configuration & States
let isEnabled = true;
let customSelector = '.comment, [data-testid="tweetText"], .reddit-comment, .mock-comment-text';

let confidenceThreshold = 0.70;
let scanTimeout = null;

// Load initial settings
chrome.storage.local.get({
  enabled: true,
  selector: '.comment, [data-testid="tweetText"], .reddit-comment, .mock-comment-text',
  threshold: 0.70
}, (items) => {
  isEnabled = items.enabled;
  customSelector = items.selector;
  confidenceThreshold = items.threshold;
  if (isEnabled) {
    initModerator();
  }
});

// Listen for toggle updates from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleActive') {
    isEnabled = request.enabled;
    if (isEnabled) {
      scanNewComments();
    } else {
      removeHighlights();
    }
  }
});

// Helper: sleep with randomized human-like jitter
const sleep = (ms) => {
  const jitter = Math.random() * 250; // Add 0-250ms of variance
  return new Promise(resolve => setTimeout(resolve, ms + jitter));
};

// Helper: Dispatch realistic human mouse click event sequence
// Anti-bot detection scripts often look for:
// 1. Missing coordinates (clientX, clientY)
// 2. Missing related pointer/mouse events (mousedown, mouseup)
// 3. Perfect timing (exact intervals)
function humanClick(element) {
  if (!element) return;

  const rect = element.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;

  const eventOpts = {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX: x,
    clientY: y,
    screenX: x + window.screenX,
    screenY: y + window.screenY
  };

  // Dispatch mousedown -> mouseup -> click sequence
  element.dispatchEvent(new MouseEvent('mousedown', eventOpts));
  element.dispatchEvent(new MouseEvent('mouseup', eventOpts));
  element.dispatchEvent(new MouseEvent('click', eventOpts));
}

// Find the parent comment container depending on the platform
function getCommentContainer(el) {
  // X / Twitter
  if (el.closest('article[data-testid="tweet"]')) {
    return el.closest('article[data-testid="tweet"]');
  }
  // Mock Demo Page
  if (el.closest('.mock-comment')) {
    return el.closest('.mock-comment');
  }
  // Reddit Shreddit (new Reddit)
  if (el.closest('shreddit-comment')) {
    return el.closest('shreddit-comment');
  }
  // Reddit Old / Legacy / General
  return el.closest('[data-testid="comment"]') || el.closest('.comment') || el;
}

// Scrape and analyze newly added elements
function scanNewComments() {
  if (!isEnabled) return;

  const commentTextElements = document.querySelectorAll(customSelector);

  commentTextElements.forEach(el => {
    // Avoid double processing
    if (el.getAttribute('data-moderator-processed') === 'true') return;
    el.setAttribute('data-moderator-processed', 'true');

    const text = el.textContent.trim();
    if (!text || text.length < 5) return;

    // Send comment to background worker for classification
    chrome.runtime.sendMessage({ action: 'analyzeText', text }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn("Moderator failed to contact background service:", chrome.runtime.lastError.message);
        return;
      }

      if (response && response.success && response.result.isFlagged) {
        flagComment(el, response.result);
      }
    });
  });
}

// Apply highlighting and inject Quick Report button
function flagComment(textElement, result) {
  const container = getCommentContainer(textElement);
  if (!container) return;

  // Add CSS classes for translucence red tint and border
  container.classList.add('moderator-flagged-comment', 'animate-flag');

  // Prevent duplicate report button injection
  if (container.querySelector('.moderator-report-container')) return;

  // Create UI elements
  const btnContainer = document.createElement('div');
  btnContainer.className = 'moderator-report-container';

  const reportBtn = document.createElement('button');
  reportBtn.className = 'moderator-report-btn';
  reportBtn.innerHTML = `⚠️ Quick Report <span class="moderator-confidence-badge">${Math.round(result.confidenceScore * 100)}%</span>`;
  
  // Stash target elements reference on the button for automated click handler
  reportBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    startAutomatedReport(container, reportBtn);
  });

  const statusLabel = document.createElement('span');
  statusLabel.className = 'moderator-report-status';

  btnContainer.appendChild(reportBtn);
  btnContainer.appendChild(statusLabel);

  // Inject into comment container at the bottom
  container.appendChild(btnContainer);
}

// Remove moderator UI alterations if extension disabled
function removeHighlights() {
  document.querySelectorAll('.moderator-flagged-comment').forEach(el => {
    el.classList.remove('moderator-flagged-comment', 'animate-flag');
  });
  document.querySelectorAll('.moderator-report-container').forEach(el => el.remove());
  document.querySelectorAll('[data-moderator-processed]').forEach(el => {
    el.removeAttribute('data-moderator-processed');
  });
}

// ----------------------------------------------------
// Human-in-the-Loop Automated Report Flows
// ----------------------------------------------------
async function startAutomatedReport(container, button) {
  const status = container.querySelector('.moderator-report-status');
  if (status) status.textContent = 'Starting automated flow...';
  button.disabled = true;

  try {
    // 1. Determine platform and call corresponding report routine
    if (container.classList.contains('mock-comment')) {
      await runMockReportFlow(container, status);
    } else if (container.tagName.toLowerCase() === 'shreddit-comment' || container.closest('shreddit-comment')) {
      await runRedditReportFlow(container, status);
    } else if (container.closest('article[data-testid="tweet"]')) {
      await runXReportFlow(container, status);
    } else {
      throw new Error("Target platform automated reporting not supported on this page.");
    }
  } catch (error) {
    console.error("Automated report flow failed:", error);
    if (status) {
      status.textContent = `Error: ${error.message}`;
      status.className = 'moderator-report-status error';
    }
    button.disabled = false;
  }
}

// Flow A: Mock Demo Page (`demo.html`) Automated Reporting
async function runMockReportFlow(container, status) {
  // Step 1: Click "More Menu" (three dots icon)
  status.textContent = 'Opening options...';
  const menuBtn = container.querySelector('.mock-menu-btn');
  if (!menuBtn) throw new Error("Could not find options menu button.");
  humanClick(menuBtn);

  await sleep(600);

  // Step 2: Click "Report Comment" dropdown menu item
  status.textContent = 'Selecting report option...';
  const reportItem = container.querySelector('.mock-dropdown-item.report-trigger');
  if (!reportItem) throw new Error("Could not find Report item in menu.");
  humanClick(reportItem);

  await sleep(800);

  // Step 3: Find "Hate Speech" category radio input in the modal
  status.textContent = 'Selecting hate speech category...';
  const modal = document.getElementById('mock-report-modal');
  if (!modal) throw new Error("Report modal did not load.");
  
  const hateSpeechOption = modal.querySelector('input[value="hate_speech"]');
  if (!hateSpeechOption) throw new Error("Could not find Hate Speech option.");
  humanClick(hateSpeechOption);

  await sleep(600);

  // Step 4: Click the Next/Continue button
  status.textContent = 'Advancing...';
  const nextBtn = modal.querySelector('.mock-btn-next');
  if (!nextBtn) throw new Error("Could not find Next button in report modal.");
  humanClick(nextBtn);

  await sleep(600);

  // Step 5: Stop right before clicking "Submit"
  status.textContent = 'Ready for review! Click submit.';
  status.className = 'moderator-report-status success';
}

// Flow B: Reddit Automated Reporting
async function runRedditReportFlow(container, status) {
  status.textContent = 'Locating options menu...';
  // Reddit uses shreddit-comment-action-menu. We need to open the overflow menu.
  const menu = container.querySelector('shreddit-comment-action-menu') || container.querySelector('[id^="comment-menu-"]');
  if (!menu) throw new Error("Reddit options menu not found.");
  
  // Find overflow button inside menu
  const menuBtn = menu.querySelector('button') || menu;
  humanClick(menuBtn);
  
  await sleep(700);

  status.textContent = 'Triggering Report modal...';
  // Wait for overlay popover. Look for "Report" text or noun="report"
  const reportBtn = document.querySelector('faceplate-tracker[noun="report"]') || 
                    Array.from(document.querySelectorAll('faceplate-menu-item, button')).find(el => el.textContent.includes('Report'));
  
  if (!reportBtn) throw new Error("Report menu item not found in overlay.");
  humanClick(reportBtn);

  await sleep(1500); // Give Reddit report iframe / dialog modal time to render

  status.textContent = 'Reviewing Report Categories...';
  // Reddit uses an iframe for their report flow or custom shadow DOM modal overlays.
  // Find standard tags. Since we halt before submission, let's navigate:
  const dialog = document.querySelector('dialog, role=["dialog"]') || document.querySelector('.report-flow-modal');
  
  // Search for the category input.
  let hateOption = null;
  if (dialog) {
    hateOption = Array.from(dialog.querySelectorAll('span, label, div')).find(el => el.textContent.toLowerCase().includes('hate'));
  }
  
  if (hateOption) {
    humanClick(hateOption);
    await sleep(800);
    // Find next button to advance
    const nextBtn = Array.from(dialog.querySelectorAll('button')).find(el => el.textContent.includes('Next') || el.textContent.includes('Submit'));
    if (nextBtn) {
      status.textContent = 'Ready for review. Submit manually.';
      status.className = 'moderator-report-status success';
      // Highlight the next button so the user can easily see it
      nextBtn.style.outline = '3px solid #ef4444';
      nextBtn.focus();
    }
  } else {
    // If nested in an iframe
    const iframe = document.querySelector('iframe[src*="report"]');
    if (iframe && iframe.contentDocument) {
      const doc = iframe.contentDocument;
      const option = Array.from(doc.querySelectorAll('span, label, div')).find(el => el.textContent.toLowerCase().includes('hate'));
      if (option) {
        humanClick(option);
        status.textContent = 'Ready for review. Submit manually in iframe.';
        status.className = 'moderator-report-status success';
        return;
      }
    }
    throw new Error("Could not automatically locate report categories. Please finish manually.");
  }
}

// Flow C: X/Twitter Automated Reporting
async function runXReportFlow(container, status) {
  status.textContent = 'Locating tweet action menu...';
  // X tweets have a three-dot menu button ([data-testid="caret"])
  const caretBtn = container.querySelector('[data-testid="caret"]');
  if (!caretBtn) throw new Error("Tweet caret options button not found.");
  humanClick(caretBtn);

  await sleep(700);

  status.textContent = 'Clicking report post...';
  // Find dropdown menu item text containing "Report post"
  const dropdownItems = Array.from(document.querySelectorAll('[role="menuitem"]'));
  const reportItem = dropdownItems.find(el => el.textContent.includes('Report'));
  if (!reportItem) throw new Error("Could not find Report option in dropdown menu.");
  humanClick(reportItem);

  await sleep(1500); // X report modal load time is usually slow

  status.textContent = 'Selecting hate category...';
  // Find the category tags
  const modal = document.querySelector('[role="dialog"]');
  if (!modal) throw new Error("Report modal not found.");

  // Look for text matching Hate Speech / Hate
  const hateCategory = Array.from(modal.querySelectorAll('span, div')).find(el => el.textContent.toLowerCase().includes('hate'));
  if (hateCategory) {
    humanClick(hateCategory);
    status.textContent = 'Categorized. Please complete manual verification.';
    status.className = 'moderator-report-status success';
  } else {
    status.textContent = 'Modal loaded. Choose category and submit.';
    status.className = 'moderator-report-status success';
  }
}

// ----------------------------------------------------
// Extension Initialization and Observation
// ----------------------------------------------------
function initModerator() {
  // 1. Initial page scan
  scanNewComments();

  // 2. Setup MutationObserver with debounce to capture scroll loads without performance hit
  const observer = new MutationObserver((mutations) => {
    if (!isEnabled) return;
    
    clearTimeout(scanTimeout);
    scanTimeout = setTimeout(scanNewComments, 250);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}
