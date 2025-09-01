const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event, context) => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

  const prompt = JSON.parse(event.body).prompt;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      statusCode: 200,
      body: JSON.stringify({ text: text }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to get response from Gemini API." }),
    };
  }
};
