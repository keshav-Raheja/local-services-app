"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useRouter } from "next/navigation";
import api from "../../lib/api";

export default function AdminDashboard() {
  const { role, mounted } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ users: 0, providers: 0, bookings: 0, services: 0 });
  const [bookings, setBookings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [newService, setNewService] = useState({ name: "", description: "", price: "" });
  const [addingService, setAddingService] = useState(false);

  useEffect(() => {
    if (mounted && role !== "admin") router.push("/");
  }, [mounted, role]);

  useEffect(() => {
    if (!mounted || role !== "admin") return;
    Promise.all([
      api.get<any[]>("/services"),
    ]).then(([svcs]) => {
      setServices(svcs);
      setStats((s) => ({ ...s, services: svcs.length }));
    }).finally(() => setLoading(false));
  }, [mounted, role]);

  const handleAddService = async () => {
    if (!newService.name) return;
    setAddingService(true);
    try {
      const created = await api.post<any>("/services", { ...newService, price: Number(newService.price) });
      setServices((prev) => [...prev, created]);
      setNewService({ name: "", description: "", price: "" });
    } catch (err) {
      console.error(err);
    } finally {
      setAddingService(false);
    }
  };

  if (!mounted || role !== "admin") return null;

  const tabStyle = (tab: string): React.CSSProperties => ({
    padding: "10px 20px", borderRadius: "10px", border: "none", cursor: "pointer",
    background: activeTab === tab ? "var(--primary)" : "transparent",
    color: activeTab === tab ? "white" : "var(--text-secondary)",
    fontWeight: 600, fontSize: "14px", transition: "all 0.2s ease",
  });

  return (
    <div className="page" style={{ paddingTop: "64px" }}>
      <div style={{ background: "var(--gradient-hero)", padding: "60px 24px 48px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <span style={{ fontSize: "28px" }}>⚙️</span>
            <h1 style={{ fontFamily: "var(--font-outfit)", fontSize: "2.2rem", fontWeight: 700, color: "white" }}>
              Admin Dashboard
            </h1>
          </div>
          <p style={{ color: "rgba(255,255,255,0.65)" }}>Manage your platform — services, users, and bookings</p>
        </div>
      </div>

      <div className="section" style={{ paddingTop: "32px" }}>
        {/* Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "40px" }}>
          {[
            { label: "Total Services", value: services.length, icon: "🔧", color: "#6366f1" },
            { label: "Registered Users", value: "—", icon: "👥", color: "#06b6d4" },
            { label: "Total Bookings", value: "—", icon: "📋", color: "#10b981" },
            { label: "Active Providers", value: "—", icon: "⭐", color: "#f59e0b" },
          ].map((s) => (
            <div key={s.label} className="card" style={{ padding: "24px", textAlign: "center" }}>
              <div style={{ fontSize: "32px", marginBottom: "10px" }}>{s.icon}</div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: s.color, fontFamily: "var(--font-outfit)" }}>{s.value}</div>
              <div style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "4px" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", background: "var(--bg-muted)", borderRadius: "12px", padding: "4px", marginBottom: "32px", width: "fit-content" }}>
          {["overview", "services"].map((tab) => (
            <button key={tab} style={tabStyle(tab)} onClick={() => setActiveTab(tab)}>
              {tab === "overview" ? "📊 Overview" : "🔧 Services"}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="card" style={{ padding: "32px", textAlign: "center" }}>
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>📊</div>
            <h3 style={{ color: "var(--text-primary)", marginBottom: "8px", fontWeight: 700 }}>Analytics Coming Soon</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
              Revenue charts, user growth graphs, and booking trends will appear here.
            </p>
          </div>
        )}

        {activeTab === "services" && (
          <div>
            {/* Add Service */}
            <div className="card" style={{ padding: "28px", marginBottom: "24px" }}>
              <h3 style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "20px" }}>➕ Add New Service</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto", gap: "12px", alignItems: "end", flexWrap: "wrap" }}>
                <input
                  className="input"
                  placeholder="Service name (e.g. Carpenter)"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Description"
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Price (₹)"
                  type="number"
                  value={newService.price}
                  style={{ width: "120px" }}
                  onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                />
                <button
                  onClick={handleAddService}
                  disabled={addingService || !newService.name}
                  className="btn btn-primary"
                  style={{ whiteSpace: "nowrap", opacity: addingService ? 0.7 : 1 }}
                >
                  {addingService ? "Adding..." : "Add Service"}
                </button>
              </div>
            </div>

            {/* Services List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {services.map((s, i) => (
                <div key={s._id} className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{
                    width: "44px", height: "44px", borderRadius: "12px",
                    background: "var(--gradient-primary)", display: "flex",
                    alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "16px",
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "2px" }}>{s.name}</h4>
                    <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{s.description || "—"}</p>
                  </div>
                  {s.price && (
                    <div style={{ fontWeight: 700, color: "var(--primary)" }}>₹{s.price}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
