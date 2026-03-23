"use client";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/layout/Sidebar";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

function Guard({ children }: { children: React.ReactNode }) {
  const { activeUser, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !activeUser) router.push("/login");
  }, [loading, activeUser, router]);

  if (loading) return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)" }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );
  if (!activeUser) return null;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <header style={{ height: "var(--header-height)", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", flexShrink: 0 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
            {pathname.includes("/mr/") ? "MR Detail" :
             pathname === "/mr" ? "MR Management" :
             pathname === "/attendance" ? "Attendance" :
             pathname === "/clients" ? "Clients" :
             pathname === "/reports" ? "Reports" :
             pathname.startsWith("/profile") ? "Profile" : "Dashboard"}
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>{activeUser.region}</span>
            <div className="avatar" style={{ width: 32, height: 32, fontSize: 11 }}>
              {activeUser.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
            </div>
          </div>
        </header>
        <main style={{ flex: 1, overflow: "hidden" }}>{children}</main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Guard>{children}</Guard>
    </AuthProvider>
  );
}
