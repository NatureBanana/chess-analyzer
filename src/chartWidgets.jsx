import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Legend, Line, CartesianGrid, ComposedChart,
} from "recharts";

export function Donut({ wins, losses, draws, size = 100, t }) {
  const data = [{ value: wins, color: t.win }, { value: losses, color: t.loss }, { value: draws, color: t.draw }];
  return <PieChart width={size} height={size}>
    <Pie data={data} cx={size / 2 - 2} cy={size / 2 - 2} innerRadius={size * .3} outerRadius={size * .46} dataKey="value" paddingAngle={2} isAnimationActive animationDuration={900} animationBegin={80}>
      {data.map((d, i) => <Cell key={i} fill={d.color} />)}
    </Pie>
  </PieChart>;
}

export function PlaystyleWheel({ dimensions, p, c, t, size = 220, Ico, DIMENSION_META }) {
  const data = dimensions.map(d => ({ name: d.label, value: d.value, color: d.color, key: d.key }));
  return <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
    <div style={{ position: "relative", width: size, height: size }}>
      <PieChart width={size} height={size}>
        <Pie data={data} cx="50%" cy="50%" innerRadius={size * .36} outerRadius={size * .46} dataKey="value" paddingAngle={2} stroke="none" isAnimationActive animationDuration={900}>
          {data.map(d => <Cell key={d.key} fill={d.color} style={{ filter: `drop-shadow(0 0 6px ${d.color}40)` }} />)}
        </Pie>
      </PieChart>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
        <div style={{ filter: `drop-shadow(0 0 12px ${c}60)` }}><Ico size={size * .22}>{p.icon}</Ico></div>
      </div>
    </div>
    <div style={{ textAlign: "center", maxWidth: size + 48, marginTop: 10, padding: "0 4px" }}>
      <div style={{ fontFamily: t.headingFont, fontSize: 15, fontWeight: 900, color: c, lineHeight: 1.2, overflowWrap: "anywhere" }}>{p.title}</div>
      <div style={{ fontSize: 9, color: t.textDim, marginTop: 5, fontWeight: 700, letterSpacing: ".04em", overflowWrap: "anywhere" }}>{p.dnaCode}</div>
    </div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, justifyContent: "center", marginTop: 10 }}>
      {data.map(d => (
        <span key={d.key} title={`${d.name}: ${d.value}`} style={{ fontSize: 9, fontWeight: 700, color: d.color, background: `${d.color}14`, border: `1px solid ${d.color}30`, borderRadius: 999, padding: "2px 7px", display: "inline-flex", alignItems: "center", gap: 3 }}><Ico size={9}>{DIMENSION_META[d.key]?.icon || "•"}</Ico> {d.value}</span>
      ))}
    </div>
  </div>;
}

export function OpeningsOutcomeChart({ data, t, tip }) {
  return <ResponsiveContainer width="100%" height={Math.max(180, data.length * 36)}>
    <BarChart data={data} layout="vertical" margin={{ left: 160 }}>
      <XAxis type="number" domain={[0, 100]} tick={{ fill: t.textDim, fontSize: 10 }} axisLine={false} tickLine={false} />
      <YAxis type="category" dataKey="opening" tick={{ fill: t.textMid, fontSize: 11 }} width={155} axisLine={false} tickLine={false} tickFormatter={v => v.length > 22 ? v.slice(0, 20) + "…" : v} />
      <Tooltip content={tip} /><Legend wrapperStyle={{ color: t.textMid, fontSize: 12 }} />
      <Bar dataKey="winPct" name="Win %" stackId="a" fill={t.win} isAnimationActive animationDuration={700} animationBegin={100} />
      <Bar dataKey="drawPct" name="Draw %" stackId="a" fill={t.draw} isAnimationActive animationDuration={700} animationBegin={200} />
      <Bar dataKey="lossPct" name="Loss %" stackId="a" fill={t.loss} radius={[0, 4, 4, 0]} isAnimationActive animationDuration={700} animationBegin={300} />
    </BarChart>
  </ResponsiveContainer>;
}

export function ColorComparisonChart({ wWp, bWp, white, black, t, tip, percent }) {
  return <ResponsiveContainer width="100%" height={160}>
    <BarChart data={[{ name: "Win%", White: wWp, Black: bWp }, { name: "Draw%", White: percent(white.draws, white.total), Black: percent(black.draws, black.total) }, { name: "Loss%", White: percent(white.losses, white.total), Black: percent(black.losses, black.total) }]}>
      <XAxis dataKey="name" tick={{ fill: t.textDim, fontSize: 12 }} axisLine={false} tickLine={false} />
      <YAxis domain={[0, 100]} tick={{ fill: t.textDim, fontSize: 11 }} axisLine={false} tickLine={false} />
      <Tooltip content={tip} />
      <Bar dataKey="White" fill="#f8c840" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={700} /><Bar dataKey="Black" fill="#6e7ff3" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={700} animationBegin={150} />
      <Legend wrapperStyle={{ color: t.textMid, fontSize: 12 }} />
    </BarChart>
  </ResponsiveContainer>;
}

export function ColorTimeControlChart({ tcColor, t, tip }) {
  return <ResponsiveContainer width="100%" height={180}>
    <BarChart data={tcColor} barCategoryGap="25%">
      <XAxis dataKey="name" tick={{ fill: t.textDim, fontSize: 12 }} axisLine={false} tickLine={false} />
      <YAxis domain={[0, 100]} tick={{ fill: t.textDim, fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
      <Tooltip content={tip} />
      <Bar dataKey="White" fill="#f8c840" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={700} />
      <Bar dataKey="Black" fill="#6e7ff3" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={700} animationBegin={120} />
      <Legend wrapperStyle={{ color: t.textMid, fontSize: 12 }} />
    </BarChart>
  </ResponsiveContainer>;
}

export function EloBreakdownChart({ data, t, tip }) {
  return <ResponsiveContainer width="100%" height={220}>
    <BarChart data={data}>
      <XAxis dataKey="label" tick={{ fill: t.textDim, fontSize: 11 }} axisLine={false} tickLine={false} />
      <YAxis domain={[0, 100]} tick={{ fill: t.textDim, fontSize: 11 }} axisLine={false} tickLine={false} />
      <Tooltip content={tip} />
      <Bar dataKey="winPct" name="Win%" radius={[5, 5, 0, 0]} isAnimationActive animationDuration={800}>{data.map((e, i) => <Cell key={i} fill={e.winPct >= 55 ? t.win : e.winPct >= 45 ? "#ffc800" : t.loss} />)}</Bar>
    </BarChart>
  </ResponsiveContainer>;
}

export function CompareRadarChart({ radar, u1, u2, t, tip }) {
  return <ResponsiveContainer width="100%" height={250}>
    <RadarChart data={radar} cx="50%" cy="50%">
      <PolarGrid stroke={`${t.accent}15`} /><PolarAngleAxis dataKey="subject" tick={{ fill: t.textMid, fontSize: 12 }} /><PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
      <Radar name={u1} dataKey={u1} stroke={P1_COLOR} fill={P1_FILL} fillOpacity={1} animationDuration={800} />
      <Radar name={u2} dataKey={u2} stroke={P2_COLOR} fill={P2_FILL} fillOpacity={1} animationDuration={900} />
      <Legend wrapperStyle={{ color: t.textMid, fontSize: 12, fontFamily: t.font }} /><Tooltip content={tip} />
    </RadarChart>
  </ResponsiveContainer>;
}

export function CompareSharedOpeningsChart({ shared, u1, u2, t, tip }) {
  return <ResponsiveContainer width="100%" height={Math.max(180, shared.length * 34)}>
    <BarChart data={shared} layout="vertical" margin={{ left: 125 }}>
      <XAxis type="number" domain={[0, 100]} tick={{ fill: t.textDim, fontSize: 10 }} axisLine={false} tickLine={false} />
      <YAxis type="category" dataKey="opening" tick={{ fill: t.textMid, fontSize: 11 }} width={120} axisLine={false} tickLine={false} />
      <Tooltip content={tip} /><Legend wrapperStyle={{ color: t.textMid, fontSize: 12 }} />
      <Bar dataKey={u1} fill={P1_COLOR} radius={[0, 4, 4, 0]} isAnimationActive animationDuration={700} />
      <Bar dataKey={u2} fill={P2_COLOR} radius={[0, 4, 4, 0]} isAnimationActive animationDuration={700} animationBegin={150} />
    </BarChart>
  </ResponsiveContainer>;
}

export function MonthlyTrajectoryChart({ monthly, t, tip }) {
  return <ResponsiveContainer width="100%" height={200}>
    <ComposedChart data={monthly} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
      <CartesianGrid stroke={`${t.accent}10`} strokeDasharray="3 3" />
      <XAxis dataKey="month" tick={{ fill: t.textDim, fontSize: 10 }} axisLine={false} tickLine={false} />
      <YAxis yAxisId="pct" domain={[0, 100]} tick={{ fill: t.textDim, fontSize: 10 }} axisLine={false} tickLine={false} width={32} />
      <YAxis yAxisId="vol" orientation="right" tick={{ fill: t.textDim, fontSize: 10 }} axisLine={false} tickLine={false} width={32} />
      <Tooltip content={tip} />
      <Bar yAxisId="vol" dataKey="games" name="Games" fill={`${t.accent}30`} radius={[4, 4, 0, 0]} isAnimationActive animationDuration={700} />
      <Line yAxisId="pct" type="monotone" dataKey="winPct" name="Win%" stroke={t.accent} strokeWidth={2.5} dot={{ r: 3, fill: t.accent }} activeDot={{ r: 5 }} isAnimationActive animationDuration={1000} />
    </ComposedChart>
  </ResponsiveContainer>;
}

const P1_COLOR = "#f97316";
const P1_FILL = "rgba(249,115,22,.18)";
const P2_COLOR = "#a78bfa";
const P2_FILL = "rgba(167,139,250,.14)";
