import { useEffect, useState } from "react";

interface Result {
  profile: { login: string; name: string | null; avatar: string; languages: Record<string, number> };
  roast: {
    archetype: string;
    alignment: string;
    spiritEmoji: string;
    roast: string;
    drink: string;
    stats: Record<"caffeine" | "chaos" | "sleep" | "shipping" | "commitPoetry", number>;
    redFlags: string[];
    compliment: string;
  };
}

const LOADING_LINES = [
  "reading your commit messages… oh no",
  "counting your unfinished side projects",
  "checking what time you push code",
  "judging your variable names",
  "preheating the roast oven 🔥",
  "asking your node_modules how they feel",
];

const STAT_LABELS: Record<keyof Result["roast"]["stats"], string> = {
  caffeine: "☕ caffeine",
  chaos: "🌀 chaos",
  sleep: "😴 sleep",
  shipping: "🚀 shipping",
  commitPoetry: "📝 commit poetry",
};

export function App() {
  const [username, setUsername] = useState("");
  const [lang, setLang] = useState<"en" | "sk">("en");
  const [loading, setLoading] = useState(false);
  const [line, setLine] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setLine((l) => (l + 1) % LOADING_LINES.length), 1400);
    return () => clearInterval(t);
  }, [loading]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, lang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      setError((err as Error).message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function share() {
    if (!result) return;
    const text = `${result.roast.spiritEmoji} I'm a "${result.roast.archetype}" (${result.roast.alignment}) according to Roast My Code Vibe 🔥\n\n"${result.roast.redFlags[0]}"`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const topLangs = result
    ? Object.entries(result.profile.languages).sort((a, b) => b[1] - a[1]).slice(0, 5)
    : [];

  return (
    <main>
      <header>
        <h1>
          Roast My <span>Code Vibe</span> 🔥
        </h1>
        <p>Drop a GitHub username. The AI reads your repos, languages & commit messages — and judges you.</p>
      </header>

      <form onSubmit={submit}>
        <div className="input">
          <span>github.com/</span>
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="torvalds" autoFocus />
        </div>
        <div className="lang">
          {(["en", "sk"] as const).map((l) => (
            <button type="button" key={l} className={lang === l ? "on" : ""} onClick={() => setLang(l)}>
              {l === "en" ? "🇬🇧 EN" : "🇸🇰 SK"}
            </button>
          ))}
        </div>
        <button className="go" disabled={loading}>
          {loading ? "roasting…" : "Roast me 🔥"}
        </button>
      </form>

      {loading && <p className="loading">{LOADING_LINES[line]}</p>}
      {error && <p className="error">{error}</p>}

      {result && (
        <article className="card">
          <div className="top">
            <img src={result.profile.avatar} alt="" />
            <div>
              <small>@{result.profile.login}</small>
              <h2>
                {result.roast.spiritEmoji} {result.roast.archetype}
              </h2>
              <span className="pill">{result.roast.alignment}</span>
              <span className="pill">🥤 {result.roast.drink}</span>
            </div>
          </div>

          <p className="roast">{result.roast.roast}</p>

          <div className="stats">
            {(Object.keys(STAT_LABELS) as (keyof typeof STAT_LABELS)[]).map((k) => (
              <div key={k} className="stat">
                <span>{STAT_LABELS[k]}</span>
                <div className="bar">
                  <i style={{ width: `${result.roast.stats[k]}%` }} />
                </div>
                <b>{result.roast.stats[k]}</b>
              </div>
            ))}
          </div>

          <h3>🚩 red flags</h3>
          <ul>
            {result.roast.redFlags.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>

          {topLangs.length > 0 && (
            <div className="langs">
              {topLangs.map(([l, n]) => (
                <span key={l}>
                  {l} <b>×{n}</b>
                </span>
              ))}
            </div>
          )}

          <p className="compliment">💜 {result.roast.compliment}</p>
          <button className="share" onClick={share}>
            {copied ? "copied ✓" : "copy & share"}
          </button>
        </article>
      )}

      <footer>made with chaos by @Kurtisko221x</footer>
    </main>
  );
}
