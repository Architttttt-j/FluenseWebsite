"use client";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api-client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#3b6ef8","#00c9a7","#f59e0b","#ef4444","#a78bfa","#fb923c","#34d399","#60a5fa"];
const PRODUCTS: Record<string, string> = { p001:"Fluensol 500mg", p002:"Caldent Plus", p003:"NeuPlex D3", p004:"Gastrovex", p005:"CardiShield", p006:"DiabaCare XR", p007:"RespiClear", p008:"PainEase 650" };
const Tip = ({ active, payload, label }: any) => active && payload?.length ? (
  <div style={{ background:"var(--bg-card)", border:"1px solid var(--border-light)", borderRadius:8, padding:"10px 14px", fontSize:12.5 }}>
    <p style={{ color:"var(--text-secondary)", marginBottom:4 }}>{label}</p>
    {payload.map((p: any, i: number) => <p key={i} style={{ color:p.color, fontWeight:600 }}>{p.name}: {p.value}</p>)}
  </div>
) : null;

export default function ReportsPage() {
  const { activeUser } = useAuth();
  const [period, setPeriod]     = useState("month");
  const [stats, setStats]       = useState<any>(null);
  const [mrPerf, setMrPerf]     = useState<any[]>([]);
  const [prodStats, setProd]    = useState<any>(null);
  const [regions, setRegions]   = useState<any[]>([]);

  const load = useCallback(async () => {
    const p = { period };
    const [s, mr, prod] = await Promise.all([
      api.getDashboardStats(),
      api.getMRPerformance(p as any),
      api.getProductStats(p as any),
    ]);
    setStats(s); setMrPerf(mr.slice(0,8)); setProd(prod);
    if (activeUser?.role === "head_admin") {
      api.getRegionComparison(p as any).then(setRegions);
    }
  }, [period, activeUser]);

  useEffect(() => { load(); }, [load]);

  const visitsByType = prodStats ? [
    { name:"Doctors",   value: Object.values(prodStats.byClientType?.doctor   || {}).reduce((a: number, b) => a + (b as number), 0) as number },
    { name:"Retailers", value: Object.values(prodStats.byClientType?.retailer || {}).reduce((a: number, b) => a + (b as number), 0) as number },
    { name:"Stockists", value: Object.values(prodStats.byClientType?.stockist || {}).reduce((a: number, b) => a + (b as number), 0) as number },
  ] : [];

  const productByType = prodStats ? ["doctor","retailer","stockist"].map(type => {
    const data = Object.entries(prodStats.byClientType?.[type] || {} as Record<string,number>)
      .map(([pid, count]) => ({ name: PRODUCTS[pid] || pid, count: count as number }))
      .sort((a, b) => b.count - a.count).slice(0, 5);
    return { type, data };
  }) : [];

  return (
    <div className="page-content fade-in">
      <div className="flex-between" style={{ marginBottom:24 }}>
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p style={{ fontSize:13, color:"var(--text-secondary)" }}>{activeUser?.role === "admin" ? `${activeUser.region} branch` : "Company-wide analytics"}</p>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          {["week","month","year"].map(p => (
            <button key={p} className={`btn btn-sm ${period===p ? "btn-primary" : "btn-secondary"}`} onClick={() => setPeriod(p)}>
              {p.charAt(0).toUpperCase()+p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom:24 }}>
        {[
          { label:"Total Visits",   value: period==="week" ? stats?.visitsThisWeek : stats?.visitsThisMonth, color:"var(--accent)" },
          { label:"Active MRs",     value: stats?.totalMrs,     color:"var(--accent-2)" },
          { label:"Present Today",  value: stats?.presentToday, color:"var(--accent-3)" },
          { label:"Avg / MR",       value: stats?.avgVisitsPerMr, color:"#a78bfa" },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding:"16px 20px" }}>
            <p style={{ fontSize:28, fontFamily:"Syne, sans-serif", fontWeight:700, color:s.color }}>{s.value ?? "—"}</p>
            <p style={{ fontSize:12.5, color:"var(--text-secondary)", marginTop:4 }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom:24 }}>
        <div className="card">
          <h3 style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>MR Performance</h3>
          <p style={{ fontSize:12, color:"var(--text-secondary)", marginBottom:16 }}>Visits per MR this {period}</p>
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

        <div className="card">
          <h3 style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>Visits by Client Type</h3>
          <p style={{ fontSize:12, color:"var(--text-secondary)", marginBottom:16 }}>Distribution this {period}</p>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <ResponsiveContainer width="60%" height={200}>
              <PieChart>
                <Pie data={visitsByType} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {visitsByType.map((_,i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip content={<Tip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex:1 }}>
              {visitsByType.map((item, i) => (
                <div key={item.name} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                  <div style={{ width:10, height:10, borderRadius:3, background:COLORS[i], flexShrink:0 }} />
                  <div>
                    <p style={{ fontSize:12, fontWeight:500 }}>{item.name}</p>
                    <p style={{ fontSize:22, fontFamily:"Syne, sans-serif", fontWeight:700, color:COLORS[i], lineHeight:1 }}>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {activeUser?.role === "head_admin" && regions.length > 0 && (
        <div className="card" style={{ marginBottom:24 }}>
          <h3 style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>Region Comparison</h3>
          <p style={{ fontSize:12, color:"var(--text-secondary)", marginBottom:16 }}>Branch-wise performance this {period}</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={regions}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="region" tick={{ fill:"var(--text-muted)", fontSize:12 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill:"var(--text-muted)", fontSize:11 }} tickLine={false} axisLine={false} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="visits" radius={[4,4,0,0]} maxBarSize={48}>
                {regions.map((_,i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div>
        <h3 style={{ fontSize:16, fontWeight:700, marginBottom:16 }}>Top Products by Client Type</h3>
        <div className="grid-3">
          {productByType.map(({ type, data }) => (
            <div key={type} className="card">
              <span className={`badge badge-${type}`} style={{ marginBottom:12, display:"inline-flex" }}>{type}</span>
              {data.length === 0 ? <p style={{ fontSize:12.5, color:"var(--text-muted)" }}>No data</p> : data.map((item, i) => (
                <div key={item.name} style={{ marginBottom:10 }}>
                  <div className="flex-between" style={{ marginBottom:4 }}>
                    <span style={{ fontSize:12, color:"var(--text-secondary)", flex:1, marginRight:8, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.name}</span>
                    <span style={{ fontSize:12, fontWeight:700 }}>{item.count}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width:`${data[0].count > 0 ? (item.count/data[0].count)*100 : 0}%`, background:COLORS[i] }} />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
