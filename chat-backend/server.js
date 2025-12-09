import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Groq } from "groq-sdk";

dotenv.config();

const app = express();
app.use(cors()); // adjust origin later for production
app.use(express.json({ limit: "1mb" }));
const PORT = process.env.PORT || 5000;
const client = new Groq({
  apiKey: process.env.GROQ_API_KEY
});
// const PORT = process.env.PORT || 5000;
// const client = new GroqClient({
//   apiKey: process.env.GROQ_API_KEY,
// });
// const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Basic health
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body; // history optional

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: "Empty message" });
    }

    // Build messages array — system prompt + optional history
    const messages = [
      { role: "system", content: "You are a helpful assistant for a software developer portfolio site. Keep answers concise and friendly." }
    ];

    // If the frontend provided conversation history, append it
    if (Array.isArray(history)) {
      // expect items like { role:"user"|"assistant", content: "..." }
      messages.push(...history);
    }

    messages.push({ role: "user", content: message });

    // const response = await groq.chat.completions.create({
    //   model: "llama3-16k",
    //   messages
    // });
    //const model = process.env.GROQ_MODEL || "llama3-16k";

    // const response = await groq.chat({
    // model: model,
    // messages: [{ role: "system", content: "You are a helpful assistant." },
    // { role: "user", content: "Hello!" }],
    // });

    // const response = await client.responses.create({
    // model: process.env.GROQ_MODEL || "llama3-16k",
    // input: [
    //     { role: "system", content: "You are a helpful assistant." },
    //     { role: "user", content: "Hello!" }
    // ]
    // });
    const model = process.env.GROQ_MODEL || "llama3-16k";

    const response = await client.chat.completions.create({
    model: model,
    messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: message }
    ]
    });
    // Depending on SDK response shape; choose main text
    const botText = response?.choices?.[0]?.message?.content ?? JSON.stringify(response);

    return res.json({ reply: botText });
  } catch (err) {
    console.error("Chat error:", err);
    return res.status(500).json({ error: "Server error", details: err.message || err });
  }
});

app.listen(PORT, () => console.log(`Chat backend running on port ${PORT}`));
