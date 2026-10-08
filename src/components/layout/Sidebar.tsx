"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

const NAV = [
  { path: "/dashboard",   label: "Dashboard",      roles: ["head_admin","admin","mr"],  icon: "grid" },
  { path: "/mr",          label: "MR Management",  roles: ["head_admin","admin"],        icon: "users" },
  { path: "/attendance",  label: "Attendance",     roles: ["head_admin","admin","mr"],  icon: "clock" },
  { path: "/clients",     label: "Clients",        roles: ["head_admin","admin","mr"],  icon: "map-pin" },
  { path: "/reports",     label: "Reports",        roles: ["head_admin","admin"],        icon: "bar-chart" },
  { path: "/products",    label: "Products",       roles: ["head_admin"],                icon: "package" },
  { path: "/profile",     label: "Profile",        roles: ["head_admin","admin","mr"],  icon: "user" },
];

function Icon({ name }: { name: string }) {
  const icons: Record<string, React.ReactNode> = {
    grid:      <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>,
    users:     <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    clock:     <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    "map-pin": <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>,
    "bar-chart":<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
    package:   <><path d="m16.5 9.4-9-5.19"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,
    user:      <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    logout:    <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    chevron:   <polyline points="9 18 15 12 9 6"/>,
    x:         <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  };
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  );
}

export { Icon };

export default function Sidebar() {
  const { activeUser, impersonating, logout, stopImpersonating } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const visible = NAV.filter(n => n.roles.includes(activeUser?.role || ""));
  const roleColor: Record<string, string> = { head_admin: "var(--accent-3)", admin: "var(--accent)", mr: "var(--accent-2)" };
  const roleLabel: Record<string, string> = { head_admin: "Head Admin", admin: "Regional Admin", mr: "MR" };

  return (
    <aside className="app-sidebar" style={{
      width: collapsed ? 72 : "var(--sidebar-width)", flexShrink: 0,
      background: "var(--bg-secondary)", borderRight: "1px solid var(--border)",
      display: "flex", flexDirection: "column", transition: "width 0.25s ease", overflow: "hidden",
    }}>
      {/* Logo */}
      <div className="sidebar-brand" style={{ height: "var(--header-height)", display: "flex", alignItems: "center", padding: collapsed ? "0 18px" : "0 20px", gap: 12, borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <img src="/fluense-logo.svg" alt="Fluense Healthcare Pvt. Ltd." style={{ width: collapsed ? 36 : 190, height: collapsed ? 36 : "auto", objectFit: collapsed ? "cover" : "contain", objectPosition: "left center", flexShrink: 0 }} />
      </div>

      {/* Nav */}
      <nav className="sidebar-nav" style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
        {visible.map(item => {
          const active = pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path));
          return (
            <Link key={item.path} href={item.path} style={{ textDecoration: "none" }} aria-current={active ? "page" : undefined}>
              <div className="sidebar-link" style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 14px", borderRadius: 9, marginBottom: 3, cursor: "pointer", transition: "all 0.15s",
                background: active ? "var(--accent-glow)" : "transparent",
                color: active ? "var(--accent)" : "var(--text-secondary)",
                border: active ? "1px solid rgba(59,110,248,0.15)" : "1px solid transparent",
                justifyContent: collapsed ? "center" : "flex-start", position: "relative",
              }}>
                <Icon name={item.icon} />
                {!collapsed && <span style={{ fontSize: 13.5, fontWeight: active ? 600 : 400 }}>{item.label}</span>}
                {active && <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 20, background: "var(--accent)", borderRadius: "0 3px 3px 0" }} />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="sidebar-user-panel" style={{ padding: "12px 10px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
        {!collapsed && activeUser && (
          <div className="sidebar-user-card" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "var(--bg-card)", borderRadius: 9, marginBottom: 8 }}>
            <div className="avatar" style={{ width: 32, height: 32, fontSize: 11 }}>
              {activeUser.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{activeUser.name}</p>
              <p style={{ fontSize: 11, color: roleColor[activeUser.role] }}>{roleLabel[activeUser.role]}</p>
            </div>
          </div>
        )}
        <div className="sidebar-controls" style={{ display: "flex", gap: 6 }}>
          <button className="btn btn-secondary btn-sm" onClick={logout} style={{ flex: 1, justifyContent: "center" }} aria-label="Log out" title="Log out">
            <Icon name="logout" /> {!collapsed && "Logout"}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setCollapsed(!collapsed)} style={{ padding: "6px 10px" }} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!collapsed}>
            <Icon name="chevron" />
          </button>
        </div>
      </div>

      {/* Impersonation banner */}
      {impersonating && (
        <div className="impersonation-banner">
          <span>⚠️ Viewing as <strong>{impersonating.name}</strong></span>
          <button onClick={stopImpersonating} style={{ background: "rgba(0,0,0,0.2)", border: "none", borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="x" /> Stop
          </button>
        </div>
      )}
    </aside>
  );
}
