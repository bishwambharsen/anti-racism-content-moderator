// Local regex rules for Option A testing
const LOCAL_REGEX_RULES = [
  {
    pattern: /\b(hate speech test|this is a test hate speech comment)\b/i,
    score: 0.95,
    reason: "Test keyword match"
  },
  {
    pattern: /\b(go back to (your|where you came) country|illegal alien|sub-?human)\b/i,
    score: 0.90,
    reason: "Xenophobic trope detected"
  },
  {
    pattern: /\b(racist|n-word|slurs?|white trash|dirty immigrant|colored people)\b/i,
    score: 0.85,
    reason: "Racial epithet or slur detected"
  },
  {
    pattern: /\b(hate|despise|destroy|kill|hang|lynch)\s+all\s+(black|white|asian|hispanic|jewish|muslim|immigrant)s?\b/i,
    score: 0.98,
    reason: "Explicit hate speech / incitement to violence"
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

// Cloud LLM Classifier (Option B)
async function runLlmClassifier(text, provider, apiKey) {
  if (provider === 'openai') {
    return await callOpenAI(text, apiKey);
  } else if (provider === 'gemini') {
    return await callGemini(text, apiKey);
  } else {
    throw new Error(`Unsupported LLM provider: ${provider}`);
  }
}

// OpenAI API Call (gpt-4o-mini)
async function callOpenAI(text, apiKey) {
  const url = 'https://api.openai.com/v1/chat/completions';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'Analyze if this text contains explicit racism, xenophobia, or hate speech. Respond with a JSON object: {"isHateSpeech": boolean, "confidenceScore": float, "reason": string}. Note: confidenceScore should be a decimal between 0 and 1.'
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.1
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI API Error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  return JSON.parse(content);
}

// Gemini API Call (Gemini 1.5 Flash)
async function callGemini(text, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `Analyze if this text contains explicit racism, xenophobia, or hate speech.\nText: "${text}"\nRespond ONLY with a valid JSON object matching this schema: {"isHateSpeech": boolean, "confidenceScore": float, "reason": string}. Do not add any markdown wrapper like \`\`\`json.`
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
    // Get stored settings first
    chrome.storage.local.get({
      mode: 'local',
      provider: 'openai',
      apiKey: '',
      threshold: 0.70
    }, async (settings) => {
      try {
        let result;
        if (settings.mode === 'local') {
          result = runLocalClassifier(request.text);
        } else {
          if (!settings.apiKey) {
            throw new Error("Cloud LLM mode active but API Key is missing. Check extension options.");
          }
          result = await runLlmClassifier(request.text, settings.provider, settings.apiKey);
        }

        // Include the threshold in comparison
        const isFlagged = result.isHateSpeech && (result.confidenceScore >= settings.threshold);
        sendResponse({
          success: true,
          result: {
            ...result,
            isFlagged
          }
        });
      } catch (err) {
        console.error("Moderator background analysis failed:", err);
        sendResponse({ success: false, error: err.message });
      }
    });

    return true; // Keep message channel open for async response
  }
});
