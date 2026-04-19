"use client";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api-client";

export default function ClientsPage() {
  const { activeUser } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [visits, setVisits]   = useState<any[]>([]);
  const [search, setSearch]   = useState("");
  const [typeFilter, setType] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", type: "doctor", specialty: "", address: "", phone: "", regionId: "" });
  const [regions, setRegions] = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const params: any = {};
    if (search) params.search = search;
    if (typeFilter) params.type = typeFilter;
    const [c, v] = await Promise.all([
      api.getClients(params),
      api.getVisits({ days: "30" }),
    ]);
    setClients(c); setVisits(v);
    setLoading(false);
  }, [search, typeFilter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    api.getRegions().then(setRegions);
  }, []);

  const getVisitCount = (clientId: string) => visits.filter((v: any) => v.clientId === clientId).length;
  const getLastVisit  = (clientId: string) => {
    const cv = visits.filter((v: any) => v.clientId === clientId).sort((a: any, b: any) => b.date.localeCompare(a.date));
    return cv[0] || null;
  };

  const counts = { doctor: 0, retailer: 0, stockist: 0 } as Record<string, number>;
  clients.forEach((c: any) => { if (counts[c.type] !== undefined) counts[c.type]++; });

  return (
    <div className="page-content fade-in">
      <div className="flex-between" style={{ marginBottom:24 }}>
        <div>
          <h1 className="page-title">Clients</h1>
          <p style={{ fontSize:13, color:"var(--text-secondary)" }}>{clients.length} clients in your territory</p>
        </div>
        {(activeUser?.role === "admin" || activeUser?.role === "head_admin") && (
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>Add Client</button>
        )}
      </div>

      <div className="grid-3" style={{ marginBottom:24 }}>
        {[
          { label:"Doctors",   count: counts.doctor,   color:"var(--accent)",   type:"doctor" },
          { label:"Retailers", count: counts.retailer, color:"var(--accent-3)", type:"retailer" },
          { label:"Stockists", count: counts.stockist, color:"var(--accent-2)", type:"stockist" },
        ].map(t => (
          <div key={t.label} className="card" style={{ padding:"16px 20px", cursor:"pointer" }} onClick={() => setType(typeFilter === t.type ? "" : t.type)}>
            <p style={{ fontSize:28, fontFamily:"Syne, sans-serif", fontWeight:700, color:t.color }}>{t.count}</p>
            <p style={{ fontSize:13, color:"var(--text-secondary)", marginTop:4 }}>{t.label}</p>
            {typeFilter === t.type && <div style={{ width:20, height:3, background:t.color, borderRadius:99, marginTop:8 }} />}
          </div>
        ))}
      </div>

      <div style={{ display:"flex", gap:12, marginBottom:20 }}>
        <div className="search-box">
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="var(--text-muted)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-select" value={typeFilter} onChange={e => setType(e.target.value)} style={{ width:"auto" }}>
          <option value="">All Types</option>
          <option value="doctor">Doctors</option>
          <option value="retailer">Retailers</option>
          <option value="stockist">Stockists</option>
        </select>
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom:20 }}>
          <h3 style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>Add New Client</h3>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:16 }}>
            <div>
              <label className="form-label">Name</label>
              <input className="form-input" value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Type</label>
              <select className="form-select" value={newClient.type} onChange={e => setNewClient({ ...newClient, type: e.target.value })}>
                <option value="doctor">Doctor</option>
                <option value="retailer">Retailer</option>
                <option value="stockist">Stockist</option>
              </select>
            </div>
            <div>
              <label className="form-label">Specialty</label>
              <input className="form-input" value={newClient.specialty} onChange={e => setNewClient({ ...newClient, specialty: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Phone</label>
              <input className="form-input" value={newClient.phone} onChange={e => setNewClient({ ...newClient, phone: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Address</label>
              <input className="form-input" value={newClient.address} onChange={e => setNewClient({ ...newClient, address: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Region</label>
              <select className="form-select" value={newClient.regionId} onChange={e => setNewClient({ ...newClient, regionId: e.target.value })}>
                <option value="">Select Region</option>
                {regions.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display:"flex", gap:8, marginTop:16 }}>
            <button className="btn btn-primary" onClick={async () => {
              await api.createClient(newClient);
              setNewClient({ name: "", type: "doctor", specialty: "", address: "", phone: "", regionId: "" });
              setShowAdd(false);
              load();
            }}>Add Client</button>
            <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="card" style={{ padding:0 }}>
        <div className="table-wrapper">
          <table>
            <thead><tr>
              <th>Client</th><th>Type</th><th>Region</th><th>Address</th><th>Monthly Visits</th><th>Last Visit</th>
              {(activeUser?.role === "admin" || activeUser?.role === "head_admin") && <th>Actions</th>}
            </tr></thead>
            <tbody>
              {clients.map((c: any) => {
                const mv = getVisitCount(c.id);
                const lv = getLastVisit(c.id);
                return (
                  <tr key={c.id}>
                    <td>
                      <p style={{ fontWeight:500 }}>{c.name}</p>
                      {c.specialty && <p style={{ fontSize:11.5, color:"var(--text-muted)" }}>{c.specialty}</p>}
                      <p style={{ fontSize:11.5, color:"var(--text-muted)" }}>{c.phone}</p>
                    </td>
                    <td><span className={`badge badge-${c.type}`}>{c.type}</span></td>
                    <td style={{ fontSize:13, color:"var(--text-secondary)" }}>{c.region}</td>
                    <td style={{ fontSize:12.5, color:"var(--text-secondary)", maxWidth:160 }}>{c.address}</td>
                    <td>
                      <span style={{ fontWeight:700, fontFamily:"Syne, sans-serif", color: mv >= 2 ? "var(--accent-success)" : mv === 1 ? "var(--accent-3)" : "var(--accent-danger)" }}>{mv}</span>
                      <span style={{ fontSize:11, color:"var(--text-muted)", marginLeft:4 }}>/ 2 req</span>
                    </td>
                    <td style={{ fontSize:13, color:"var(--text-secondary)" }}>
                      {lv ? new Date(lv.date).toLocaleDateString("en", { day:"numeric", month:"short" }) : <span style={{ color:"var(--accent-danger)" }}>Never</span>}
                    </td>
                    {(activeUser?.role === "admin" || activeUser?.role === "head_admin") && (
                      <td>
                        <button className="btn btn-danger btn-sm" onClick={async () => {
                          if (confirm("Delete this client?")) {
                            await api.deleteClient(c.id);
                            setClients(clients.filter(cc => cc.id !== c.id));
                          }
                        }}>Delete</button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!loading && clients.length === 0 && <div style={{ padding:40, textAlign:"center", color:"var(--text-muted)" }}>No clients found</div>}
        </div>
      </div>
    </div>
  );
}
