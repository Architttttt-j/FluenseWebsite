"use client";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api-client";
import { downloadCsv } from "@/lib/csv";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#0d6c85","#367f79","#8b745c","#bd744f","#5e7d8b","#789b8c","#a78b70","#7d8f70"];
const PRODUCTS: Record<string, string> = { p001:"Fluensol 500mg", p002:"Caldent Plus", p003:"NeuPlex D3", p004:"Gastrovex", p005:"CardiShield", p006:"DiabaCare XR", p007:"RespiClear", p008:"PainEase 650" };
const Tip = ({ active, payload, label }: any) => active && payload?.length ? (
  <div style={{ background:"var(--bg-card)", border:"1px solid var(--border-light)", borderRadius:8, padding:"10px 14px", fontSize:12.5 }}>
    <p style={{ color:"var(--text-secondary)", marginBottom:4 }}>{label}</p>
    {payload.map((p: any, i: number) => <p key={i} style={{ color:p.color, fontWeight:600 }}>{p.name}: {p.value}</p>)}
  </div>
) : null;

export default function ReportsPage() {
  const { activeUser } = useAuth();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [stats, setStats]       = useState<any>(null);
  const [mrPerf, setMrPerf]     = useState<any[]>([]);
  const [prodStats, setProd]    = useState<any>(null);
  const [regions, setRegions]   = useState<any[]>([]);
  const [availableRegions, setAvailableRegions] = useState<any[]>([]);
  const [reportClients, setReportClients] = useState<any[]>([]);
  const [reportVisits, setReportVisits] = useState<any[]>([]);

  const period = selectedWeek
    ? `week${selectedYear}-${selectedMonth}-${selectedWeek}`
    : selectedMonth
      ? `month${selectedYear}-${selectedMonth}`
      : `year${selectedYear}`;

  const reportRange = (() => {
    if (!selectedMonth) return { start: `${selectedYear}-01-01`, end: `${selectedYear}-12-31` };
    const month = Number(selectedMonth);
    const lastDay = new Date(Number(selectedYear), month, 0).getDate();
    if (!selectedWeek) return { start: `${selectedYear}-${selectedMonth}-01`, end: `${selectedYear}-${selectedMonth}-${String(lastDay).padStart(2, "0")}` };
    const startDay = 1 + (Number(selectedWeek) - 1) * 7;
    const endDay = Math.min(Number(selectedWeek) * 7, lastDay);
    return {
      start: `${selectedYear}-${selectedMonth}-${String(startDay).padStart(2, "0")}`,
      end: `${selectedYear}-${selectedMonth}-${String(endDay).padStart(2, "0")}`,
    };
  })();

  const load = useCallback(async () => {
    const p = { period, ...(selectedRegion ? { regionId: selectedRegion } : {}) };
    const [s, mr, prod, clients, visits] = await Promise.all([
      api.getDashboardStats(p),
      api.getMRPerformance(p as any),
      api.getProductStats(p as any),
      api.getClients(selectedRegion ? { regionId: selectedRegion } : {}),
      api.getVisits({ from: reportRange.start, to: reportRange.end, limit: "10000", ...(selectedRegion ? { regionId: selectedRegion } : {}) }),
    ]);
    setStats(s); setMrPerf(mr.slice(0,8)); setProd(prod);
    setReportClients(clients || []); setReportVisits(visits || []);
    if (activeUser?.role === "head_admin") {
      api.getRegionComparison(p as any).then(setRegions);
    }
  }, [period, reportRange.start, reportRange.end, selectedRegion, activeUser]);

  const periodLabel = selectedWeek
    ? `Week ${selectedWeek} of ${new Date(Number(selectedYear), Number(selectedMonth) - 1).toLocaleString("en", { month: "long" })} ${selectedYear}`
    : selectedMonth
      ? `${new Date(Number(selectedYear), Number(selectedMonth) - 1).toLocaleString("en", { month: "long" })} ${selectedYear}`
      : String(selectedYear);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (activeUser?.role === "head_admin") api.getRegions().then(setAvailableRegions);
  }, [activeUser?.role]);

  const reportDoctors = reportClients.filter((client: any) => client.type === "doctor");
  const reportBuckets = [0, 1, 2, 3].map(bucket => {
    const start = new Date(`${reportRange.start}T00:00:00`);
    const end = new Date(`${reportRange.end}T00:00:00`);
    const span = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1);
    const bucketStart = new Date(start);
    bucketStart.setDate(start.getDate() + Math.floor(bucket * span / 4));
    const bucketEnd = new Date(start);
    bucketEnd.setDate(start.getDate() + Math.floor((bucket + 1) * span / 4) - 1);
    return { start: bucketStart.toISOString().slice(0, 10), end: bucketEnd.toISOString().slice(0, 10) };
  });
  const reportRows = reportDoctors.map((client: any, index: number) => {
    const visits = reportVisits.filter((visit: any) => visit.clientId === client.id);
    const bucketCounts = reportBuckets.map(bucket => visits.filter((visit: any) => visit.date >= bucket.start && visit.date <= bucket.end).length);
    return { client, serial: index + 1, bucketCounts, total: bucketCounts.reduce((sum, count) => sum + count, 0) };
  });
  const reportSummary = reportBuckets.map((bucket, index) => ({
    calls: reportRows.reduce((sum, row) => sum + row.bucketCounts[index], 0),
    doctors: reportRows.filter(row => row.bucketCounts[index] > 0).length,
  }));
  const reportTotalCalls = reportSummary.reduce((sum, bucket) => sum + bucket.calls, 0);
  const managerName = activeUser?.role === "admin" ? activeUser.name : "—";
  const selectedRegionName = availableRegions.find((region: any) => region.id === selectedRegion)?.name;
  const headquarters = selectedRegionName || activeUser?.region || reportDoctors[0]?.region || "—";

  const exportReportCsv = () => {
    if (!reportRows.length) return;
    downloadCsv(`doctor-visit-report-${selectedYear}${selectedMonth ? `-${selectedMonth}` : ""}.csv`, [
      "Name Of BE", "HQ", "Manager", "Total Calls", "No Of Drs", "Dr Name", "Speciality", "City", "Visit 1", "Visit 2", "Visit 3", "Visit 4",
    ], reportRows.map(row => [
      activeUser?.name || "—", headquarters, managerName, reportTotalCalls, reportDoctors.length,
      row.client.name, row.client.specialty || "—", row.client.region || "—", ...row.bucketCounts,
    ]));
  };

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
          {activeUser?.role === "head_admin" && <select className="form-select" value={selectedRegion} onChange={e => setSelectedRegion(e.target.value)} style={{ width:"auto" }}>
            <option value="">All Regions</option>
            {availableRegions.map((region: any) => <option key={region.id} value={region.id}>{region.name}</option>)}
          </select>}
          <select className="form-select" value={selectedYear} onChange={e => { setSelectedYear(e.target.value); setSelectedMonth(""); setSelectedWeek(""); }} style={{ width:"auto" }}>
            {Array.from({ length:5 }, (_, index) => currentYear - 4 + index).map(year => (
              <option key={year} value={String(year)}>{year}</option>
            ))}
          </select>
          <select className="form-select" value={selectedMonth} onChange={e => { setSelectedMonth(e.target.value); setSelectedWeek(""); }} style={{ width:"auto" }}>
            <option value="">All months</option>
            {Array.from({ length:12 }, (_, index) => <option key={index} value={String(index + 1).padStart(2, "0")}>{new Date(2000, index).toLocaleString("en", { month:"short" })}</option>)}
          </select>
          <select className="form-select" value={selectedWeek} onChange={e => setSelectedWeek(e.target.value)} disabled={!selectedMonth} style={{ width:"auto" }}>
            <option value="">All weeks</option>
            {[1,2,3,4].map(week => <option key={week} value={String(week)}>Week {week}</option>)}
          </select>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom:24 }}>
        {[
          { label:"Total Visits",   value: stats?.visitsInPeriod, color:"var(--accent)" },
          { label:"Active MRs",     value: stats?.totalMrs,     color:"var(--accent-2)" },
          { label:"Present Today",  value: stats?.presentToday, color:"var(--accent-3)" },
          { label:"Avg / MR",       value: stats?.avgVisitsPerMr, color:"var(--accent-3)" },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding:"16px 20px" }}>
            <p style={{ fontSize:28, fontWeight:700, color:s.color }}>{s.value ?? "—"}</p>
            <p style={{ fontSize:12.5, color:"var(--text-secondary)", marginTop:4 }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom:24, padding:0 }}>
        <div className="flex-between" style={{ padding:"18px 20px 14px", gap:12, flexWrap:"wrap" }}>
          <div>
            <h3 style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>Doctor Visit Report</h3>
            <p style={{ fontSize:12, color:"var(--text-secondary)" }}>Doctor-wise calls for {periodLabel}</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={exportReportCsv} disabled={!reportRows.length}>Download CSV</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"minmax(220px, 1.5fr) repeat(4, minmax(90px, 1fr)) minmax(90px, 1fr)", borderTop:"1px solid var(--border-light)", minWidth:760 }}>
          <div style={{ padding:"10px 14px", fontWeight:700 }}>Summary</div>
          {reportSummary.map((summary, index) => <div key={index} style={{ padding:"8px", textAlign:"center", borderLeft:"1px solid var(--border-light)" }}><small style={{ display:"block", color:"var(--text-muted)", fontSize:10, marginBottom:4 }}>Visit {index + 1}</small><strong>{summary.calls}</strong><small style={{ display:"block", color:"var(--text-muted)", fontSize:10 }}>{summary.doctors} Drs</small></div>)}
          <div style={{ padding:"8px", textAlign:"center", borderLeft:"1px solid var(--border-light)" }}><small style={{ display:"block", color:"var(--text-muted)", fontSize:10, marginBottom:4 }}>Total Calls</small><strong>{reportTotalCalls}</strong><small style={{ display:"block", color:"var(--text-muted)", fontSize:10 }}>All visits</small></div>
        </div>
        <div className="table-wrapper">
          <table style={{ minWidth:760 }}>
            <thead><tr><th>Sr No</th><th>Dr Name</th><th>Speciality</th><th>City</th><th>Visit 1</th><th>Visit 2</th><th>Visit 3</th><th>Visit 4</th><th>Total</th></tr></thead>
            <tbody>{reportRows.map(row => <tr key={row.client.id}><td>{row.serial}</td><td style={{ fontWeight:500 }}>{row.client.name}</td><td>{row.client.specialty || "—"}</td><td>{row.client.region || "—"}</td>{row.bucketCounts.map((count, index) => <td key={index}>{count || ""}</td>)}<td style={{ fontWeight:700 }}>{row.total || ""}</td></tr>)}</tbody>
          </table>
          {!reportRows.length && <div style={{ padding:32, textAlign:"center", color:"var(--text-muted)" }}>No doctor visit data for this period</div>}
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom:24 }}>
        <div className="card">
          <h3 style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>MR Performance</h3>
          <p style={{ fontSize:12, color:"var(--text-secondary)", marginBottom:16 }}>Visits per MR in {periodLabel}</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={mrPerf}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
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
          <p style={{ fontSize:12, color:"var(--text-secondary)", marginBottom:16 }}>Distribution in {periodLabel}</p>
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
                    <p style={{ fontSize:22, fontWeight:700, color:COLORS[i], lineHeight:1 }}>{item.value}</p>
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
          <p style={{ fontSize:12, color:"var(--text-secondary)", marginBottom:16 }}>Branch-wise performance in {periodLabel}</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={regions}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
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
