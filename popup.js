document.addEventListener('DOMContentLoaded', () => {
  const enabledToggle = document.getElementById('enabled-toggle');
  const statusMode = document.getElementById('status-mode');
  const statusThreshold = document.getElementById('status-threshold');
  const openOptionsBtn = document.getElementById('open-options');

  const defaults = {
    enabled: true,
    mode: 'local',
    threshold: 0.70
  };

  // Load current settings
  chrome.storage.local.get(defaults, (items) => {
    enabledToggle.checked = items.enabled;
    statusMode.textContent = items.mode === 'llm' ? 'Cloud LLM' : 'Local Regex';
    statusThreshold.textContent = parseFloat(items.threshold).toFixed(2);
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
