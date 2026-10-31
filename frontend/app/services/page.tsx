"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo, Suspense } from "react";
import {
  Search,
  PlusCircle,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowUpDown,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import api from "../../lib/api";
import { Service } from "../../types";
import { getSelectedCity, CityLocation } from "../../lib/locations";
import ServiceCard from "../../components/ServiceCard";

function ServicesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const { role } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState(initialQuery);
  const [sortBy, setSortBy] = useState<"name" | "price-asc" | "price-desc">("name");
  const [currentCity, setCurrentCity] = useState<CityLocation | null>(null);
  const [loading, setLoading] = useState(true);

  // Add Provider modal
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    experience: "",
    selectedService: "",
    price: "",
    address: "", locality: "", city: "", state: "", pincode: "",
  });
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (role === "provider" && searchParams.get("setup") === "provider") setShowForm(true);
  }, [role, searchParams]);

  useEffect(() => {
    setCurrentCity(getSelectedCity());
    const onCityChange = (e: Event) => {
      const detail = (e as CustomEvent<CityLocation>).detail;
      if (detail) setCurrentCity(detail);
    };
    window.addEventListener("city_changed", onCityChange);
    return () => window.removeEventListener("city_changed", onCityChange);
  }, []);



  useEffect(() => {
    api
      .get<Service[]>("/services")
      .then((data) => {
        setServices(data || []);
      })
      .catch((err) => {
        console.error("Error loading services:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredServices = useMemo(() => {
    const q = search.toLowerCase().trim();
    let result = services.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q))
    );

    result = [...result].sort((a, b) => {
      if (sortBy === "price-asc") {
        return (a.price || 0) - (b.price || 0);
      } else if (sortBy === "price-desc") {
        return (b.price || 0) - (a.price || 0);
      }
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [search, services, sortBy]);

  const detectLocation = () => {
    if (!navigator.geolocation) { setError("This browser does not support location access."); return; }
    navigator.geolocation.getCurrentPosition((position) => setLocation({ lat: position.coords.latitude, lng: position.coords.longitude }), () => setError("Location permission was denied. Enter a service address manually or use the provider profile editor."), { timeout: 10000 });
  };

  const handleAddProvider = async () => {
    if (!form.name || !form.phone || !form.selectedService || !form.price) {
      setError("Please fill all required fields, including your visiting charges.");
      return;
    }
    if (!location) { setError("Use your current location before registering, or complete your address in your provider profile."); return; }
    const loc = location;
    setSubmitting(true);
    setError("");
    try {
      await api.post("/providers", {
        name: form.name,
        phone: form.phone,
        experience: Number(form.experience) || 0,
        price: Number(form.price),
        location: loc,
        serviceId: form.selectedService,
      });
      setShowForm(false);
      setForm({ name: "", phone: "", experience: "", selectedService: "", price: "", address: "", locality: "", city: "", state: "", pincode: "" });
      alert("Provider registered successfully!");
      router.push(`/providers/${form.selectedService}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to register provider profile.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page" style={{ paddingTop: "68px" }}>
      {/* Header Banner */}
      <section
        style={{
          background: "var(--hero-bg)",
          borderBottom: "1px solid var(--border)",
          padding: "54px 20px 48px",
        }}
      >
        <div style={{ maxWidth: "1080px", margin: "0 auto", textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 12px",
              borderRadius: "var(--radius-full)",
              background: "var(--sage-light)",
              border: "1px solid var(--sage)",
              color: "var(--primary)",
              fontSize: "12px",
              fontWeight: 600,
              marginBottom: "14px",
            }}
          >
            <MapPin size={14} />
            <span>Serving {currentCity?.name || "India"}</span>
          </div>

          <h1
            style={{
              fontSize: "clamp(2rem, 4vw, 2.75rem)",
              fontWeight: 800,
              color: "var(--primary)",
              marginBottom: "12px",
              letterSpacing: "-0.02em",
            }}
          >
            Local Service Categories
          </h1>
          <p
            style={{
              color: "var(--text-secondary)",
              maxWidth: "600px",
              margin: "0 auto 32px",
              fontSize: "15px",
            }}
          >
            Find reliable, verified technicians and domestic tradespeople with transparent upfront charges.
          </p>

          {/* Search bar & Sort Controls */}
          <div
            style={{
              maxWidth: "640px",
              margin: "0 auto",
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              alignItems: "center",
            }}
          >
            <div
              style={{
                flex: 1,
                minWidth: "260px",
                position: "relative",
              }}
            >
              <Search
                size={18}
                color="var(--text-muted)"
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />
              <input
                type="text"
                placeholder="Search electrician, plumber, AC service..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input"
                style={{
                  paddingLeft: "42px",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "var(--shadow-sm)",
                  background: "var(--bg-card)",
                }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ArrowUpDown size={16} color="var(--text-muted)" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "name" | "price-asc" | "price-desc")}
                className="input"
                style={{
                  width: "auto",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--bg-card)",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                <option value="name">Sort: A to Z</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid Section */}
      <section className="section">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "28px",
          }}
        >
          <div style={{ fontSize: "14px", color: "var(--text-secondary)", fontWeight: 500 }}>
            Showing <strong>{filteredServices.length}</strong> {filteredServices.length === 1 ? "category" : "categories"}
            {search && ` for "${search}"`}
          </div>

          {role === "provider" && (
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-sage"
              style={{ padding: "8px 16px", fontSize: "13px" }}
            >
              <PlusCircle size={15} />
              Register as Provider for a Service
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="skeleton" style={{ height: "200px" }} />
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <div
            className="card"
            style={{
              padding: "64px 24px",
              textAlign: "center",
              maxWidth: "520px",
              margin: "40px auto",
            }}
          >
            <Search size={40} color="var(--text-muted)" style={{ margin: "0 auto 16px" }} />
            <h3 style={{ fontSize: "1.2rem", color: "var(--text-primary)", marginBottom: "8px" }}>
              No categories found matching &quot;{search}&quot;
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "20px" }}>
              Try searching with general keywords like &quot;cleaning&quot;, &quot;wiring&quot;, or &quot;repairs&quot;.
            </p>
            <button
              onClick={() => setSearch("")}
              className="btn btn-secondary"
              style={{ padding: "8px 20px" }}
            >
              Reset Search
            </button>
          </div>
        ) : (
          <div className="grid-4">
            {filteredServices.map((service) => (
              <ServiceCard key={service._id} service={service} />
            ))}
          </div>
        )}
      </section>

      {/* Provider Registration Modal */}
      {showForm && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
        >
          <div className="modal">
            <h3 style={{ fontSize: "1.3rem", color: "var(--text-primary)", marginBottom: "4px" }}>
              List Your Services
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginBottom: "20px" }}>
              Provide your details to appear on the local technician registry.
            </p>

            {error && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--danger-bg)",
                  color: "var(--danger)",
                  fontSize: "13px",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Full Legal / Business Name
                </label>
                <input
                  className="input"
                  placeholder="e.g. Ramesh Kumar Services"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Direct Phone Number (for customer bookings)
                </label>
                <input
                  className="input"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Experience (Years)
                  </label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    placeholder="e.g. 5"
                    value={form.experience}
                    onChange={(e) => setForm({ ...form, experience: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Visiting Fee (₹)
                  </label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    placeholder="e.g. 400"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Service Category
                </label>
                <select
                  className="input"
                  value={form.selectedService}
                  onChange={(e) => setForm({ ...form, selectedService: e.target.value })}
                >
                  <option value="">Select your trade category...</option>
                  {services.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "var(--radius-md)",
                  background: location ? "var(--sage-light)" : "var(--amber-light)",
                  color: location ? "var(--primary)" : "#7D4C0A",
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {location ? (
                  <>
                    <CheckCircle2 size={16} color="var(--primary)" />
                    <span>Coordinates detected for neighborhood matching</span>
                  </>
                ) : (
                  <>
                    <MapPin size={16} />
                    <span>No coordinates selected yet.</span><button type="button" onClick={detectLocation} className="btn btn-secondary" style={{ marginLeft: "auto", padding: "5px 9px", fontSize: "11px" }}>Use current location</button>
                  </>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
              <button
                onClick={() => setShowForm(false)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddProvider}
                disabled={submitting}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                {submitting ? "Registering..." : "Submit Listing"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense fallback={<div className="page" style={{ paddingTop: "80px", textAlign: "center" }}>Loading services...</div>}>
      <ServicesContent />
    </Suspense>
  );
}
