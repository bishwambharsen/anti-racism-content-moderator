// Local regex rules for Option A testing (focused on anti-Indian and anti-Hindu hate speech)
const LOCAL_REGEX_RULES = [
  {
    pattern: /\b(hate speech test|this is a test hate speech comment)\b/i,
    score: 0.95,
    reason: "Test keyword match"
  },
  {
    pattern: /\b(street-?shitter|pajeet|curry-?muncher|cow-?piss|cow-?dung|ganga-?bathing|cow-?worshipper)\b/i,
    score: 0.95,
    reason: "Anti-Indian/anti-Hindu derogatory slur detected"
  },
  {
    pattern: /\b(dirty indian|smelly indian|scammer indian|scamming indians|indians are scammer|cow piss drinker)s?\b/i,
    score: 0.90,
    reason: "Xenophobic generalization or slur detected"
  },
  {
    pattern: /\b(heathens?|pagans?|polytheists?|worship.*idols?|worship.*statues?|dirty pagans?)\s+should\s+(be converted|go to hell|burn|be wiped out|die)\b/i,
    score: 0.95,
    reason: "Anti-Hindu religious intolerance or incitement"
  }
];

// Local classifier function (Option A)
function runLocalClassifier(text) {
  for (const rule of LOCAL_REGEX_RULES) {
    if (rule.pattern.test(text)) {
      return {
        isHateSpeech: true,
        confidenceScore: rule.score,
        reason: rule.reason
      };
    }
  }
  return {
    isHateSpeech: false,
    confidenceScore: 0.0,
    reason: "No matching rules"
  };
}

// Gemini API Call
async function callGemini(text, apiKey, model) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `Analyze if this text contains explicit racism, xenophobia, or hate speech targeting Indians, South Asians, or Hindus. Look out for slurs (like pajeet, curry muncher, street shitter), xenophobic tropes about hygiene, accents, or scamming, and religious intolerance targeting Hinduism (like mocking idol worship, cow worship, or incitement).\nText: "${text}"\nRespond ONLY with a valid JSON object matching this schema: {"isHateSpeech": boolean, "confidenceScore": float, "reason": string}. Do not add any markdown wrapper like \`\`\`json.`
        }]
      }],
      generationConfig: {
        responseMimeType: 'application/json'
      }
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API Error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const content = data.candidates[0].content.parts[0].text;
  return JSON.parse(content);
}

// Handle incoming messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeText') {
    // Get stored settings
    chrome.storage.local.get({
      apiKey: '',
      model: 'gemini-2.0-flash-lite',
      threshold: 0.70
    }, async (settings) => {
      try {
        if (!settings.apiKey) {
          throw new Error("Google Gemini API Key is missing. Please save it in the extension settings.");
        }
        
        const result = await callGemini(request.text, settings.apiKey, settings.model);
        const isFlagged = result.isHateSpeech && (result.confidenceScore >= settings.threshold);

        sendResponse({
          success: true,
          result: {
            ...result,
            isFlagged,
            source: 'gemini'
          }
        });
      } catch (err) {
        console.warn(`Anti-Racism Content Reporter: Gemini API check failed (${err.message}). Falling back to local rules.`);
        
        // Run local regex classifier as a self-healing fallback
        const result = runLocalClassifier(request.text);
        const isFlagged = result.isHateSpeech && (result.confidenceScore >= settings.threshold);
        
        sendResponse({
          success: true,
          result: {
            ...result,
            isFlagged,
            source: 'local_fallback',
            fallbackError: err.message
          }
        });
      }
    });

    return true; // Keep message channel open for async response
  }
});
