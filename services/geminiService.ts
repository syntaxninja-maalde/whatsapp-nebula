import { GoogleGenAI } from "@google/genai";

// We assume the user might not have a Gemini key configured in this frontend-only demo,
// but if they do (via environment or UI), we use it. 
// We also add a check for process.env to avoid crashes in browser environments.

const getAIClient = () => {
  const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) 
    ? process.env.API_KEY 
    : null;
    
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const generateCustomerReply = async (
  history: string[], 
  lastUserMessage: string
): Promise<string> => {
  const ai = getAIClient();
  
  // Fallback for demo if no API key
  if (!ai) {
    await new Promise(resolve => setTimeout(resolve, 1500)); // Fake delay
    return "This is a simulated reply. Add a Gemini API Key to see real AI responses!";
  }

  try {
    const model = 'gemini-2.5-flash';
    const systemInstruction = `
      You are a casual WhatsApp user chatting with a business. 
      Keep your responses short, informal, and realistic. 
      Do not act like a bot. Use emojis occasionally.
      Current context: The business just sent: "${lastUserMessage}".
    `;

    const response = await ai.models.generateContent({
      model,
      contents: lastUserMessage,
      config: {
        systemInstruction,
        maxOutputTokens: 100,
      }
    });

    return response.text || "👍";
  } catch (error) {
    console.error("Gemini generation error:", error);
    return "Thanks for your message! (Auto-reply)";
  }
};
