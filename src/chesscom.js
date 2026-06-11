// ── Fetch ─────────────────────────────────────────────────────────────────────
export const PROXIES = [
  u => u,
  u => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  u => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
  u => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
];

async function tryFetch(url, asText, fetchImpl = globalThis.fetch) {
  if (typeof fetchImpl !== "function") throw new Error("Fetch is not available");
  let lastErr = "network error";
  for (const mk of PROXIES) {
    try {
      const r = await fetchImpl(mk(url), { method:"GET", mode:"cors" });
      if (r.status === 404) throw new Error("Player not found");
      if (!r.ok) { lastErr = `HTTP ${r.status}`; continue; }
      return asText ? await r.text() : await r.json();
    } catch(e) {
      if (e.message?.includes("not found")) throw e;
      lastErr = e.message || "failed";
    }
  }
  throw new Error(`Cannot reach Chess.com API (${lastErr})`);
}

export const fetchJSON = (u, fetchImpl) => tryFetch(u, false, fetchImpl);
export const fetchText = (u, fetchImpl) => tryFetch(u, true, fetchImpl);

// ── PGN parser ────────────────────────────────────────────────────────────────
export function inferTimeControl(tc) {
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

function formatDateFromTimestamp(timestamp) {
  if (!timestamp) return null;
  const d = new Date(timestamp * 1000);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10).replace(/-/g, ".");
}

function timestampFromDateString(dateStr) {
  const m = String(dateStr || "").match(/^(\d{4})[.-](\d{1,2})[.-](\d{1,2})$/);
  if (!m) return 0;
  const [, y, mo, d] = m.map(Number);
  return Math.floor(Date.UTC(y, mo - 1, d, 12) / 1000);
}

function cleanOpeningNameFromUrl(url) {
  const slug = url.split("/openings/")[1]?.split(/[?#]/)[0];
  if (!slug) return "Unknown";
  const decoded = decodeURIComponent(slug).replace(/[-_]+/g, " ");
  return decoded.replace(/\s*(?:\.{3})?\d+\..*$/, "").replace(/\s+/g, " ").trim() || "Unknown";
}

function extractOpeningInfo(tags) {
  const ecoUrl = tags.ECOUrl;
  const openingUrl = ecoUrl?.includes("chess.com/openings/") ? ecoUrl : null;
  const opening = tags.Opening?.trim() || (openingUrl ? cleanOpeningNameFromUrl(openingUrl) : "Unknown");
  return { opening, openingUrl };
}

export function openingLink(opening, openingUrl) {
  if (openingUrl) return openingUrl;
  return `https://www.chess.com/openings/${opening.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}`;
}

export function uniqueNamedOpenings(games) {
  return new Set(games.filter(g=>g.opening&&g.opening!=="Unknown").map(g=>g.opening)).size;
}

function pgnTags(pgn) {
  const tags = {};
  if (!pgn) return tags;
  for (const m of pgn.matchAll(/^\[([A-Za-z0-9_]+) "([^"]*)"\]/gm)) tags[m[1]] = m[2];
  return tags;
}

const DRAW_RESULTS = new Set(["draw", "agreed", "repetition", "stalemate", "insufficient", "50move", "timevsinsufficient"]);

export function resultFromArchive(raw, sideResult, color) {
  if (raw==="1-0") return color==="white" ? "win":"loss";
  if (raw==="0-1") return color==="black" ? "win":"loss";
  if (raw==="1/2-1/2") return "draw";
  const normalized = String(sideResult || "").toLowerCase();
  if (normalized === "win") return "win";
  if (DRAW_RESULTS.has(normalized)) return "draw";
  return normalized ? "loss" : "draw";
}

export function parsePGNGame(pgn, user, game={}) {
  const tags = pgnTags(pgn);
  const w = game.white?.username || tags.White;
  const b = game.black?.username || tags.Black;
  if (!w || !b) return null;
  const userLower = user.toLowerCase();
  const color = w.toLowerCase() === userLower ? "white" : b.toLowerCase() === userLower ? "black" : null;
  if (!color) return null;
  const raw = tags.Result;
  const side = color==="white" ? game.white : game.black;
  const result = resultFromArchive(raw, side?.result, color);
  const opp = color==="white" ? game.black : game.white;
  const oppEloRaw = opp?.rating ?? (color==="white" ? tags.BlackElo : tags.WhiteElo);
  const oppElo = oppEloRaw ? parseInt(oppEloRaw, 10) : null;
  const timeControl = normalizeTimeClass(game.time_class, game.time_control || tags.TimeControl);
  const dateStr = formatDateFromTimestamp(game.end_time) || tags.EndDate || tags.UTCDate || tags.Date;
  const openingInfo = extractOpeningInfo(tags);
  return {
    ...openingInfo,
    eco:tags.ECO||"?",
    color,
    result,
    oppElo:(!oppElo||isNaN(oppElo))?null:oppElo,
    timeControl,
    date:dateStr,
    endTime:game.end_time || timestampFromDateString(dateStr),
    opponent:color==="white"?b:w,
    url:game.url||tags.Link||null,
  };
}

export function parsePGN(pgn, user) {
  if (!pgn || pgn.length < 10) return [];
  return pgn.split(/\r?\n\r?\n(?=\[)/).filter(g => g.includes("[White ") && g.includes("[Black ")).map(g => parsePGNGame(g, user)).filter(Boolean);
}

export function normalizeArchiveGame(game, user) {
  if (!game) return null;
  if (typeof game.pgn === "string") return parsePGNGame(game.pgn, user, game);
  if (game.white?.username && game.black?.username) return parsePGNGame("", user, game);
  return game.color && game.result ? game : null;
}

function gameIdentity(game) {
  if (game.url) return `url:${game.url}`;
  return [
    game.endTime || game.date || "unknown-date",
    game.color || "unknown-color",
    String(game.opponent || "unknown-opponent").toLowerCase(),
    game.result || "unknown-result",
    game.timeControl || "unknown-time-control",
  ].join("|");
}

function dedupeGames(games) {
  const seen = new Set();
  const out = [];
  for (const game of games) {
    const key = gameIdentity(game);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(game);
  }
  return out;
}

export async function fetchArchiveGames(url, user, { fetchImpl } = {}) {
  try {
    const data = await fetchJSON(url, fetchImpl);
    if (Array.isArray(data?.games) && data.games.length) return data.games;
  } catch {
    // Fall back to the PGN endpoint when an archive JSON request/proxy fails.
  }

  const games = parsePGN(await fetchText(`${url}/pgn`, fetchImpl), user);
  if (!games.length) throw new Error(`No games parsed from archive ${url}`);
  return games;
}

export async function loadPlayer(user, months=3, { fetchImpl } = {}) {
  const base = `https://api.chess.com/pub/player/${user}`;
  const [profile, stats, archives] = await Promise.all([
    fetchJSON(base, fetchImpl),
    fetchJSON(`${base}/stats`, fetchImpl),
    fetchJSON(`${base}/games/archives`, fetchImpl),
  ]);
  if (!profile.username) throw new Error(`Player "${user}" not found on Chess.com`);
  const allUrls = archives.archives || [];
  // months=0 means all time
  const urls = months === 0 ? allUrls : allUrls.slice(-months);
  const settled = await Promise.allSettled(urls.map(u => fetchArchiveGames(u, user, { fetchImpl })));
  const archiveData = settled.filter(r => r.status === "fulfilled").map(r => r.value);
  if (urls.length && !archiveData.length) throw new Error(`No games could be loaded for "${user}"`);
  const games = dedupeGames(archiveData.flatMap(games => games.map(g => normalizeArchiveGame(g, user)).filter(Boolean))).sort((a,b)=>(b.endTime||0)-(a.endTime||0));
  return { profile, stats, games, monthsLoaded: urls.length, archivesLoaded: archiveData.length, archiveErrors: settled.length - archiveData.length };
}
