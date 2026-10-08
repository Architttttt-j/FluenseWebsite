"use client";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api-client";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const PRODUCTS: Record<string, string> = { p001:"Fluensol 500mg", p002:"Caldent Plus", p003:"NeuPlex D3", p004:"Gastrovex Syrup", p005:"CardiShield 10", p006:"DiabaCare XR", p007:"RespiClear", p008:"PainEase 650" };
const localDate = () => new Date().toLocaleDateString("en-CA");

const Tip = ({ active, payload, label }: any) => active && payload?.length ? (
  <div style={{ background:"var(--bg-card)", border:"1px solid var(--border-light)", borderRadius:8, padding:"10px 14px", fontSize:12.5 }}>
    <p style={{ color:"var(--text-secondary)", marginBottom:4 }}>{label}</p>
    {payload.map((p: any, i: number) => <p key={i} style={{ color:p.color, fontWeight:600 }}>{p.name}: {p.value}</p>)}
  </div>
) : null;

export default function DashboardPage() {
  const { activeUser } = useAuth();
  const [trend, setTrend]         = useState<any[]>([]);
  const [products, setProducts]   = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any>(null);
  const [stats, setStats]         = useState<any>(null);
  const [visits, setVisits]       = useState<any[]>([]);
  const [periodVisits, setPeriodVisits] = useState<any[]>([]);
  const [users, setUsers]         = useState<any[]>([]);
  const [goals, setGoals]         = useState<any[]>([]);
  const [regions, setRegions]     = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState("30");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [loading, setLoading]     = useState(true);

  const load = useCallback(async () => {
    if (!activeUser) return;
    setLoading(true);
    try {
      const period = selectedPeriod === "7" ? "week" : "month";
      const scope: Record<string, string> = selectedRegion ? { regionId: selectedRegion } : {};
      const [t, prod, catalog, todayAttendance, dashboardStats, recentVisits, allPeriodVisits, memberData, todayGoals] = await Promise.all([
        api.getVisitTrend({ days: selectedPeriod, ...scope }),
        api.getProductStats({ period, ...scope }),
        api.getProducts(),
        activeUser.role === "mr"
          ? api.getAttendance({ date: new Date().toISOString().slice(0, 10) })
          : api.getTodaySummary(scope),
        api.getDashboardStats({ period, ...scope }),
        api.getVisits({ days: selectedPeriod, limit: "8", ...scope }),
        api.getVisits({ days: selectedPeriod, limit: "10000", ...scope }),
        api.getUsers({ role: "mr", ...scope }),
        api.getGoals({ date: localDate(), ...scope }),
      ]);
      setTrend(t);
      setAttendance(activeUser.role === "mr" ? todayAttendance?.[0] || null : todayAttendance);
      setStats(dashboardStats);
      setVisits(recentVisits || []);
      setPeriodVisits(allPeriodVisits || []);
      setUsers(memberData?.users || []);
      setGoals(todayGoals || []);
      const overall = prod.overall || {};
      setProducts(Object.entries(overall as Record<string,number>)
        .map(([pid, count]) => ({ name: catalog.find((p: any) => p.code === pid)?.name || PRODUCTS[pid] || pid, mentions: count }))
        .sort((a: any, b: any) => b.mentions - a.mentions).slice(0, 6));
    } finally { setLoading(false); }
  }, [activeUser, selectedPeriod, selectedRegion]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (activeUser?.role === "head_admin") api.getRegions().then(setRegions);
  }, [activeUser?.role]);

  if (loading) return <div className="page-content" style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"80vh" }}><div className="spinner" style={{ width:32, height:32 }} /></div>;

  const isMR = activeUser?.role === "mr";
  const targetTotal = goals.reduce((sum, goal) => sum + (goal.target || 0), 0);
  const achievedTotal = goals.reduce((sum, goal) => sum + (goal.achieved || 0), 0);
  const targetPercent = targetTotal > 0 ? Math.min(100, Math.round((achievedTotal / targetTotal) * 100)) : 0;
  const uniqueDoctors = new Set(periodVisits.map(visit => visit.clientId)).size;
  const inactiveMembers = users.filter(user => user.status !== "active");
  const visitedMemberIds = new Set(periodVisits.map(visit => visit.mrId));
  const noVisitMembers = users.filter(user => user.status === "active" && !visitedMemberIds.has(user.id));
  const attentionItems = isMR
    ? [
        ...(!attendance?.checkIn ? [{ label: "Attendance not marked today", detail: "Check in before starting visits", color: "var(--accent-danger)" }] : []),
        ...(targetTotal > 0 && achievedTotal < targetTotal ? [{ label: `${targetTotal - achievedTotal} calls remaining`, detail: "Today's assigned target", color: "var(--accent-3)" }] : []),
      ]
    : [
        ...inactiveMembers.slice(0, 4).map(user => ({ label: `${user.name} is inactive`, detail: user.region || "No region", color: "var(--accent-danger)" })),
        ...noVisitMembers.slice(0, 4).map(user => ({ label: `${user.name} has no visits`, detail: `Last ${selectedPeriod} days`, color: "var(--accent-3)" })),
      ];

  return (
    <div className="page-content fade-in">
      <div className="flex-between" style={{ marginBottom:24, gap:16, flexWrap:"wrap" }}>
        <div>
          <h1 className="page-title">{isMR ? `Welcome, ${activeUser?.name.split(" ")[0]} 👋` : "Overview"}</h1>
          <p className="page-subtitle">{new Date().toLocaleDateString("en", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}</p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {activeUser?.role === "head_admin" && <select className="form-select" value={selectedRegion} onChange={e => setSelectedRegion(e.target.value)} style={{ width:"auto" }}>
            <option value="">All Regions</option>
            {regions.map(region => <option key={region.id} value={region.id}>{region.name}</option>)}
          </select>}
          <select className="form-select" value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)} style={{ width:"auto" }}>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
          </select>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom:24 }}>
        {[
          { label:"Visits", value:stats?.visitsInPeriod ?? 0, detail:`Last ${selectedPeriod} days`, color:"var(--accent)" },
          { label:isMR ? "Doctors Visited" : "Active MRs", value:isMR ? uniqueDoctors : stats?.totalMrs ?? 0, detail:isMR ? "Unique doctors" : "In selected scope", color:"var(--accent-2)" },
          { label:"Attendance", value:isMR ? (attendance?.checkIn ? "Present" : "Missing") : `${attendance?.present ?? 0}/${attendance?.totalMrs ?? 0}`, detail:isMR ? "Today" : "Present today", color:isMR && !attendance?.checkIn ? "var(--accent-danger)" : "var(--accent-3)" },
          { label:"Today Target", value:targetTotal ? `${achievedTotal}/${targetTotal}` : "—", detail:targetTotal ? `${targetPercent}% achieved` : "No target assigned", color:"var(--accent-3)" },
        ].map(item => <div key={item.label} className="card" style={{ padding:"16px 20px" }}><p style={{ fontSize:26, fontWeight:700, color:item.color }}>{item.value}</p><p style={{ fontSize:12.5, color:"var(--text-secondary)", marginTop:4 }}>{item.label}</p><p style={{ fontSize:11, color:"var(--text-muted)", marginTop:3 }}>{item.detail}</p></div>)}
      </div>

      {isMR && (
        <div className="card" style={{ marginBottom:24, borderLeft:"3px solid var(--accent-2)" }}>
          <div className="flex-between" style={{ gap:16 }}>
            <div>
              <h3 style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>Your Assigned Target</h3>
              <p style={{ fontSize:12, color:"var(--text-secondary)" }}>Daily target for {new Date().toLocaleDateString("en", { day:"numeric", month:"short", year:"numeric" })}</p>
            </div>
            <strong style={{ fontSize:24, color:targetTotal ? "var(--accent-2)" : "var(--text-muted)" }}>{targetTotal ? `${achievedTotal} / ${targetTotal}` : "Not assigned"}</strong>
          </div>
          {targetTotal > 0 && <div className="progress-bar" style={{ height:8, marginTop:14 }}><div className="progress-fill" style={{ width:`${targetPercent}%`, background:"var(--accent-2)" }} /></div>}
        </div>
      )}

      <div className="grid-2" style={{ marginBottom:24 }}>
        <div className="card">
          <div className="flex-between" style={{ marginBottom:12 }}><div><h3 style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>Target Achievement</h3><p style={{ fontSize:12, color:"var(--text-secondary)" }}>Today&apos;s assigned calls</p></div><strong style={{ color:"var(--accent)" }}>{targetTotal ? `${targetPercent}%` : "—"}</strong></div>
          <div className="progress-bar" style={{ height:10 }}><div className="progress-fill" style={{ width:`${targetPercent}%`, background:"var(--accent)" }} /></div>
          <div className="flex-between" style={{ marginTop:10, fontSize:12, color:"var(--text-secondary)" }}><span>{achievedTotal} completed</span><span>{targetTotal} target</span></div>
        </div>
        <div className="card">
          <div className="flex-between" style={{ marginBottom:12 }}><div><h3 style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>Needs Attention</h3><p style={{ fontSize:12, color:"var(--text-secondary)" }}>{isMR ? "Your workday" : "Operational follow-ups"}</p></div><span className="badge badge-inactive">{attentionItems.length}</span></div>
          {attentionItems.length === 0 ? <p style={{ fontSize:13, color:"var(--accent-success)" }}>Everything looks on track.</p> : attentionItems.slice(0, 5).map((item, index) => <div key={`${item.label}-${index}`} style={{ display:"flex", gap:10, padding:"8px 0", borderTop:index ? "1px solid var(--border-light)" : "none" }}><span style={{ width:8, height:8, borderRadius:"50%", background:item.color, marginTop:5, flexShrink:0 }} /><div><p style={{ fontSize:12.5, fontWeight:600 }}>{item.label}</p><p style={{ fontSize:11, color:"var(--text-muted)", marginTop:2 }}>{item.detail}</p></div></div>)}
        </div>
      </div>

      <div className="card" style={{ marginBottom:24, padding:0 }}>
        <div className="flex-between" style={{ padding:"18px 20px 14px" }}><div><h3 style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>Recent Activity</h3><p style={{ fontSize:12, color:"var(--text-secondary)" }}>Latest visits in the selected period</p></div><button className="btn btn-secondary btn-sm" onClick={() => window.location.href = "/reports"}>View Reports</button></div>
        <div className="table-wrapper"><table><thead><tr>{!isMR && <th>MR</th>}<th>Client</th><th>Date</th><th>Products</th><th>Status</th></tr></thead><tbody>{visits.map(visit => <tr key={visit.id}>{!isMR && <td style={{ fontSize:13, fontWeight:500 }}>{visit.mrName}</td>}<td style={{ fontSize:13 }}>{visit.clientName}</td><td style={{ fontSize:13, color:"var(--text-secondary)" }}>{new Date(visit.date).toLocaleDateString("en", { day:"numeric", month:"short" })}</td><td style={{ fontSize:12, color:"var(--text-secondary)" }}>{visit.products?.length ? visit.products.join(", ") : "—"}</td><td><span className={`badge ${visit.checkOut ? "badge-active" : "badge-inactive"}`}>{visit.checkOut ? "Completed" : "Open"}</span></td></tr>)}</tbody></table>{!visits.length && <div style={{ padding:28, textAlign:"center", color:"var(--text-muted)" }}>No recent visits</div>}</div>
      </div>

      <div className="grid-2">
        {/* Visit Trend */}
        <div className="card">
          <h3 style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>Visit Trend</h3>
          <p style={{ fontSize:12, color:"var(--text-secondary)", marginBottom:16 }}>Last 14 days</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trend.map(d => ({ ...d, day: d.date.slice(5) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
              <XAxis dataKey="day" tick={{ fill:"var(--text-muted)", fontSize:11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill:"var(--text-muted)", fontSize:11 }} tickLine={false} axisLine={false} />
              <Tooltip content={<Tip />} />
              <Line type="monotone" dataKey="visits" stroke="var(--accent)" strokeWidth={2.5} dot={false} activeDot={{ r:5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
            <h3 style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>Top Products</h3>
            <p style={{ fontSize:12, color:"var(--text-secondary)", marginBottom:16 }}>By discussion (30 days)</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={products} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" horizontal={false} />
                <XAxis type="number" tick={{ fill:"var(--text-muted)", fontSize:11 }} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fill:"var(--text-secondary)", fontSize:10.5 }} width={110} tickLine={false} axisLine={false} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="mentions" fill="var(--accent)" radius={[0,4,4,0]} maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
        </div>
      </div>

      <div className="card" style={{ marginTop:24 }}>
        <h3 style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>Today&apos;s Attendance</h3>
        <p style={{ fontSize:12, color:"var(--text-secondary)", marginBottom:16 }}>
          {isMR ? "Your attendance for today" : "Active MR attendance for today"}
        </p>
        {isMR ? (
          <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
            {[
              { label:"Status", value: attendance?.checkIn ? attendance.checkOut ? "Completed" : "Checked In" : "Not Checked In", color: attendance?.checkIn ? "var(--accent-success)" : "var(--accent-danger)" },
              { label:"Check In", value: attendance?.checkIn || "—", color:"var(--accent-2)" },
              { label:"Check Out", value: attendance?.checkOut || "—", color:"var(--text-primary)" },
            ].map(item => (
              <div key={item.label} style={{ minWidth:130, padding:"12px 14px", background:"var(--bg-input)", borderRadius:8 }}>
                <p style={{ fontSize:11, color:"var(--text-muted)", marginBottom:4 }}>{item.label}</p>
                <p style={{ fontSize:18, fontWeight:700, color:item.color }}>{item.value}</p>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
            {[
              { label:"Present", value: attendance?.present ?? 0, color:"var(--accent-success)" },
              { label:"Absent", value: attendance?.absent ?? 0, color:"var(--accent-danger)" },
              { label:"Total Active MRs", value: attendance?.totalMrs ?? 0, color:"var(--accent)" },
            ].map(item => (
              <div key={item.label} style={{ minWidth:130, padding:"12px 14px", background:"var(--bg-input)", borderRadius:8 }}>
                <p style={{ fontSize:11, color:"var(--text-muted)", marginBottom:4 }}>{item.label}</p>
                <p style={{ fontSize:22, fontWeight:700, color:item.color }}>{item.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
