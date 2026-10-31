"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Eye, EyeOff, Lock, Mail, ArrowRight, AlertCircle } from "lucide-react";
import api from "../../lib/api";
import { auth } from "../../lib/auth";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    setLoading(true);
    try {
      const data: any = await api.post("/auth/login", { email, password });
      auth.setSession(data.token, data.role);
      router.push(
        data.role === "provider"
          ? "/provider-dashboard"
          : data.role === "admin"
          ? "/admin"
          : "/services"
      );
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        padding: "88px 20px 48px",
      }}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: "440px",
          padding: "40px 32px",
          boxShadow: "var(--shadow-md)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              textDecoration: "none",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                background: "var(--primary)",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(23, 77, 58, 0.25)",
              }}
            >
              <ShieldCheck size={24} strokeWidth={2.4} />
            </div>
          </Link>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              color: "var(--text-primary)",
              marginBottom: "6px",
            }}
          >
            Welcome Back
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Sign in to manage bookings or your provider profile
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "var(--radius-md)",
              background: "var(--danger-bg)",
              color: "var(--danger)",
              fontSize: "13px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--text-secondary)",
                marginBottom: "6px",
              }}
            >
              Email Address
            </label>
            <div style={{ position: "relative" }}>
              <Mail
                size={16}
                color="var(--text-muted)"
                style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }}
              />
              <input
                type="email"
                className="input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: "40px" }}
                required
              />
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>
                Password
              </label>
            </div>
            <div style={{ position: "relative" }}>
              <Lock
                size={16}
                color="var(--text-muted)"
                style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }}
              />
              <input
                type={showPass ? "text" : "password"}
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: "40px", paddingRight: "40px" }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: "100%", padding: "12px", marginTop: "8px", fontSize: "14px" }}
          >
            {loading ? "Signing in..." : "Sign In to Account"}
          </button>
        </form>

        <div
          style={{
            marginTop: "28px",
            paddingTop: "20px",
            borderTop: "1px solid var(--border)",
            textAlign: "center",
            fontSize: "13px",
            color: "var(--text-secondary)",
          }}
        >
          Don't have an account yet?{" "}
          <Link
            href="/signup"
            style={{ color: "var(--primary)", fontWeight: 700, textDecoration: "none" }}
          >
            Create an Account →
          </Link>
        </div>
      </div>
    </div>
  );
}
