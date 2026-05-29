import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

import parseHandler from "./api/gemini/parse.js";

dotenv.config();

const app = express();
const PORT = 3000;

// Use Express JSON parser with limit for base64 uploads
app.use(express.json({ limit: '25mb' }));

// API route first: AI Extraction Endpoint
app.post("/api/gemini/parse", async (req, res) => {
  return await parseHandler(req, res);
});

// Serve static elements or hot development middleware
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server listening on http://0.0.0.0:${PORT}`);
  });
}

setupVite();
