<div align="center">

# 🔥 Roast My Code Vibe

**Drop a GitHub username. AI reads your repos, languages & commit messages — and roasts your coder vibe.**

<img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react"/>
<img src="https://img.shields.io/badge/Express-000?style=for-the-badge&logo=express"/>
<img src="https://img.shields.io/badge/Claude-D97757?style=for-the-badge&logo=anthropic&logoColor=white"/>
<img src="https://img.shields.io/badge/GitHub_API-181717?style=for-the-badge&logo=github"/>

</div>

---

> *"You're a **Chaotic Evil JavaScript Goblin** who commits `fix`, `fix2` and `final fix FR` at 3 AM and has 14 repos named `test`."*

## Features

- 🕵️ **Evidence-based roasts** — pulls profile, repos, languages, recent commit messages and push hours from the GitHub API
- 🎭 **Archetype + D&D alignment**, spirit emoji and signature coding drink
- 📊 **Vibe stats** — caffeine, chaos, sleep, shipping, commit poetry
- 🚩 **Red flags** + one genuine compliment so nobody cries
- 🇬🇧 / 🇸🇰 roast in English or Slovak
- 📋 one-click share text
- ⚡ hour-long cache so the same roast doesn't cost twice

## Quick start

```bash
npm install
cp .env.example .env     # ANTHROPIC_API_KEY (+ optional GITHUB_TOKEN)
npm run dev
```

Open http://localhost:5173. Express and Vite run in **one process** (Vite in middleware mode with HMR).

Production: `npm run build && npm start`.

## Architecture

```
React UI ──POST /api/roast──▶ Express
                               ├─ server/github.ts  → user, repos, public push events
                               └─ server/roast.ts   → Claude structured output (Zod RoastSchema)
```

The roast is a **typed JSON object** (Zod schema → structured outputs), so the UI never has to parse free text.

## License

MIT
