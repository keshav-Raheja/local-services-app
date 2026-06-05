"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";

export default function Signup() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "user", phone: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSignup = async () => {
    setError("");
    if (!form.name || !form.email || !form.password) { setError("Please fill in all fields"); return; }
    if (form.role === "provider" && !form.phone) { setError("Phone number is required for providers"); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters"); return; }

    setLoading(true);
    try {
      await api.post("/auth/register", form);
      router.push("/login?registered=1");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    padding: "13px 16px", borderRadius: "12px",
    border: "1.5px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.08)", color: "white",
    fontSize: "14px", outline: "none", width: "100%",
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--gradient-hero)", padding: "24px",
    }}>
      <div style={{ position: "fixed", width: 400, height: 400, borderRadius: "50%", background: "rgba(99,102,241,0.15)", filter: "blur(80px)", top: "10%", right: "10%", pointerEvents: "none" }} />

      <div style={{
        width: "100%", maxWidth: "440px",
        background: "rgba(255,255,255,0.08)", backdropFilter: "blur(24px)",
        border: "1px solid rgba(255,255,255,0.15)", borderRadius: "24px",
        padding: "40px 36px", animation: "fadeIn 0.5s ease",
      }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            width: "56px", height: "56px", background: "var(--gradient-primary)",
            borderRadius: "16px", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: "26px", margin: "0 auto 16px",
          }}>
            🔧
          </div>
          <h1 style={{ fontFamily: "var(--font-outfit)", fontSize: "1.6rem", fontWeight: 700, color: "white", marginBottom: "6px" }}>
            Create Account
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>Join ServiceHub today — it's free!</p>
        </div>

        {/* Role selector */}
        <div style={{ display: "flex", background: "rgba(255,255,255,0.08)", borderRadius: "12px", padding: "4px", marginBottom: "24px", gap: "4px" }}>
          {[{ v: "user", label: "👤 Customer" }, { v: "provider", label: "🔧 Provider" }].map(({ v, label }) => (
            <button
              key={v}
              onClick={() => set("role", v)}
              style={{
                flex: 1, padding: "9px", borderRadius: "9px", border: "none", cursor: "pointer",
                background: form.role === v ? "var(--primary)" : "transparent",
                color: form.role === v ? "white" : "rgba(255,255,255,0.6)",
                fontSize: "13px", fontWeight: 600, transition: "all 0.2s ease",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {error && (
          <div style={{
            background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "10px", padding: "12px 14px", marginBottom: "20px",
            color: "#fca5a5", fontSize: "13px",
          }}>
            ❌ {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <input placeholder="Full Name" value={form.name} onChange={(e) => set("name", e.target.value)} style={inputStyle} />
          <input type="email" placeholder="Email address" value={form.email} onChange={(e) => set("email", e.target.value)} style={inputStyle} />
          {form.role === "provider" && (
            <input placeholder="Phone number" value={form.phone} onChange={(e) => set("phone", e.target.value)} style={inputStyle} />
          )}
          <div style={{ position: "relative" }}>
            <input
              type={showPass ? "text" : "password"}
              placeholder="Password (min. 6 characters)"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              style={{ ...inputStyle, paddingRight: "44px" }}
            />
            <button
              onClick={() => setShowPass(!showPass)}
              style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "16px" }}
            >
              {showPass ? "🙈" : "👁️"}
            </button>
          </div>

          {/* Password strength */}
          {form.password && (
            <div style={{ display: "flex", gap: "4px", marginTop: "-6px" }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{
                  flex: 1, height: "3px", borderRadius: "2px", transition: "background 0.3s ease",
                  background: form.password.length >= i * 4
                    ? i <= 1 ? "#ef4444" : i === 2 ? "#f59e0b" : "#10b981"
                    : "rgba(255,255,255,0.1)",
                }} />
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleSignup}
          disabled={loading}
          className="btn btn-primary"
          style={{ width: "100%", marginTop: "24px", padding: "14px", fontSize: "15px", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Creating account..." : "Create Account →"}
        </button>

        <p style={{ textAlign: "center", marginTop: "24px", color: "rgba(255,255,255,0.5)", fontSize: "13px" }}>
          Already have an account?{" "}
          <span onClick={() => router.push("/login")} style={{ color: "#818cf8", cursor: "pointer", fontWeight: 600 }}>
            Sign in
          </span>
        </p>
      </div>
    </div>
  );
}