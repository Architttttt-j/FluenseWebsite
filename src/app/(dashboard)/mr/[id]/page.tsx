"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const PRODUCTS: Record<string, string> = { p001:"Fluensol 500mg", p002:"Caldent Plus", p003:"NeuPlex D3", p004:"Gastrovex Syrup", p005:"CardiShield 10", p006:"DiabaCare XR", p007:"RespiClear", p008:"PainEase 650" };
const COLORS = ["#3b6ef8","#00c9a7","#f59e0b","#ef4444","#a78bfa","#fb923c"];
const Tip = ({ active, payload, label }: any) => active && payload?.length ? (
  <div style={{ background:"var(--bg-card)", border:"1px solid var(--border-light)", borderRadius:8, padding:"10px 14px", fontSize:12.5 }}>
    <p style={{ color:"var(--text-secondary)", marginBottom:4 }}>{label}</p>
    {payload.map((p: any, i: number) => <p key={i} style={{ color:p.color, fontWeight:600 }}>{p.name}: {p.value}</p>)}
  </div>
) : null;

export default function MRDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { activeUser } = useAuth();
  const [user, setUser]     = useState<any>(null);
  const [visits, setVisits] = useState<any[]>([]);
  const [trend, setTrend]   = useState<any[]>([]);
  const [att, setAtt]       = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getUser(id),
      api.getVisits({ mrId: id, days: "30", limit: "10" }),
      api.getVisitTrend({ days: "30", mrId: id } as any),
      api.getAttendance({ mrId: id, days: "30" }),
    ]).then(([u, v, t, a]) => {
      setUser(u); setVisits(v); setTrend(t); setAtt(a);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page-content" style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"80vh" }}><div className="spinner" style={{ width:32, height:32 }} /></div>;
  if (!user) return <div className="page-content"><p>User not found.</p></div>;

  const roleLabel: Record<string, string> = { head_admin:"Head Admin", admin:"Regional Admin", mr:"Medical Rep" };

  // Monthly chart — group trend by month
  const monthlyMap: Record<string, number> = {};
  for (const d of trend) {
    const m = d.date.slice(0, 7);
    monthlyMap[m] = (monthlyMap[m] || 0) + d.visits;
  }
  const monthly = Object.entries(monthlyMap).map(([m, v]) => ({ month: new Date(m + "-01").toLocaleDateString("en", { month:"short" }), visits: v }));

  return (
    <div className="page-content fade-in">
      <button className="btn btn-secondary btn-sm" onClick={() => router.back()} style={{ marginBottom:16 }}>← Back</button>

      {/* Header */}
      <div className="card" style={{ marginBottom:20 }}>
        <div style={{ display:"flex", gap:24, alignItems:"flex-start" }}>
          <div className="avatar avatar-lg">{user.name.split(" ").map((n: string) => n[0]).join("").slice(0,2)}</div>
          <div style={{ flex:1 }}>
            <div className="flex-between" style={{ marginBottom:8 }}>
              <div>
                <h2 style={{ fontSize:22, fontWeight:700, marginBottom:6 }}>{user.name}</h2>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  <span className={`badge badge-${user.role}`}>{roleLabel[user.role]}</span>
                  <span className={`badge badge-${user.status}`}>{user.status}</span>
                  <span className="badge" style={{ background:"rgba(255,255,255,0.05)", color:"var(--text-secondary)" }}>{user.region}</span>
                </div>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginTop:12 }}>
              {[
                { label:"Email",    value: user.email },
                { label:"Phone",    value: user.phone || "—" },
                { label:"DOB",      value: user.dob ? new Date(user.dob).toLocaleDateString("en", { day:"numeric", month:"long", year:"numeric" }) : "—" },
                { label:"Joined",   value: user.joinDate ? new Date(user.joinDate).toLocaleDateString("en", { day:"numeric", month:"long", year:"numeric" }) : "—" },
                { label:"Region",   value: user.region },
                { label:"Role",     value: roleLabel[user.role] },
              ].map(item => (
                <div key={item.label}>
                  <p style={{ fontSize:11, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:3 }}>{item.label}</p>
                  <p style={{ fontSize:13.5, color:"var(--text-secondary)" }}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid-4" style={{ marginBottom:20 }}>
        {[
          { label:"Total Visits (30d)", value: visits.length,  color:"var(--accent)" },
          { label:"Attendance (30d)",   value: att.length,     color:"var(--accent-2)" },
          { label:"Products Covered",   value: new Set(visits.flatMap((v: any) => v.products)).size, color:"var(--accent-3)" },
          { label:"Unique Clients",     value: new Set(visits.map((v: any) => v.clientId)).size,     color:"#a78bfa" },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding:"16px 20px" }}>
            <p style={{ fontSize:28, fontFamily:"Syne, sans-serif", fontWeight:700, color:s.color }}>{s.value}</p>
            <p style={{ fontSize:12.5, color:"var(--text-secondary)", marginTop:4 }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom:20 }}>
        <div className="card">
          <h3 style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>Daily Visits</h3>
          <p style={{ fontSize:12, color:"var(--text-secondary)", marginBottom:16 }}>Last 30 days</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={trend.filter((_,i) => i % 2 === 0).map(d => ({ ...d, day: d.date.slice(5) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{ fill:"var(--text-muted)", fontSize:10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill:"var(--text-muted)", fontSize:10 }} tickLine={false} axisLine={false} />
              <Tooltip content={<Tip />} />
              <Line type="monotone" dataKey="visits" stroke="var(--accent)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>Monthly Performance</h3>
          <p style={{ fontSize:12, color:"var(--text-secondary)", marginBottom:16 }}>Aggregated by month</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill:"var(--text-muted)", fontSize:10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill:"var(--text-muted)", fontSize:10 }} tickLine={false} axisLine={false} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="visits" radius={[3,3,0,0]} maxBarSize={28}>
                {monthly.map((_,i) => <Cell key={i} fill={i === monthly.length-1 ? "var(--accent)" : "rgba(59,110,248,0.4)"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Visits */}
      <div className="card">
        <h3 style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>Recent Visits</h3>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Client Name</th><th>Date</th><th>Check In</th><th>Check Out</th><th>Products</th><th>Location</th><th>Photo</th>{(activeUser?.role === "admin" || activeUser?.role === "head_admin") && <th>Actions</th>}</tr></thead>
            <tbody>
              {visits.map((v: any) => (
                <tr key={v.id}>
                  <td style={{ fontSize:13, color:"var(--text-secondary)", fontWeight: 500 }}>{v.clientName || v.clientId}</td>
                  <td style={{ fontSize:13, color:"var(--text-secondary)" }}>{new Date(v.date).toLocaleDateString("en", { day:"numeric", month:"short" })}</td>
                  <td style={{ fontSize:13, fontFamily:"monospace", color:"var(--accent-2)" }}>{v.checkIn || "—"}</td>
                  <td style={{ fontSize:13, fontFamily:"monospace", color:"var(--text-secondary)" }}>{v.checkOut || "—"}</td>
                  <td>
                    <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                      {v.products?.map((pid: string) => (
                        <span key={pid} style={{ background:"rgba(59,110,248,0.1)", color:"var(--accent)", borderRadius:4, padding:"2px 7px", fontSize:11 }}>{PRODUCTS[pid] || pid}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ fontSize:11, color:"var(--text-muted)" }}>
                    {v.checkInLocation && <div style={{ marginBottom:2 }}>In: {v.checkInLocation.lat.toFixed(4)}, {v.checkInLocation.lng.toFixed(4)}</div>}
                    {v.checkOutLocation && <div>Out: {v.checkOutLocation.lat.toFixed(4)}, {v.checkOutLocation.lng.toFixed(4)}</div>}
                    {!v.checkInLocation && !v.checkOutLocation && "—"}
                  </td>
                  <td>
                    {v.photoUrl ? (
                      <a href={v.photoUrl} target="_blank" rel="noreferrer">
                        <img src={v.photoUrl} alt="visit" style={{ width: 40, height: 40, objectFit:"cover", borderRadius:4, border:"1px solid var(--border-light)" }} />
                      </a>
                    ) : "—"}
                  </td>
                  {(activeUser?.role === "admin" || activeUser?.role === "head_admin") && (
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={async () => {
                        if (confirm("Delete this visit?")) {
                          await api.deleteVisit(v.id);
                          setVisits(visits.filter(vv => vv.id !== v.id));
                        }
                      }}>Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
