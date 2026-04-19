"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api-client";

export default function ProfilePage() {
  const params = useParams<{ id?: string }>();
  const router = useRouter();
  const { activeUser } = useAuth();
  const [user, setUser]     = useState<any>(null);
  const [regions, setRegions] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm]     = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [stats, setStats]   = useState<any>(null);

  const targetId = params?.id || activeUser?.id;
  const isSelf = activeUser?.id === targetId;
  const isHA   = activeUser?.role === "head_admin";
  const isAdmin = activeUser?.role === "admin";
  const canEditAll = isHA;

  useEffect(() => {
    if (!targetId) return;

    const loadData = async () => {
      const userData = await api.getUser(targetId);
      const regionsData = await api.getRegions();
      setUser(userData);
      setRegions(regionsData);
      setForm({ name: userData.name, phone: userData.phone || "", dob: userData.dob || "", regionId: userData.regionId || "", role: userData.role });

      if (userData.role === "mr") {
        const statsData = await api.getDashboardStats({ mrId: targetId });
        setStats(statsData);
      } else {
        setStats(null);
      }
    };

    loadData();
  }, [targetId]);

  const handleSave = async () => {
    setSaving(true);
    const region = regions.find((r: any) => r.id === form.regionId);
    await api.updateUser(targetId!, { ...form, region: region?.name || user.region });
    const updated = await api.getUser(targetId!);
    setUser(updated); setEditing(false); setSaving(false);
  };

  if (!user) return <div className="page-content" style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"80vh" }}><div className="spinner" style={{ width:32, height:32 }} /></div>;

  const roleLabel: Record<string, string> = { head_admin:"Head Admin", admin:"Regional Admin", mr:"Medical Representative" };
  const roleColor: Record<string, string> = { head_admin:"var(--accent-3)", admin:"var(--accent)", mr:"var(--accent-2)" };

  return (
    <div className="page-content fade-in">
      {params?.id && params.id !== activeUser?.id && (
        <button className="btn btn-secondary btn-sm" onClick={() => router.back()} style={{ marginBottom:16 }}>← Back</button>
      )}

      <div style={{ maxWidth:720 }}>
        <div className="card" style={{ marginBottom:20 }}>
          <div style={{ display:"flex", gap:20, alignItems:"flex-start" }}>
            <div style={{ position:"relative" }}>
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="avatar avatar-lg" style={{ objectFit: "cover" }} />
              ) : (
                <div className="avatar avatar-lg" style={{ background:`linear-gradient(135deg, ${roleColor[user.role]}, var(--accent))` }}>
                  {user.name.split(" ").map((n: string) => n[0]).join("").slice(0,2)}
                </div>
              )}
              {(isSelf || isHA || isAdmin) && (
                <label style={{ position:"absolute", bottom:0, right:0, width:24, height:24, borderRadius:"50%", background:"var(--accent)", border:"2px solid var(--bg-card)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  <input type="file" accept="image/*" style={{ display:"none" }} onChange={async e => {
                    if (e.target.files?.[0]) {
                      const updated = await api.uploadAvatar(user.id, e.target.files[0]);
                      setUser(updated);
                    }
                  }} />
                </label>
              )}
            </div>

            <div style={{ flex:1 }}>
              <div className="flex-between" style={{ marginBottom:8 }}>
                <div>
                  <h2 style={{ fontSize:22, fontWeight:700 }}>{user.name}</h2>
                  <span className={`badge badge-${user.role}`} style={{ marginTop:4, display:"inline-flex" }}>{roleLabel[user.role]}</span>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  {(canEditAll || isSelf) && !editing && (
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>Edit</button>
                  )}
                  {editing && <>
                    <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>{saving ? <span className="spinner" /> : "Save"}</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>Cancel</button>
                  </>}
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:0 }}>
                {[
                  { label:"Name",       value: user.name,     field:"name" },
                  { label:"Work Email", value: user.email,    field:"email", type:"email" },
                  { label:"Phone",      value: user.phone,    field:"phone" },
                  { label:"DOB",        value: user.dob ? new Date(user.dob).toLocaleDateString("en",{day:"numeric",month:"long",year:"numeric"}) : "—", field:"dob", type:"date" },
                  { label:"Region",     value: user.region,   field:"regionId", isSelect: true },
                  { label:"Role",       value: roleLabel[user.role], field: isHA ? "role" : null, isRoleSelect: true },
                  { label:"Joined",     value: user.joinDate ? new Date(user.joinDate).toLocaleDateString("en",{day:"numeric",month:"long",year:"numeric"}) : "—", field: null },
                ].map(item => (
                  <div key={item.label} style={{ padding:"12px 0", borderBottom:"1px solid rgba(31,45,71,0.5)" }}>
                    <p style={{ fontSize:11, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:4 }}>{item.label}</p>
                    {editing && item.field && canEditAll ? (
                      item.isSelect ? (
                        <select className="form-select" value={form.regionId} onChange={e => setForm({ ...form, regionId: e.target.value })} style={{ padding:"6px 10px", fontSize:13 }}>
                          {regions.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                      ) : item.isRoleSelect ? (
                        <select className="form-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={{ padding:"6px 10px", fontSize:13 }}>
                          <option value="mr">Medical Representative</option>
                          <option value="admin">Regional Admin</option>
                          <option value="head_admin">Head Admin</option>
                        </select>
                      ) : (
                        <input className="form-input" type={item.type || "text"} value={form[item.field] || ""} onChange={e => setForm({ ...form, [item.field!]: e.target.value })} style={{ padding:"6px 10px", fontSize:13 }} />
                      )
                    ) : (
                      <p style={{ fontSize:13.5, color:"var(--text-primary)" }}>{item.value || "—"}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {user.role === "mr" && stats && (
          <div className="card">
            <h3 style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>Activity Summary</h3>
            <div style={{ display:"flex", gap:16 }}>
              {[
                { label:"Monthly Visits",  value: stats.visitsThisMonth, color:"var(--accent)" },
                { label:"Weekly Visits",   value: stats.visitsThisWeek,  color:"var(--accent-2)" },
                { label:"Present Today",   value: stats.presentToday,    color:"var(--accent-3)" },
              ].map(s => (
                <div key={s.label} style={{ flex:1, background:"var(--bg-input)", borderRadius:10, padding:"14px 16px" }}>
                  <p style={{ fontSize:26, fontFamily:"Syne, sans-serif", fontWeight:700, color:s.color }}>{s.value}</p>
                  <p style={{ fontSize:12, color:"var(--text-secondary)", marginTop:4 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
