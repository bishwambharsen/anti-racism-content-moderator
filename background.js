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
      threshold: 0.70
    }, async (settings) => {
      try {
        if (!settings.apiKey) {
          throw new Error("Google Gemini API Key is missing. Please save it in the extension settings.");
        }
        
        const result = await callGemini(request.text, settings.apiKey);
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
