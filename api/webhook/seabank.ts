import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

// Setup Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: { 'User-Agent': 'aistudio-build' }
  }
});

// Setup Supabase (Admin/Service Role recommended for webhooks if bypassing RLS, 
// but Anon Key works if RLS allows inserts)
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Expecting the webhook to send us the email subject and plain text body
    const { subject, body, date } = req.body;

    if (!body) {
      return res.status(400).json({ error: "Missing email body payload." });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "System missing GEMINI API configuration." });
    }

    // 1. Send the email body to Gemini to parse strictly as SeaBank format
    const promptAI = `You are a financial parser. Read this SeaBank transaction notification email text.
    Extract the transaction details and format them exactly according to the schema.
    If it's not a money-out transaction or expense, you can still parse it but categorize accordingly.
    
    Email Subject: ${subject || 'No Subject'}
    Date Info: ${date || 'No Date'}
    
    Email Body:
    """
    ${body}
    """
    `;

    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptAI,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            date: { type: Type.STRING, description: "Transaction date in 'YYYY-MM-DD' format." },
            amount: { type: Type.NUMBER, description: "Total transaction value in IDR as a clean numeric value." },
            merchant: { type: Type.STRING, description: "Name of the merchant/recipient from the email." },
            category: { type: Type.STRING, description: "One of: 'Food & Beverage', 'Groceries', 'Transportation', 'Shopping', 'Bills & Utilities', 'Entertainment', 'Others'." },
            isExpense: { type: Type.BOOLEAN, description: "True if this is money going OUT. False if it is money coming IN (deposit/transfer received)." }
          },
          required: ["date", "amount", "merchant", "category", "isExpense"]
        }
      }
    });

    if (!result || !result.text) {
      return res.status(500).json({ error: "Gemini parsing failed." });
    }

    const parsedTx = JSON.parse(result.text);

    // If it's not an expense (e.g. someone sent you money), you might want to skip or handle differently.
    // For now, we'll log it or insert it anyway. Optional: add a check here.
    if (!parsedTx.isExpense) {
       return res.status(200).json({ message: "Ignored, transaction is an income, not an expense", parsedTx });
    }

    // Clean up payload for Supabase insertion
    const insertPayload = {
      date: parsedTx.date,
      amount: parsedTx.amount,
      merchant: parsedTx.merchant,
      category: parsedTx.category
    };

    // 2. Insert directly into Supabase
    const { data: insertedData, error: dbError } = await supabase
      .from('transactions')
      .insert([insertPayload])
      .select();

    if (dbError) {
      console.error("Supabase Error:", dbError);
      return res.status(500).json({ error: "Failed to persist transaction to DB", details: dbError });
    }

    return res.status(200).json({ 
      success: true, 
      message: "SeaBank transaction parsed and saved!",
      transaction: insertedData 
    });

  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return res.status(500).json({
      error: error.message || "An error occurred during webhook processing."
    });
  }
}
