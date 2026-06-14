# 🛡️ Semi-Automated Social Media Content Moderator (Manifest V3)

A premium Chrome Extension designed to scan, flag, and facilitate the reporting of hate speech, racism, and xenophobic content on major social platforms (like Reddit and X/Twitter). The extension incorporates a human-in-the-loop automation flow, enabling quick manual reviews before dispatching reports.

---

## ✨ Features

- **Manifest V3 Compliant**: Uses modern service workers, background scripting, and secure content script environments.
- **Real-Time Scanning**: Leverages a debounced `MutationObserver` to efficiently scan comments on page load and during infinite scroll without hurting performance.
- **Dual Classification Engine**:
  - **Option A (Local Check)**: Lightweight, offline keyword matching using regular expressions.
  - **Option B (Cloud LLM)**: Advanced semantic classification powered by **OpenAI (GPT-4o-mini)** or **Google Gemini (Gemini 1.5 Flash)** with custom confidence thresholds.
- **Premium UI Highlights**: Flagged comments are subtly tinted in translucent red with an injected "⚠️ Quick Report" badge showing the AI's confidence score.
- **Human-in-the-Loop Report Automator**: Automates navigating the target platform's multi-step reporting modals, choosing category options, and halting right before final submission to allow human verification.
- **Anti-Bot Avoidance**: Dispatches realistic mouse pointer events with randomized jitter timeouts to prevent website anti-bot systems from flagging automation.
- **Local Testing Sandbox**: Includes a fully interactive, self-contained mock feed (`demo.html`) with a working dropdown options menu and report modal.

---

## 📁 Repository Structure

```text
├── manifest.json      # Extension configuration and permission declarations (MV3)
├── background.js     # Service worker proxying LLM API calls and local rules
├── content.js        # Content script handling DOM scanning, highlighting, and automated clicking
├── styles.css        # Premium UI stylesheet for comment highlights & button injects
├── options.html      # Sleek Outfit-font settings page to configure API keys & selectors
├── options.js        # Logic to save/load configuration data in chrome.storage.local
├── popup.html        # Small extension action popup with active status toggles
├── popup.js          # Synchronizes status toggle with storage & informs content scripts
├── demo.html         # Local sandbox simulating social feeds & reporting flows
└── .gitignore        # Standard git ignore file
```

---

## 🚀 Getting Started

### 1. Installation

1. Open Google Chrome.
2. Navigate to the extensions page at `chrome://extensions/`.
3. Toggle the **Developer mode** switch in the top-right corner.
4. Click **Load unpacked** in the top-left corner.
5. Select the root folder containing the extension files.

### 2. Testing via the Sandbox (Recommended)

To safely test the extension without making edits on live social accounts:
1. Double-click the `demo.html` file in the project folder to open it in Chrome.
2. Observe the page. Comments containing racist keywords or test speech will automatically highlight.
3. Click **⚠️ Quick Report** on any flagged comment. 
4. Watch the script automatically click open options, choose "Hate Speech & Racism" in the modal, advance the screen, and halt for final review.

---

## ⚙️ Configuration Options

Open the Extension Options Page by clicking the extension action icon -> **Configure Settings**:

- **Classification Mode**: Select between local keyword rules (Option A) and Cloud LLMs (Option B).
- **LLM Settings**: Choose your preferred provider (OpenAI or Gemini) and enter your API Key. (Stored securely in `chrome.storage.local`).
- **Confidence Threshold**: Set a decimal threshold (e.g. `0.70`). Only comments flagged with equal or higher confidence will get highlighted.
- **Target CSS Selector**: Customize selector parameters if social platforms update their DOM structure (defaults match Reddit, X/Twitter, and the local sandbox).

---

## 🛡️ Anti-Bot Evasion Implementation

To keep the moderator extension undetected by platform scrapers and anti-bot systems (like Cloudflare or in-house telemetry):

1. **Simulated Event Chains**: Instead of executing standard `.click()` events, the automator dispatches a full pointer sequence: `mousedown` -> `mouseup` -> `click`.
2. **Realistic Coordinates**: Event objects calculate element center positions dynamically, supplying accurate `clientX` and `clientY` coordinates.
3. **Randomized Human Jitter**: Action intervals are padded with randomized delays (`Math.random() * 250`), introducing timing inconsistencies that break bot-like click rhythms.
4. **Human-in-the-Loop Safeguard**: The script halts immediately before the final "Submit" button, ensuring an actual human operator triggers the final network request.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

