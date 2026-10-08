"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api-client";
import { downloadCsv } from "@/lib/csv";

const localDate = () => new Date().toLocaleDateString("en-CA");

export default function MRPage() {
  const { activeUser, impersonateUser } = useAuth();
  const router = useRouter();
  const [users, setUsers]         = useState<any[]>([]);
  const [regions, setRegions]     = useState<any[]>([]);
  const [targets, setTargets]     = useState<Record<string, any>>({});
  const [search, setSearch]       = useState("");
  const [filterRegion, setFilterRegion] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [targetMr, setTargetMr] = useState<any>(null);
  const [saving, setSaving]       = useState(false);
  const [savingTarget, setSavingTarget] = useState(false);
  const [form, setForm]           = useState({ name:"", email:"", password:"", role:"mr", regionId:"", phone:"", dob:"" });
  const [targetForm, setTargetForm] = useState({ date: localDate(), target: "", description: "" });

  const load = useCallback(async () => {
    const params: any = {};
    if (search) params.search = search;
    if (filterRegion) params.regionId = filterRegion;
    if (filterStatus) params.status = filterStatus;
    const data = await api.getUsers(params);
    setUsers(data.users || []);
    if (activeUser?.role !== "mr") {
      const goals = await api.getGoals({ date: localDate(), ...(filterRegion ? { regionId: filterRegion } : {}) });
      setTargets((goals || []).reduce((map: Record<string, any>, goal: any) => {
        map[goal.mrId] = goal;
        return map;
      }, {}));
    }
  }, [search, filterRegion, filterStatus, activeUser?.role]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.getRegions().then(setRegions); }, []);

  const handleToggle = async (id: string) => {
    await api.toggleStatus(id);
    load();
  };

  const handleAdd = async () => {
    if (!form.name || !form.email || !form.password || !form.regionId) return;
    setSaving(true);
    try {
      const region = regions.find((r: any) => r.id === form.regionId);
      await api.createUser({ ...form, region: region?.name || "" });
      setShowModal(false);
      setForm({ name:"", email:"", password:"", role:"mr", regionId:"", phone:"", dob:"" });
      load();
    } finally { setSaving(false); }
  };

  const handleTarget = async () => {
    if (!targetMr || !targetForm.date || targetForm.target === "") return;
    setSavingTarget(true);
    try {
      await api.createGoal({ mrId: targetMr.id, ...targetForm, target: Number(targetForm.target) });
      setTargetMr(null);
      setTargetForm({ date: localDate(), target: "", description: "" });
      await load();
    } finally { setSavingTarget(false); }
  };

  const exportCsv = () => {
    if (!users.length) return;
    downloadCsv("mr-management-report.csv", ["Name", "Email", "Role", "Region", "Status", "Phone"], users.map((user: any) => [
      user.name,
      user.email,
      roleLabel[user.role] || user.role,
      user.region,
      user.status,
      user.phone,
    ]));
  };

  const roleLabel: Record<string, string> = { head_admin:"Head Admin", admin:"Regional Admin", mr:"Medical Rep" };
  const isHA = activeUser?.role === "head_admin";
  const isAdmin = activeUser?.role === "admin";

  return (
    <div className="page-content fade-in">
      <div className="flex-between" style={{ marginBottom:24 }}>
        <div>
          <h1 className="page-title">MR Management</h1>
          <p style={{ fontSize:13, color:"var(--text-secondary)" }}>{users.length} users found</p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button className="btn btn-secondary" onClick={exportCsv} disabled={!users.length}>Download CSV</button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Member</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap" }}>
        <div className="search-box">
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="var(--text-muted)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input placeholder="Search name or email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {isHA && (
          <select className="form-select" value={filterRegion} onChange={e => setFilterRegion(e.target.value)} style={{ width:"auto" }}>
            <option value="">All Regions</option>
            {regions.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        )}
        <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width:"auto" }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="card" style={{ padding:0 }}>
        <div className="table-wrapper">
          <table>
            <thead><tr>
              <th>Name</th><th>Email</th><th>Role</th><th>Region</th><th>Today&apos;s Target</th><th>Status</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div className="avatar">{u.name.split(" ").map((n: string) => n[0]).join("").slice(0,2)}</div>
                      <div>
                        <p style={{ fontWeight:500 }}>{u.name}</p>
                        <p style={{ fontSize:11.5, color:"var(--text-muted)" }}>{u.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ color:"var(--text-secondary)", fontSize:13 }}>{u.email}</td>
                  <td><span className={`badge badge-${u.role}`}>{roleLabel[u.role]}</span></td>
                  <td style={{ fontSize:13 }}>{u.region}</td>
                  <td style={{ fontSize:13, fontWeight:600, color:targets[u.id] ? "var(--accent-2)" : "var(--text-muted)" }}>
                    {targets[u.id] ? `${targets[u.id].achieved || 0} / ${targets[u.id].target}` : "Not assigned"}
                  </td>
                  <td><span className={`badge badge-${u.status}`}>{u.status}</span></td>
                  <td>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/mr/${u.id}`)}>View</button>
                      {(isHA || (isAdmin && u.role === "mr")) && (
                        <button className="btn btn-primary btn-sm" onClick={() => router.push(`/profile/${u.id}`)}>Edit</button>
                      )}
                      {(isHA || (isAdmin && u.role === "mr")) && <>
                        <button className={`btn btn-sm ${u.status === "active" ? "btn-danger" : "btn-success"}`} onClick={() => handleToggle(u.id)}>
                          {u.status === "active" ? "Deactivate" : "Activate"}
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => impersonateUser(u.id)}>Login as</button>
                        {u.role === "mr" && <button className="btn btn-secondary btn-sm" onClick={() => setTargetMr(u)}>Set Target</button>}
                      </>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <div style={{ padding:40, textAlign:"center", color:"var(--text-muted)" }}>No users found</div>}
        </div>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal fade-in">
            <div className="flex-between" style={{ marginBottom:20 }}>
              <h3 style={{ fontSize:18, fontWeight:700 }}>Add New Member</h3>
              <button onClick={() => setShowModal(false)} style={{ background:"none", border:"none", color:"var(--text-secondary)", cursor:"pointer", fontSize:20 }}>×</button>
            </div>
            <div className="grid-2">
              {[
                { label:"Full Name *",    key:"name",     type:"text",  placeholder:"John Doe" },
                { label:"Work Email *",   key:"email",    type:"email", placeholder:"name@fluense.com" },
                { label:"Date of Birth",  key:"dob",      type:"date",  placeholder:"" },
                { label:"Phone",          key:"phone",    type:"text",  placeholder:"+91 99999 00000" },
              ].map(f => (
                <div key={f.key} className="form-group">
                  <label className="form-label">{f.label}</label>
                  <input className="form-input" type={f.type} placeholder={f.placeholder}
                    value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
                </div>
              ))}
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="mr">Medical Representative</option>
                  {isHA && <option value="admin">Regional Admin</option>}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Region *</label>
                <select className="form-select" value={form.regionId} onChange={e => setForm({ ...form, regionId: e.target.value })}>
                  <option value="">Select Region</option>
                  {(isAdmin ? regions.filter((r: any) => r.id === activeUser?.regionId) : regions).map((r: any) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Initial Password</label>
              <input className="form-input" type="password" autoComplete="new-password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
            <div style={{ display:"flex", gap:10, marginTop:8 }}>
              <button className="btn btn-secondary" style={{ flex:1, justifyContent:"center" }} onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex:1, justifyContent:"center" }} onClick={handleAdd} disabled={saving}>
                {saving ? <span className="spinner" /> : "Add Member"}
              </button>
            </div>
          </div>
        </div>
      )}

      {targetMr && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setTargetMr(null)}>
          <div className="modal fade-in">
            <div className="flex-between" style={{ marginBottom:20 }}>
              <div>
                <h3 style={{ fontSize:18, fontWeight:700 }}>Set Daily Target</h3>
                <p style={{ fontSize:12, color:"var(--text-secondary)", marginTop:4 }}>{targetMr.name}</p>
              </div>
              <button onClick={() => setTargetMr(null)} style={{ background:"none", border:"none", color:"var(--text-secondary)", cursor:"pointer", fontSize:20 }}>×</button>
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input className="form-input" type="date" value={targetForm.date} onChange={e => setTargetForm({ ...targetForm, date: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Target Calls *</label>
              <input className="form-input" type="number" min="0" step="1" placeholder="e.g. 20" value={targetForm.target} onChange={e => setTargetForm({ ...targetForm, target: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Note</label>
              <input className="form-input" placeholder="Optional note" value={targetForm.description} onChange={e => setTargetForm({ ...targetForm, description: e.target.value })} />
            </div>
            <div style={{ display:"flex", gap:10, marginTop:8 }}>
              <button className="btn btn-secondary" style={{ flex:1, justifyContent:"center" }} onClick={() => setTargetMr(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex:1, justifyContent:"center" }} onClick={handleTarget} disabled={savingTarget || !targetForm.target}>
                {savingTarget ? <span className="spinner" /> : "Save Target"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
