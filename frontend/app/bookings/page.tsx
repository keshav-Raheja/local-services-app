"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  User,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import api from "../../lib/api";
import { Booking } from "../../types";

const statusConfig = {
  pending: { label: "Pending Confirmation", color: "#B47318", bg: "var(--amber-light)", icon: Clock },
  confirmed: { label: "Confirmed", color: "#1E6B47", bg: "var(--sage-light)", icon: CheckCircle2 },
  completed: { label: "Completed", color: "#174D3A", bg: "var(--sage)", icon: CheckCircle2 },
  rejected: { label: "Declined", color: "#B3392E", bg: "var(--danger-bg)", icon: XCircle },
};

export default function Bookings() {
  const { userId, mounted } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!userId) return;
    api
      .get<Booking[]>(`/bookings/user/${userId}`)
      .then(setBookings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  const filtered = filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  if (!mounted) return null;

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
        <div style={{ maxWidth: "980px", margin: "0 auto" }}>
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
            <Calendar size={14} />
            <span>Service Management</span>
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
            My Service Bookings
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Track direct appointment schedules and contact verified technicians.
          </p>
        </div>
      </section>

      <section className="section" style={{ maxWidth: "980px", paddingTop: "32px" }}>
        {/* Filter tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "32px", flexWrap: "wrap" }}>
          {["all", "pending", "confirmed", "completed", "rejected"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                padding: "8px 16px",
                borderRadius: "var(--radius-full)",
                border: "1px solid",
                borderColor: filter === s ? "var(--primary)" : "var(--border)",
                background: filter === s ? "var(--primary)" : "var(--bg-card)",
                color: filter === s ? "var(--text-inverse)" : "var(--text-secondary)",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
                textTransform: "capitalize",
              }}
            >
              {s === "all" ? "All Bookings" : s}
              <span style={{ marginLeft: "6px", opacity: 0.85 }}>
                (
                {s === "all"
                  ? bookings.length
                  : bookings.filter((b) => b.status === s).length}
                )
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: "110px" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="card"
            style={{
              padding: "64px 24px",
              textAlign: "center",
              maxWidth: "520px",
              margin: "40px auto",
            }}
          >
            <Calendar size={40} color="var(--text-muted)" style={{ margin: "0 auto 16px" }} />
            <h3 style={{ fontSize: "1.2rem", color: "var(--text-primary)", marginBottom: "8px" }}>
              {filter === "all" ? "No bookings scheduled yet" : `No ${filter} bookings found`}
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "20px" }}>
              Book experienced local electricians, plumbers, or technical professionals in minutes.
            </p>
            <Link href="/services" className="btn btn-primary" style={{ padding: "10px 24px" }}>
              Explore Services →
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {filtered.map((b) => {
              const sc = statusConfig[b.status as keyof typeof statusConfig] || statusConfig.pending;
              const StatusIcon = sc.icon;
              const service = typeof b.serviceId === "object" ? b.serviceId : null;
              const provider = typeof b.providerId === "object" ? b.providerId : null;

              return (
                <div
                  key={b._id}
                  className="card"
                  style={{
                    padding: "24px",
                    display: "flex",
                    alignItems: "center",
                    gap: "20px",
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      flexShrink: 0,
                      background: sc.bg,
                      color: sc.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <StatusIcon size={22} strokeWidth={2.2} />
                  </div>

                  <div style={{ flex: 1, minWidth: "220px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                      <h3 style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text-primary)" }}>
                        {service?.name || "Service Appointment"}
                      </h3>
                      <span
                        style={{
                          padding: "3px 10px",
                          borderRadius: "var(--radius-full)",
                          fontSize: "12px",
                          fontWeight: 600,
                          background: sc.bg,
                          color: sc.color,
                        }}
                      >
                        {sc.label}
                      </span>
                    </div>

                    <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                      Provider: <strong>{provider?.name || "Assigned Professional"}</strong>
                      {provider?.phone && ` • Direct: ${provider.phone}`}
                    </div>

                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      Scheduled Date:{" "}
                      <strong>
                        {new Date(b.date).toLocaleDateString("en-IN", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </strong>
                    </div>
                  </div>

                  {provider?.price && (
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                        Visiting Fee
                      </div>
                      <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--primary)" }}>
                        ₹{provider.price}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
