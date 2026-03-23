"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/context/AuthContext";

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await login(email, password);
    if (res.success) router.push("/dashboard");
    else { setError(res.error || "Login failed"); setLoading(false); }
  };

  return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 1px 1px, rgba(59,110,248,0.04) 1px, transparent 0)", backgroundSize: "40px 40px" }} />
      <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,110,248,0.08) 0%, transparent 70%)", top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }} />

      <div className="fade-in" style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 20, padding: "44px 40px", width: 420, position: "relative", zIndex: 1, boxShadow: "0 24px 80px rgba(0,0,0,0.5)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg, var(--accent), #6b9fff)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 8px 24px rgba(59,110,248,0.4)" }}>
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Fluense</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 13.5 }}>Medical Representative Platform</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Work Email</label>
            <input className="form-input" type="email" placeholder="name@fluense.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "10px 14px", color: "#ef4444", fontSize: 13, marginBottom: 16 }}>{error}</div>}
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%", justifyContent: "center", padding: "12px", marginTop: 4, fontSize: 14 }}>
            {loading ? <><span className="spinner" />Signing in...</> : "Sign In"}
          </button>
        </form>

        <div style={{ marginTop: 24, padding: 14, background: "var(--bg-input)", borderRadius: 8, fontSize: 12 }}>
          <p style={{ color: "var(--text-secondary)", marginBottom: 6, fontWeight: 600 }}>Demo Credentials:</p>
          {[["Head Admin", "rajesh.mehta@fluense.com", "admin123"],["Admin", "sneha.kulkarni@fluense.com", "admin123"],["MR", "arjun.patil@fluense.com", "mr123"]].map(([role, em, pw]) => (
            <p key={role} style={{ color: "var(--text-muted)", cursor: "pointer" }} onClick={() => { setEmail(em); setPassword(pw); }}>
              <strong style={{ color: "var(--text-secondary)" }}>{role}:</strong> {em}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <AuthProvider><LoginForm /></AuthProvider>;
}
