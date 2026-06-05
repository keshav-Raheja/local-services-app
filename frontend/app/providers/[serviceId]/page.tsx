"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../hooks/useAuth";
import api from "../../../lib/api";
import { Provider, Review } from "../../../types";

export default function Providers() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.serviceId as string;
  const { role, isLoggedIn } = useAuth();

  const [providers, setProviders] = useState<Provider[]>([]);
  const [reviews, setReviews] = useState<Record<string, Review[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"book" | "review">("book");

  useEffect(() => {
    if (!serviceId) return;
    api.get<Provider[]>(`/providers/${serviceId}`).then(async (data) => {
      setProviders(data);
      const reviewMap: Record<string, Review[]> = {};
      await Promise.all(data.map(async (p) => {
        const r = await api.get<Review[]>(`/reviews/${p._id}`);
        reviewMap[p._id] = r;
      }));
      setReviews(reviewMap);
    }).finally(() => setLoading(false));
  }, [serviceId]);

  const bookProvider = async () => {
    if (!bookingDate) { setError("Please select a date"); return; }
    setError("");
    try {
      await api.post("/bookings", {
        userId: localStorage.getItem("userId"),
        serviceId,
        providerId: selectedProvider?._id,
        date: bookingDate,
      });
      setBookingSuccess("Booking confirmed! Check 'My Bookings' for status.");
      setTimeout(() => { setSelectedProvider(null); setBookingSuccess(null); router.push("/bookings"); }, 2000);
    } catch (err: any) { setError(err.message); }
  };

  const submitReview = async () => {
    if (rating < 1) { setError("Please select a star rating"); return; }
    setError("");
    try {
      await api.post("/reviews", { providerId: selectedProvider?._id, rating, feedback });
      setReviewSuccess(true);
      setTimeout(() => { setSelectedProvider(null); setReviewSuccess(false); }, 2000);
    } catch (err: any) { setError(err.message); }
  };

  const StarRating = ({ count, interactive = false }: { count: number; interactive?: boolean }) => (
    <div style={{ display: "flex", gap: "2px" }}>
      {[1,2,3,4,5].map((s) => (
        <span
          key={s}
          onClick={() => interactive && setRating(s)}
          style={{
            fontSize: interactive ? "24px" : "14px",
            color: s <= count ? "#fbbf24" : "var(--border)",
            cursor: interactive ? "pointer" : "default",
            transition: "color 0.15s ease",
          }}
        >
          ★
        </span>
      ))}
    </div>
  );

  return (
    <div className="page" style={{ paddingTop: "64px" }}>
      <div style={{ background: "var(--gradient-hero)", padding: "60px 24px 48px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <button onClick={() => router.push("/services")} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", marginBottom: "20px" }}>
            ← Back to Services
          </button>
          <h1 style={{ fontFamily: "var(--font-outfit)", fontSize: "2.2rem", fontWeight: 700, color: "white", marginBottom: "8px" }}>
            Available Providers
          </h1>
          <p style={{ color: "rgba(255,255,255,0.65)" }}>
            {providers.length} professional{providers.length !== 1 ? "s" : ""} available for this service
          </p>
        </div>
      </div>

      <div className="section" style={{ paddingTop: "32px" }}>
        {loading ? (
          <div className="grid-3">
            {[1,2,3].map((i) => <div key={i} className="skeleton" style={{ height: "260px" }} />)}
          </div>
        ) : providers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>😔</div>
            <h3 style={{ color: "var(--text-primary)", marginBottom: "8px" }}>No providers yet</h3>
            <p style={{ fontSize: "14px" }}>Be the first to register as a provider for this service!</p>
          </div>
        ) : (
          <div className="grid-3">
            {providers.map((p) => {
              const providerReviews = reviews[p._id] || [];
              const avgRating = providerReviews.length > 0
                ? providerReviews.reduce((sum, r) => sum + r.rating, 0) / providerReviews.length
                : p.rating || 0;
              return (
                <div key={p._id} className="card" style={{ padding: "24px", position: "relative" }}>
                  {p.isVerified && (
                    <div style={{ position: "absolute", top: "16px", right: "16px", background: "#d1fae5", color: "#065f46", padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700 }}>
                      ✓ Verified
                    </div>
                  )}
                  {/* Avatar */}
                  <div style={{
                    width: "60px", height: "60px", borderRadius: "50%",
                    background: "var(--gradient-primary)", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    fontSize: "24px", marginBottom: "16px", color: "white", fontWeight: 700,
                  }}>
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <h2 style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>{p.name}</h2>

                  {/* Rating */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                    <StarRating count={Math.round(avgRating)} />
                    <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                      {avgRating > 0 ? avgRating.toFixed(1) : "New"} ({providerReviews.length} reviews)
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
                    <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                      🎓 <span style={{ fontWeight: 500 }}>{p.experience || 0} years</span> experience
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                      📞 {p.phone}
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                      💵 Charges: <span style={{ fontWeight: 700, color: "var(--primary)" }}>₹{p.price || 0}</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => { setSelectedProvider(p); setMode("review"); setError(""); }}
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: "8px" }}
                    >
                      ⭐ Reviews
                    </button>
                    {role === "user" && (
                      <button
                        onClick={() => { setSelectedProvider(p); setMode("book"); setError(""); setBookingDate(""); }}
                        className="btn btn-primary"
                        style={{ flex: 1, padding: "8px" }}
                      >
                        Book Now
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedProvider && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setSelectedProvider(null)}>
          <div className="modal" style={{ maxWidth: "520px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h2 style={{ fontWeight: 700, color: "var(--text-primary)" }}>{selectedProvider.name}</h2>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                  {mode === "book" ? "Select a date to book" : "View & submit reviews"}
                </p>
              </div>
              <button onClick={() => setSelectedProvider(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: "var(--text-muted)" }}>✕</button>
            </div>

            {/* Tab */}
            <div style={{ display: "flex", gap: "4px", background: "var(--bg-muted)", borderRadius: "10px", padding: "4px", marginBottom: "20px" }}>
              {(["book", "review"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setMode(tab); setError(""); }}
                  style={{
                    flex: 1, padding: "8px", borderRadius: "8px", border: "none", cursor: "pointer",
                    background: mode === tab ? "var(--primary)" : "transparent",
                    color: mode === tab ? "white" : "var(--text-secondary)",
                    fontSize: "13px", fontWeight: 600, transition: "all 0.2s ease",
                  }}
                >
                  {tab === "book" ? "📅 Book" : "⭐ Reviews"}
                </button>
              ))}
            </div>

            {error && <div style={{ background: "#fee2e2", borderRadius: "10px", padding: "10px 14px", color: "#991b1b", fontSize: "13px", marginBottom: "16px" }}>❌ {error}</div>}
            {bookingSuccess && <div style={{ background: "#d1fae5", borderRadius: "10px", padding: "10px 14px", color: "#065f46", fontSize: "13px", marginBottom: "16px" }}>✅ {bookingSuccess}</div>}

            {mode === "book" && (
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "8px" }}>Select Date</label>
                <input
                  type="date"
                  className="input"
                  value={bookingDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setBookingDate(e.target.value)}
                  style={{ marginBottom: "20px" }}
                />
                {isLoggedIn ? (
                  <button onClick={bookProvider} className="btn btn-primary" style={{ width: "100%", padding: "12px" }}>
                    Confirm Booking →
                  </button>
                ) : (
                  <button onClick={() => router.push("/login")} className="btn btn-primary" style={{ width: "100%", padding: "12px" }}>
                    Login to Book →
                  </button>
                )}
              </div>
            )}

            {mode === "review" && (
              <div>
                {/* Reviews List */}
                <div style={{ maxHeight: "220px", overflowY: "auto", marginBottom: "16px" }}>
                  {(reviews[selectedProvider._id] || []).length === 0 ? (
                    <div style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)", fontSize: "14px" }}>No reviews yet — be the first!</div>
                  ) : (
                    reviews[selectedProvider._id].map((r) => (
                      <div key={r._id} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                          <StarRating count={r.rating} />
                          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                            {typeof r.userId === "object" ? r.userId.name : "User"}
                          </span>
                        </div>
                        <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{r.feedback}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Review */}
                {role === "user" && !reviewSuccess && (
                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
                    <p style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-primary)", marginBottom: "10px" }}>Leave a review</p>
                    <StarRating count={rating} interactive />
                    <textarea
                      className="input"
                      placeholder="Share your experience..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      style={{ marginTop: "12px", minHeight: "80px", resize: "vertical" }}
                    />
                    <button onClick={submitReview} className="btn btn-primary" style={{ width: "100%", marginTop: "12px" }}>
                      Submit Review →
                    </button>
                  </div>
                )}
                {reviewSuccess && (
                  <div style={{ background: "#d1fae5", borderRadius: "10px", padding: "12px", textAlign: "center", color: "#065f46", fontWeight: 600 }}>
                    ✅ Review submitted successfully!
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}