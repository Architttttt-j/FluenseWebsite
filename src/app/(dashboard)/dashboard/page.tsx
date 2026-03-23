"use client";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api-client";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const COLORS = ["#3b6ef8","#00c9a7","#f59e0b","#ef4444","#a78bfa","#fb923c","#34d399","#60a5fa"];
const PRODUCTS: Record<string, string> = { p001:"Fluensol 500mg", p002:"Caldent Plus", p003:"NeuPlex D3", p004:"Gastrovex Syrup", p005:"CardiShield 10", p006:"DiabaCare XR", p007:"RespiClear", p008:"PainEase 650" };

const Tip = ({ active, payload, label }: any) => active && payload?.length ? (
  <div style={{ background:"var(--bg-card)", border:"1px solid var(--border-light)", borderRadius:8, padding:"10px 14px", fontSize:12.5 }}>
    <p style={{ color:"var(--text-secondary)", marginBottom:4 }}>{label}</p>
    {payload.map((p: any, i: number) => <p key={i} style={{ color:p.color, fontWeight:600 }}>{p.name}: {p.value}</p>)}
  </div>
) : null;

export default function DashboardPage() {
  const { activeUser } = useAuth();
  const [stats, setStats]         = useState<any>(null);
  const [trend, setTrend]         = useState<any[]>([]);
  const [mrPerf, setMrPerf]       = useState<any[]>([]);
  const [products, setProducts]   = useState<any[]>([]);
  const [goals, setGoals]         = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);

  const load = useCallback(async () => {
    if (!activeUser) return;
    try {
      const [s, t, g] = await Promise.all([
        api.getDashboardStats(),
        api.getVisitTrend({ days: "14" }),
        api.getGoals(),
      ]);
      setStats(s); setTrend(t); setGoals(g);

      if (activeUser.role !== "mr") {
        const [perf, prod] = await Promise.all([
          api.getMRPerformance({ period: "month" }),
          api.getProductStats({ period: "month" }),
        ]);
        setMrPerf(perf.slice(0, 8));
        const overall = prod.overall || {};
        setProducts(
          Object.entries(overall as Record<string,number>)
            .map(([pid, count]) => ({ name: PRODUCTS[pid] || pid, mentions: count }))
            .sort((a: any, b: any) => b.mentions - a.mentions).slice(0, 6)
        );
      }
    } finally { setLoading(false); }
  }, [activeUser]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="page-content" style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"80vh" }}><div className="spinner" style={{ width:32, height:32 }} /></div>;

  const isMR = activeUser?.role === "mr";

  return (
    <div className="page-content fade-in">
      <div style={{ marginBottom:24 }}>
        <h1 className="page-title">{isMR ? `Welcome, ${activeUser?.name.split(" ")[0]} 👋` : "Overview"}</h1>
        <p className="page-subtitle">{new Date().toLocaleDateString("en", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}</p>
      </div>

      {/* Stat cards */}
      <div className="grid-4" style={{ marginBottom:24 }}>
        {[
          { label:"Active MRs",     value: stats?.totalMrs ?? 0,          color:"var(--accent)",   bg:"rgba(59,110,248,0.1)",  hidden: isMR },
          { label:"Present Today",  value: stats?.presentToday ?? 0,       color:"var(--accent-2)", bg:"rgba(0,201,167,0.1)" },
          { label:"Visits Today",   value: stats?.visitsToday ?? 0,        color:"var(--accent-3)", bg:"rgba(245,158,11,0.1)" },
          { label:"Monthly Visits", value: stats?.visitsThisMonth ?? 0,    color:"#a78bfa",         bg:"rgba(167,139,250,0.1)" },
        ].filter(s => !s.hidden).map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg }}>
              <div style={{ width:20, height:20, borderRadius:4, background: s.color, opacity:0.8 }} />
            </div>
            <div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom:24 }}>
        {/* Visit Trend */}
        <div className="card">
          <h3 style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>Visit Trend</h3>
          <p style={{ fontSize:12, color:"var(--text-secondary)", marginBottom:16 }}>Last 14 days</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trend.map(d => ({ ...d, day: d.date.slice(5) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{ fill:"var(--text-muted)", fontSize:11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill:"var(--text-muted)", fontSize:11 }} tickLine={false} axisLine={false} />
              <Tooltip content={<Tip />} />
              <Line type="monotone" dataKey="visits" stroke="var(--accent)" strokeWidth={2.5} dot={false} activeDot={{ r:5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Products or MR Stats */}
        {isMR ? (
          <div className="card">
            <h3 style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>My Stats</h3>
            {[
              { label:"Visits This Week",  value: stats?.visitsThisWeek ?? 0 },
              { label:"Visits This Month", value: stats?.visitsThisMonth ?? 0 },
            ].map(s => (
              <div key={s.label} className="flex-between" style={{ padding:"12px 14px", background:"var(--bg-input)", borderRadius:8, marginBottom:12 }}>
                <span style={{ fontSize:13, color:"var(--text-secondary)" }}>{s.label}</span>
                <span style={{ fontSize:20, fontWeight:700, fontFamily:"Syne, sans-serif" }}>{s.value}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="card">
            <h3 style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>Top Products</h3>
            <p style={{ fontSize:12, color:"var(--text-secondary)", marginBottom:16 }}>By discussion (30 days)</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={products} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill:"var(--text-muted)", fontSize:11 }} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fill:"var(--text-secondary)", fontSize:10.5 }} width={110} tickLine={false} axisLine={false} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="mentions" fill="var(--accent)" radius={[0,4,4,0]} maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid-2">
        {/* Goals */}
        <div className="card">
          <h3 style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>Today's Goals</h3>
          {goals.length === 0 ? <p style={{ color:"var(--text-muted)", fontSize:13 }}>No goals assigned.</p> : goals.map((g: any) => {
            const pct = Math.round((g.achieved / g.target) * 100);
            return (
              <div key={g.id} style={{ marginBottom:16 }}>
                <div className="flex-between" style={{ marginBottom:6 }}>
                  <p style={{ fontSize:12, color:"var(--text-secondary)" }}>{g.description}</p>
                  <span style={{ fontSize:12.5, fontWeight:700, color: pct >= 100 ? "var(--accent-success)" : pct >= 60 ? "var(--accent-3)" : "var(--accent-danger)" }}>{g.achieved}/{g.target}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width:`${Math.min(pct,100)}%`, background: pct >= 100 ? "var(--accent-success)" : pct >= 60 ? "var(--accent-3)" : "var(--accent)" }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* MR Performance */}
        {!isMR && (
          <div className="card">
            <h3 style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>MR Performance</h3>
            <p style={{ fontSize:12, color:"var(--text-secondary)", marginBottom:16 }}>Visits this month</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={mrPerf}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="firstName" tick={{ fill:"var(--text-muted)", fontSize:11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill:"var(--text-muted)", fontSize:11 }} tickLine={false} axisLine={false} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="visits" radius={[4,4,0,0]} maxBarSize={32}>
                  {mrPerf.map((_,i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
