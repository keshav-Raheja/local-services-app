"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  User,
  Briefcase,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import api from "../../lib/api";

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedRole = searchParams.get("role");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: requestedRole === "provider" ? "provider" : "user",
    phone: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (requestedRole === "provider") {
      setForm((f) => ({ ...f, role: "provider" }));
    }
  }, [requestedRole]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSignup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");

    if (!form.name || !form.email || !form.password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (form.role === "provider" && !form.phone) {
      setError("Phone number is required for verified service professionals.");
      return;
    }

    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(form.email.trim())) {
      setError("Please enter a valid Gmail address (ending in @gmail.com).");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

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
          maxWidth: "480px",
          padding: "40px 32px",
          boxShadow: "var(--shadow-md)",
          border: "1px solid var(--border)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
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
            Create Your Account
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Join SevaHub to book local services or list your professional business
          </p>
        </div>

        {/* Role Toggle Selector */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px",
            padding: "4px",
            background: "var(--bg-muted)",
            borderRadius: "var(--radius-md)",
            marginBottom: "24px",
          }}
        >
          <button
            type="button"
            onClick={() => set("role", "user")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "10px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 600,
              background: form.role === "user" ? "var(--bg-card)" : "transparent",
              color: form.role === "user" ? "var(--primary)" : "var(--text-secondary)",
              boxShadow: form.role === "user" ? "var(--shadow-xs)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            <User size={15} />
            <span>Customer</span>
          </button>

          <button
            type="button"
            onClick={() => set("role", "provider")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "10px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 600,
              background: form.role === "provider" ? "var(--bg-card)" : "transparent",
              color: form.role === "provider" ? "var(--primary)" : "var(--text-secondary)",
              boxShadow: form.role === "provider" ? "var(--shadow-xs)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            <Briefcase size={15} />
            <span>Service Partner</span>
          </button>
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

        <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
              Full Name
            </label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Ananya Sharma"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
              Email Address (Gmail required)
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
                placeholder="yourname@gmail.com"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                style={{ paddingLeft: "40px" }}
                required
              />
            </div>
          </div>

          {form.role === "provider" && (
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                Working Mobile Phone Number
              </label>
              <div style={{ position: "relative" }}>
                <Phone
                  size={16}
                  color="var(--text-muted)"
                  style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }}
                />
                <input
                  type="tel"
                  className="input"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  style={{ paddingLeft: "40px" }}
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
              Create Password (min. 6 characters)
            </label>
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
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
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
            style={{ width: "100%", padding: "12px", marginTop: "10px", fontSize: "14px" }}
          >
            {loading ? "Creating Account..." : form.role === "provider" ? "Register as Partner" : "Create Account"}
          </button>
        </form>

        <div
          style={{
            marginTop: "24px",
            paddingTop: "18px",
            borderTop: "1px solid var(--border)",
            textAlign: "center",
            fontSize: "13px",
            color: "var(--text-secondary)",
          }}
        >
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--primary)", fontWeight: 700, textDecoration: "none" }}>
            Sign In Here →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Signup() {
  return (
    <Suspense fallback={<div className="page" style={{ paddingTop: "80px", textAlign: "center" }}>Loading signup...</div>}>
      <SignupContent />
    </Suspense>
  );
}
