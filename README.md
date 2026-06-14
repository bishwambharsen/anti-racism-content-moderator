# 🛡️ Semi-Automated Social Media Content Moderator (Anti-Indian/Anti-Hindu Filter)

A premium Manifest V3 Chrome Extension designed to detect, highlight, and facilitate quick reporting of anti-Indian racism and anti-Hindu religious hate speech on major social platforms (like Reddit and X/Twitter). The extension fills a gap in platform-native moderation by targeting slurs, xenophobic tropes, and religious bigotry often missed by general moderation algorithms.

---

## ✨ Features

- **Manifest V3 Compliant**: Developed using service worker architecture and secure content scripts.
- **Specialized Detection Engine**:
  - **Option A (Local Check)**: Lightweight regex rules targeting common anti-Indian slurs (e.g. *pajeet*, *curry-muncher*, hygiene tropes) and anti-Hindu religious intolerance.
  - **Option B (Cloud LLM)**: Connects to **OpenAI (GPT-4o-mini)** or **Google Gemini (Gemini 1.5 Flash)** with custom system prompts that direct the AI to analyze subtle context, xenophobia, and dog whistles targeting South Asian/Hindu demographics.
- **Real-Time Scanning**: Uses a debounced `MutationObserver` to automatically scan comments during scroll/navigation.
- **Premium UI Highlights**: Visually tints violating comments in a soft translucent red and injects a "⚠️ Quick Report" button displaying the detection confidence.
- **Human-in-the-Loop Report Automator**: Automatically clicks open options menus, selects "Hate Speech" in the native platform report flow, and halts right before final submission.
- **Anti-Bot Avoidance**: Dispatches coordinates-based pointer events with randomized jitter delays.
- **Local Testing Sandbox**: Includes a fully interactive sandbox (`demo.html`) pre-loaded with anti-Indian/anti-Hindu comments, neutral control comments, and simulated reporting modals.

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
2. Observe the page. Comments 3 (anti-Indian slur/scam stereotype) and 5 (anti-Hindu religious bigotry) will automatically highlight, while comments 1, 2, and 4 (including positive and anti-racism references to India/Hinduism) remain untouched to verify there are no false positives.
3. Click **⚠️ Quick Report** on either flagged comment. 
4. Watch the script automatically click open the comment dropdown menu, select "Report Comment", open the modal, select "Hate Speech & Racism", advance the screen, and halt for final manual review.

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

