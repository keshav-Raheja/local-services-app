"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";
import { auth } from "../../lib/auth";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    if (!email || !password) { setError("Please fill in all fields"); return; }

    setLoading(true);
    try {
      const data: any = await api.post("/auth/login", { email, password });
      auth.setSession(data.token, data.role);
      router.push(data.role === "provider" ? "/provider-dashboard" : data.role === "admin" ? "/admin" : "/services");
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--gradient-hero)", padding: "24px",
    }}>
      {/* Glows */}
      <div style={{ position: "fixed", width: 400, height: 400, borderRadius: "50%", background: "rgba(99,102,241,0.15)", filter: "blur(80px)", top: "10%", left: "10%", pointerEvents: "none" }} />
      <div style={{ position: "fixed", width: 300, height: 300, borderRadius: "50%", background: "rgba(6,182,212,0.15)", filter: "blur(80px)", bottom: "15%", right: "10%", pointerEvents: "none" }} />

      <div style={{
        width: "100%", maxWidth: "420px", background: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: "24px", padding: "40px 36px", position: "relative",
        animation: "fadeIn 0.5s ease",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            width: "56px", height: "56px", background: "var(--gradient-primary)",
            borderRadius: "16px", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: "26px", margin: "0 auto 16px",
          }}>
            🔧
          </div>
          <h1 style={{ fontFamily: "var(--font-outfit)", fontSize: "1.6rem", fontWeight: 700, color: "white", marginBottom: "6px" }}>
            Welcome Back
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>Sign in to your ServiceHub account</p>
        </div>

        {/* Role selector */}
        <div style={{ display: "flex", background: "rgba(255,255,255,0.08)", borderRadius: "12px", padding: "4px", marginBottom: "24px", gap: "4px" }}>
          {["user", "provider", "admin"].map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              style={{
                flex: 1, padding: "8px", borderRadius: "9px", border: "none", cursor: "pointer",
                background: role === r ? "var(--primary)" : "transparent",
                color: role === r ? "white" : "rgba(255,255,255,0.6)",
                fontSize: "13px", fontWeight: 600, transition: "all 0.2s ease", textTransform: "capitalize",
              }}
            >
              {r === "user" ? "👤" : r === "provider" ? "🔧" : "⚙️"} {r}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "10px", padding: "12px 14px", marginBottom: "20px",
            color: "#fca5a5", fontSize: "13px",
          }}>
            ❌ {error}
          </div>
        )}

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            style={{
              padding: "13px 16px", borderRadius: "12px",
              border: "1.5px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.08)", color: "white",
              fontSize: "14px", outline: "none", transition: "all 0.2s ease",
            }}
          />
          <div style={{ position: "relative" }}>
            <input
              type={showPass ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              style={{
                width: "100%", padding: "13px 44px 13px 16px", borderRadius: "12px",
                border: "1.5px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.08)", color: "white",
                fontSize: "14px", outline: "none", transition: "all 0.2s ease",
              }}
            />
            <button
              onClick={() => setShowPass(!showPass)}
              style={{
                position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", fontSize: "16px",
              }}
            >
              {showPass ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="btn btn-primary"
          style={{ width: "100%", marginTop: "24px", padding: "14px", fontSize: "15px", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Signing in..." : "Sign In →"}
        </button>

        <p style={{ textAlign: "center", marginTop: "24px", color: "rgba(255,255,255,0.5)", fontSize: "13px" }}>
          Don't have an account?{" "}
          <span
            onClick={() => router.push("/signup")}
            style={{ color: "#818cf8", cursor: "pointer", fontWeight: 600 }}
          >
            Sign up free
          </span>
        </p>
      </div>
    </div>
  );
}