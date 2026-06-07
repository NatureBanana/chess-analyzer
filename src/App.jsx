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
const THEMES = {
  slate:    { name:"Slate",    icon:"🎯", bg:"#0d1117", card:"linear-gradient(135deg,rgba(20,26,36,.92),rgba(10,14,20,.96))",  cardBorder:"rgba(139,148,158,0.15)", accent:"#58a6ff", accent2:"#1f6feb", hl:"#79c0ff", text:"#c9d1d9", textDim:"#4a5568", textMid:"#8b949e", win:"#3fb950", loss:"#f85149", draw:"#6e7681", inputBg:"rgba(20,26,36,.9)",     btnGrad:"linear-gradient(135deg,#1f6feb,#58a6ff)", btnColor:"#0d1117", skA:"rgba(88,166,255,.04)",  skB:"rgba(88,166,255,.1)",  font:"'DM Sans',sans-serif",        headingFont:"'Playfair Display',serif", scrollThumb:"#58a6ff28", glowC:"#58a6ff35", glowC2:"#58a6ff70", checker:"rgba(88,166,255,.010)",  pat:"rgba(88,166,255,.008)" },
  forest:   { name:"Forest",   icon:"🌲", bg:"#040f08", card:"linear-gradient(135deg,rgba(0,44,22,.9),rgba(0,18,9,.96))",    cardBorder:"rgba(0,255,136,0.13)",   accent:"#00ff88", accent2:"#00c860", hl:"#39ffa0", text:"#c8f0dc", textDim:"#3a6048", textMid:"#7ab898", win:"#00ff88", loss:"#ff5555", draw:"#5a8e6e", inputBg:"rgba(0,40,20,.85)",     btnGrad:"linear-gradient(135deg,#00c860,#00ff88)", btnColor:"#030e06", skA:"rgba(0,255,136,.04)",   skB:"rgba(0,255,136,.1)",   font:"'DM Sans',sans-serif",          headingFont:"'Playfair Display',serif", scrollThumb:"#00ff8828", glowC:"#00ff8840", glowC2:"#00ff8880", checker:"rgba(0,255,136,.013)",   pat:"rgba(0,255,136,.010)" },
  midnight: { name:"Midnight", icon:"🌙", bg:"#06070f", card:"linear-gradient(135deg,rgba(15,18,50,.9),rgba(6,7,25,.96))",   cardBorder:"rgba(100,120,255,0.15)", accent:"#7b8fff", accent2:"#5060dd", hl:"#a0aaff", text:"#d0d4f8", textDim:"#404880", textMid:"#8890cc", win:"#7b8fff", loss:"#ff6b8a", draw:"#5a6090", inputBg:"rgba(15,18,50,.85)",    btnGrad:"linear-gradient(135deg,#5060dd,#7b8fff)", btnColor:"#06070f", skA:"rgba(123,143,255,.04)", skB:"rgba(123,143,255,.1)", font:"'Space Grotesk',sans-serif",   headingFont:"'Syne',sans-serif",        scrollThumb:"#7b8fff28", glowC:"#7b8fff40", glowC2:"#7b8fff80", checker:"rgba(100,120,255,.010)", pat:"rgba(100,120,255,.008)" },
  gold:     { name:"Gold",     icon:"👑", bg:"#0c0a02", card:"linear-gradient(135deg,rgba(35,28,4,.92),rgba(18,14,2,.96))",  cardBorder:"rgba(255,200,0,0.14)",   accent:"#ffd700", accent2:"#cc9900", hl:"#ffe566", text:"#f0e8c0", textDim:"#6a5a18", textMid:"#c0a840", win:"#ffd700", loss:"#ff6060", draw:"#8a7830", inputBg:"rgba(35,28,4,.85)",     btnGrad:"linear-gradient(135deg,#cc9900,#ffd700)", btnColor:"#0c0a02", skA:"rgba(255,215,0,.04)",   skB:"rgba(255,215,0,.1)",   font:"'DM Sans',sans-serif",          headingFont:"'Playfair Display',serif", scrollThumb:"#ffd70028", glowC:"#ffd70040", glowC2:"#ffd70080", checker:"rgba(255,200,0,.010)",   pat:"rgba(255,200,0,.008)" },
  crimson:  { name:"Crimson",  icon:"🔴", bg:"#0f0608", card:"linear-gradient(135deg,rgba(40,8,12,.9),rgba(20,4,6,.96))",    cardBorder:"rgba(255,80,80,0.13)",   accent:"#ff5c5c", accent2:"#cc3333", hl:"#ff9090", text:"#f0d0d0", textDim:"#6a2838", textMid:"#c07080", win:"#ff5c5c", loss:"#5caaff", draw:"#8a5060", inputBg:"rgba(40,8,12,.85)",     btnGrad:"linear-gradient(135deg,#cc3333,#ff5c5c)", btnColor:"#0f0608", skA:"rgba(255,92,92,.04)",   skB:"rgba(255,92,92,.1)",   font:"'DM Sans',sans-serif",          headingFont:"'Playfair Display',serif", scrollThumb:"#ff5c5c28", glowC:"#ff5c5c40", glowC2:"#ff5c5c80", checker:"rgba(255,80,80,.010)",   pat:"rgba(255,80,80,.008)" },
  obsidian: { name:"Obsidian", icon:"🖤", bg:"#080808", card:"linear-gradient(135deg,rgba(22,22,22,.92),rgba(10,10,10,.96))",cardBorder:"rgba(200,200,200,0.1)",  accent:"#e0e0e0", accent2:"#999999", hl:"#ffffff", text:"#d8d8d8", textDim:"#444444", textMid:"#999999", win:"#e0e0e0", loss:"#ff6060", draw:"#666666", inputBg:"rgba(22,22,22,.9)",     btnGrad:"linear-gradient(135deg,#555,#e0e0e0)",    btnColor:"#080808", skA:"rgba(200,200,200,.04)", skB:"rgba(200,200,200,.09)",font:"'Space Grotesk',sans-serif",   headingFont:"'Syne',sans-serif",        scrollThumb:"#ffffff18", glowC:"#ffffff28", glowC2:"#ffffff60", checker:"rgba(180,180,180,.010)", pat:"rgba(180,180,180,.008)" },
};

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
    body { background:${t.bg}; color:${t.text}; font-family:${t.font}; }
    ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:${t.scrollThumb};border-radius:3px}
    @keyframes fadeInUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
    @keyframes shimmer{0%,100%{opacity:.3}50%{opacity:.65}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes glow{0%,100%{text-shadow:0 0 20px ${t.glowC}}50%{text-shadow:0 0 40px ${t.glowC2},0 0 70px ${t.glowC}}}
    @keyframes revealCard{from{opacity:0;transform:scale(.96) translateY(14px)}to{opacity:1;transform:scale(1) translateY(0)}}
    @keyframes titlePop{0%{opacity:0;transform:scale(.8)}65%{transform:scale(1.05)}100%{opacity:1;transform:scale(1)}}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.6}}
    .fi{animation:fadeInUp .45s ease both}
    .skel{background:linear-gradient(90deg,${t.skA} 25%,${t.skB} 50%,${t.skA} 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:6px}
    .tab-btn{background:none;border:1px solid transparent;cursor:pointer;font-family:${t.font};font-size:13px;font-weight:500;padding:8px 15px;border-radius:6px;transition:all .2s;color:${t.textDim};white-space:nowrap}
    .tab-btn:hover{color:${t.accent};background:${t.accent}12}
    .tab-btn.active{color:${t.accent};background:${t.accent}16;border-color:${t.accent}40;font-weight:600}
    input{background:${t.inputBg};border:1px solid ${t.cardBorder};border-radius:10px;color:${t.text};font-family:${t.font};font-size:15px;padding:13px 16px;outline:none;transition:all .2s;width:100%}
    input:focus{border-color:${t.accent}80;box-shadow:0 0 0 3px ${t.glowC}}
    input::placeholder{color:${t.textDim}90}
    button.primary{background:${t.btnGrad};border:none;border-radius:10px;color:${t.btnColor};cursor:pointer;font-family:${t.font};font-size:15px;font-weight:700;padding:13px 28px;transition:all .2s;white-space:nowrap}
    button.primary:hover{transform:translateY(-1px);box-shadow:0 4px 24px ${t.glowC}}
    button.primary:disabled{opacity:.4;cursor:not-allowed;transform:none}
    button.secondary{background:${t.accent}14;border:1px solid ${t.accent}40;border-radius:8px;color:${t.accent};cursor:pointer;font-family:${t.font};font-size:13px;font-weight:600;padding:8px 16px;transition:all .2s}
    button.secondary:hover{background:${t.accent}22}
    select{background:${t.inputBg};border:1px solid ${t.cardBorder};border-radius:6px;color:${t.text};font-family:${t.font};font-size:13px;padding:7px 10px;outline:none;cursor:pointer}
    table{width:100%;border-collapse:collapse;font-size:13px}
    th{color:${t.accent};font-weight:600;font-size:11px;letter-spacing:.07em;text-transform:uppercase;padding:10px;border-bottom:1px solid ${t.cardBorder};text-align:left;cursor:pointer;user-select:none}
    th:hover{color:${t.hl}}
    td{padding:8px 10px;border-bottom:1px solid ${t.cardBorder}40;color:${t.textMid};vertical-align:middle}
    tr:hover td{background:${t.skA}}
    .badge{display:inline-flex;align-items:center;border-radius:4px;font-size:11px;font-weight:700;padding:2px 9px;letter-spacing:.03em}
    .badge.green{background:${t.win}18;color:${t.win};border:1px solid ${t.win}40}
    .badge.yellow{background:rgba(255,200,0,.1);color:#ffc800;border:1px solid rgba(255,200,0,.3)}
    .badge.red{background:${t.loss}18;color:${t.loss};border:1px solid ${t.loss}40}
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
const fetchText = async u => { try { return await tryFetch(u, true); } catch { return ""; } };

// ── PGN parser ────────────────────────────────────────────────────────────────
function parsePGN(pgn, user) {
  if (!pgn || pgn.length < 10) return [];
  const ex = (txt, tag) => { const m = txt.match(new RegExp(`\\[${tag} "([^"]*)"`)); return m ? m[1] : null; };
  return pgn.split(/\r?\n\r?\n(?=\[)/).filter(g => g.includes("[White ") && g.includes("[Black ")).map(g => {
    const w = ex(g,"White"), b = ex(g,"Black");
    if (!w || !b) return null;
    const color = w.toLowerCase() === user.toLowerCase() ? "white" : "black";
    const raw = ex(g,"Result");
    let result = "draw";
    if (raw==="1-0") result = color==="white" ? "win":"loss";
    else if (raw==="0-1") result = color==="black" ? "win":"loss";
    const oppEloRaw = color==="white" ? ex(g,"BlackElo") : ex(g,"WhiteElo");
    const oppElo = oppEloRaw ? parseInt(oppEloRaw) : null;
    const tc = ex(g,"TimeControl");
    let timeControl = "other";
    if (tc) { const s=parseInt(tc.split("+")[0]); if(s<=180)timeControl="bullet"; else if(s<=600)timeControl="blitz"; else if(s<=1800)timeControl="rapid"; else if(tc==="-"||isNaN(s))timeControl="daily"; else timeControl="rapid"; }
    const dateStr = ex(g,"Date");
    const endTime = ex(g,"EndTime");
    let hour = null;
    if (endTime) { hour = parseInt(endTime.split(":")[0]); }
    return { opening:ex(g,"Opening")||"Unknown", eco:ex(g,"ECO")||"?", color, result, oppElo:(!oppElo||isNaN(oppElo))?null:oppElo, timeControl, date:dateStr, hour, opponent:color==="white"?b:w };
  }).filter(Boolean);
}

async function loadPlayer(user) {
  const base = `https://api.chess.com/pub/player/${user}`;
  const [profile, stats, archives] = await Promise.all([fetchJSON(base), fetchJSON(`${base}/stats`), fetchJSON(`${base}/games/archives`)]);
  if (!profile.username) throw new Error(`Player "${user}" not found on Chess.com`);
  const urls = (archives.archives||[]).slice(-3);
  const pgns = await Promise.all(urls.map(u => fetchText(u+"/pgn")));
  const games = pgns.flatMap(p => parsePGN(p, user));
  return { profile, stats, games };
}

// ── Analytics helpers ─────────────────────────────────────────────────────────
function getRating(stats, tc) { const s = stats?.[`chess_${tc}`]; return { last:s?.last?.rating??null, best:s?.best?.rating??null }; }

function aggOpenings(games, tc="all") {
  const f = tc==="all" ? games : games.filter(g=>g.timeControl===tc);
  const map = {};
  for (const g of f) {
    const k = g.opening==="Unknown" ? g.eco+" Opening" : g.opening;
    if (!map[k]) map[k]={opening:k,eco:g.eco,games:0,wins:0,losses:0,draws:0,elos:[]};
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
  // Best hour to play
  const hourMap = {};
  games.filter(g=>g.hour!==null).forEach(g=>{
    if(!hourMap[g.hour]) hourMap[g.hour]={wins:0,total:0};
    hourMap[g.hour].total++;
    if(g.result==="win") hourMap[g.hour].wins++;
  });
  let bestHour=null, bestHourWinPct=0;
  Object.entries(hourMap).forEach(([h,d])=>{ if(d.total>=3){ const wp=d.wins/d.total; if(wp>bestHourWinPct){bestHourWinPct=wp;bestHour=parseInt(h);} } });
  const formatHour = h => { if(h===null) return null; const ampm=h>=12?"pm":"am"; const h12=h%12||12; return `${h12}${ampm}`; };

  // Hot streak
  const streak = computeStreak(games);

  // Nemesis opening (most losses)
  const openings = aggOpenings(games);
  const nemesis = openings.filter(o=>o.games>=3).sort((a,b)=>b.losses-a.losses)[0];

  // Rating over time from game dates
  const byDate = {};
  games.forEach(g=>{ if(g.date && g.date!=="?") byDate[g.date]=(byDate[g.date]||[]); byDate[g.date].push(g); });
  const sortedDates = Object.keys(byDate).sort();
  // Build running win% per date for rating trend proxy
  const ratingTrend = sortedDates.slice(-20).map((date,i)=>({
    date: date.slice(5), // MM.DD
    games: byDate[date].length,
    wins: byDate[date].filter(g=>g.result==="win").length,
    index: i,
  }));

  return { bestHour:formatHour(bestHour), bestHourWinPct:Math.round(bestHourWinPct*100), streak, nemesis, ratingTrend };
}

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

function Card({children,style={},t,glow=false}) {
  return <div style={{background:t.card,border:`1px solid ${glow?t.accent+"40":t.cardBorder}`,borderRadius:14,boxShadow:`inset 0 1px 0 ${t.accent}08,0 4px 28px rgba(0,0,0,.45)${glow?`,0 0 40px ${t.glowC}`:""}`,padding:22,...style}}>{children}</div>;
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

// ── Theme picker ──────────────────────────────────────────────────────────────
function ThemePicker({current,onChange}) {
  const [open,setOpen]=useState(false);
  const t=THEMES[current];
  return <div style={{position:"relative"}}>
    <button onClick={()=>setOpen(o=>!o)} style={{background:"none",border:`1px solid ${t.cardBorder}`,borderRadius:8,color:t.text,cursor:"pointer",fontSize:13,fontFamily:t.font,padding:"6px 12px",display:"flex",alignItems:"center",gap:6}}>
      {t.icon} {t.name} <span style={{opacity:.5,fontSize:10}}>▼</span>
    </button>
    {open && <div style={{position:"absolute",top:"110%",right:0,background:t.card,border:`1px solid ${t.cardBorder}`,borderRadius:10,padding:8,zIndex:99,minWidth:160,boxShadow:"0 8px 32px rgba(0,0,0,.6)"}}>
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
  if (!p) return null;
  const share = () => {
    const text = `♟ Chess DNA: ${profile.username} is "${p.title}" | Win rate: ${p.winPct}% | Fav: ${p.favTC} | chess.com`;
    navigator.clipboard.writeText(text).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);});
  };
  return <div style={{perspective:800}}>
    <div style={{background:`linear-gradient(135deg,${p.titleColor}22,${t.bg}ee)`,border:`2px solid ${p.titleColor}60`,borderRadius:18,padding:"28px 24px",position:"relative",overflow:"hidden",boxShadow:`0 0 60px ${p.titleColor}20,inset 0 1px 0 ${p.titleColor}30`,animation:"revealCard .7s ease both",maxWidth:340,margin:"0 auto"}}>
      {/* holographic sheen */}
      <div style={{position:"absolute",inset:0,background:`repeating-linear-gradient(45deg,${p.titleColor}04 0,${p.titleColor}04 1px,transparent 1px,transparent 8px)`,pointerEvents:"none"}}/>
      <div style={{position:"absolute",top:-40,right:-40,width:160,height:160,borderRadius:"50%",background:`radial-gradient(circle,${p.titleColor}18,transparent 70%)`,pointerEvents:"none"}}/>

      <div style={{textAlign:"center",position:"relative"}}>
        <div style={{fontSize:10,fontWeight:700,letterSpacing:".18em",textTransform:"uppercase",color:p.titleColor,opacity:.7,marginBottom:8,fontFamily:t.font}}>Chess DNA · Player Card</div>
        <div style={{fontSize:52,marginBottom:8,animation:"float 3s ease-in-out infinite"}}>{p.icon}</div>
        <div style={{fontFamily:t.headingFont,fontSize:22,fontWeight:900,color:p.titleColor,animation:"glow 3s ease-in-out infinite",lineHeight:1.1,marginBottom:4}}>{p.title}</div>
        <div style={{fontSize:12,color:t.textMid,marginBottom:4,fontFamily:t.font}}>{profile.username}</div>
        <div style={{display:"inline-block",background:`${p.titleColor}20`,border:`1px solid ${p.titleColor}40`,borderRadius:20,padding:"3px 12px",fontSize:11,color:p.titleColor,fontWeight:600,fontFamily:t.font,marginBottom:16}}>{p.archetype}</div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
          {[["WIN",p.winPct+"%",t.win],["DRAW",p.drawPct+"%",t.draw],["LOSS",p.lossPct+"%",t.loss]].map(([l,v,c])=>(
            <div key={l} style={{background:`${c}14`,borderRadius:8,padding:"8px 4px",textAlign:"center"}}>
              <div style={{fontSize:9,color:c,fontWeight:700,letterSpacing:".08em",fontFamily:t.font}}>{l}</div>
              <div style={{fontSize:18,fontWeight:700,color:c,fontFamily:t.headingFont}}>{v}</div>
            </div>
          ))}
        </div>

        <WDLBar wins={p.wins} draws={p.draws} losses={p.losses} t={t}/>

        <div style={{display:"flex",gap:6,marginTop:14,justifyContent:"center",flexWrap:"wrap"}}>
          {[p.speed==="speed"?"⚡ Speed":p.speed==="deep"?"🧠 Deep":"⚔️ Sharp", p.aggression==="high"?"🔥 Aggressive":p.aggression==="mid"?"⚖️ Balanced":"🛡️ Defensive", p.breadth==="explorer"?"🌍 Explorer":p.breadth==="specialist"?"📌 Specialist":"📐 Versatile"].map(tag=>(
            <span key={tag} style={{background:`${p.titleColor}14`,border:`1px solid ${p.titleColor}30`,borderRadius:20,padding:"3px 10px",fontSize:11,color:p.titleColor,fontWeight:600,fontFamily:t.font}}>{tag}</span>
          ))}
        </div>

        <button onClick={share} className="secondary" style={{marginTop:16,width:"100%",fontSize:12}}>
          {copied?"✓ Copied to clipboard!":"📤 Share Card"}
        </button>
      </div>
    </div>
  </div>;
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
          {ratings.map(r=>(
            <div key={r.tc} style={{background:`${t.accent}0e`,border:`1px solid ${t.accent}20`,borderRadius:8,padding:"6px 12px",textAlign:"center",minWidth:64}}>
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
          <div style={{fontSize:12,color:t.text,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.opening.length>28?o.opening.slice(0,26)+"…":o.opening}</div>
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
function InsightsColumn({games,loading,t}) {
  if (loading) return <div style={{display:"flex",flexDirection:"column",gap:10}}>{[...Array(3)].map((_,i)=><Sk key={i} h={70}/>)}</div>;
  if (!games?.length) return <div style={{color:t.textDim,fontSize:13}}>No games loaded.</div>;
  const {bestHour,bestHourWinPct,streak,nemesis}=computeInsights(games);
  const streakC=streak.type==="win"?t.win:streak.type==="loss"?t.loss:t.draw;
  const items=[
    {icon:"🕐",label:"Best time to play",value:bestHour?`You peak at ${bestHour}`:"Not enough data",sub:bestHour?`${bestHourWinPct}% win rate at this hour`:null},
    {icon:"🔥",label:"Hot streak",value:streak.count>1?`${streak.count} ${streak.type}s in a row`:"No current streak",sub:streak.count>1?`Current ${streak.type} streak`:null,color:streak.count>1?streakC:null},
    {icon:"💀",label:"Nemesis opening",value:nemesis?nemesis.opening.slice(0,24):"Not enough data",sub:nemesis?`${nemesis.losses} losses in ${nemesis.games} games`:null,color:t.loss},
  ];
  return <div style={{display:"flex",flexDirection:"column",gap:10}}>
    {items.map(item=>(
      <div key={item.label} style={{background:`${t.accent}06`,border:`1px solid ${t.cardBorder}`,borderRadius:10,padding:"12px 14px",display:"flex",gap:12,alignItems:"flex-start"}}>
        <span style={{fontSize:22,flexShrink:0}}>{item.icon}</span>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:10,color:t.textDim,textTransform:"uppercase",letterSpacing:".07em",marginBottom:3,fontFamily:t.font}}>{item.label}</div>
          <div style={{fontSize:14,fontWeight:600,color:item.color||t.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.value}</div>
          {item.sub&&<div style={{fontSize:11,color:t.textDim,marginTop:2}}>{item.sub}</div>}
        </div>
      </div>
    ))}
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
              <td style={{color:t.text,maxWidth:240,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}><span style={{fontSize:10,color:t.textDim,marginRight:5}}>{o.eco}</span>{o.opening}</td>
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
  const d1=new Set(p1.games.map(g=>g.opening)).size, d2=new Set(p2.games.map(g=>g.opening)).size;
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
function DnaTab({games,stats,loading,t}) {
  const tip=(props)=><ChartTip {...props} t={t}/>;
  if (loading) return <Sk h={300}/>;
  const p=computePersonality(games,stats);
  if (!p) return <div style={{color:t.textDim,textAlign:"center",padding:40,fontSize:14}}>Load a player to reveal their Chess DNA.</div>;
  return <div style={{display:"flex",flexDirection:"column",gap:20}}>
    <TradingCard p={p} profile={{username:""}} t={t}/>
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

// ── Main App ──────────────────────────────────────────────────────────────────
const TABS=[["📊","Overview"],["♟","Openings"],["🎨","Color Stats"],["📈","Elo Breakdown"],["⚔️","Compare"],["🧬","Chess DNA"]];

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

  const load1=async()=>{
    if(!p1In.trim())return;
    setL1(true);setE1(null);setP1(null);
    try{setP1(await loadPlayer(p1In.trim().toLowerCase()));}
    catch(e){setE1(e.message||"Failed to load");}
    finally{setL1(false);}
  };
  const load2=async()=>{
    if(!p2In.trim())return;
    setL2(true);setP2(null);
    try{setP2(await loadPlayer(p2In.trim().toLowerCase()));}
    catch{}finally{setL2(false);}
  };

  const p=p1?computePersonality(p1.games,p1.stats):null;
  const insights=p1?computeInsights(p1.games):null;
  const tip=(props)=><ChartTip {...props} t={t}/>;

  return <div style={{minHeight:"100vh",position:"relative"}}>
    {/* Background */}
    <div style={{position:"fixed",inset:0,zIndex:0,background:t.bg,backgroundImage:`repeating-linear-gradient(135deg,${t.pat} 0,${t.pat} 1px,transparent 1px,transparent 40px)`,pointerEvents:"none"}}/>
    <div style={{position:"fixed",inset:0,zIndex:0,backgroundImage:`repeating-conic-gradient(${t.checker} 0% 25%,transparent 0% 50%)`,backgroundSize:"42px 42px",pointerEvents:"none"}}/>

    <div style={{position:"relative",zIndex:1,maxWidth:960,margin:"0 auto",padding:"0 16px 80px"}}>

      {/* ── Hero section ── */}
      <div style={{textAlign:"center",padding:"60px 0 40px",animation:"fadeInUp .6s ease both"}}>
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
          <ThemePicker current={themeKey} onChange={setThemeKey}/>
        </div>
        <div style={{fontSize:52,marginBottom:12,animation:"float 3s ease-in-out infinite"}}>♟</div>
        <h1 style={{fontFamily:t.headingFont,fontSize:48,fontWeight:900,color:t.accent,letterSpacing:"-.03em",lineHeight:1,animation:"glow 3s ease-in-out infinite"}}>Chess DNA</h1>
        <p style={{fontSize:18,color:t.textMid,marginTop:10,fontFamily:t.font}}>Discover your chess identity</p>

        {/* Search */}
        <div style={{display:"flex",gap:10,maxWidth:520,margin:"28px auto 0",alignItems:"center"}}>
          <div style={{flex:1,position:"relative"}}>
            <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:t.textDim,fontSize:16,pointerEvents:"none"}}>🔍</span>
            <input placeholder="Enter Chess.com username…" value={p1In} onChange={e=>setP1In(e.target.value)} onKeyDown={e=>e.key==="Enter"&&load1()} style={{paddingLeft:42,fontSize:16}}/>
          </div>
          <button className="primary" onClick={load1} disabled={l1||!p1In.trim()}>
            {l1?<span style={{display:"inline-flex",alignItems:"center",gap:8}}><span style={{width:14,height:14,border:`2px solid ${t.btnColor}`,borderTopColor:"transparent",borderRadius:"50%",display:"inline-block",animation:"spin .8s linear infinite"}}/>Analyzing…</span>:"Analyze Player"}
          </button>
        </div>
        {e1&&<div style={{marginTop:12,fontSize:13,color:t.loss}}>⚠ {e1}</div>}
      </div>

      {/* ── Player Hero Card ── */}
      {(p1||l1)&&<div style={{marginBottom:20}}><PlayerHeroCard data={p1} loading={l1} t={t}/></div>}

      {/* ── Stats Dashboard — 3 columns ── */}
      {p1&&!l1&&<div className="three-col" style={{display:"flex",gap:16,marginBottom:20}}>
        {/* Column 1: Opening DNA */}
        <Card t={t} style={{flex:1,minWidth:220}}>
          <SecTitle t={t} sub="Top openings by games played">Opening DNA</SecTitle>
          <OpeningDNA games={p1.games} loading={l1} t={t}/>
        </Card>

        {/* Column 2: Performance Chart */}
        <Card t={t} style={{flex:1,minWidth:220}}>
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
        <Card t={t} style={{flex:1,minWidth:220}}>
          <SecTitle t={t} sub="Based on your recent games">Insights</SecTitle>
          <InsightsColumn games={p1.games} loading={l1} t={t}/>
        </Card>
      </div>}

      {/* ── Tabs ── */}
      {(p1||l1)&&<div style={{background:t.card,border:`1px solid ${t.cardBorder}`,borderRadius:10,padding:6,display:"flex",gap:2,flexWrap:"wrap",marginBottom:14,animation:"fadeInUp .35s ease both"}}>
        {TABS.map(([icon,name],i)=>(
          <button key={name} className={`tab-btn ${tab===i?"active":""}`} onClick={()=>setTab(i)}>{icon} {name}</button>
        ))}
      </div>}

      {/* ── Tab Content ── */}
      {(p1||l1)&&<div key={tab} style={{animation:"fadeInUp .3s ease both"}}>
        {tab===0&&<div style={{display:"flex",flexDirection:"column",gap:16}}>
          {/* Overview: full WDL + big stats */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:10}}>
            {p1&&[["Total Games",p1.games.length,t.accent],["Wins",p1.games.filter(g=>g.result==="win").length,t.win],["Losses",p1.games.filter(g=>g.result==="loss").length,t.loss],["Draws",p1.games.filter(g=>g.result==="draw").length,t.draw]].map(([l,v,c])=>(
              <Card key={l} t={t} style={{padding:"14px 16px",textAlign:"center"}}>
                <div style={{fontSize:10,color:t.textDim,textTransform:"uppercase",letterSpacing:".07em",marginBottom:6,fontFamily:t.font}}>{l}</div>
                <div style={{fontSize:28,fontWeight:700,color:c,fontFamily:t.headingFont}}>{v}</div>
              </Card>
            ))}
          </div>
          {l1&&[...Array(2)].map((_,i)=><Sk key={i} h={80}/>)}
        </div>}
        {tab===1&&<OpeningsTab games={p1?.games} loading={l1} t={t}/>}
        {tab===2&&<ColorTab games={p1?.games} loading={l1} t={t}/>}
        {tab===3&&<EloTab games={p1?.games} stats={p1?.stats} loading={l1} t={t}/>}
        {tab===4&&<CompareTab p1={p1} p2={p2} l1={l1} l2={l2} p2In={p2In} setP2In={setP2In} loadP2={load2} t={t}/>}
        {tab===5&&<div style={{display:"flex",flexDirection:"column",gap:20}}>
          {p1&&<TradingCard p={p} profile={p1.profile} t={t}/>}
          {l1&&<Sk h={300}/>}
          <DnaTab games={p1?.games} stats={p1?.stats} loading={l1} t={t}/>
        </div>}
      </div>}

      {/* ── Empty state ── */}
      {!p1&&!l1&&!e1&&<div style={{textAlign:"center",padding:"40px 0 60px",animation:"fadeInUp .5s .2s ease both"}}>
        <div style={{fontSize:64,opacity:.15,marginBottom:20}}>♜</div>
        <div style={{fontFamily:t.headingFont,fontSize:20,color:t.textMid}}>Enter a username to reveal your Chess DNA</div>
        <div style={{fontSize:13,color:t.textDim,marginTop:8}}>Openings · Color stats · Elo breakdown · Personality · Compare · Trading card</div>
      </div>}

      <div style={{textAlign:"center",marginTop:48,fontSize:11,color:t.textDim}}>Chess DNA · Data from Chess.com Public API · Last 3 months · No data stored</div>
    </div>
  </div>;
}