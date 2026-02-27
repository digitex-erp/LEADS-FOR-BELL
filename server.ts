import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.post("/api/chat/claude", async (req, res) => {
    const { message, history } = req.body;
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "ANTHROPIC_API_KEY is not configured on the server." });
    }

    try {
      const anthropic = new Anthropic({ apiKey });
      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 1024,
        messages: [
          ...history.map((h: any) => ({
            role: h.role === 'model' ? 'assistant' : 'user',
            content: h.text || h.parts?.[0]?.text
          })),
          { role: "user", content: message }
        ],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      res.json({ text });
    } catch (error: any) {
      console.error("Claude API Error:", error);
      res.status(500).json({ error: error.message || "Failed to communicate with Claude" });
    }
  });

  app.post("/api/chat/nvidia", async (req, res) => {
    const { message, history, model } = req.body;
    
    let apiKey = "";
    if (model === "minimaxai/minimax-m2.5") {
      apiKey = process.env.NVIDIA_API_KEY_MINIMAX || "";
    } else if (model === "qwen/qwen3.5-397b-a17b") {
      apiKey = process.env.NVIDIA_API_KEY_QWEN || "";
    } else if (model === "moonshotai/kimi-k2.5") {
      apiKey = process.env.NVIDIA_API_KEY_KIMI || "";
    }

    if (!apiKey) {
      return res.status(500).json({ error: `NVIDIA API Key for ${model} is not configured on the server.` });
    }

    try {
      const invoke_url = "https://integrate.api.nvidia.com/v1/chat/completions";
      
      const payload = {
        model: model,
        messages: [
          ...history.map((h: any) => ({
            role: h.role === 'model' ? 'assistant' : 'user',
            content: h.text
          })),
          { role: "user", content: message }
        ],
        max_tokens: 8192,
        temperature: 0.7,
        top_p: 0.95,
        stream: false, // For simplicity in this demo, we'll use non-streaming
      };

      // Add model-specific config if needed
      if (model === "qwen/qwen3.5-397b-a17b") {
        (payload as any).chat_template_kwargs = { enable_thinking: true };
      } else if (model === "moonshotai/kimi-k2.5") {
        (payload as any).chat_template_kwargs = { thinking: true };
      }

      const response = await fetch(invoke_url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `NVIDIA API error: ${response.statusText}`);
      }

      const data = await response.json();
      const text = data.choices[0].message.content;
      res.json({ text });
    } catch (error: any) {
      console.error("NVIDIA API Error:", error);
      res.status(500).json({ error: error.message || "Failed to communicate with NVIDIA NIM" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    
    app.use(vite.middlewares);

    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith("/api")) return next();

      try {
        const fs = await import("fs");
        const templatePath = path.join(process.cwd(), "index.html");
        let template = fs.readFileSync(templatePath, "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
