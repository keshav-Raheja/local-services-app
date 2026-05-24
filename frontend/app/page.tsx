"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const services = [
  { icon: "⚡", name: "Electrician", desc: "Wiring, repairs & installations", color: "#fbbf24" },
  { icon: "🔧", name: "Plumber", desc: "Pipes, leaks & fixtures", color: "#60a5fa" },
  { icon: "📚", name: "Tutor", desc: "Academic & skill coaching", color: "#a78bfa" },
  { icon: "💻", name: "Laptop Repair", desc: "Hardware & software fixes", color: "#34d399" },
  { icon: "🎨", name: "Painter", desc: "Interior & exterior painting", color: "#f87171" },
  { icon: "🧹", name: "Cleaner", desc: "Deep cleaning services", color: "#06b6d4" },
  { icon: "❄️", name: "AC Repair", desc: "Servicing & installation", color: "#818cf8" },
  { icon: "🔑", name: "Locksmith", desc: "Lock repair & key cutting", color: "#fb923c" },
];

const stats = [
  { value: "500+", label: "Verified Providers" },
  { value: "10K+", label: "Happy Customers" },
  { value: "50+", label: "Services Available" },
  { value: "4.8★", label: "Average Rating" },
];

const steps = [
  { icon: "🔍", title: "Browse Services", desc: "Explore a wide range of professional home services tailored for you." },
  { icon: "📋", title: "Book Instantly", desc: "Select your preferred provider, pick a date, and confirm in seconds." },
  { icon: "✅", title: "Get It Done", desc: "Sit back while a verified professional handles the job." },
];

export default function Home() {
  const router = useRouter();
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 20 - 10;
      const y = (e.clientY / window.innerHeight) * 20 - 10;
      el.style.backgroundPosition = `${50 + x * 0.3}% ${50 + y * 0.3}%`;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div className="page">
      {/* HERO */}
      <div
        ref={heroRef}
        style={{
          minHeight: "100vh",
          background: "var(--gradient-hero)",
          backgroundSize: "200% 200%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "120px 24px 80px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          transition: "background-position 0.3s ease",
        }}
      >
        {/* Glow blobs */}
        <div style={{
          position: "absolute", width: 400, height: 400, borderRadius: "50%",
          background: "rgba(99,102,241,0.15)", filter: "blur(80px)",
          top: "10%", left: "10%", animation: "float 6s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute", width: 300, height: 300, borderRadius: "50%",
          background: "rgba(6,182,212,0.15)", filter: "blur(80px)",
          bottom: "15%", right: "10%", animation: "float 8s ease-in-out infinite reverse",
        }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: "800px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: "9999px", padding: "6px 16px", marginBottom: "24px", fontSize: "13px", color: "rgba(255,255,255,0.8)"
          }}>
            ✨ Trusted by 10,000+ customers across the city
          </div>

          <h1 style={{
            fontFamily: "var(--font-outfit)",
            fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
            fontWeight: 800,
            color: "white",
            lineHeight: 1.15,
            marginBottom: "24px",
          }}>
            Home Services at<br />
            <span style={{ background: "linear-gradient(135deg, #818cf8, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Your Doorstep
            </span>
          </h1>

          <p style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.7)", marginBottom: "40px", maxWidth: "560px", margin: "0 auto 40px" }}>
            Book trusted, verified professionals for any home service — fast, reliable, and affordable.
          </p>

          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => router.push("/services")}
              className="btn btn-primary"
              style={{ padding: "14px 32px", fontSize: "16px" }}
            >
              🔍 Explore Services
            </button>
            <button
              onClick={() => router.push("/signup")}
              style={{
                padding: "14px 32px", fontSize: "16px",
                background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.3)",
                color: "white", borderRadius: "9999px", cursor: "pointer", fontWeight: 600, transition: "all 0.2s ease"
              }}
            >
              Become a Provider →
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: "absolute", bottom: "32px", color: "rgba(255,255,255,0.4)", fontSize: "12px", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
          <span>Scroll to explore</span>
          <div style={{ width: "1px", height: "40px", background: "rgba(255,255,255,0.2)" }} />
        </div>
      </div>

      {/* STATS */}
      <div style={{ background: "var(--gradient-primary)", padding: "40px 24px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "32px", textAlign: "center" }}>
          {stats.map((s) => (
            <div key={s.label}>
              <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "white", fontFamily: "var(--font-outfit)" }}>{s.value}</div>
              <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.75)", marginTop: "4px" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* SERVICES PREVIEW */}
      <div className="section">
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h2 className="section-title">Popular Services</h2>
          <p className="section-subtitle">Find the right professional for any job</p>
        </div>
        <div className="grid-4">
          {services.map((s) => (
            <div
              key={s.name}
              className="card"
              onClick={() => router.push("/services")}
              style={{ padding: "28px 20px", textAlign: "center", cursor: "pointer" }}
            >
              <div style={{
                width: "56px", height: "56px", borderRadius: "16px",
                background: `${s.color}20`, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "28px", margin: "0 auto 16px",
              }}>
                {s.icon}
              </div>
              <h3 style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px" }}>{s.name}</h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{s.desc}</p>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <button onClick={() => router.push("/services")} className="btn btn-primary" style={{ padding: "12px 32px" }}>
            View All Services →
          </button>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div style={{ background: "var(--bg-muted)", padding: "80px 24px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">Get started in 3 simple steps</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "32px", marginTop: "48px" }}>
            {steps.map((step, i) => (
              <div key={step.title} style={{ position: "relative" }}>
                <div style={{
                  width: "72px", height: "72px", borderRadius: "20px",
                  background: "var(--gradient-primary)", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: "32px", margin: "0 auto 20px",
                  boxShadow: "var(--shadow-glow)",
                }}>
                  {step.icon}
                </div>
                <div style={{
                  position: "absolute", top: "-8px", right: "calc(50% - 52px)",
                  width: "24px", height: "24px", borderRadius: "50%",
                  background: "var(--primary)", color: "white", fontSize: "12px",
                  fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {i + 1}
                </div>
                <h3 style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "10px" }}>{step.title}</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA BANNER */}
      <div style={{ padding: "80px 24px", textAlign: "center", background: "var(--bg)" }}>
        <div style={{
          maxWidth: "700px", margin: "0 auto", background: "var(--gradient-hero)",
          borderRadius: "24px", padding: "60px 40px", position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", width: 200, height: 200, borderRadius: "50%",
            background: "rgba(99,102,241,0.3)", filter: "blur(60px)", top: "-50px", left: "-50px",
          }} />
          <h2 style={{ fontFamily: "var(--font-outfit)", fontSize: "2rem", fontWeight: 700, color: "white", marginBottom: "16px", position: "relative" }}>
            Are You a Professional?
          </h2>
          <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: "32px", position: "relative" }}>
            Join thousands of providers earning on ServiceHub. Sign up as a provider and start getting bookings today.
          </p>
          <button
            onClick={() => router.push("/signup")}
            className="btn"
            style={{ background: "white", color: "var(--primary)", padding: "14px 32px", fontSize: "15px", position: "relative" }}
          >
            Join as Provider →
          </button>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ background: "var(--bg-card)", borderTop: "1px solid var(--border)", padding: "32px 24px", textAlign: "center" }}>
        <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>
          © 2025 ServiceHub. Built with ❤️ for local communities.
        </div>
      </footer>
    </div>
  );
}