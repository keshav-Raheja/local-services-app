"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  MapPin,
  ChevronDown,
  Menu,
  X,
  Sun,
  Moon,
  ShieldCheck,
  Briefcase,
  Calendar,
  Settings,
  HelpCircle,
  LogOut,
  User,
  Check,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { auth } from "../lib/auth";
import {
  POPULAR_INDIAN_CITIES,
  CityLocation,
  getSelectedCity,
  setSelectedCity,
  setUserLocation,
  searchLocations,
  reverseGeocodeCoords,
} from "../lib/locations";
import { UserLocation } from "../types";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { role, isLoggedIn, mounted } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [currentCity, setCurrentCity] = useState<CityLocation>(POPULAR_INDIAN_CITIES[0]);
  const [darkMode, setDarkMode] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState<UserLocation[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [manualAddress, setManualAddress] = useState("");

  useEffect(() => {
    const savedDark = localStorage.getItem("darkMode") === "true";
    setDarkMode(savedDark);
    document.documentElement.setAttribute("data-theme", savedDark ? "dark" : "light");

    const savedCity = getSelectedCity();
    if (savedCity) setCurrentCity(savedCity);

    const handleCityChange = (e: Event) => {
      const detail = (e as CustomEvent<UserLocation | null>).detail;
      if (detail?.city) {
        setCurrentCity({
          ...detail,
          id: detail.city.toLowerCase().replace(/s+/g, "-"),
          name: detail.city,
        });
      }
    };
    window.addEventListener("city_changed", handleCityChange);
    return () => window.removeEventListener("city_changed", handleCityChange);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 15);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("darkMode", String(next));
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
  };

  const handleCitySelect = (city: CityLocation) => {
    setCurrentCity(city);
    setSelectedCity(city);
    setCityModalOpen(false);
  };

  const selectLocation = (location: UserLocation) => {
    if (!location.city.trim()) {
      setLocationError("The selected result does not include a city.");
      return;
    }
    setUserLocation({ ...location, source: location.source || "search" });
    setCurrentCity({
      ...location,
      id: location.city.toLowerCase().replace(/s+/g, "-"),
      name: location.city,
    });
    setCityModalOpen(false);
    setLocationQuery("");
    setLocationResults([]);
    setManualAddress("");
  };

  const handleLocationSearch = async (query: string) => {
    setLocationQuery(query);
    setLocationError("");
    if (query.trim().length < 2) {
      setLocationResults([]);
      return;
    }
    setLocationLoading(true);
    try {
      setLocationResults(await searchLocations(query));
    } catch {
      setLocationError("Unable to search locations. You can enter an address manually.");
    } finally {
      setLocationLoading(false);
    }
  };

  const useCurrentLocation = () => {
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError("Current location is not supported by this browser.");
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          selectLocation(await reverseGeocodeCoords(coords.latitude, coords.longitude));
        } catch {
          setLocationError("Unable to determine your address. Enter it manually instead.");
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        setLocationLoading(false);
        setLocationError("Location permission was denied. Enter your address manually instead.");
      }
    );
  };

  const saveManualAddress = () => {
    const address = manualAddress.trim();
    if (!address) {
      setLocationError("Enter an address before saving.");
      return;
    }
    selectLocation({ city: address, address, displayLabel: address, source: "manual" });
  };

  const logout = () => {
    auth.clearSession();
    router.push("/login");
  };

  if (!mounted) return null;

  return (
    <>
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 90,
          height: "68px",
          display: "flex",
          alignItems: "center",
          transition: "background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
          background: scrolled ? "var(--bg-glass)" : "var(--bg)",
          backdropFilter: scrolled ? "blur(16px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(16px)" : "none",
          borderBottom: `1px solid ${scrolled ? "var(--border)" : "var(--border-subtle)"}`,
          boxShadow: scrolled ? "var(--shadow-xs)" : "none",
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            width: "100%",
            margin: "0 auto",
            padding: "0 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          {/* Brand + Location */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <Link
              href="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "10px",
                  background: "var(--primary)",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(23, 77, 58, 0.25)",
                }}
              >
                <ShieldCheck size={22} strokeWidth={2.4} />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "20px",
                    fontWeight: 800,
                    color: "var(--primary)",
                    lineHeight: 1.1,
                    letterSpacing: "-0.02em",
                  }}
                >
                  Seva<span style={{ color: "var(--text-primary)" }}>Hub</span>
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    color: "var(--text-muted)",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  Local Services India
                </span>
              </div>
            </Link>

            {/* Indian City Selector */}
            <button
              onClick={() => setCityModalOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "var(--radius-full)",
                background: "var(--sage-light)",
                border: "1px solid var(--sage)",
                color: "var(--primary)",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              title="Change your city"
            >
              <MapPin size={14} strokeWidth={2.4} />
              <span>{currentCity.name}</span>
              <ChevronDown size={14} opacity={0.7} />
            </button>
          </div>

          {/* Desktop Nav Links */}
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
            className="hidden-mobile"
          >
            <Link
              href="/services"
              style={{
                padding: "8px 14px",
                borderRadius: "var(--radius-md)",
                color: pathname === "/services" ? "var(--primary)" : "var(--text-secondary)",
                fontWeight: 500,
                fontSize: "14px",
                textDecoration: "none",
                background: pathname === "/services" ? "var(--sage-light)" : "transparent",
                transition: "all 0.15s ease",
              }}
            >
              Explore Services
            </Link>

            {isLoggedIn && role === "user" && (
              <Link
                href="/bookings"
                style={{
                  padding: "8px 14px",
                  borderRadius: "var(--radius-md)",
                  color: pathname === "/bookings" ? "var(--primary)" : "var(--text-secondary)",
                  fontWeight: 500,
                  fontSize: "14px",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: pathname === "/bookings" ? "var(--sage-light)" : "transparent",
                }}
              >
                <Calendar size={15} />
                My Bookings
              </Link>
            )}

            {isLoggedIn && role === "provider" && (
              <Link
                href="/provider-dashboard"
                style={{
                  padding: "8px 14px",
                  borderRadius: "var(--radius-md)",
                  color: pathname === "/provider-dashboard" ? "var(--primary)" : "var(--text-secondary)",
                  fontWeight: 500,
                  fontSize: "14px",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: pathname === "/provider-dashboard" ? "var(--sage-light)" : "transparent",
                }}
              >
                <Briefcase size={15} />
                Provider Dashboard
              </Link>
            )}

            {isLoggedIn && role === "admin" && (
              <Link
                href="/admin"
                style={{
                  padding: "8px 14px",
                  borderRadius: "var(--radius-md)",
                  color: pathname === "/admin" ? "var(--primary)" : "var(--text-secondary)",
                  fontWeight: 500,
                  fontSize: "14px",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: pathname === "/admin" ? "var(--sage-light)" : "transparent",
                }}
              >
                <Settings size={15} />
                Admin
              </Link>
            )}

            <Link
              href="/support"
              style={{
                padding: "8px 14px",
                borderRadius: "var(--radius-md)",
                color: pathname === "/support" ? "var(--primary)" : "var(--text-secondary)",
                fontWeight: 500,
                fontSize: "14px",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: pathname === "/support" ? "var(--sage-light)" : "transparent",
              }}
            >
              <HelpCircle size={15} />
              Help & FAQ
            </Link>
          </nav>

          {/* Right Action Bar */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDark}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "var(--radius-full)",
                border: "1px solid var(--border)",
                background: "var(--bg-card)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-secondary)",
                transition: "all 0.15s ease",
              }}
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {!isLoggedIn ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Link
                  href="/signup?role=provider"
                  className="btn btn-sage hidden-mobile"
                  style={{
                    padding: "7px 14px",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  <Briefcase size={14} />
                  List Your Service
                </Link>
                <button
                  onClick={() => router.push("/login")}
                  className="btn btn-secondary hidden-mobile"
                  style={{ padding: "7px 14px", fontSize: "13px" }}
                >
                  Log In
                </button>
                <button
                  onClick={() => router.push("/signup")}
                  className="btn btn-primary"
                  style={{ padding: "7px 16px", fontSize: "13px" }}
                >
                  Get Started
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    padding: "5px 10px",
                    borderRadius: "var(--radius-full)",
                    background: "var(--sage-light)",
                    color: "var(--primary)",
                    fontSize: "12px",
                    fontWeight: 600,
                    textTransform: "capitalize",
                  }}
                  className="hidden-mobile"
                >
                  {role}
                </span>
                <button
                  onClick={logout}
                  className="btn btn-secondary"
                  style={{
                    padding: "7px 12px",
                    fontSize: "13px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                  title="Sign out"
                >
                  <LogOut size={14} />
                  <span className="hidden-mobile">Logout</span>
                </button>
              </div>
            )}

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="show-mobile-only"
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                background: "var(--bg-card)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-primary)",
                cursor: "pointer",
              }}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            top: "68px",
            background: "var(--bg)",
            zIndex: 85,
            padding: "24px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            borderTop: "1px solid var(--border)",
            overflowY: "auto",
          }}
        >
          {/* City in Mobile */}
          <div
            onClick={() => {
              setCityModalOpen(true);
              setMobileMenuOpen(false);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              borderRadius: "var(--radius-md)",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <MapPin size={18} color="var(--primary)" />
              <div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                  Selected City
                </div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                  {currentCity.name}
                </div>
              </div>
            </div>
            <span style={{ fontSize: "12px", color: "var(--primary)", fontWeight: 600 }}>Change</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <Link
              href="/services"
              style={{
                padding: "14px 16px",
                borderRadius: "var(--radius-md)",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                fontWeight: 600,
                fontSize: "15px",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>Explore All Services</span>
              <span>→</span>
            </Link>

            {isLoggedIn && role === "user" && (
              <Link
                href="/bookings"
                style={{
                  padding: "14px 16px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  fontWeight: 600,
                  fontSize: "15px",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span>My Bookings</span>
                <span>→</span>
              </Link>
            )}

            {isLoggedIn && role === "provider" && (
              <Link
                href="/provider-dashboard"
                style={{
                  padding: "14px 16px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  fontWeight: 600,
                  fontSize: "15px",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span>Provider Dashboard</span>
                <span>→</span>
              </Link>
            )}

            {isLoggedIn && role === "admin" && (
              <Link
                href="/admin"
                style={{
                  padding: "14px 16px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  fontWeight: 600,
                  fontSize: "15px",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span>Admin Console</span>
                <span>→</span>
              </Link>
            )}

            <Link
              href="/support"
              style={{
                padding: "14px 16px",
                borderRadius: "var(--radius-md)",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                fontWeight: 600,
                fontSize: "15px",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>Customer Help & FAQ</span>
              <span>→</span>
            </Link>
          </div>

          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
            {!isLoggedIn ? (
              <>
                <Link
                  href="/signup?role=provider"
                  className="btn btn-sage"
                  style={{ width: "100%", padding: "12px", justifyContent: "center" }}
                >
                  <Briefcase size={16} />
                  Join as a Service Professional
                </Link>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <button
                    onClick={() => router.push("/login")}
                    className="btn btn-secondary"
                    style={{ width: "100%", padding: "12px" }}
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => router.push("/signup")}
                    className="btn btn-primary"
                    style={{ width: "100%", padding: "12px" }}
                  >
                    Sign Up
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={logout}
                className="btn btn-danger"
                style={{ width: "100%", padding: "12px" }}
              >
                <LogOut size={16} />
                Logout ({role})
              </button>
            )}
          </div>
        </div>
      )}

      {/* City Selection Modal */}
      {cityModalOpen && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setCityModalOpen(false)}
        >
          <div className="modal" style={{ maxWidth: "480px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "16px",
              }}
            >
              <div>
                <h3 style={{ fontSize: "1.25rem", color: "var(--text-primary)", marginBottom: "4px" }}>
                  Select Your City
                </h3>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                  Discover local home service providers in your metro
                </p>
              </div>
              <button
                onClick={() => setCityModalOpen(false)}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  border: "none",
                  background: "var(--bg-muted)",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
              <input
                className="input"
                value={locationQuery}
                onChange={(e) => void handleLocationSearch(e.target.value)}
                placeholder="Search area, city, or pincode"
                aria-label="Search for a location"
              />
              <button type="button" onClick={useCurrentLocation} className="btn btn-secondary" disabled={locationLoading}>
                <MapPin size={15} />
                {locationLoading ? "Finding location..." : "Use my current location"}
              </button>
              {locationError && (
                <div style={{ color: "var(--danger)", fontSize: "13px" }} role="alert">
                  {locationError}
                </div>
              )}
              {locationQuery.trim().length >= 2 && !locationLoading && locationResults.length === 0 && !locationError && (
                <div style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                  No locations found. You can enter an address manually below.
                </div>
              )}
              {locationResults.map((location, index) => (
                <button
                  type="button"
                  key={(location.displayLabel || location.address || location.city) + index}
                  onClick={() => selectLocation(location)}
                  className="btn btn-secondary"
                  style={{ justifyContent: "flex-start", textAlign: "left" }}
                >
                  {location.displayLabel || location.address || location.city}
                </button>
              ))}
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  className="input"
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  placeholder="Enter address manually"
                  aria-label="Manual address"
                />
                <button type="button" onClick={saveManualAddress} className="btn btn-primary">
                  Save
                </button>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                marginTop: "16px",
              }}
            >
              {POPULAR_INDIAN_CITIES.map((city) => {
                const isSelected = city.id === currentCity.id;
                return (
                  <button
                    key={city.id}
                    onClick={() => handleCitySelect(city)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 14px",
                      borderRadius: "var(--radius-md)",
                      border: `1.5px solid ${isSelected ? "var(--primary)" : "var(--border)"}`,
                      background: isSelected ? "var(--sage-light)" : "var(--bg-card)",
                      color: isSelected ? "var(--primary)" : "var(--text-primary)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "14px" }}>{city.name}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{city.state}</div>
                    </div>
                    {isSelected && <Check size={16} color="var(--primary)" strokeWidth={2.5} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Responsive helper styling for mobile hiding */}
      <style jsx>{`
        @media (max-width: 860px) {
          .hidden-mobile {
            display: none !important;
          }
          .show-mobile-only {
            display: flex !important;
          }
        }
        @media (min-width: 861px) {
          .show-mobile-only {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
