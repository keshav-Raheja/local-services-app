"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useRouter } from "next/navigation";
import {
  Settings,
  PlusCircle,
  Layers,
  Users,
  Calendar,
  BarChart3,
  CheckCircle2,
  DollarSign,
} from "lucide-react";
import api from "../../lib/api";

export default function AdminDashboard() {
  const { role, mounted } = useAuth();
  const router = useRouter();
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
    api
      .get<any[]>("/services")
      .then((svcs) => {
        setServices(svcs || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [mounted, role]);

  const handleAddService = async () => {
    if (!newService.name) return;
    setAddingService(true);
    try {
      const created = await api.post<any>("/services", {
        ...newService,
        price: Number(newService.price) || 0,
      });
      setServices((prev) => [...prev, created]);
      setNewService({ name: "", description: "", price: "" });
    } catch (err) {
      console.error(err);
    } finally {
      setAddingService(false);
    }
  };

  if (!mounted || role !== "admin") return null;

  return (
    <div className="page" style={{ paddingTop: "68px" }}>
      {/* Header */}
      <section
        style={{
          background: "var(--hero-bg)",
          borderBottom: "1px solid var(--border)",
          padding: "48px 20px 40px",
        }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 12px",
              borderRadius: "var(--radius-full)",
              background: "var(--sage-light)",
              color: "var(--primary)",
              fontSize: "12px",
              fontWeight: 600,
              marginBottom: "12px",
            }}
          >
            <Settings size={14} />
            <span>Platform Administration</span>
          </div>

          <h1
            style={{
              fontSize: "clamp(2rem, 4vw, 2.5rem)",
              fontWeight: 800,
              color: "var(--primary)",
              marginBottom: "8px",
              letterSpacing: "-0.02em",
            }}
          >
            Administrator Console
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Maintain active Indian local service categories, standard visiting rates, and registry settings.
          </p>
        </div>
      </section>

      <section className="section" style={{ maxWidth: "1100px", paddingTop: "32px" }}>
        {/* Metric Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "36px",
          }}
        >
          {[
            { label: "Active Categories", value: services.length, icon: Layers, color: "var(--primary)" },
            { label: "System Operational", value: "Normal", icon: CheckCircle2, color: "#1E6B47" },
            { label: "Direct Commerce", value: "Enabled", icon: DollarSign, color: "var(--primary)" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="card" style={{ padding: "20px", textAlign: "center" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: "var(--sage-light)",
                    color: s.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 10px",
                  }}
                >
                  <Icon size={20} />
                </div>
                <div
                  style={{
                    fontSize: "1.75rem",
                    fontWeight: 800,
                    color: s.color,
                    fontFamily: "var(--font-heading)",
                  }}
                >
                  {s.value}
                </div>
                <div style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "4px" }}>
                  {s.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            display: "flex",
            gap: "6px",
            background: "var(--bg-muted)",
            borderRadius: "var(--radius-md)",
            padding: "4px",
            marginBottom: "32px",
            width: "fit-content",
          }}
        >
          {["services", "overview"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "8px 18px",
                borderRadius: "var(--radius-sm)",
                border: "none",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
                background: activeTab === tab ? "var(--bg-card)" : "transparent",
                color: activeTab === tab ? "var(--primary)" : "var(--text-secondary)",
                boxShadow: activeTab === tab ? "var(--shadow-xs)" : "none",
                transition: "all 0.15s ease",
                textTransform: "capitalize",
              }}
            >
              {tab === "overview" ? "System Analytics" : "Service Catalog"}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="card" style={{ padding: "48px 24px", textAlign: "center" }}>
            <BarChart3 size={44} color="var(--text-muted)" style={{ margin: "0 auto 16px" }} />
            <h3 style={{ color: "var(--text-primary)", marginBottom: "8px", fontWeight: 700 }}>
              Live System Telemetry
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", maxWidth: "480px", margin: "0 auto" }}>
              Category traffic, regional booking conversion rates, and provider registration metrics will be indexed here.
            </p>
          </div>
        )}

        {activeTab === "services" && (
          <div>
            {/* Add Service Section */}
            <div className="card" style={{ padding: "28px", marginBottom: "24px" }}>
              <h3 style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>
                Add New Service Category
              </h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px" }}>
                Create a new trade taxonomy for technicians to list under.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr)) auto",
                  gap: "12px",
                  alignItems: "end",
                }}
              >
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Category Title
                  </label>
                  <input
                    className="input"
                    placeholder="e.g. Masonry / Rajmistri"
                    value={newService.name}
                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Brief Scope / Description
                  </label>
                  <input
                    className="input"
                    placeholder="Wall construction and brickwork"
                    value={newService.description}
                    onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  />
                </div>

                <div style={{ maxWidth: "160px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Base Visiting Fee (₹)
                  </label>
                  <input
                    className="input"
                    placeholder="500"
                    type="number"
                    value={newService.price}
                    onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                  />
                </div>

                <button
                  onClick={handleAddService}
                  disabled={addingService || !newService.name}
                  className="btn btn-primary"
                  style={{ padding: "12px 20px" }}
                >
                  <PlusCircle size={15} />
                  <span>{addingService ? "Saving..." : "Add Category"}</span>
                </button>
              </div>
            </div>

            {/* Existing Services List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {services.map((s, i) => (
                <div
                  key={s._id}
                  className="card"
                  style={{
                    padding: "18px 24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "8px",
                        background: "var(--sage-light)",
                        color: "var(--primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "13px",
                      }}
                    >
                      {i + 1}
                    </div>
                    <div>
                      <h4 style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "15px" }}>
                        {s.name}
                      </h4>
                      <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                        {s.description || "General trade category"}
                      </p>
                    </div>
                  </div>

                  {s.price && (
                    <div style={{ fontWeight: 800, color: "var(--primary)", fontSize: "15px" }}>
                      From ₹{s.price}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
