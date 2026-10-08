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
    <div className="login-shell">
      <div className="login-panel fade-in">
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src="/fluense-logo.svg" alt="Fluense Healthcare Pvt. Ltd." style={{ display: "block", width: "100%", height: "auto", margin: "0 auto 20px" }} />
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

      </div>
    </div>
  );
}

export default function LoginPage() {
  return <AuthProvider><LoginForm /></AuthProvider>;
}
