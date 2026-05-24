"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { auth } from "../lib/auth";

export default function Navbar() {
  const router = useRouter();
  const { role, isLoggedIn, mounted } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("darkMode") === "true";
    setDarkMode(saved);
    document.documentElement.setAttribute("data-theme", saved ? "dark" : "light");
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("darkMode", String(next));
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
  };

  const logout = () => {
    auth.clearSession();
    router.push("/login");
  };

  if (!mounted) return null;

  const navStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    padding: "0 24px",
    height: "64px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    transition: "all 0.3s ease",
    background: scrolled ? "var(--bg-glass)" : "transparent",
    backdropFilter: scrolled ? "blur(20px)" : "none",
    borderBottom: scrolled ? "1px solid var(--border)" : "none",
    boxShadow: scrolled ? "var(--shadow-sm)" : "none",
  };

  return (
    <nav style={navStyle}>
      {/* Logo */}
      <div
        onClick={() => router.push("/")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            background: "var(--gradient-primary)",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
          }}
        >
          🔧
        </div>
        <span
          style={{
            fontFamily: "var(--font-outfit)",
            fontSize: "20px",
            fontWeight: 700,
            background: "var(--gradient-primary)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          ServiceHub
        </span>
      </div>

      {/* Desktop Nav Links */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <NavLink onClick={() => router.push("/services")} label="Services" />

        {isLoggedIn && role === "user" && (
          <NavLink onClick={() => router.push("/bookings")} label="My Bookings" />
        )}
        {isLoggedIn && role === "provider" && (
          <NavLink onClick={() => router.push("/provider-dashboard")} label="Dashboard" />
        )}
        {isLoggedIn && role === "admin" && (
          <NavLink onClick={() => router.push("/admin")} label="Admin" />
        )}
        <NavLink onClick={() => router.push("/support")} label="Support" />

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDark}
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            border: "1.5px solid var(--border)",
            background: "var(--bg-card)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "16px",
            transition: "all 0.2s ease",
          }}
          title="Toggle dark mode"
        >
          {darkMode ? "☀️" : "🌙"}
        </button>

        {/* Auth Buttons */}
        {!isLoggedIn ? (
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => router.push("/login")}
              className="btn btn-secondary"
              style={{ padding: "8px 16px", fontSize: "13px" }}
            >
              Login
            </button>
            <button
              onClick={() => router.push("/signup")}
              className="btn btn-primary"
              style={{ padding: "8px 16px", fontSize: "13px" }}
            >
              Sign Up
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            className="btn btn-danger"
            style={{ padding: "8px 16px", fontSize: "13px" }}
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}

function NavLink({ onClick, label }: { onClick: () => void; label: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "var(--bg-muted)" : "transparent",
        color: hovered ? "var(--primary)" : "var(--text-secondary)",
        border: "none",
        padding: "8px 14px",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: 500,
        transition: "all 0.2s ease",
      }}
    >
      {label}
    </button>
  );
}