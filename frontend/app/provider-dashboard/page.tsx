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

export default function ProviderDashboard() {
  const { userId, mounted } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Profile management state
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [profileErr, setProfileErr] = useState("");

  const fetchBookings = () => {
    if (!userId) return;
    api.get<Booking[]>(`/providers/bookings/${userId}`)
      .then(setBookings)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBookings(); }, [userId]);

  const updateStatus = async (bookingId: string, status: string) => {
    setUpdatingId(bookingId);
    try {
      await api.put(`/bookings/${bookingId}`, { status });
      setBookings((prev) => prev.map((b) => b._id === bookingId ? { ...b, status: status as any } : b));
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    if (activeTab === "profile" && userId) {
      setProfileLoading(true);
      setProfileMsg("");
      setProfileErr("");
      api.get(`/providers/profile/${userId}`)
        .then((data) => setProfile(data))
        .catch((err) => setProfileErr(err.message || "Failed to load profile. Please make sure you are registered as a provider."))
        .finally(() => setProfileLoading(false));
    }
  }, [activeTab, userId]);

  const handleSaveProfile = async () => {
    if (!profile || !userId) return;
    setProfileSaving(true);
    setProfileMsg("");
    setProfileErr("");
    try {
      const updated = await api.put(`/providers/profile/${userId}`, {
        name: profile.name,
        phone: profile.phone,
        experience: Number(profile.experience),
        price: Number(profile.price),
        bio: profile.bio,
      });
      setProfile(updated);
      setProfileMsg("Profile updated successfully!");
    } catch (err: any) {
      setProfileErr(err.message || "Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  const tabs = ["all", "pending", "confirmed", "completed", "rejected", "profile"];
  const filtered = activeTab === "all" ? bookings : bookings.filter((b) => b.status === activeTab);

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    completed: bookings.filter((b) => b.status === "completed").length,
  };

  if (!mounted) return null;

  return (
    <div className="page" style={{ paddingTop: "64px" }}>
      {/* Header */}
      <div style={{ background: "var(--gradient-hero)", padding: "60px 24px 48px" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <h1 style={{ fontFamily: "var(--font-outfit)", fontSize: "2.2rem", fontWeight: 700, color: "white", marginBottom: "8px" }}>
            Provider Dashboard
          </h1>
          <p style={{ color: "rgba(255,255,255,0.65)" }}>Manage your bookings and track your performance</p>
        </div>
      </div>

      <div className="section" style={{ paddingTop: "32px" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "36px" }}>
          {[
            { label: "Total Bookings", value: stats.total, color: "#6366f1", icon: "📋" },
            { label: "Pending", value: stats.pending, color: "#f59e0b", icon: "⏳" },
            { label: "Confirmed", value: stats.confirmed, color: "#3b82f6", icon: "✅" },
            { label: "Completed", value: stats.completed, color: "#10b981", icon: "🎉" },
          ].map((stat) => (
            <div key={stat.label} className="card" style={{ padding: "20px", textAlign: "center" }}>
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>{stat.icon}</div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: stat.color, fontFamily: "var(--font-outfit)" }}>
                {stat.value}
              </div>
              <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "8px 18px", borderRadius: "9999px", border: "1.5px solid",
                borderColor: activeTab === tab ? "var(--primary)" : "var(--border)",
                background: activeTab === tab ? "var(--primary)" : "var(--bg-card)",
                color: activeTab === tab ? "white" : "var(--text-secondary)",
                fontSize: "13px", fontWeight: 600, cursor: "pointer",
                transition: "all 0.2s ease", textTransform: "capitalize",
              }}
            >
              {tab === "all" ? "All Bookings" : tab === "profile" ? "⚙️ Profile Settings" : tab}
              {tab !== "all" && tab !== "profile" && (
                <span style={{ marginLeft: "6px", opacity: 0.8 }}>
                  ({bookings.filter((b) => b.status === tab).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === "profile" ? (
          profileLoading ? (
            <div className="skeleton" style={{ height: "300px" }} />
          ) : profileErr ? (
            <div className="card" style={{ padding: "24px", textAlign: "center", color: "#ef4444" }}>
              ❌ {profileErr}
            </div>
          ) : profile ? (
            <div className="card" style={{ padding: "32px", maxWidth: "600px", margin: "0 auto" }}>
              <h3 style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>⚙️ Edit Profile</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginBottom: "24px" }}>
                Update your professional details and charges for customers to view.
              </p>

              {profileMsg && <div style={{ background: "#d1fae5", borderRadius: "10px", padding: "12px", color: "#065f46", fontSize: "13px", marginBottom: "16px" }}>✅ {profileMsg}</div>}

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>Full Name</label>
                  <input className="input" value={profile.name || ""} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>Phone Number</label>
                  <input className="input" value={profile.phone || ""} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>Service Charges (₹)</label>
                  <input className="input" type="number" value={profile.price || 0} onChange={(e) => setProfile({ ...profile, price: Number(e.target.value) })} />
                </div>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>Years of Experience</label>
                  <input className="input" type="number" value={profile.experience || 0} onChange={(e) => setProfile({ ...profile, experience: Number(e.target.value) })} />
                </div>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>Service Offered</label>
                  <input className="input" disabled value={profile.serviceId?.name || "Service"} style={{ opacity: 0.7 }} />
                </div>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>Professional Bio</label>
                  <textarea className="input" value={profile.bio || ""} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} style={{ minHeight: "100px", resize: "vertical" }} placeholder="Tell customers about your skills and services..." />
                </div>

                <button onClick={handleSaveProfile} disabled={profileSaving} className="btn btn-primary" style={{ width: "100%", padding: "14px", marginTop: "12px" }}>
                  {profileSaving ? "Saving changes..." : "Save Profile Details →"}
                </button>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)" }}>
              No profile found. Please register as a provider on the services page first.
            </div>
          )
        ) : loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {[1,2,3].map((i) => <div key={i} className="skeleton" style={{ height: "160px" }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>📭</div>
            <h3 style={{ color: "var(--text-primary)", marginBottom: "8px" }}>No bookings here</h3>
            <p style={{ fontSize: "14px" }}>Bookings will appear here once customers book your service.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {filtered.map((b) => {
              const sc = statusConfig[b.status as keyof typeof statusConfig];
              const service = typeof b.serviceId === "object" ? b.serviceId : null;
              const user = typeof b.userId === "object" ? b.userId : null;
              const isUpdating = updatingId === b._id;
              return (
                <div key={b._id} className="card" style={{ padding: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                        <h3 style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "16px" }}>
                          {service?.name || "Service"}
                        </h3>
                        <span style={{
                          padding: "4px 12px", borderRadius: "9999px", fontSize: "12px", fontWeight: 600,
                          background: sc.bg, color: sc.color,
                        }}>
                          {sc.icon} {sc.label}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                        <div>
                          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "2px" }}>CUSTOMER</p>
                          <p style={{ fontWeight: 600, color: "var(--text-primary)" }}>{user?.name || "—"}</p>
                          <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{user?.email || ""}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "2px" }}>DATE</p>
                          <p style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                            {new Date(b.date).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {b.status === "pending" && (
                        <>
                          <button
                            onClick={() => updateStatus(b._id, "confirmed")}
                            disabled={isUpdating}
                            className="btn btn-primary"
                            style={{ padding: "8px 16px", opacity: isUpdating ? 0.6 : 1 }}
                          >
                            ✅ Confirm
                          </button>
                          <button
                            onClick={() => updateStatus(b._id, "rejected")}
                            disabled={isUpdating}
                            className="btn btn-danger"
                            style={{ padding: "8px 16px", opacity: isUpdating ? 0.6 : 1 }}
                          >
                            ❌ Reject
                          </button>
                        </>
                      )}
                      {b.status === "confirmed" && (
                        <button
                          onClick={() => updateStatus(b._id, "completed")}
                          disabled={isUpdating}
                          className="btn btn-success"
                          style={{ padding: "8px 16px", opacity: isUpdating ? 0.6 : 1 }}
                        >
                          🎉 Mark Completed
                        </button>
                      )}
                    </div>
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