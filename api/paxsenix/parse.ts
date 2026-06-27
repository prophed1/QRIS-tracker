import { Request, Response } from "express";

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { type, base64, mimeType, text } = req.body;

    if (!process.env.PAXSENIX_API_KEY) {
      return res.status(500).json({
        error: "PAXSENIX_API_KEY environment variable is not configured. Please add it via Settings > Secrets."
      });
    }

    let resultJson;

    if (type === 'receipt') {
      if (!base64 || !mimeType) {
        return res.status(400).json({ error: "Missing image data (base64) or mimeType" });
      }

      const prompt = "Extract data from this bank, QRIS, or transactional receipt. Ensure you parse the Date, total Amount in IDR, Merchant or Destination, and guess the corresponding Category from the listed options. Please extract 'notes' if there are any specific descriptions/remarks. Output strictly in JSON with fields: 'date' (YYYY-MM-DD), 'amount' (number), 'merchant' (string), 'category' (string), 'notes' (string, optional). Category must be one of: 'Food & Beverage', 'Groceries', 'Transportation', 'Shopping', 'Bills & Utilities', 'Entertainment', 'Others'.";

      const paxsenixResponse = await fetch("https://api.paxsenix.org/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.PAXSENIX_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o", // Assume proxy supports gpt-4o for vision
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType};base64,${base64}`
                  }
                }
              ]
            }
          ],
          response_format: { type: "json_object" }
        })
      });

      if (!paxsenixResponse.ok) {
        const errText = await paxsenixResponse.text();
        throw new Error(`Paxsenix API Error: ${paxsenixResponse.status} ${errText}`);
      }

      const data = await paxsenixResponse.json();
      resultJson = data.choices[0]?.message?.content;

    } else if (type === 'text') {
      if (!text) {
        return res.status(400).json({ error: "Missing text transaction history to parse" });
      }

      const prompt = `Analyze this raw bank transaction history statement or mutation text. Extract transaction details and convert them to structural format. Raw Text:\n"${text}"\n\nOutput strictly in JSON with fields: 'date' (YYYY-MM-DD), 'amount' (number), 'merchant' (string), 'category' (string), 'notes' (string, optional). Category must be one of: 'Food & Beverage', 'Groceries', 'Transportation', 'Shopping', 'Bills & Utilities', 'Entertainment', 'Others'.`;

      const paxsenixResponse = await fetch("https://api.paxsenix.org/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.PAXSENIX_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          response_format: { type: "json_object" }
        })
      });

      if (!paxsenixResponse.ok) {
        const errText = await paxsenixResponse.text();
        throw new Error(`Paxsenix API Error: ${paxsenixResponse.status} ${errText}`);
      }

      const data = await paxsenixResponse.json();
      resultJson = data.choices[0]?.message?.content;
    } else {
      return res.status(400).json({ error: "Invalid extraction type. Must be 'receipt' or 'text'." });
    }

    if (!resultJson) {
      return res.status(500).json({ error: "Paxsenix API did not return any parseable content." });
    }

    try {
      let cleanJson = resultJson;
      const jsonBlockMatch = cleanJson.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (jsonBlockMatch) {
        cleanJson = jsonBlockMatch[1];
      } else {
        // Fallback: try to find the first { and last }
        const firstBrace = cleanJson.indexOf('{');
        const lastBrace = cleanJson.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          cleanJson = cleanJson.slice(firstBrace, lastBrace + 1);
        }
      }
      
      const parsedJSON = JSON.parse(cleanJson);
      return res.json(parsedJSON);
    } catch (parseError) {
      console.error("JSON parse error on Paxsenix output:", resultJson);
      return res.status(500).json({
        error: "Failed to parse JSON result returned from the Paxsenix API.",
        rawText: resultJson
      });
    }

  } catch (error: any) {
    console.error("Error in /api/paxsenix/parse:", error);
    return res.status(500).json({
      error: error.message || "An error occurred during transaction extraction with Paxsenix API."
    });
  }
}
