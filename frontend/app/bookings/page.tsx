"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import api from "../../lib/api";
import { Booking } from "../../types";

const statusConfig = {
  pending: { label: "Pending", color: "#f59e0b", bg: "#fef3c7", icon: "⏳" },
  confirmed: { label: "Confirmed", color: "#3b82f6", bg: "#dbeafe", icon: "✅" },
  completed: { label: "Completed", color: "#10b981", bg: "#d1fae5", icon: "🎉" },
  rejected: { label: "Rejected", color: "#ef4444", bg: "#fee2e2", icon: "❌" },
};

export default function Bookings() {
  const { userId, mounted } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!userId) return;
    api.get<Booking[]>(`/bookings/user/${userId}`)
      .then(setBookings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  const filtered = filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  if (!mounted) return null;

  return (
    <div className="page" style={{ paddingTop: "64px" }}>
      {/* Header */}
      <div style={{ background: "var(--gradient-hero)", padding: "60px 24px 48px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h1 style={{ fontFamily: "var(--font-outfit)", fontSize: "2.2rem", fontWeight: 700, color: "white", marginBottom: "8px" }}>
            My Bookings
          </h1>
          <p style={{ color: "rgba(255,255,255,0.65)" }}>Track all your service bookings in one place</p>
        </div>
      </div>

      <div className="section" style={{ paddingTop: "32px" }}>
        {/* Filter tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "32px", flexWrap: "wrap" }}>
          {["all", "pending", "confirmed", "completed", "rejected"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                padding: "8px 18px", borderRadius: "9999px", border: "1.5px solid",
                borderColor: filter === s ? "var(--primary)" : "var(--border)",
                background: filter === s ? "var(--primary)" : "var(--bg-card)",
                color: filter === s ? "white" : "var(--text-secondary)",
                fontSize: "13px", fontWeight: 600, cursor: "pointer",
                transition: "all 0.2s ease", textTransform: "capitalize",
              }}
            >
              {s === "all" ? "All Bookings" : s}
              {s !== "all" && (
                <span style={{ marginLeft: "6px", opacity: 0.8 }}>
                  ({bookings.filter((b) => b.status === s).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {[1,2,3].map((i) => <div key={i} className="skeleton" style={{ height: "130px" }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>📋</div>
            <h3 style={{ color: "var(--text-primary)", marginBottom: "8px" }}>No bookings found</h3>
            <p style={{ fontSize: "14px" }}>
              {filter === "all" ? "You haven't made any bookings yet." : `No ${filter} bookings.`}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {filtered.map((b) => {
              const sc = statusConfig[b.status as keyof typeof statusConfig];
              const service = typeof b.serviceId === "object" ? b.serviceId : null;
              const provider = typeof b.providerId === "object" ? b.providerId : null;
              return (
                <div key={b._id} className="card" style={{ padding: "24px", display: "flex", alignItems: "center", gap: "20px" }}>
                  <div style={{
                    width: "52px", height: "52px", borderRadius: "14px", flexShrink: 0,
                    background: sc.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px",
                  }}>
                    {sc.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
                      <h3 style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                        {service?.name || "Service"}
                      </h3>
                      <span style={{
                        padding: "3px 10px", borderRadius: "9999px", fontSize: "12px", fontWeight: 600,
                        background: sc.bg, color: sc.color,
                      }}>
                        {sc.label}
                      </span>
                    </div>
                    <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                      Provider: {provider?.name || "—"}
                    </p>
                    <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "4px" }}>
                      📅 {new Date(b.date).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}