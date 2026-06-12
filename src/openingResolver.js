import { ECO_BY_CODE, MOVE_BOOK } from "./data/openings.js";

const FIRST_MOVE_NAMES = {
  e4: "King's Pawn Opening",
  d4: "Queen's Pawn Opening",
  c4: "English Opening",
  Nf3: "Réti Opening",
  g3: "King's Fianchetto Opening",
  b3: "Larsen Opening",
  f4: "Bird Opening",
  b4: "Polish Opening",
  Nc3: "Dunst Opening",
  a3: "Anderssen Opening",
  h3: "Amar Opening",
  e3: "Van't Kruijs Opening",
  d3: "Mieses Opening",
  c3: "Saragossa Opening",
  f3: "Barnes Opening",
  g4: "Grob Opening",
  a4: "Ware Opening",
  h4: "Desprez Opening",
};

const TWO_MOVE_FAMILIES = {
  "e4 e5": "King's Pawn Game",
  "e4 c5": "Sicilian Defense",
  "e4 e6": "French Defense",
  "e4 c6": "Caro-Kann Defense",
  "e4 d5": "Scandinavian Defense",
  "e4 d6": "Pirc Defense",
  "e4 g6": "Modern Defense",
  "e4 Nf6": "Alekhine Defense",
  "e4 Nc6": "Nimzowitsch Defense",
  "d4 d5": "Closed Game",
  "d4 Nf6": "Indian Defense",
  "d4 f5": "Dutch Defense",
  "d4 e6": "Queen's Pawn Game",
  "d4 c5": "Benoni Defense",
  "c4 e5": "English Opening",
  "c4 c5": "English Opening",
  "c4 e6": "English Opening",
  "c4 Nf6": "English Opening",
  "Nf3 d5": "Réti Opening",
  "Nf3 Nf6": "Réti Opening",
};

export function normalizeEco(eco) {
  if (!eco || eco === "?") return null;
  const code = String(eco).trim().toUpperCase();
  return /^[A-E]\d{2}$/.test(code) ? code : null;
}

export function ecoFamily(eco) {
  const code = normalizeEco(eco);
  return code ? code[0] : null;
}

export function lookupEcoName(eco) {
  const code = normalizeEco(eco);
  return code ? ECO_BY_CODE[code] || null : null;
}

export function normalizeMovesFromPgn(pgn) {
  if (!pgn) return "";
  const body = pgn.replace(/\r\n/g, "\n").split(/\n\n/).slice(1).join(" ");
  return body
    .replace(/\{[^}]*\}/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/\d+\.\.\./g, "")
    .replace(/\d+\./g, "")
    .replace(/[!?+#=]+/g, "")
    .split(/\s+/)
    .filter((m) => m && !/^(1-0|0-1|1\/2-1\/2|\*)$/.test(m))
    .map((m) => m.replace(/0-0-0/g, "O-O-O").replace(/0-0/g, "O-O"))
    .join(" ")
    .trim();
}

export function inferOpeningFromMoves(pgn) {
  const moves = normalizeMovesFromPgn(pgn);
  if (!moves) return null;

  for (const [bookMoves, eco, name] of MOVE_BOOK) {
    if (moves === bookMoves || moves.startsWith(bookMoves + " ")) {
      return { opening: name, eco, source: "moves" };
    }
  }

  const parts = moves.split(" ");
  if (parts.length >= 2) {
    const two = `${parts[0]} ${parts[1]}`;
    if (TWO_MOVE_FAMILIES[two]) {
      return { opening: TWO_MOVE_FAMILIES[two], eco: null, source: "family" };
    }
  }

  if (parts[0] && FIRST_MOVE_NAMES[parts[0]]) {
    return { opening: FIRST_MOVE_NAMES[parts[0]], eco: null, source: "first-move" };
  }

  const moveCount = parts.length;
  if (moveCount >= 8) return { opening: "Transitional Position", eco: null, source: "fallback" };
  if (moveCount >= 4) return { opening: "Early Opening", eco: null, source: "fallback" };
  return { opening: "Opening Phase", eco: null, source: "fallback" };
}

export function cleanOpeningNameFromUrl(url) {
  if (!url) return null;
  const patterns = [
    /chess\.com\/openings\/([^?#]+)/,
    /lichess\.org\/opening\/([^?#]+)/,
    /openings\/([^?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) {
      const decoded = decodeURIComponent(match[1]).replace(/[-_]+/g, " ");
      const name = decoded.replace(/\s*(?:\.{3})?\d+\..*$/, "").replace(/\s+/g, " ").trim();
      if (name) return name;
    }
  }
  return null;
}

export function resolveOpeningInfo(tags = {}, pgn = "") {
  const eco = normalizeEco(tags.ECO) || null;
  const ecoUrl = tags.ECOUrl || tags.ECOURL || tags.ecoUrl || "";
  const urlName = cleanOpeningNameFromUrl(ecoUrl);
  const openingUrl = ecoUrl?.includes("chess.com/openings/") ? ecoUrl
    : ecoUrl?.includes("lichess.org/opening/") ? ecoUrl
    : urlName ? `https://www.chess.com/openings/${urlName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`
    : null;

  let opening = tags.Opening?.trim() || urlName || lookupEcoName(eco);
  let source = opening ? (tags.Opening ? "tag" : urlName ? "url" : "eco") : null;

  if (!opening) {
    const inferred = inferOpeningFromMoves(pgn);
    if (inferred) {
      opening = inferred.opening;
      source = inferred.source;
    }
  }

  if (!opening) {
    opening = eco ? `${eco} — ${lookupEcoName(eco) || "Classified Opening"}` : "Chess Opening";
    source = "fallback";
  }

  const resolvedEco = eco || (inferOpeningFromMoves(pgn)?.eco) || "?";

  return {
    opening,
    openingUrl,
    eco: resolvedEco,
    ecoFamily: ecoFamily(resolvedEco),
    source: source || "fallback",
  };
}

export function openingCoverage(games) {
  if (!games?.length) return { total: 0, named: 0, pct: 0, bySource: {} };
  const bySource = {};
  let named = 0;
  for (const g of games) {
    const src = g.openingSource || "unknown";
    bySource[src] = (bySource[src] || 0) + 1;
    if (g.opening) named++;
  }
  return {
    total: games.length,
    named,
    pct: Math.round((named / games.length) * 100),
    bySource,
  };
}
