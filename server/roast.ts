import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import type { Evidence } from "./github.js";

const client = new Anthropic();

export const RoastSchema = z.object({
  archetype: z.string().describe("Funny dev archetype title, e.g. 'Chaotic Evil C++ Goblin'"),
  alignment: z.string().describe("D&D-style alignment, e.g. 'Chaotic Neutral'"),
  spiritEmoji: z.string().describe("One emoji"),
  roast: z.string().describe("3-5 sentence roast based on concrete evidence: repo names, languages, commit messages, hours"),
  drink: z.string().describe("Their signature coding drink"),
  stats: z.object({
    caffeine: z.number().int().min(0).max(100),
    chaos: z.number().int().min(0).max(100),
    sleep: z.number().int().min(0).max(100),
    shipping: z.number().int().min(0).max(100),
    commitPoetry: z.number().int().min(0).max(100),
  }),
  redFlags: z.array(z.string()).min(2).max(4).describe("Short funny red flags from the evidence"),
  compliment: z.string().describe("One genuine, specific compliment to end on a nice note"),
});

export type Roast = z.infer<typeof RoastSchema>;

const SYSTEM = `You are a stand-up comedian who has read too much code. Roast a developer's "coder vibe" from their public GitHub data.
Rules:
- Be specific: reference real repo names, languages, commit messages and coding hours from the evidence.
- Playful, never cruel: tease habits and code, never appearance, identity, or anything personal outside the data.
- If there's very little data, roast the emptiness ("a GitHub profile so clean it could be a hotel room").
- Commit hours are UTC.`;

export async function roast(evidence: Evidence, lang: "en" | "sk"): Promise<Roast | null> {
  const response = await client.beta.messages.parse({
    model: "claude-opus-5-5",
    max_tokens: 16000,
    // If a safety classifier declines, retry server-side on the recommended fallback model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: SYSTEM,
    output_config: { effort: "medium", format: betaZodOutputFormat(RoastSchema) },
    messages: [
      {
        role: "user",
        content: `Write the roast in ${lang === "sk" ? "Slovak" : "English"}.\n\n<evidence>\n${JSON.stringify(evidence, null, 2)}\n</evidence>`,
      },
    ],
  });
  if (response.stop_reason === "refusal") return null;
  return response.parsed_output;
}
