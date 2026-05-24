"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import api from "../../lib/api";
import { Service } from "../../types";

export default function Services() {
  const { role } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [filtered, setFiltered] = useState<Service[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", experience: "", selectedService: "" });
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const router = useRouter();

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => console.log("Location unavailable")
    );
  }, []);

  useEffect(() => {
    api.get<Service[]>("/services")
      .then((data) => { setServices(data); setFiltered(data); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(services.filter((s) => s.name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)));
  }, [search, services]);

  const handleAddProvider = async () => {
    if (!form.name || !form.phone || !form.selectedService || !location) {
      setError("Please fill all fields and enable location"); return;
    }
    setSubmitting(true); setError("");
    try {
      await api.post("/providers", {
        name: form.name, phone: form.phone,
        experience: Number(form.experience),
        location, serviceId: form.selectedService,
        userId: localStorage.getItem("userId"),
      });
      setShowForm(false);
      setForm({ name: "", phone: "", experience: "", selectedService: "" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const serviceIcons: Record<string, string> = {
    Electrician: "⚡", Plumber: "🔧", Tutor: "📚", "Laptop Repair": "💻",
    Painter: "🎨", Cleaner: "🧹", "AC Repair": "❄️", Locksmith: "🔑",
  };
  const serviceColors = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

  return (
    <div className="page" style={{ paddingTop: "64px" }}>
      {/* Header */}
      <div style={{
        background: "var(--gradient-hero)", padding: "60px 24px 48px", textAlign: "center",
      }}>
        <h1 style={{ fontFamily: "var(--font-outfit)", fontSize: "2.5rem", fontWeight: 700, color: "white", marginBottom: "12px" }}>
          All Services
        </h1>
        <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: "32px" }}>
          Find trusted professionals for every home need
        </p>

        {/* Search */}
        <div style={{ maxWidth: "500px", margin: "0 auto", position: "relative" }}>
          <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", fontSize: "18px" }}>🔍</span>
          <input
            placeholder="Search services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "14px 20px 14px 48px", borderRadius: "14px",
              border: "none", background: "rgba(255,255,255,0.12)",
              color: "white", fontSize: "15px", outline: "none",
              backdropFilter: "blur(10px)",
            }}
          />
        </div>
      </div>

      <div className="section" style={{ paddingTop: "40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
              {filtered.length} service{filtered.length !== 1 ? "s" : ""} available
            </p>
          </div>
          {role === "provider" && (
            <button onClick={() => setShowForm(true)} className="btn btn-success">
              + Register as Provider
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid-3">
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} className="skeleton" style={{ height: "200px" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
            <p>No services found matching "{search}"</p>
          </div>
        ) : (
          <div className="grid-3">
            {filtered.map((s, i) => (
              <div key={s._id} className="card" style={{ padding: "28px", overflow: "hidden", position: "relative" }}>
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: "4px",
                  background: `linear-gradient(90deg, ${serviceColors[i % serviceColors.length]}, transparent)`,
                }} />
                <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                  <div style={{
                    width: "52px", height: "52px", borderRadius: "14px", flexShrink: 0,
                    background: `${serviceColors[i % serviceColors.length]}20`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px",
                  }}>
                    {serviceIcons[s.name] || "🔧"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>{s.name}</h2>
                    {s.price && (
                      <div style={{ fontSize: "13px", fontWeight: 600, color: serviceColors[i % serviceColors.length], marginBottom: "8px" }}>
                        Starting from ₹{s.price}
                      </div>
                    )}
                    <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                      {s.description || "Professional service available near you"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/providers/${s._id}`)}
                  className="btn btn-primary"
                  style={{ width: "100%", marginTop: "20px" }}
                >
                  View Providers →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Provider Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal">
            <h2 style={{ fontFamily: "var(--font-outfit)", fontSize: "1.4rem", fontWeight: 700, marginBottom: "8px", color: "var(--text-primary)" }}>
              Register as Provider
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginBottom: "24px" }}>
              Fill in your details to start receiving bookings
            </p>

            {error && (
              <div style={{ background: "#fee2e2", borderRadius: "10px", padding: "12px", marginBottom: "16px", color: "#991b1b", fontSize: "13px" }}>
                ❌ {error}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input className="input" placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input className="input" placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <input className="input" type="number" placeholder="Years of experience" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} />
              <select className="input" value={form.selectedService} onChange={(e) => setForm({ ...form, selectedService: e.target.value })}>
                <option value="">Select a service</option>
                {services.map((s) => (<option key={s._id} value={s._id}>{s.name}</option>))}
              </select>
              <div style={{
                padding: "12px 16px", borderRadius: "12px",
                background: location ? "#d1fae5" : "#fef3c7",
                color: location ? "#065f46" : "#92400e", fontSize: "13px",
              }}>
                {location ? `✅ Location detected` : "📍 Detecting your location..."}
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button onClick={() => setShowForm(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={handleAddProvider} disabled={submitting} className="btn btn-primary" style={{ flex: 1 }}>
                {submitting ? "Submitting..." : "Register →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
