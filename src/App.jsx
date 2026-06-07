import { useState, useEffect, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ReferenceLine, Legend
} from "recharts";

// ── Fonts ─────────────────────────────────────────────────────────────────────
const fl = document.createElement("link");
fl.rel = "stylesheet";
fl.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=DM+Sans:wght@300;400;500;600&family=Space+Grotesk:wght@400;500;600;700&family=Crimson+Pro:wght@400;600;700&family=Syne:wght@400;600;700;800&display=swap";
document.head.appendChild(fl);

// ── Themes ────────────────────────────────────────────────────────────────────
const THEMES = {
  forest: {
    name: "Forest",
    icon: "🌲",
    bg: "#040f08",
    bgPattern: "rgba(0,255,136,0.015)",
    card: "linear-gradient(135deg,rgba(0,44,22,.9),rgba(0,18,9,.96))",
    cardBorder: "rgba(0,255,136,0.11)",
    accent: "#00ff88",
    accent2: "#00c860",
    hl: "#39ffa0",
    text: "#c8f0dc",
    textDim: "#4a8060",
    textMid: "#7ab898",
    win: "#00ff88",
    loss: "#ff5555",
    draw: "#5a8e6e",
    tabActive: "rgba(0,255,136,0.12)",
    tabActiveBorder: "rgba(0,255,136,0.28)",
    inputBg: "rgba(0,40,20,0.85)",
    btnGrad: "linear-gradient(135deg,#00c860,#00ff88)",
    btnColor: "#030e06",
    skeletonA: "rgba(0,255,136,0.04)",
    skeletonB: "rgba(0,255,136,0.1)",
    font: "'DM Sans', sans-serif",
    headingFont: "'Playfair Display', serif",
    scrollThumb: "#00ff8830",
    glowColor: "#00ff8840",
    glowColor2: "#00ff8890",
    checkerColor: "rgba(0,255,136,0.015)",
    patternColor: "rgba(0,255,136,0.012)",
  },
  midnight: {
    name: "Midnight",
    icon: "🌙",
    bg: "#06070f",
    bgPattern: "rgba(100,120,255,0.015)",
    card: "linear-gradient(135deg,rgba(15,18,50,.9),rgba(6,7,25,.96))",
    cardBorder: "rgba(100,120,255,0.14)",
    accent: "#7b8fff",
    accent2: "#5060dd",
    hl: "#a0aaff",
    text: "#d0d4f8",
    textDim: "#4a5090",
    textMid: "#8890cc",
    win: "#7b8fff",
    loss: "#ff6b8a",
    draw: "#5a6090",
    tabActive: "rgba(123,143,255,0.12)",
    tabActiveBorder: "rgba(123,143,255,0.28)",
    inputBg: "rgba(15,18,50,0.85)",
    btnGrad: "linear-gradient(135deg,#5060dd,#7b8fff)",
    btnColor: "#06070f",
    skeletonA: "rgba(123,143,255,0.04)",
    skeletonB: "rgba(123,143,255,0.1)",
    font: "'Space Grotesk', sans-serif",
    headingFont: "'Syne', sans-serif",
    scrollThumb: "#7b8fff30",
    glowColor: "#7b8fff40",
    glowColor2: "#7b8fff90",
    checkerColor: "rgba(100,120,255,0.012)",
    patternColor: "rgba(100,120,255,0.010)",
  },
  crimson: {
    name: "Crimson",
    icon: "🔴",
    bg: "#0f0608",
    bgPattern: "rgba(255,80,80,0.012)",
    card: "linear-gradient(135deg,rgba(40,8,12,.9),rgba(20,4,6,.96))",
    cardBorder: "rgba(255,80,80,0.12)",
    accent: "#ff5c5c",
    accent2: "#cc3333",
    hl: "#ff9090",
    text: "#f0d0d0",
    textDim: "#7a3040",
    textMid: "#c07080",
    win: "#ff5c5c",
    loss: "#5caaff",
    draw: "#8a5060",
    tabActive: "rgba(255,92,92,0.12)",
    tabActiveBorder: "rgba(255,92,92,0.28)",
    inputBg: "rgba(40,8,12,0.85)",
    btnGrad: "linear-gradient(135deg,#cc3333,#ff5c5c)",
    btnColor: "#0f0608",
    skeletonA: "rgba(255,92,92,0.04)",
    skeletonB: "rgba(255,92,92,0.1)",
    font: "'DM Sans', sans-serif",
    headingFont: "'Crimson Pro', serif",
    scrollThumb: "#ff5c5c30",
    glowColor: "#ff5c5c40",
    glowColor2: "#ff5c5c90",
    checkerColor: "rgba(255,80,80,0.012)",
    patternColor: "rgba(255,80,80,0.010)",
  },
  gold: {
    name: "Gold",
    icon: "👑",
    bg: "#0c0a02",
    bgPattern: "rgba(255,200,0,0.012)",
    card: "linear-gradient(135deg,rgba(35,28,4,.92),rgba(18,14,2,.96))",
    cardBorder: "rgba(255,200,0,0.13)",
    accent: "#ffd700",
    accent2: "#cc9900",
    hl: "#ffe566",
    text: "#f0e8c0",
    textDim: "#7a6a20",
    textMid: "#c0a840",
    win: "#ffd700",
    loss: "#ff6060",
    draw: "#8a7830",
    tabActive: "rgba(255,215,0,0.12)",
    tabActiveBorder: "rgba(255,215,0,0.28)",
    inputBg: "rgba(35,28,4,0.85)",
    btnGrad: "linear-gradient(135deg,#cc9900,#ffd700)",
    btnColor: "#0c0a02",
    skeletonA: "rgba(255,215,0,0.04)",
    skeletonB: "rgba(255,215,0,0.1)",
    font: "'DM Sans', sans-serif",
    headingFont: "'Playfair Display', serif",
    scrollThumb: "#ffd70030",
    glowColor: "#ffd70040",
    glowColor2: "#ffd70090",
    checkerColor: "rgba(255,200,0,0.012)",
    patternColor: "rgba(255,200,0,0.010)",
  },
  ice: {
    name: "Ice",
    icon: "🧊",
    bg: "#030d14",
    bgPattern: "rgba(120,220,255,0.015)",
    card: "linear-gradient(135deg,rgba(5,30,50,.9),rgba(2,14,24,.96))",
    cardBorder: "rgba(120,220,255,0.12)",
    accent: "#50d8ff",
    accent2: "#0099cc",
    hl: "#90e8ff",
    text: "#c8eef8",
    textDim: "#3a7090",
    textMid: "#70b8d0",
    win: "#50d8ff",
    loss: "#ff7090",
    draw: "#4a8090",
    tabActive: "rgba(80,216,255,0.12)",
    tabActiveBorder: "rgba(80,216,255,0.28)",
    inputBg: "rgba(5,30,50,0.85)",
    btnGrad: "linear-gradient(135deg,#0099cc,#50d8ff)",
    btnColor: "#030d14",
    skeletonA: "rgba(80,216,255,0.04)",
    skeletonB: "rgba(80,216,255,0.1)",
    font: "'Space Grotesk', sans-serif",
    headingFont: "'Syne', sans-serif",
    scrollThumb: "#50d8ff30",
    glowColor: "#50d8ff40",
    glowColor2: "#50d8ff90",
    checkerColor: "rgba(120,220,255,0.012)",
    patternColor: "rgba(120,220,255,0.010)",
  },
  obsidian: {
    name: "Obsidian",
    icon: "🖤",
    bg: "#080808",
    bgPattern: "rgba(180,180,180,0.015)",
    card: "linear-gradient(135deg,rgba(22,22,22,.92),rgba(10,10,10,.96))",
    cardBorder: "rgba(200,200,200,0.1)",
    accent: "#e0e0e0",
    accent2: "#999999",
    hl: "#ffffff",
    text: "#d8d8d8",
    textDim: "#555555",
    textMid: "#999999",
    win: "#e0e0e0",
    loss: "#ff6060",
    draw: "#666666",
    tabActive: "rgba(200,200,200,0.1)",
    tabActiveBorder: "rgba(200,200,200,0.25)",
    inputBg: "rgba(22,22,22,0.9)",
    btnGrad: "linear-gradient(135deg,#555,#e0e0e0)",
    btnColor: "#080808",
    skeletonA: "rgba(200,200,200,0.04)",
    skeletonB: "rgba(200,200,200,0.09)",
    font: "'Space Grotesk', sans-serif",
    headingFont: "'Syne', sans-serif",
    scrollThumb: "#ffffff20",
    glowColor: "#ffffff30",
    glowColor2: "#ffffff70",
    checkerColor: "rgba(180,180,180,0.012)",
    patternColor: "rgba(180,180,180,0.010)",
  },
};

// ── Style injector ────────────────────────────────────────────────────────────
const styleEl = document.createElement("style");
document.head.appendChild(styleEl);

function injectThemeStyles(t) {
  styleEl.textContent = `
    *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
    body { background:${t.bg}; color:${t.text}; font-family:${t.font}; }
    ::-webkit-scrollbar { width:5px; }
    ::-webkit-scrollbar-track { background:transparent; }
    ::-webkit-scrollbar-thumb { background:${t.scrollThumb}; border-radius:3px; }
    @keyframes fadeInUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
    @keyframes shimmer { 0%,100%{opacity:.3} 50%{opacity:.65} }
    @keyframes spin { to{transform:rotate(360deg)} }
    @keyframes glow { 0%,100%{text-shadow:0 0 20px ${t.glowColor}} 50%{text-shadow:0 0 40px ${t.glowColor2},0 0 80px ${t.glowColor}} }
    @keyframes revealCard { from{opacity:0;transform:scale(.97) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
    @keyframes titlePop { 0%{opacity:0;transform:scale(.82)} 65%{transform:scale(1.04)} 100%{opacity:1;transform:scale(1)} }
    .fi { animation:fadeInUp .45s ease both; }
    .skel { background:linear-gradient(90deg,${t.skeletonA} 25%,${t.skeletonB} 50%,${t.skeletonA} 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:6px; }
    .tab-btn { background:none; border:1px solid transparent; cursor:pointer; font-family:${t.font}; font-size:13px; font-weight:500; padding:8px 16px; border-radius:6px; transition:all .2s; color:${t.textDim}; white-space:nowrap; }
    .tab-btn:hover { color:${t.accent}; background:${t.tabActive}; }
    .tab-btn.active { color:${t.accent}; background:${t.tabActive}; border-color:${t.tabActiveBorder}; font-weight:600; }
    input { background:${t.inputBg}; border:1px solid ${t.cardBorder}; border-radius:8px; color:${t.text}; font-family:${t.font}; font-size:14px; padding:11px 14px; outline:none; transition:all .2s; width:100%; }
    input:focus { border-color:${t.accent}80; box-shadow:0 0 0 3px ${t.glowColor}; }
    input::placeholder { color:${t.textDim}80; }
    button.primary { background:${t.btnGrad}; border:none; border-radius:8px; color:${t.btnColor}; cursor:pointer; font-family:${t.font}; font-size:14px; font-weight:700; padding:11px 24px; transition:all .2s; }
    button.primary:hover { transform:translateY(-1px); box-shadow:0 4px 24px ${t.glowColor}; }
    button.primary:disabled { opacity:.4; cursor:not-allowed; transform:none; }
    select { background:${t.inputBg}; border:1px solid ${t.cardBorder}; border-radius:6px; color:${t.text}; font-family:${t.font}; font-size:13px; padding:7px 10px; outline:none; cursor:pointer; }
    table { width:100%; border-collapse:collapse; font-size:13px; }
    th { color:${t.accent}; font-weight:600; font-size:11px; letter-spacing:.07em; text-transform:uppercase; padding:10px 10px; border-bottom:1px solid ${t.cardBorder}; text-align:left; cursor:pointer; user-select:none; }
    th:hover { color:${t.hl}; }
    td { padding:8px 10px; border-bottom:1px solid ${t.cardBorder}40; color:${t.textMid}; vertical-align:middle; }
    tr:hover td { background:${t.skeletonA}; }
    .badge { display:inline-flex; align-items:center; border-radius:4px; font-size:11px; font-weight:700; padding:2px 9px; letter-spacing:.03em; }
    .badge.green { background:${t.win}18; color:${t.win}; border:1px solid ${t.win}40; }
    .badge.yellow { background:rgba(255,200,0,.1); color:#ffc800; border:1px solid rgba(255,200,0,.3); }
    .badge.red { background:${t.loss}18; color:${t.loss}; border:1px solid ${t.loss}40; }
  `;
}

// ── Fetch ────────────────────────────────────────────────────────────────────────────
// Chess.com API sets Access-Control-Allow-Origin: * so direct browser fetch works fine.
// NEVER send custom User-Agent — Chess.com 403s non-browser agents.
const PROXIES = [
  u => u,
  u => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  u => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
  u => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
];

async function tryFetch(url, asText) {
  let lastErr = "network error";
  for (const makeUrl of PROXIES) {
    try {
      const r = await fetch(makeUrl(url), { method: "GET", mode: "cors" });
      if (r.status === 404) throw new Error("Player not found");
      if (r.status === 301 || r.status === 302) { lastErr = "redirect"; continue; }
      if (!r.ok) { lastErr = `HTTP ${r.status}`; continue; }
      const result = asText ? await r.text() : await r.json();
      return result;
    } catch (e) {
      if (e.message && e.message.includes("not found")) throw e;
      lastErr = e.message || "failed";
    }
  }
  throw new Error(`Could not reach Chess.com API (${lastErr}). Check your internet connection.`);
}

async function fetchJSON(url) { return tryFetch(url, false); }
async function fetchText(url) { try { return await tryFetch(url, true); } catch { return ""; } }

// ── PGN ────────────────────────────────────────────────────────────────────────────────
function parsePGN(pgn, user) {
  if (!pgn || pgn.length < 10) return [];
  const ex = (txt, tag) => { const m = txt.match(new RegExp(`\\[${tag} "([^"]*)"`)); return m ? m[1] : null; };
  // Split on blank line before a new game header
  const rawGames = pgn.split(/\r?\n\r?\n(?=\[)/).filter(g => g.includes("[White ") && g.includes("[Black "));
  return rawGames.map(g => {
    const w = ex(g,"White"), b = ex(g,"Black");
    if (!w || !b) return null;
    const color = w.toLowerCase() === user.toLowerCase() ? "white" : "black";
    const raw = ex(g,"Result");
    let result = "draw";
    if (raw === "1-0") result = color === "white" ? "win" : "loss";
    else if (raw === "0-1") result = color === "black" ? "win" : "loss";
    const oppEloRaw = color === "white" ? ex(g,"BlackElo") : ex(g,"WhiteElo");
    const oppElo = oppEloRaw ? parseInt(oppEloRaw) : null;
    const tc = ex(g,"TimeControl");
    let timeControl = "other";
    if (tc) {
      const s = parseInt(tc.split("+")[0]);
      if (s <= 180) timeControl = "bullet";
      else if (s <= 600) timeControl = "blitz";
      else if (s <= 1800) timeControl = "rapid";
      else if (tc === "-" || isNaN(s)) timeControl = "daily";
      else timeControl = "rapid";
    }
    return {
      opening: ex(g,"Opening") || "Unknown",
      eco: ex(g,"ECO") || "?",
      color, result,
      oppElo: (oppElo && !isNaN(oppElo)) ? oppElo : null,
      timeControl,
      date: ex(g,"Date"),
      opponent: color === "white" ? b : w,
    };
  }).filter(Boolean);
}

async function loadPlayer(user) {
  const base = `https://api.chess.com/pub/player/${user}`;
  const [profile, stats, archives] = await Promise.all([
    fetchJSON(base),
    fetchJSON(`${base}/stats`),
    fetchJSON(`${base}/games/archives`),
  ]);
  if (!profile.username) throw new Error(`Player "${user}" not found on Chess.com`);
  const urls = (archives.archives || []).slice(-3);
  const pgns = await Promise.all(urls.map(u => fetchText(u + "/pgn")));
  const games = pgns.flatMap(p => parsePGN(p, user));
  return { profile, stats, games };
}

// ── Aggregators ───────────────────────────────────────────────────────────────
function aggOpenings(games, tc="all") {
  const f = tc==="all" ? games : games.filter(g=>g.timeControl===tc);
  const map = {};
  for (const g of f) {
    const k = g.opening==="Unknown" ? g.eco+" Opening" : g.opening;
    if (!map[k]) map[k]={opening:k,eco:g.eco,games:0,wins:0,losses:0,draws:0,elos:[],wg:0,bg:0};
    map[k].games++; if(g.color==="white")map[k].wg++; else map[k].bg++;
    if(g.result==="win")map[k].wins++; else if(g.result==="loss")map[k].losses++; else map[k].draws++;
    if(g.oppElo)map[k].elos.push(g.oppElo);
  }
  return Object.values(map).map(e=>({...e,
    winPct:e.games?Math.round(e.wins/e.games*100):0,
    lossPct:e.games?Math.round(e.losses/e.games*100):0,
    drawPct:e.games?Math.round(e.draws/e.games*100):0,
    avgOpp:e.elos.length?Math.round(e.elos.reduce((a,b)=>a+b,0)/e.elos.length):0,
  }));
}
function colorStats(games) {
  const calc = g=>{
    const wins=g.filter(x=>x.result==="win").length, losses=g.filter(x=>x.result==="loss").length, draws=g.filter(x=>x.result==="draw").length;
    const elos=g.filter(x=>x.oppElo).map(x=>x.oppElo);
    const avgOpp=elos.length?Math.round(elos.reduce((a,b)=>a+b,0)/elos.length):0;
    const bestWinGames=g.filter(x=>x.result==="win"&&x.oppElo).sort((a,b)=>b.oppElo-a.oppElo);
    return {total:g.length,wins,losses,draws,avgOpp,bestWinElo:bestWinGames[0]?.oppElo||0,bestWinOpp:bestWinGames[0]?.opponent||""};
  };
  return {white:calc(games.filter(g=>g.color==="white")),black:calc(games.filter(g=>g.color==="black"))};
}
function eloBrackets(games) {
  const bs=[["<1000",0,1000],["1000-1199",1000,1200],["1200-1399",1200,1400],["1400-1599",1400,1600],["1600-1799",1600,1800],["1800-1999",1800,2000],["2000-2199",2000,2200],["2200+",2200,9999]];
  return bs.map(([label,mn,mx])=>{
    const g=games.filter(x=>x.oppElo>=mn&&x.oppElo<mx);
    return {label,games:g.length,winPct:g.length?Math.round(g.filter(x=>x.result==="win").length/g.length*100):0};
  }).filter(b=>b.games>0);
}
function getRating(stats,tc){const s=stats?.[`chess_${tc}`];return{last:s?.last?.rating??null,best:s?.best?.rating??null};}
function computeStreak(games){if(!games.length)return{type:"none",count:0};let c=1;const l=games[0].result;for(let i=1;i<games.length;i++){if(games[i].result===l)c++;else break;}return{type:l,count:c};}

// ── Personality ───────────────────────────────────────────────────────────────
function computePersonality(games, stats) {
  if (!games?.length) return null;
  const total=games.length, wins=games.filter(g=>g.result==="win").length, losses=games.filter(g=>g.result==="loss").length, draws=games.filter(g=>g.result==="draw").length;
  const winPct=wins/total, drawPct=draws/total;
  const tcCounts={}; games.forEach(g=>{tcCounts[g.timeControl]=(tcCounts[g.timeControl]||0)+1;});
  const favTC=Object.entries(tcCounts).sort((a,b)=>b[1]-a[1])[0]?.[0]||"blitz";
  const uniqueOpenings=new Set(games.map(g=>g.opening)).size;
  const openings=aggOpenings(games);
  const aggression=winPct>.55?"high":winPct>.45?"mid":"low";
  const drawTend=drawPct>.18?"high":drawPct>.08?"mid":"low";
  const breadth=uniqueOpenings>30?"explorer":uniqueOpenings>15?"balanced":"specialist";
  const speed=favTC==="bullet"?"speed":favTC==="blitz"?"sharp":"deep";
  let title,icon,titleColor,desc;
  if(speed==="speed"&&aggression==="high"){title="The Bullet Assassin";icon="⚡";titleColor="#ffdd00";desc="You thrive in chaos. Sub-3-minute games are your domain and you rack up wins through sheer speed and instinct.";}
  else if(speed==="speed"){title="The Clock Shark";icon="🕐";titleColor="#ff9900";desc="You live for bullet but play it cool — conserving energy, waiting for the blunder, then striking.";}
  else if(breadth==="specialist"&&aggression==="high"){title="The Opening Theorist";icon="📖";titleColor="#39ffa0";desc="You know your openings cold. One or two lines played to perfection, with aggressive follow-through.";}
  else if(breadth==="explorer"&&speed==="deep"){title="The Renaissance Scholar";icon="🎨";titleColor="#a78bfa";desc="No opening is a stranger to you. You explore breadth of chess theory and treat every position as a puzzle.";}
  else if(drawTend==="high"){title="The Fortress Builder";icon="🏰";titleColor="#60a5fa";desc="Solid, unbreakable, methodical. You outgrind opponents, hold positions that seem lost, and never crack.";}
  else if(aggression==="high"){title="The Tactical Storm";icon="🌩️";titleColor="#f87171";desc="You attack from all angles. Sacrifices, combinations, chaos — all welcome. Pressure is your language.";}
  else if(speed==="deep"&&aggression==="high"){title="The Endgame Virtuoso";icon="♟";titleColor="#34d399";desc="You grind. When others trade into the endgame to draw, you convert through sheer technical mastery.";}
  else if(speed==="sharp"&&breadth==="balanced"){title="The Blitz Craftsman";icon="⚔️";titleColor="#fb923c";desc="Blitz is your art form — fast but precise, with a varied repertoire that keeps opponents guessing.";}
  else if(aggression==="low"&&drawTend==="high"){title="The Positional Maestro";icon="🎼";titleColor="#c084fc";desc="You outmaneuver, not outfight. Tiny positional advantages compound into wins your opponents never see coming.";}
  else if(breadth==="explorer"){title="The Chess Wanderer";icon="🗺️";titleColor="#67e8f9";desc="Variety is your spice. You roam across openings and styles, picking up something new every session.";}
  else if(total>200&&winPct>.5){title="The Grinder";icon="⚙️";titleColor="#a3e635";desc="Volume meets quality. Hundreds of games, winning record — that's consistency, not luck.";}
  else{title="The Eternal Student";icon="📚";titleColor="#94a3b8";desc="Every game is a lesson. You're always experimenting, building the foundation of a stronger player.";}
  const elos=games.filter(g=>g.oppElo).map(g=>g.oppElo);
  const avgOpp=elos.length?Math.round(elos.reduce((a,b)=>a+b,0)/elos.length):null;
  const bestWinGames=games.filter(g=>g.result==="win"&&g.oppElo).sort((a,b)=>b.oppElo-a.oppElo);
  return {title,icon,titleColor,desc,winPct:Math.round(winPct*100),drawPct:Math.round(drawPct*100),lossPct:Math.round((losses/total)*100),favTC,uniqueOpenings,avgOpp,bestWin:bestWinGames[0]?.oppElo||null,streak:computeStreak(games),total,wins,losses,draws,breadth,speed,aggression,bestOpening:openings.filter(o=>o.games>=3).sort((a,b)=>b.winPct-a.winPct)[0]};
}

// ── UI helpers ────────────────────────────────────────────────────────────────
const Sk=({w="100%",h=18,style={}})=><div className="skel" style={{width:w,height:h,...style}}/>;

function Card({children,style={},t}){
  return <div style={{background:t.card,border:`1px solid ${t.cardBorder}`,borderRadius:14,boxShadow:`inset 0 1px 0 ${t.accent}08,0 4px 28px rgba(0,0,0,.45)`,padding:22,...style}}>{children}</div>;
}

function SecTitle({children,sub,t}){
  return <div style={{marginBottom:16}}>
    <h2 style={{fontFamily:t.headingFont,fontSize:20,fontWeight:700,color:t.accent,letterSpacing:"-.01em"}}>{children}</h2>
    {sub&&<p style={{fontSize:12,color:t.textDim,marginTop:3}}>{sub}</p>}
  </div>;
}

function ChartTip({active,payload,label,t}){
  if(!active||!payload?.length)return null;
  return <div style={{background:t.bg+"f5",border:`1px solid ${t.cardBorder}`,borderRadius:8,padding:"10px 14px",fontSize:12,fontFamily:t.font}}>
    <div style={{color:t.accent,fontWeight:600,marginBottom:4}}>{label}</div>
    {payload.map((p,i)=><div key={i} style={{color:p.color||t.text}}>{p.name}: {p.value}{["winPct","Win%","lossPct","drawPct","Loss%","Draw%"].includes(p.name)?"%":""}</div>)}
  </div>;
}

function Donut({wins,losses,draws,size=110,t}){
  const data=[{v:wins,c:t.win},{v:losses,c:t.loss},{v:draws,c:t.draw}];
  return <PieChart width={size} height={size}>
    <Pie data={data.map(d=>({value:d.v,color:d.c}))} cx={size/2-2} cy={size/2-2} innerRadius={size*.3} outerRadius={size*.46} dataKey="value" paddingAngle={2}>
      {data.map((d,i)=><Cell key={i} fill={d.c}/>)}
    </Pie>
  </PieChart>;
}

// ── Theme Picker ──────────────────────────────────────────────────────────────
function ThemePicker({current,onChange}){
  const [open,setOpen]=useState(false);
  return <div style={{position:"relative"}}>
    <button onClick={()=>setOpen(o=>!o)} style={{background:"none",border:`1px solid ${THEMES[current].cardBorder}`,borderRadius:8,color:THEMES[current].text,cursor:"pointer",fontSize:13,fontFamily:THEMES[current].font,padding:"6px 12px",display:"flex",alignItems:"center",gap:6,transition:"all .2s"}}>
      {THEMES[current].icon} {THEMES[current].name} <span style={{opacity:.5,fontSize:10}}>▼</span>
    </button>
    {open&&<div style={{position:"absolute",top:"110%",right:0,background:THEMES[current].card,border:`1px solid ${THEMES[current].cardBorder}`,borderRadius:10,padding:8,zIndex:99,minWidth:160,boxShadow:"0 8px 32px rgba(0,0,0,.6)"}}>
      <div style={{fontSize:10,color:THEMES[current].textDim,textTransform:"uppercase",letterSpacing:".08em",padding:"4px 8px 8px",fontFamily:THEMES[current].font}}>Choose Theme</div>
      {Object.entries(THEMES).map(([k,th])=>(
        <div key={k} onClick={()=>{onChange(k);setOpen(false);}} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:7,cursor:"pointer",background:current===k?`${th.accent}18`:"none",color:current===k?th.accent:THEMES[current].textMid,fontSize:13,fontFamily:THEMES[current].font,transition:"all .15s"}}>
          <span>{th.icon}</span>
          <span style={{fontWeight:current===k?600:400}}>{th.name}</span>
          <span style={{marginLeft:"auto",width:12,height:12,borderRadius:"50%",background:th.accent,flexShrink:0}}/>
        </div>
      ))}
    </div>}
  </div>;
}

// ── Profile Header ────────────────────────────────────────────────────────────
function ProfileHeader({data,loading,t}){
  if(loading) return <Card t={t}><div style={{display:"flex",gap:16,alignItems:"center"}}><Sk w={80} h={80} style={{borderRadius:"50%"}}/><div style={{flex:1,display:"flex",flexDirection:"column",gap:8}}><Sk w="55%" h={22}/><Sk w="40%" h={15}/><Sk w="65%" h={13}/></div></div></Card>;
  if(!data)return null;
  const {profile,stats,games}=data;
  const ratings=["rapid","blitz","bullet","daily"].map(tc=>({tc,...getRating(stats,tc)})).filter(r=>r.last);
  return <Card t={t} style={{display:"flex",gap:20,alignItems:"flex-start",flexWrap:"wrap"}}>
    <div style={{position:"relative",flexShrink:0}}>
      <img src={profile.avatar||""} alt="avatar" style={{width:80,height:80,borderRadius:"50%",border:`2px solid ${t.accent}55`,display:"block",background:t.bg}} onError={e=>{e.target.style.display="none";}}/>
      {profile.status==="premium"&&<div style={{position:"absolute",bottom:0,right:0,background:"#ffd700",borderRadius:"50%",width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#080400"}}>★</div>}
    </div>
    <div style={{flex:1,minWidth:180}}>
      <div style={{fontFamily:t.headingFont,fontSize:26,fontWeight:700,color:t.text}}>{profile.username}</div>
      <div style={{fontSize:13,color:t.textDim,marginTop:3,display:"flex",gap:10,flexWrap:"wrap"}}>
        {profile.name&&<span style={{color:t.textMid}}>{profile.name}</span>}
        {profile.league&&<span style={{color:t.accent,fontWeight:600}}>🏆 {profile.league}</span>}
        {profile.country&&<span>🌍 {profile.country.split("/").pop()}</span>}
        <span>👥 {(profile.followers||0).toLocaleString()}</span>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:12}}>
        {ratings.map(r=>(
          <div key={r.tc} style={{background:`${t.accent}0d`,border:`1px solid ${t.accent}20`,borderRadius:9,padding:"7px 13px",textAlign:"center",minWidth:70}}>
            <div style={{fontSize:10,color:t.textDim,textTransform:"uppercase",letterSpacing:".07em"}}>{r.tc}</div>
            <div style={{fontSize:22,fontWeight:700,color:t.accent,fontFamily:t.headingFont}}>{r.last}</div>
            {r.best&&r.best>r.last&&<div style={{fontSize:10,color:t.textDim}}>↑{r.best}</div>}
          </div>
        ))}
        {stats?.tactics?.highest?.rating&&<div style={{background:`${t.hl}0d`,border:`1px solid ${t.hl}20`,borderRadius:9,padding:"7px 13px",textAlign:"center",minWidth:70}}>
          <div style={{fontSize:10,color:t.textDim,textTransform:"uppercase",letterSpacing:".07em"}}>Puzzle</div>
          <div style={{fontSize:22,fontWeight:700,color:t.hl,fontFamily:t.headingFont}}>{stats.tactics.highest.rating}</div>
        </div>}
      </div>
    </div>
    {games&&<div style={{fontSize:12,color:t.textDim,alignSelf:"flex-end"}}>Loaded {games.length} recent games</div>}
  </Card>;
}

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({data,loading,t}){
  if(loading) return <div style={{display:"flex",flexDirection:"column",gap:14}}>{[...Array(3)].map((_,i)=><Sk key={i} h={90}/>)}</div>;
  if(!data) return null;
  const {games,stats}=data;
  const total=games.length, wins=games.filter(g=>g.result==="win").length, losses=games.filter(g=>g.result==="loss").length, draws=games.filter(g=>g.result==="draw").length;
  const rBar=["rapid","blitz","bullet","daily"].map(tc=>({name:tc,rating:getRating(stats,tc).last})).filter(d=>d.rating);
  const tcCounts={}; games.forEach(g=>{tcCounts[g.timeControl]=(tcCounts[g.timeControl]||0)+1;});
  const tcData=Object.entries(tcCounts).map(([name,value])=>({name,value}));
  const tip=(props)=><ChartTip {...props} t={t}/>;
  return <div style={{display:"flex",flexDirection:"column",gap:16}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10}}>
      {[["Total Games",total,t.accent],["Wins",wins,t.win],["Losses",losses,t.loss],["Draws",draws,t.draw],["Win Rate",total?Math.round(wins/total*100)+"%":"—",t.accent],["Draw Rate",total?Math.round(draws/total*100)+"%":"—",t.draw]].map(([l,v,c])=>(
        <Card key={l} t={t} style={{padding:"14px 16px",textAlign:"center"}}>
          <div style={{fontSize:10,color:t.textDim,textTransform:"uppercase",letterSpacing:".07em",marginBottom:6}}>{l}</div>
          <div style={{fontSize:28,fontWeight:700,color:c,fontFamily:t.headingFont}}>{v}</div>
        </Card>
      ))}
    </div>
    <Card t={t}>
      <SecTitle t={t}>Current Ratings</SecTitle>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={rBar}>
          <XAxis dataKey="name" tick={{fill:t.textDim,fontSize:12}} axisLine={false} tickLine={false}/>
          <YAxis tick={{fill:t.textDim,fontSize:11}} axisLine={false} tickLine={false} domain={["auto","auto"]}/>
          <Tooltip content={tip}/>
          <Bar dataKey="rating" fill={t.accent} radius={[5,5,0,0]}/>
        </BarChart>
      </ResponsiveContainer>
    </Card>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      <Card t={t}>
        <SecTitle t={t}>Result Breakdown</SecTitle>
        <div style={{display:"flex",gap:14,alignItems:"center",flexWrap:"wrap"}}>
          <Donut wins={wins} losses={losses} draws={draws} t={t} size={110}/>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {[["Wins",wins,t.win],["Losses",losses,t.loss],["Draws",draws,t.draw]].map(([l,v,c])=>(
              <div key={l} style={{display:"flex",alignItems:"center",gap:8,fontSize:13}}>
                <div style={{width:9,height:9,borderRadius:2,background:c,flexShrink:0}}/>
                <span style={{color:t.textDim}}>{l}:</span>
                <span style={{color:t.text,fontWeight:600}}>{v}</span>
                <span style={{color:t.textDim,fontSize:11}}>({total?Math.round(v/total*100):0}%)</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
      <Card t={t}>
        <SecTitle t={t}>Time Control Mix</SecTitle>
        <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
          <PieChart width={110} height={110}>
            <Pie data={tcData} cx={53} cy={53} outerRadius={50} dataKey="value" paddingAngle={2}>
              {tcData.map((_,i)=><Cell key={i} fill={[t.accent,t.accent2,t.hl,t.textDim][i%4]}/>)}
            </Pie>
            <Tooltip content={tip}/>
          </PieChart>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {tcData.map((d,i)=>(
              <div key={d.name} style={{display:"flex",alignItems:"center",gap:7,fontSize:13}}>
                <div style={{width:9,height:9,borderRadius:2,background:[t.accent,t.accent2,t.hl,t.textDim][i%4],flexShrink:0}}/>
                <span style={{color:t.textDim,textTransform:"capitalize"}}>{d.name}:</span>
                <span style={{color:t.text,fontWeight:600}}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  </div>;
}

// ── Openings Tab ──────────────────────────────────────────────────────────────
function OpeningsTab({games,loading,t}){
  const [tc,setTc]=useState("all");
  const [sort,setSort]=useState({key:"games",dir:-1});
  const [min,setMin]=useState(1);
  const toggleSort=k=>setSort(s=>({key:k,dir:s.key===k?-s.dir:-1}));
  const tip=(props)=><ChartTip {...props} t={t}/>;
  if(loading) return <div style={{display:"flex",flexDirection:"column",gap:10}}>{[...Array(5)].map((_,i)=><Sk key={i} h={34}/>)}</div>;
  if(!games?.length) return <div style={{color:t.textDim}}>No games loaded.</div>;
  const data=aggOpenings(games,tc).filter(o=>o.games>=min);
  const sorted=[...data].sort((a,b)=>sort.dir*((a[sort.key]??"")<(b[sort.key]??"")? -1:1));
  const top10=[...data].sort((a,b)=>b.games-a.games).slice(0,10);
  return <div style={{display:"flex",flexDirection:"column",gap:16}}>
    <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
      <span style={{fontSize:12,color:t.textDim}}>Time control:</span>
      {["all","daily","rapid","blitz","bullet"].map(x=>(
        <button key={x} onClick={()=>setTc(x)} style={{background:tc===x?`${t.accent}18`:"none",border:`1px solid ${tc===x?t.accent+"60":t.cardBorder}`,borderRadius:20,color:tc===x?t.accent:t.textDim,cursor:"pointer",fontFamily:t.font,fontSize:12,fontWeight:tc===x?600:400,padding:"4px 12px",transition:"all .2s"}}>{x}</button>
      ))}
      <span style={{fontSize:12,color:t.textDim,marginLeft:8}}>Min games:</span>
      <select value={min} onChange={e=>setMin(+e.target.value)}>{[1,2,3,5,10].map(n=><option key={n} value={n}>{n}</option>)}</select>
    </div>
    <Card t={t}>
      <SecTitle t={t}>Top Openings — Outcome Split</SecTitle>
      <ResponsiveContainer width="100%" height={Math.max(200,top10.length*38)}>
        <BarChart data={top10} layout="vertical" margin={{left:160}}>
          <XAxis type="number" domain={[0,100]} tick={{fill:t.textDim,fontSize:11}} axisLine={false} tickLine={false}/>
          <YAxis type="category" dataKey="opening" tick={{fill:t.textMid,fontSize:11}} width={155} axisLine={false} tickLine={false} tickFormatter={v=>v.length>22?v.slice(0,20)+"…":v}/>
          <Tooltip content={tip}/>
          <Legend wrapperStyle={{color:t.textMid,fontSize:12}}/>
          <Bar dataKey="winPct" name="Win %" stackId="a" fill={t.win} radius={[0,0,0,0]}/>
          <Bar dataKey="drawPct" name="Draw %" stackId="a" fill={t.draw} radius={[0,0,0,0]}/>
          <Bar dataKey="lossPct" name="Loss %" stackId="a" fill={t.loss} radius={[0,4,4,0]}/>
        </BarChart>
      </ResponsiveContainer>
    </Card>
    <Card t={t}>
      <SecTitle t={t}>All Openings</SecTitle>
      <div style={{overflowX:"auto"}}>
        <table>
          <thead><tr>
            {[["opening","Opening"],["games","Games"],["wins","Wins"],["losses","Losses"],["draws","Draws"],["avgOpp","Avg Opp"]].map(([k,l])=>(
              <th key={k} onClick={()=>toggleSort(k)}>{l}{sort.key===k?sort.dir===1?" ↑":" ↓":""}</th>
            ))}
          </tr></thead>
          <tbody>{sorted.map((o,i)=>(
            <tr key={i}>
              <td style={{color:t.text,maxWidth:260,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}><span style={{fontSize:10,color:t.textDim,marginRight:5}}>{o.eco}</span>{o.opening}</td>
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
    <Card t={t}>
      <SecTitle t={t} sub="Minimum 3 games · sorted by win%">Opening Leaderboard</SecTitle>
      <div style={{display:"flex",flexDirection:"column",gap:7}}>
        {aggOpenings(games,tc).filter(o=>o.games>=3).sort((a,b)=>b.winPct-a.winPct).slice(0,12).map((o,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:`${t.accent}06`,borderRadius:8,border:`1px solid ${t.cardBorder}`}}>
            <div style={{width:22,height:22,borderRadius:"50%",background:i<3?t.accent:`${t.accent}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:i<3?t.bg:t.textDim,flexShrink:0}}>{i+1}</div>
            <div style={{flex:1,fontSize:13,color:t.textMid,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}><span style={{fontSize:10,color:t.textDim,marginRight:5}}>{o.eco}</span>{o.opening}</div>
            <span style={{fontSize:11,color:t.textDim}}>{o.games}g</span>
            <span className={`badge ${o.winPct>=55?"green":o.winPct>=45?"yellow":"red"}`}>{o.winPct}%</span>
          </div>
        ))}
      </div>
    </Card>
  </div>;
}

// ── Color Stats Tab ───────────────────────────────────────────────────────────
function ColorTab({games,loading,t}){
  const tip=(props)=><ChartTip {...props} t={t}/>;
  if(loading) return <Sk h={260}/>;
  if(!games?.length) return <div style={{color:t.textDim}}>No games loaded.</div>;
  const {white,black}=colorStats(games);
  const Panel=({label,s,icon})=>{
    const tot=s.total||1;
    return <Card t={t} style={{flex:1,minWidth:220}}>
      <div style={{fontFamily:t.headingFont,fontSize:20,fontWeight:700,color:t.text,marginBottom:4}}>{icon} {label}</div>
      <div style={{fontSize:12,color:t.textDim,marginBottom:14}}>{s.total} games</div>
      <div style={{display:"flex",gap:14,alignItems:"center",flexWrap:"wrap"}}>
        <Donut wins={s.wins} losses={s.losses} draws={s.draws} t={t} size={100}/>
        <div style={{display:"flex",flexDirection:"column",gap:5}}>
          {[["wins",s.wins,t.win],["losses",s.losses,t.loss],["draws",s.draws,t.draw]].map(([l,v,c])=>(
            <div key={l} style={{display:"flex",alignItems:"center",gap:8,fontSize:13}}>
              <div style={{width:9,height:9,borderRadius:2,background:c,flexShrink:0}}/>
              <span style={{color:t.textDim,textTransform:"capitalize"}}>{l}:</span>
              <span style={{color:c,fontWeight:700}}>{v}</span>
              <span style={{color:t.textDim,fontSize:11}}>({Math.round(v/tot*100)}%)</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{marginTop:14,display:"flex",flexDirection:"column",gap:1}}>
        {[["Avg opponent rating",s.avgOpp||"—"],["Best win (opp elo)",s.bestWinElo?`${s.bestWinOpp} (${s.bestWinElo})`:"—"]].map(([l,v])=>(
          <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${t.cardBorder}40`,fontSize:13}}>
            <span style={{color:t.textDim}}>{l}</span>
            <span style={{color:t.accent,fontWeight:600}}>{v}</span>
          </div>
        ))}
      </div>
    </Card>;
  };
  return <div style={{display:"flex",flexDirection:"column",gap:16}}>
    <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
      <Panel label="White" s={white} icon="♙"/>
      <Panel label="Black" s={black} icon="♟"/>
    </div>
    <Card t={t}>
      <SecTitle t={t}>White vs Black — Side by Side</SecTitle>
      <ResponsiveContainer width="100%" height={170}>
        <BarChart data={[
          {name:"Win%",White:white.total?Math.round(white.wins/white.total*100):0,Black:black.total?Math.round(black.wins/black.total*100):0},
          {name:"Draw%",White:white.total?Math.round(white.draws/white.total*100):0,Black:black.total?Math.round(black.draws/black.total*100):0},
          {name:"Loss%",White:white.total?Math.round(white.losses/white.total*100):0,Black:black.total?Math.round(black.losses/black.total*100):0},
        ]}>
          <XAxis dataKey="name" tick={{fill:t.textDim,fontSize:12}} axisLine={false} tickLine={false}/>
          <YAxis domain={[0,100]} tick={{fill:t.textDim,fontSize:11}} axisLine={false} tickLine={false}/>
          <Tooltip content={tip}/>
          <Bar dataKey="White" fill={t.accent} radius={[4,4,0,0]}/>
          <Bar dataKey="Black" fill={t.accent2} radius={[4,4,0,0]}/>
          <Legend wrapperStyle={{color:t.textMid,fontSize:12}}/>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  </div>;
}

// ── Elo Tab ───────────────────────────────────────────────────────────────────
function EloTab({games,stats,loading,t}){
  const tip=(props)=><ChartTip {...props} t={t}/>;
  if(loading) return <Sk h={260}/>;
  if(!games?.length) return <div style={{color:t.textDim}}>No games loaded.</div>;
  const pr=getRating(stats||{},"rapid").last||getRating(stats||{},"blitz").last||1200;
  const data=eloBrackets(games);
  const elos=games.filter(g=>g.oppElo).map(g=>g.oppElo);
  const avgOpp=elos.length?Math.round(elos.reduce((a,b)=>a+b,0)/elos.length):pr;
  return <div style={{display:"flex",flexDirection:"column",gap:16}}>
    <Card t={t}>
      <SecTitle t={t} sub={`Reference line at your avg rating: ${avgOpp}`}>Win% by Opponent Rating</SecTitle>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <XAxis dataKey="label" tick={{fill:t.textDim,fontSize:11}} axisLine={false} tickLine={false}/>
          <YAxis domain={[0,100]} tick={{fill:t.textDim,fontSize:11}} axisLine={false} tickLine={false}/>
          <Tooltip content={tip}/>
          <ReferenceLine x={data.find(d=>avgOpp>=parseInt(d.label.replace(/[^0-9]/g,"")?.split("-")[0]||0))?.label} stroke={t.accent} strokeDasharray="4 3" label={{value:"You",fill:t.accent,fontSize:11,position:"top"}}/>
          <Bar dataKey="winPct" name="Win%" radius={[5,5,0,0]}>
            {data.map((e,i)=><Cell key={i} fill={e.winPct>=55?t.win:e.winPct>=45?"#ffc800":t.loss}/>)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:12}}>
        {data.map(d=>(
          <div key={d.label} style={{textAlign:"center",fontSize:11,color:t.textDim}}>
            <div style={{color:t.textMid}}>{d.label}</div>
            <div style={{color:t.textDim}}>{d.games}g</div>
          </div>
        ))}
      </div>
    </Card>
  </div>;
}

// ── Compare Tab ───────────────────────────────────────────────────────────────
function CompareTab({p1,p2,l1,l2,p2In,setP2In,loadP2,t}){
  const tip=(props)=><ChartTip {...props} t={t}/>;
  if(!p2&&!l2) return <div style={{display:"flex",flexDirection:"column",gap:16}}>
    <div style={{textAlign:"center",padding:"28px 0 16px",color:t.textDim}}>
      <div style={{fontSize:40,marginBottom:10}}>⚔️</div>
      <div style={{fontFamily:t.headingFont,fontSize:18,color:t.textMid,marginBottom:8}}>Head-to-Head Comparison</div>
      <div style={{fontSize:13}}>Enter a second player to compare</div>
    </div>
    <Card t={t}>
      <div style={{display:"flex",gap:10}}>
        <input placeholder="Opponent username…" value={p2In} onChange={e=>setP2In(e.target.value)} onKeyDown={e=>e.key==="Enter"&&loadP2()}/>
        <button className="primary" onClick={loadP2} disabled={!p2In.trim()}>Compare</button>
      </div>
    </Card>
  </div>;
  if(l1||l2) return <Sk h={300}/>;
  if(!p1||!p2) return null;
  const norm=(v,mx)=>Math.round((v/Math.max(mx,1))*100);
  const p1r=getRating(p1.stats,"blitz").last||0, p2r=getRating(p2.stats,"blitz").last||0;
  const p1w=p1.games.length?Math.round(p1.games.filter(g=>g.result==="win").length/p1.games.length*100):0;
  const p2w=p2.games.length?Math.round(p2.games.filter(g=>g.result==="win").length/p2.games.length*100):0;
  const p1pz=p1.stats?.tactics?.highest?.rating||0, p2pz=p2.stats?.tactics?.highest?.rating||0;
  const e1=p1.games.filter(g=>g.oppElo).map(g=>g.oppElo), e2=p2.games.filter(g=>g.oppElo).map(g=>g.oppElo);
  const ao1=e1.length?Math.round(e1.reduce((a,b)=>a+b,0)/e1.length):0;
  const ao2=e2.length?Math.round(e2.reduce((a,b)=>a+b,0)/e2.length):0;
  const d1=new Set(p1.games.map(g=>g.opening)).size, d2=new Set(p2.games.map(g=>g.opening)).size;
  const radar=[
    {subject:"Win%",[p1.profile.username]:p1w,[p2.profile.username]:p2w},
    {subject:"Rating",[p1.profile.username]:norm(p1r,Math.max(p1r,p2r)),[p2.profile.username]:norm(p2r,Math.max(p1r,p2r))},
    {subject:"Puzzle",[p1.profile.username]:norm(p1pz,Math.max(p1pz,p2pz)),[p2.profile.username]:norm(p2pz,Math.max(p1pz,p2pz))},
    {subject:"Avg Opp",[p1.profile.username]:norm(ao1,Math.max(ao1,ao2)),[p2.profile.username]:norm(ao2,Math.max(ao1,ao2))},
    {subject:"Diversity",[p1.profile.username]:norm(d1,Math.max(d1,d2)),[p2.profile.username]:norm(d2,Math.max(d1,d2))},
  ];
  const p1open=aggOpenings(p1.games).sort((a,b)=>b.games-a.games).slice(0,6);
  const p2open=aggOpenings(p2.games);
  const shared=p1open.map(o=>({opening:o.opening.length>18?o.opening.slice(0,16)+"…":o.opening,[p1.profile.username]:o.winPct,[p2.profile.username]:p2open.find(x=>x.opening===o.opening)?.winPct??0}));
  return <div style={{display:"flex",flexDirection:"column",gap:16}}>
    <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
      {[p1,p2].map((p,idx)=>(
        <Card key={idx} t={t} style={{flex:1,minWidth:200}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
            <img src={p.profile.avatar||""} alt="" style={{width:40,height:40,borderRadius:"50%",border:`1px solid ${t.accent}40`,background:t.bg}} onError={e=>{e.target.style.display="none";}}/>
            <div>
              <div style={{fontFamily:t.headingFont,fontSize:18,fontWeight:700,color:idx===0?t.accent:t.hl}}>{p.profile.username}</div>
              <div style={{fontSize:11,color:t.textDim}}>{p.games.length} recent games</div>
            </div>
          </div>
          {["rapid","blitz","bullet"].map(tc=>{const r=getRating(p.stats,tc);return r.last?<div key={tc} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${t.cardBorder}40`,fontSize:13}}><span style={{color:t.textDim,textTransform:"capitalize"}}>{tc}</span><span style={{color:t.text,fontWeight:600}}>{r.last}</span></div>:null;})}
          {p.stats?.tactics?.highest?.rating&&<div style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${t.cardBorder}40`,fontSize:13}}><span style={{color:t.textDim}}>Puzzle</span><span style={{color:t.hl,fontWeight:600}}>{p.stats.tactics.highest.rating}</span></div>}
          <div style={{display:"flex",justifyContent:"space-between",padding:"7px 0",fontSize:13}}><span style={{color:t.textDim}}>Win rate</span><span style={{color:t.accent,fontWeight:700}}>{p.games.length?Math.round(p.games.filter(g=>g.result==="win").length/p.games.length*100):0}%</span></div>
        </Card>
      ))}
    </div>
    <Card t={t}>
      <SecTitle t={t}>Radar Comparison</SecTitle>
      <ResponsiveContainer width="100%" height={260}>
        <RadarChart data={radar} cx="50%" cy="50%">
          <PolarGrid stroke={`${t.accent}18`}/>
          <PolarAngleAxis dataKey="subject" tick={{fill:t.textMid,fontSize:12}}/>
          <PolarRadiusAxis tick={false} axisLine={false} domain={[0,100]}/>
          <Radar name={p1.profile.username} dataKey={p1.profile.username} stroke={t.accent} fill={t.accent} fillOpacity={.18}/>
          <Radar name={p2.profile.username} dataKey={p2.profile.username} stroke={t.hl} fill={t.hl} fillOpacity={.12}/>
          <Legend wrapperStyle={{color:t.textMid,fontSize:12}}/>
          <Tooltip content={tip}/>
        </RadarChart>
      </ResponsiveContainer>
    </Card>
    <Card t={t}>
      <SecTitle t={t}>Shared Opening Win%</SecTitle>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={shared} layout="vertical" margin={{left:130}}>
          <XAxis type="number" domain={[0,100]} tick={{fill:t.textDim,fontSize:11}} axisLine={false} tickLine={false}/>
          <YAxis type="category" dataKey="opening" tick={{fill:t.textMid,fontSize:11}} width={125} axisLine={false} tickLine={false}/>
          <Tooltip content={tip}/>
          <Bar dataKey={p1.profile.username} fill={t.accent} radius={[0,4,4,0]}/>
          <Bar dataKey={p2.profile.username} fill={t.hl} radius={[0,4,4,0]}/>
          <Legend wrapperStyle={{color:t.textMid,fontSize:12}}/>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  </div>;
}

// ── DNA / Personality Tab ─────────────────────────────────────────────────────
function DnaTab({games,stats,loading,t}){
  const tip=(props)=><ChartTip {...props} t={t}/>;
  if(loading) return <Sk h={300}/>;
  const p=computePersonality(games,stats);
  if(!p) return <div style={{color:t.textDim,textAlign:"center",padding:40}}>Load a player to reveal their chess DNA.</div>;
  const sc=p.streak.type==="win"?t.win:p.streak.type==="loss"?t.loss:t.draw;
  return <div style={{display:"flex",flexDirection:"column",gap:16}}>
    <div style={{background:t.card,border:`1px solid ${p.titleColor}35`,borderRadius:16,boxShadow:`inset 0 1px 0 ${p.titleColor}18,0 6px 40px rgba(0,0,0,.55)`,padding:"26px 22px",position:"relative",overflow:"hidden",animation:"revealCard .65s ease both"}}>
      <div style={{position:"absolute",top:-50,right:-50,width:180,height:180,borderRadius:"50%",background:`radial-gradient(circle,${p.titleColor}14,transparent 70%)`,pointerEvents:"none"}}/>
      <div style={{textAlign:"center",marginBottom:20}}>
        <div style={{fontSize:50,marginBottom:8,animation:"titlePop .6s ease both"}}>{p.icon}</div>
        <div style={{fontSize:10,fontWeight:700,letterSpacing:".14em",textTransform:"uppercase",color:p.titleColor,opacity:.75,marginBottom:5,fontFamily:t.font}}>Your Chess Personality</div>
        <h2 style={{fontFamily:t.headingFont,fontSize:28,fontWeight:900,color:p.titleColor,animation:"glow 3s ease-in-out infinite"}}>{p.title}</h2>
        <p style={{fontSize:14,color:t.textMid,marginTop:10,lineHeight:1.65,maxWidth:500,margin:"10px auto 0",fontFamily:t.font}}>{p.desc}</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:9,marginTop:18}}>
        {[["Win Rate",p.winPct+"%",t.win],["Games Analyzed",p.total,t.accent],["Fav. Time Control",p.favTC,t.hl],["Unique Openings",p.uniqueOpenings,"#a78bfa"],["Best Win Elo",p.bestWin||"—","#fbbf24"],["Avg Opponent",p.avgOpp||"—","#60a5fa"],["Streak",p.streak.count+" "+p.streak.type+"s",sc],["Draw Rate",p.drawPct+"%",t.draw]].map(([l,v,c])=>(
          <div key={l} style={{background:`${t.accent}07`,border:`1px solid ${t.cardBorder}`,borderRadius:10,padding:"11px 13px"}}>
            <div style={{fontSize:10,color:t.textDim,textTransform:"uppercase",letterSpacing:".07em",marginBottom:5,fontFamily:t.font}}>{l}</div>
            <div style={{fontSize:19,fontWeight:700,color:c,fontFamily:t.headingFont}}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:7,marginTop:16,justifyContent:"center"}}>
        {[p.speed==="speed"?"⚡ Speed Demon":p.speed==="deep"?"🧠 Deep Thinker":"⚔️ Sharp Player",p.aggression==="high"?"🔥 Aggressive":p.aggression==="mid"?"⚖️ Balanced":"🛡️ Defensive",p.breadth==="explorer"?"🌍 Explorer":p.breadth==="specialist"?"📌 Specialist":"📐 Versatile"].map(tag=>(
          <span key={tag} style={{background:`${p.titleColor}14`,border:`1px solid ${p.titleColor}30`,borderRadius:20,padding:"4px 14px",fontSize:12,color:p.titleColor,fontWeight:600,fontFamily:t.font}}>{tag}</span>
        ))}
      </div>
      {p.bestOpening&&<div style={{marginTop:14,background:`${t.accent}07`,border:`1px solid ${t.cardBorder}`,borderRadius:10,padding:"11px 15px",textAlign:"center"}}>
        <span style={{fontSize:11,color:t.textDim,textTransform:"uppercase",letterSpacing:".06em"}}>Best Opening · </span>
        <span style={{fontSize:13,color:t.text,fontWeight:600}}>{p.bestOpening.opening}</span>
        <span style={{fontSize:12,color:t.win,marginLeft:8,fontWeight:700}}>{p.bestOpening.winPct}% win rate</span>
        <span style={{fontSize:11,color:t.textDim,marginLeft:6}}>({p.bestOpening.games}g)</span>
      </div>}
    </div>
    <Card t={t}>
      <SecTitle t={t}>Playstyle DNA Radar</SecTitle>
      <ResponsiveContainer width="100%" height={240}>
        <RadarChart data={[
          {subject:"Aggression",value:p.aggression==="high"?90:p.aggression==="mid"?55:25},
          {subject:"Speed",value:p.speed==="speed"?90:p.speed==="sharp"?60:30},
          {subject:"Breadth",value:p.breadth==="explorer"?90:p.breadth==="balanced"?55:25},
          {subject:"Win Rate",value:p.winPct},
          {subject:"Consistency",value:Math.min(100,Math.round(p.total/4))},
          {subject:"Draw Avoidance",value:100-p.drawPct*2},
        ]} cx="50%" cy="50%">
          <PolarGrid stroke={`${p.titleColor}20`}/>
          <PolarAngleAxis dataKey="subject" tick={{fill:t.textMid,fontSize:12}}/>
          <PolarRadiusAxis tick={false} axisLine={false} domain={[0,100]}/>
          <Radar dataKey="value" stroke={p.titleColor} fill={p.titleColor} fillOpacity={.2}/>
          <Tooltip content={tip}/>
        </RadarChart>
      </ResponsiveContainer>
    </Card>
  </div>;
}

// ── Main ──────────────────────────────────────────────────────────────────────
const TABS=[["Overview","📊"],["Openings","♟"],["Color Stats","🎨"],["Elo Breakdown","📈"],["Compare","⚔️"],["Chess DNA","🧬"]];

export default function App(){
  const [themeKey,setThemeKey]=useState("forest");
  const t=THEMES[themeKey];
  useEffect(()=>{ injectThemeStyles(t); document.body.style.background=t.bg; },[t]);

  const [tab,setTab]=useState(0);
  const [p1In,setP1In]=useState("");
  const [p2In,setP2In]=useState("");
  const [p1,setP1]=useState(null);
  const [p2,setP2]=useState(null);
  const [l1,setL1]=useState(false);
  const [l2,setL2]=useState(false);
  const [e1,setE1]=useState(null);

  const load1=async()=>{
    if(!p1In.trim())return;
    setL1(true);setE1(null);setP1(null);
    try{setP1(await loadPlayer(p1In.trim().toLowerCase()));}
    catch(e){setE1(e.message||"Failed to load player");}
    finally{setL1(false);}
  };
  const load2=async()=>{
    if(!p2In.trim())return;
    setL2(true);setP2(null);
    try{setP2(await loadPlayer(p2In.trim().toLowerCase()));}
    catch{}
    finally{setL2(false);}
  };

  return <div style={{minHeight:"100vh",position:"relative"}}>
    <div style={{position:"fixed",inset:0,zIndex:0,background:t.bg,backgroundImage:`repeating-linear-gradient(135deg,${t.patternColor} 0,${t.patternColor} 1px,transparent 1px,transparent 40px),repeating-linear-gradient(45deg,${t.checkerColor} 0,${t.checkerColor} 1px,transparent 1px,transparent 20px)`,pointerEvents:"none"}}/>
    <div style={{position:"fixed",inset:0,zIndex:0,backgroundImage:`repeating-conic-gradient(${t.checkerColor} 0% 25%,transparent 0% 50%)`,backgroundSize:"42px 42px",pointerEvents:"none"}}/>

    <div style={{position:"relative",zIndex:1,maxWidth:900,margin:"0 auto",padding:"22px 16px 60px"}}>

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24,animation:"fadeInUp .5s ease both"}}>
        <div>
          <h1 style={{fontFamily:t.headingFont,fontSize:30,fontWeight:900,color:t.accent,letterSpacing:"-.02em"}}>Chess.com Stats & Opening Analyzer</h1>
          <p style={{fontSize:13,color:t.textDim,marginTop:4}}>Deep ratings, opening performance, color splits, Elo breakdown, and head-to-head.</p>
        </div>
        <ThemePicker current={themeKey} onChange={setThemeKey}/>
      </div>

      {/* Search bar */}
      <div style={{background:t.card,border:`1px solid ${t.cardBorder}`,borderRadius:12,padding:"16px 18px",marginBottom:20,animation:"fadeInUp .45s .05s ease both",display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:180,position:"relative"}}>
          <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:t.textDim,fontSize:15,pointerEvents:"none"}}>🔍</span>
          <input placeholder="Player 1 username…" value={p1In} onChange={e=>setP1In(e.target.value)} onKeyDown={e=>e.key==="Enter"&&load1()} style={{paddingLeft:36}}/>
        </div>
        <button className="primary" onClick={load1} disabled={l1||!p1In.trim()}>
          {l1?<span style={{display:"inline-flex",alignItems:"center",gap:8}}><span style={{width:13,height:13,border:`2px solid ${t.btnColor}`,borderTopColor:"transparent",borderRadius:"50%",display:"inline-block",animation:"spin .8s linear infinite"}}/> Analyzing…</span>:"Analyze"}
        </button>
        {e1&&<div style={{width:"100%",fontSize:12,color:t.loss}}>⚠ {e1}</div>}
      </div>

      {/* Profile */}
      {(p1||l1)&&<div style={{marginBottom:16}}><ProfileHeader data={p1} loading={l1} t={t}/></div>}

      {/* Tabs */}
      {(p1||l1)&&<div style={{display:"flex",gap:2,marginBottom:14,flexWrap:"wrap",background:t.card,border:`1px solid ${t.cardBorder}`,borderRadius:10,padding:6,animation:"fadeInUp .35s ease both"}}>
        {TABS.map(([name,icon],i)=>(
          <button key={name} className={`tab-btn ${tab===i?"active":""}`} onClick={()=>setTab(i)}>{icon} {name}</button>
        ))}
      </div>}

      {/* Content */}
      {(p1||l1)&&<div key={tab} style={{animation:"fadeInUp .3s ease both"}}>
        {tab===0&&<OverviewTab data={p1} loading={l1} t={t}/>}
        {tab===1&&<OpeningsTab games={p1?.games} loading={l1} t={t}/>}
        {tab===2&&<ColorTab games={p1?.games} loading={l1} t={t}/>}
        {tab===3&&<EloTab games={p1?.games} stats={p1?.stats} loading={l1} t={t}/>}
        {tab===4&&<CompareTab p1={p1} p2={p2} l1={l1} l2={l2} p2In={p2In} setP2In={setP2In} loadP2={load2} t={t}/>}
        {tab===5&&<DnaTab games={p1?.games} stats={p1?.stats} loading={l1} t={t}/>}
      </div>}

      {/* Empty state */}
      {!p1&&!l1&&!e1&&<div style={{textAlign:"center",padding:"70px 0",animation:"fadeInUp .5s .15s ease both"}}>
        <div style={{fontSize:60,opacity:.2,marginBottom:16}}>♜</div>
        <div style={{fontFamily:t.headingFont,fontSize:22,color:t.textMid}}>Enter a Chess.com username to begin</div>
        <div style={{fontSize:13,color:t.textDim,marginTop:8}}>Openings · Color stats · Elo breakdown · Chess personality · Compare players</div>
      </div>}

      <div style={{textAlign:"center",marginTop:50,fontSize:11,color:t.textDim}}>Data from Chess.com Public API · Last 3 months · No data stored</div>
    </div>
  </div>;
}