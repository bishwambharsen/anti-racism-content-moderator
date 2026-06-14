document.addEventListener('DOMContentLoaded', () => {
  const enabledToggle = document.getElementById('enabled-toggle');
  const statusThreshold = document.getElementById('status-threshold');
  const openOptionsBtn = document.getElementById('open-options');

  const defaults = {
    enabled: true,
    threshold: 0.70,
    model: 'gemini-2.0-flash-lite'
  };

  // Load current settings
  chrome.storage.local.get(defaults, (items) => {
    enabledToggle.checked = items.enabled;
    statusThreshold.textContent = parseFloat(items.threshold).toFixed(2);

    let modelName = 'Gemini 2.0 Flash Lite';
    if (items.model === 'gemini-1.5-flash-8b') {
      modelName = 'Gemini 1.5 Flash 8B';
    } else if (items.model === 'gemini-1.5-flash') {
      modelName = 'Gemini 1.5 Flash';
    } else if (items.model === 'gemini-2.0-flash') {
      modelName = 'Gemini 2.0 Flash';
    } else if (items.model === 'gemini-2.5-flash') {
      modelName = 'Gemini 2.5 Flash';
    }

    const statusModeEl = document.getElementById('status-mode');
    if (statusModeEl) {
      statusModeEl.textContent = modelName;
    }
  });

  // Save toggle changes
  enabledToggle.addEventListener('change', () => {
    chrome.storage.local.set({ enabled: enabledToggle.checked }, () => {
      // Notify content script about active status changes
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleActive', enabled: enabledToggle.checked }).catch(() => {
            // Ignore error if content script is not loaded on this tab
          });
        }
      });
    });
  });

  // Open options page
  openOptionsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
});
