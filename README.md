# 🛡️ Semi-Automated Social Media Content Moderator (Anti-Indian/Anti-Hindu Filter)

A premium Manifest V3 Chrome Extension designed to detect, highlight, and facilitate quick reporting of anti-Indian racism and anti-Hindu religious hate speech on major social platforms (like Reddit and X/Twitter). 

The classification engine is exclusively powered by **Google Gemini 1.5 Flash**, analyzing subtle contexts, slurs, xenophobia, and religious bigotry often missed by generic platform moderation algorithms.

---

## ✨ Features

- **Manifest V3 Compliant**: Developed using service worker architecture and secure content scripts.
- **AI Classification Layer**: Connects to **Google Gemini (Gemini 1.5 Flash)** with custom system prompts that instruct the model to scan for anti-Indian and anti-Hindu slurs (*pajeet*, *curry-muncher*, *street-shitter*, etc.), xenophobic stereotypes (hygiene, scamming), and religious bigotry (idol worship mockery, conversion threats).
- **Real-Time Scanning**: Uses a debounced `MutationObserver` to automatically scan comments during scroll/navigation.
- **Premium UI Highlights**: Visually tints violating comments in a soft translucent red and injects a "⚠️ Quick Report" button displaying the detection confidence.
- **Human-in-the-Loop Report Automator**: Automatically clicks open options menus, selects "Hate Speech" in the native platform report flow, and halts right before final submission.
- **Anti-Bot Avoidance**: Dispatches coordinates-based pointer events with randomized jitter delays.
- **Local Testing Sandbox**: Includes a sandbox page (`demo.html`) pre-loaded with anti-Indian/anti-Hindu comments and neutral control comments to verify LLM accuracy.

---

## 📁 Repository Structure

```text
├── manifest.json      # Extension configuration and permission declarations (MV3)
├── background.js     # Service worker handling Gemini API fetch and classification logic
├── content.js        # Content script handling DOM scanning, highlighting, and automated clicking
├── styles.css        # Premium UI stylesheet for comment highlights & button injects
├── options.html      # Sleek Outfit-font settings page to configure your Gemini API Key
├── options.js        # Logic to save/load Gemini settings in chrome.storage.local
├── popup.html        # Small extension action popup with active status toggles
├── popup.js          # Synchronizes status toggle with storage & informs content scripts
├── demo.html         # Local sandbox simulating social feeds & reporting flows
├── LICENSE           # MIT License
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

### 2. Enter your Gemini API Key

1. Click the extension puzzle piece icon 🧩 next to your profile picture.
2. Click **Semi-Automated Content Moderator** to open the quick controls.
3. Click **Configure Settings**.
4. Paste your **Google Gemini API Key** and hit **Save Settings**. (Stored securely in `chrome.storage.local`).

### 3. Testing via the Sandbox

To safely test the extension's live classification:
1. Open the sandbox file `demo.html` in Chrome:
   `chrome-extension://<EXTENSION-ID>/demo.html` (Or double-click the file to open `file:///Users/bishwambharsen/Projects/Anti-racism%20Social%20Media%20Plugin/demo.html`).
2. Observe the page. The extension will send the comment texts to Gemini.
3. Anti-Indian/anti-Hindu comments will highlight, while positive and anti-hate references to India/Hinduism remain clean.
4. Click **⚠️ Quick Report** on either flagged comment to watch the automated menu and modal selection flow!

---

## ⚙️ Configuration Options

Open the Extension Options Page by clicking the extension action icon -> **Configure Settings**:

- **Google Gemini API Key**: Securely store your API key.
- **Confidence Threshold**: Set a decimal threshold (e.g. `0.70`). Only comments flagged by Gemini with equal or higher confidence will get highlighted.
- **Target CSS Selector**: Customize selector parameters if social platforms update their DOM structure (defaults match Reddit, X/Twitter, and the local sandbox).

---

## 🛡️ Anti-Bot Evasion Implementation

To keep the moderator extension undetected by platform scrapers and anti-bot systems:

1. **Simulated Event Chains**: Instead of executing standard `.click()` events, the automator dispatches a full pointer sequence: `mousedown` -> `mouseup` -> `click`.
2. **Realistic Coordinates**: Event objects calculate element center positions dynamically, supplying accurate `clientX` and `clientY` coordinates.
3. **Randomized Human Jitter**: Action intervals are padded with randomized delays (`Math.random() * 250`), introducing timing inconsistencies that break bot-like click rhythms.
4. **Human-in-the-Loop Safeguard**: The script halts immediately before the final "Submit" button, ensuring an actual human operator triggers the final network request.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
