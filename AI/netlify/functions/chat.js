// File: netlify/functions/chat.js

exports.handler = async function (event) {
    // 1. Only allow POST requests
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }
  
    // 2. Get the chat history from the frontend's request
    const { history } = JSON.parse(event.body);
  
    // 3. Securely get the API key from Netlify's environment variables
    const apiKey = process.env.GEMINI_API_KEY;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  
    // 4. Prepare the payload for the Google API
    const systemPromptObject = history.find(turn => turn.role === 'system');
    const systemInstruction = systemPromptObject ? { parts: systemPromptObject.parts } : null;
    const apiHistory = history.filter(turn => turn.role !== 'system');
  
    const payload = {
      contents: apiHistory,
      generationConfig: {
        temperature: 0.8,
        topP: 0.95,
        maxOutputTokens: 800,
      }
    };
  
    if (systemInstruction) {
      payload.systemInstruction = systemInstruction;
    }
  
    try {
      // 5. Make the secure call to the Google API from the backend
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
  
      const result = await response.json();
  
      // 6. Send the response back to the frontend
      return {
        statusCode: 200,
        body: JSON.stringify(result),
      };
    } catch (error) {
      console.error('Error calling Google API:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch response from AI.' }),
      };
    }
  };