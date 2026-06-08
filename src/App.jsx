import { useState, useEffect, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Legend, LineChart, Line, CartesianGrid,
} from "recharts";

// ── Fonts ─────────────────────────────────────────────────────────────────────
const fl = document.createElement("link");
fl.rel = "stylesheet";
fl.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=DM+Sans:wght@300;400;500;600&family=Space+Grotesk:wght@400;500;600;700&family=Syne:wght@400;600;700;800&display=swap";
document.head.appendChild(fl);

// ── Themes ────────────────────────────────────────────────────────────────────
// bgType controls the SVG/CSS background pattern rendered per theme
const THEMES = {
  slate:    { name:"Slate",    icon:"🎯", bg:"#0d1117", bgType:"grid",  card:"linear-gradient(135deg,rgba(20,26,36,.92),rgba(10,14,20,.96))",  cardBorder:"rgba(139,148,158,0.15)", accent:"#58a6ff", accent2:"#1f6feb", hl:"#79c0ff", text:"#c9d1d9", textDim:"#4a5568", textMid:"#8b949e", win:"#3fb950", loss:"#f85149", draw:"#6e7681", inputBg:"rgba(20,26,36,.9)",     btnGrad:"linear-gradient(135deg,#1f6feb,#58a6ff)", btnColor:"#0d1117", skA:"rgba(88,166,255,.04)",  skB:"rgba(88,166,255,.1)",  font:"'DM Sans',sans-serif",        headingFont:"'Playfair Display',serif", scrollThumb:"#58a6ff28", glowC:"#58a6ff35", glowC2:"#58a6ff70" },
  forest:   { name:"Forest",   icon:"🌲", bg:"#040f08", bgType:"leaves",    card:"linear-gradient(135deg,rgba(0,44,22,.9),rgba(0,18,9,.96))",    cardBorder:"rgba(0,255,136,0.13)",   accent:"#00ff88", accent2:"#00c860", hl:"#39ffa0", text:"#c8f0dc", textDim:"#3a6048", textMid:"#7ab898", win:"#00ff88", loss:"#ff5555", draw:"#5a8e6e", inputBg:"rgba(0,40,20,.85)",     btnGrad:"linear-gradient(135deg,#00c860,#00ff88)", btnColor:"#030e06", skA:"rgba(0,255,136,.04)",   skB:"rgba(0,255,136,.1)",   font:"'DM Sans',sans-serif",          headingFont:"'Playfair Display',serif", scrollThumb:"#00ff8828", glowC:"#00ff8840", glowC2:"#00ff8880" },
  midnight: { name:"Midnight", icon:"🌙", bg:"#06070f", bgType:"stars",    card:"linear-gradient(135deg,rgba(15,18,50,.9),rgba(6,7,25,.96))",   cardBorder:"rgba(100,120,255,0.15)", accent:"#7b8fff", accent2:"#5060dd", hl:"#a0aaff", text:"#d0d4f8", textDim:"#404880", textMid:"#8890cc", win:"#7b8fff", loss:"#ff6b8a", draw:"#5a6090", inputBg:"rgba(15,18,50,.85)",    btnGrad:"linear-gradient(135deg,#5060dd,#7b8fff)", btnColor:"#06070f", skA:"rgba(123,143,255,.04)", skB:"rgba(123,143,255,.1)", font:"'Space Grotesk',sans-serif",   headingFont:"'Syne',sans-serif",        scrollThumb:"#7b8fff28", glowC:"#7b8fff40", glowC2:"#7b8fff80" },
  gold:     { name:"Gold",     icon:"👑", bg:"#0c0a02", bgType:"diamonds", card:"linear-gradient(135deg,rgba(35,28,4,.92),rgba(18,14,2,.96))",  cardBorder:"rgba(255,200,0,0.14)",   accent:"#ffd700", accent2:"#cc9900", hl:"#ffe566", text:"#f0e8c0", textDim:"#6a5a18", textMid:"#c0a840", win:"#ffd700", loss:"#ff6060", draw:"#8a7830", inputBg:"rgba(35,28,4,.85)",     btnGrad:"linear-gradient(135deg,#cc9900,#ffd700)", btnColor:"#0c0a02", skA:"rgba(255,215,0,.04)",   skB:"rgba(255,215,0,.1)",   font:"'DM Sans',sans-serif",          headingFont:"'Playfair Display',serif", scrollThumb:"#ffd70028", glowC:"#ffd70040", glowC2:"#ffd70080" },
  crimson:  { name:"Crimson",  icon:"🔴", bg:"#0f0608", bgType:"hex",      card:"linear-gradient(135deg,rgba(40,8,12,.9),rgba(20,4,6,.96))",    cardBorder:"rgba(255,80,80,0.13)",   accent:"#ff5c5c", accent2:"#cc3333", hl:"#ff9090", text:"#f0d0d0", textDim:"#6a2838", textMid:"#c07080", win:"#ff5c5c", loss:"#5caaff", draw:"#8a5060", inputBg:"rgba(40,8,12,.85)",     btnGrad:"linear-gradient(135deg,#cc3333,#ff5c5c)", btnColor:"#0f0608", skA:"rgba(255,92,92,.04)",   skB:"rgba(255,92,92,.1)",   font:"'DM Sans',sans-serif",          headingFont:"'Playfair Display',serif", scrollThumb:"#ff5c5c28", glowC:"#ff5c5c40", glowC2:"#ff5c5c80" },
  obsidian: { name:"Obsidian", icon:"🖤", bg:"#080808", bgType:"noise",    card:"linear-gradient(135deg,rgba(22,22,22,.92),rgba(10,10,10,.96))",cardBorder:"rgba(200,200,200,0.1)",  accent:"#e0e0e0", accent2:"#999999", hl:"#ffffff", text:"#d8d8d8", textDim:"#444444", textMid:"#999999", win:"#e0e0e0", loss:"#ff6060", draw:"#666666", inputBg:"rgba(22,22,22,.9)",     btnGrad:"linear-gradient(135deg,#555,#e0e0e0)",    btnColor:"#080808", skA:"rgba(200,200,200,.04)", skB:"rgba(200,200,200,.09)",font:"'Space Grotesk',sans-serif",   headingFont:"'Syne',sans-serif",        scrollThumb:"#ffffff18", glowC:"#ffffff28", glowC2:"#ffffff60" },
};

// Per-theme background renderer
function ThemeBg({t}) {
  const a = t.accent;
  const patterns = {
    // Slate: simple subtle dot grid — very minimal, barely visible
    grid: <svg style={{position:"fixed",inset:0,width:"100%",height:"100%",zIndex:0,pointerEvents:"none",opacity:.18}} xmlns="http://www.w3.org/2000/svg">
      <defs><pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
        <circle cx="16" cy="16" r=".7" fill={a}/>
      </pattern></defs>
      <rect width="100%" height="100%" fill="url(#grid)"/>
    </svg>,
    // Forest: organic diagonal line stripes — no checkerboard
    leaves: <svg style={{position:"fixed",inset:0,width:"100%",height:"100%",zIndex:0,pointerEvents:"none",opacity:.06}} xmlns="http://www.w3.org/2000/svg">
      <defs><pattern id="leaves" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
        <line x1="0" y1="0" x2="0" y2="40" stroke={a} strokeWidth="1.2"/>
      </pattern></defs>
      <rect width="100%" height="100%" fill="url(#leaves)"/>
    </svg>,
    // Midnight: star field
    stars: <svg style={{position:"fixed",inset:0,width:"100%",height:"100%",zIndex:0,pointerEvents:"none"}} xmlns="http://www.w3.org/2000/svg">
      {[...Array(80)].map((_,i)=>{
        const x=(i*137.5)%100, y=(i*97.3+23)%100;
        const r=i%5===0?.9:i%3===0?.6:.35;
        return <circle key={i} cx={`${x}%`} cy={`${y}%`} r={r} fill={a} opacity={.2+(.6*(i%7)/7)}/>
      })}
    </svg>,
    // Gold: diagonal diamond grid
    diamonds: <svg style={{position:"fixed",inset:0,width:"100%",height:"100%",zIndex:0,pointerEvents:"none",opacity:.08}} xmlns="http://www.w3.org/2000/svg">
      <defs><pattern id="diamonds" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="40" height="40" fill="none" stroke={a} strokeWidth=".8"/>
        <rect x="10" y="10" width="20" height="20" fill="none" stroke={a} strokeWidth=".4"/>
      </pattern></defs>
      <rect width="100%" height="100%" fill="url(#diamonds)"/>
    </svg>,
    // Crimson: hexagon grid
    hex: <svg style={{position:"fixed",inset:0,width:"100%",height:"100%",zIndex:0,pointerEvents:"none",opacity:.07}} xmlns="http://www.w3.org/2000/svg">
      <defs><pattern id="hex" width="56" height="48" patternUnits="userSpaceOnUse">
        <path d="M14 0l14 8v16l-14 8-14-8V8zM42 0l14 8v16l-14 8-14-8V8zM28 24l14 8v16l-14 8-14-8v-16z" stroke={a} strokeWidth=".8" fill="none"/>
      </pattern></defs>
      <rect width="100%" height="100%" fill="url(#hex)"/>
    </svg>,
    // Obsidian: subtle dot grid
    noise: <svg style={{position:"fixed",inset:0,width:"100%",height:"100%",zIndex:0,pointerEvents:"none",opacity:.06}} xmlns="http://www.w3.org/2000/svg">
      <defs><pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
        <circle cx="12" cy="12" r=".8" fill={a}/>
      </pattern></defs>
      <rect width="100%" height="100%" fill="url(#dots)"/>
    </svg>,
  };
  return <>{patterns[t.bgType]||null}</>;
}

// ── Player comparison colors (theme-independent, always high contrast) ──────
// P1 = vivid orange-amber, P2 = vivid violet — contrast on every theme
const P1_COLOR = "#f97316";   // orange
const P1_FILL  = "rgba(249,115,22,.18)";
const P2_COLOR = "#a78bfa";   // violet
const P2_FILL  = "rgba(167,139,250,.14)";

// ── Global styles ─────────────────────────────────────────────────────────────
const styleEl = document.createElement("style");
document.head.appendChild(styleEl);
function injectTheme(t) {
  styleEl.textContent = `
    *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
    body { background:${t.bg}; color:${t.text}; font-family:${t.font}; scroll-behavior:smooth; }
    ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:${t.scrollThumb};border-radius:3px}
    /* ── Keyframes ── */
    @keyframes fadeInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fadeInDown{from{opacity:0;transform:translateY(-16px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes shimmer{0%,100%{opacity:.3}50%{opacity:.7}}
    @keyframes shimmerMove{0%{background-position:200% 0}100%{background-position:-200% 0}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes spinSlow{to{transform:rotate(360deg)}}
    @keyframes glow{0%,100%{text-shadow:0 0 18px ${t.glowC}}50%{text-shadow:0 0 36px ${t.glowC2},0 0 60px ${t.glowC}}}
    @keyframes glowPulse{0%,100%{box-shadow:0 0 0 0 ${t.glowC}}50%{box-shadow:0 0 20px 4px ${t.glowC}}}
    @keyframes revealCard{from{opacity:0;transform:scale(.94) translateY(18px)}to{opacity:1;transform:scale(1) translateY(0)}}
    @keyframes revealCardLeft{from{opacity:0;transform:scale(.95) translateX(-16px)}to{opacity:1;transform:scale(1) translateX(0)}}
    @keyframes float{0%,100%{transform:translateY(0px)}50%{transform:translateY(-7px)}}
    @keyframes floatSlow{0%,100%{transform:translateY(0px)}50%{transform:translateY(-4px)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.55}}
    @keyframes slideInLeft{from{opacity:0;transform:translateX(-22px)}to{opacity:1;transform:translateX(0)}}
    @keyframes slideInRight{from{opacity:0;transform:translateX(22px)}to{opacity:1;transform:translateX(0)}}
    @keyframes scaleIn{from{opacity:0;transform:scale(.88)}to{opacity:1;transform:scale(1)}}
    @keyframes countUp{from{opacity:0;transform:translateY(10px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}
    @keyframes barGrow{from{transform:scaleX(0);transform-origin:left}to{transform:scaleX(1);transform-origin:left}}
    @keyframes ringPop{0%{transform:scale(0);opacity:0}70%{transform:scale(1.12)}100%{transform:scale(1);opacity:1}}
    @keyframes borderFlow{0%,100%{border-color:${t.cardBorder}}50%{border-color:${t.accent}45}}
    @keyframes heroChess{0%{transform:translateY(0) rotate(0deg)}33%{transform:translateY(-8px) rotate(-3deg)}66%{transform:translateY(-4px) rotate(2deg)}100%{transform:translateY(0) rotate(0deg)}}
    @keyframes tabSlideIn{from{opacity:0;transform:translateX(8px)}to{opacity:1;transform:translateX(0)}}
    @keyframes wdlBar{from{width:0}to{width:100%}}

    /* ── Stagger classes ── */
    .stagger-1{animation:fadeInUp .45s .04s cubic-bezier(.22,1,.36,1) both}
    .stagger-2{animation:fadeInUp .45s .10s cubic-bezier(.22,1,.36,1) both}
    .stagger-3{animation:fadeInUp .45s .16s cubic-bezier(.22,1,.36,1) both}
    .stagger-4{animation:fadeInUp .45s .22s cubic-bezier(.22,1,.36,1) both}
    .stagger-5{animation:fadeInUp .45s .28s cubic-bezier(.22,1,.36,1) both}
    .stagger-6{animation:fadeInUp .45s .34s cubic-bezier(.22,1,.36,1) both}

    /* ── Skeleton ── */
    .skel{background:linear-gradient(90deg,${t.skA} 25%,${t.skB} 50%,${t.skA} 75%);background-size:200% 100%;animation:shimmerMove 1.6s ease infinite;border-radius:8px}

    /* ── Cards ── */
    .card-hover{transition:transform .25s cubic-bezier(.22,1,.36,1),box-shadow .25s ease,border-color .25s ease}
    .card-hover:hover{transform:translateY(-3px) scale(1.004);box-shadow:0 12px 48px rgba(0,0,0,.6),0 0 0 1px ${t.accent}18!important}

    /* ── Tabs ── */
    .tab-btn{background:none;border:1px solid transparent;cursor:pointer;font-family:${t.font};font-size:13px;font-weight:500;padding:8px 15px;border-radius:6px;color:${t.textDim};white-space:nowrap;transition:color .18s cubic-bezier(.4,0,.2,1),background .18s cubic-bezier(.4,0,.2,1),border-color .18s cubic-bezier(.4,0,.2,1),transform .15s ease}
    .tab-btn:hover{color:${t.accent};background:${t.accent}10;transform:translateY(-1px)}
    .tab-btn.active{color:${t.accent};background:${t.accent}16;border-color:${t.accent}40;font-weight:600}
    .tab-btn:active{transform:scale(.97)}

    /* ── Inputs ── */
    input{background:${t.inputBg};border:1px solid ${t.cardBorder};border-radius:10px;color:${t.text};font-family:${t.font};font-size:15px;padding:13px 16px;outline:none;width:100%;transition:border-color .2s cubic-bezier(.4,0,.2,1),box-shadow .2s cubic-bezier(.4,0,.2,1),transform .2s cubic-bezier(.22,1,.36,1)}
    input:focus{border-color:${t.accent}80;box-shadow:0 0 0 3px ${t.glowC},0 2px 12px rgba(0,0,0,.3);transform:translateY(-1px)}
    input::placeholder{color:${t.textDim}80;transition:opacity .2s}
    input:focus::placeholder{opacity:.5}

    /* ── Buttons ── */
    button.primary{background:${t.btnGrad};border:none;border-radius:10px;color:${t.btnColor};cursor:pointer;font-family:${t.font};font-size:15px;font-weight:700;padding:13px 28px;white-space:nowrap;transition:transform .2s cubic-bezier(.22,1,.36,1),box-shadow .2s ease,opacity .15s ease;position:relative;overflow:hidden}
    button.primary::after{content:"";position:absolute;inset:0;background:rgba(255,255,255,.12);opacity:0;transition:opacity .15s}
    button.primary:hover{transform:translateY(-2px) scale(1.02);box-shadow:0 6px 28px ${t.glowC}}
    button.primary:hover::after{opacity:1}
    button.primary:active{transform:translateY(0) scale(.98)}
    button.primary:disabled{opacity:.4;cursor:not-allowed;transform:none;box-shadow:none}
    button.secondary{background:${t.accent}12;border:1px solid ${t.accent}35;border-radius:8px;color:${t.accent};cursor:pointer;font-family:${t.font};font-size:13px;font-weight:600;padding:8px 16px;transition:all .18s cubic-bezier(.4,0,.2,1)}
    button.secondary:hover{background:${t.accent}22;border-color:${t.accent}55;transform:translateY(-1px)}
    button.secondary:active{transform:scale(.97)}

    /* ── Select ── */
    select{background:${t.inputBg};border:1px solid ${t.cardBorder};border-radius:6px;color:${t.text};font-family:${t.font};font-size:13px;padding:7px 10px;outline:none;cursor:pointer;transition:border-color .18s,box-shadow .18s}
    select:hover{border-color:${t.accent}40}
    select:focus{border-color:${t.accent}70;box-shadow:0 0 0 2px ${t.glowC}}

    /* ── Table ── */
    table{width:100%;border-collapse:collapse;font-size:13px}
    th{color:${t.accent};font-weight:600;font-size:11px;letter-spacing:.07em;text-transform:uppercase;padding:10px;border-bottom:1px solid ${t.cardBorder};text-align:left;cursor:pointer;user-select:none;transition:color .15s}
    th:hover{color:${t.hl}}
    td{padding:8px 10px;border-bottom:1px solid ${t.cardBorder}35;color:${t.textMid};vertical-align:middle;transition:background .15s}
    tr{transition:background .15s}
    tr:hover td{background:${t.skA}}

    /* ── Badges ── */
    .badge{display:inline-flex;align-items:center;border-radius:4px;font-size:11px;font-weight:700;padding:2px 9px;letter-spacing:.03em;transition:transform .15s,box-shadow .15s}
    .badge:hover{transform:scale(1.05)}
    .badge.green{background:${t.win}18;color:${t.win};border:1px solid ${t.win}40}
    .badge.yellow{background:rgba(255,200,0,.1);color:#ffc800;border:1px solid rgba(255,200,0,.3)}
    .badge.red{background:${t.loss}18;color:${t.loss};border:1px solid ${t.loss}40}

    /* ── Misc ── */
    .fi{animation:fadeInUp .4s cubic-bezier(.22,1,.36,1) both}
    * {-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
    ::selection{background:${t.accent}30;color:${t.text}}
    @media(max-width:700px){.three-col{flex-direction:column!important}.hide-mobile{display:none!important}}
  `;
}

// ── Fetch ─────────────────────────────────────────────────────────────────────
const PROXIES = [
  u => u,
  u => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  u => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
  u => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
];
async function tryFetch(url, asText) {
  let lastErr = "network error";
  for (const mk of PROXIES) {
    try {
      const r = await fetch(mk(url), { method:"GET", mode:"cors" });
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
const fetchJSON = u => tryFetch(u, false);
const fetchText = u => tryFetch(u, true);

// ── PGN parser ────────────────────────────────────────────────────────────────
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

function formatDateFromTimestamp(timestamp) {
  if (!timestamp) return null;
  const d = new Date(timestamp * 1000);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10).replace(/-/g, ".");
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

function openingLink(opening, openingUrl) {
  if (openingUrl) return openingUrl;
  return `https://www.chess.com/openings/${opening.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}`;
}

function uniqueNamedOpenings(games) {
  return new Set(games.filter(g=>g.opening&&g.opening!=="Unknown").map(g=>g.opening)).size;
}

function pgnTags(pgn) {
  const tags = {};
  if (!pgn) return tags;
  for (const m of pgn.matchAll(/^\[([A-Za-z0-9_]+) "([^"]*)"\]/gm)) tags[m[1]] = m[2];
  return tags;
}

const DRAW_RESULTS = new Set(["agreed", "repetition", "stalemate", "insufficient", "50move", "timevsinsufficient"]);

function resultFromArchive(raw, sideResult, color) {
  if (raw==="1-0") return color==="white" ? "win":"loss";
  if (raw==="0-1") return color==="black" ? "win":"loss";
  if (raw==="1/2-1/2") return "draw";
  const normalized = String(sideResult || "").toLowerCase();
  if (normalized === "win") return "win";
  if (DRAW_RESULTS.has(normalized)) return "draw";
  return normalized ? "loss" : "draw";
}

function parsePGNGame(pgn, user, game={}) {
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
  return { ...openingInfo, eco:tags.ECO||"?", color, result, oppElo:(!oppElo||isNaN(oppElo))?null:oppElo, timeControl, date:dateStr, endTime:game.end_time||0, opponent:color==="white"?b:w };
}

function parsePGN(pgn, user) {
  if (!pgn || pgn.length < 10) return [];
  return pgn.split(/\r?\n\r?\n(?=\[)/).filter(g => g.includes("[White ") && g.includes("[Black ")).map(g => parsePGNGame(g, user)).filter(Boolean);
}

function normalizeArchiveGame(game, user) {
  if (!game) return null;
  if (typeof game.pgn === "string") return parsePGNGame(game.pgn, user, game);
  if (game.white?.username && game.black?.username) return parsePGNGame("", user, game);
  return game.color && game.result ? game : null;
}

async function fetchArchiveGames(url, user) {
  try {
    const data = await fetchJSON(url);
    if (Array.isArray(data?.games)) return data.games;
  } catch {
    // Fall back to the PGN endpoint when an archive JSON request/proxy fails.
  }
  const games = parsePGN(await fetchText(`${url}/pgn`), user);
  if (!games.length) throw new Error(`No games parsed from archive ${url}`);
  return games;
}

async function loadPlayer(user, months=3) {
  const base = `https://api.chess.com/pub/player/${user}`;
  const [profile, stats, archives] = await Promise.all([fetchJSON(base), fetchJSON(`${base}/stats`), fetchJSON(`${base}/games/archives`)]);
  if (!profile.username) throw new Error(`Player "${user}" not found on Chess.com`);
  const allUrls = archives.archives || [];
  // months=0 means all time
  const urls = months === 0 ? allUrls : allUrls.slice(-months);
  const archiveData = await Promise.all(urls.map(u => fetchArchiveGames(u, user)));
  const games = archiveData.flatMap(games => games.map(g => normalizeArchiveGame(g, user)).filter(Boolean)).sort((a,b)=>(b.endTime||0)-(a.endTime||0));
  return { profile, stats, games, monthsLoaded: urls.length };
}

// ── Analytics helpers ─────────────────────────────────────────────────────────
function getRating(stats, tc) { const s = stats?.[`chess_${tc}`]; return { last:s?.last?.rating??null, best:s?.best?.rating??null }; }

function aggOpenings(games, tc="all") {
  const f = tc==="all" ? games : games.filter(g=>g.timeControl===tc);
  const map = {};
  for (const g of f) {
    if (!g.opening || (g.opening==="Unknown" && (!g.eco || g.eco==="?"))) continue;
    const k = g.opening==="Unknown" ? (g.eco||"?")+" Opening" : g.opening;
    if (!map[k]) map[k]={opening:k,openingUrl:g.openingUrl||null,eco:g.eco||"?",games:0,wins:0,losses:0,draws:0,elos:[]};
    if (!map[k].openingUrl && g.openingUrl) map[k].openingUrl = g.openingUrl;
    map[k].games++; if(g.result==="win")map[k].wins++; else if(g.result==="loss")map[k].losses++; else map[k].draws++;
    if(g.oppElo)map[k].elos.push(g.oppElo);
  }
  return Object.values(map).map(e=>({...e, winPct:e.games?Math.round(e.wins/e.games*100):0, lossPct:e.games?Math.round(e.losses/e.games*100):0, drawPct:e.games?Math.round(e.draws/e.games*100):0, avgOpp:e.elos.length?Math.round(e.elos.reduce((a,b)=>a+b,0)/e.elos.length):0 }));
}

function colorStats(games) {
  const calc = g => {
    const wins=g.filter(x=>x.result==="win").length, losses=g.filter(x=>x.result==="loss").length, draws=g.filter(x=>x.result==="draw").length;
    const elos=g.filter(x=>x.oppElo).map(x=>x.oppElo);
    const best=g.filter(x=>x.result==="win"&&x.oppElo).sort((a,b)=>b.oppElo-a.oppElo)[0];
    return { total:g.length, wins, losses, draws, avgOpp:elos.length?Math.round(elos.reduce((a,b)=>a+b,0)/elos.length):0, bestWinElo:best?.oppElo||0, bestWinOpp:best?.opponent||"" };
  };
  return { white:calc(games.filter(g=>g.color==="white")), black:calc(games.filter(g=>g.color==="black")) };
}

function eloBrackets(games) {
  return [["<1000",0,1000],["1000-1199",1000,1200],["1200-1399",1200,1400],["1400-1599",1400,1600],["1600-1799",1600,1800],["1800-1999",1800,2000],["2000+",2000,9999]]
    .map(([label,mn,mx])=>{ const g=games.filter(x=>x.oppElo>=mn&&x.oppElo<mx); return {label,games:g.length,winPct:g.length?Math.round(g.filter(x=>x.result==="win").length/g.length*100):0}; })
    .filter(b=>b.games>0);
}

function computeStreak(games) {
  if (!games.length) return {type:"none",count:0};
  let c=1; const l=games[0].result;
  for (let i=1;i<games.length;i++) { if(games[i].result===l)c++; else break; }
  return {type:l,count:c};
}

function computeInsights(games) {
  const total = games.length;
  if (!total) return [];
  const wins = games.filter(g=>g.result==="win").length;
  const losses = games.filter(g=>g.result==="loss").length;
  const draws = games.filter(g=>g.result==="draw").length;
  const openings = aggOpenings(games);
  const streak = computeStreak(games);
  const all = [];

  // 1. Current streak (always reliable)
  if (streak.count >= 2) {
    const sc = streak.type==="win"?"#3fb950":streak.type==="loss"?"#f85149":"#6e7681";
    all.push({ id:"streak", icon:streak.type==="win"?"🔥":streak.type==="loss"?"❄️":"➖", label:"Current streak",
      value:`${streak.count} ${streak.type}s in a row`, sub:`Active ${streak.type} streak`, color:sc,
      detail:`You're on a ${streak.count}-game ${streak.type} streak. ${streak.type==="win"&&streak.count>=5?"You're on fire — capitalize on this momentum.":streak.type==="win"?"Keep it going!":streak.type==="loss"&&streak.count>=4?"Consider a short break and come back fresh.":"These things happen — shake it off."}`,
      score: streak.type==="win"?streak.count*14:streak.type==="loss"?streak.count*9:2 });
  }

  // 2. Nemesis opening — highest loss% with min 4 games (ECO always present)
  const nemesis = openings.filter(o=>o.games>=4).sort((a,b)=>b.lossPct-a.lossPct)[0];
  if (nemesis && nemesis.lossPct >= 45) {
    all.push({ id:"nemesis", icon:"💀", label:"Nemesis opening",
      value:nemesis.opening.length>26?nemesis.opening.slice(0,24)+"…":nemesis.opening,
      sub:`${nemesis.losses} losses in ${nemesis.games} games (${nemesis.lossPct}%)`, color:"#f85149",
      detail:`You lose ${nemesis.lossPct}% of games in ${nemesis.opening} — ${nemesis.losses} losses over ${nemesis.games} games. ${nemesis.eco!=="?"?`ECO: ${nemesis.eco}. `:""}${nemesis.lossPct>65?"This line is actively hurting your rating. Study it or sidestep it.":"Worth spending some time on this one."}`,
      score: nemesis.lossPct + nemesis.games });
  }

  // 3. Signature opening — best win rate, min 5 games
  const signature = openings.filter(o=>o.games>=5).sort((a,b)=>b.winPct-a.winPct)[0];
  if (signature && signature.winPct >= 50) {
    all.push({ id:"signature", icon:"⭐", label:"Signature opening",
      value:signature.opening.length>26?signature.opening.slice(0,24)+"…":signature.opening,
      sub:`${signature.winPct}% win rate · ${signature.games} games`, color:"#f8c840",
      detail:`${signature.opening} is your strongest weapon — ${signature.winPct}% win rate over ${signature.games} games. ${signature.winPct>=70?"You clearly know this deeply. This is your go-to.":"Solid choice. Keep refining it."} Avg opponent rating: ${signature.avgOpp||"unknown"}.`,
      score: signature.winPct + signature.games*0.5 });
  }

  // 4. Color gap — always in PGN (White/Black tags)
  const wGames=games.filter(g=>g.color==="white"), bGames=games.filter(g=>g.color==="black");
  const wWp=wGames.length?Math.round(wGames.filter(g=>g.result==="win").length/wGames.length*100):0;
  const bWp=bGames.length?Math.round(bGames.filter(g=>g.result==="win").length/bGames.length*100):0;
  const colorDiff=Math.abs(wWp-bWp);
  if (colorDiff>=10 && Math.min(wGames.length,bGames.length)>=8) {
    const better=wWp>bWp?"White":"Black", betterWp=Math.max(wWp,bWp), worseWp=Math.min(wWp,bWp);
    all.push({ id:"color_gap", icon:better==="White"?"♙":"♟", label:"Color advantage",
      value:`${colorDiff}% stronger with ${better}`,
      sub:`${better} ${betterWp}% · ${better==="White"?"Black":"White"} ${worseWp}%`,
      color:better==="White"?"#f8c840":"#6e7ff3",
      detail:`You win ${betterWp}% as ${better} but only ${worseWp}% as ${better==="White"?"Black":"White"}. ${colorDiff>20?"This is a significant gap worth addressing — study your weaker color's openings.":"A moderate imbalance — worth being aware of."}`,
      score: colorDiff*3 });
  }

  // 5. Time control gap — Chess.com archive time_class, with TimeControl fallback
  const tcWin={};
  games.forEach(g=>{if(!tcWin[g.timeControl])tcWin[g.timeControl]={w:0,t:0};tcWin[g.timeControl].t++;if(g.result==="win")tcWin[g.timeControl].w++;});
  const tcR=Object.entries(tcWin).filter(([k,d])=>k!=="other"&&d.t>=8).map(([tc,d])=>({tc,wp:Math.round(d.w/d.t*100),games:d.t})).sort((a,b)=>b.wp-a.wp);
  if (tcR.length>=2 && tcR[0].wp-tcR[tcR.length-1].wp>=12) {
    const best=tcR[0], worst=tcR[tcR.length-1];
    all.push({ id:"tc_gap", icon:"⏱️", label:"Time control edge",
      value:`${best.tc} is your best format`,
      sub:`${best.wp}% in ${best.tc} vs ${worst.wp}% in ${worst.tc}`,
      color:null,
      detail:`You win ${best.wp}% in ${best.tc} (${best.games} games) vs ${worst.wp}% in ${worst.tc}. ${best.wp-worst.wp>20?"Play to your strengths — queue more "+best.tc+".":"Worth considering when you pick a time control."}`,
      score:(best.wp-worst.wp)*2 });
  }

  // 6. Upset specialist — wins vs 150+ above avg (oppElo always in PGN via WhiteElo/BlackElo)
  const elos=games.filter(g=>g.oppElo).map(g=>g.oppElo);
  const avgOpp=elos.length?Math.round(elos.reduce((a,b)=>a+b,0)/elos.length):0;
  if (avgOpp>0) {
    const upsets=games.filter(g=>g.result==="win"&&g.oppElo&&g.oppElo>avgOpp+150).length;
    if (upsets>=2) {
      all.push({ id:"upset", icon:"🎯", label:"Upset specialist",
        value:`${upsets} wins vs much stronger players`,
        sub:`Beat opponents 150+ points above your avg`, color:"#a78bfa",
        detail:`You've beaten ${upsets} opponents rated 150+ above your average (${avgOpp}). ${upsets>=5?"You clearly don't let ratings intimidate you — a great mental strength.":"Shows you can punch above your weight when it matters."}`,
        score:upsets*15 });
    }
  }

  // 7. Draw machine or draw avoider
  const drawPct=draws/total;
  if (drawPct>0.18 && draws>=6) {
    all.push({ id:"draw_high", icon:"🤝", label:"Draw specialist",
      value:`${Math.round(drawPct*100)}% draw rate`,
      sub:`${draws} draws from ${total} games`, color:"#6e7681",
      detail:`${Math.round(drawPct*100)}% of your games end in draws — ${drawPct>0.28?"unusually high":"above average"}. This often means you're good at holding difficult positions. Against stronger opponents this is a real skill.`,
      score:drawPct*120 });
  } else if (drawPct<0.03 && total>=30) {
    all.push({ id:"draw_low", icon:"⚔️", label:"No draws — ever",
      value:`Only ${draws} draws in ${total} games`,
      sub:"Pure decisive chess — win or lose", color:"#fb923c",
      detail:`You almost never draw — just ${Math.round(drawPct*100)}% draw rate. You play decisive chess. Whether that's aggression, time pressure, or fighting spirit, you're never settling for half a point.`,
      score:60 });
  }

  // 8. Day-to-day consistency from Date tag (always reliable)
  const byDate={};
  games.forEach(g=>{if(g.date&&g.date!=="?"){if(!byDate[g.date])byDate[g.date]={w:0,t:0};byDate[g.date].t++;if(g.result==="win")byDate[g.date].w++;}});
  const dayWps=Object.values(byDate).filter(d=>d.t>=3).map(d=>Math.round(d.w/d.t*100));
  if (dayWps.length>=6) {
    const avg=dayWps.reduce((a,b)=>a+b,0)/dayWps.length;
    const variance=Math.sqrt(dayWps.reduce((a,b)=>a+(b-avg)**2,0)/dayWps.length);
    if (variance<14) {
      all.push({ id:"consistent", icon:"📐", label:"Extremely consistent",
        value:`${Math.round(avg)}% win rate, low variance`,
        sub:"Steady performance across sessions", color:"#34d399",
        detail:`Your day-to-day win% is remarkably stable (variance: ${Math.round(variance)}%). You perform at ${Math.round(avg)}% regardless of the day. This points to good mental habits and reliable preparation.`,
        score:65-variance });
    } else if (variance>32) {
      all.push({ id:"streaky_days", icon:"🎢", label:"Streaky player",
        value:"Big performance swings by session",
        sub:`Best day: ${Math.max(...dayWps)}% · Worst: ${Math.min(...dayWps)}%`, color:"#fb923c",
        detail:`Your win% swings wildly — from ${Math.min(...dayWps)}% on bad days to ${Math.max(...dayWps)}% on good ones. External factors (mood, time, fatigue) likely affect your game more than average. Consider tracking when you play best.`,
        score:variance*0.8 });
    }
  }

  // 9. Opening diversity
  const uniqueOpenings=uniqueNamedOpenings(games);
  if (uniqueOpenings>=25 && total>=40) {
    all.push({ id:"explorer", icon:"🗺️", label:"Opening explorer",
      value:`${uniqueOpenings} different openings played`,
      sub:"Wide repertoire across all games", color:"#67e8f9",
      detail:`You've played ${uniqueOpenings} distinct openings — a very wide repertoire. You're not afraid to experiment. This shows curiosity and adaptability, though a narrower focus might boost results in your best lines.`,
      score:uniqueOpenings });
  } else if (uniqueOpenings<=4 && total>=20) {
    all.push({ id:"specialist", icon:"📌", label:"Opening specialist",
      value:`Only ${uniqueOpenings} openings in rotation`,
      sub:"Laser-focused repertoire", color:"#39ffa0",
      detail:`You stick to just ${uniqueOpenings} openings — highly focused. You probably know these lines deeply. Opponents who haven't prepared for your specific lines will struggle.`,
      score:60 });
  }

  // 10. Opponent level — are they punching up or down?
  if (avgOpp>0 && total>=20) {
    const highOppGames=games.filter(g=>g.oppElo&&g.oppElo>avgOpp+100).length;
    const pctHigh=highOppGames/total;
    if (pctHigh>0.3) {
      const wpHighOpp=Math.round(games.filter(g=>g.result==="win"&&g.oppElo&&g.oppElo>avgOpp+100).length/Math.max(highOppGames,1)*100);
      all.push({ id:"challenger", icon:"🏔️", label:"Seeks stronger opponents",
        value:`${Math.round(pctHigh*100)}% of games vs higher-rated`,
        sub:`${wpHighOpp}% win rate against them`, color:"#a78bfa",
        detail:`${Math.round(pctHigh*100)}% of your games are against opponents rated 100+ above your average. You're actively seeking harder competition — and winning ${wpHighOpp}% of those. ${wpHighOpp>=40?"Impressive — you're learning fast.":"Tough road but the fastest way to improve."}`,
        score:pctHigh*80+wpHighOpp*0.5 });
    }
  }

  return [...all].sort((a,b)=>b.score-a.score).slice(0,3);
}

function computePersonality(games, stats) {
  if (!games?.length) return null;
  const total=games.length, wins=games.filter(g=>g.result==="win").length, losses=games.filter(g=>g.result==="loss").length, draws=games.filter(g=>g.result==="draw").length;
  const winPct=wins/total, drawPct=draws/total;
  const tcCounts={}; games.forEach(g=>{tcCounts[g.timeControl]=(tcCounts[g.timeControl]||0)+1;});
  const favTC=Object.entries(tcCounts).sort((a,b)=>b[1]-a[1])[0]?.[0]||"blitz";
  const uniqueOpenings=uniqueNamedOpenings(games);
  const openings=aggOpenings(games);
  const aggression=winPct>.55?"high":winPct>.45?"mid":"low";
  const drawTend=drawPct>.18?"high":drawPct>.08?"mid":"low";
  const breadth=uniqueOpenings>30?"explorer":uniqueOpenings>15?"balanced":"specialist";
  const speed=favTC==="bullet"?"speed":favTC==="blitz"?"sharp":"deep";
  let title,icon,titleColor,desc,archetype;
  if(speed==="speed"&&aggression==="high"){title="The Bullet Assassin";icon="⚡";titleColor="#ffdd00";archetype="The Attacker";desc="You thrive in chaos — sub-3-minute games, sheer speed, relentless instinct.";}
  else if(speed==="speed"){title="The Clock Shark";icon="🕐";titleColor="#ff9900";archetype="The Attacker";desc="You live for bullet, play it cool — waiting for the blunder, then striking.";}
  else if(breadth==="specialist"&&aggression==="high"){title="The Opening Theorist";icon="📖";titleColor="#39ffa0";archetype="The Gambit King";desc="You know your lines cold. One or two openings, played to lethal perfection.";}
  else if(breadth==="explorer"&&speed==="deep"){title="The Renaissance Scholar";icon="🎨";titleColor="#a78bfa";archetype="The Positional Grinder";desc="No opening is a stranger. You explore theory and treat every position as a puzzle.";}
  else if(drawTend==="high"){title="The Fortress Builder";icon="🏰";titleColor="#60a5fa";archetype="The Positional Grinder";desc="Solid, unbreakable, methodical. You hold positions others would resign.";}
  else if(aggression==="high"){title="The Tactical Storm";icon="🌩️";titleColor="#f87171";archetype="The Attacker";desc="Sacrifices, combinations, chaos — all welcome. Pressure is your language.";}
  else if(speed==="deep"&&aggression==="low"){title="The Endgame Virtuoso";icon="♟";titleColor="#34d399";archetype="The Endgame Wizard";desc="When others trade into the endgame to draw, you convert. Technical mastery.";}
  else if(speed==="sharp"&&breadth==="balanced"){title="The Blitz Craftsman";icon="⚔️";titleColor="#fb923c";archetype="The Attacker";desc="Blitz is your art — fast but precise, varied repertoire, always dangerous.";}
  else if(aggression==="low"&&drawTend==="high"){title="The Positional Maestro";icon="🎼";titleColor="#c084fc";archetype="The Positional Grinder";desc="Tiny advantages compound into wins your opponents never see coming.";}
  else if(breadth==="explorer"){title="The Chess Wanderer";icon="🗺️";titleColor="#67e8f9";archetype="The Positional Grinder";desc="Variety is your spice. You roam openings, picking up something new every session.";}
  else if(total>200&&winPct>.5){title="The Grinder";icon="⚙️";titleColor="#a3e635";archetype="The Endgame Wizard";desc="Volume meets quality. Hundreds of games, winning record — that's consistency.";}
  else{title="The Eternal Student";icon="📚";titleColor="#94a3b8";archetype="The Positional Grinder";desc="Every game is a lesson. You're building the foundation of a stronger player.";}
  const elos=games.filter(g=>g.oppElo).map(g=>g.oppElo);
  const avgOpp=elos.length?Math.round(elos.reduce((a,b)=>a+b,0)/elos.length):null;
  const bestWinGame=games.filter(g=>g.result==="win"&&g.oppElo).sort((a,b)=>b.oppElo-a.oppElo)[0];
  return { title, icon, titleColor, archetype, desc, winPct:Math.round(winPct*100), drawPct:Math.round(drawPct*100), lossPct:Math.round((losses/total)*100), favTC, uniqueOpenings, avgOpp, bestWin:bestWinGame?.oppElo||null, streak:computeStreak(games), total, wins, losses, draws, breadth, speed, aggression, bestOpening:openings.filter(o=>o.games>=3).sort((a,b)=>b.winPct-a.winPct)[0] };
}

// ── UI Primitives ─────────────────────────────────────────────────────────────
const Sk = ({w="100%",h=18,style={}}) => <div className="skel" style={{width:w,height:h,...style}}/>;

function Card({children,style={},t,glow=false,hover=true,className=""}) {
  return <div className={`${hover?"card-hover":""} ${className}`} style={{background:t.card,border:`1px solid ${glow?t.accent+"40":t.cardBorder}`,borderRadius:14,boxShadow:`inset 0 1px 0 ${t.accent}08,0 4px 28px rgba(0,0,0,.45)${glow?`,0 0 40px ${t.glowC}`:""}`,padding:22,...style}}>{children}</div>;
}

function SecTitle({children,sub,t}) {
  return <div style={{marginBottom:16}}>
    <h2 style={{fontFamily:t.headingFont,fontSize:20,fontWeight:700,color:t.accent,letterSpacing:"-.01em"}}>{children}</h2>
    {sub && <p style={{fontSize:12,color:t.textDim,marginTop:3}}>{sub}</p>}
  </div>;
}

function ChartTip({active,payload,label,t}) {
  if (!active||!payload?.length) return null;
  return <div style={{background:t.bg+"f5",border:`1px solid ${t.cardBorder}`,borderRadius:8,padding:"10px 14px",fontSize:12,fontFamily:t.font}}>
    <div style={{color:t.accent,fontWeight:600,marginBottom:4}}>{label}</div>
    {payload.map((p,i)=><div key={i} style={{color:p.color||t.text}}>{p.name}: {p.value}{["winPct","Win%","Loss%","Draw%"].includes(p.name)?"%":""}</div>)}
  </div>;
}

function Donut({wins,losses,draws,size=100,t}) {
  const data=[{value:wins,color:t.win},{value:losses,color:t.loss},{value:draws,color:t.draw}];
  return <PieChart width={size} height={size}>
    <Pie data={data} cx={size/2-2} cy={size/2-2} innerRadius={size*.3} outerRadius={size*.46} dataKey="value" paddingAngle={2}>
      {data.map((d,i)=><Cell key={i} fill={d.color}/>)}
    </Pie>
  </PieChart>;
}

// ── Animated counter ──────────────────────────────────────────────────────────
function AnimatedNumber({value, duration=800, style={}}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    if (value === 0 || value === null || value === undefined) { setDisplay(value); return; }
    const start = Date.now();
    const from = 0;
    const to = typeof value === "number" ? value : parseFloat(value) || 0;
    const isFloat = String(value).includes(".");
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * eased;
      setDisplay(isFloat ? current.toFixed(1) : Math.round(current));
      if (progress < 1) ref.current = requestAnimationFrame(tick);
    };
    ref.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(ref.current);
  }, [value]);
  return <span style={style}>{display}</span>;
}

// ── Page transition wrapper ───────────────────────────────────────────────────
function PageTransition({children, keyVal}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, [keyVal]);
  return <div style={{opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(12px)", transition:"opacity .3s cubic-bezier(.22,1,.36,1), transform .3s cubic-bezier(.22,1,.36,1)"}}>{children}</div>;
}

// ── Loading bar ───────────────────────────────────────────────────────────────
function LoadingBar({active, t}) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!active) { setWidth(0); return; }
    setWidth(20);
    const t1 = setTimeout(() => setWidth(55), 400);
    const t2 = setTimeout(() => setWidth(75), 1200);
    const t3 = setTimeout(() => setWidth(88), 2500);
    return () => [t1,t2,t3].forEach(clearTimeout);
  }, [active]);
  if (!active && width === 0) return null;
  return <div style={{position:"fixed",top:0,left:0,right:0,zIndex:9999,height:3,background:`${t.glowC}30`,transition:"all .3s ease"}}>
    <div style={{height:"100%",width:`${active ? width : 100}%`,background:`linear-gradient(90deg,${t.accent2},${t.accent},${t.hl})`,borderRadius:"0 3px 3px 0",transition:active?"width 0.8s cubic-bezier(.4,0,.2,1)":"width .3s ease",boxShadow:`0 0 10px ${t.glowC}`}}/>
  </div>;
}

// ── Theme picker ──────────────────────────────────────────────────────────────
function ThemePicker({current,onChange}) {
  const [open,setOpen]=useState(false);
  const t=THEMES[current];
  return <div style={{position:"relative"}}>
    <button onClick={()=>setOpen(o=>!o)} style={{background:"none",border:`1px solid ${t.cardBorder}`,borderRadius:8,color:t.text,cursor:"pointer",fontSize:13,fontFamily:t.font,padding:"6px 12px",display:"flex",alignItems:"center",gap:6}}>
      {t.icon} {t.name} <span style={{opacity:.5,fontSize:10}}>▼</span>
    </button>
    {open && <div style={{position:"absolute",top:"110%",right:0,background:t.card,border:`1px solid ${t.cardBorder}`,borderRadius:10,padding:8,zIndex:99,minWidth:160,boxShadow:"0 8px 32px rgba(0,0,0,.6)",animation:"scaleIn .18s cubic-bezier(.22,1,.36,1) both",transformOrigin:"top right"}}>
      <div style={{fontSize:10,color:t.textDim,textTransform:"uppercase",letterSpacing:".08em",padding:"4px 8px 8px",fontFamily:t.font}}>Theme</div>
      {Object.entries(THEMES).map(([k,th])=>(
        <div key={k} onClick={()=>{onChange(k);setOpen(false);}} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:7,cursor:"pointer",background:current===k?`${th.accent}18`:"none",color:current===k?th.accent:t.textMid,fontSize:13,fontFamily:t.font,transition:"all .15s"}}>
          {th.icon} <span style={{fontWeight:current===k?600:400}}>{th.name}</span>
          <span style={{marginLeft:"auto",width:10,height:10,borderRadius:"50%",background:th.accent}}/>
        </div>
      ))}
    </div>}
  </div>;
}

// ── Win/Draw/Loss Bar ─────────────────────────────────────────────────────────
function WDLBar({wins,draws,losses,t}) {
  const total = wins+draws+losses||1;
  const wp=Math.round(wins/total*100), dp=Math.round(draws/total*100), lp=Math.round(losses/total*100);
  return <div>
    <div style={{display:"flex",height:10,borderRadius:6,overflow:"hidden",gap:2,marginBottom:6}}>
      <div style={{width:`${wp}%`,background:t.win,borderRadius:4,transition:"width .6s"}}/>
      <div style={{width:`${dp}%`,background:t.draw,borderRadius:4,transition:"width .6s"}}/>
      <div style={{width:`${lp}%`,background:t.loss,borderRadius:4,transition:"width .6s"}}/>
    </div>
    <div style={{display:"flex",gap:16,fontSize:12}}>
      <span style={{color:t.win}}>W {wp}%</span>
      <span style={{color:t.draw}}>D {dp}%</span>
      <span style={{color:t.loss}}>L {lp}%</span>
    </div>
  </div>;
}

// ── Trading Card Badge ────────────────────────────────────────────────────────
function TradingCard({p,profile,t}) {
  const [copied,setCopied]=useState(false);
  const [hovered,setHovered]=useState(false);
  if (!p) return null;
  const share = () => {
    const url = window.location.origin + window.location.pathname + `#/${profile.username}`;
    navigator.clipboard.writeText(url).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);});
  };
  const c = p.titleColor;
  const tags = [
    p.speed==="speed"?"⚡ Speed Demon":p.speed==="deep"?"🧠 Deep Thinker":"⚔️ Sharp Player",
    p.aggression==="high"?"🔥 Aggressive":p.aggression==="mid"?"⚖️ Balanced":"🛡️ Defensive",
    p.breadth==="explorer"?"🌍 Explorer":p.breadth==="specialist"?"📌 Specialist":"📐 Versatile",
  ];
  return (
    <div style={{maxWidth:400,margin:"0 auto",animation:"revealCard .6s ease both"}}>
      <div
        onMouseEnter={()=>setHovered(true)}
        onMouseLeave={()=>setHovered(false)}
        style={{
          position:"relative",overflow:"hidden",borderRadius:22,
          background:`linear-gradient(160deg,${c}28 0%,${t.bg}cc 40%,${t.bg}f0 100%)`,
          border:`1.5px solid ${c}55`,
          boxShadow:`0 0 0 1px ${c}18 inset,0 32px 80px rgba(0,0,0,.65),0 0 80px ${c}18`,
          transform:hovered?"translateY(-3px) scale(1.008)":"translateY(0) scale(1)",
          transition:"transform .3s cubic-bezier(.4,0,.2,1),box-shadow .3s ease",
        }}>

        {/* Top shine streak */}
        <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${c}60,transparent)`,pointerEvents:"none"}}/>

        {/* Radial glow blobs */}
        <div style={{position:"absolute",top:-60,right:-40,width:200,height:200,borderRadius:"50%",background:`radial-gradient(circle,${c}20,transparent 65%)`,pointerEvents:"none"}}/>
        <div style={{position:"absolute",bottom:-40,left:-30,width:150,height:150,borderRadius:"50%",background:`radial-gradient(circle,${c}10,transparent 65%)`,pointerEvents:"none"}}/>

        {/* Diagonal shimmer lines */}
        <div style={{position:"absolute",inset:0,backgroundImage:`repeating-linear-gradient(120deg,${c}05 0px,${c}05 1px,transparent 1px,transparent 28px)`,pointerEvents:"none"}}/>

        <div style={{position:"relative",padding:"32px 28px 24px"}}>

          {/* Header row */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
            <div>
              <div style={{fontSize:9,fontWeight:800,letterSpacing:".22em",textTransform:"uppercase",color:c,opacity:.65,fontFamily:t.font,marginBottom:2}}>Chess DNA</div>
              <div style={{fontSize:9,fontWeight:600,letterSpacing:".14em",textTransform:"uppercase",color:t.textDim,fontFamily:t.font}}>Player Card</div>
            </div>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:t.textDim,fontFamily:t.font,textAlign:"right"}}>
              <div style={{color:c,opacity:.7}}>♟ {profile.username||"—"}</div>
            </div>
          </div>

          {/* Icon + Title */}
          <div style={{textAlign:"center",marginBottom:22}}>
            <div style={{fontSize:58,lineHeight:1,marginBottom:12,filter:`drop-shadow(0 0 18px ${c}60)`,animation:"float 3s ease-in-out infinite",display:"inline-block"}}>{p.icon}</div>
            <div style={{fontFamily:t.headingFont,fontSize:30,fontWeight:900,color:c,lineHeight:1.05,letterSpacing:"-.02em",marginBottom:6,animation:"glow 3s ease-in-out infinite"}}>{p.title}</div>
            <div style={{display:"inline-flex",alignItems:"center",gap:6,background:`${c}15`,border:`1px solid ${c}35`,borderRadius:20,padding:"4px 14px"}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:c}}/>
              <span style={{fontSize:11,color:c,fontWeight:700,letterSpacing:".06em",fontFamily:t.font}}>{p.archetype}</span>
            </div>
          </div>

          {/* Description */}
          <div style={{fontSize:13,color:t.textMid,lineHeight:1.6,textAlign:"center",marginBottom:22,padding:"0 4px",fontFamily:t.font,fontStyle:"italic"}}>{p.desc}</div>

          {/* Divider */}
          <div style={{height:1,background:`linear-gradient(90deg,transparent,${c}30,transparent)`,marginBottom:20}}/>

          {/* Stats row */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:20}}>
            {[["Wins",p.wins,p.winPct,t.win],["Draws",p.draws,p.drawPct,t.draw],["Losses",p.losses,p.lossPct,t.loss]].map(([label,val,pct,col])=>(
              <div key={label} style={{background:`${col}0e`,border:`1px solid ${col}25`,borderRadius:12,padding:"12px 8px",textAlign:"center"}}>
                <div style={{fontSize:9,color:col,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",fontFamily:t.font,marginBottom:6,opacity:.8}}>{label}</div>
                <div style={{fontSize:26,fontWeight:800,color:col,fontFamily:t.headingFont,lineHeight:1}}>{val}</div>
                <div style={{fontSize:11,color:col,opacity:.6,marginTop:3,fontFamily:t.font}}>{pct}%</div>
              </div>
            ))}
          </div>

          {/* WDL bar */}
          <div style={{height:6,borderRadius:6,overflow:"hidden",display:"flex",gap:2,marginBottom:16}}>
            <div style={{flex:p.winPct,background:t.win,borderRadius:4,transition:"flex .6s ease"}}/>
            <div style={{flex:p.drawPct,background:t.draw,borderRadius:4,transition:"flex .6s ease"}}/>
            <div style={{flex:p.lossPct,background:t.loss,borderRadius:4,transition:"flex .6s ease"}}/>
          </div>

          {/* Extra stats */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20}}>
            {[
              ["Fav. Format",p.favTC],
              ["Avg Opponent",p.avgOpp||"—"],
              ["Best Win Elo",p.bestWin||"—"],
              ["Openings",p.uniqueOpenings],
            ].map(([label,val])=>(
              <div key={label} style={{background:`${c}08`,borderRadius:10,padding:"10px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:11,color:t.textDim,fontFamily:t.font}}>{label}</span>
                <span style={{fontSize:13,fontWeight:700,color:t.text,fontFamily:t.headingFont,textTransform:"capitalize"}}>{val}</span>
              </div>
            ))}
          </div>

          {/* Style tags */}
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:22,justifyContent:"center"}}>
            {tags.map(tag=>(
              <span key={tag} style={{background:`${c}12`,border:`1px solid ${c}28`,borderRadius:20,padding:"5px 13px",fontSize:11,color:c,fontWeight:600,fontFamily:t.font,letterSpacing:".02em"}}>{tag}</span>
            ))}
          </div>

          {/* Divider */}
          <div style={{height:1,background:`linear-gradient(90deg,transparent,${c}20,transparent)`,marginBottom:18}}/>

          {/* Share button */}
          <button onClick={share} style={{
            width:"100%",padding:"12px",borderRadius:12,border:`1px solid ${c}40`,
            background:copied?`${c}25`:`${c}14`,
            color:copied?c:t.textMid,cursor:"pointer",fontFamily:t.font,fontSize:13,fontWeight:600,
            transition:"all .2s",letterSpacing:".02em",
            display:"flex",alignItems:"center",justifyContent:"center",gap:8,
          }}>
            {copied
              ? <><span style={{color:c}}>✓</span> Link copied!</>
              : <><span style={{opacity:.6}}>🔗</span> Share this card</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Hero Player Card ──────────────────────────────────────────────────────────
function PlayerHeroCard({data,loading,t}) {
  if (loading) return <Card t={t} style={{display:"flex",gap:20,alignItems:"center"}}><Sk w={88} h={88} style={{borderRadius:"50%",flexShrink:0}}/><div style={{flex:1,display:"flex",flexDirection:"column",gap:10}}><Sk w="50%" h={24}/><Sk w="70%" h={15}/><Sk w="60%" h={12}/></div></Card>;
  if (!data) return null;
  const {profile,stats,games}=data;
  const p=computePersonality(games,stats);
  const ratings=["rapid","blitz","bullet","daily"].map(tc=>({tc,...getRating(stats,tc)})).filter(r=>r.last);
  const joined=profile.joined?new Date(profile.joined*1000).getFullYear():null;
  const total=games.length, wins=games.filter(g=>g.result==="win").length, losses=games.filter(g=>g.result==="loss").length, draws=games.filter(g=>g.result==="draw").length;

  return <Card t={t} glow={true} style={{animation:"revealCard .5s ease both"}}>
    <div style={{display:"flex",gap:20,flexWrap:"wrap",alignItems:"flex-start"}}>
      {/* Avatar */}
      <div style={{position:"relative",flexShrink:0}}>
        <div style={{width:88,height:88,borderRadius:"50%",border:`3px solid ${p?.titleColor||t.accent}60`,overflow:"hidden",background:t.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:40}}>
          {profile.avatar
            ? <img src={profile.avatar} alt="avatar" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none";e.target.parentElement.innerHTML="♟";}}/>
            : "♟"}
        </div>
        {profile.status==="premium"&&<div style={{position:"absolute",bottom:0,right:0,background:"#ffd700",borderRadius:"50%",width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#080400"}}>★</div>}
      </div>

      {/* Info */}
      <div style={{flex:1,minWidth:180}}>
        <div style={{fontFamily:t.headingFont,fontSize:24,fontWeight:700,color:t.text,lineHeight:1.1}}>{profile.username}</div>
        <div style={{fontSize:13,color:t.textDim,marginTop:3,display:"flex",gap:10,flexWrap:"wrap"}}>
          {profile.name&&<span style={{color:t.textMid}}>{profile.name}</span>}
          {profile.league&&<span style={{color:t.accent,fontWeight:600}}>🏆 {profile.league}</span>}
          {joined&&<span>📅 Since {joined}</span>}
          <span>👥 {(profile.followers||0).toLocaleString()}</span>
        </div>

        {/* Personality label */}
        {p && <div style={{marginTop:10,display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:20}}>{p.icon}</span>
          <div>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:p.titleColor,opacity:.8,fontFamily:t.font}}>Chess Personality</div>
            <div style={{fontFamily:t.headingFont,fontSize:16,fontWeight:700,color:p.titleColor,animation:"glow 3s ease-in-out infinite"}}>{p.title}</div>
          </div>
        </div>}

        {/* Rating pills */}
        <div style={{display:"flex",flexWrap:"wrap",gap:7,marginTop:12}}>
          {ratings.map((r,ri)=>(
            <div key={r.tc} style={{background:`${t.accent}0e`,border:`1px solid ${t.accent}20`,borderRadius:8,padding:"6px 12px",textAlign:"center",minWidth:64,animation:`scaleIn .3s ${.08+ri*.07}s cubic-bezier(.22,1,.36,1) both`}}>
              <div style={{fontSize:9,color:t.textDim,textTransform:"uppercase",letterSpacing:".07em"}}>{r.tc}</div>
              <div style={{fontSize:20,fontWeight:700,color:t.accent,fontFamily:t.headingFont}}>{r.last}</div>
              {r.best&&r.best>r.last&&<div style={{fontSize:9,color:t.textDim}}>↑{r.best}</div>}
            </div>
          ))}
          {stats?.tactics?.highest?.rating&&<div style={{background:`${t.hl}0e`,border:`1px solid ${t.hl}20`,borderRadius:8,padding:"6px 12px",textAlign:"center",minWidth:64}}>
            <div style={{fontSize:9,color:t.textDim,textTransform:"uppercase",letterSpacing:".07em"}}>Puzzle</div>
            <div style={{fontSize:20,fontWeight:700,color:t.hl,fontFamily:t.headingFont}}>{stats.tactics.highest.rating}</div>
          </div>}
        </div>
      </div>

      {/* WDL */}
      {total>0&&<div style={{minWidth:160,flex:1}}>
        <div style={{fontSize:11,color:t.textDim,textTransform:"uppercase",letterSpacing:".07em",marginBottom:8,fontFamily:t.font}}>Recent Performance</div>
        <WDLBar wins={wins} draws={draws} losses={losses} t={t}/>
        <div style={{fontSize:12,color:t.textDim,marginTop:6}}>{total} games analyzed</div>
      </div>}
    </div>
  </Card>;
}

// ── Opening DNA Column ────────────────────────────────────────────────────────
function OpeningDNA({games,loading,t,tc="all"}) {
  if (loading) return <div style={{display:"flex",flexDirection:"column",gap:8}}>{[...Array(5)].map((_,i)=><Sk key={i} h={44}/>)}</div>;
  if (!games?.length) return <div style={{color:t.textDim,fontSize:13}}>No games loaded.</div>;
  const top5=aggOpenings(games,tc).filter(o=>o.games>=2).sort((a,b)=>b.games-a.games).slice(0,5);
  return <div style={{display:"flex",flexDirection:"column",gap:8}}>
    {top5.map((o,i)=>(
      <div key={i} style={{background:`${t.accent}06`,border:`1px solid ${t.cardBorder}`,borderRadius:10,padding:"10px 12px",display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:22,height:22,borderRadius:"50%",background:i===0?t.accent:`${t.accent}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:i===0?t.bg:t.textDim,flexShrink:0,fontFamily:t.font}}>{i+1}</div>
        <div style={{flex:1,minWidth:0}}>
          <a href={openingLink(o.opening,o.openingUrl)} target="_blank" rel="noopener noreferrer" style={{fontSize:12,color:t.text,fontWeight:500,textDecoration:"none",display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",transition:"color .15s"}} onMouseEnter={e=>e.target.style.color=t.accent} onMouseLeave={e=>e.target.style.color=t.text}>{o.opening.length>28?o.opening.slice(0,26)+"…":o.opening}</a>
          <div style={{fontSize:11,color:t.textDim}}>{o.games} games</div>
        </div>
        <span className={`badge ${o.winPct>=55?"green":o.winPct>=45?"yellow":"red"}`}>{o.winPct}%</span>
      </div>
    ))}
    {!top5.length&&<div style={{color:t.textDim,fontSize:13}}>Not enough games with opening data.</div>}
  </div>;
}

// ── Performance Chart ─────────────────────────────────────────────────────────
function PerformanceChart({games,stats,loading,t}) {
  const tip=(props)=><ChartTip {...props} t={t}/>;
  if (loading) return <Sk h={180}/>;

  // Build rating trend from real data if possible, else placeholder
  const blitzR=getRating(stats||{},"blitz").last||1200;
  const rapidR=getRating(stats||{},"rapid").last||1200;
  const baseR=blitzR||rapidR;

  let chartData;
  if (games?.length) {
    // Group wins/losses by date and simulate rating movement
    const byDate={};
    [...games].reverse().forEach(g=>{ if(g.date&&g.date!=="?") { if(!byDate[g.date])byDate[g.date]=[]; byDate[g.date].push(g); } });
    const dates=Object.keys(byDate).sort().slice(-15);
    let rating=baseR;
    chartData=dates.map(date=>{
      const gs=byDate[date];
      const w=gs.filter(g=>g.result==="win").length, l=gs.filter(g=>g.result==="loss").length;
      rating=Math.max(100,rating+(w-l)*8);
      return {date:date.slice(5),rating:Math.round(rating)};
    });
  }
  if (!chartData?.length) {
    // Placeholder data
    const now=new Date();
    chartData=Array.from({length:14},(_,i)=>{
      const d=new Date(now); d.setDate(d.getDate()-(13-i));
      return {date:`${d.getMonth()+1}/${d.getDate()}`,rating:Math.round(baseR+Math.sin(i*.7)*30+Math.random()*20-10)};
    });
  }

  return <ResponsiveContainer width="100%" height={170}>
    <LineChart data={chartData} margin={{top:5,right:5,left:0,bottom:0}}>
      <CartesianGrid stroke={`${t.accent}10`} strokeDasharray="3 3"/>
      <XAxis dataKey="date" tick={{fill:t.textDim,fontSize:10}} axisLine={false} tickLine={false}/>
      <YAxis tick={{fill:t.textDim,fontSize:10}} axisLine={false} tickLine={false} domain={["auto","auto"]} width={40}/>
      <Tooltip content={tip}/>
      <Line type="monotone" dataKey="rating" stroke={t.accent} strokeWidth={2} dot={false} name="Rating"/>
    </LineChart>
  </ResponsiveContainer>;
}

// ── Insights Column ───────────────────────────────────────────────────────────
function InsightCard({item,t}) {
  const [hovered,setHovered]=useState(false);
  return <div
    onMouseEnter={()=>setHovered(true)}
    onMouseLeave={()=>setHovered(false)}
    style={{background:hovered?`${item.color||t.accent}12`:`${t.accent}06`,border:`1px solid ${hovered?(item.color||t.accent)+"50":t.cardBorder}`,borderRadius:10,padding:"12px 14px",display:"flex",gap:12,alignItems:"flex-start",cursor:"default",transition:"all .2s",position:"relative"}}>
    <span style={{fontSize:22,flexShrink:0}}>{item.icon}</span>
    <div style={{flex:1,minWidth:0}}>
      <div style={{fontSize:10,color:t.textDim,textTransform:"uppercase",letterSpacing:".07em",marginBottom:3,fontFamily:t.font}}>{item.label}</div>
      <div style={{fontSize:14,fontWeight:600,color:item.color||t.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.value}</div>
      {!hovered&&item.sub&&<div style={{fontSize:11,color:t.textDim,marginTop:2}}>{item.sub}</div>}
      {hovered&&<div style={{fontSize:12,color:t.textMid,marginTop:6,lineHeight:1.55,whiteSpace:"normal",animation:"fadeInUp .2s cubic-bezier(.22,1,.36,1) both"}}>{item.detail}</div>}
    </div>
    <div style={{fontSize:10,color:t.textDim,flexShrink:0,marginTop:2}}>{hovered?"▲":"▼"}</div>
  </div>;
}

function InsightsColumn({games,loading,t}) {
  if (loading) return <div style={{display:"flex",flexDirection:"column",gap:10}}>{[...Array(3)].map((_,i)=><Sk key={i} h={70}/>)}</div>;
  if (!games?.length) return <div style={{color:t.textDim,fontSize:13}}>No games loaded.</div>;
  const items = computeInsights(games);
  if (!items.length) return <div style={{color:t.textDim,fontSize:13}}>Not enough game data for insights.</div>;
  return <div style={{display:"flex",flexDirection:"column",gap:10}}>
    {items.map(item=><InsightCard key={item.id} item={item} t={t}/>)}
    <div style={{fontSize:10,color:t.textDim,textAlign:"center",marginTop:2}}>Hover any card for details</div>
  </div>;
}

// ── Full Openings Tab ─────────────────────────────────────────────────────────
function OpeningsTab({games,loading,t}) {
  const [tc,setTc]=useState("all");
  const [sort,setSort]=useState({key:"games",dir:-1});
  const [min,setMin]=useState(1);
  const toggleSort=k=>setSort(s=>({key:k,dir:s.key===k?-s.dir:-1}));
  const tip=(props)=><ChartTip {...props} t={t}/>;
  if (loading) return <div style={{display:"flex",flexDirection:"column",gap:10}}>{[...Array(5)].map((_,i)=><Sk key={i} h={34}/>)}</div>;
  if (!games?.length) return <div style={{color:t.textDim}}>No games.</div>;
  const data=aggOpenings(games,tc).filter(o=>o.games>=min);
  const sorted=[...data].sort((a,b)=>sort.dir*((a[sort.key]??"")<(b[sort.key]??"")? -1:1));
  const top10=[...data].sort((a,b)=>b.games-a.games).slice(0,10);
  return <div style={{display:"flex",flexDirection:"column",gap:16}}>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
      <span style={{fontSize:12,color:t.textDim}}>Time control:</span>
      {["all","daily","rapid","blitz","bullet"].map(x=>(
        <button key={x} onClick={()=>setTc(x)} style={{background:tc===x?`${t.accent}18`:"none",border:`1px solid ${tc===x?t.accent+"60":t.cardBorder}`,borderRadius:20,color:tc===x?t.accent:t.textDim,cursor:"pointer",fontFamily:t.font,fontSize:12,fontWeight:tc===x?600:400,padding:"4px 12px",transition:"all .2s"}}>{x}</button>
      ))}
      <span style={{fontSize:12,color:t.textDim,marginLeft:8}}>Min:</span>
      <select value={min} onChange={e=>setMin(+e.target.value)}>{[1,2,3,5,10].map(n=><option key={n} value={n}>{n}</option>)}</select>
    </div>
    <Card t={t}>
      <SecTitle t={t}>Top Openings — Outcome Split</SecTitle>
      <ResponsiveContainer width="100%" height={Math.max(180,top10.length*36)}>
        <BarChart data={top10} layout="vertical" margin={{left:160}}>
          <XAxis type="number" domain={[0,100]} tick={{fill:t.textDim,fontSize:10}} axisLine={false} tickLine={false}/>
          <YAxis type="category" dataKey="opening" tick={{fill:t.textMid,fontSize:11}} width={155} axisLine={false} tickLine={false} tickFormatter={v=>v.length>22?v.slice(0,20)+"…":v}/>
          <Tooltip content={tip}/><Legend wrapperStyle={{color:t.textMid,fontSize:12}}/>
          <Bar dataKey="winPct" name="Win %" stackId="a" fill={t.win}/>
          <Bar dataKey="drawPct" name="Draw %" stackId="a" fill={t.draw}/>
          <Bar dataKey="lossPct" name="Loss %" stackId="a" fill={t.loss} radius={[0,4,4,0]}/>
        </BarChart>
      </ResponsiveContainer>
    </Card>
    <Card t={t}>
      <SecTitle t={t}>All Openings</SecTitle>
      <div style={{overflowX:"auto"}}>
        <table>
          <thead><tr>{[["opening","Opening"],["games","Games"],["winPct","Win%"],["lossPct","Loss%"],["drawPct","Draw%"],["avgOpp","Avg Opp"]].map(([k,l])=><th key={k} onClick={()=>toggleSort(k)}>{l}{sort.key===k?sort.dir===1?" ↑":" ↓":""}</th>)}</tr></thead>
          <tbody>{sorted.map((o,i)=>(
            <tr key={i}>
              <td style={{maxWidth:240,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                <a href={openingLink(o.opening,o.openingUrl)} target="_blank" rel="noopener noreferrer" style={{color:t.text,textDecoration:"none",transition:"color .15s"}} onMouseEnter={e=>e.target.style.color=t.accent} onMouseLeave={e=>e.target.style.color=t.text}>{o.opening} ↗</a>
              </td>
              <td style={{fontWeight:600,color:t.text}}>{o.games}</td>
              <td><span style={{color:t.win,fontWeight:700}}>{o.winPct}%</span></td>
              <td><span style={{color:t.loss}}>{o.lossPct}%</span></td>
              <td><span style={{color:t.draw}}>{o.drawPct}%</span></td>
              <td>{o.avgOpp||"—"}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </Card>
  </div>;
}

// ── Color Stats Tab ───────────────────────────────────────────────────────────
function ColorTab({games,loading,t}) {
  const tip=(props)=><ChartTip {...props} t={t}/>;
  if (loading) return <Sk h={240}/>;
  if (!games?.length) return <div style={{color:t.textDim}}>No games.</div>;
  const {white,black}=colorStats(games);
  const Panel=({label,s,icon})=>{
    const tot=s.total||1;
    return <Card t={t} style={{flex:1,minWidth:200}}>
      <div style={{fontFamily:t.headingFont,fontSize:18,fontWeight:700,color:t.text,marginBottom:4}}>{icon} {label}</div>
      <div style={{fontSize:12,color:t.textDim,marginBottom:14}}>{s.total} games</div>
      <div style={{display:"flex",gap:14,alignItems:"center",flexWrap:"wrap"}}>
        <Donut wins={s.wins} losses={s.losses} draws={s.draws} t={t} size={100}/>
        <div style={{display:"flex",flexDirection:"column",gap:5}}>
          {[["Wins",s.wins,t.win],["Losses",s.losses,t.loss],["Draws",s.draws,t.draw]].map(([l,v,c])=>(
            <div key={l} style={{display:"flex",alignItems:"center",gap:8,fontSize:13}}>
              <div style={{width:9,height:9,borderRadius:2,background:c,flexShrink:0}}/>
              <span style={{color:t.textDim}}>{l}:</span><span style={{color:c,fontWeight:700}}>{v}</span>
              <span style={{color:t.textDim,fontSize:11}}>({Math.round(v/tot*100)}%)</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:1}}>
        {[["Avg opp",s.avgOpp||"—"],["Best win",s.bestWinElo?`${s.bestWinOpp} (${s.bestWinElo})`:"—"]].map(([l,v])=>(
          <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${t.cardBorder}40`,fontSize:13}}>
            <span style={{color:t.textDim}}>{l}</span><span style={{color:t.accent,fontWeight:600}}>{v}</span>
          </div>
        ))}
      </div>
    </Card>;
  };
  return <div style={{display:"flex",flexDirection:"column",gap:16}}>
    <div style={{display:"flex",gap:14,flexWrap:"wrap"}}><Panel label="White" s={white} icon="♙"/><Panel label="Black" s={black} icon="♟"/></div>
    <Card t={t}>
      <SecTitle t={t}>White vs Black</SecTitle>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={[{name:"Win%",White:white.total?Math.round(white.wins/white.total*100):0,Black:black.total?Math.round(black.wins/black.total*100):0},{name:"Draw%",White:white.total?Math.round(white.draws/white.total*100):0,Black:black.total?Math.round(black.draws/black.total*100):0},{name:"Loss%",White:white.total?Math.round(white.losses/white.total*100):0,Black:black.total?Math.round(black.losses/black.total*100):0}]}>
          <XAxis dataKey="name" tick={{fill:t.textDim,fontSize:12}} axisLine={false} tickLine={false}/>
          <YAxis domain={[0,100]} tick={{fill:t.textDim,fontSize:11}} axisLine={false} tickLine={false}/>
          <Tooltip content={tip}/>
          <Bar dataKey="White" fill="#f8c840" radius={[4,4,0,0]}/><Bar dataKey="Black" fill="#6e7ff3" radius={[4,4,0,0]}/>
          <Legend wrapperStyle={{color:t.textMid,fontSize:12}}/>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  </div>;
}

// ── Elo Tab ───────────────────────────────────────────────────────────────────
function EloTab({games,stats,loading,t}) {
  const tip=(props)=><ChartTip {...props} t={t}/>;
  if (loading) return <Sk h={240}/>;
  if (!games?.length) return <div style={{color:t.textDim}}>No games.</div>;
  const data=eloBrackets(games);
  const avgOpp=(() => { const e=games.filter(g=>g.oppElo).map(g=>g.oppElo); return e.length?Math.round(e.reduce((a,b)=>a+b,0)/e.length):0; })();
  return <Card t={t}>
    <SecTitle t={t} sub={`Avg opponent: ${avgOpp}`}>Win% by Opponent Rating</SecTitle>
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <XAxis dataKey="label" tick={{fill:t.textDim,fontSize:11}} axisLine={false} tickLine={false}/>
        <YAxis domain={[0,100]} tick={{fill:t.textDim,fontSize:11}} axisLine={false} tickLine={false}/>
        <Tooltip content={tip}/>
        <Bar dataKey="winPct" name="Win%" radius={[5,5,0,0]}>{data.map((e,i)=><Cell key={i} fill={e.winPct>=55?t.win:e.winPct>=45?"#ffc800":t.loss}/>)}</Bar>
      </BarChart>
    </ResponsiveContainer>
  </Card>;
}

// ── Compare Tab ───────────────────────────────────────────────────────────────
function CompareTab({p1,p2,l1,l2,p2In,setP2In,loadP2,t}) {
  const tip=(props)=><ChartTip {...props} t={t}/>;
  if (!p2&&!l2) return <div style={{display:"flex",flexDirection:"column",gap:16}}>
    <div style={{textAlign:"center",padding:"24px 0 12px",color:t.textDim}}>
      <div style={{fontSize:48,marginBottom:10}}>⚔️</div>
      <div style={{fontFamily:t.headingFont,fontSize:20,color:t.textMid,marginBottom:6}}>Head-to-Head</div>
      <div style={{fontSize:13}}>Load a second player to compare</div>
    </div>
    <Card t={t}><div style={{display:"flex",gap:10}}>
      <input placeholder="Opponent username…" value={p2In} onChange={e=>setP2In(e.target.value)} onKeyDown={e=>e.key==="Enter"&&loadP2()}/>
      <button className="primary" onClick={loadP2} disabled={!p2In.trim()}>Compare</button>
    </div></Card>
  </div>;
  if (l1||l2) return <Sk h={300}/>;
  if (!p1||!p2) return null;
  const norm=(v,mx)=>Math.round((v/Math.max(mx,1))*100);
  const p1r=getRating(p1.stats,"blitz").last||0, p2r=getRating(p2.stats,"blitz").last||0;
  const p1w=p1.games.length?Math.round(p1.games.filter(g=>g.result==="win").length/p1.games.length*100):0;
  const p2w=p2.games.length?Math.round(p2.games.filter(g=>g.result==="win").length/p2.games.length*100):0;
  const p1pz=p1.stats?.tactics?.highest?.rating||0, p2pz=p2.stats?.tactics?.highest?.rating||0;
  const e1=p1.games.filter(g=>g.oppElo).map(g=>g.oppElo), e2=p2.games.filter(g=>g.oppElo).map(g=>g.oppElo);
  const ao1=e1.length?Math.round(e1.reduce((a,b)=>a+b,0)/e1.length):0, ao2=e2.length?Math.round(e2.reduce((a,b)=>a+b,0)/e2.length):0;
  const d1=uniqueNamedOpenings(p1.games), d2=uniqueNamedOpenings(p2.games);
  const radar=[{subject:"Win%",[p1.profile.username]:p1w,[p2.profile.username]:p2w},{subject:"Rating",[p1.profile.username]:norm(p1r,Math.max(p1r,p2r)),[p2.profile.username]:norm(p2r,Math.max(p1r,p2r))},{subject:"Puzzle",[p1.profile.username]:norm(p1pz,Math.max(p1pz,p2pz)),[p2.profile.username]:norm(p2pz,Math.max(p1pz,p2pz))},{subject:"Avg Opp",[p1.profile.username]:norm(ao1,Math.max(ao1,ao2)),[p2.profile.username]:norm(ao2,Math.max(ao1,ao2))},{subject:"Diversity",[p1.profile.username]:norm(d1,Math.max(d1,d2)),[p2.profile.username]:norm(d2,Math.max(d1,d2))}];
  const p1open=aggOpenings(p1.games).sort((a,b)=>b.games-a.games).slice(0,5);
  const p2open=aggOpenings(p2.games);
  const shared=p1open.map(o=>({opening:o.opening.length>18?o.opening.slice(0,16)+"…":o.opening,[p1.profile.username]:o.winPct,[p2.profile.username]:p2open.find(x=>x.opening===o.opening)?.winPct??0}));
  const MiniCard=({p,accent})=>(
    <Card t={t} style={{flex:1,minWidth:180}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
        <div style={{width:44,height:44,borderRadius:"50%",border:`2px solid ${accent}50`,overflow:"hidden",background:t.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>
          {p.profile.avatar?<img src={p.profile.avatar} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none";}}/>:"♟"}
        </div>
        <div><div style={{fontFamily:t.headingFont,fontSize:16,fontWeight:700,color:accent}}>{p.profile.username}</div><div style={{fontSize:11,color:t.textDim}}>{p.games.length} games</div></div>
      </div>
      {["rapid","blitz","bullet"].map(tc=>{const r=getRating(p.stats,tc);return r.last?<div key={tc} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${t.cardBorder}40`,fontSize:13}}><span style={{color:t.textDim,textTransform:"capitalize"}}>{tc}</span><span style={{color:t.text,fontWeight:600}}>{r.last}</span></div>:null;})}
      <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",fontSize:13}}><span style={{color:t.textDim}}>Win rate</span><span style={{color:accent,fontWeight:700}}>{p.games.length?Math.round(p.games.filter(g=>g.result==="win").length/p.games.length*100):0}%</span></div>
    </Card>
  );
  return <div style={{display:"flex",flexDirection:"column",gap:16}}>
    {/* VS section */}
    <div style={{display:"flex",gap:12,alignItems:"stretch",flexWrap:"wrap"}}>
      <MiniCard p={p1} accent={P1_COLOR}/>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"0 4px"}}>
        <div style={{fontFamily:t.headingFont,fontSize:28,fontWeight:900,color:t.textDim,textShadow:`0 0 20px ${t.glowC}`}}>VS</div>
      </div>
      <MiniCard p={p2} accent={P2_COLOR}/>
    </div>
    <Card t={t}><SecTitle t={t}>Radar Comparison</SecTitle>
      <ResponsiveContainer width="100%" height={250}>
        <RadarChart data={radar} cx="50%" cy="50%">
          <PolarGrid stroke={`${t.accent}15`}/><PolarAngleAxis dataKey="subject" tick={{fill:t.textMid,fontSize:12}}/><PolarRadiusAxis tick={false} axisLine={false} domain={[0,100]}/>
          <Radar name={p1.profile.username} dataKey={p1.profile.username} stroke={P1_COLOR} fill={P1_COLOR} fillOpacity={.2}/>
          <Radar name={p2.profile.username} dataKey={p2.profile.username} stroke={P2_COLOR} fill={P2_COLOR} fillOpacity={.16}/>
          <Legend wrapperStyle={{color:t.textMid,fontSize:12,fontFamily:t.font}}/><Tooltip content={tip}/>
        </RadarChart>
      </ResponsiveContainer>
    </Card>
    <Card t={t}><SecTitle t={t}>Shared Opening Win%</SecTitle>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={shared} layout="vertical" margin={{left:125}}>
          <XAxis type="number" domain={[0,100]} tick={{fill:t.textDim,fontSize:10}} axisLine={false} tickLine={false}/>
          <YAxis type="category" dataKey="opening" tick={{fill:t.textMid,fontSize:11}} width={120} axisLine={false} tickLine={false}/>
          <Tooltip content={tip}/>
          <Bar dataKey={p1.profile.username} fill={P1_COLOR} radius={[0,4,4,0]}/><Bar dataKey={p2.profile.username} fill={P2_COLOR} radius={[0,4,4,0]}/>
          <Legend wrapperStyle={{color:t.textMid,fontSize:12}}/>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  </div>;
}

// ── DNA Tab ───────────────────────────────────────────────────────────────────
function DnaTab({games,stats,loading,t,profile}) {
  const tip=(props)=><ChartTip {...props} t={t}/>;
  if (loading) return <Sk h={300}/>;
  const p=computePersonality(games,stats);
  if (!p) return <div style={{color:t.textDim,textAlign:"center",padding:40,fontSize:14}}>Load a player to reveal their Chess DNA.</div>;
  return <div style={{display:"flex",flexDirection:"column",gap:20}}>
    <TradingCard p={p} profile={profile||{username:""}} t={t}/>
    <Card t={t}><SecTitle t={t}>Playstyle DNA Radar</SecTitle>
      <ResponsiveContainer width="100%" height={230}>
        <RadarChart data={[{subject:"Aggression",value:p.aggression==="high"?90:p.aggression==="mid"?55:25},{subject:"Speed",value:p.speed==="speed"?90:p.speed==="sharp"?60:30},{subject:"Breadth",value:p.breadth==="explorer"?90:p.breadth==="balanced"?55:25},{subject:"Win Rate",value:p.winPct},{subject:"Consistency",value:Math.min(100,Math.round(p.total/4))},{subject:"Draw Avoid",value:100-p.drawPct*2}]} cx="50%" cy="50%">
          <PolarGrid stroke={`${p.titleColor}20`}/><PolarAngleAxis dataKey="subject" tick={{fill:t.textMid,fontSize:12}}/><PolarRadiusAxis tick={false} axisLine={false} domain={[0,100]}/>
          <Radar dataKey="value" stroke={p.titleColor} fill={p.titleColor} fillOpacity={.2}/><Tooltip content={tip}/>
        </RadarChart>
      </ResponsiveContainer>
    </Card>
  </div>;
}

// ── Overview Tab (rich dashboard) ────────────────────────────────────────────
function OverviewTab({data,loading,t}) {
  const tip=(props)=><ChartTip {...props} t={t}/>;
  if (loading) return <div style={{display:"flex",flexDirection:"column",gap:14}}>{[...Array(4)].map((_,i)=><Sk key={i} h={90}/>)}</div>;
  if (!data) return null;
  const {games,stats}=data;
  const total=games.length;
  const wins=games.filter(g=>g.result==="win").length;
  const losses=games.filter(g=>g.result==="loss").length;
  const draws=games.filter(g=>g.result==="draw").length;
  const winPct=total?Math.round(wins/total*100):0;
  const lossPct=total?Math.round(losses/total*100):0;
  const drawPct=total?Math.round(draws/total*100):0;

  // Per-opening data for mini chart
  const openings=aggOpenings(games).sort((a,b)=>b.games-a.games).slice(0,6);

  // Color stats
  const wG=games.filter(g=>g.color==="white"), bG=games.filter(g=>g.color==="black");
  const wW=wG.filter(g=>g.result==="win").length, bW=bG.filter(g=>g.result==="win").length;
  const wWp=wG.length?Math.round(wW/wG.length*100):0, bWp=bG.length?Math.round(bW/bG.length*100):0;

  // Rating bar data
  const rBar=["rapid","blitz","bullet","daily"].map(tc=>({name:tc,rating:getRating(stats,tc).last,best:getRating(stats,tc).best})).filter(d=>d.rating);

  // Time control data
  const tcMap={}; games.forEach(g=>{tcMap[g.timeControl]=(tcMap[g.timeControl]||0)+1;});
  const tcData=Object.entries(tcMap).filter(([k])=>k!=="other").map(([name,value])=>({name,value}));

  // Elo brackets mini
  const brackets=eloBrackets(games).slice(0,5);

  // Recent form (last 20 games)
  const recent=games.slice(0,20);
  const recentWins=recent.filter(g=>g.result==="win").length;
  const recentForm=Math.round(recentWins/Math.max(recent.length,1)*100);
  const formTrend=recentForm>winPct?"↑ Better than avg":recentForm<winPct-5?"↓ Below avg":"→ On pace";
  const formColor=recentForm>winPct?t.win:recentForm<winPct-5?t.loss:t.textMid;

  // Avg opponent
  const elos=games.filter(g=>g.oppElo).map(g=>g.oppElo);
  const avgOpp=elos.length?Math.round(elos.reduce((a,b)=>a+b,0)/elos.length):null;
  const bestWin=games.filter(g=>g.result==="win"&&g.oppElo).sort((a,b)=>b.oppElo-a.oppElo)[0];

  // Opening diversity
  const uniqueO=uniqueNamedOpenings(games);

  const StatCard=({label,value,color,sub,i})=>(
    <Card t={t} className={`stagger-${i+1}`} style={{padding:"16px 18px",textAlign:"center",minWidth:100}}>
      <div style={{fontSize:10,color:t.textDim,textTransform:"uppercase",letterSpacing:".07em",marginBottom:6,fontFamily:t.font}}>{label}</div>
      <div style={{fontSize:28,fontWeight:700,color:color||t.text,fontFamily:t.headingFont}}>{typeof value==="number"?<AnimatedNumber value={value} duration={600}/>:value}</div>
      {sub&&<div style={{fontSize:11,color:t.textDim,marginTop:3}}>{sub}</div>}
    </Card>
  );

  return <div style={{display:"flex",flexDirection:"column",gap:16}}>

    {/* Row 1 — 6 key stats */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))",gap:10}}>
      <StatCard i={1} label="Total Games" value={total} color={t.accent}/>
      <StatCard i={2} label="Wins" value={wins} color={t.win} sub={winPct+"%"}/>
      <StatCard i={3} label="Losses" value={losses} color={t.loss} sub={lossPct+"%"}/>
      <StatCard i={4} label="Draws" value={draws} color={t.draw} sub={drawPct+"%"}/>
      <StatCard i={5} label="Avg Opponent" value={avgOpp||"—"} color={t.textMid}/>
      <StatCard i={6} label="Openings Used" value={uniqueO} color={t.hl}/>
    </div>

    {/* Row 2 — WDL bar + recent form + best win */}
    <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
      <Card t={t} style={{flex:2,minWidth:220}}>
        <SecTitle t={t} sub="All games">Win / Draw / Loss</SecTitle>
        <div style={{display:"flex",height:14,borderRadius:8,overflow:"hidden",gap:2,marginBottom:10}}>
          <div style={{width:`${winPct}%`,background:t.win,transition:"width .8s cubic-bezier(.4,0,.2,1)"}}/>
          <div style={{width:`${drawPct}%`,background:t.draw,transition:"width .8s cubic-bezier(.4,0,.2,1)"}}/>
          <div style={{width:`${lossPct}%`,background:t.loss,transition:"width .8s cubic-bezier(.4,0,.2,1)"}}/>
        </div>
        <div style={{display:"flex",gap:20,fontSize:13}}>
          {[["W",winPct,t.win],["D",drawPct,t.draw],["L",lossPct,t.loss]].map(([l,v,c])=>(
            <div key={l} style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:8,height:8,borderRadius:2,background:c}}/>
              <span style={{color:t.textDim}}>{l}</span>
              <span style={{color:c,fontWeight:700}}>{v}%</span>
            </div>
          ))}
        </div>
        <div style={{marginTop:16,paddingTop:14,borderTop:`1px solid ${t.cardBorder}40`}}>
          <div style={{fontSize:11,color:t.textDim,textTransform:"uppercase",letterSpacing:".07em",marginBottom:8}}>Recent form (last 20)</div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {recent.map((g,i)=>(
              <div key={i} style={{width:16,height:16,borderRadius:3,background:g.result==="win"?t.win:g.result==="loss"?t.loss:t.draw,opacity:.85,title:g.result}}/>
            ))}
          </div>
          <div style={{fontSize:12,color:formColor,marginTop:8,fontWeight:600}}>{formTrend} · {recentForm}% last 20 games</div>
        </div>
      </Card>
      <Card t={t} style={{flex:1,minWidth:180}}>
        <SecTitle t={t} sub="Color performance">White vs Black</SecTitle>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {[["♙ White",wWp,wG.length,"#f8c840"],["♟ Black",bWp,bG.length,"#6e7ff3"]].map(([l,wp,g,c])=>(
            <div key={l}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:5}}>
                <span style={{color:t.textMid}}>{l}</span>
                <span style={{color:c,fontWeight:700}}>{wp}%</span>
              </div>
              <div style={{height:8,borderRadius:4,background:`${c}20`,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${wp}%`,background:c,borderRadius:4,transition:"width .7s ease"}}/>
              </div>
              <div style={{fontSize:11,color:t.textDim,marginTop:3}}>{g} games</div>
            </div>
          ))}
        </div>
        {bestWin&&<div style={{marginTop:14,paddingTop:12,borderTop:`1px solid ${t.cardBorder}40`,fontSize:12}}>
          <span style={{color:t.textDim}}>Best win: </span>
          <span style={{color:t.win,fontWeight:600}}>{bestWin.opponent}</span>
          <span style={{color:t.textDim}}> ({bestWin.oppElo})</span>
        </div>}
      </Card>
    </div>

    {/* Row 3 — Ratings + Time Controls */}
    <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
      <Card t={t} style={{flex:2,minWidth:220}}>
        <SecTitle t={t} sub="Current · Peak">Ratings</SecTitle>
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={rBar} barCategoryGap="30%">
            <XAxis dataKey="name" tick={{fill:t.textDim,fontSize:12}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fill:t.textDim,fontSize:10}} axisLine={false} tickLine={false} domain={["auto","auto"]}/>
            <Tooltip content={tip}/>
            <Bar dataKey="rating" name="Current" fill={t.accent} radius={[5,5,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:8}}>
          {rBar.map(r=><div key={r.name} style={{background:`${t.accent}0e`,border:`1px solid ${t.accent}20`,borderRadius:7,padding:"5px 12px",textAlign:"center"}}>
            <div style={{fontSize:9,color:t.textDim,textTransform:"uppercase"}}>{r.name}</div>
            <div style={{fontSize:18,fontWeight:700,color:t.accent,fontFamily:t.headingFont}}>{r.rating}</div>
            {r.best&&r.best>r.rating&&<div style={{fontSize:9,color:t.textDim}}>↑{r.best}</div>}
          </div>)}
        </div>
      </Card>
      <Card t={t} style={{flex:1,minWidth:180}}>
        <SecTitle t={t} sub="Game distribution">Time Controls</SecTitle>
        <ResponsiveContainer width="100%" height={120}>
          <PieChart>
            <Pie data={tcData} cx="50%" cy="50%" outerRadius={52} dataKey="value" paddingAngle={2}>
              {tcData.map((_,i)=><Cell key={i} fill={[t.accent,t.accent2,t.hl,t.textMid][i%4]}/>)}
            </Pie>
            <Tooltip content={tip}/>
          </PieChart>
        </ResponsiveContainer>
        <div style={{display:"flex",flexDirection:"column",gap:4,marginTop:4}}>
          {tcData.map((d,i)=>(
            <div key={d.name} style={{display:"flex",justifyContent:"space-between",fontSize:12}}>
              <span style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:8,height:8,borderRadius:2,background:[t.accent,t.accent2,t.hl,t.textMid][i%4]}}/>
                <span style={{color:t.textDim,textTransform:"capitalize"}}>{d.name}</span>
              </span>
              <span style={{color:t.text,fontWeight:600}}>{d.value}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>

    {/* Row 4 — Top openings mini + Elo brackets */}
    <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
      <Card t={t} style={{flex:2,minWidth:220}}>
        <SecTitle t={t} sub="Top 6 by games played">Opening Performance</SecTitle>
        <ResponsiveContainer width="100%" height={Math.max(160,openings.length*30)}>
          <BarChart data={openings} layout="vertical" margin={{left:150}}>
            <XAxis type="number" domain={[0,100]} tick={{fill:t.textDim,fontSize:10}} axisLine={false} tickLine={false}/>
            <YAxis type="category" dataKey="opening" tick={{fill:t.textMid,fontSize:10}} width={145} axisLine={false} tickLine={false} tickFormatter={v=>v.length>22?v.slice(0,20)+"…":v}/>
            <Tooltip content={tip}/>
            <Bar dataKey="winPct" name="Win%" stackId="a" fill={t.win}/>
            <Bar dataKey="drawPct" name="Draw%" stackId="a" fill={t.draw}/>
            <Bar dataKey="lossPct" name="Loss%" stackId="a" fill={t.loss} radius={[0,4,4,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <Card t={t} style={{flex:1,minWidth:180}}>
        <SecTitle t={t} sub="Win% by opponent strength">Elo Breakdown</SecTitle>
        {brackets.length?<ResponsiveContainer width="100%" height={160}>
          <BarChart data={brackets} barCategoryGap="20%">
            <XAxis dataKey="label" tick={{fill:t.textDim,fontSize:9}} axisLine={false} tickLine={false}/>
            <YAxis domain={[0,100]} tick={{fill:t.textDim,fontSize:9}} axisLine={false} tickLine={false}/>
            <Tooltip content={tip}/>
            <Bar dataKey="winPct" name="Win%" radius={[4,4,0,0]}>
              {brackets.map((e,i)=><Cell key={i} fill={e.winPct>=55?t.win:e.winPct>=45?"#ffc800":t.loss}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>:<div style={{color:t.textDim,fontSize:12,padding:"20px 0"}}>Not enough rated games</div>}
      </Card>
    </div>

  </div>;
}

// ── Main App ──────────────────────────────────────────────────────────────────
const TABS=[["📊","Overview"],["♟","Openings"],["🎨","Color Stats"],["📈","Elo Breakdown"],["⚔️","Compare"],["🧬","Chess DNA"]];
const RANGE_OPTIONS = [3,6,12,0];
function getSavedRange() {
  const raw = localStorage.getItem("chessdna-range");
  if (raw === null) return 3;
  const saved = Number(raw);
  return RANGE_OPTIONS.includes(saved) ? saved : 3;
}

// ── URL routing helpers ───────────────────────────────────────────────────────
function parseHash() {
  // Supports: /#/username  /#/username/card  /#/username/compare/opponent
  const hash = window.location.hash.replace(/^#\/?/, "");
  const parts = hash.split("/").filter(Boolean);
  return { user: parts[0]||null, sub: parts[1]||null, other: parts[2]||null };
}
function setHash(user, sub) {
  const path = sub ? `/${user}/${sub}` : user ? `/${user}` : "";
  window.location.hash = path;
}

export default function App() {
  const [themeKey,setThemeKey]=useState(()=>localStorage.getItem("chessdna-theme")||"slate");
  const t=THEMES[themeKey];
  useEffect(()=>{ injectTheme(t); document.body.style.background=t.bg; localStorage.setItem("chessdna-theme",themeKey); },[t]);

  const [tab,setTab]=useState(0);
  const [p1In,setP1In]=useState("");
  const [p2In,setP2In]=useState("");
  const [p1,setP1]=useState(null);
  const [p2,setP2]=useState(null);
  const [l1,setL1]=useState(false);
  const [l2,setL2]=useState(false);
  const [e1,setE1]=useState(null);
  const [months,setMonths]=useState(getSavedRange);
  const monthsRef=useRef(months);
  const p1LoadId=useRef(0);
  const p2LoadId=useRef(0);

  // ── On mount: read URL and auto-load player ──
  useEffect(()=>{
    const {user,sub} = parseHash();
    if (user) {
      setP1In(user);
      doLoad1(user);
      if (sub==="card") setTab(5);
    }
    // Listen for hash changes (back/forward)
    const onHash = () => {
      const {user:u, sub:s} = parseHash();
      if (u) { setP1In(u); doLoad1(u); if(s==="card") setTab(5); }
    };
    window.addEventListener("hashchange", onHash);
    return ()=>window.removeEventListener("hashchange", onHash);
  }, []);

  const doLoad1 = async (username, mo) => {
    const u = (username||p1In).trim().toLowerCase();
    if (!u) return;
    const m = mo !== undefined ? mo : monthsRef.current;
    const loadId = ++p1LoadId.current;
    setL1(true); setE1(null); setP1(null);
    try {
      const data = await loadPlayer(u, m);
      if (loadId === p1LoadId.current) setP1(data);
    }
    catch(e) { if (loadId === p1LoadId.current) setE1(e.message||"Failed to load"); }
    finally { if (loadId === p1LoadId.current) setL1(false); }
  };

  const load1 = () => {
    const u = p1In.trim().toLowerCase();
    if (!u) return;
    setHash(u);
    doLoad1(u, monthsRef.current);
  };

  const changeMonths = (m) => {
    monthsRef.current = m;
    localStorage.setItem("chessdna-range", String(m));
    setMonths(m);
    if (p1) doLoad1(p1.profile.username, m);
    if (p2) load2(p2.profile.username, m);
  };

  const load2=async(username, mo)=>{
    const u = (username||p2In).trim().toLowerCase();
    if(!u)return;
    const m = mo !== undefined ? mo : monthsRef.current;
    const loadId = ++p2LoadId.current;
    setL2(true);setP2(null);
    try{
      const data = await loadPlayer(u, m);
      if (loadId === p2LoadId.current) setP2(data);
    }
    catch{
      // Compare failures are non-blocking; the primary player stays visible.
    }finally{if (loadId === p2LoadId.current) setL2(false);}
  };

  // Update URL when tab changes to card tab
  const handleTabChange = (i) => {
    setTab(i);
    if (p1) setHash(p1.profile.username);
  };

  const p=p1?computePersonality(p1.games,p1.stats):null;
  const insights=p1?computeInsights(p1.games):null;
  const tip=(props)=><ChartTip {...props} t={t}/>;

  return <div style={{minHeight:"100vh",position:"relative"}}>
    {/* Background */}
    <div style={{position:"fixed",inset:0,zIndex:0,background:t.bg,pointerEvents:"none"}}/>
    <ThemeBg t={t}/>
    <LoadingBar active={l1} t={t}/>

    <div style={{position:"relative",zIndex:1,maxWidth:960,margin:"0 auto",padding:"0 16px 80px"}}>

      {/* ── Hero section ── */}
      <div style={{textAlign:"center",padding:"60px 0 40px",animation:"fadeInUp .6s ease both"}}>
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
          <ThemePicker current={themeKey} onChange={setThemeKey}/>
        </div>
        <div style={{fontSize:56,marginBottom:12,animation:"heroChess 4s ease-in-out infinite",display:"inline-block",filter:`drop-shadow(0 0 24px ${t.glowC})`}}>♟</div>
        <h1 style={{fontFamily:t.headingFont,fontSize:48,fontWeight:900,color:t.accent,letterSpacing:"-.03em",lineHeight:1,animation:"glow 3s ease-in-out infinite, scaleIn .6s cubic-bezier(.22,1,.36,1) both"}}>Chess DNA</h1>
        <p style={{fontSize:18,color:t.textMid,marginTop:10,fontFamily:t.font,animation:"fadeInDown .7s .2s cubic-bezier(.22,1,.36,1) both"}}>Discover your chess identity</p>

        {/* Search */}
        <div style={{display:"flex",gap:10,maxWidth:560,margin:"28px auto 0",alignItems:"center",flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:200,position:"relative"}}>
            <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:t.textDim,fontSize:16,pointerEvents:"none"}}>🔍</span>
            <input placeholder="Enter Chess.com username…" value={p1In} onChange={e=>setP1In(e.target.value)} onKeyDown={e=>e.key==="Enter"&&load1()} style={{paddingLeft:42,fontSize:16}}/>
          </div>
          <button className="primary" onClick={load1} disabled={l1||!p1In.trim()}>
            {l1?<span style={{display:"inline-flex",alignItems:"center",gap:8}}><span style={{width:14,height:14,border:`2px solid ${t.btnColor}`,borderTopColor:"transparent",borderRadius:"50%",display:"inline-block",animation:"spin .8s linear infinite"}}/>Analyzing…</span>:"Analyze Player"}
          </button>
        </div>
        <div style={{display:"flex",gap:6,justifyContent:"center",marginTop:12,alignItems:"center"}}>
          <span style={{fontSize:12,color:t.textDim}}>Range:</span>
          {[[3,"3mo"],[6,"6mo"],[12,"1yr"],[0,"All time"]].map(([m,label])=>(
            <button key={m} onClick={()=>changeMonths(m)} style={{background:months===m?`${t.accent}20`:"none",border:`1px solid ${months===m?t.accent+"60":t.cardBorder}`,borderRadius:20,color:months===m?t.accent:t.textDim,cursor:"pointer",fontFamily:t.font,fontSize:12,fontWeight:months===m?600:400,padding:"4px 12px",transition:"all .2s"}}>
              {label}
            </button>
          ))}
          {p1&&<span style={{fontSize:11,color:t.textDim,marginLeft:4}}>· {p1.games.length} games loaded</span>}
        </div>
        {e1&&<div style={{marginTop:12,fontSize:13,color:t.loss}}>⚠ {e1}</div>}

      </div>

      {/* ── Player Hero Card ── */}
      {(p1||l1)&&<div style={{marginBottom:20}}><PlayerHeroCard data={p1} loading={l1} t={t}/></div>}

      {/* ── Stats Dashboard — 3 columns ── */}
      {p1&&!l1&&<div className="three-col" style={{display:"flex",gap:16,marginBottom:20}}>
        {/* Column 1: Opening DNA */}
        <Card t={t} className="stagger-1" style={{flex:1,minWidth:220}}>
          <SecTitle t={t} sub="Top openings by games played">Opening DNA</SecTitle>
          <OpeningDNA games={p1.games} loading={l1} t={t}/>
        </Card>

        {/* Column 2: Performance Chart */}
        <Card t={t} className="stagger-2" style={{flex:1,minWidth:220}}>
          <SecTitle t={t} sub="Rating trend (last 30 days)">Performance</SecTitle>
          <PerformanceChart games={p1.games} stats={p1.stats} loading={l1} t={t}/>
          <div style={{marginTop:12}}>
            <div style={{fontSize:11,color:t.textDim,textTransform:"uppercase",letterSpacing:".07em",marginBottom:6,fontFamily:t.font}}>Current Ratings</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {["rapid","blitz","bullet"].map(tc=>{const r=getRating(p1.stats,tc);return r.last?<div key={tc} style={{background:`${t.accent}0e`,border:`1px solid ${t.accent}20`,borderRadius:7,padding:"5px 10px",textAlign:"center"}}>
                <div style={{fontSize:9,color:t.textDim,textTransform:"uppercase"}}>{tc}</div>
                <div style={{fontSize:16,fontWeight:700,color:t.accent,fontFamily:t.headingFont}}>{r.last}</div>
              </div>:null;})}
            </div>
          </div>
        </Card>

        {/* Column 3: Insights */}
        <Card t={t} className="stagger-3" style={{flex:1,minWidth:220}}>
          <SecTitle t={t} sub="Based on your recent games">Insights</SecTitle>
          <InsightsColumn games={p1.games} loading={l1} t={t}/>
        </Card>
      </div>}

      {/* ── Tabs ── */}
      {(p1||l1)&&<div style={{background:t.card,border:`1px solid ${t.cardBorder}`,borderRadius:10,padding:6,display:"flex",gap:2,flexWrap:"wrap",marginBottom:14,animation:"fadeInUp .35s ease both"}}>
        {TABS.map(([icon,name],i)=>(
          <button key={name} className={`tab-btn ${tab===i?"active":""}`} onClick={()=>handleTabChange(i)}>{icon} {name}</button>
        ))}
      </div>}

      {/* ── Tab Content ── */}
      {(p1||l1)&&<PageTransition keyVal={tab}>
        {tab===0&&<OverviewTab data={p1} loading={l1} t={t}/>}
        {tab===1&&<OpeningsTab games={p1?.games} loading={l1} t={t}/>}
        {tab===2&&<ColorTab games={p1?.games} loading={l1} t={t}/>}
        {tab===3&&<EloTab games={p1?.games} stats={p1?.stats} loading={l1} t={t}/>}
        {tab===4&&<CompareTab p1={p1} p2={p2} l1={l1} l2={l2} p2In={p2In} setP2In={setP2In} loadP2={load2} t={t}/>}
        {tab===5&&<DnaTab games={p1?.games} stats={p1?.stats} loading={l1} t={t} profile={p1?.profile}/>}
      </PageTransition>}

      {/* ── Empty state ── */}
      {!p1&&!l1&&!e1&&<div style={{textAlign:"center",padding:"40px 0 60px",animation:"fadeInUp .5s .2s ease both"}}>
        <div style={{fontSize:64,opacity:.15,marginBottom:20}}>♜</div>
        <div style={{fontFamily:t.headingFont,fontSize:20,color:t.textMid}}>Enter a username to reveal your Chess DNA</div>
        <div style={{fontSize:13,color:t.textDim,marginTop:8}}>Openings · Color stats · Elo breakdown · Personality · Compare · Trading card</div>
      </div>}

      <div style={{textAlign:"center",marginTop:48,fontSize:11,color:t.textDim}}>Chess DNA · Data from Chess.com Public API · No data stored</div>
    </div>
  </div>;
}