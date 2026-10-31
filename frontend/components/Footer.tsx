import Link from "next/link";
import { ShieldCheck, MapPin, Mail, Phone, Heart, Award } from "lucide-react";
import { POPULAR_INDIAN_CITIES } from "../lib/locations";

export default function Footer() {
  return (
    <footer
      style={{
        background: "var(--bg-card)",
        borderTop: "1px solid var(--border)",
        color: "var(--text-secondary)",
        marginTop: "auto",
        transition: "background-color 0.2s ease",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "64px 24px 32px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "40px",
            marginBottom: "48px",
          }}
        >
          {/* Brand Info */}
          <div style={{ maxWidth: "340px" }}>
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                textDecoration: "none",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "var(--primary)",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ShieldCheck size={20} strokeWidth={2.4} />
              </div>
              <span
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "20px",
                  fontWeight: 800,
                  color: "var(--primary)",
                  letterSpacing: "-0.02em",
                }}
              >
                Seva<span style={{ color: "var(--text-primary)" }}>Hub</span>
              </span>
            </Link>

            <p style={{ fontSize: "14px", lineHeight: 1.6, color: "var(--text-secondary)", marginBottom: "20px" }}>
              India’s dependable hyperlocal marketplace connecting homeowners with independent, verified trade professionals. Honest ratings, transparent rates, and direct communication.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)" }}>
                <MapPin size={15} color="var(--primary)" />
                <span>Operating across major Indian Metros</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)" }}>
                <Mail size={15} color="var(--primary)" />
                <span>support@sevahub.in</span>
              </div>
            </div>
          </div>

          {/* Service Categories */}
          <div>
            <h4
              style={{
                fontSize: "14px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--text-primary)",
                marginBottom: "18px",
              }}
            >
              Essential Services
            </h4>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px" }}>
              <li>
                <Link href="/services" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
                  Electrician & Wiring
                </Link>
              </li>
              <li>
                <Link href="/services" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
                  Plumbing & Leak Repairs
                </Link>
              </li>
              <li>
                <Link href="/services" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
                  AC Servicing & Gas Refill
                </Link>
              </li>
              <li>
                <Link href="/services" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
                  Home Deep Cleaning
                </Link>
              </li>
              <li>
                <Link href="/services" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
                  Interior & Exterior Painting
                </Link>
              </li>
              <li>
                <Link href="/services" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
                  Laptop & Desktop Diagnostics
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4
              style={{
                fontSize: "14px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--text-primary)",
                marginBottom: "18px",
              }}
            >
              Platform & Support
            </h4>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px" }}>
              <li>
                <Link href="/services" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
                  Browse All Categories
                </Link>
              </li>
              <li>
                <Link href="/signup?role=provider" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
                  Join as a Service Provider
                </Link>
              </li>
              <li>
                <Link href="/support" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
                  Customer Help Center & FAQ
                </Link>
              </li>
              <li>
                <Link href="/login" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
                  Partner & User Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Indian Cities Covered */}
          <div>
            <h4
              style={{
                fontSize: "14px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--text-primary)",
                marginBottom: "18px",
              }}
            >
              Cities Covered
            </h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {POPULAR_INDIAN_CITIES.slice(0, 8).map((c) => (
                <span
                  key={c.id}
                  style={{
                    padding: "4px 9px",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--bg-muted)",
                    color: "var(--text-secondary)",
                    fontSize: "12px",
                    fontWeight: 500,
                  }}
                >
                  {c.name}
                </span>
              ))}
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "14px", lineHeight: 1.5 }}>
              Expanding steadily to Tier 1 and Tier 2 cities with verified local technicians.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            borderTop: "1px solid var(--border)",
            paddingTop: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
            fontSize: "13px",
            color: "var(--text-muted)",
          }}
        >
          <div>
            © {new Date().getFullYear()} SevaHub India. Direct, transparent local service commerce.
          </div>
          <div style={{ display: "flex", gap: "16px" }}>
            <span>Verified Phone & KYC Profiles</span>
            <span>•</span>
            <span>No Hidden Commission Markups</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
