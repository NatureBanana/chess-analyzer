/* eslint-disable react-hooks/set-state-in-effect, react-hooks/static-components, react-hooks/immutability */
import { useState, useEffect, useRef, useMemo } from "react";
import { resolveOpeningInfo, openingCoverage, ecoFamily, normalizeMovesFromPgn, isGenericOpeningName, lookupOpeningFromMovePrefix } from "./openingResolver.js";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Legend, LineChart, Line, CartesianGrid, ComposedChart,
} from "recharts";

// ── Fonts ─────────────────────────────────────────────────────────────────────
const fl = document.createElement("link");
fl.rel = "stylesheet";
fl.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=DM+Sans:wght@300;400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap";
document.head.appendChild(fl);

// ── Theme ─────────────────────────────────────────────────────────────────────
const THEME = { bg:"#0d1117", card:"linear-gradient(135deg,rgba(20,26,36,.92),rgba(10,14,20,.96))", cardBorder:"rgba(139,148,158,0.15)", accent:"#58a6ff", accent2:"#1f6feb", hl:"#79c0ff", text:"#c9d1d9", textDim:"#4a5568", textMid:"#8b949e", win:"#3fb950", loss:"#f85149", draw:"#6e7681", inputBg:"rgba(20,26,36,.9)", btnGrad:"linear-gradient(135deg,#1f6feb,#58a6ff)", btnColor:"#0d1117", skA:"rgba(88,166,255,.04)", skB:"rgba(88,166,255,.1)", font:"'DM Sans',sans-serif", headingFont:"'Playfair Display',serif", scrollThumb:"#58a6ff28", glowC:"#58a6ff35", glowC2:"#58a6ff70" };

const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
const CHESS_FONT = '"Segoe UI Symbol","Noto Sans Symbols2",serif';
// U+2659/U+265F names don't match how common symbol fonts draw them — swap for visual white/black.
const CHESS_WHITE = "♟";
const CHESS_BLACK = "♙";

// Renders emoji with the system color-emoji font (avoids serif heading fonts swallowing glyphs).
function Ico({children,size,style={}}) {
  return <span className="ico" style={{fontSize:size,lineHeight:1,display:"inline-block",verticalAlign:"-0.1em",...style}}>{children}</span>;
}
function ChessIco({children,size,style={}}) {
  return <span className="chess-ico" style={{fontSize:size,lineHeight:1,display:"inline-block",verticalAlign:"-0.08em",...style}}>{children}</span>;
}
function renderIcon(icon,size=18) {
  if (icon==null) return null;
  if (/^[♙♟♜♛♚♞♝♗♖]$/.test(icon) || icon===CHESS_WHITE || icon===CHESS_BLACK) return <ChessIco size={size}>{icon}</ChessIco>;
  return <Ico size={size}>{icon}</Ico>;
}

function ThemeBg({t}) {
  return <svg style={{position:"fixed",inset:0,width:"100%",height:"100%",zIndex:0,pointerEvents:"none",opacity:.18}} xmlns="http://www.w3.org/2000/svg">
    <defs><pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
      <circle cx="16" cy="16" r=".7" fill={t.accent}/>
    </pattern></defs>
    <rect width="100%" height="100%" fill="url(#grid)"/>
  </svg>;
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
    body { background:${t.bg}; color:${t.text}; font-family:${t.font},${EMOJI_FONT}; scroll-behavior:smooth; line-height:1.35; transition:background .5s ease,color .3s ease; }
    .ico{font-family:${EMOJI_FONT};font-style:normal;font-weight:400}
    .chess-ico{font-family:${CHESS_FONT};font-style:normal;font-weight:400}
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
    @keyframes auroraDrift{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(18px,-14px,0) scale(1.08)}}
    @keyframes strandPulse{0%,100%{transform:translateY(0) scaleY(1);filter:saturate(1)}50%{transform:translateY(-6px) scaleY(1.08);filter:saturate(1.35)}}
    @keyframes softBlink{0%,100%{opacity:.36}50%{opacity:.82}}
    @keyframes ripple{0%{transform:scale(0);opacity:.5}100%{transform:scale(2.5);opacity:0}}
    @keyframes popIn{0%{opacity:0;transform:scale(.7)}60%{transform:scale(1.06)}100%{opacity:1;transform:scale(1)}}
    @keyframes slideUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes winBar{from{transform:scaleX(0)}to{transform:scaleX(1)}}
    @keyframes numberPop{0%{transform:scale(1)}50%{transform:scale(1.08)}100%{transform:scale(1)}}
    @keyframes drawStroke{from{stroke-dashoffset:1400}to{stroke-dashoffset:0}}
    @keyframes helixDrift{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
    @keyframes rungPulse{0%,100%{opacity:.55;transform:scaleY(.92)}50%{opacity:1;transform:scaleY(1.06)}}
    @keyframes timelineDraw{from{height:0}to{height:100%}}
    @keyframes flipIn{0%{opacity:0;transform:perspective(700px) rotateX(-14deg) translateY(16px)}100%{opacity:1;transform:perspective(700px) rotateX(0) translateY(0)}}
    @keyframes gradientShift{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
    @keyframes breathe{0%,100%{transform:scale(1);opacity:.85}50%{transform:scale(1.045);opacity:1}}
    @keyframes orbit{from{transform:rotate(0deg) translateX(11px) rotate(0deg)}to{transform:rotate(360deg) translateX(11px) rotate(-360deg)}}
    @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-3px)}75%{transform:translateX(3px)}}
    @keyframes tickerSlide{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}
    @keyframes driftOrb{0%,100%{transform:translate3d(0,0,0) scale(1)}33%{transform:translate3d(28px,-22px,0) scale(1.12)}66%{transform:translate3d(-18px,14px,0) scale(.94)}}
    @keyframes pieceFloat{0%,100%{transform:translateY(0) rotate(0deg);opacity:.12}50%{transform:translateY(-18px) rotate(8deg);opacity:.28}}
    @keyframes slideUnderline{from{transform:scaleX(0);opacity:0}to{transform:scaleX(1);opacity:1}}
    @keyframes underlineGrow{from{width:0;opacity:0}to{width:48px;opacity:1}}
    @keyframes pulseRing{0%,100%{transform:scale(1);opacity:.55}50%{transform:scale(1.08);opacity:.15}}
    @keyframes shineSweep{0%{transform:translateX(-120%) skewX(-12deg)}100%{transform:translateX(220%) skewX(-12deg)}}
    @keyframes elasticIn{0%{opacity:0;transform:scale(.82)}60%{transform:scale(1.04)}100%{opacity:1;transform:scale(1)}}
    @keyframes blurIn{from{opacity:0;filter:blur(8px);transform:translateY(12px)}to{opacity:1;filter:blur(0);transform:translateY(0)}}
    @keyframes progressShimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
    @keyframes iconBounce{0%,100%{transform:translateY(0)}40%{transform:translateY(-4px)}60%{transform:translateY(-2px)}}
    @keyframes searchPulse{0%,100%{box-shadow:0 0 0 0 ${t.glowC}}50%{box-shadow:0 0 0 4px ${t.glowC},0 4px 20px rgba(0,0,0,.25)}}
    @keyframes emptyFloat{0%,100%{transform:translateY(0) rotate(-6deg)}50%{transform:translateY(-12px) rotate(6deg)}}
    @keyframes tipPop{0%{opacity:0;transform:scale(.92) translateY(4px)}100%{opacity:1;transform:scale(1) translateY(0)}}
    @keyframes staggerFade{from{opacity:0;transform:translateY(16px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
    @keyframes contentSwap{from{opacity:0;transform:translateY(14px) scale(.985);filter:blur(6px)}to{opacity:1;transform:translateY(0) scale(1);filter:blur(0)}}
    @keyframes heroGlow{0%,100%{opacity:.08;transform:translateY(0) rotate(0deg)}50%{opacity:.2;transform:translateY(-14px) rotate(6deg)}}
    @keyframes premiumPulse{0%,100%{transform:scale(1);box-shadow:0 0 0 0 rgba(255,215,0,.4)}50%{transform:scale(1.08);box-shadow:0 0 12px 2px rgba(255,215,0,.35)}}

    /* ── Stagger classes ── */
    .stagger-1{animation:fadeInUp .45s .04s cubic-bezier(.22,1,.36,1) both}
    .stagger-2{animation:fadeInUp .45s .10s cubic-bezier(.22,1,.36,1) both}
    .stagger-3{animation:fadeInUp .45s .16s cubic-bezier(.22,1,.36,1) both}
    .stagger-4{animation:fadeInUp .45s .22s cubic-bezier(.22,1,.36,1) both}
    .stagger-5{animation:fadeInUp .45s .28s cubic-bezier(.22,1,.36,1) both}
    .stagger-6{animation:fadeInUp .45s .34s cubic-bezier(.22,1,.36,1) both}
    .stagger-7{animation:fadeInUp .45s .40s cubic-bezier(.22,1,.36,1) both}
    .stagger-8{animation:fadeInUp .45s .46s cubic-bezier(.22,1,.36,1) both}
    .stagger-9{animation:fadeInUp .45s .52s cubic-bezier(.22,1,.36,1) both}
    .stagger-10{animation:fadeInUp .45s .58s cubic-bezier(.22,1,.36,1) both}
    .stagger-11{animation:fadeInUp .45s .64s cubic-bezier(.22,1,.36,1) both}
    .stagger-12{animation:fadeInUp .45s .70s cubic-bezier(.22,1,.36,1) both}
    .tab-content{animation:contentSwap .42s cubic-bezier(.22,1,.36,1) both}
    .page-transition{transition:opacity .42s cubic-bezier(.22,1,.36,1),transform .42s cubic-bezier(.22,1,.36,1),filter .42s cubic-bezier(.22,1,.36,1)}
    .sec-sub{animation:fadeIn .5s .12s cubic-bezier(.22,1,.36,1) both}
    .insight-card{transition:transform .28s cubic-bezier(.22,1,.36,1),background .28s ease,border-color .28s ease,box-shadow .28s ease}
    .insight-card:hover{transform:translateY(-3px);background:${t.accent}0c!important;border-color:${t.accent}30!important;box-shadow:0 8px 24px rgba(0,0,0,.28)}
    .quick-link{transition:all .24s cubic-bezier(.22,1,.36,1);cursor:pointer;font-family:${t.font}}
    .quick-link:hover{transform:translateY(-3px) scale(1.01);border-color:${t.accent}50!important;box-shadow:0 8px 22px rgba(0,0,0,.28);background:${t.accent}0e!important}
    .quick-link:active{transform:translateY(-1px) scale(.99)}
    .weapon-card{transition:transform .25s cubic-bezier(.22,1,.36,1),border-color .25s ease,box-shadow .25s ease}
    .weapon-card:hover{transform:translateX(4px);box-shadow:0 6px 20px rgba(0,0,0,.22)}
    .hero-float-piece{position:absolute;pointer-events:none;animation:heroGlow 7s ease-in-out infinite;opacity:.1;font-family:${CHESS_FONT}}
    a{transition:color .18s ease,opacity .18s ease}
    a:hover{color:${t.hl}!important;opacity:.92}
    button:focus-visible,input:focus-visible,select:focus-visible,.tab-btn:focus-visible,.quick-link:focus-visible,.filter-pill:focus-visible,.range-pill:focus-visible{outline:2px solid ${t.accent}70;outline-offset:2px}
    tr:hover{transform:translateX(2px)}
    .bar-grow{animation:barGrow .7s cubic-bezier(.22,1,.36,1) both;transform-origin:left}
    .ring-pop{animation:ringPop .45s cubic-bezier(.22,1,.36,1) both}
    .pop-in{animation:popIn .4s cubic-bezier(.22,1,.36,1) both}
    .filter-pill{transition:all .22s cubic-bezier(.22,1,.36,1)}
    .filter-pill:hover{transform:translateY(-2px) scale(1.04)}
    .filter-pill.active{animation:popIn .25s cubic-bezier(.22,1,.36,1) both}
    .opening-row{transition:transform .2s cubic-bezier(.22,1,.36,1),background .2s ease,border-color .2s ease,box-shadow .2s ease}
    .opening-row:hover{transform:translateX(4px);background:${t.accent}10!important;border-color:${t.accent}35!important;box-shadow:0 4px 16px rgba(0,0,0,.25)}
    .stat-pulse:hover .stat-value{animation:numberPop .35s ease}
    .eco-badge{font-size:10px;font-weight:700;letter-spacing:.04em;padding:2px 7px;border-radius:4px;font-family:${t.font}}

    /* ── Skeleton ── */
    .skel{background:linear-gradient(90deg,${t.skA} 25%,${t.skB} 50%,${t.skA} 75%);background-size:200% 100%;animation:shimmerMove 1.6s ease infinite;border-radius:8px}

    /* ── Cards ── */
    .card-hover{transition:transform .38s cubic-bezier(.16,1,.3,1),box-shadow .38s ease,border-color .38s ease,background .38s ease;will-change:transform}
    .card-hover:hover{transform:translateY(-4px) scale(1.006);box-shadow:0 14px 44px rgba(0,0,0,.55),0 0 0 1px ${t.accent}22!important}

    /* ── Tabs ── */
    .tab-btn{background:none;border:1px solid transparent;cursor:pointer;font-family:${t.font};font-size:13px;font-weight:500;padding:8px 15px;border-radius:6px;color:${t.textDim};white-space:normal;line-height:1.15;transition:color .18s cubic-bezier(.4,0,.2,1),background .18s cubic-bezier(.4,0,.2,1),border-color .18s cubic-bezier(.4,0,.2,1),transform .15s ease;position:relative}
    .tab-btn:hover{color:${t.accent};background:${t.accent}10;transform:translateY(-1px)}
    .tab-btn.active{color:${t.accent};background:${t.accent}16;border-color:${t.accent}40;font-weight:600}
    .tab-btn.active::after{content:"";position:absolute;bottom:3px;left:12%;right:12%;height:2px;background:linear-gradient(90deg,transparent,${t.accent},transparent);border-radius:2px;animation:slideUnderline .35s cubic-bezier(.22,1,.36,1) both}
    .tab-btn:active{transform:scale(.97)}
    .range-pill{transition:all .22s cubic-bezier(.22,1,.36,1);cursor:pointer;font-family:${t.font}}
    .range-pill:hover{transform:translateY(-2px) scale(1.05);box-shadow:0 4px 14px rgba(0,0,0,.25)}
    .range-pill.active{animation:elasticIn .3s cubic-bezier(.22,1,.36,1) both}
    .search-wrap:focus-within .search-icon{color:${t.accent}!important}
    .chart-tip-pop{animation:tipPop .22s cubic-bezier(.22,1,.36,1) both}
    .error-shake{animation:shake .45s cubic-bezier(.22,1,.36,1) both}
    .empty-piece{display:inline-block;animation:emptyFloat 4s ease-in-out infinite}
    tr.row-in{animation:staggerFade .35s cubic-bezier(.22,1,.36,1) both}
    .rating-pill{transition:transform .2s cubic-bezier(.22,1,.36,1),box-shadow .2s ease,border-color .2s ease}
    .rating-pill:hover{transform:translateY(-3px) scale(1.04);box-shadow:0 6px 18px rgba(0,0,0,.3);border-color:${t.accent}45!important}

    /* ── Inputs ── */
    input{background:${t.inputBg};border:1px solid ${t.cardBorder};border-radius:10px;color:${t.text};font-family:${t.font};font-size:15px;padding:13px 16px;outline:none;width:100%;transition:border-color .2s cubic-bezier(.4,0,.2,1),box-shadow .2s cubic-bezier(.4,0,.2,1),transform .2s cubic-bezier(.22,1,.36,1)}
    input:focus{border-color:${t.accent}80;box-shadow:0 0 0 3px ${t.glowC},0 2px 12px rgba(0,0,0,.3);transform:translateY(-1px)}
    input::placeholder{color:${t.textDim}80;transition:opacity .2s}
    input:focus::placeholder{opacity:.5}

    /* ── Buttons ── */
    button.primary{background:${t.btnGrad};background-size:200% 100%;border:none;border-radius:10px;color:${t.btnColor};cursor:pointer;font-family:${t.font};font-size:15px;font-weight:700;padding:13px 28px;white-space:normal;line-height:1.15;transition:transform .2s cubic-bezier(.22,1,.36,1),box-shadow .2s ease,opacity .15s ease,background-position .4s ease;position:relative;overflow:hidden}
    button.primary::after{content:"";position:absolute;inset:0;background:rgba(255,255,255,.12);opacity:0;transition:opacity .15s}
    button.primary::before{content:"";position:absolute;inset:0;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.22) 50%,transparent 65%);transform:translateX(-130%);transition:transform .55s cubic-bezier(.4,0,.2,1);pointer-events:none}
    button.primary:hover{background-position:100% 0;transform:translateY(-2px) scale(1.02);box-shadow:0 6px 28px ${t.glowC},0 0 0 1px ${t.accent}30}
    button.primary:hover::before{transform:translateX(130%)}
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
    td{padding:8px 10px;border-bottom:1px solid ${t.cardBorder}35;color:${t.textMid};vertical-align:middle;transition:background .15s;overflow-wrap:anywhere}
    tr{transition:background .18s ease,transform .22s cubic-bezier(.22,1,.36,1)}
    tr:hover td{background:${t.skA}}

    /* ── Badges ── */
    .badge{display:inline-flex;align-items:center;border-radius:4px;font-size:11px;font-weight:700;padding:2px 9px;letter-spacing:.03em;transition:transform .15s,box-shadow .15s}
    .badge:hover{transform:scale(1.05)}
    .badge.green{background:${t.win}18;color:${t.win};border:1px solid ${t.win}40}
    .badge.yellow{background:rgba(255,200,0,.1);color:#ffc800;border:1px solid rgba(255,200,0,.3)}
    .badge.red{background:${t.loss}18;color:${t.loss};border:1px solid ${t.loss}40}

    /* ── Misc ── */
    .fi{animation:fadeInUp .4s cubic-bezier(.22,1,.36,1) both}
    .flip-in{animation:flipIn .55s cubic-bezier(.22,1,.36,1) both}
    .rival-row{transition:transform .2s cubic-bezier(.22,1,.36,1),background .2s ease}
    .rival-row:hover{transform:translateX(4px);background:${t.accent}0c!important}
    .dim-card{transition:transform .3s cubic-bezier(.16,1,.3,1),box-shadow .3s ease,border-color .3s ease}
    .dim-card:hover{transform:translateY(-4px);box-shadow:0 12px 38px rgba(0,0,0,.5)}
    .cheat-row{transition:background .2s ease,transform .2s ease}
    .cheat-row:hover{background:${t.accent}10;transform:translateX(3px)}
    .tab-strip{display:flex;gap:2;flex-wrap:wrap}
    * {-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
    ::selection{background:${t.accent}30;color:${t.text}}

    /* ── Responsive ── */
    @media(max-width:900px){
      .two-col-900{flex-direction:column!important}
      .grid-2-900{grid-template-columns:1fr!important}
    }
    @media(max-width:700px){
      .hide-mobile{display:none!important}
      .tab-strip{flex-wrap:nowrap;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}
      .tab-strip::-webkit-scrollbar{display:none}
      .tab-btn{white-space:nowrap;flex-shrink:0}
      .card-pad-sm{padding:16px!important}
    }
    @media(max-width:480px){
      .hero-emoji{font-size:54px!important}
      .hero-pad{padding:44px 0 30px!important}
      .card-pad-sm{padding:13px!important}
      button.primary{width:100%}
      .stat-grid{grid-template-columns:repeat(2,1fr)!important}
    }
    @media(prefers-reduced-motion:reduce){
      *,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}
    }
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

function openingLink(opening, openingUrl) {
  if (openingUrl) return openingUrl;
  return `https://www.chess.com/openings/${opening.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}`;
}

function uniqueNamedOpenings(games) {
  return new Set(games.filter(g=>g.opening).map(g=>g.opening)).size;
}

const ECO_COLORS = { A:"#58a6ff", B:"#3fb950", C:"#ffd700", D:"#a78bfa", E:"#ff7b72" };
function ecoBadgeStyle(family, t) {
  const c = ECO_COLORS[family] || t.textDim;
  return { background:`${c}18`, color:c, border:`1px solid ${c}35` };
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

// Extract full-move count and White's first move from PGN movetext
function parseMovetextMeta(pgn) {
  if (!pgn) return { moveCount:null, firstMove:null };
  const idx = pgn.lastIndexOf("]");
  const movetext = idx >= 0 ? pgn.slice(idx + 1) : pgn;
  let moveCount = null;
  for (const m of movetext.matchAll(/(\d+)\.(?!\.)/g)) {
    const n = parseInt(m[1], 10);
    if (!Number.isNaN(n) && (moveCount === null || n > moveCount)) moveCount = n;
  }
  const fm = movetext.match(/\b1\.\s*(?:\{[^}]*\}\s*)?([A-Za-z][a-zA-Z0-9+#=-]*)/);
  return { moveCount, firstMove: fm ? fm[1] : null };
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
  const myEloRaw = side?.rating ?? (color==="white" ? tags.WhiteElo : tags.BlackElo);
  const myElo = myEloRaw ? parseInt(myEloRaw, 10) : null;
  const timeControl = normalizeTimeClass(game.time_class, game.time_control || tags.TimeControl);
  const dateStr = formatDateFromTimestamp(game.end_time) || tags.EndDate || tags.UTCDate || tags.Date;
  const openingInfo = resolveOpeningInfo(tags, pgn);
  const { moveCount, firstMove } = parseMovetextMeta(pgn);
  const moveParts = pgn ? normalizeMovesFromPgn(pgn).split(/\s+/).filter(Boolean) : [];
  const movePrefix = moveParts.length >= 2 ? moveParts.slice(0, 6).join(" ") : null;
  return { ...openingInfo, openingSource:openingInfo.source, color, result, oppElo:(!oppElo||isNaN(oppElo))?null:oppElo, myElo:(!myElo||isNaN(myElo))?null:myElo, timeControl, date:dateStr, endTime:game.end_time||0, opponent:color==="white"?b:w, moveCount, firstMove, movePrefix };
}

function parsePGN(pgn, user) {
  if (!pgn || pgn.length < 10) return [];
  return pgn.split(/\r?\n\r?\n(?=\[)/).filter(g => g.includes("[White ") && g.includes("[Black ")).map(g => parsePGNGame(g, user)).filter(Boolean);
}

function normalizeArchiveGame(game, user) {
  if (!game) return null;
  if (typeof game.pgn === "string" && game.pgn.trim().length > 0) return parsePGNGame(game.pgn, user, game);
  if (game.white?.username && game.black?.username) {
    const tags = {};
    if (game.eco) tags.ECO = game.eco;
    if (game.opening) tags.Opening = game.opening;
    const openingInfo = resolveOpeningInfo(tags, "");
    const w = game.white.username, b = game.black.username;
    const userLower = user.toLowerCase();
    const color = w.toLowerCase() === userLower ? "white" : b.toLowerCase() === userLower ? "black" : null;
    if (!color) return null;
    const side = color === "white" ? game.white : game.black;
    const result = resultFromArchive(game.result || tags.Result, side?.result, color);
    const opp = color === "white" ? game.black : game.white;
    const oppEloRaw = opp?.rating;
    const oppElo = oppEloRaw ? parseInt(oppEloRaw, 10) : null;
    const myEloRaw = side?.rating;
    const myElo = myEloRaw ? parseInt(myEloRaw, 10) : null;
    return {
      ...openingInfo,
      openingSource: openingInfo.source,
      color, result,
      oppElo: (!oppElo || isNaN(oppElo)) ? null : oppElo,
      myElo: (!myElo || isNaN(myElo)) ? null : myElo,
      timeControl: normalizeTimeClass(game.time_class, game.time_control),
      date: formatDateFromTimestamp(game.end_time),
      endTime: game.end_time || 0,
      opponent: color === "white" ? b : w,
      moveCount: null, firstMove: null, movePrefix: null,
    };
  }
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

function getAllRatings(stats) {
  return ["rapid","blitz","bullet","daily"].map(tc=>({tc,...getRating(stats,tc)})).filter(r=>r.last);
}

function primaryRating(stats) {
  const ratings = getAllRatings(stats);
  return ratings.sort((a,b)=>b.last-a.last)[0]?.last || 0;
}

const RANGE_LABELS = {3:"3 months",6:"6 months",12:"1 year",0:"all time"};
function rangeLabel(months) { return RANGE_LABELS[months] ?? `${months} months`; }

function gameOpeningKey(g) {
  if (g.opening && !isGenericOpeningName(g.opening)) return g.opening;
  if (g.movePrefix) {
    const inferred = lookupOpeningFromMovePrefix(g.movePrefix);
    if (inferred?.opening) return inferred.opening;
  }
  return null;
}

function aggOpenings(games, tc="all") {
  const f = tc==="all" ? games : games.filter(g=>g.timeControl===tc);
  const map = {};
  for (const g of f) {
    const k = gameOpeningKey(g);
    if (!k) continue;
    if (!map[k]) map[k]={opening:k,openingUrl:g.openingUrl||null,eco:g.eco||"?",ecoFamily:g.ecoFamily||ecoFamily(g.eco),games:0,wins:0,losses:0,draws:0,elos:[]};
    if (!map[k].openingUrl && g.openingUrl) map[k].openingUrl = g.openingUrl;
    if (map[k].eco === "?" && g.eco && g.eco !== "?") map[k].eco = g.eco;
    if (!map[k].ecoFamily && g.ecoFamily) map[k].ecoFamily = g.ecoFamily;
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

// Longest win/loss streaks across the loaded range (games arrive newest-first)
function streakRecords(games) {
  let bestWin=0, bestLoss=0, cw=0, cl=0;
  for (let i=games.length-1;i>=0;i--) {
    const r=games[i].result;
    if (r==="win"){cw++;cl=0;} else if (r==="loss"){cl++;cw=0;} else {cw=0;cl=0;}
    if (cw>bestWin)bestWin=cw;
    if (cl>bestLoss)bestLoss=cl;
  }
  return {bestWin,bestLoss};
}

// Win% by local time-of-day block (uses game end timestamps)
const HOUR_BLOCKS=[["🌅","Morning",5,12],["☀","Afternoon",12,17],["🌇","Evening",17,22],["🌙","Night",22,5]];
function hourBlockLabel(d) {
  const h=d.getHours();
  for (const [,label,from,to] of HOUR_BLOCKS) {
    if (from<to ? (h>=from&&h<to) : (h>=from||h<to)) return label;
  }
  return "Night";
}
function timeOfDayStats(games) {
  const m={};
  for (const g of games) {
    if (!g.endTime) continue;
    const label=hourBlockLabel(new Date(g.endTime*1000));
    if (!m[label]) m[label]={label,games:0,wins:0,losses:0,draws:0};
    m[label].games++;
    if (g.result==="win")m[label].wins++; else if (g.result==="loss")m[label].losses++; else m[label].draws++;
  }
  return HOUR_BLOCKS.filter(([,label])=>m[label]).map(([icon,label])=>({icon,...m[label],winPct:percent(m[label].wins,m[label].games)}));
}

// Tilt: how does the very next game (same session, <3h gap) go after a loss vs after a win?
function tiltStats(games) {
  const seq=[...games].filter(g=>g.endTime).sort((a,b)=>a.endTime-b.endTime);
  const afterLoss={w:0,t:0}, afterWin={w:0,t:0};
  for (let i=1;i<seq.length;i++) {
    if (seq[i].endTime-seq[i-1].endTime>3*3600) continue;
    const prev=seq[i-1].result;
    if (prev==="loss") { afterLoss.t++; if (seq[i].result==="win") afterLoss.w++; }
    else if (prev==="win") { afterWin.t++; if (seq[i].result==="win") afterWin.w++; }
  }
  if (afterLoss.t<8 || afterWin.t<8) return null;
  const afterLossPct=percent(afterLoss.w,afterLoss.t), afterWinPct=percent(afterWin.w,afterWin.t);
  return { afterLossPct, afterWinPct, afterLossGames:afterLoss.t, afterWinGames:afterWin.t, tilt:afterWinPct-afterLossPct };
}

// Per-month volume + win% + avg opponent for the loaded range
function monthlyTrend(games) {
  const m={};
  for (const g of games) {
    if (!g.date || g.date==="?") continue;
    const key=g.date.slice(0,7);
    if (!m[key]) m[key]={month:key,games:0,wins:0,elos:[]};
    m[key].games++; if (g.result==="win")m[key].wins++;
    if (g.oppElo) m[key].elos.push(g.oppElo);
  }
  return Object.values(m).sort((a,b)=>a.month<b.month?-1:1)
    .map(e=>({month:e.month.replace(".","/"),games:e.games,winPct:percent(e.wins,e.games),avgOpp:e.elos.length?Math.round(avg(e.elos)):null}));
}

// White's first move distribution: your choices as White, your results facing each as Black
function firstMoveStats(games) {
  const asWhite={}, asBlack={};
  for (const g of games) {
    if (!g.firstMove) continue;
    const tgt=g.color==="white"?asWhite:asBlack;
    if (!tgt[g.firstMove]) tgt[g.firstMove]={move:g.firstMove,games:0,wins:0};
    tgt[g.firstMove].games++; if (g.result==="win")tgt[g.firstMove].wins++;
  }
  const fmt=m=>Object.values(m).map(e=>({...e,winPct:percent(e.wins,e.games)})).sort((a,b)=>b.games-a.games);
  return {asWhite:fmt(asWhite),asBlack:fmt(asBlack)};
}

// Move-count derived stats (only games where PGN movetext was available)
function gameLengthStats(games) {
  const withMoves=games.filter(g=>g.moveCount&&g.moveCount>1);
  if (withMoves.length<10) return null;
  const avgMoves=Math.round(avg(withMoves.map(g=>g.moveCount)));
  const quickWins=withMoves.filter(g=>g.result==="win"&&g.moveCount<=20).length;
  const marathons=withMoves.filter(g=>g.moveCount>=60).length;
  const longest=withMoves.reduce((a,b)=>b.moveCount>(a?.moveCount||0)?b:a,null);
  const short=withMoves.filter(g=>g.moveCount<=20), long=withMoves.filter(g=>g.moveCount>=40);
  return {
    avgMoves, quickWins, marathons, longest, sample:withMoves.length,
    shortWinPct:short.length>=8?percent(short.filter(g=>g.result==="win").length,short.length):null,
    shortGames:short.length,
    longWinPct:long.length>=8?percent(long.filter(g=>g.result==="win").length,long.length):null,
    longGames:long.length,
  };
}

// Wins against opponents rated meaningfully above you in that game
function biggestUpsets(games, limit=5) {
  return games.filter(g=>g.result==="win"&&g.oppElo&&g.myElo&&g.oppElo>g.myElo+50)
    .map(g=>({...g,diff:g.oppElo-g.myElo}))
    .sort((a,b)=>b.diff-a.diff).slice(0,limit);
}

function davidGoliath(games) {
  const rated=games.filter(g=>g.oppElo&&g.myElo);
  const f=g=>g.length?{games:g.length,winPct:percent(g.filter(x=>x.result==="win").length,g.length)}:null;
  return {
    up:f(rated.filter(g=>g.oppElo>=g.myElo+50)),
    even:f(rated.filter(g=>Math.abs(g.oppElo-g.myElo)<50)),
    down:f(rated.filter(g=>g.oppElo<=g.myElo-50)),
  };
}

function computeInsights(games) {
  const total = games.length;
  if (!total) return [];
  const draws = games.filter(g=>g.result==="draw").length;
  const openings = aggOpenings(games);
  const streak = computeStreak(games);
  const all = [];

  // 1. Current streak (always reliable)
  if (streak.count >= 2) {
    const sc = streak.type==="win"?"#3fb950":streak.type==="loss"?"#f85149":"#6e7681";
    all.push({ id:"streak", icon:streak.type==="win"?"🔥":streak.type==="loss"?"❄":"➖", label:"Current streak",
      value:`${streak.count} ${streak.type}s in a row`, sub:`Active ${streak.type} streak`, color:sc,
      detail:`You're on a ${streak.count}-game ${streak.type} streak. ${streak.type==="win"&&streak.count>=5?"You're on fire — capitalize on this momentum.":streak.type==="win"?"Keep it going!":streak.type==="loss"&&streak.count>=4?"Consider a short break and come back fresh.":"These things happen — shake it off."}`,
      score: streak.type==="win"?streak.count*14:streak.type==="loss"?streak.count*9:2 });
  }

  const baseline = { winPct: percent(games.filter(g=>g.result==="win").length, total), lossPct: percent(games.filter(g=>g.result==="loss").length, total) };
  const minOpening = adaptiveMinGames(total, 8, 0.05);

  // 2. Tough opening line — loss rate beats baseline with enough games
  const nemesis = openings
    .map(o => segmentWeakness(o, baseline, minOpening, "loss"))
    .filter(Boolean)
    .sort((a,b) => b.score - a.score)[0];
  if (nemesis) {
    const openingLabel = nemesis.opening.length > 26 ? nemesis.opening.slice(0, 24) + "…" : nemesis.opening;
    const delta = nemesis.lossPct - baseline.lossPct;
    all.push({ id:"nemesis", icon:"💀", label:"Tough opening line",
      value: openingLabel,
      sub: formatRateSummary(nemesis, "loss", total),
      color:"#f85149",
      detail:`${nemesis.opening} runs ${delta}pp worse than your ${baseline.lossPct}% overall loss rate (${nemesis.confidence} confidence, ${nemesis.games} games). ${nemesis.eco!=="?"?`ECO: ${nemesis.eco}. `:""}${nemesis.games >= 12 && nemesis.lossPct > 55 ? "Worth studying or sidestepping." : "Keep tracking — more games will confirm if this is a real leak."}`,
      score: nemesis.score });
  }

  // 3. Signature opening — win rate beats baseline with enough games
  const signature = openings
    .map(o => segmentStrength(o, baseline, minOpening))
    .filter(Boolean)
    .sort((a,b) => b.score - a.score)[0];
  if (signature) {
    const openingLabel = signature.opening.length > 26 ? signature.opening.slice(0, 24) + "…" : signature.opening;
    const delta = signature.winPct - baseline.winPct;
    all.push({ id:"signature", icon:"⭐", label:"Signature opening",
      value: openingLabel,
      sub: formatRateSummary(signature, "win", total),
      color:"#f8c840",
      detail:`${signature.opening} runs ${delta}pp above your ${baseline.winPct}% overall win rate (${signature.confidence} confidence, ${signature.games} games). ${signature.winPct >= 60 && signature.games >= 12 ? "A reliable weapon — keep it in rotation." : "Promising line — more reps will tell if it's a true strength."} Avg opponent: ${signature.avgOpp || "unknown"}.`,
      score: signature.score });
  }

  // 4. Color gap — always in PGN (White/Black tags)
  const wGames=games.filter(g=>g.color==="white"), bGames=games.filter(g=>g.color==="black");
  const wWp=wGames.length?Math.round(wGames.filter(g=>g.result==="win").length/wGames.length*100):0;
  const bWp=bGames.length?Math.round(bGames.filter(g=>g.result==="win").length/bGames.length*100):0;
  const colorDiff=Math.abs(wWp-bWp);
  if (colorDiff>=10 && Math.min(wGames.length,bGames.length)>=8) {
    const better=wWp>bWp?"White":"Black", betterWp=Math.max(wWp,bWp), worseWp=Math.min(wWp,bWp);
    all.push({ id:"color_gap", icon:better==="White"?CHESS_WHITE:CHESS_BLACK, label:"Color advantage",
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
    all.push({ id:"tc_gap", icon:"⏱", label:"Time control edge",
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
    all.push({ id:"draw_low", icon:"⚔", label:"No draws — ever",
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
    all.push({ id:"explorer", icon:"🗺", label:"Opening explorer",
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
      all.push({ id:"challenger", icon:"🏔", label:"Seeks stronger opponents",
        value:`${Math.round(pctHigh*100)}% of games vs higher-rated`,
        sub:`${wpHighOpp}% win rate against them`, color:"#a78bfa",
        detail:`${Math.round(pctHigh*100)}% of your games are against opponents rated 100+ above your average. You're actively seeking harder competition — and winning ${wpHighOpp}% of those. ${wpHighOpp>=40?"Impressive — you're learning fast.":"Tough road but the fastest way to improve."}`,
        score:pctHigh*80+wpHighOpp*0.5 });
    }
  }

  return [...all].sort((a,b)=>b.score-a.score).slice(0,3);
}

const clamp = (n,min=0,max=100) => Math.max(min, Math.min(max, n));
const percent = (part,total) => total ? Math.round(part / total * 100) : 0;
const avg = nums => nums.length ? nums.reduce((a,b)=>a+b,0) / nums.length : 0;
function hashString(str) {
  let h = 2166136261;
  for (let i=0;i<str.length;i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function computePersonality(games, stats, profile={}) {
  if (!games?.length) return null;
  const total=games.length, wins=games.filter(g=>g.result==="win").length, losses=games.filter(g=>g.result==="loss").length, draws=games.filter(g=>g.result==="draw").length;
  const winPct=percent(wins,total), drawPct=percent(draws,total), lossPct=percent(losses,total);
  const decisivePct=percent(wins+losses,total);
  const tcCounts={}; games.forEach(g=>{tcCounts[g.timeControl]=(tcCounts[g.timeControl]||0)+1;});
  const timeMix=["bullet","blitz","rapid","daily","other"].map(tc=>({tc,count:tcCounts[tc]||0,pct:percent(tcCounts[tc]||0,total)})).filter(d=>d.count);
  const favTC=timeMix.sort((a,b)=>b.count-a.count)[0]?.tc||"blitz";
  const uniqueOpenings=uniqueNamedOpenings(games);
  const openings=aggOpenings(games);
  const bestOpening=openings.filter(o=>o.games>=3).sort((a,b)=>b.winPct-a.winPct || b.games-a.games)[0];
  const colors=colorStats(games);
  const whitePct=percent(colors.white.wins,colors.white.total);
  const blackPct=percent(colors.black.wins,colors.black.total);
  const colorGap=Math.abs(whitePct-blackPct);
  const elos=games.filter(g=>g.oppElo).map(g=>g.oppElo);
  const avgOpp=elos.length?Math.round(avg(elos)):null;
  const bestWinGame=games.filter(g=>g.result==="win"&&g.oppElo).sort((a,b)=>b.oppElo-a.oppElo)[0];
  const upsetWins=avgOpp?games.filter(g=>g.result==="win"&&g.oppElo&&g.oppElo>=avgOpp+150).length:0;
  const recent=games.slice(0,Math.min(20,total));
  const recentWinPct=percent(recent.filter(g=>g.result==="win").length,recent.length);
  const byDate={};
  games.forEach(g=>{if(g.date&&g.date!=="?"){if(!byDate[g.date])byDate[g.date]={w:0,t:0};byDate[g.date].t++;if(g.result==="win")byDate[g.date].w++;}});
  const dayWps=Object.values(byDate).filter(d=>d.t>=3).map(d=>percent(d.w,d.t));
  const variance=dayWps.length>=3?Math.sqrt(avg(dayWps.map(v=>(v-avg(dayWps))**2))):null;
  const consistencyScore=variance===null?clamp(70-Math.abs(recentWinPct-winPct)*1.6):clamp(100-variance*2.1);
  const speedScore=clamp((tcCounts.bullet||0)/total*100 + (tcCounts.blitz||0)/total*68 + (tcCounts.rapid||0)/total*38 + (tcCounts.daily||0)/total*20);
  const breadthScore=clamp(uniqueOpenings>=45?96:uniqueOpenings>=30?82:uniqueOpenings>=18?64:uniqueOpenings>=8?44:24);
  const pressureScore=clamp(winPct*.82 + decisivePct*.28 + percent(upsetWins,total)*1.6 + (recentWinPct-winPct)*.35);
  const resilienceScore=clamp(drawPct*1.7 + (bestWinGame&&avgOpp?clamp((bestWinGame.oppElo-avgOpp)/3):0) + (computeStreak(games).type==="loss"?0:18));
  const balanceScore=clamp(100-colorGap*3);
  const ratingScore=clamp(primaryRating(stats)/25);
  const axes=[
    {subject:"Pressure",value:Math.round(pressureScore)},
    {subject:"Tempo",value:Math.round(speedScore)},
    {subject:"Breadth",value:Math.round(breadthScore)},
    {subject:"Resilience",value:Math.round(resilienceScore)},
    {subject:"Consistency",value:Math.round(consistencyScore)},
    {subject:"Color Balance",value:Math.round(balanceScore)},
    {subject:"Rating Signal",value:Math.round(ratingScore)},
  ];
  const dimensions=[
    {key:"pressure",label:"Pressure",value:Math.round(pressureScore),detail:`${winPct}% wins · ${decisivePct}% decisive`},
    {key:"tempo",label:"Tempo",value:Math.round(speedScore),detail:`${favTC} is ${timeMix[0]?.pct||0}% of loaded games`},
    {key:"breadth",label:"Opening Breadth",value:Math.round(breadthScore),detail:`${uniqueOpenings} named openings`},
    {key:"resilience",label:"Resilience",value:Math.round(resilienceScore),detail:bestWinGame&&avgOpp?`Best win ${bestWinGame.oppElo} vs ${avgOpp} avg opp`:`${drawPct}% draw rate`},
    {key:"consistency",label:"Consistency",value:Math.round(consistencyScore),detail:variance===null?`${recentWinPct}% in last ${recent.length}`:`${Math.round(variance)}% session variance`},
    {key:"balance",label:"Color Balance",value:Math.round(balanceScore),detail:`White ${whitePct}% · Black ${blackPct}%`},
    {key:"rating",label:"Rating Signal",value:Math.round(ratingScore),detail:primaryRating(stats)?`${primaryRating(stats)} top current rating`:"No current rating"},
  ].sort((a,b)=>b.value-a.value);
  const signatureSeed = `${profile.username||""}|${total}|${wins}|${draws}|${losses}|${favTC}|${uniqueOpenings}|${avgOpp||0}|${bestOpening?.opening||""}`;
  const sigHash = hashString(signatureSeed);
  const colorsPalette=["#ffdd00","#fb923c","#39ffa0","#67e8f9","#a78bfa","#f87171","#34d399","#60a5fa"];
  const titleColor=colorsPalette[sigHash%colorsPalette.length];
  const tempoWord={bullet:"Lightning",blitz:"Tactical",rapid:"Strategic",daily:"Correspondence",other:"Adaptive"}[favTC]||"Adaptive";
  const breadthWord=breadthScore>=80?"Cartographer":breadthScore>=60?"Navigator":breadthScore>=42?"Specialist":"Minimalist";
  const pressureWord=pressureScore>=72?"Storm":pressureScore>=58?"Striker":pressureScore>=44?"Fighter":"Builder";
  const title = `${tempoWord} ${breadthWord}`;
  const archetype = `${pressureWord} · ${dimensions[0].label}`;
  const icon = favTC==="bullet"?"⚡":favTC==="blitz"?"⚔":favTC==="daily"?"♜":breadthScore>=75?"🗺":pressureScore>=70?"🌩":"🧬";
  const speed=favTC==="bullet"?"speed":favTC==="blitz"?"sharp":"deep";
  const aggression=pressureScore>=62?"high":pressureScore>=44?"mid":"low";
  const breadth=breadthScore>=68?"explorer":breadthScore>=42?"balanced":"specialist";
  const dnaCode = `${favTC.slice(0,2).toUpperCase()}-${winPct}-${uniqueOpenings}-${(sigHash%4096).toString(16).toUpperCase().padStart(3,"0")}`;
  const strandBase=[
    ["Win %",winPct],["Draw %",drawPct],["Loss %",lossPct],["Tempo",speedScore],["Breadth",breadthScore],["Pressure",pressureScore],
    ["Consistency",consistencyScore],["Color balance",balanceScore],["Rating",ratingScore],["White win %",whitePct],["Black win %",blackPct],["Upset rate",percent(upsetWins,total)],
  ];
  const dnaSegments=strandBase.map(([label,v],i)=>({label,value:Math.round(clamp(v)),tone:colorsPalette[(sigHash+i)%colorsPalette.length]}));
  const traitChips=dimensions.slice(0,4).map(d=>`${d.label} ${d.value}`);
  const desc=`Inferred from ${total} loaded archive games: ${favTC} leads the time mix, ${uniqueOpenings} named openings shape the repertoire, and the top DNA signal is ${dimensions[0].label.toLowerCase()}.`;
  return { title, icon, titleColor, archetype, desc, winPct, drawPct, lossPct, favTC, uniqueOpenings, avgOpp, bestWin:bestWinGame?.oppElo||null, streak:computeStreak(games), total, wins, losses, draws, breadth, speed, aggression, bestOpening, axes, dimensions, dnaCode, dnaSegments, traitChips, timeMix, recentWinPct, whitePct, blackPct, colorGap, upsetWins };
}

// ── DNA dimension metadata ────────────────────────────────────────────────────
const DIMENSION_META = {
  pressure:    { icon:"🌩", what:"How often you convert games into full points and punch above your rating.", high:"You force errors and finish games — keep sharpening tactics to feed this.", low:"Look for one more active plan per game; passive equality is leaving points behind." },
  tempo:       { icon:"⚡",  what:"How fast the formats you choose are — bullet and blitz push this up.", high:"You thrive on the clock. Practice premove discipline and flag-proof endings.", low:"You prefer thinking time. That's a real strength — protect it by avoiding tilt-queueing blitz." },
  breadth:     { icon:"🗺", what:"How wide your opening repertoire runs across loaded games.", high:"Hard to prepare against. Make sure your best lines still get enough reps.", low:"Narrow and deep. Opponents who prep your pet lines are your main risk." },
  resilience:  { icon:"🛡", what:"Holding draws, beating stronger players, and not spiralling after setbacks.", high:"You save bad positions. That half-point habit compounds over a season.", low:"When a game turns, it tends to stay turned. Practice defending worse-but-holdable endings." },
  consistency: { icon:"📐", what:"How stable your session-to-session win rate is.", high:"Your floor is high — ratings climb fastest on a stable base.", low:"Big swing sessions. Track when you play well and protect those hours." },
  balance:     { icon:"⚖", what:"How close your White and Black scores are.", high:"No exploitable color gap — pairings can't tilt the odds against you.", low:"One color is carrying you. Patch the weaker color's first 10 moves." },
  rating:      { icon:"📈", what:"Signal from your official Chess.com ratings.", high:"Strong established rating across formats.", low:"Ratings still developing — every other dimension shows where the growth is." },
};
function dimensionTier(v) {
  if (v>=80) return {tier:"Elite",color:"#39ffa0"};
  if (v>=62) return {tier:"Strong",color:"#67e8f9"};
  if (v>=42) return {tier:"Developing",color:"#ffc800"};
  return {tier:"Emerging",color:"#fb923c"};
}

// Compare oldest half vs newest half of loaded games per dimension
function dnaEvolution(games, stats, profile) {
  if (!games || games.length<40) return null;
  const half=Math.floor(games.length/2);
  const pNew=computePersonality(games.slice(0,half),stats,profile);
  const pOld=computePersonality(games.slice(half),stats,profile);
  if (!pNew||!pOld) return null;
  return pNew.dimensions.map(d=>{
    const od=pOld.dimensions.find(x=>x.key===d.key);
    return {key:d.key,label:d.label,now:d.value,before:od?od.value:d.value,delta:od?d.value-od.value:0};
  }).sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta));
}

function worstByWinPct(items, minGames=4) {
  return [...items].filter(x=>x.games>=minGames).sort((a,b)=>a.winPct-b.winPct || b.games-a.games)[0] || null;
}

function weaknessLevel(winPct) {
  if (winPct < 35) return "Attack immediately";
  if (winPct < 45) return "Pressure often";
  if (winPct < 52) return "Test this";
  return "Secondary target";
}

// ── Win plan statistics (sample-size aware) ───────────────────────────────────
function adaptiveMinGames(total, floor, pct = 0.05) {
  return Math.max(floor, Math.ceil(total * pct));
}

function shrunkRate(wins, games, priorPct, priorWeight = 8) {
  if (!games) return priorPct;
  const priorWins = (priorPct / 100) * priorWeight;
  return percent(wins + priorWins, games + priorWeight);
}

function confidenceTierFor(n, deltaAbs) {
  if (n >= 20 && deltaAbs >= 12) return { tier: "High", level: 3, color: "#39ffa0" };
  if (n >= 12 && deltaAbs >= 8) return { tier: "Medium", level: 2, color: "#ffc800" };
  if (n >= 8 && deltaAbs >= 6) return { tier: "Low", level: 1, color: "#67e8f9" };
  return { tier: "Insufficient", level: 0, color: "#6e7681" };
}

function segmentWeakness(segment, baseline, minGames, mode = "loss") {
  const n = segment.games;
  if (n < minGames) return null;
  const segRate = mode === "loss" ? segment.lossPct : segment.winPct;
  const baseRate = mode === "loss" ? baseline.lossPct : baseline.winPct;
  const delta = mode === "loss" ? segRate - baseRate : baseRate - segRate;
  if (delta < 6) return null;
  const conf = confidenceTierFor(n, Math.abs(delta));
  if (conf.level === 0) return null;
  const rawWins = segment.wins ?? Math.round(segRate * n / 100);
  const shrunk = shrunkRate(rawWins, n, baseRate);
  return {
    ...segment,
    delta,
    confidence: conf.tier,
    confidenceLevel: conf.level,
    confidenceColor: conf.color,
    shrunkRate: shrunk,
    score: delta * Math.sqrt(n) * (0.45 + conf.level * 0.28),
  };
}

function segmentStrength(segment, baseline, minGames) {
  const n = segment.games;
  if (n < minGames) return null;
  const segRate = segment.winPct;
  const baseRate = baseline.winPct;
  const delta = segRate - baseRate;
  if (delta < 6) return null;
  const conf = confidenceTierFor(n, Math.abs(delta));
  if (conf.level === 0) return null;
  const shrunk = shrunkRate(segment.wins ?? Math.round(segRate * n / 100), n, baseRate);
  return {
    ...segment,
    delta,
    confidence: conf.tier,
    confidenceLevel: conf.level,
    confidenceColor: conf.color,
    shrunkRate: shrunk,
    score: delta * Math.sqrt(n) * (0.45 + conf.level * 0.28),
  };
}

function formatRecord(wins, losses, draws) {
  const parts = [];
  if (wins) parts.push(`${wins}W`);
  if (losses) parts.push(`${losses}L`);
  if (draws) parts.push(`${draws}D`);
  return parts.length ? parts.join(" · ") : "0W";
}

function formatRateSummary(segment, mode = "win", archiveGames) {
  const { wins = 0, losses = 0, draws = 0, games } = segment;
  const record = formatRecord(wins, losses, draws);
  const minG = archiveGames ? adaptiveMinGames(archiveGames, 8, 0.05) : 8;
  if (games < minG) {
    return `${record} in ${games} ${games === 1 ? "game" : "games"} — small sample`;
  }
  const pct = mode === "loss" ? percent(losses, games) : percent(wins, games);
  const rateLabel = mode === "loss" ? "loss rate" : "win rate";
  return `${pct}% ${rateLabel} (${record} in ${games})`;
}

function formatRateValue(segment, mode = "win", archiveGames) {
  const { wins = 0, losses = 0, games } = segment;
  const minG = archiveGames ? adaptiveMinGames(archiveGames, 8, 0.05) : 8;
  if (games < minG) {
    return formatRecord(wins, losses, segment.draws || 0);
  }
  const pct = mode === "loss" ? percent(losses, games) : percent(wins, games);
  return `${pct}%`;
}

function aggregateSequences(games) {
  const m = {};
  for (const g of games) {
    if (!g.movePrefix) continue;
    const parts = g.movePrefix.split(" ");
    if (parts.length < 3) continue;
    const key = parts.slice(0, 4).join(" ");
    if (!m[key]) m[key] = { sequence: key, games: 0, wins: 0, losses: 0, draws: 0, white: 0, black: 0 };
    m[key].games++;
    if (g.result === "win") m[key].wins++;
    else if (g.result === "loss") m[key].losses++;
    else m[key].draws++;
    if (g.color === "white") m[key].white++; else m[key].black++;
  }
  return Object.values(m).map(s => {
    const inferred = lookupOpeningFromMovePrefix(s.sequence);
    return {
      ...s,
      winPct: percent(s.wins, s.games),
      lossPct: percent(s.losses, s.games),
      dominantColor: s.white >= s.black ? "White" : "Black",
      openingName: inferred?.opening || null,
    };
  });
}

function aggregateEcoFamilies(games) {
  const m = {};
  for (const g of games) {
    const f = g.ecoFamily;
    if (!f || f === "?") continue;
    if (!m[f]) m[f] = { family: f, games: 0, wins: 0, losses: 0, draws: 0 };
    m[f].games++;
    if (g.result === "win") m[f].wins++;
    else if (g.result === "loss") m[f].losses++;
    else m[f].draws++;
  }
  return Object.values(m).map(e => ({ ...e, winPct: percent(e.wins, e.games), lossPct: percent(e.losses, e.games) }));
}

function timeControlIntel(games) {
  const m = {};
  for (const g of games) {
    const k = g.timeControl || "other";
    if (!m[k]) m[k] = { tc: k, games: 0, wins: 0, losses: 0, draws: 0 };
    m[k].games++;
    if (g.result === "win") m[k].wins++;
    else if (g.result === "loss") m[k].losses++;
    else m[k].draws++;
  }
  const total = games.length;
  return Object.values(m)
    .filter(d => d.tc !== "other")
    .map(d => ({
      ...d,
      share: percent(d.games, total),
      winPct: percent(d.wins, d.games),
      lossPct: percent(d.losses, d.games),
      drawPct: percent(d.draws, d.games),
    }))
    .sort((a, b) => a.winPct - b.winPct || b.games - a.games);
}

function repertoireHabits(openings, total) {
  return openings
    .filter(o => o.games >= 5)
    .map(o => ({
      ...o,
      share: percent(o.games, total),
      habit: o.games / total >= 0.18 ? "Core repertoire" : o.games / total >= 0.09 ? "Frequent" : "Occasional",
    }))
    .sort((a, b) => b.games - a.games);
}

function colorTimeCross(games, minGames = 8) {
  const m = {};
  for (const g of games) {
    const k = `${g.color}|${g.timeControl}`;
    if (!m[k]) m[k] = { color: g.color, tc: g.timeControl, games: 0, wins: 0, losses: 0 };
    m[k].games++;
    if (g.result === "win") m[k].wins++;
    else if (g.result === "loss") m[k].losses++;
  }
  return Object.values(m)
    .filter(d => d.tc !== "other" && d.games >= minGames)
    .map(d => ({ ...d, winPct: percent(d.wins, d.games), lossPct: percent(d.losses, d.games), icon: d.color === "white" ? CHESS_WHITE : CHESS_BLACK }));
}

function computeWinPlan(player, opponent, months) {
  if (!opponent?.games?.length) return null;
  const games = opponent.games;
  const total = games.length;
  const oppName = opponent.profile?.username || "Opponent";
  const wins = games.filter(g => g.result === "win").length;
  const losses = games.filter(g => g.result === "loss").length;
  const draws = games.filter(g => g.result === "draw").length;
  const baseline = { winPct: percent(wins, total), lossPct: percent(losses, total), drawPct: percent(draws, total) };
  const minOpening = adaptiveMinGames(total, 8, 0.05);
  const minSequence = adaptiveMinGames(total, 6, 0.035);
  const minTC = adaptiveMinGames(total, 10, 0.08);
  const minEco = adaptiveMinGames(total, 10, 0.06);
  const minColor = adaptiveMinGames(total, 12, 0.1);

  const oppDna = computePersonality(games, opponent.stats, opponent.profile);
  const colors = colorStats(games);
  const colorRows = [
    { color: "White", icon: CHESS_WHITE, ...colors.white, winPct: percent(colors.white.wins, colors.white.total), lossPct: percent(colors.white.losses, colors.white.total) },
    { color: "Black", icon: CHESS_BLACK, ...colors.black, winPct: percent(colors.black.wins, colors.black.total), lossPct: percent(colors.black.losses, colors.black.total) },
  ].filter(c => c.total);
  const weakColorRaw = [...colorRows].sort((a, b) => a.winPct - b.winPct || b.total - a.total)[0];
  const weakColor = weakColorRaw && weakColorRaw.total >= minColor
    ? segmentWeakness({ ...weakColorRaw, games: weakColorRaw.total }, baseline, minColor, "win")
    : null;

  const tcRows = timeControlIntel(games);
  const weakTC = tcRows.map(d => segmentWeakness(d, baseline, minTC, "win")).filter(Boolean).sort((a, b) => b.score - a.score)[0] || null;
  const strongTC = tcRows.filter(d => d.games >= minTC).sort((a, b) => b.winPct - a.winPct)[0] || null;

  const openings = aggOpenings(games);
  const openingLeaks = openings
    .filter(o => !isGenericOpeningName(o.opening))
    .map(o => segmentWeakness(o, baseline, minOpening, "loss"))
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);
  const targetOpenings = openingLeaks.slice(0, 6);
  const overusedOpenings = repertoireHabits(openings, total).slice(0, 5);

  const sequences = aggregateSequences(games)
    .map(s => segmentWeakness(s, baseline, minSequence, "loss"))
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const ecoFamilies = aggregateEcoFamilies(games)
    .map(e => segmentWeakness(e, baseline, minEco, "loss"))
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);

  const eloWeak = worstByWinPct(eloBrackets(games), 8);
  const eloWeakSig = eloWeak && eloWeak.games >= 8 && baseline.winPct - eloWeak.winPct >= 8
    ? { ...eloWeak, delta: baseline.winPct - eloWeak.winPct, confidence: confidenceTierFor(eloWeak.games, baseline.winPct - eloWeak.winPct).tier }
    : null;

  const recent = games.slice(0, Math.min(20, total));
  const recentWinPct = percent(recent.filter(g => g.result === "win").length, recent.length);
  const streak = computeStreak(games);
  const dayMap = {};
  games.forEach(g => {
    if (g.date && g.date !== "?") {
      if (!dayMap[g.date]) dayMap[g.date] = { t: 0, w: 0 };
      dayMap[g.date].t++;
      if (g.result === "win") dayMap[g.date].w++;
    }
  });
  const volatileDays = Object.values(dayMap).filter(d => d.t >= 4).map(d => percent(d.w, d.t));
  const volatility = volatileDays.length >= 3 ? Math.round(Math.sqrt(avg(volatileDays.map(v => (v - avg(volatileDays)) ** 2)))) : null;

  const playerOpenings = player?.games?.length
    ? aggOpenings(player.games).filter(o => o.games >= 5).sort((a, b) => b.winPct - a.winPct || b.games - a.games).slice(0, 4)
    : [];
  const playerColors = player?.games?.length ? colorStats(player.games) : null;
  const playerColorEdge = playerColors
    ? [{ color: "White", winPct: percent(playerColors.white.wins, playerColors.white.total), games: playerColors.white.total },
       { color: "Black", winPct: percent(playerColors.black.wins, playerColors.black.total), games: playerColors.black.total }]
        .filter(c => c.games >= 8)
        .sort((a, b) => b.winPct - a.winPct)[0]
    : null;

  const tilt = tiltStats(games);
  const lengths = gameLengthStats(games);
  const grindWeak = lengths && lengths.longGames >= 10 && lengths.longWinPct !== null && baseline.winPct - lengths.longWinPct >= 8
    ? { ...lengths, delta: baseline.winPct - lengths.longWinPct, confidence: confidenceTierFor(lengths.longGames, baseline.winPct - lengths.longWinPct).tier }
    : null;
  const blitzWeak = lengths && lengths.shortGames >= 10 && lengths.shortWinPct !== null && baseline.winPct - lengths.shortWinPct >= 8
    ? { ...lengths, delta: baseline.winPct - lengths.shortWinPct, confidence: confidenceTierFor(lengths.shortGames, baseline.winPct - lengths.shortWinPct).tier }
    : null;

  const colorTC = colorTimeCross(games, Math.max(8, Math.ceil(total * 0.06)))
    .map(d => segmentWeakness(d, baseline, Math.max(8, Math.ceil(total * 0.06)), "win"))
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);

  const fm = firstMoveStats(games);
  const firstMoveLeaks = [...fm.asWhite, ...fm.asBlack]
    .filter(r => r.games >= Math.max(8, Math.ceil(total * 0.05)))
    .map(r => segmentWeakness({ ...r, label: `1.${r.move}` }, baseline, Math.max(8, Math.ceil(total * 0.05)), "win"))
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);

  // Time-of-day: only surface when sample is large AND gap is meaningful (not a cheat-sheet item)
  const todRows = timeOfDayStats(games);
  const weakHour = (() => {
    const sorted = todRows.filter(d => d.games >= 20).sort((a, b) => a.winPct - b.winPct);
    if (sorted.length < 2) return null;
    const worst = sorted[0];
    const best = sorted[sorted.length - 1];
    if (best.winPct - worst.winPct < 12 || baseline.winPct - worst.winPct < 8) return null;
    return { ...worst, delta: baseline.winPct - worst.winPct, confidence: "Low", note: "Context only — fatigue patterns are noisy; prioritize openings and time control." };
  })();

  const exploitCandidates = [
    weakColor && {
      id: "color", icon: weakColor.icon, category: "Color",
      label: `Steer them onto ${weakColor.color}`,
      value: `${weakColor.winPct}% win (${weakColor.delta}pp below baseline)`,
      detail: `Across ${weakColor.games} ${weakColor.color} games they win ${weakColor.winPct}% vs ${baseline.winPct}% overall. Shrinkage-adjusted estimate: ${weakColor.shrunkRate}%. Trade into structures where ${weakColor.color} must defend.`,
      games: weakColor.games, delta: weakColor.delta, confidence: weakColor.confidence, confidenceColor: weakColor.confidenceColor, score: weakColor.score,
    },
    weakTC && {
      id: "clock", icon: "⏱", category: "Time control",
      label: `Queue ${weakTC.tc}`,
      value: `${weakTC.winPct}% win · ${weakTC.share}% of their games`,
      detail: `${weakTC.tc} is their weakest format in this sample (${weakTC.games} games, ${weakTC.delta}pp below baseline). They play it ${weakTC.share}% of the time — when you can choose the pairing, pick this clock.`,
      games: weakTC.games, delta: weakTC.delta, confidence: weakTC.confidence, confidenceColor: weakTC.confidenceColor, score: weakTC.score,
    },
    targetOpenings[0] && !sequences[0] && {
      id: "opening", icon: "♟", category: "Opening",
      label: targetOpenings[0].opening.length > 42 ? targetOpenings[0].opening.slice(0, 40) + "…" : targetOpenings[0].opening,
      value: `${targetOpenings[0].lossPct}% loss rate (+${targetOpenings[0].delta}pp vs baseline)`,
      detail: `${targetOpenings[0].losses} losses in ${targetOpenings[0].games} games — not a tiny sample. Baseline loss rate is ${baseline.lossPct}%. Prepare move orders that reach this territory.${targetOpenings[0].eco !== "?" ? ` ECO ${targetOpenings[0].eco}.` : ""}`,
      games: targetOpenings[0].games, delta: targetOpenings[0].delta, confidence: targetOpenings[0].confidence, confidenceColor: targetOpenings[0].confidenceColor, score: targetOpenings[0].score,
      opening: targetOpenings[0],
    },
    sequences[0] && {
      id: "sequence", icon: "♟", category: "Opening",
      label: sequences[0].openingName
        ? `${sequences[0].openingName}: ${sequences[0].sequence}`
        : `Force the line ${sequences[0].sequence}`,
      value: `${sequences[0].lossPct}% loss · ${sequences[0].games} games`,
      detail: `When the game opens ${sequences[0].sequence}, they lose ${sequences[0].lossPct}% (${sequences[0].delta}pp above baseline). Mostly as ${sequences[0].dominantColor}.${sequences[0].openingName ? ` This is the ${sequences[0].openingName}.` : ""} Study this exact move order.`,
      games: sequences[0].games, delta: sequences[0].delta, confidence: sequences[0].confidence, confidenceColor: sequences[0].confidenceColor, score: sequences[0].score,
      sequence: sequences[0].sequence,
    },
    ecoFamilies[0] && {
      id: "eco", icon: "📚", category: "ECO family",
      label: `Target ECO ${ecoFamilies[0].family} structures`,
      value: `${ecoFamilies[0].lossPct}% loss in ${ecoFamilies[0].games} games`,
      detail: `Volume ${ecoFamilies[0].family} games leak ${ecoFamilies[0].delta}pp more than their average. Useful when you can't match a specific named line — steer toward this pawn-structure family.`,
      games: ecoFamilies[0].games, delta: ecoFamilies[0].delta, confidence: ecoFamilies[0].confidence, confidenceColor: ecoFamilies[0].confidenceColor, score: ecoFamilies[0].score,
    },
    colorTC[0] && {
      id: "colortc", icon: colorTC[0].icon, category: "Color × format",
      label: `${colorTC[0].color} in ${colorTC[0].tc}`,
      value: `${colorTC[0].winPct}% win (${colorTC[0].delta}pp below baseline)`,
      detail: `Combined slice: ${colorTC[0].games} games as ${colorTC[0].color} in ${colorTC[0].tc}. If pairing lets you influence both color and clock, this is the softest intersection.`,
      games: colorTC[0].games, delta: colorTC[0].delta, confidence: colorTC[0].confidence, confidenceColor: colorTC[0].confidenceColor, score: colorTC[0].score,
    },
    eloWeakSig && {
      id: "elo", icon: "📉", category: "Opponent pool",
      label: `They struggle vs ${eloWeakSig.label} rated players`,
      value: `${eloWeakSig.winPct}% win (${eloWeakSig.delta}pp below baseline)`,
      detail: `${eloWeakSig.games} games in this rating band. Play solid, low-risk chess — they don't handle steady pressure from peers in this bracket.`,
      games: eloWeakSig.games, delta: eloWeakSig.delta, confidence: confidenceTierFor(eloWeakSig.games, eloWeakSig.delta).tier, confidenceColor: confidenceTierFor(eloWeakSig.games, eloWeakSig.delta).color, score: eloWeakSig.delta * Math.sqrt(eloWeakSig.games),
    },
    grindWeak && {
      id: "grind", icon: "🐢", category: "Game length",
      label: "Extend into long games",
      value: `${grindWeak.longWinPct}% win past move 40`,
      detail: `In ${grindWeak.longGames} games of 40+ moves they win only ${grindWeak.longWinPct}% (${grindWeak.delta}pp below baseline). Decline early queen trades and mass simplifications.`,
      games: grindWeak.longGames, delta: grindWeak.delta, confidence: grindWeak.confidence, confidenceColor: confidenceTierFor(grindWeak.longGames, grindWeak.delta).color, score: grindWeak.delta * Math.sqrt(grindWeak.longGames),
    },
    blitzWeak && {
      id: "short", icon: "⚡", category: "Game length",
      label: "Strike early (≤20 moves)",
      value: `${blitzWeak.shortWinPct}% win in short games`,
      detail: `Quick games (${blitzWeak.shortGames} samples) see them at ${blitzWeak.shortWinPct}% — ${blitzWeak.delta}pp below baseline. Open with purpose; don't let them settle.`,
      games: blitzWeak.shortGames, delta: blitzWeak.delta, confidence: blitzWeak.confidence, confidenceColor: confidenceTierFor(blitzWeak.shortGames, blitzWeak.delta).color, score: blitzWeak.delta * Math.sqrt(blitzWeak.shortGames),
    },
    tilt && tilt.tilt >= 12 && {
      id: "tiltprone", icon: "🫠", category: "Session pattern",
      label: "Press after you win game one",
      value: `${tilt.afterLossPct}% win after a loss vs ${tilt.afterWinPct}% after a win`,
      detail: `Same-session rematch data: ${tilt.afterLossGames} games after losses, ${tilt.afterWinGames} after wins. They score ${tilt.tilt}pp worse immediately after losing — accept rematches if you take the first game.`,
      games: tilt.afterLossGames + tilt.afterWinGames, delta: tilt.tilt, confidence: tilt.afterLossGames >= 15 ? "Medium" : "Low", confidenceColor: "#ffc800", score: tilt.tilt + 25,
    },
    recent.length >= 12 && recentWinPct + 10 < baseline.winPct && {
      id: "form", icon: "❄", category: "Recent form",
      label: "They're below their baseline",
      value: `${recentWinPct}% last ${recent.length} vs ${baseline.winPct}% overall`,
      detail: `${recentWinPct - baseline.winPct}pp form dip over the most recent games. Start with sound, forcing play — confidence may already be fragile.`,
      games: recent.length, delta: baseline.winPct - recentWinPct, confidence: recent.length >= 18 ? "Medium" : "Low", confidenceColor: "#ffc800", score: (baseline.winPct - recentWinPct) * 2,
    },
    streak.count >= 4 && streak.type === "loss" && {
      id: "streak", icon: "🧊", category: "Momentum",
      label: "Active losing streak",
      value: `${streak.count} losses in a row`,
      detail: "Don't offer easy complications that bail them out. Keep the position unpleasant but technically sound.",
      games: streak.count, delta: 12, confidence: "Low", confidenceColor: "#67e8f9", score: 60 + streak.count,
    },
    overusedOpenings[0] && overusedOpenings[0].share >= 12 && overusedOpenings[0].winPct <= baseline.winPct - 6 && overusedOpenings[0].games >= minOpening && {
      id: "habit", icon: "🎯", category: "Predictable habit",
      label: `Prep their go-to: ${overusedOpenings[0].opening.length > 36 ? overusedOpenings[0].opening.slice(0, 34) + "…" : overusedOpenings[0].opening}`,
      value: `${overusedOpenings[0].share}% of games · ${overusedOpenings[0].winPct}% win`,
      detail: `They reach this line in ${overusedOpenings[0].games} games (${overusedOpenings[0].share}% of archive). High hit-rate prep pays off here.`,
      games: overusedOpenings[0].games, delta: baseline.winPct - overusedOpenings[0].winPct, confidence: overusedOpenings[0].games >= 15 ? "High" : "Medium", confidenceColor: overusedOpenings[0].games >= 15 ? "#39ffa0" : "#ffc800", score: overusedOpenings[0].share + (baseline.winPct - overusedOpenings[0].winPct),
    },
  ].filter(Boolean).sort((a, b) => b.score - a.score);

  const riskFlags = exploitCandidates.slice(0, 8);
  const topExploit = riskFlags[0] || null;

  const signalStrength = riskFlags.filter(f => f.confidence === "High").length * 18
    + riskFlags.filter(f => f.confidence === "Medium").length * 10
    + riskFlags.filter(f => f.confidence === "Low").length * 4
    + Math.min(35, total / 8);
  const confidence = clamp(Math.round(signalStrength));
  const confidenceTier = confidence >= 70 ? "High" : confidence >= 45 ? "Medium" : "Low";

  const topOpening = targetOpenings[0];
  const topSeq = sequences[0];
  const planSteps = [
    {
      phase: "Before the game", icon: "0",
      title: weakTC ? `Choose ${weakTC.tc} if you can` : "Pick your strongest format",
      text: weakTC
        ? `${weakTC.tc} shows a ${weakTC.delta}pp win-rate drop (${weakTC.games} games, ${weakTC.confidence} confidence). ${playerColorEdge ? `You score ${playerColorEdge.winPct}% as ${playerColorEdge.color} — lean that way if pairing allows.` : "Queue the time control where their sample is weakest."}`
        : `${oppName} plays ${tcRows[0]?.share || "—"}% ${tcRows[0]?.tc || "blitz"}. Match your best clock against their most common habit.`,
    },
    {
      phase: "Opening", icon: "1",
      title: topSeq
        ? topSeq.openingName
          ? `Prepare ${topSeq.openingName} (${topSeq.sequence})`
          : `Aim for ${topSeq.sequence}`
        : topOpening ? `Prepare ${topOpening.opening}` : "Deny comfort early",
      text: topSeq
        ? `This line appears ${topSeq.games} times with a ${topSeq.lossPct}% loss rate (+${topSeq.delta}pp vs baseline).${topSeq.openingName ? ` ${topSeq.openingName}.` : ""} Have a concrete response ready.`
        : topOpening
          ? `${topOpening.opening}: ${topOpening.games} games, ${topOpening.lossPct}% losses (${topOpening.confidence} confidence). Baseline is only ${baseline.lossPct}%.`
          : `Need ${minOpening}+ games per line before calling an opening leak — keep probing early.`,
    },
    {
      phase: "Middlegame", icon: "2",
      title: weakColor ? `Keep them on ${weakColor.color}` : "Accumulate small problems",
      text: weakColor
        ? `${weakColor.color}: ${weakColor.winPct}% win over ${weakColor.games} games (${weakColor.delta}pp below baseline). Trade toward structures where that color defends.`
        : "Repeated practical choices beat one-shot traps. Make every recapture slightly worse.",
    },
    {
      phase: "Clock & conversion", icon: "3",
      title: grindWeak ? "Don't simplify — grind" : tilt ? "Consider the rematch" : "Win cleanly",
      text: grindWeak
        ? `Past move 40 they win ${grindWeak.longWinPct}% (${grindWeak.delta}pp below baseline, n=${grindWeak.longGames}).`
        : tilt && tilt.tilt >= 12
          ? `After losing they score ${tilt.afterLossPct}% in the next same-session game (${tilt.afterLossGames} samples).`
          : `Overall they still win ${baseline.winPct}% — convert by removing counterplay, not hero tactics.`,
    },
  ];

  const matchupNotes = [
    playerColorEdge && `Your ${playerColorEdge.color} scores ${playerColorEdge.winPct}% (${playerColorEdge.games} games) — prefer that side when possible.`,
    playerOpenings[0] && `Your best weapon: ${playerOpenings[0].opening} (${playerOpenings[0].winPct}% over ${playerOpenings[0].games} games).`,
    overusedOpenings[0] && overusedOpenings[0].share >= 10 && `They play ${overusedOpenings[0].opening} in ${overusedOpenings[0].share}% of games — high-value prep target.`,
    oppDna && `ChessDNA: ${oppDna.title} — expect ${oppDna.favTC} (${oppDna.timeMix[0]?.pct || 0}% of games) and ${oppDna.uniqueOpenings} distinct openings.`,
  ].filter(Boolean);

  const primaryAngle = topExploit ? topExploit.category.toLowerCase() : "their repeated patterns";
  const summary = riskFlags.length
    ? `${oppName} wins ${baseline.winPct}% across ${total} games (${rangeLabel(months)}). Strongest backed angle: ${topExploit.label.toLowerCase()} — ${topExploit.games} game sample, ${topExploit.confidence} confidence.`
    : `${oppName} wins ${baseline.winPct}% across ${total} games — not enough repeated leaks at our thresholds yet. Play solid chess and widen the date range.`;

  const cheatSheet = [
    weakTC && ["Time control", `${weakTC.tc} — ${weakTC.winPct}% win, n=${weakTC.games}, ${weakTC.confidence} conf`],
    topSeq && ["Opening", `${topSeq.openingName ? `${topSeq.openingName}: ` : ""}${topSeq.sequence} (${topSeq.lossPct}% loss, n=${topSeq.games})`],
    topOpening && !topSeq && ["Opening", `${topOpening.opening} (${topOpening.lossPct}% loss, n=${topOpening.games})`],
    weakColor && ["Color", `Make them play ${weakColor.color} (${weakColor.winPct}% win, n=${weakColor.games})`],
    overusedOpenings[0] && overusedOpenings[0].share >= 12 && ["Prep their habit", `${overusedOpenings[0].opening} — ${overusedOpenings[0].share}% of games`],
    tilt && tilt.tilt >= 12 && ["Rematch edge", `${tilt.afterLossPct}% after a loss (n=${tilt.afterLossGames})`],
    grindWeak && ["Game length", `Grind 40+ moves — ${grindWeak.longWinPct}% win (n=${grindWeak.longGames})`],
    ["Baseline", `They still win ${baseline.winPct}% — convert calmly, no hero moves`],
  ].filter(Boolean);

  return {
    oppName, total, wins, losses, draws,
    winPct: baseline.winPct, lossPct: baseline.lossPct, drawPct: baseline.drawPct,
    baseline, weakColor, weakTC, strongTC, targetOpenings, overusedOpenings, sequences, ecoFamilies,
    eloWeak: eloWeakSig, recentWinPct, streak, volatility, tilt, weakHour, lengths, grindWeak, blitzWeak,
    colorTC, firstMoveLeaks, tcRows, confidence, confidenceTier, riskFlags, planSteps, matchupNotes, summary, cheatSheet,
    methodology: {
      minOpening, minSequence, minTC, minEco, minColor,
      note: `Only surfaces patterns with enough games (typically ${minOpening}+ per opening, ${minTC}+ per time control) and ≥6pp deviation from baseline. Small samples are ignored — 3 games in a line is not a leak.`,
    },
    monthsLabel: rangeLabel(months),
  };
}

// ── UI Primitives ─────────────────────────────────────────────────────────────
const Sk = ({w="100%",h=18,style={}}) => <div className="skel" style={{width:w,height:h,...style}}/>;

function Card({children,style={},t,glow=false,hover=true,className=""}) {
  return <div className={`${hover?"card-hover":""} ${className}`} style={{background:t.card,border:`1px solid ${glow?t.accent+"40":t.cardBorder}`,borderRadius:14,boxShadow:`inset 0 1px 0 ${t.accent}08,0 4px 28px rgba(0,0,0,.45)${glow?`,0 0 40px ${t.glowC}`:""}`,padding:22,...style}}>{children}</div>;
}

function SecTitle({children,sub,t}) {
  return <div style={{marginBottom:16}}>
    <h2 style={{fontFamily:t.headingFont,fontSize:20,fontWeight:700,color:t.accent,letterSpacing:"-.01em",lineHeight:1.2,overflowWrap:"anywhere"}}>{children}</h2>
    <div style={{height:2,width:48,background:`linear-gradient(90deg,${t.accent},transparent)`,borderRadius:2,marginTop:8,animation:"underlineGrow .55s cubic-bezier(.22,1,.36,1) both"}}/>
    {sub && <p className="sec-sub" style={{fontSize:12,color:t.textDim,marginTop:6}}>{sub}</p>}
  </div>;
}

function ChartTip({active,payload,label,t}) {
  if (!active||!payload?.length) return null;
  return <div className="chart-tip-pop" style={{background:t.bg+"f5",border:`1px solid ${t.cardBorder}`,borderRadius:8,padding:"10px 14px",fontSize:12,fontFamily:t.font,boxShadow:`0 8px 24px rgba(0,0,0,.45),0 0 0 1px ${t.accent}15`}}>
    <div style={{color:t.accent,fontWeight:600,marginBottom:4}}>{label}</div>
    {payload.map((p,i)=><div key={i} style={{color:p.color||t.text}}>{p.name}: {p.value}{["winPct","Win%","Loss%","Draw%"].includes(p.name)?"%":""}</div>)}
  </div>;
}

function Donut({wins,losses,draws,size=100,t}) {
  const data=[{value:wins,color:t.win},{value:losses,color:t.loss},{value:draws,color:t.draw}];
  return <PieChart width={size} height={size}>
    <Pie data={data} cx={size/2-2} cy={size/2-2} innerRadius={size*.3} outerRadius={size*.46} dataKey="value" paddingAngle={2} isAnimationActive animationDuration={900} animationBegin={80}>
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

// ── Copy-to-clipboard button ──────────────────────────────────────────────────
function CopyButton({onCopy,t,label="Copy"}) {
  const [copied,setCopied]=useState(false);
  return <button className="secondary" onClick={()=>{onCopy();setCopied(true);setTimeout(()=>setCopied(false),1800);}}
    style={copied?{background:`${t.win}18`,borderColor:`${t.win}50`,color:t.win,animation:"elasticIn .3s cubic-bezier(.22,1,.36,1) both",transform:"scale(1.02)"}:{}}>
    {copied?"✓ Copied":<><Ico size={13}>📋</Ico> {label}</>}
  </button>;
}

// ── Scroll reveal wrapper ─────────────────────────────────────────────────────
function Reveal({children, delay=0, style={}, className=""}) {
  const ref=useRef(null);
  const [show,setShow]=useState(false);
  useEffect(()=>{
    const el=ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) { setShow(true); return; }
    const obs=new IntersectionObserver(([e])=>{ if (e.isIntersecting) { setShow(true); obs.disconnect(); } },{threshold:.1,rootMargin:"0px 0px -36px 0px"});
    obs.observe(el);
    return ()=>obs.disconnect();
  },[]);
  return <div ref={ref} className={className} style={{
    opacity:show?1:0,
    transform:show?"translateY(0)":"translateY(20px)",
    transition:`opacity .6s cubic-bezier(.22,1,.36,1) ${delay}s,transform .6s cubic-bezier(.22,1,.36,1) ${delay}s`,
    ...style,
  }}>{children}</div>;
}

// ── Circular gauge ────────────────────────────────────────────────────────────
function RingGauge({value, size=84, stroke=8, color, t, label, delay=0, suffix=""}) {
  const r=(size-stroke)/2, circ=2*Math.PI*r;
  const [mounted,setMounted]=useState(false);
  useEffect(()=>{ const id=setTimeout(()=>setMounted(true), 80+delay*1000); return ()=>clearTimeout(id); },[delay]);
  const pct=clamp(value);
  return <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
    <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={`${color}1a`} strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={mounted?circ*(1-pct/100):circ}
        style={{transition:"stroke-dashoffset 1.15s cubic-bezier(.22,1,.36,1)",filter:`drop-shadow(0 0 6px ${color}50)`}}/>
    </svg>
    <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:0}}>
      <span style={{fontFamily:t.headingFont,fontSize:size*.27,fontWeight:900,color,lineHeight:1}}><AnimatedNumber value={pct} duration={1100}/>{suffix}</span>
      {label&&<span style={{fontSize:Math.max(8,size*.1),color:t.textDim,textTransform:"uppercase",letterSpacing:".06em",fontWeight:700,marginTop:2}}>{label}</span>}
    </div>
  </div>;
}

// ── Playstyle wheel — one glance at your 7 dimensions ─────────────────────────
function PlaystyleWheel({dimensions, p, c, t, size=220}) {
  const data=dimensions.map(d=>({name:d.label,value:d.value,color:dimensionTier(d.value).color,key:d.key}));
  return <div style={{display:"flex",flexDirection:"column",alignItems:"center",flexShrink:0}}>
    <div style={{position:"relative",width:size,height:size}}>
      <PieChart width={size} height={size}>
        <Pie data={data} cx="50%" cy="50%" innerRadius={size*.36} outerRadius={size*.46} dataKey="value" paddingAngle={2} stroke="none" isAnimationActive animationDuration={900}>
          {data.map(d=><Cell key={d.key} fill={d.color} style={{filter:`drop-shadow(0 0 6px ${d.color}40)`}}/>)}
        </Pie>
      </PieChart>
      <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}>
        <div style={{filter:`drop-shadow(0 0 12px ${c}60)`}}><Ico size={size*.22}>{p.icon}</Ico></div>
      </div>
    </div>
    <div style={{textAlign:"center",maxWidth:size+48,marginTop:10,padding:"0 4px"}}>
      <div style={{fontFamily:t.headingFont,fontSize:15,fontWeight:900,color:c,lineHeight:1.2,overflowWrap:"anywhere"}}>{p.title}</div>
      <div style={{fontSize:9,color:t.textDim,marginTop:5,fontWeight:700,letterSpacing:".04em",overflowWrap:"anywhere"}}>{p.dnaCode}</div>
    </div>
    <div style={{display:"flex",flexWrap:"wrap",gap:5,justifyContent:"center",marginTop:10}}>
      {data.map(d=>(
        <span key={d.key} title={`${d.name}: ${d.value}`} style={{fontSize:9,fontWeight:700,color:d.color,background:`${d.color}14`,border:`1px solid ${d.color}30`,borderRadius:999,padding:"2px 7px",display:"inline-flex",alignItems:"center",gap:3}}><Ico size={9}>{DIMENSION_META[d.key]?.icon||"•"}</Ico> {d.value}</span>
      ))}
    </div>
  </div>;
}

// ── RPG-style stat bars — simple, scannable ───────────────────────────────────
function StatSheet({dimensions,t,compact=false,limit=7}) {
  const rows=dimensions.slice(0,limit);
  return <div style={{display:"flex",flexDirection:"column",gap:compact?7:10}}>
    {rows.map((d,i)=>{
      const meta=DIMENSION_META[d.key]||{};
      const tier=dimensionTier(d.value);
      return <div key={d.key} style={{animation:`fadeInUp .4s ${.04+i*.05}s cubic-bezier(.22,1,.36,1) both`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:compact?3:5,gap:8}}>
            <span style={{fontSize:13,fontWeight:600,color:t.text,display:"flex",alignItems:"center",gap:6,minWidth:0,flex:1,overflowWrap:"anywhere"}}>
            <Ico size={compact?12:14} style={{flexShrink:0}}>{meta.icon}</Ico>{d.label}
            {!compact&&<span className="badge" style={{background:`${tier.color}14`,color:tier.color,border:`1px solid ${tier.color}35`,fontSize:9,padding:"1px 6px",flexShrink:0}}>{tier.tier}</span>}
          </span>
          <span style={{fontFamily:t.headingFont,fontSize:compact?16:20,fontWeight:900,color:tier.color}}>{d.value}</span>
        </div>
        <div style={{height:compact?5:7,borderRadius:4,background:`${tier.color}12`,overflow:"hidden"}}>
          <div className="bar-grow" style={{height:"100%",width:`${d.value}%`,background:`linear-gradient(90deg,${tier.color}88,${tier.color})`,borderRadius:4,boxShadow:`0 0 10px ${tier.color}35`,animationDelay:`${.1+i*.06}s`}}/>
        </div>
        {!compact&&<div style={{fontSize:11,color:t.textDim,marginTop:4}}>{d.detail}</div>}
      </div>;
    })}
  </div>;
}

// ── Page transition wrapper ───────────────────────────────────────────────────
function PageTransition({children, keyVal}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(false);
    const timer = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(timer);
  }, [keyVal]);
  return <div className="page-transition" style={{
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0) scale(1)" : "translateY(14px) scale(.985)",
    filter: visible ? "blur(0)" : "blur(6px)",
  }}>{children}</div>;
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
  return <div style={{position:"fixed",top:0,left:0,right:0,zIndex:9999,height:3,background:`${t.glowC}30`,opacity:active||width<100?1:0,transition:"opacity .45s ease"}}>
    <div style={{
      height:"100%",width:`${active ? width : 100}%`,
      background:`linear-gradient(90deg,${t.accent2},${t.accent},${t.hl},${t.accent})`,
      backgroundSize:"200% 100%",
      animation:active?"progressShimmer 1.8s linear infinite":"none",
      borderRadius:"0 3px 3px 0",
      transition:active?"width 0.8s cubic-bezier(.4,0,.2,1)":"width .35s cubic-bezier(.22,1,.36,1), opacity .35s ease",
      boxShadow:`0 0 14px ${t.glowC},0 0 4px ${t.accent}`,
      opacity:active?1:0,
    }}/>
  </div>;
}

// ── Scroll progress ───────────────────────────────────────────────────────────
function ScrollProgress({t}) {
  const [pct,setPct]=useState(0);
  useEffect(()=>{
    const fn=()=>{
      const h=document.documentElement.scrollHeight-window.innerHeight;
      setPct(h>0?Math.min(100,(window.scrollY/h)*100):0);
    };
    window.addEventListener("scroll",fn,{passive:true});
    fn();
    return ()=>window.removeEventListener("scroll",fn);
  },[]);
  if (pct<1) return null;
  return <div style={{position:"fixed",top:3,left:0,height:2,zIndex:9998,width:`${pct}%`,background:`linear-gradient(90deg,${t.accent2},${t.accent})`,transition:"width .18s cubic-bezier(.22,1,.36,1)",boxShadow:`0 0 10px ${t.glowC}`,borderRadius:"0 2px 2px 0",pointerEvents:"none"}}/>;
}

// ── Win/Draw/Loss Bar ─────────────────────────────────────────────────────────
function WDLBar({wins,draws,losses,t}) {
  const total = wins+draws+losses||1;
  const wp=Math.round(wins/total*100), dp=Math.round(draws/total*100), lp=Math.round(losses/total*100);
  return <div>
    <div style={{display:"flex",height:10,borderRadius:6,overflow:"hidden",gap:2,marginBottom:6}}>
      <div className="bar-grow" style={{width:`${wp}%`,background:t.win,borderRadius:4,transition:"width .6s"}}/>
      <div className="bar-grow" style={{width:`${dp}%`,background:t.draw,borderRadius:4,transition:"width .6s",animationDelay:".08s"}}/>
      <div className="bar-grow" style={{width:`${lp}%`,background:t.loss,borderRadius:4,transition:"width .6s",animationDelay:".16s"}}/>
    </div>
    <div style={{display:"flex",gap:16,fontSize:12}}>
      <span style={{color:t.win}}>W {wp}%</span>
      <span style={{color:t.draw}}>D {dp}%</span>
      <span style={{color:t.loss}}>L {lp}%</span>
    </div>
  </div>;
}

// ── Trading Card ──────────────────────────────────────────────────────────────
// ── Hero Player Card ──────────────────────────────────────────────────────────
function PlayerHeroCard({data,loading,t}) {
  if (loading) return <Card t={t} style={{display:"flex",gap:20,alignItems:"center"}}><Sk w={88} h={88} style={{borderRadius:"50%",flexShrink:0}}/><div style={{flex:1,display:"flex",flexDirection:"column",gap:10}}><Sk w="50%" h={24}/><Sk w="70%" h={15}/><Sk w="60%" h={12}/></div></Card>;
  if (!data) return null;
  const {profile,stats,games}=data;
  const p=computePersonality(games,stats,profile);
  const ratings=["rapid","blitz","bullet","daily"].map(tc=>({tc,...getRating(stats,tc)})).filter(r=>r.last);
  const joined=profile.joined?new Date(profile.joined*1000).getFullYear():null;
  const total=games.length, wins=games.filter(g=>g.result==="win").length, losses=games.filter(g=>g.result==="loss").length, draws=games.filter(g=>g.result==="draw").length;

  return <Card t={t} glow={true} style={{animation:"revealCard .5s ease both"}}>
    <div style={{display:"flex",gap:20,flexWrap:"wrap",alignItems:"flex-start"}}>
      {/* Avatar */}
      <div style={{position:"relative",flexShrink:0}}>
        <div style={{position:"absolute",inset:-6,borderRadius:"50%",border:`2px solid ${p?.titleColor||t.accent}35`,animation:"pulseRing 2.8s ease-in-out infinite",pointerEvents:"none"}}/>
        <div style={{width:88,height:88,borderRadius:"50%",border:`3px solid ${p?.titleColor||t.accent}60`,overflow:"hidden",background:t.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:40,boxShadow:`0 0 24px ${p?.titleColor||t.accent}25`,transition:"transform .3s cubic-bezier(.22,1,.36,1)"}} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.05)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
          {profile.avatar
            ? <img src={profile.avatar} alt="avatar" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none";e.target.parentElement.innerHTML="♟";}}/>
            : <ChessIco size={40}>♟</ChessIco>}
        </div>
        {profile.status==="premium"&&<div style={{position:"absolute",bottom:0,right:0,background:"#ffd700",borderRadius:"50%",width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#080400",animation:"premiumPulse 2.5s ease-in-out infinite"}}>★</div>}
      </div>

      {/* Info */}
      <div style={{flex:1,minWidth:180}}>
        <div style={{display:"flex",alignItems:"baseline",gap:8,flexWrap:"wrap"}}>
          <div style={{fontFamily:t.headingFont,fontSize:24,fontWeight:700,color:t.text,lineHeight:1.1}}>{profile.username}</div>
          {profile.username?.toLowerCase()==="naturebanana"&&<span style={{fontSize:9,fontWeight:600,letterSpacing:".14em",textTransform:"uppercase",color:t.accent,opacity:.5}}>creator</span>}
        </div>
        <div style={{fontSize:13,color:t.textDim,marginTop:3,display:"flex",gap:10,flexWrap:"wrap"}}>
          {profile.name&&<span style={{color:t.textMid}}>{profile.name}</span>}
          {profile.league&&<span style={{color:t.accent,fontWeight:600,display:"inline-flex",alignItems:"center",gap:4}}><Ico size={12}>🏆</Ico> {profile.league}</span>}
          {joined&&<span style={{display:"inline-flex",alignItems:"center",gap:4}}><Ico size={12}>📅</Ico> Since {joined}</span>}
          <span style={{display:"inline-flex",alignItems:"center",gap:4}}><Ico size={12}>👥</Ico> {(profile.followers||0).toLocaleString()}</span>
        </div>

        {/* Personality label */}
        {p && <div style={{marginTop:10,display:"flex",alignItems:"center",gap:8}}>
          <Ico size={20}>{p.icon}</Ico>
          <div>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:p.titleColor,opacity:.8,fontFamily:t.font}}>Chess Personality</div>
            <div style={{fontFamily:t.headingFont,fontSize:16,fontWeight:700,color:p.titleColor,animation:"glow 3s ease-in-out infinite",overflowWrap:"anywhere",lineHeight:1.2}}>{p.title}</div>
          </div>
        </div>}

        {/* Rating pills */}
        <div style={{display:"flex",flexWrap:"wrap",gap:7,marginTop:12}}>
          {ratings.map((r,ri)=>(
            <div key={r.tc} className="rating-pill" style={{background:`${t.accent}0e`,border:`1px solid ${t.accent}20`,borderRadius:8,padding:"6px 12px",textAlign:"center",minWidth:64,animation:`scaleIn .3s ${.08+ri*.07}s cubic-bezier(.22,1,.36,1) both`}}>
              <div style={{fontSize:9,color:t.textDim,textTransform:"uppercase",letterSpacing:".07em"}}>{r.tc}</div>
              <div style={{fontSize:20,fontWeight:700,color:t.accent,fontFamily:t.headingFont}}><AnimatedNumber value={r.last} duration={900}/></div>
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
        <div style={{fontSize:11,color:t.textDim,textTransform:"uppercase",letterSpacing:".07em",marginBottom:8,fontFamily:t.font}}>Selected Range W/D/L</div>
        <WDLBar wins={wins} draws={draws} losses={losses} t={t}/>
        <div style={{fontSize:12,color:t.textDim,marginTop:6}}>{total} games · win rates from selected range · ratings from Chess.com</div>
      </div>}
    </div>
  </Card>;
}

function DataTruthStrip({data,months,t}) {
  if (!data) return null;
  const cov=openingCoverage(data.games);
  return <div style={{display:"flex",flexWrap:"wrap",gap:8,alignItems:"center",justifyContent:"center",fontSize:11,color:t.textDim,marginBottom:16,padding:"10px 14px",background:`${t.accent}06`,border:`1px solid ${t.cardBorder}`,borderRadius:10,animation:"fadeInUp .35s .08s cubic-bezier(.22,1,.36,1) both"}}>
    <span><strong style={{color:t.text}}>{data.games.length.toLocaleString()}</strong> archive games</span>
    <span style={{opacity:.35}}>·</span>
    <span>{rangeLabel(months)}</span>
    <span style={{opacity:.35}}>·</span>
    <span style={{color:cov.pct>=90?t.win:cov.pct<70?t.loss:t.textMid}}>{cov.pct}% openings identified</span>
    <span style={{opacity:.35}}>·</span>
    <span>ratings from Chess.com</span>
  </div>;
}

// ── Insights Column ───────────────────────────────────────────────────────────
function InsightCard({item,t}) {
  const iconEl=renderIcon(item.icon,22);
  return <div style={{background:`${t.accent}06`,border:`1px solid ${t.cardBorder}`,borderRadius:10,padding:"14px 16px",display:"flex",gap:12,alignItems:"flex-start",height:"100%"}} className="insight-card">
    <span style={{flexShrink:0}}>{iconEl}</span>
    <div style={{flex:1,minWidth:0}}>
      <div style={{fontSize:10,color:t.textDim,textTransform:"uppercase",letterSpacing:".07em",marginBottom:3,fontFamily:t.font}}>{item.label}</div>
      <div style={{fontSize:14,fontWeight:600,color:item.color||t.text,overflowWrap:"anywhere"}}>{item.value}</div>
      {item.sub&&<div style={{fontSize:11,color:t.textDim,marginTop:2}}>{item.sub}</div>}
      {item.detail&&<div style={{fontSize:12,color:t.textMid,marginTop:8,lineHeight:1.5}}>{item.detail}</div>}
    </div>
  </div>;
}

function InsightsColumn({games,loading,t}) {
  if (loading) return <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:10}}>{[...Array(3)].map((_,i)=><Sk key={i} h={110}/>)}</div>;
  if (!games?.length) return <div style={{color:t.textDim,fontSize:13}}>No games loaded.</div>;
  const items = computeInsights(games);
  if (!items.length) return <div style={{color:t.textDim,fontSize:13}}>Not enough game data for insights.</div>;
  return <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:10}}>
    {items.map((item,i)=><div key={item.id} style={{animation:`fadeInUp .4s ${.05+i*.06}s cubic-bezier(.22,1,.36,1) both`}}><InsightCard item={item} t={t}/></div>)}
  </div>;
}

// ── Full Openings Tab ─────────────────────────────────────────────────────────
function OpeningsTab({games,loading,t}) {
  const [tc,setTc]=useState("all");
  const [sort,setSort]=useState({key:"games",dir:-1});
  const [min,setMin]=useState(1);
  const [animKey,setAnimKey]=useState(0);
  const toggleSort=k=>setSort(s=>({key:k,dir:s.key===k?-s.dir:-1}));
  const tip=(props)=><ChartTip {...props} t={t}/>;
  const data=useMemo(()=>games?.length?aggOpenings(games,tc).filter(o=>o.games>=min):[],[games,tc,min]);
  const sorted=useMemo(()=>[...data].sort((a,b)=>sort.dir*((a[sort.key]??"")<(b[sort.key]??"")? -1:1)),[data,sort]);
  const top10=useMemo(()=>[...data].sort((a,b)=>b.games-a.games).slice(0,10),[data]);
  const cov=useMemo(()=>games?.length?openingCoverage(games):{total:0,named:0,pct:0},[games]);
  const minInsight=useMemo(()=>games?.length?adaptiveMinGames(games.length,8,0.05):8,[games]);
  const baseline=useMemo(()=>{
    if (!games?.length) return null;
    const w=games.filter(g=>g.result==="win").length, l=games.filter(g=>g.result==="loss").length;
    return { winPct:percent(w,games.length), lossPct:percent(l,games.length) };
  },[games]);
  const best=useMemo(()=>{
    if (!data.length||!baseline) return null;
    const sig=data.map(o=>segmentStrength(o,baseline,minInsight)).filter(Boolean).sort((a,b)=>b.score-a.score);
    if (sig[0]) return sig[0];
    return [...data].filter(o=>o.games>=minInsight).sort((a,b)=>b.winPct-a.winPct||b.games-a.games)[0]||null;
  },[data,baseline,minInsight]);
  const worst=useMemo(()=>{
    if (!data.length||!baseline) return null;
    return data.map(o=>segmentWeakness(o,baseline,minInsight,"loss")).filter(Boolean).sort((a,b)=>b.score-a.score)[0]||null;
  },[data,baseline,minInsight]);
  const ecoBreakdown=useMemo(()=>{
    const m={}; data.forEach(o=>{const f=o.ecoFamily||"?"; m[f]=(m[f]||0)+o.games;});
    return Object.entries(m).sort((a,b)=>b[1]-a[1]).map(([family,games])=>({family,games}));
  },[data]);
  const fm=useMemo(()=>{
    if (!games?.length) return {asWhite:[],asBlack:[]};
    const f=tc==="all"?games:games.filter(g=>g.timeControl===tc);
    return firstMoveStats(f);
  },[games,tc]);
  const setTcFilter=x=>{setTc(x);setAnimKey(k=>k+1);};
  const setMinFilter=v=>{setMin(v);setAnimKey(k=>k+1);};

  if (loading) return <div style={{display:"flex",flexDirection:"column",gap:10}}>{[...Array(5)].map((_,i)=><Sk key={i} h={34}/>)}</div>;
  if (!games?.length) return <div style={{color:t.textDim}}>No games.</div>;

  return <div key={animKey} style={{display:"flex",flexDirection:"column",gap:16}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10}}>
      {[
        ["Total Openings",data.length,t.accent],
        ["Games Covered",`${cov.pct}%`,cov.pct>=90?t.win:cov.pct>=70?t.hl:t.loss],
        ["Best Line",best?formatRateValue(best,"win",games.length):"—",t.win,best?`${best.opening}${best.games<minInsight?` · ${formatRateSummary(best,"win",games.length)}`:""}`:null],
        ["Toughest Line",worst?formatRateValue(worst,"loss",games.length):"—",t.loss,worst?`${worst.opening}${worst.games<minInsight?` · ${formatRateSummary(worst,"loss",games.length)}`:""}`:null],
      ].map(([label,val,color,sub],i)=>(
        <Card key={label} t={t} hover={true} style={{padding:"14px 16px",animation:`popIn .4s ${.04+i*.05}s cubic-bezier(.22,1,.36,1) both`}}>
          <div style={{fontSize:10,color:t.textDim,textTransform:"uppercase",letterSpacing:".08em",fontWeight:700,marginBottom:6}}>{label}</div>
          <div style={{fontFamily:t.headingFont,fontSize:26,fontWeight:900,color,lineHeight:1}}>{val}</div>
          {sub&&<div style={{fontSize:11,color:t.textMid,marginTop:4,overflowWrap:"anywhere",lineHeight:1.35}}>{sub}</div>}
        </Card>
      ))}
    </div>

    <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
      <span style={{fontSize:12,color:t.textDim}}>Time control:</span>
      {["all","daily","rapid","blitz","bullet"].map(x=>(
        <button key={x} className={`filter-pill ${tc===x?"active":""}`} onClick={()=>setTcFilter(x)} style={{background:tc===x?`${t.accent}18`:"none",border:`1px solid ${tc===x?t.accent+"60":t.cardBorder}`,borderRadius:20,color:tc===x?t.accent:t.textDim,cursor:"pointer",fontFamily:t.font,fontSize:12,fontWeight:tc===x?600:400,padding:"4px 12px"}}>{x}</button>
      ))}
      <span style={{fontSize:12,color:t.textDim,marginLeft:8}}>Min games:</span>
      <select value={min} onChange={e=>setMinFilter(+e.target.value)}>{[1,2,3,5,10].map(n=><option key={n} value={n}>{n}+</option>)}</select>
      <span style={{fontSize:11,color:t.textDim,marginLeft:8}}>{data.length} openings · {sorted.reduce((a,o)=>a+o.games,0)} games</span>
    </div>

    {ecoBreakdown.length>0&&<Card t={t} style={{padding:"14px 18px"}}>
      <div style={{fontSize:11,color:t.textDim,textTransform:"uppercase",letterSpacing:".08em",fontWeight:700,marginBottom:10}}>ECO Volume Distribution</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {ecoBreakdown.map(({family,games},i)=>{
          const total=data.reduce((a,o)=>a+o.games,0)||1;
          const pct=Math.round(games/total*100);
          const c=ECO_COLORS[family]||t.textDim;
          return <div key={family} style={{flex:"1 1 80px",minWidth:70,animation:`fadeInUp .35s ${.05+i*.04}s cubic-bezier(.22,1,.36,1) both`}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:4}}>
              <span className="eco-badge" style={ecoBadgeStyle(family,t)}>Vol {family}</span>
              <span style={{color:t.textDim}}>{pct}%</span>
            </div>
            <div style={{height:6,borderRadius:3,background:`${c}20`,overflow:"hidden"}}>
              <div className="bar-grow" style={{height:"100%",width:`${pct}%`,background:c,borderRadius:3,animationDelay:`${.1+i*.05}s`}}/>
            </div>
            <div style={{fontSize:10,color:t.textDim,marginTop:3}}>{games} games</div>
          </div>;
        })}
      </div>
    </Card>}

    {(fm.asWhite.length>0||fm.asBlack.length>0)&&<div className="two-col-900" style={{display:"flex",gap:14,flexWrap:"wrap"}}>
      {[[CHESS_WHITE,"Your First Move as White","How you open the game",fm.asWhite.slice(0,4)],[CHESS_BLACK,"Facing White's First Move","Your score against each as Black",fm.asBlack.slice(0,4)]].map(([piece,title,sub,rows],col)=>rows.length>0&&(
        <Card key={title} t={t} style={{flex:1,minWidth:250}}>
          <SecTitle t={t} sub={sub}><ChessIco size={16}>{piece}</ChessIco> {title}</SecTitle>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {rows.map((r,i)=>{
              const maxG=rows[0].games||1;
              const barC=r.winPct>=55?t.win:r.winPct>=45?"#ffc800":t.loss;
              return <div key={r.move} style={{animation:`fadeInUp .4s ${.06+i*.06+col*.05}s cubic-bezier(.22,1,.36,1) both`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:4}}>
                  <span style={{fontFamily:t.headingFont,fontSize:16,fontWeight:800,color:t.text}}>1.{r.move}</span>
                  <span style={{fontSize:12,color:t.textDim}}>{r.games} games · <span style={{color:barC,fontWeight:800}}>{r.winPct}% win</span></span>
                </div>
                <div style={{height:7,borderRadius:4,background:`${t.accent}12`,overflow:"hidden",display:"flex"}}>
                  <div className="bar-grow" style={{height:"100%",width:`${Math.round(r.games/maxG*100)}%`,background:`linear-gradient(90deg,${t.accent2},${barC})`,borderRadius:4,animationDelay:`${.12+i*.06}s`}}/>
                </div>
              </div>;
            })}
          </div>
        </Card>
      ))}
    </div>}

    <Card t={t}>
      <SecTitle t={t}>Top Openings — Outcome Split</SecTitle>
      <ResponsiveContainer width="100%" height={Math.max(180,top10.length*36)}>
        <BarChart data={top10} layout="vertical" margin={{left:160}}>
          <XAxis type="number" domain={[0,100]} tick={{fill:t.textDim,fontSize:10}} axisLine={false} tickLine={false}/>
          <YAxis type="category" dataKey="opening" tick={{fill:t.textMid,fontSize:11}} width={155} axisLine={false} tickLine={false} tickFormatter={v=>v.length>22?v.slice(0,20)+"…":v}/>
          <Tooltip content={tip}/><Legend wrapperStyle={{color:t.textMid,fontSize:12}}/>
          <Bar dataKey="winPct" name="Win %" stackId="a" fill={t.win} isAnimationActive animationDuration={700} animationBegin={100}/>
          <Bar dataKey="drawPct" name="Draw %" stackId="a" fill={t.draw} isAnimationActive animationDuration={700} animationBegin={200}/>
          <Bar dataKey="lossPct" name="Loss %" stackId="a" fill={t.loss} radius={[0,4,4,0]} isAnimationActive animationDuration={700} animationBegin={300}/>
        </BarChart>
      </ResponsiveContainer>
    </Card>
    <Card t={t}>
      <SecTitle t={t} sub={`${sorted.length} openings sorted by ${sort.key}`}>All Openings</SecTitle>
      <div style={{overflowX:"auto"}}>
        <table>
          <thead><tr>{[["opening","Opening"],["eco","ECO"],["games","Games"],["winPct","Win%"],["lossPct","Loss%"],["drawPct","Draw%"],["avgOpp","Avg Opp"]].map(([k,l])=><th key={k} onClick={()=>toggleSort(k)}>{l}{sort.key===k?sort.dir===1?" ↑":" ↓":""}</th>)}</tr></thead>
          <tbody>{sorted.map((o,i)=>(
            <tr key={o.opening} className="opening-row" style={{animation:`slideUp .3s ${Math.min(i*.02,.4)}s cubic-bezier(.22,1,.36,1) both`}}>
              <td style={{color:t.text,maxWidth:240,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.opening}</td>
              <td>{o.eco&&o.eco!=="?"?<span className="eco-badge" style={ecoBadgeStyle(o.ecoFamily,t)}>{o.eco}</span>:<span style={{color:t.textDim,fontSize:11}}>—</span>}</td>
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
  const Panel=({label,s,icon,anim})=>{
    const tot=s.total||1;
    return <Card t={t} style={{flex:1,minWidth:200,animation:`${anim||"revealCard"} .5s cubic-bezier(.22,1,.36,1) both`}}>
      <div style={{fontFamily:t.headingFont,fontSize:18,fontWeight:700,color:t.text,marginBottom:4,display:"flex",alignItems:"center",gap:8}}>
        {icon===CHESS_WHITE||icon===CHESS_BLACK?<ChessIco size={18}>{icon}</ChessIco>:<Ico size={18}>{icon}</Ico>} {label}
      </div>
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
  const wWp=percent(white.wins,white.total), bWp=percent(black.wins,black.total);
  const gap=Math.abs(wWp-bWp);
  const minInsight=adaptiveMinGames(games.length,8,0.05);
  const baseline={ winPct:percent(games.filter(g=>g.result==="win").length,games.length), lossPct:percent(games.filter(g=>g.result==="loss").length,games.length) };
  const colorOpenings=color=>{
    const ops=aggOpenings(games.filter(g=>g.color===color));
    const strengths=ops.map(o=>segmentStrength(o,baseline,minInsight)).filter(Boolean).sort((a,b)=>b.score-a.score);
    const weaknesses=ops.map(o=>segmentWeakness(o,baseline,minInsight,"loss")).filter(Boolean).sort((a,b)=>b.score-a.score);
    return { best:strengths[0]||null, worst:weaknesses[0]||null };
  };
  const wOps=colorOpenings("white"), bOps=colorOpenings("black");
  const tcColor=["bullet","blitz","rapid","daily"].map(tc=>{
    const w=games.filter(g=>g.timeControl===tc&&g.color==="white"), b=games.filter(g=>g.timeControl===tc&&g.color==="black");
    if (w.length+b.length<6) return null;
    return {name:tc,White:percent(w.filter(g=>g.result==="win").length,w.length),Black:percent(b.filter(g=>g.result==="win").length,b.length)};
  }).filter(Boolean);

  return <div style={{display:"flex",flexDirection:"column",gap:16}}>
    <div style={{display:"flex",gap:14,flexWrap:"wrap"}}><Panel label="White" s={white} icon={CHESS_WHITE} anim="slideInLeft"/><Panel label="Black" s={black} icon={CHESS_BLACK} anim="slideInRight"/></div>

    {/* Color gap verdict */}
    <Card t={t} hover={false} style={{display:"flex",gap:18,alignItems:"center",flexWrap:"wrap",justifyContent:"center",textAlign:"center",animation:"blurIn .55s .08s cubic-bezier(.22,1,.36,1) both"}}>
      <RingGauge value={100-Math.min(gap*3,100)} size={86} stroke={8} color={gap<=5?t.win:gap<=12?"#ffc800":t.loss} t={t} label="balance"/>
      <div style={{maxWidth:520}}>
        <div style={{fontFamily:t.headingFont,fontSize:20,fontWeight:900,color:t.text}}>
          {gap<=5?"Perfectly two-handed":gap<=12?`${wWp>bWp?"White":"Black"} leans ${gap}% ahead`:`${wWp>bWp?"White":"Black"} carries you by ${gap}%`}
        </div>
        <div style={{fontSize:13,color:t.textMid,lineHeight:1.6,marginTop:6}}>
          White {wWp}% · Black {bWp}%. {gap<=5?"No color gap worth fixing — pairings can't hurt you.":gap<=12?"A mild gap; worth one study session on your weaker color's first 10 moves.":"A real leak. Half your games start in your weak color — patching it is the cheapest rating gain available."}
        </div>
      </div>
    </Card>

    {/* Best weapon / worst leak per color */}
    <Reveal><div className="two-col-900" style={{display:"flex",gap:14,flexWrap:"wrap"}}>
      {[[CHESS_WHITE,"White",wOps],[CHESS_BLACK,"Black",bOps]].map(([piece,label,ops])=>(
        <Card key={label} t={t} style={{flex:1,minWidth:250}}>
          <SecTitle t={t} sub={`Best weapon and biggest leak (${minInsight}+ games in range)`}><ChessIco size={16}>{piece}</ChessIco> {label} Repertoire</SecTitle>
          <div style={{display:"flex",flexDirection:"column",gap:9}}>
            {ops.best&&<div className="weapon-card" style={{background:`${t.win}0b`,border:`1px solid ${t.win}25`,borderRadius:12,padding:"11px 13px",animation:"slideInLeft .45s cubic-bezier(.22,1,.36,1) both"}}>
              <div style={{fontSize:10,color:t.win,textTransform:"uppercase",letterSpacing:".1em",fontWeight:800,marginBottom:4,display:"flex",alignItems:"center",gap:4}}><Ico size={10}>⭐</Ico> Weapon</div>
              <a href={openingLink(ops.best.opening,ops.best.openingUrl)} target="_blank" rel="noopener noreferrer" style={{fontSize:13,fontWeight:700,color:t.text,textDecoration:"none",overflowWrap:"anywhere"}}>{ops.best.opening}</a>
              <div style={{fontSize:11,color:t.textDim,marginTop:3}}>{formatRateSummary(ops.best,"win",games.length)}{ops.best.eco!=="?"?` · ${ops.best.eco}`:""}</div>
            </div>}
            {ops.worst&&<div className="weapon-card" style={{background:`${t.loss}0b`,border:`1px solid ${t.loss}25`,borderRadius:12,padding:"11px 13px",animation:"slideInRight .45s .06s cubic-bezier(.22,1,.36,1) both"}}>
              <div style={{fontSize:10,color:t.loss,textTransform:"uppercase",letterSpacing:".1em",fontWeight:800,marginBottom:4,display:"flex",alignItems:"center",gap:4}}><Ico size={10}>💀</Ico> Leak</div>
              <a href={openingLink(ops.worst.opening,ops.worst.openingUrl)} target="_blank" rel="noopener noreferrer" style={{fontSize:13,fontWeight:700,color:t.text,textDecoration:"none",overflowWrap:"anywhere"}}>{ops.worst.opening}</a>
              <div style={{fontSize:11,color:t.textDim,marginTop:3}}>{formatRateSummary(ops.worst,"loss",games.length)}{ops.worst.eco!=="?"?` · ${ops.worst.eco}`:""}</div>
            </div>}
            {!ops.best&&!ops.worst&&<div style={{color:t.textDim,fontSize:13}}>Not enough repeated openings with this color yet.</div>}
          </div>
        </Card>
      ))}
    </div></Reveal>

    <Reveal><Card t={t}>
      <SecTitle t={t}>White vs Black</SecTitle>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={[{name:"Win%",White:wWp,Black:bWp},{name:"Draw%",White:percent(white.draws,white.total),Black:percent(black.draws,black.total)},{name:"Loss%",White:percent(white.losses,white.total),Black:percent(black.losses,black.total)}]}>
          <XAxis dataKey="name" tick={{fill:t.textDim,fontSize:12}} axisLine={false} tickLine={false}/>
          <YAxis domain={[0,100]} tick={{fill:t.textDim,fontSize:11}} axisLine={false} tickLine={false}/>
          <Tooltip content={tip}/>
          <Bar dataKey="White" fill="#f8c840" radius={[4,4,0,0]} isAnimationActive animationDuration={700}/><Bar dataKey="Black" fill="#6e7ff3" radius={[4,4,0,0]} isAnimationActive animationDuration={700} animationBegin={150}/>
          <Legend wrapperStyle={{color:t.textMid,fontSize:12}}/>
        </BarChart>
      </ResponsiveContainer>
    </Card></Reveal>

    {tcColor.length>0&&<Reveal><Card t={t}>
      <SecTitle t={t} sub="Win% as each color, per time control">Color × Time Control</SecTitle>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={tcColor} barCategoryGap="25%">
          <XAxis dataKey="name" tick={{fill:t.textDim,fontSize:12}} axisLine={false} tickLine={false}/>
          <YAxis domain={[0,100]} tick={{fill:t.textDim,fontSize:10}} axisLine={false} tickLine={false} width={30}/>
          <Tooltip content={tip}/>
          <Bar dataKey="White" fill="#f8c840" radius={[4,4,0,0]} isAnimationActive animationDuration={700}/>
          <Bar dataKey="Black" fill="#6e7ff3" radius={[4,4,0,0]} isAnimationActive animationDuration={700} animationBegin={120}/>
          <Legend wrapperStyle={{color:t.textMid,fontSize:12}}/>
        </BarChart>
      </ResponsiveContainer>
    </Card></Reveal>}
  </div>;
}

// ── Elo Tab ───────────────────────────────────────────────────────────────────
function EloTab({games,loading,t}) {
  const tip=(props)=><ChartTip {...props} t={t}/>;
  if (loading) return <Sk h={240}/>;
  if (!games?.length) return <div style={{color:t.textDim}}>No games.</div>;
  const data=eloBrackets(games);
  const avgOpp=(() => { const e=games.filter(g=>g.oppElo).map(g=>g.oppElo); return e.length?Math.round(e.reduce((a,b)=>a+b,0)/e.length):0; })();
  const dg=davidGoliath(games);
  const upsets=biggestUpsets(games,5);
  const dgRows=[
    dg.up&&{label:"Punching up",sub:"opponent 50+ above you",icon:"🏔",...dg.up,color:"#a78bfa"},
    dg.even&&{label:"Even matchups",sub:"within ±50 points",icon:"⚖",...dg.even,color:t.accent},
    dg.down&&{label:"Punching down",sub:"opponent 50+ below you",icon:"🎯",...dg.down,color:t.win},
  ].filter(Boolean);

  return <div style={{display:"flex",flexDirection:"column",gap:16}}>
    <Card t={t} style={{animation:"blurIn .5s cubic-bezier(.22,1,.36,1) both"}}>
      <SecTitle t={t} sub={`Avg opponent: ${avgOpp} · bar width shows sample size below`}>Win% by Opponent Rating</SecTitle>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <XAxis dataKey="label" tick={{fill:t.textDim,fontSize:11}} axisLine={false} tickLine={false}/>
          <YAxis domain={[0,100]} tick={{fill:t.textDim,fontSize:11}} axisLine={false} tickLine={false}/>
          <Tooltip content={tip}/>
          <Bar dataKey="winPct" name="Win%" radius={[5,5,0,0]} isAnimationActive animationDuration={800}>{data.map((e,i)=><Cell key={i} fill={e.winPct>=55?t.win:e.winPct>=45?"#ffc800":t.loss}/>)}</Bar>
        </BarChart>
      </ResponsiveContainer>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:8}}>
        {data.map((b,i)=>(
          <div key={b.label} style={{flex:"1 1 80px",background:`${t.accent}08`,border:`1px solid ${t.cardBorder}`,borderRadius:8,padding:"6px 10px",textAlign:"center",animation:`fadeInUp .35s ${.05+i*.04}s cubic-bezier(.22,1,.36,1) both`}}>
            <div style={{fontSize:9,color:t.textDim}}>{b.label}</div>
            <div style={{fontSize:14,fontWeight:800,color:t.text,fontFamily:t.headingFont}}>{b.games}</div>
            <div style={{fontSize:9,color:t.textDim}}>games</div>
          </div>
        ))}
      </div>
    </Card>

    {dgRows.length>0&&<Reveal><Card t={t} hover={false}>
      <SecTitle t={t} sub="Score split by rating difference in each individual game">David vs Goliath</SecTitle>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:12}}>
        {dgRows.map((r,i)=>(
          <div key={r.label} style={{display:"flex",gap:14,alignItems:"center",background:`${r.color}08`,border:`1px solid ${r.color}25`,borderRadius:14,padding:14,animation:`flipIn .5s ${.06+i*.08}s cubic-bezier(.22,1,.36,1) both`}}>
            <RingGauge value={r.winPct} size={66} stroke={6} color={r.color} t={t} delay={i*.08}/>
            <div>
              <div style={{fontSize:14,fontWeight:800,color:t.text,display:"flex",alignItems:"center",gap:6}}>{renderIcon(r.icon,14)} {r.label}</div>
              <div style={{fontSize:11,color:t.textDim,marginTop:2}}>{r.sub}</div>
              <div style={{fontSize:11,color:r.color,fontWeight:700,marginTop:3}}>{r.games} games</div>
            </div>
          </div>
        ))}
      </div>
      {dg.up&&dg.down&&dg.up.winPct>=40&&<div style={{fontSize:12,color:t.accent,marginTop:12,fontWeight:600,display:"flex",alignItems:"center",gap:6}}><Ico size={12}>💡</Ico> You win {dg.up.winPct}% even against stronger opposition — you're underrated. Seek harder pairings.</div>}
    </Card></Reveal>}

    {upsets.length>0&&<Reveal><Card t={t} hover={false}>
      <SecTitle t={t} sub="Wins against opponents rated above you in that game">Biggest Giant Kills</SecTitle>
      <div style={{display:"flex",flexDirection:"column",gap:7}}>
        {upsets.map((u,i)=>(
          <div key={`${u.opponent}-${u.endTime}`} className="rival-row" style={{display:"grid",gridTemplateColumns:"auto 1fr auto",gap:12,alignItems:"center",background:`${t.win}07`,border:`1px solid ${t.win}20`,borderRadius:11,padding:"10px 13px",animation:`slideUp .35s ${.06+i*.06}s cubic-bezier(.22,1,.36,1) both`}}>
            <div style={{fontSize:20}}>{renderIcon(i===0?"👑":"⚔",20)}</div>
            <div style={{minWidth:0}}>
              <div style={{fontSize:13,fontWeight:700,color:t.text,overflowWrap:"anywhere"}}>beat {u.opponent} <span style={{color:t.win}}>({u.oppElo})</span> as a {u.myElo}</div>
              <div style={{fontSize:11,color:t.textDim,marginTop:2}}>{u.opening||"Unknown opening"} · {u.timeControl}{u.date?` · ${u.date}`:""}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontFamily:t.headingFont,fontSize:20,fontWeight:900,color:t.win}}>+{u.diff}</div>
              <div style={{fontSize:9,color:t.textDim,textTransform:"uppercase",letterSpacing:".06em"}}>elo gap</div>
            </div>
          </div>
        ))}
      </div>
    </Card></Reveal>}
  </div>;
}

// ── Compare Tab ───────────────────────────────────────────────────────────────
function CompareTab({p1,p2,l1,l2,p2In,setP2In,loadP2,e2,months,t,onChangeP2}) {
  const tip=(props)=><ChartTip {...props} t={t}/>;
  const u1=p1?.profile?.username||"Player 1", u2=p2?.profile?.username||"Player 2";

  if (!p2 && !l2) return <div style={{display:"flex",flexDirection:"column",gap:16,animation:"fadeInUp .45s cubic-bezier(.22,1,.36,1) both"}}>
    <div style={{textAlign:"center",padding:"24px 0 12px",color:t.textDim}}>
      <div style={{marginBottom:10,animation:"float 3s ease-in-out infinite",display:"inline-block"}}><Ico size={48}>⚔</Ico></div>
      <div style={{fontFamily:t.headingFont,fontSize:20,color:t.textMid,marginBottom:6}}>Head-to-Head</div>
      <div style={{fontSize:13}}>Compare stats for the same {rangeLabel(months)} window</div>
    </div>
    <Card t={t}><div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
      <input placeholder="Opponent username…" value={p2In} onChange={e=>setP2In(e.target.value)} onKeyDown={e=>e.key==="Enter"&&loadP2()} style={{flex:1,minWidth:180}}/>
      <button className="primary" onClick={loadP2} disabled={!p2In.trim()||l2}>{l2?<span style={{display:"inline-flex",alignItems:"center",gap:8}}><span style={{width:14,height:14,border:`2px solid ${t.btnColor}`,borderTopColor:"transparent",borderRadius:"50%",display:"inline-block",animation:"spin .8s linear infinite"}}/>Loading…</span>:"Compare"}</button>
    </div>
    {e2&&<div className="error-shake" style={{marginTop:12,fontSize:13,color:t.loss,padding:"8px 14px",background:`${t.loss}12`,border:`1px solid ${t.loss}30`,borderRadius:8,display:"inline-block"}}>⚠ {e2}</div>}
    </Card>
  </div>;

  if (l2 || (l1 && !p1)) return <div style={{display:"flex",flexDirection:"column",gap:12,animation:"fadeIn .2s ease both"}}><Sk h={120}/><Sk h={260}/></div>;
  if (!p1 || !p2) return null;

  const norm=(v,mx)=>Math.round((v/Math.max(mx,1))*100);
  const p1r=primaryRating(p1.stats), p2r=primaryRating(p2.stats);
  const p1w=p1.games.length?Math.round(p1.games.filter(g=>g.result==="win").length/p1.games.length*100):0;
  const p2w=p2.games.length?Math.round(p2.games.filter(g=>g.result==="win").length/p2.games.length*100):0;
  const p1pz=p1.stats?.tactics?.highest?.rating||0, p2pz=p2.stats?.tactics?.highest?.rating||0;
  const elos1=p1.games.filter(g=>g.oppElo).map(g=>g.oppElo), elos2=p2.games.filter(g=>g.oppElo).map(g=>g.oppElo);
  const ao1=elos1.length?Math.round(elos1.reduce((a,b)=>a+b,0)/elos1.length):0, ao2=elos2.length?Math.round(elos2.reduce((a,b)=>a+b,0)/elos2.length):0;
  const d1=uniqueNamedOpenings(p1.games), d2=uniqueNamedOpenings(p2.games);
  const radar=[
    {subject:"Win%",[u1]:p1w,[u2]:p2w},
    {subject:"Rating",[u1]:norm(p1r,Math.max(p1r,p2r)),[u2]:norm(p2r,Math.max(p1r,p2r))},
    {subject:"Puzzle",[u1]:norm(p1pz,Math.max(p1pz,p2pz)),[u2]:norm(p2pz,Math.max(p1pz,p2pz))},
    {subject:"Avg Opp",[u1]:norm(ao1,Math.max(ao1,ao2)),[u2]:norm(ao2,Math.max(ao1,ao2))},
    {subject:"Diversity",[u1]:norm(d1,Math.max(d1,d2)),[u2]:norm(d2,Math.max(d1,d2))},
  ];
  const p1openMap=Object.fromEntries(aggOpenings(p1.games).map(o=>[o.opening,o]));
  const p2openMap=Object.fromEntries(aggOpenings(p2.games).map(o=>[o.opening,o]));
  const shared=Object.keys({...p1openMap,...p2openMap})
    .filter(name=>p1openMap[name]&&p2openMap[name]&&p1openMap[name].games>=8&&p2openMap[name].games>=8)
    .map(name=>({opening:name.length>18?name.slice(0,16)+"…":name,[u1]:p1openMap[name].winPct,[u2]:p2openMap[name].winPct,total:p1openMap[name].games+p2openMap[name].games}))
    .sort((a,b)=>b.total-a.total)
    .slice(0,8);

  const statRows=[
    ["Games analyzed",p1.games.length,p2.games.length,false],
    ["Win rate",`${p1w}%`,`${p2w}%`,true],
    ["Draw rate",`${p1.games.length?Math.round(p1.games.filter(g=>g.result==="draw").length/p1.games.length*100):0}%`,`${p2.games.length?Math.round(p2.games.filter(g=>g.result==="draw").length/p2.games.length*100):0}%`,false],
    ["Avg opponent",ao1||"—",ao2||"—",true],
    ["Openings played",d1,d2,true],
    ["Puzzle peak",p1pz||"—",p2pz||"—",true],
    ...["rapid","blitz","bullet","daily"].flatMap(tc=>{
      const r1=getRating(p1.stats,tc), r2=getRating(p2.stats,tc);
      if (!r1.last && !r2.last) return [];
      return [[`${tc} rating`, r1.last||"—", r2.last||"—", true]];
    }),
  ];

  const MiniCard=({p,accent,anim})=>{
    const dna=computePersonality(p.games,p.stats,p.profile);
    const form=p.games.slice(0,12);
    return <Card t={t} style={{flex:1,minWidth:180,animation:`${anim} .55s cubic-bezier(.22,1,.36,1) both`}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
        <div style={{width:44,height:44,borderRadius:"50%",border:`2px solid ${accent}50`,overflow:"hidden",background:t.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0,boxShadow:`0 0 18px ${accent}25`}}>
          {p.profile.avatar?<img src={p.profile.avatar} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none";}}/>:<ChessIco size={20}>♟</ChessIco>}
        </div>
        <div><div style={{fontFamily:t.headingFont,fontSize:16,fontWeight:700,color:accent}}>{p.profile.username}</div><div style={{fontSize:11,color:t.textDim}}>{p.games.length} games · {rangeLabel(months)}</div></div>
      </div>
      {dna&&<div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10,background:`${accent}0c`,border:`1px solid ${accent}22`,borderRadius:8,padding:"5px 10px"}}>
        {renderIcon(dna.icon,14)}
        <span style={{fontSize:11,fontWeight:700,color:accent,overflowWrap:"anywhere",lineHeight:1.3}}>{dna.title}</span>
      </div>}
      {getAllRatings(p.stats).map(r=>(
        <div key={r.tc} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${t.cardBorder}40`,fontSize:13}}>
          <span style={{color:t.textDim,textTransform:"capitalize"}}>{r.tc}</span>
          <span style={{color:t.text,fontWeight:600}}>{r.last}{r.best&&r.best>r.last?<span style={{color:t.textDim,fontSize:10,marginLeft:4}}>↑{r.best}</span>:null}</span>
        </div>
      ))}
      <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",fontSize:13}}><span style={{color:t.textDim}}>Win rate</span><span style={{color:accent,fontWeight:700}}>{p.games.length?Math.round(p.games.filter(g=>g.result==="win").length/p.games.length*100):0}%</span></div>
      {form.length>0&&<div style={{marginTop:6}}>
        <div style={{fontSize:9,color:t.textDim,textTransform:"uppercase",letterSpacing:".08em",marginBottom:5}}>Last {form.length}</div>
        <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
          {form.map((g,i)=><div key={i} className="pop-in" title={`${g.result} vs ${g.opponent||"?"}`} style={{width:13,height:13,borderRadius:3,background:g.result==="win"?t.win:g.result==="loss"?t.loss:t.draw,opacity:.9,animationDelay:`${i*.04}s`}}/>)}
        </div>
      </div>}
    </Card>;
  };

  return <div style={{display:"flex",flexDirection:"column",gap:16,animation:"fadeInUp .4s cubic-bezier(.22,1,.36,1) both"}}>
    <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap",justifyContent:"space-between"}}>
      <div style={{fontSize:12,color:t.textDim}}>Ratings from Chess.com · Win rates from loaded games ({rangeLabel(months)})</div>
      <button className="secondary" onClick={onChangeP2}>Change opponent</button>
    </div>

    <div style={{display:"flex",gap:12,alignItems:"stretch",flexWrap:"wrap"}}>
      <MiniCard p={p1} accent={P1_COLOR} anim="revealCardLeft"/>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"0 4px",minWidth:48}}>
        <div style={{fontFamily:t.headingFont,fontSize:28,fontWeight:900,color:t.textDim,textShadow:`0 0 20px ${t.glowC}`,animation:"glowPulse 2.4s ease-in-out infinite",borderRadius:12,padding:"8px 12px"}}>VS</div>
      </div>
      <MiniCard p={p2} accent={P2_COLOR} anim="slideInRight"/>
    </div>

    <Card t={t} className="stagger-2"><SecTitle t={t} sub="Side-by-side from Chess.com and loaded archives">Stat Comparison</SecTitle>
      <div style={{overflowX:"auto"}}>
        <table>
          <thead><tr><th>Metric</th><th style={{color:P1_COLOR}}>{u1}</th><th style={{color:P2_COLOR}}>{u2}</th></tr></thead>
          <tbody>{statRows.map(([label,v1,v2,higherBetter],i)=>(
            <tr key={label} style={{animation:`fadeInUp .35s ${.04+i*.03}s cubic-bezier(.22,1,.36,1) both`}}>
              <td style={{color:t.textMid}}>{label}</td>
              <td style={{color:typeof v1==="number"&&typeof v2==="number"&&higherBetter&&v1>v2?P1_COLOR:t.text,fontWeight:600}}>{v1}</td>
              <td style={{color:typeof v1==="number"&&typeof v2==="number"&&higherBetter&&v2>v1?P2_COLOR:t.text,fontWeight:600}}>{v2}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </Card>

    <Card t={t} className="stagger-3"><SecTitle t={t} sub="Normalized for shape — see table above for exact ratings">Radar Comparison</SecTitle>
      <ResponsiveContainer width="100%" height={250}>
        <RadarChart data={radar} cx="50%" cy="50%">
          <PolarGrid stroke={`${t.accent}15`}/><PolarAngleAxis dataKey="subject" tick={{fill:t.textMid,fontSize:12}}/><PolarRadiusAxis tick={false} axisLine={false} domain={[0,100]}/>
          <Radar name={u1} dataKey={u1} stroke={P1_COLOR} fill={P1_FILL} fillOpacity={1} animationDuration={800}/>
          <Radar name={u2} dataKey={u2} stroke={P2_COLOR} fill={P2_FILL} fillOpacity={1} animationDuration={900}/>
          <Legend wrapperStyle={{color:t.textMid,fontSize:12,fontFamily:t.font}}/><Tooltip content={tip}/>
        </RadarChart>
      </ResponsiveContainer>
    </Card>

    <Card t={t} className="stagger-4">
      <SecTitle t={t} sub={shared.length?"Openings both players have played (8+ games each)":"No shared openings with enough games"}>Shared Opening Win%</SecTitle>
      {shared.length ? <ResponsiveContainer width="100%" height={Math.max(180,shared.length*34)}>
        <BarChart data={shared} layout="vertical" margin={{left:125}}>
          <XAxis type="number" domain={[0,100]} tick={{fill:t.textDim,fontSize:10}} axisLine={false} tickLine={false}/>
          <YAxis type="category" dataKey="opening" tick={{fill:t.textMid,fontSize:11}} width={120} axisLine={false} tickLine={false}/>
          <Tooltip content={tip}/>
          <Bar dataKey={u1} fill={P1_COLOR} radius={[0,4,4,0]} animationDuration={700}/>
          <Bar dataKey={u2} fill={P2_COLOR} radius={[0,4,4,0]} animationDuration={800}/>
          <Legend wrapperStyle={{color:t.textMid,fontSize:12}}/>
        </BarChart>
      </ResponsiveContainer> : <div style={{color:t.textDim,fontSize:13,padding:"12px 0"}}>Try a wider range or a different opponent.</div>}
    </Card>
  </div>;
}

// ── Win Plan Tab ───────────────────────────────────────────────────────────────
function ConfPill({tier,color,t}) {
  const c=color||{High:t.win,Medium:"#ffc800",Low:t.hl,Insufficient:t.textDim}[tier]||t.textDim;
  return <span style={{fontSize:9,fontWeight:800,textTransform:"uppercase",letterSpacing:".1em",padding:"3px 8px",borderRadius:999,background:`${c}18`,border:`1px solid ${c}40`,color:c,flexShrink:0}}>{tier}</span>;
}

function DeltaBadge({delta,t,inverse=false}) {
  const d=inverse?-delta:delta;
  const c=d>=12?t.loss:d>=6?"#ffc800":t.textDim;
  return <span style={{fontFamily:t.headingFont,fontSize:13,fontWeight:900,color:c}}>{d>0?`+${d}`:d}pp</span>;
}

function WinPlanTab({p1,p2,l1,l2,p2In,setP2In,loadP2,e2,months,t,onChangeP2}) {
  if (!p2 && !l2) return <div style={{display:"flex",flexDirection:"column",gap:16,animation:"fadeInUp .45s cubic-bezier(.22,1,.36,1) both"}}>
    <Card t={t} glow={true} hover={false} style={{textAlign:"center",padding:"34px 26px",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:-120,background:`radial-gradient(circle at 35% 0%,${t.accent}22,transparent 38%)`,animation:"auroraDrift 10s ease-in-out infinite",pointerEvents:"none"}}/>
      <div style={{position:"relative"}}>
        <div style={{marginBottom:10,animation:"float 3s ease-in-out infinite",display:"inline-block"}}><Ico size={54}>🎯</Ico></div>
        <div style={{fontFamily:t.headingFont,fontSize:"clamp(32px,6vw,58px)",lineHeight:1.05,fontWeight:900,color:t.accent,letterSpacing:"-.035em",overflowWrap:"anywhere"}}>Calculate how to beat an opponent</div>
        <div style={{fontSize:14,color:t.textMid,maxWidth:720,margin:"12px auto 0",lineHeight:1.65}}>Deep archive analysis with sample-size gates — openings, exact move orders, time controls, and session patterns. No "3 games = bad opening" noise.</div>
      </div>
    </Card>
    <Card t={t}><div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
      <input placeholder="Opponent username…" value={p2In} onChange={e=>setP2In(e.target.value)} onKeyDown={e=>e.key==="Enter"&&loadP2()} style={{flex:1,minWidth:180}}/>
      <button className="primary" onClick={loadP2} disabled={!p2In.trim()||l2}>{l2?<span style={{display:"inline-flex",alignItems:"center",gap:8}}><span style={{width:14,height:14,border:`2px solid ${t.btnColor}`,borderTopColor:"transparent",borderRadius:"50%",display:"inline-block",animation:"spin .8s linear infinite"}}/>Analyzing…</span>:"Build Win Plan"}</button>
    </div>
    {e2&&<div className="error-shake" style={{marginTop:12,fontSize:13,color:t.loss,padding:"8px 14px",background:`${t.loss}12`,border:`1px solid ${t.loss}30`,borderRadius:8,display:"inline-block"}}>⚠ {e2}</div>}
    </Card>
  </div>;

  if (l2 || (l1 && !p1)) return <div style={{display:"flex",flexDirection:"column",gap:12,animation:"fadeIn .2s ease both"}}><Sk h={170}/><Sk h={260}/><Sk h={220}/><Sk h={300}/></div>;
  if (!p2) return null;
  const plan=computeWinPlan(p1,p2,months);
  if (!plan) return <div style={{color:t.textDim}}>Not enough opponent games loaded.</div>;

  const Pill=({label,value,sub,color=t.accent,i=0})=><div style={{background:`${color}10`,border:`1px solid ${color}28`,borderRadius:14,padding:"12px 14px",minWidth:110,flex:"1 1 110px",animation:`popIn .4s ${.06+i*.05}s cubic-bezier(.22,1,.36,1) both`}}>
    <div style={{fontSize:10,color:t.textDim,textTransform:"uppercase",letterSpacing:".1em",fontWeight:700,marginBottom:5}}>{label}</div>
    <div style={{fontFamily:t.headingFont,fontSize:22,lineHeight:1.1,color,overflowWrap:"anywhere",fontWeight:900}}>{value}</div>
    {sub&&<div style={{fontSize:10,color:t.textDim,marginTop:4}}>{sub}</div>}
  </div>;
  const confColor=plan.confidence>=70?t.win:plan.confidence>=45?"#ffc800":t.loss;
  const maxFlagScore=Math.max(1,...plan.riskFlags.map(f=>f.score));
  const oppTod=timeOfDayStats(p2.games);
  const cov=openingCoverage(p2.games);

  const copyCheatSheet=()=>{
    const text=[`HOW TO BEAT ${plan.oppName.toUpperCase()} — cheat sheet (${plan.monthsLabel}, ${plan.total} games)`,
      `Baseline: ${plan.winPct}% win · thresholds: ${plan.methodology.minOpening}+ games/opening`,
      ...plan.cheatSheet.map(([k,v],i)=>`${i+1}. ${k}: ${v}`)].join("\n");
    navigator.clipboard.writeText(text);
  };

  const ExploitCard=({f,i})=><div key={f.id} className="dim-card" style={{background:`linear-gradient(145deg,${t.loss}08,${t.card})`,border:`1px solid ${t.loss}22`,borderRadius:16,padding:18,animation:`flipIn .5s ${.04+i*.06}s cubic-bezier(.22,1,.36,1) both`,display:"flex",flexDirection:"column",gap:10}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
      <div style={{display:"flex",gap:12,alignItems:"flex-start",minWidth:0,flex:1}}>
        <div style={{width:38,height:38,borderRadius:13,background:`${t.loss}14`,border:`1px solid ${t.loss}30`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{renderIcon(f.icon,18)}</div>
        <div style={{minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:5}}>
            <span style={{fontSize:9,color:t.textDim,textTransform:"uppercase",letterSpacing:".1em",fontWeight:800}}>{f.category}</span>
            <ConfPill tier={f.confidence} color={f.confidenceColor} t={t}/>
          </div>
          <div style={{fontFamily:t.headingFont,fontSize:18,lineHeight:1.15,color:t.text,fontWeight:900,overflowWrap:"anywhere"}}>{f.label}</div>
        </div>
      </div>
      <div style={{textAlign:"right",flexShrink:0}}>
        <div style={{fontSize:10,color:t.textDim,fontWeight:700}}>n={f.games}</div>
        {f.delta!=null&&<DeltaBadge delta={f.delta} t={t}/>}
      </div>
    </div>
    <div style={{fontSize:13,color:t.loss,fontWeight:800,overflowWrap:"anywhere"}}>{f.value}</div>
    <div style={{height:5,borderRadius:3,background:`${t.loss}14`,overflow:"hidden"}}>
      <div className="bar-grow" style={{height:"100%",width:`${Math.round(f.score/maxFlagScore*100)}%`,background:`linear-gradient(90deg,#ffc800,${t.loss})`,borderRadius:3,animationDelay:`${.15+i*.07}s`}}/>
    </div>
    <div style={{fontSize:12,color:t.textMid,lineHeight:1.6}}>{f.detail}</div>
  </div>;

  return <div style={{display:"flex",flexDirection:"column",gap:18,animation:"fadeInUp .45s cubic-bezier(.22,1,.36,1) both"}}>
    {/* Hero */}
    <Card t={t} glow={true} hover={false} style={{padding:"30px 28px",position:"relative",overflow:"hidden"}} className="card-pad-sm">
      <div style={{position:"absolute",inset:-120,background:`radial-gradient(circle at 18% 12%,${t.loss}20,transparent 34%),radial-gradient(circle at 85% 10%,${t.accent}18,transparent 36%)`,animation:"auroraDrift 12s ease-in-out infinite",pointerEvents:"none"}}/>
      <div style={{position:"relative",display:"flex",justifyContent:"space-between",gap:18,alignItems:"flex-start",flexWrap:"wrap"}}>
        <div style={{flex:"1 1 380px",minWidth:0}}>
          <div style={{fontSize:12,color:t.loss,textTransform:"uppercase",letterSpacing:".22em",fontWeight:900,marginBottom:8}}>Evidence-based win plan</div>
          <div style={{fontFamily:t.headingFont,fontSize:"clamp(34px,7vw,74px)",lineHeight:1.02,fontWeight:900,color:t.text,letterSpacing:"-.045em",overflowWrap:"anywhere"}}>How to beat {plan.oppName}</div>
          <div style={{fontSize:14,color:t.textMid,lineHeight:1.65,maxWidth:760,marginTop:14}}>{plan.summary}</div>
          <div style={{fontSize:11,color:t.textDim,lineHeight:1.55,marginTop:10,maxWidth:700}}>{plan.methodology.note}</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
          <RingGauge value={plan.confidence} size={92} stroke={9} color={confColor} t={t} label="signal"/>
          <div style={{fontSize:11,color:confColor,fontWeight:800,textTransform:"uppercase",letterSpacing:".08em"}}>{plan.confidenceTier} confidence</div>
          <button className="secondary" onClick={onChangeP2}>Change opponent</button>
        </div>
      </div>
      <div style={{position:"relative",display:"flex",gap:10,flexWrap:"wrap",marginTop:22}}>
        <Pill label="Games analyzed" value={plan.total} sub={plan.monthsLabel} color={t.accent} i={0}/>
        <Pill label="Their baseline" value={`${plan.winPct}%`} sub={`${plan.lossPct}% loss · ${plan.drawPct}% draw`} color={t.text} i={1}/>
        <Pill label="Recent form" value={`${plan.recentWinPct}%`} sub={`last ${Math.min(20,plan.total)} games`} color={plan.recentWinPct<plan.winPct-8?t.loss:t.win} i={2}/>
        <Pill label="Opening coverage" value={`${cov.pct}%`} sub={`${cov.named} named lines`} color={t.hl} i={3}/>
        {plan.tilt&&<Pill label="Post-loss win%" value={`${plan.tilt.afterLossPct}%`} sub={`n=${plan.tilt.afterLossGames} same-session`} color={plan.tilt.tilt>=12?t.loss:t.textDim} i={4}/>}
        {plan.lengths&&<Pill label="Avg length" value={`${plan.lengths.avgMoves}`} sub={`${plan.lengths.sample} with PGN moves`} color={t.hl} i={5}/>}
      </div>
    </Card>

    {/* Primary exploits */}
    <Reveal><Card t={t} hover={false}>
      <SecTitle t={t} sub={`Ranked by effect size × sample size. Requires ≥6pp deviation from ${plan.winPct}% baseline.`}>Backed Exploits</SecTitle>
      {plan.riskFlags.length
        ? <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:14}}>
            {plan.riskFlags.map((f,i)=><ExploitCard key={f.id} f={f} i={i}/>)}
          </div>
        : <div style={{padding:"24px 18px",background:`${t.accent}06`,border:`1px dashed ${t.cardBorder}`,borderRadius:14,color:t.textMid,fontSize:14,lineHeight:1.6}}>
            No pattern cleared our sample thresholds in this range. Try loading more months, or play solid chess — their baseline is {plan.winPct}% with no statistically loud leak yet.
          </div>}
    </Card></Reveal>

    {/* Opening deep dive */}
    <Reveal><div className="two-col-900" style={{display:"flex",gap:14,flexWrap:"wrap"}}>
      <Card t={t} style={{flex:3,minWidth:300}}>
        <SecTitle t={t} sub={`Exact 4-move starts · min ${plan.methodology.minSequence} games · vs ${plan.lossPct}% baseline loss rate`}>Move Order Intel</SecTitle>
        {plan.sequences.length
          ? <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {plan.sequences.map((s,i)=>{
                const moves=s.sequence.split(" ");
                return <div key={s.sequence} className="rival-row" style={{background:`${t.loss}08`,border:`1px solid ${i===0?`${t.loss}40`:`${t.loss}20`}`,borderRadius:14,padding:"14px 16px",animation:`slideUp .4s ${.05+i*.06}s cubic-bezier(.22,1,.36,1) both`}}>
                  {s.openingName&&<div style={{fontSize:12,fontWeight:800,color:t.text,marginBottom:8}}>{s.openingName}</div>}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap"}}>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                      {moves.map((m,j)=><span key={j} style={{fontFamily:"'Space Grotesk',monospace",fontSize:13,fontWeight:700,background:`${t.accent}12`,border:`1px solid ${t.accent}28`,borderRadius:8,padding:"5px 10px",color:t.text}}>{j%2===0?`${Math.floor(j/2)+1}.`:""} {m}</span>)}
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontFamily:t.headingFont,fontSize:26,fontWeight:900,color:t.loss}}>{s.lossPct}%</div>
                      <div style={{fontSize:10,color:t.textDim}}>loss · n={s.games}</div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:12,marginTop:10,fontSize:11,color:t.textDim,flexWrap:"wrap"}}>
                    <span>+{s.delta}pp vs baseline</span>
                    <ConfPill tier={s.confidence} color={s.confidenceColor} t={t}/>
                    <span>Mostly as {s.dominantColor}</span>
                    <span>Shrink: {s.shrunkRate}% loss</span>
                  </div>
                </div>;
              })}
            </div>
          : <div style={{color:t.textDim,fontSize:13,lineHeight:1.6}}>Not enough games with parsed move text for sequence analysis. PGN movetext unlocks exact opening orders — {plan.lengths?.sample||0} games had move data in this load.</div>}
      </Card>
      <Card t={t} style={{flex:2,minWidth:260}}>
        <SecTitle t={t} sub={`Named openings · min ${plan.methodology.minOpening} games each`}>Opening Leaks</SecTitle>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {plan.targetOpenings.length
            ? plan.targetOpenings.slice(0,5).map((o,i)=>(
              <div key={o.opening} style={{padding:"11px 12px",borderRadius:12,background:i===0?`${t.loss}10`:`${t.accent}05`,border:`1px solid ${i===0?`${t.loss}30`:t.cardBorder}`,animation:`fadeInUp .35s ${.04+i*.05}s cubic-bezier(.22,1,.36,1) both`}}>
                <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"flex-start"}}>
                  <a href={openingLink(o.opening,o.openingUrl)} target="_blank" rel="noopener noreferrer" style={{fontSize:13,fontWeight:700,color:t.text,textDecoration:"none",lineHeight:1.35,overflowWrap:"anywhere",flex:1}}>{o.opening}</a>
                  <span style={{fontFamily:t.headingFont,fontSize:20,fontWeight:900,color:t.loss,flexShrink:0}}>{o.lossPct}%</span>
                </div>
                <div style={{display:"flex",gap:8,marginTop:6,fontSize:10,color:t.textDim,flexWrap:"wrap",alignItems:"center"}}>
                  <span>n={o.games}</span>
                  <DeltaBadge delta={o.delta} t={t}/>
                  <ConfPill tier={o.confidence} color={o.confidenceColor} t={t}/>
                  {o.eco!=="?"&&<span className="eco-badge" style={ecoBadgeStyle(o.ecoFamily,t)}>{o.eco}</span>}
                </div>
              </div>
            ))
            : <div style={{color:t.textDim,fontSize:13}}>No opening reached {plan.methodology.minOpening}+ games with a meaningful loss-rate spike.</div>}
        </div>
        {plan.ecoFamilies.length>0&&<>
          <div style={{height:1,background:t.cardBorder,margin:"18px 0 14px"}}/>
          <div style={{fontSize:11,color:t.textDim,textTransform:"uppercase",letterSpacing:".1em",fontWeight:800,marginBottom:10}}>ECO family leaks</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {plan.ecoFamilies.slice(0,5).map(ef=>(
              <div key={ef.family} style={{background:`${ECO_COLORS[ef.family]||t.accent}12`,border:`1px solid ${(ECO_COLORS[ef.family]||t.accent)}30`,borderRadius:10,padding:"8px 12px",minWidth:100}}>
                <div style={{fontFamily:t.headingFont,fontSize:18,fontWeight:900,color:ECO_COLORS[ef.family]||t.accent}}>Vol {ef.family}</div>
                <div style={{fontSize:11,color:t.textMid,marginTop:2}}>{ef.lossPct}% loss · n={ef.games}</div>
                <div style={{fontSize:10,color:t.textDim}}>+{ef.delta}pp</div>
              </div>
            ))}
          </div>
        </>}
      </Card>
    </div></Reveal>

    {/* Time control + habits */}
    <Reveal><div className="two-col-900" style={{display:"flex",gap:14,flexWrap:"wrap"}}>
      <Card t={t} style={{flex:3,minWidth:280}}>
        <SecTitle t={t} sub={`Win% by format · min ${plan.methodology.minTC} games per bucket`}>Time Control Strategy</SecTitle>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {plan.tcRows.map((d,i)=>{
            const isWeak=plan.weakTC&&plan.weakTC.tc===d.tc;
            const isStrong=plan.strongTC&&plan.strongTC.tc===d.tc;
            const barC=d.winPct>=55?t.win:d.winPct>=45?"#ffc800":t.loss;
            const delta=plan.winPct-d.winPct;
            return <div key={d.tc} style={{animation:`fadeInUp .4s ${.06+i*.07}s cubic-bezier(.22,1,.36,1) both`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6,gap:10,flexWrap:"wrap"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontFamily:t.headingFont,fontSize:17,fontWeight:900,color:isWeak?t.loss:isStrong?t.win:t.text,textTransform:"capitalize"}}>{d.tc}</span>
                  {isWeak&&<span style={{fontSize:9,fontWeight:800,color:t.loss,textTransform:"uppercase",letterSpacing:".08em",padding:"2px 7px",borderRadius:6,background:`${t.loss}15`,border:`1px solid ${t.loss}35`}}>Target format</span>}
                  {isStrong&&<span style={{fontSize:9,fontWeight:800,color:t.win,textTransform:"uppercase",letterSpacing:".08em",padding:"2px 7px",borderRadius:6,background:`${t.win}12`,border:`1px solid ${t.win}35`}}>Their comfort</span>}
                </div>
                <div style={{textAlign:"right"}}>
                  <span style={{fontFamily:t.headingFont,fontSize:22,fontWeight:900,color:barC}}>{d.winPct}%</span>
                  <span style={{fontSize:11,color:t.textDim,marginLeft:8}}>{delta>0?`${delta}pp below baseline`:`${-delta}pp above`}</span>
                </div>
              </div>
              <div style={{height:10,borderRadius:6,background:`${barC}14`,overflow:"hidden",position:"relative"}}>
                <div className="bar-grow" style={{height:"100%",width:`${d.winPct}%`,background:`linear-gradient(90deg,${t.accent}55,${barC})`,borderRadius:6,animationDelay:`${.12+i*.08}s`}}/>
                <div style={{position:"absolute",left:`${plan.winPct}%`,top:0,bottom:0,width:2,background:t.textDim,opacity:.5}} title="Baseline"/>
              </div>
              <div style={{fontSize:10,color:t.textDim,marginTop:4}}>{d.games} games ({d.share}% of archive) · {d.wins}W {d.losses}L {d.draws}D</div>
            </div>;
          })}
        </div>
        {plan.colorTC.length>0&&<>
          <div style={{height:1,background:t.cardBorder,margin:"20px 0 14px"}}/>
          <div style={{fontSize:11,color:t.textDim,textTransform:"uppercase",letterSpacing:".1em",fontWeight:800,marginBottom:10}}>Color × format soft spots</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {plan.colorTC.slice(0,4).map(ct=>(
              <div key={`${ct.color}-${ct.tc}`} style={{background:`${t.loss}08`,border:`1px solid ${t.loss}22`,borderRadius:12,padding:"10px 14px",flex:"1 1 140px"}}>
                <div style={{display:"flex",alignItems:"center",gap:6,fontWeight:800,fontSize:13,color:t.text}}>{renderIcon(ct.icon,14)} {ct.color} · {ct.tc}</div>
                <div style={{fontFamily:t.headingFont,fontSize:22,fontWeight:900,color:t.loss,marginTop:4}}>{ct.winPct}%</div>
                <div style={{fontSize:10,color:t.textDim}}>n={ct.games} · {ct.delta}pp below baseline</div>
              </div>
            ))}
          </div>
        </>}
      </Card>
      <Card t={t} style={{flex:2,minWidth:240}}>
        <SecTitle t={t} sub="High-frequency lines worth prepping — frequency ≠ weakness">Their Habits</SecTitle>
        <div style={{display:"flex",flexDirection:"column",gap:9}}>
          {plan.overusedOpenings.map((o,i)=>{
            const leak=o.lossPct>=plan.lossPct+6;
            return <div key={o.opening} className="cheat-row" style={{padding:"11px 12px",borderRadius:12,background:`${t.accent}05`,border:`1px solid ${t.cardBorder}`,animation:`fadeInUp .35s ${.04+i*.05}s cubic-bezier(.22,1,.36,1) both`}}>
              <div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"flex-start"}}>
                <div style={{minWidth:0,flex:1}}>
                  <div style={{color:t.text,fontWeight:700,fontSize:13,lineHeight:1.35,overflowWrap:"anywhere"}}>{o.opening}</div>
                  <div style={{fontSize:11,color:t.textDim,marginTop:4}}>{o.share}% of games · {o.games} total · {o.winPct}% win</div>
                </div>
                <span className={`badge ${leak?"red":o.winPct>=55?"green":"yellow"}`}>{o.habit}</span>
              </div>
              {leak&&<div style={{fontSize:10,color:t.loss,marginTop:6,fontWeight:700}}>Also leaks +{o.lossPct-plan.lossPct}pp loss rate vs baseline — double-value prep</div>}
            </div>;
          })}
        </div>
        {plan.firstMoveLeaks.length>0&&<>
          <div style={{height:1,background:t.cardBorder,margin:"18px 0 12px"}}/>
          <div style={{fontSize:11,color:t.textDim,textTransform:"uppercase",letterSpacing:".1em",fontWeight:800,marginBottom:8}}>First-move responses</div>
          {plan.firstMoveLeaks.slice(0,3).map(fm=>(
            <div key={fm.move} style={{fontSize:12,color:t.textMid,marginBottom:6,display:"flex",justifyContent:"space-between"}}>
              <span><strong style={{color:t.text}}>1.{fm.move}</strong> — {fm.winPct}% win</span>
              <span style={{color:t.loss,fontWeight:700}}>n={fm.games} · {fm.delta}pp</span>
            </div>
          ))}
        </>}
      </Card>
    </div></Reveal>

    {/* Cheat sheet + psychology */}
    <Reveal><div className="two-col-900" style={{display:"flex",gap:14,flexWrap:"wrap"}}>
      <Card t={t} style={{flex:3,minWidth:280,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:0,right:0,width:180,height:180,background:`radial-gradient(circle at 100% 0%,${t.accent}14,transparent 70%)`,pointerEvents:"none"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap"}}>
          <SecTitle t={t} sub="Only statistically backed bullets — copy before the match">Pocket Cheat Sheet</SecTitle>
          <CopyButton onCopy={copyCheatSheet} t={t}/>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:7}}>
          {plan.cheatSheet.map(([k,v],i)=>(
            <div key={k} className="cheat-row" style={{display:"grid",gridTemplateColumns:"28px 130px 1fr",gap:10,alignItems:"baseline",background:`${t.accent}06`,border:`1px solid ${t.cardBorder}`,borderRadius:10,padding:"11px 13px",animation:`slideInLeft .4s ${.06+i*.06}s cubic-bezier(.22,1,.36,1) both`}}>
              <span style={{fontFamily:t.headingFont,fontSize:16,fontWeight:900,color:t.accent}}>{i+1}</span>
              <span style={{fontSize:12,fontWeight:800,color:t.text}}>{k}</span>
              <span style={{fontSize:12,color:t.textMid,lineHeight:1.5,overflowWrap:"anywhere"}}>{v}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card t={t} style={{flex:2,minWidth:240}}>
        <SecTitle t={t} sub="Session & length patterns (not time-of-day trivia)">Behavioral Tells</SecTitle>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {plan.tilt&&<div style={{background:`${t.loss}08`,border:`1px solid ${t.loss}22`,borderRadius:12,padding:"12px 14px"}}>
            <div style={{fontSize:10,color:t.loss,fontWeight:800,textTransform:"uppercase",letterSpacing:".08em",marginBottom:6}}>Same-session tilt</div>
            <div style={{fontSize:13,color:t.text,lineHeight:1.5}}>After a loss: <strong>{plan.tilt.afterLossPct}%</strong> win (n={plan.tilt.afterLossGames}) vs after a win: <strong>{plan.tilt.afterWinPct}%</strong> (n={plan.tilt.afterWinGames})</div>
          </div>}
          {plan.grindWeak&&<div style={{background:`${t.accent}08`,border:`1px solid ${t.cardBorder}`,borderRadius:12,padding:"12px 14px"}}>
            <div style={{fontSize:10,color:t.accent,fontWeight:800,textTransform:"uppercase",letterSpacing:".08em",marginBottom:6}}>Long game weakness</div>
            <div style={{fontSize:13,color:t.textMid,lineHeight:1.5}}>40+ moves: {plan.grindWeak.longWinPct}% win (n={plan.grindWeak.longGames}, {plan.grindWeak.confidence} conf)</div>
          </div>}
          {plan.blitzWeak&&<div style={{background:`${t.accent}08`,border:`1px solid ${t.cardBorder}`,borderRadius:12,padding:"12px 14px"}}>
            <div style={{fontSize:10,color:t.accent,fontWeight:800,textTransform:"uppercase",letterSpacing:".08em",marginBottom:6}}>Short game weakness</div>
            <div style={{fontSize:13,color:t.textMid,lineHeight:1.5}}>≤20 moves: {plan.blitzWeak.shortWinPct}% win (n={plan.blitzWeak.shortGames})</div>
          </div>}
          {plan.streak.count>=3&&<div style={{background:`${t.hl}10`,border:`1px solid ${t.hl}25`,borderRadius:12,padding:"12px 14px"}}>
            <div style={{fontSize:13,color:t.textMid}}>Current streak: <strong style={{color:plan.streak.type==="loss"?t.loss:t.win}}>{plan.streak.count} {plan.streak.type}s</strong></div>
          </div>}
          {plan.volatility!==null&&<div style={{fontSize:12,color:t.textDim,lineHeight:1.5}}>Session volatility: {plan.volatility}% day-to-day swing across heavy play days</div>}
          {plan.weakHour&&<div style={{fontSize:11,color:t.textDim,lineHeight:1.5,padding:"10px 12px",background:`${t.cardBorder}20`,borderRadius:8,border:`1px dashed ${t.cardBorder}`}}>
            <strong style={{color:t.textMid}}>Time-of-day (low priority):</strong> {plan.weakHour.label} games show {plan.weakHour.winPct}% win (n={plan.weakHour.games}). {plan.weakHour.note}
          </div>}
          {!plan.tilt&&!plan.grindWeak&&!plan.blitzWeak&&plan.streak.count<3&&<div style={{color:t.textDim,fontSize:13}}>No strong behavioral pattern in this sample yet.</div>}
        </div>
      </Card>
    </div></Reveal>

    {/* Phase timeline */}
    <Reveal><Card t={t} hover={false}>
      <SecTitle t={t} sub="Concrete sequence from pre-game through conversion">Step-by-step Game Plan</SecTitle>
      <div style={{position:"relative",paddingLeft:8}}>
        <div style={{position:"absolute",left:21,top:8,bottom:8,width:2,background:`linear-gradient(180deg,${t.accent},${t.accent}20)`,borderRadius:2,animation:"timelineDraw 1s cubic-bezier(.22,1,.36,1) both"}}/>
        {plan.planSteps.map((step,i)=>(
          <div key={step.phase} style={{display:"flex",gap:16,alignItems:"flex-start",position:"relative",paddingBottom:i===plan.planSteps.length-1?0:22,animation:`slideInLeft .5s ${.12+i*.12}s cubic-bezier(.22,1,.36,1) both`}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:t.accent,color:t.bg,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontFamily:t.font,flexShrink:0,boxShadow:`0 0 14px ${t.glowC}`,zIndex:1,fontSize:step.icon==="0"?11:14}}>{step.icon}</div>
            <div style={{flex:1,minWidth:0,background:`${t.accent}07`,border:`1px solid ${t.cardBorder}`,borderRadius:14,padding:"14px 16px"}}>
              <div style={{fontSize:10,color:t.textDim,textTransform:"uppercase",letterSpacing:".1em",fontWeight:800,marginBottom:4}}>{step.phase}</div>
              <div style={{fontFamily:t.headingFont,fontSize:20,lineHeight:1.15,color:t.accent,fontWeight:900,overflowWrap:"anywhere"}}>{step.title}</div>
              <div style={{fontSize:13,color:t.textMid,lineHeight:1.65,marginTop:7}}>{step.text}</div>
            </div>
          </div>
        ))}
      </div>
    </Card></Reveal>

    {plan.matchupNotes.length>0&&<Reveal><Card t={t}>
      <SecTitle t={t} sub="Your loaded profile crossed with their backed weaknesses">Your Matchup Edge</SecTitle>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {plan.matchupNotes.map((note,i)=>(
          <div key={note} className="cheat-row" style={{display:"flex",gap:10,alignItems:"flex-start",background:`${t.win}0b`,border:`1px solid ${t.win}22`,borderRadius:12,padding:"12px 14px",animation:`slideInLeft .4s ${.06+i*.06}s cubic-bezier(.22,1,.36,1) both`}}>
            <span style={{color:t.win,fontWeight:900}}>✓</span>
            <span style={{fontSize:13,color:t.textMid,lineHeight:1.55}}>{note}</span>
          </div>
        ))}
      </div>
    </Card></Reveal>}

    <Reveal><Card t={t} hover={false} style={{padding:"16px 20px"}}>
      <div style={{fontSize:11,color:t.textDim,lineHeight:1.65}}>
        <strong style={{color:t.textMid}}>Methodology:</strong> Thresholds scale with archive size — openings need ~{plan.methodology.minOpening}+ games, sequences ~{plan.methodology.minSequence}+, time controls ~{plan.methodology.minTC}+. A pattern must beat baseline by ≥6 percentage points. Rates use Bayesian shrinkage toward overall win/loss %. Time-of-day is excluded from recommendations unless 20+ games per block with 12+pp spread. This is result-pattern analysis, not engine evaluation.
      </div>
    </Card></Reveal>
  </div>;
}

// ── DNA Tab ───────────────────────────────────────────────────────────────────
function DnaTab({games,stats,loading,t,profile}) {
  const p=useMemo(()=>loading?null:computePersonality(games,stats,profile),[games,stats,profile,loading]);
  const evolution=useMemo(()=>loading?null:dnaEvolution(games,stats,profile),[games,stats,profile,loading]);
  if (loading) return <Sk h={300}/>;
  if (!p) return <div style={{color:t.textDim,textAlign:"center",padding:40,fontSize:14}}>Load a player to reveal their Chess DNA.</div>;
  const c=p.titleColor;
  const top=p.dimensions[0], weak=p.dimensions[p.dimensions.length-1];
  const shareUrl=()=>window.location.origin+window.location.pathname+`#/${profile?.username||""}/card`;

  return <div style={{display:"flex",flexDirection:"column",gap:20}}>

    {/* Personality banner */}
    <Card t={t} glow={true} hover={false} style={{position:"relative",overflow:"hidden",padding:"28px 26px",animation:"fadeInUp .45s cubic-bezier(.22,1,.36,1) both"}} className="card-pad-sm">
      <div style={{position:"absolute",inset:-120,background:`radial-gradient(circle at 22% 20%,${c}24,transparent 32%),radial-gradient(circle at 78% 18%,${t.accent}16,transparent 30%)`,animation:"auroraDrift 12s ease-in-out infinite",pointerEvents:"none"}}/>
      <div style={{position:"relative",display:"flex",gap:24,alignItems:"flex-start",flexWrap:"wrap"}}>
        <div style={{fontSize:72,lineHeight:1,filter:`drop-shadow(0 0 24px ${c}70)`,animation:"float 3s ease-in-out infinite"}}><Ico size={72}>{p.icon}</Ico></div>
        <div style={{flex:1,minWidth:200}}>
          <div style={{fontSize:11,color:c,textTransform:"uppercase",letterSpacing:".1em",fontWeight:800,marginBottom:6,overflowWrap:"anywhere"}}>ChessDNA · {p.dnaCode}</div>
          <div style={{fontFamily:t.headingFont,fontSize:"clamp(28px,5.5vw,52px)",fontWeight:900,color:c,lineHeight:1.1,letterSpacing:"-.03em",overflowWrap:"anywhere"}}>{p.title}</div>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,background:`${c}14`,border:`1px solid ${c}35`,borderRadius:999,padding:"5px 14px",marginTop:10}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:c,boxShadow:`0 0 10px ${c}`}}/>
            <span style={{fontSize:11,color:c,fontWeight:800,letterSpacing:".08em",textTransform:"uppercase"}}>{p.archetype}</span>
          </div>
          <div style={{fontSize:14,color:t.textMid,lineHeight:1.6,marginTop:14,maxWidth:560}}>{p.desc}</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10,minWidth:180,alignItems:"stretch"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8}}>
            {[["Win rate",`${p.winPct}%`,t.win],["Format",p.favTC,t.accent],["Openings",p.uniqueOpenings,t.hl],["Recent",`${p.recentWinPct}%`,p.recentWinPct>=p.winPct?t.win:t.loss]].map(([label,val,col],i)=>(
              <div key={label} style={{background:`${col}0c`,border:`1px solid ${col}22`,borderRadius:12,padding:"10px 12px",textAlign:"center",animation:`scaleIn .4s ${.08+i*.06}s cubic-bezier(.22,1,.36,1) both`}}>
                <div style={{fontSize:9,color:t.textDim,textTransform:"uppercase",letterSpacing:".08em",fontWeight:700}}>{label}</div>
                <div style={{fontFamily:t.headingFont,fontSize:22,fontWeight:900,color:col,marginTop:4,textTransform:label==="Format"?"capitalize":"none",overflowWrap:"anywhere",lineHeight:1.1}}>{val}</div>
              </div>
            ))}
          </div>
          <CopyButton onCopy={()=>navigator.clipboard.writeText(shareUrl())} t={t} label="Share profile"/>
        </div>
      </div>
    </Card>

    {/* Wheel + stat sheet — the main read */}
    <Reveal><Card t={t} hover={false}>
      <SecTitle t={t} sub="Seven scores from your loaded games — bigger bar = stronger signal">Your Playstyle Profile</SecTitle>
      <div className="two-col-900" style={{display:"flex",gap:28,alignItems:"flex-start",flexWrap:"wrap"}}>
        <div style={{flex:"0 0 auto",display:"flex",justifyContent:"center",padding:"8px 0"}}>
          <PlaystyleWheel dimensions={p.dimensions} p={p} c={c} t={t} size={240}/>
        </div>
        <div style={{flex:1,minWidth:260}}>
          <StatSheet dimensions={p.dimensions} t={t}/>
        </div>
      </div>
    </Card></Reveal>

    {/* Quick read — strengths & gaps */}
    <Reveal><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:14}}>
      <Card t={t} style={{padding:18,animation:"slideInLeft .5s cubic-bezier(.22,1,.36,1) both"}}>
        <div style={{fontSize:11,color:t.win,textTransform:"uppercase",letterSpacing:".12em",fontWeight:800,marginBottom:10,display:"flex",alignItems:"center",gap:6}}><Ico size={11}>⭐</Ico> Your superpower</div>
        <div style={{fontFamily:t.headingFont,fontSize:22,fontWeight:900,color:t.text,display:"flex",alignItems:"center",gap:8}}><Ico size={22}>{DIMENSION_META[top.key]?.icon}</Ico> {top.label}</div>
        <div style={{fontSize:28,fontWeight:900,color:t.win,fontFamily:t.headingFont,marginTop:4}}>{top.value}<span style={{fontSize:14,color:t.textDim}}>/100</span></div>
        <div style={{fontSize:13,color:t.textMid,lineHeight:1.55,marginTop:10}}>{DIMENSION_META[top.key]?.high}</div>
      </Card>
      <Card t={t} style={{padding:18,animation:"fadeInUp .5s .08s cubic-bezier(.22,1,.36,1) both"}}>
        <div style={{fontSize:11,color:"#fb923c",textTransform:"uppercase",letterSpacing:".12em",fontWeight:800,marginBottom:10,display:"flex",alignItems:"center",gap:6}}><Ico size={11}>🎯</Ico> Room to grow</div>
        <div style={{fontFamily:t.headingFont,fontSize:22,fontWeight:900,color:t.text,display:"flex",alignItems:"center",gap:8}}><Ico size={22}>{DIMENSION_META[weak.key]?.icon}</Ico> {weak.label}</div>
        <div style={{fontSize:28,fontWeight:900,color:"#fb923c",fontFamily:t.headingFont,marginTop:4}}>{weak.value}<span style={{fontSize:14,color:t.textDim}}>/100</span></div>
        <div style={{fontSize:13,color:t.textMid,lineHeight:1.55,marginTop:10}}>{DIMENSION_META[weak.key]?.low}</div>
      </Card>
    </div></Reveal>

    {/* Evolution — compact chips */}
    {evolution&&<Reveal><Card t={t} hover={false}>
      <SecTitle t={t} sub="Oldest half vs newest half of loaded games">Are you improving?</SecTitle>
      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
        {evolution.filter(e=>e.delta!==0).slice(0,7).map((e,i)=>{
          const up=e.delta>0, dc=up?t.win:t.loss;
          return <div key={e.key} style={{display:"flex",alignItems:"center",gap:8,background:`${dc}0c`,border:`1px solid ${dc}28`,borderRadius:999,padding:"8px 14px",animation:`popIn .35s ${.04+i*.05}s cubic-bezier(.22,1,.36,1) both`}}>
            <span><Ico size={12}>{DIMENSION_META[e.key]?.icon}</Ico></span>
            <span style={{fontSize:12,fontWeight:700,color:t.text}}>{e.label}</span>
            <span style={{fontSize:12,fontWeight:900,color:dc,fontFamily:t.headingFont}}>{up?"▲":"▼"}{Math.abs(e.delta)}</span>
            <span style={{fontSize:10,color:t.textDim}}>{e.before}→{e.now}</span>
          </div>;
        })}
        {evolution.every(e=>e.delta===0)&&<div style={{fontSize:13,color:t.textMid}}>Stable across the range — no big shifts detected.</div>}
      </div>
    </Card></Reveal>}

  </div>;
}

// ── Tab shortcuts for deeper dives ────────────────────────────────────────────
function TabQuickLinks({t,onSelect}) {
  const links=[
    [1,"📖","Openings","Repertoire & leaks"],
    [2,"🎨","Color Stats","White vs Black"],
    [3,"📈","Elo Breakdown","By opponent rating"],
    [6,"🧬","Chess DNA","Playstyle profile"],
  ];
  return <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10}}>
    {links.map(([idx,icon,label,sub],i)=>(
      <button key={idx} onClick={()=>onSelect(idx)} className="quick-link" style={{background:`${t.accent}06`,border:`1px solid ${t.cardBorder}`,borderRadius:12,padding:"14px 16px",textAlign:"left",color:t.text,animation:`fadeInUp .4s ${.04+i*.06}s cubic-bezier(.22,1,.36,1) both`}}>
        <div style={{fontSize:15,fontWeight:700,marginBottom:4,display:"flex",alignItems:"center",gap:6}}><Ico size={15}>{icon}</Ico> {label}</div>
        <div style={{fontSize:11,color:t.textDim,transition:"color .2s ease"}}>{sub} →</div>
      </button>
    ))}
  </div>;
}

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({data,loading,t,onGoTab}) {
  const tip=(props)=><ChartTip {...props} t={t}/>;
  if (loading) return <div style={{display:"flex",flexDirection:"column",gap:14}}>{[...Array(3)].map((_,i)=><Sk key={i} h={90}/>)}</div>;
  if (!data) return null;
  const {games}=data;
  const total=games.length;
  const wins=games.filter(g=>g.result==="win").length;
  const losses=games.filter(g=>g.result==="loss").length;
  const draws=games.filter(g=>g.result==="draw").length;
  const winPct=total?Math.round(wins/total*100):0;
  const lossPct=total?Math.round(losses/total*100):0;
  const drawPct=total?Math.round(draws/total*100):0;

  const recent=games.slice(0,20);
  const recentWins=recent.filter(g=>g.result==="win").length;
  const recentForm=Math.round(recentWins/Math.max(recent.length,1)*100);
  const formTrend=recentForm>winPct?"↑ Better than avg":recentForm<winPct-5?"↓ Below avg":"→ On pace";
  const formColor=recentForm>winPct?t.win:recentForm<winPct-5?t.loss:t.textMid;

  const elos=games.filter(g=>g.oppElo).map(g=>g.oppElo);
  const avgOpp=elos.length?Math.round(elos.reduce((a,b)=>a+b,0)/elos.length):null;
  const bestWin=games.filter(g=>g.result==="win"&&g.oppElo).sort((a,b)=>b.oppElo-a.oppElo)[0];
  const uniqueO=uniqueNamedOpenings(games);
  const records=streakRecords(games);
  const streak=computeStreak(games);
  const monthly=monthlyTrend(games);
  const tcMap={};
  games.forEach(g=>{tcMap[g.timeControl]=(tcMap[g.timeControl]||0)+1;});
  const tcData=Object.entries(tcMap).filter(([k])=>k!=="other").map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
  const tcTotal=tcData.reduce((a,d)=>a+d.value,0)||1;

  const StatCard=({label,value,color,sub,i})=>(
    <Card t={t} className={`stagger-${i+1} stat-pulse`} style={{padding:"16px 18px",textAlign:"center",minWidth:100,transition:"transform .2s ease"}} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-3px) scale(1.02)"} onMouseLeave={e=>e.currentTarget.style.transform=""}>
      <div style={{fontSize:10,color:t.textDim,textTransform:"uppercase",letterSpacing:".07em",marginBottom:6,fontFamily:t.font}}>{label}</div>
      <div className="stat-value" style={{fontSize:28,fontWeight:700,color:color||t.text,fontFamily:t.headingFont}}>{typeof value==="number"?<AnimatedNumber value={value} duration={600}/>:value}</div>
      {sub&&<div style={{fontSize:11,color:t.textDim,marginTop:3}}>{sub}</div>}
    </Card>
  );

  return <div style={{display:"flex",flexDirection:"column",gap:16}}>

    <div className="stat-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))",gap:10}}>
      <StatCard i={1} label="Games" value={total} color={t.accent}/>
      <StatCard i={2} label="Win Rate" value={winPct} color={t.win} sub={`${wins}W · ${losses}L · ${draws}D`}/>
      <StatCard i={3} label="Avg Opponent" value={avgOpp||"—"} color={t.textMid}/>
      <StatCard i={4} label="Openings" value={uniqueO} color={t.hl} sub={`${openingCoverage(games).pct}% identified`}/>
      <StatCard i={5} label="Current Streak" value={streak.count} color={streak.type==="win"?t.win:streak.type==="loss"?t.loss:t.draw} sub={streak.type==="none"?"—":`${streak.type}s`}/>
      <StatCard i={6} label="Best Streak" value={records.bestWin} color={t.win} sub="wins in a row"/>
    </div>

    <Card t={t}>
      <SecTitle t={t} sub="All loaded archive games in selected range">Win / Draw / Loss</SecTitle>
      <div style={{display:"flex",height:14,borderRadius:8,overflow:"hidden",gap:2,marginBottom:10}}>
        <div className="bar-grow" style={{width:`${winPct}%`,background:t.win,transition:"width .8s cubic-bezier(.4,0,.2,1)"}}/>
        <div className="bar-grow" style={{width:`${drawPct}%`,background:t.draw,transition:"width .8s cubic-bezier(.4,0,.2,1)",animationDelay:".08s"}}/>
        <div className="bar-grow" style={{width:`${lossPct}%`,background:t.loss,transition:"width .8s cubic-bezier(.4,0,.2,1)",animationDelay:".16s"}}/>
      </div>
      <div style={{display:"flex",gap:20,fontSize:13,flexWrap:"wrap"}}>
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
            <div key={i} className="pop-in" style={{width:16,height:16,borderRadius:3,background:g.result==="win"?t.win:g.result==="loss"?t.loss:t.draw,opacity:.85,title:`${g.result} · ${g.opening||"—"}`,animationDelay:`${i*.03}s`,transition:"transform .15s ease"}} onMouseEnter={e=>e.target.style.transform="scale(1.3)"} onMouseLeave={e=>e.target.style.transform="scale(1)"}/>
          ))}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8,marginTop:8}}>
          <div style={{fontSize:12,color:formColor,fontWeight:600}}>{formTrend} · {recentForm}% last 20 games</div>
          {bestWin&&<div style={{fontSize:12}}>
            <span style={{color:t.textDim}}>Best win: </span>
            <span style={{color:t.win,fontWeight:600}}>{bestWin.opponent}</span>
            <span style={{color:t.textDim}}> ({bestWin.oppElo})</span>
          </div>}
        </div>
      </div>
    </Card>

    <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
      {monthly.length>=2&&<Card t={t} style={{flex:2,minWidth:260}} hover={false}>
        <SecTitle t={t} sub="Volume and win rate per month">Monthly Trajectory</SecTitle>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={monthly} margin={{top:5,right:8,left:0,bottom:0}}>
            <CartesianGrid stroke={`${t.accent}10`} strokeDasharray="3 3"/>
            <XAxis dataKey="month" tick={{fill:t.textDim,fontSize:10}} axisLine={false} tickLine={false}/>
            <YAxis yAxisId="pct" domain={[0,100]} tick={{fill:t.textDim,fontSize:10}} axisLine={false} tickLine={false} width={32}/>
            <YAxis yAxisId="vol" orientation="right" tick={{fill:t.textDim,fontSize:10}} axisLine={false} tickLine={false} width={32}/>
            <Tooltip content={tip}/>
            <Bar yAxisId="vol" dataKey="games" name="Games" fill={`${t.accent}30`} radius={[4,4,0,0]} isAnimationActive animationDuration={700}/>
            <Line yAxisId="pct" type="monotone" dataKey="winPct" name="Win%" stroke={t.accent} strokeWidth={2.5} dot={{r:3,fill:t.accent}} activeDot={{r:5}} isAnimationActive animationDuration={1000}/>
          </ComposedChart>
        </ResponsiveContainer>
      </Card>}
      {tcData.length>0&&<Card t={t} style={{flex:1,minWidth:200}}>
        <SecTitle t={t} sub="How you split your games">Time Controls</SecTitle>
        <div style={{display:"flex",height:10,borderRadius:6,overflow:"hidden",gap:2,marginBottom:12}}>
          {tcData.map((d,i)=>(
            <div key={d.name} title={`${d.name}: ${d.value}`} className="bar-grow" style={{width:`${d.value/tcTotal*100}%`,background:[t.accent,t.accent2,t.hl,t.textMid][i%4],transition:"width .7s ease",animationDelay:`${.08+i*.06}s`}}/>
          ))}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {tcData.map((d,i)=>(
            <div key={d.name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:13}}>
              <span style={{display:"flex",alignItems:"center",gap:8,color:t.textMid,textTransform:"capitalize"}}>
                <span style={{width:8,height:8,borderRadius:2,background:[t.accent,t.accent2,t.hl,t.textMid][i%4]}}/>{d.name}
              </span>
              <span style={{color:t.text,fontWeight:700}}>{d.value} <span style={{color:t.textDim,fontWeight:400}}>({Math.round(d.value/tcTotal*100)}%)</span></span>
            </div>
          ))}
        </div>
      </Card>}
    </div>

    {onGoTab&&<Card t={t} hover={false}>
      <SecTitle t={t} sub="Full breakdowns live in dedicated tabs">Explore Further</SecTitle>
      <TabQuickLinks t={t} onSelect={onGoTab}/>
    </Card>}

  </div>;
}

// ── Main App ──────────────────────────────────────────────────────────────────
const TABS=[["📊","Overview"],["📖","Openings"],["🎨","Color Stats"],["📈","Elo Breakdown"],["⚔","Compare"],["🎯","Win Plan"],["🧬","Chess DNA"]];
const RANGE_OPTIONS = [3,6,12,0];
function getSavedRange() {
  const raw = localStorage.getItem("chessdna-range");
  if (raw === null) return 3;
  const saved = Number(raw);
  return RANGE_OPTIONS.includes(saved) ? saved : 3;
}

// ── URL routing helpers ───────────────────────────────────────────────────────
function parseHash() {
  // Supports: /#/username  /#/username/card  /#/username/compare/opponent  /#/username/plan/opponent
  const hash = window.location.hash.replace(/^#\/?/, "");
  const parts = hash.split("/").filter(Boolean);
  return { user: parts[0]||null, sub: parts[1]||null, other: parts[2]||null };
}
function setHash(user, sub, other) {
  let path = user ? `/${user}` : "";
  if (sub) path += `/${sub}`;
  if (other) path += `/${other}`;
  window.location.hash = path;
}

export default function App() {
  const t=THEME;
  useEffect(()=>{ injectTheme(t); document.body.style.background=t.bg; },[]);

  const [tab,setTab]=useState(0);
  const [p1In,setP1In]=useState("");
  const [p2In,setP2In]=useState("");
  const [p1,setP1]=useState(null);
  const [p2,setP2]=useState(null);
  const [l1,setL1]=useState(false);
  const [l2,setL2]=useState(false);
  const [e1,setE1]=useState(null);
  const [e2,setE2]=useState(null);
  const [months,setMonths]=useState(getSavedRange);
  const monthsRef=useRef(months);
  const p1LoadId=useRef(0);
  const p2LoadId=useRef(0);
  const tabStripRef=useRef(null);

  // ── On mount: read URL and auto-load player ──
  useEffect(()=>{
    const {user,sub,other} = parseHash();
    if (user) {
      setP1In(user);
      doLoad1(user);
      if (sub==="card") setTab(6);
      if (sub==="compare") { setTab(4); if (other) { setP2In(other); load2(other); } }
      if (sub==="plan") { setTab(5); if (other) { setP2In(other); load2(other); } }
    }
    const onHash = () => {
      const {user:u, sub:s, other:o} = parseHash();
      if (u) {
        setP1In(u);
        doLoad1(u);
        if (s==="card") setTab(6);
        else if (s==="compare") { setTab(4); if (o) { setP2In(o); load2(o); } }
        else if (s==="plan") { setTab(5); if (o) { setP2In(o); load2(o); } }
        else setTab(prev=>(prev===4||prev===5||prev===6)?0:prev);
      }
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
    setL2(true); setP2(null); setE2(null);
    try{
      const data = await loadPlayer(u, m);
      if (loadId === p2LoadId.current) {
        setP2(data);
        setP2In(data.profile.username);
      }
    }
    catch(e){
      if (loadId === p2LoadId.current) setE2(e.message||"Failed to load player");
    }finally{if (loadId === p2LoadId.current) setL2(false);}
  };

  const runCompare = () => {
    const u = p2In.trim().toLowerCase();
    if (!u || !p1) return;
    setHash(p1.profile.username, "compare", u);
    load2(u);
  };

  const runWinPlan = () => {
    const u = p2In.trim().toLowerCase();
    if (!u || !p1) return;
    setHash(p1.profile.username, "plan", u);
    load2(u);
  };

  const clearCompare = () => {
    setP2(null); setP2In(""); setE2(null);
    if (!p1) return;
    if (tab === 5) setHash(p1.profile.username, "plan");
    else if (tab === 4) setHash(p1.profile.username, "compare");
    else setHash(p1.profile.username);
  };

  const handleTabChange = (i) => {
    setTab(i);
    requestAnimationFrame(()=>{
      tabStripRef.current?.scrollIntoView({behavior:"smooth",block:"nearest"});
    });
    if (!p1) return;
    if (i===6) setHash(p1.profile.username, "card");
    else if (i===5 && p2) setHash(p1.profile.username, "plan", p2.profile.username);
    else if (i===5) setHash(p1.profile.username, "plan");
    else if (i===4 && p2) setHash(p1.profile.username, "compare", p2.profile.username);
    else if (i===4) setHash(p1.profile.username, "compare");
    else setHash(p1.profile.username);
  };

  return <div style={{minHeight:"100vh",position:"relative"}}>
    {/* Background */}
    <div style={{position:"fixed",inset:0,zIndex:0,background:t.bg,pointerEvents:"none"}}/>
    <ThemeBg t={t}/>
    <LoadingBar active={l1||l2} t={t}/>
    <ScrollProgress t={t}/>

    <div style={{position:"relative",zIndex:1,isolation:"isolate",maxWidth:1120,margin:"0 auto",padding:"0 16px 80px"}}>

      {/* ── Hero section ── */}
      <div className="hero-pad" style={{textAlign:"center",padding:"70px 0 46px",animation:"fadeInUp .6s ease both",position:"relative",overflow:"visible"}}>
        {[["♜",2,6,0],["♞",96,10,1.8],["♝",4,42,0.6],["♛",95,58,2.4],["♟",50,3,3.2],["♚",8,88,1.2],["♞",88,78,2.8],["♝",18,22,0.3],["♜",72,92,3.6]].map(([piece,x,y,delay],i)=>(
          <span key={i} className="hero-float-piece chess-ico" style={{left:`${x}%`,top:`${y}%`,fontSize:[26,20,22,18,24,22,20,18,24][i],animationDelay:`${delay}s`,animationDuration:`${7+i*.8}s`}}>{piece}</span>
        ))}
        <div style={{position:"relative"}}>
        <div className="hero-emoji" style={{fontSize:76,marginBottom:12,animation:"heroChess 4s ease-in-out infinite",display:"inline-block",filter:`drop-shadow(0 0 34px ${t.glowC})`}}><ChessIco size={76}>♟</ChessIco></div>
        <h1 style={{fontFamily:t.headingFont,fontSize:"clamp(52px,11vw,112px)",fontWeight:900,color:t.accent,letterSpacing:"-.055em",lineHeight:1.02,animation:"glow 3s ease-in-out infinite, scaleIn .6s cubic-bezier(.22,1,.36,1) both",paddingBottom:4}}>ChessDNA</h1>
        <p style={{fontSize:20,color:t.textMid,marginTop:16,fontFamily:t.font,animation:"fadeInDown .7s .2s cubic-bezier(.22,1,.36,1) both"}}>A measured identity from real Chess.com games</p>

        {/* Search */}
        <div style={{display:"flex",gap:10,maxWidth:680,margin:"28px auto 0",alignItems:"center",flexWrap:"wrap",animation:"fadeInUp .65s .32s cubic-bezier(.22,1,.36,1) both"}}>
          <div className="search-wrap" style={{flex:1,minWidth:200,position:"relative"}}>
            <span className="search-icon ico" style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:t.textDim,fontSize:16,pointerEvents:"none",transition:"color .2s ease"}}>🔍</span>
            <input placeholder="Enter Chess.com username…" value={p1In} onChange={e=>setP1In(e.target.value)} onKeyDown={e=>e.key==="Enter"&&load1()} style={{paddingLeft:42,fontSize:16}}/>
          </div>
          <button className="primary" onClick={load1} disabled={l1||!p1In.trim()}>
            {l1?<span style={{display:"inline-flex",alignItems:"center",gap:8}}><span style={{width:14,height:14,border:`2px solid ${t.btnColor}`,borderTopColor:"transparent",borderRadius:"50%",display:"inline-block",animation:"spin .8s linear infinite"}}/>Analyzing…</span>:"Analyze Player"}
          </button>
        </div>
        <div style={{display:"flex",gap:6,justifyContent:"center",marginTop:12,alignItems:"center",animation:"fadeInUp .5s .4s cubic-bezier(.22,1,.36,1) both"}}>
          <span style={{fontSize:12,color:t.textDim}}>Range:</span>
          {[[3,"3mo"],[6,"6mo"],[12,"1yr"],[0,"All time"]].map(([m,label])=>(
            <button key={m} className={`range-pill ${months===m?"active":""}`} onClick={()=>changeMonths(m)} style={{background:months===m?`${t.accent}20`:"none",border:`1px solid ${months===m?t.accent+"60":t.cardBorder}`,borderRadius:20,color:months===m?t.accent:t.textDim,fontSize:12,fontWeight:months===m?600:400,padding:"4px 12px"}}>
              {label}
            </button>
          ))}
          {p1&&<span style={{fontSize:11,color:t.textDim,marginLeft:4,animation:"fadeIn .4s ease both"}}>· <AnimatedNumber value={p1.games.length} duration={700}/> games loaded</span>}
        </div>
        {e1&&<div className="error-shake" style={{marginTop:12,fontSize:13,color:t.loss,padding:"8px 14px",background:`${t.loss}12`,border:`1px solid ${t.loss}30`,borderRadius:8,display:"inline-block"}}>⚠ {e1}</div>}
        </div>
      </div>

      {/* ── Player Hero Card ── */}
      {(p1||l1)&&<Reveal><div style={{marginBottom:20}}><PlayerHeroCard data={p1} loading={l1} t={t}/></div></Reveal>}
      {p1&&!l1&&<Reveal delay={0.05}><DataTruthStrip data={p1} months={months} t={t}/></Reveal>}

      {p1&&!l1&&<Reveal delay={0.08}>
        <Card t={t} style={{marginBottom:20}}>
          <SecTitle t={t} sub="Actionable patterns from your loaded games">Key Insights</SecTitle>
          <InsightsColumn games={p1.games} loading={l1} t={t}/>
        </Card>
      </Reveal>}

      {/* ── Tabs ── */}
      {(p1||l1)&&<Reveal delay={0.03}><div ref={tabStripRef} className="tab-strip" style={{background:t.card,border:`1px solid ${t.cardBorder}`,borderRadius:10,padding:6,marginBottom:14,boxShadow:`0 4px 20px rgba(0,0,0,.25)`,scrollMarginTop:12}}>
        {TABS.map(([icon,name],i)=>(
          <button key={name} className={`tab-btn ${tab===i?"active":""}`} onClick={()=>handleTabChange(i)} style={tab===i?{animation:"elasticIn .25s cubic-bezier(.22,1,.36,1) both"}:{}}><Ico size={14}>{icon}</Ico> {name}</button>
        ))}
      </div></Reveal>}

      {/* ── Tab Content ── */}
      {(p1||l1)&&<PageTransition keyVal={tab}>
        {tab===0&&<OverviewTab data={p1} loading={l1} t={t} onGoTab={handleTabChange}/>}
        {tab===1&&<OpeningsTab games={p1?.games} loading={l1} t={t}/>}
        {tab===2&&<ColorTab games={p1?.games} loading={l1} t={t}/>}
        {tab===3&&<EloTab games={p1?.games} loading={l1} t={t}/>}
        {tab===4&&<CompareTab p1={p1} p2={p2} l1={l1} l2={l2} p2In={p2In} setP2In={setP2In} loadP2={runCompare} e2={e2} months={months} t={t} onChangeP2={clearCompare}/>}
        {tab===5&&<WinPlanTab p1={p1} p2={p2} l1={l1} l2={l2} p2In={p2In} setP2In={setP2In} loadP2={runWinPlan} e2={e2} months={months} t={t} onChangeP2={clearCompare}/>}
        {tab===6&&<DnaTab games={p1?.games} stats={p1?.stats} loading={l1} t={t} profile={p1?.profile}/>}
      </PageTransition>}

      {/* ── Empty state ── */}
      {!p1&&!l1&&!e1&&<div style={{textAlign:"center",padding:"40px 0 60px",animation:"fadeInUp .5s .2s ease both"}}>
        <div className="empty-piece" style={{fontSize:64,opacity:.15,marginBottom:20,display:"inline-block",fontFamily:CHESS_FONT}}>♜</div>
        <div style={{fontFamily:t.headingFont,fontSize:20,color:t.textMid}}>Enter a username to reveal your Chess DNA</div>
        <div style={{fontSize:13,color:t.textDim,marginTop:8,maxWidth:420,margin:"8px auto 0"}}>Win rates, openings, color splits, opponent breakdowns, matchup plans, and a playstyle profile — all from public Chess.com data.</div>
      </div>}

      <div style={{textAlign:"center",marginTop:48,fontSize:11,color:t.textDim,opacity:.8,animation:"fadeIn 1s .8s ease both"}}>Chess DNA · Data from Chess.com Public API · No data stored</div>
    </div>
  </div>;
}