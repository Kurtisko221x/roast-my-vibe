// Collects the "evidence" for a roast from the public GitHub API.
const headers: Record<string, string> = {
  "User-Agent": "roast-my-vibe",
  Accept: "application/vnd.github+json",
};
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

export class GitHubError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function gh<T>(path: string): Promise<T> {
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (res.status === 404) throw new GitHubError("That GitHub user doesn't exist.", 404);
  if (res.status === 403 || res.status === 429) {
    throw new GitHubError("GitHub rate limit hit — add a GITHUB_TOKEN or try later.", 429);
  }
  if (!res.ok) throw new GitHubError(`GitHub API error ${res.status}`, 502);
  return res.json() as Promise<T>;
}

interface User {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
}
interface Repo {
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  fork: boolean;
  pushed_at: string;
  topics?: string[];
}
interface PushEvent {
  type: string;
  created_at: string;
  payload: { commits?: { message: string }[] };
}

export interface Evidence {
  login: string;
  name: string | null;
  avatar: string;
  bio: string | null;
  accountAgeYears: number;
  followers: number;
  following: number;
  publicRepos: number;
  forks: number;
  totalStars: number;
  languages: Record<string, number>;
  repos: { name: string; description: string | null; language: string | null; stars: number }[];
  commitMessages: string[];
  commitHours: number[];
}

export async function collectEvidence(username: string): Promise<Evidence> {
  const [user, repos, events] = await Promise.all([
    gh<User>(`/users/${encodeURIComponent(username)}`),
    gh<Repo[]>(`/users/${encodeURIComponent(username)}/repos?per_page=100&sort=pushed`),
    gh<PushEvent[]>(`/users/${encodeURIComponent(username)}/events/public?per_page=100`),
  ]);

  const own = repos.filter((r) => !r.fork);
  const languages: Record<string, number> = {};
  for (const r of own) if (r.language) languages[r.language] = (languages[r.language] ?? 0) + 1;

  const pushes = events.filter((e) => e.type === "PushEvent");
  const commitMessages = pushes.flatMap((e) => e.payload.commits?.map((c) => c.message.split("\n")[0]) ?? []).slice(0, 40);

  return {
    login: user.login,
    name: user.name,
    avatar: user.avatar_url,
    bio: user.bio,
    accountAgeYears: +((Date.now() - Date.parse(user.created_at)) / 3.156e10).toFixed(1),
    followers: user.followers,
    following: user.following,
    publicRepos: user.public_repos,
    forks: repos.length - own.length,
    totalStars: own.reduce((n, r) => n + r.stargazers_count, 0),
    languages,
    repos: own.slice(0, 25).map((r) => ({
      name: r.name,
      description: r.description,
      language: r.language,
      stars: r.stargazers_count,
    })),
    commitMessages,
    commitHours: pushes.map((e) => new Date(e.created_at).getUTCHours()),
  };
}
