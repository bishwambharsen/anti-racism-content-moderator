document.addEventListener('DOMContentLoaded', () => {
  const modeSelect = document.getElementById('mod-mode');
  const llmSection = document.getElementById('llm-section');
  const providerSelect = document.getElementById('llm-provider');
  const apiKeyInput = document.getElementById('api-key');
  const thresholdInput = document.getElementById('threshold');
  const thresholdVal = document.getElementById('threshold-val');
  const selectorInput = document.getElementById('custom-selector');
  const settingsForm = document.getElementById('settings-form');
  const btnReset = document.getElementById('btn-reset');
  const statusMsg = document.getElementById('status-msg');

  // Default values
  const defaults = {
    mode: 'local',
    provider: 'openai',
    apiKey: '',
    threshold: 0.70,
    selector: '.comment, [data-testid="tweetText"], .reddit-comment, .mock-comment-text'
  };

  // Toggle LLM settings visibility
  const toggleLlmSection = () => {
    if (modeSelect.value === 'llm') {
      llmSection.classList.remove('hidden');
    } else {
      llmSection.classList.add('hidden');
    }
  };

  modeSelect.addEventListener('change', toggleLlmSection);

  // Update slider label
  thresholdInput.addEventListener('input', () => {
    thresholdVal.textContent = parseFloat(thresholdInput.value).toFixed(2);
  });

  // Load saved settings
  const loadSettings = () => {
    chrome.storage.local.get(defaults, (items) => {
      modeSelect.value = items.mode;
      providerSelect.value = items.provider;
      apiKeyInput.value = items.apiKey;
      thresholdInput.value = items.threshold;
      thresholdVal.textContent = parseFloat(items.threshold).toFixed(2);
      selectorInput.value = items.selector;
      toggleLlmSection();
    });
  };

  // Save settings
  settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const settings = {
      mode: modeSelect.value,
      provider: providerSelect.value,
      apiKey: apiKeyInput.value.trim(),
      threshold: parseFloat(thresholdInput.value),
      selector: selectorInput.value.trim()
    };

    if (settings.mode === 'llm' && !settings.apiKey) {
      showStatus('API Key is required when using LLM mode!', 'error');
      return;
    }

    chrome.storage.local.set(settings, () => {
      showStatus('Settings saved successfully!', 'success');
    });
  });

  // Reset to defaults
  btnReset.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      chrome.storage.local.set(defaults, () => {
        loadSettings();
        showStatus('Settings reset to defaults.', 'success');
      });
    }
  });

  const showStatus = (msg, type) => {
    statusMsg.textContent = msg;
    statusMsg.className = type;
    setTimeout(() => {
      statusMsg.className = '';
      statusMsg.textContent = '';
    }, 3000);
  };

  loadSettings();
});
