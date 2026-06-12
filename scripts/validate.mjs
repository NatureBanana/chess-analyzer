/**
 * Validates app analytics against Chess.com public API for a username.
 * Run: node scripts/validate.mjs [username] [months]
 */
const user = (process.argv[2] || "NatureBanana").toLowerCase();
const months = Number(process.argv[3] ?? 3);

const DRAW_RESULTS = new Set(["agreed", "repetition", "stalemate", "insufficient", "50move", "timevsinsufficient"]);

function inferTimeControl(tc) {
  if (!tc) return "other";
  const raw = String(tc).trim();
  if (raw === "-" || raw.includes("/")) return "daily";
  const [baseRaw, incRaw = "0"] = raw.split("+");
  const base = parseInt(baseRaw, 10);
  const inc = parseInt(incRaw, 10) || 0;
  if (Number.isNaN(base)) return "other";
  const estimatedSeconds = base + inc * 40;
  if (estimatedSeconds < 180) return "bullet";
  if (estimatedSeconds < 600) return "blitz";
  return "rapid";
}

function normalizeTimeClass(timeClass, timeControl) {
  const cls = String(timeClass || "").toLowerCase();
  if (["bullet", "blitz", "rapid", "daily"].includes(cls)) return cls;
  return inferTimeControl(timeControl);
}

function pgnTags(pgn) {
  const tags = {};
  if (!pgn) return tags;
  for (const m of pgn.matchAll(/^\[([A-Za-z0-9_]+) "([^"]*)"\]/gm)) tags[m[1]] = m[2];
  return tags;
}

function resultFromArchive(raw, sideResult, color) {
  if (raw === "1-0") return color === "white" ? "win" : "loss";
  if (raw === "0-1") return color === "black" ? "win" : "loss";
  if (raw === "1/2-1/2") return "draw";
  const normalized = String(sideResult || "").toLowerCase();
  if (normalized === "win") return "win";
  if (DRAW_RESULTS.has(normalized)) return "draw";
  return normalized ? "loss" : "draw";
}

function parsePGNGame(pgn, username, game = {}) {
  const tags = pgnTags(pgn);
  const w = game.white?.username || tags.White;
  const b = game.black?.username || tags.Black;
  if (!w || !b) return null;
  const userLower = username.toLowerCase();
  const color = w.toLowerCase() === userLower ? "white" : b.toLowerCase() === userLower ? "black" : null;
  if (!color) return null;
  const raw = tags.Result;
  const side = color === "white" ? game.white : game.black;
  const result = resultFromArchive(raw, side?.result, color);
  const opp = color === "white" ? game.black : game.white;
  const oppEloRaw = opp?.rating ?? (color === "white" ? tags.BlackElo : tags.WhiteElo);
  const oppElo = oppEloRaw ? parseInt(oppEloRaw, 10) : null;
  const timeControl = normalizeTimeClass(game.time_class, game.time_control || tags.TimeControl);
  return { color, result, oppElo, timeControl, endTime: game.end_time || 0 };
}

function normalizeArchiveGame(game, username) {
  if (!game) return null;
  if (typeof game.pgn === "string") return parsePGNGame(game.pgn, username, game);
  if (game.white?.username && game.black?.username) return parsePGNGame("", username, game);
  return game.color && game.result ? game : null;
}

async function fetchJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
  return r.json();
}

async function fetchArchiveGames(url, username) {
  try {
    const data = await fetchJSON(url);
    if (Array.isArray(data?.games)) return data.games;
  } catch {
    // fallback
  }
  const r = await fetch(`${url}/pgn`);
  if (!r.ok) throw new Error(`PGN fetch failed ${url}`);
  const text = await r.text();
  const games = text
    .split(/\r?\n\r?\n(?=\[)/)
    .filter((g) => g.includes("[White ") && g.includes("[Black "))
    .map((g) => parsePGNGame(g, username))
    .filter(Boolean);
  return games.map((g) => ({ ...g, pgn: text }));
}

async function loadPlayer(username, monthCount) {
  const base = `https://api.chess.com/pub/player/${username}`;
  const [profile, stats, archives] = await Promise.all([
    fetchJSON(base),
    fetchJSON(`${base}/stats`),
    fetchJSON(`${base}/games/archives`),
  ]);
  const allUrls = archives.archives || [];
  const urls = monthCount === 0 ? allUrls : allUrls.slice(-monthCount);
  const archiveData = await Promise.all(urls.map((u) => fetchArchiveGames(u, username)));
  const games = archiveData
    .flatMap((games) => games.map((g) => normalizeArchiveGame(g, username)).filter(Boolean))
    .sort((a, b) => (b.endTime || 0) - (a.endTime || 0));
  return { profile, stats, games, monthsLoaded: urls.length };
}

function getRating(stats, tc) {
  const s = stats?.[`chess_${tc}`];
  return { last: s?.last?.rating ?? null, best: s?.best?.rating ?? null };
}

const data = await loadPlayer(user, months);
const { profile, stats, games } = data;

const wins = games.filter((g) => g.result === "win").length;
const losses = games.filter((g) => g.result === "loss").length;
const draws = games.filter((g) => g.result === "draw").length;
const tcMap = {};
games.forEach((g) => {
  tcMap[g.timeControl] = (tcMap[g.timeControl] || 0) + 1;
});

console.log(`\n=== ${profile.username} (${months === 0 ? "all time" : months + " months"}) ===`);
console.log(`Games loaded: ${games.length} from ${data.monthsLoaded} archive(s)`);
console.log(`W/D/L: ${wins}/${draws}/${losses} (${Math.round((wins / games.length) * 100)}% win)`);
console.log(`Time controls:`, tcMap);
console.log(`\nChess.com official ratings (from /stats):`);
for (const tc of ["rapid", "blitz", "bullet", "daily"]) {
  const r = getRating(stats, tc);
  if (r.last) console.log(`  ${tc}: ${r.last} (best ${r.best})`);
}
if (stats?.tactics?.highest?.rating) {
  console.log(`  puzzle highest: ${stats.tactics.highest.rating}`);
}

// Cross-check: count games in archives directly from API
const base = `https://api.chess.com/pub/player/${user}/games/archives`;
const archives = await fetchJSON(base);
const urls = months === 0 ? archives.archives : archives.archives.slice(-months);
let rawTotal = 0;
let rawUserGames = 0;
for (const url of urls) {
  const monthData = await fetchJSON(url);
  const monthGames = monthData.games || [];
  rawTotal += monthGames.length;
  rawUserGames += monthGames.filter(
    (g) =>
      g.white?.username?.toLowerCase() === user || g.black?.username?.toLowerCase() === user
  ).length;
}
console.log(`\nArchive cross-check:`);
console.log(`  Raw games in archives: ${rawTotal}`);
console.log(`  Games involving ${user}: ${rawUserGames}`);
console.log(`  Parsed by app logic: ${games.length}`);
console.log(`  Match: ${rawUserGames === games.length ? "YES ✓" : "NO ✗ diff=" + (rawUserGames - games.length)}`);
