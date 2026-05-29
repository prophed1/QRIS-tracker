import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Configure Vercel Body Parser for large payloads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb',
    },
  },
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { type, base64, mimeType, text } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY environment variable is not configured. Please add it via Secrets."
      });
    }

    let result;

    if (type === 'receipt') {
      if (!base64 || !mimeType) {
        return res.status(400).json({ error: "Missing image data (base64) or mimeType" });
      }

      const promptAI = "Extract data from this bank, QRIS, or transactional receipt (typically Indonesian e-wallet, bank transfer receipt, or business receipt). Ensure you parse the Date, total Amount in IDR, Merchant or Destination, and guess the corresponding Category from the listed options.";

      result = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64
            }
          },
          {
            text: promptAI
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING, description: "Transaction date in 'YYYY-MM-DD' format." },
              amount: { type: Type.NUMBER, description: "Clean numeric total transaction value in IDR. Exclude commas/periods." },
              merchant: { type: Type.STRING, description: "Name of the merchant or destination account. Use 'Unknown Store' if unclear." },
              category: { type: Type.STRING, description: "One of: 'Food & Beverage', 'Groceries', 'Transportation', 'Shopping', 'Bills & Utilities', 'Entertainment', 'Others'." }
            },
            required: ["date", "amount", "merchant", "category"]
          }
        }
      });
    } else if (type === 'text') {
      if (!text) {
        return res.status(400).json({ error: "Missing text transaction history to parse" });
      }

      const promptAI = `Analyze this raw bank transaction history statement or mutation text. Extract transaction details and convert them to structural format. Raw Text:\n"${text}"`;

      result = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptAI,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING, description: "Date of the transaction in 'YYYY-MM-DD' format." },
              amount: { type: Type.NUMBER, description: "Total transaction value in IDR as a clean number." },
              merchant: { type: Type.STRING, description: "Name of the merchant/destination. Use 'Unknown Store' if unclear." },
              category: { type: Type.STRING, description: "One of: 'Food & Beverage', 'Groceries', 'Transportation', 'Shopping', 'Bills & Utilities', 'Entertainment', 'Others'." }
            },
            required: ["date", "amount", "merchant", "category"]
          }
        }
      });
    } else {
      return res.status(400).json({ error: "Invalid extraction type. Must be 'receipt' or 'text'." });
    }

    if (!result || !result.text) {
      return res.status(500).json({ error: "Gemini did not return any parseable content." });
    }

    try {
      const parsedJSON = JSON.parse(result.text);
      return res.json(parsedJSON);
    } catch (parseError) {
      console.error("JSON parse error on Gemini output:", result.text);
      return res.status(500).json({
        error: "Failed to parse JSON result returned from the Gemini AI model.",
        rawText: result.text
      });
    }

  } catch (error: any) {
    console.error("Error in /api/gemini/parse:", error);
    return res.status(500).json({
      error: error.message || "An error occurred during transaction extraction with Gemini AI."
    });
  }
}
