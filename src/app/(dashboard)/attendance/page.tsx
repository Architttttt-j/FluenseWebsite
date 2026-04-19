"use client";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api-client";

function dur(ci: string, co: string) {
  if (!ci || !co) return "—";
  const [ih,im] = ci.split(":").map(Number), [oh,om] = co.split(":").map(Number);
  const mins = (oh*60+om)-(ih*60+im);
  return mins < 0 ? "—" : `${Math.floor(mins/60)}h ${mins%60}m`;
}

export default function AttendancePage() {
  const { activeUser } = useAuth();
  const [logs, setLogs]           = useState<any[]>([]);
  const [users, setUsers]         = useState<any[]>([]);
  const [selectedDate, setDate]   = useState("");
  const [selectedMR, setMR]       = useState("");
  const [summary, setSummary]     = useState<any>(null);
  const [loading, setLoading]     = useState(true);

  const isMR = activeUser?.role === "mr";

  const load = useCallback(async () => {
    setLoading(true);
    const params: any = {};
    if (selectedDate) params.date = selectedDate;
    if (selectedMR) params.mrId = selectedMR;
    const data = await api.getAttendance(params);
    setLogs(data);
    setLoading(false);
  }, [selectedDate, selectedMR]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!isMR) {
      api.getUsers({ role: "mr" }).then((d: any) => setUsers(d.users || []));
      api.getTodaySummary().then(setSummary).catch(() => {});
    }
  }, [isMR]);

  return (
    <div className="page-content fade-in">
      <div className="flex-between" style={{ marginBottom:24 }}>
        <div>
          <h1 className="page-title">Attendance</h1>
          <p style={{ fontSize:13, color:"var(--text-secondary)" }}>
            {isMR ? "Your check-in / check-out history" : summary ? `${summary.present} / ${summary.totalMrs} present today` : "Loading..."}
          </p>
        </div>
      </div>

      {!isMR && summary && (
        <div className="grid-4" style={{ marginBottom:24 }}>
          {[
            { label:"Total MRs",     value: summary.totalMrs,  color:"var(--accent)" },
            { label:"Present Today", value: summary.present,   color:"var(--accent-2)" },
            { label:"Absent Today",  value: summary.absent,    color:"var(--accent-danger)" },
            { label:"Rate",          value: summary.totalMrs > 0 ? `${Math.round((summary.present/summary.totalMrs)*100)}%` : "0%", color:"var(--accent-3)" },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding:"16px 20px" }}>
              <p style={{ fontSize:28, fontFamily:"Syne, sans-serif", fontWeight:700, color:s.color }}>{s.value}</p>
              <p style={{ fontSize:12.5, color:"var(--text-secondary)", marginTop:4 }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap" }}>
        <div>
          <label className="form-label">Date</label>
          <input className="form-input" type="date" value={selectedDate} onChange={e => setDate(e.target.value)} style={{ width:"auto" }} />
        </div>
        {!isMR && (
          <div>
            <label className="form-label">MR</label>
            <select className="form-select" value={selectedMR} onChange={e => setMR(e.target.value)} style={{ width:"auto" }}>
              <option value="">All MRs</option>
              {users.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        )}
        <div style={{ alignSelf:"flex-end" }}>
          <button className="btn btn-secondary btn-sm" onClick={() => { setDate(""); setMR(""); }}>Clear</button>
        </div>
      </div>

      <div className="card" style={{ padding:0 }}>
        <div className="table-wrapper">
          <table>
            <thead><tr>
              {!isMR && <th>MR</th>}
              <th>Date</th><th>Check In</th><th>Check Out</th><th>Duration</th><th>Location</th><th>Status</th>
              {!isMR && <th>Actions</th>}
            </tr></thead>
            <tbody>
              {logs.map((log: any) => {
                const mr = users.find((u: any) => u.id === log.mrId);
                const status = !log.checkIn ? "absent" : !log.checkOut ? "checked-in" : "completed";
                return (
                  <tr key={log.id}>
                    {!isMR && (
                      <td>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div className="avatar" style={{ width:28, height:28, fontSize:10 }}>
                            {(mr?.name || "?").split(" ").map((n: string) => n[0]).join("").slice(0,2)}
                          </div>
                          <span style={{ fontSize:13.5, fontWeight:500 }}>{mr?.name || log.mrId}</span>
                        </div>
                      </td>
                    )}
                    <td style={{ fontSize:13, color:"var(--text-secondary)" }}>
                      {new Date(log.date).toLocaleDateString("en", { weekday:"short", month:"short", day:"numeric" })}
                    </td>
                    <td style={{ fontFamily:"monospace", color:"var(--accent-2)", fontSize:13 }}>{log.checkIn || "—"}</td>
                    <td style={{ fontFamily:"monospace", color:"var(--text-secondary)", fontSize:13 }}>{log.checkOut || "—"}</td>
                    <td style={{ fontSize:13, fontWeight:500 }}>{dur(log.checkIn, log.checkOut)}</td>
                    <td style={{ fontSize:12, color:"var(--text-muted)" }}>
                      {log.checkInLocation ? `${log.checkInLocation.lat?.toFixed(4)}, ${log.checkInLocation.lng?.toFixed(4)}` : "—"}
                    </td>
                    <td>
                      <span className="badge" style={{
                        background: status==="completed" ? "rgba(16,185,129,0.1)" : status==="checked-in" ? "rgba(59,110,248,0.1)" : "rgba(239,68,68,0.1)",
                        color: status==="completed" ? "var(--accent-success)" : status==="checked-in" ? "var(--accent)" : "var(--accent-danger)",
                      }}>
                        {status === "completed" ? "Completed" : status === "checked-in" ? "Checked In" : "Absent"}
                      </span>
                    </td>
                    {!isMR && (
                      <td>
                        <button className="btn btn-danger btn-sm" onClick={async () => {
                          if (confirm("Delete this attendance record?")) {
                            await api.deleteAttendance(log.id);
                            setLogs(logs.filter(l => l.id !== log.id));
                          }
                        }}>Delete</button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!loading && logs.length === 0 && <div style={{ padding:40, textAlign:"center", color:"var(--text-muted)" }}>No attendance records found</div>}
        </div>
      </div>
    </div>
  );
}
