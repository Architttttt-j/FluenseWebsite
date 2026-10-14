"use client";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api-client";
import { downloadCsv } from "@/lib/csv";

export default function ClientsPage() {
  const { activeUser } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [counts, setCounts]   = useState({ doctor: 0, retailer: 0, stockist: 0, total: 0 });
  const [search, setSearch]   = useState("");
  const [typeFilter, setType] = useState<"doctor" | "retailer" | "stockist">("doctor");
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [page, setPage]       = useState(1);
  const [limit, setLimit]     = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", type: "doctor", specialty: "", address: "", phone: "", regionId: "" });
  const [regions, setRegions] = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        type: typeFilter,
        page: String(page),
        limit: String(limit),
        month: selectedMonth,
      };
      if (search.trim()) params.search = search.trim();

      const res = await api.getClients(params);

      if (res && res.clients) {
        setClients(res.clients);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
        if (res.counts) setCounts(res.counts);
      } else if (Array.isArray(res)) {
        setClients(res);
        setTotal(res.length);
        setTotalPages(1);
      }
    } catch (e) {
      console.error("Error loading clients:", e);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, page, limit, selectedMonth]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    api.getRegions().then(setRegions).catch(() => {});
  }, []);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const data = await api.getClients({
        type: typeFilter,
        limit: "1000",
        month: selectedMonth,
        ...(search ? { search: search.trim() } : {}),
      });
      const list = Array.isArray(data) ? data : (data?.clients || []);
      if (!list.length) return;
      downloadCsv(`client-report-${typeFilter}-${selectedMonth}.csv`, [
        "Client",
        "Type",
        "Region",
        "Address",
        "Phone",
        "Specialty",
        "Visit Month",
        "Visits",
        "Target Status",
        "Last Visit",
      ], list.map((client: any) => {
        const monthCount = client.monthVisitsCount ?? 0;
        const lastVisit = client.lastVisitDate;
        return [
          client.name,
          client.type,
          client.region,
          client.address || "",
          client.phone || "",
          client.specialty || "",
          selectedMonth,
          monthCount,
          monthCount >= 2 ? "Completed" : "Pending",
          lastVisit ? new Date(lastVisit).toLocaleDateString("en", { day: "numeric", month: "short" }) : "Never",
        ];
      }));
    } catch (err) {
      console.error("Export failed", err);
    } finally {
      setExporting(false);
    }
  };

  const currentTypeLabel = typeFilter === "doctor" ? "Doctors" : typeFilter === "retailer" ? "Retailers" : "Stockists";

  return (
    <div className="page-content fade-in">
      <div className="flex-between" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Clients</h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            Managing {counts.total || total} territory clients • Viewing {currentTypeLabel}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary" onClick={exportCsv} disabled={exporting || loading || !clients.length}>
            {exporting ? "Exporting..." : "Download CSV"}
          </button>
          {(activeUser?.role === "admin" || activeUser?.role === "head_admin") && (
            <button className="btn btn-primary" onClick={() => setShowAdd(true)}>Add Client</button>
          )}
        </div>
      </div>

      {/* Type Toggle Cards - Switch between Doctors, Retailers, Stockists */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        {[
          { label: "Doctors",   count: counts.doctor,   color: "var(--accent)",   type: "doctor" as const },
          { label: "Retailers", count: counts.retailer, color: "var(--accent-3)", type: "retailer" as const },
          { label: "Stockists", count: counts.stockist, color: "var(--accent-2)", type: "stockist" as const },
        ].map(t => {
          const isActive = typeFilter === t.type;
          return (
            <div
              key={t.label}
              className="card"
              style={{
                padding: "16px 20px",
                cursor: "pointer",
                border: isActive ? `2px solid ${t.color}` : "1px solid var(--border)",
                boxShadow: isActive ? "0 4px 12px rgba(0,0,0,0.06)" : "none",
                background: isActive ? "var(--bg-card)" : "var(--bg-card)",
                transition: "all 0.15s ease",
              }}
              onClick={() => {
                if (typeFilter !== t.type) {
                  setType(t.type);
                  setPage(1);
                }
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ fontSize: 28, fontWeight: 700, color: t.color }}>{t.count}</p>
                {isActive ? (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 99, background: `${t.color}18`, color: t.color }}>
                    Active
                  </span>
                ) : (
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Click to view</span>
                )}
              </div>
              <p style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, color: isActive ? "var(--text-primary)" : "var(--text-secondary)", marginTop: 4 }}>
                {t.label}
              </p>
              <div style={{ width: 28, height: 3, background: isActive ? t.color : "transparent", borderRadius: 99, marginTop: 8 }} />
            </div>
          );
        })}
      </div>

      {/* Controls & Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div className="search-box" style={{ flex: 1, minWidth: 220 }}>
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="var(--text-muted)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            placeholder={`Search ${currentTypeLabel.toLowerCase()} by name, address, specialty...`}
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {/* Strict toggle buttons for Doctor, Retailer, Stockist only */}
        <div style={{ display: "inline-flex", background: "var(--bg-secondary)", padding: 3, borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
          {[
            { label: "Doctors", value: "doctor" as const },
            { label: "Retailers", value: "retailer" as const },
            { label: "Stockists", value: "stockist" as const },
          ].map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setType(opt.value);
                setPage(1);
              }}
              style={{
                padding: "6px 14px",
                fontSize: 12.5,
                fontWeight: typeFilter === opt.value ? 700 : 500,
                color: typeFilter === opt.value ? "var(--text-primary)" : "var(--text-secondary)",
                background: typeFilter === opt.value ? "var(--bg-card)" : "transparent",
                border: "none",
                borderRadius: "calc(var(--radius-sm) - 2px)",
                cursor: "pointer",
                boxShadow: typeFilter === opt.value ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <label className="form-label" style={{ margin: 0, display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
          Visit month:
          <input
            className="form-input"
            type="month"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            style={{ width: "auto" }}
          />
        </label>
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Add New Client</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
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
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
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

      {/* Clients Table with Embedded Visit Stats */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Type</th>
                <th>Region</th>
                <th>Address</th>
                <th>Visit Month</th>
                <th>Target Status</th>
                <th>Last Visit</th>
                {(activeUser?.role === "admin" || activeUser?.role === "head_admin") && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {clients.map((c: any) => {
                const monthVisits = c.monthVisitsCount ?? 0;
                const lv = c.lastVisitDate;
                return (
                  <tr key={c.id}>
                    <td>
                      <p style={{ fontWeight: 600 }}>{c.name}</p>
                      {c.specialty && <p style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{c.specialty}</p>}
                      <p style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{c.phone}</p>
                    </td>
                    <td><span className={`badge badge-${c.type}`}>{c.type}</span></td>
                    <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>{c.region}</td>
                    <td style={{ fontSize: 12.5, color: "var(--text-secondary)", maxWidth: 180 }}>{c.address}</td>
                    <td>
                      <span style={{ fontWeight: 700 }}>{monthVisits}</span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 4 }}>/ 2 req</span>
                    </td>
                    <td>
                      <span className={`badge ${monthVisits >= 2 ? "badge-active" : "badge-inactive"}`}>
                        {monthVisits >= 2 ? "Completed" : "Pending"}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                      {lv ? (
                        new Date(lv).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })
                      ) : (
                        <span style={{ color: "var(--accent-danger)" }}>Never</span>
                      )}
                    </td>
                    {(activeUser?.role === "admin" || activeUser?.role === "head_admin") && (
                      <td>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={async () => {
                            if (confirm(`Delete ${c.name}?`)) {
                              await api.deleteClient(c.id);
                              load();
                            }
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {loading && (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
              Loading {currentTypeLabel.toLowerCase()}...
            </div>
          )}

          {!loading && clients.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
              No {currentTypeLabel.toLowerCase()} found matching your criteria.
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 20px",
            borderTop: "1px solid var(--border)",
            flexWrap: "wrap",
            gap: 12,
            background: "var(--bg-card)",
            borderRadius: "0 0 var(--radius) var(--radius)",
          }}
        >
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            Showing {total === 0 ? 0 : (page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total} {currentTypeLabel.toLowerCase()}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>Rows per page:</span>
              <select
                className="form-select"
                value={limit}
                onChange={e => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                style={{ padding: "4px 8px", fontSize: 12.5, width: "auto", height: "auto" }}
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span style={{ fontSize: 12.5, fontWeight: 600, padding: "0 6px" }}>
                Page {page} of {Math.max(1, totalPages)}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page >= totalPages || loading}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
