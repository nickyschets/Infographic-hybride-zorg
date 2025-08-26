require('dotenv').config();
const express = require('express');
const path = require('path');
const axios = require('axios');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(express.json());

// Serve frontend uit /public map
app.use(express.static(path.join(__dirname, 'public')));

// Eenvoudige rate limiter (30 requests/minuut per IP)
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: "Te veel verzoeken, probeer later opnieuw." }
});
app.use('/api/', limiter);

// API endpoint -> proxy naar Gemini
app.post('/api/gemini', async (req, res) => {
  try {
    const userInput = req.body.input;
    if (!userInput || !userInput.trim()) {
      return res.status(400).json({ error: 'Geen input meegegeven' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'API key ontbreekt op de server' });

    const chatHistory = [
      {
        role: "user",
        parts: [
          {
            text: `Je bent een expert in communicatie in de zorg. 
Schrijf een kort, praktisch communicatiescript of advies voor een zorgverlener die een digitaal consult voert. 
Baseer het advies op de volgende uitdaging: "${userInput}". 
Geef een duidelijke, concrete tip of een voorbeeld van een dialoog. 
Begin direct met de tip of dialoog en gebruik geen inleiding.`
          }
        ]
      }
    ];

    const payload = { contents: chatHistory };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    const response = await axios.post(apiUrl, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 20000
    });

    const data = response.data;
    const extractedText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;

    return res.json({ text: extractedText, raw: data });
  } catch (err) {
    console.error('Gemini API fout:', err.response?.data || err.message);
    return res.status(500).json({ error: 'API-call gefaald', details: err.response?.data || err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server draait op http://localhost:${PORT}`);
});
