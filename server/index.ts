import Anthropic from "@anthropic-ai/sdk";
import express from "express";
import path from "node:path";
import { collectEvidence, GitHubError } from "./github.js";
import { roast, type Roast } from "./roast.js";

const PORT = Number(process.env.PORT ?? 5173);
const isProd = process.argv.includes("--prod") || process.env.NODE_ENV === "production";
const app = express();
app.use(express.json());

// Roasts are expensive and funny twice — cache them for an hour.
const cache = new Map<string, { at: number; data: unknown }>();
const TTL = 60 * 60 * 1000;

app.post("/api/roast", async (req, res) => {
  const username = String(req.body?.username ?? "").trim().replace(/^@/, "");
  const lang = req.body?.lang === "sk" ? "sk" : "en";
  if (!/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(username)) {
    return res.status(400).json({ error: "That's not a valid GitHub username." });
  }

  const key = `${username.toLowerCase()}:${lang}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return res.json(hit.data);

  try {
    const evidence = await collectEvidence(username);
    const result: Roast | null = await roast(evidence, lang);
    if (!result) return res.status(422).json({ error: "The AI refused to roast this one. Suspicious." });

    const data = { profile: { login: evidence.login, name: evidence.name, avatar: evidence.avatar, languages: evidence.languages }, roast: result };
    cache.set(key, { at: Date.now(), data });
    res.json(data);
  } catch (err) {
    if (err instanceof GitHubError) return res.status(err.status).json({ error: err.message });
    if (err instanceof Anthropic.RateLimitError) return res.status(429).json({ error: "Roast oven is overheating — try again in a minute." });
    if (err instanceof Anthropic.AuthenticationError) return res.status(500).json({ error: "Server is missing a valid ANTHROPIC_API_KEY." });
    if (err instanceof Anthropic.APIError) return res.status(502).json({ error: `AI error (${err.status})` });
    console.error(err);
    res.status(500).json({ error: "Something exploded." });
  }
});

if (isProd) {
  const dist = path.resolve("dist");
  app.use(express.static(dist));
  app.get("/{*splat}", (_req, res) => res.sendFile(path.join(dist, "index.html")));
} else {
  // One process in dev: Vite runs as Express middleware with HMR.
  const { createServer } = await import("vite");
  const vite = await createServer({ server: { middlewareMode: true }, appType: "spa" });
  app.use(vite.middlewares);
}

app.listen(PORT, () => console.log(`🔥 roast-my-vibe on http://localhost:${PORT}`));
