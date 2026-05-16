const https = require('https');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash';

async function callGemini(prompt) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }

  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
    }
  });

  return new Promise((resolve, reject) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const urlObj = new URL(url);

    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            reject(new Error(parsed.error.message || 'Gemini API error'));
            return;
          }
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const tokensUsed = parsed.usageMetadata?.totalTokenCount || 0;
          resolve({ text, tokensUsed });
        } catch (e) {
          reject(new Error('Failed to parse Gemini response'));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function generateAISummary(content, title = '') {
  const prompt = `You are a helpful assistant. Analyze the following note and return ONLY a valid JSON object with no markdown, no code blocks, just raw JSON.

Note Title: ${title}
Note Content: ${content}

Return exactly this JSON structure:
{
  "summary": "A concise 2-3 sentence summary of the note content",
  "action_items": ["action item 1", "action item 2"],
  "suggested_title": "A better, more descriptive title for this note"
}

Rules:
- summary: 2-3 clear sentences
- action_items: array of 0-5 specific, actionable tasks found in the content. Empty array if none.
- suggested_title: a short, descriptive title (max 8 words)
- Return ONLY valid JSON, no other text`;

  const { text, tokensUsed } = await callGemini(prompt);

  let result;
  try {
    // Clean potential markdown code blocks
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    result = JSON.parse(cleaned);
  } catch (e) {
    // Fallback: extract what we can
    result = {
      summary: text.slice(0, 300),
      action_items: [],
      suggested_title: title || 'AI Summary'
    };
  }

  return {
    summary: result.summary || '',
    action_items: Array.isArray(result.action_items) ? result.action_items : [],
    suggested_title: result.suggested_title || title,
    tokens_used: tokensUsed
  };
}

module.exports = { generateAISummary, callGemini };
