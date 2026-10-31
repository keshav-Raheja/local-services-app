"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  MapPin,
  ShieldCheck,
  Award,
  Clock,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  PhoneCall,
  Star,
  Users,
  Sparkles,
  DollarSign,
  ChevronRight,
  Calendar,
} from "lucide-react";
import api from "../lib/api";
import { Service, Provider, Review, ServiceAddress } from "../types";
import { getSelectedCity, CityLocation, reverseGeocodeCoords } from "../lib/locations";
import ServiceCard from "../components/ServiceCard";
import ProviderCard from "../components/ProviderCard";
import { useAuth } from "../hooks/useAuth";

const HOW_IT_WORKS_STEPS = [
  {
    number: "01",
    title: "Choose Your Service & Locality",
    desc: "Browse certified home and technical services available in your Indian metro, from urgent electrical fixes to routine deep cleaning.",
  },
  {
    number: "02",
    title: "Compare Honest Rates & Profiles",
    desc: "Inspect real experience, upfront visiting fees in Rupees (₹), and genuine feedback submitted by actual customers.",
  },
  {
    number: "03",
    title: "Book Directly & Pay Locally",
    desc: "Select a convenient date. Your local provider contacts you directly with zero hidden markups or middlemen commissions.",
  },
];

const TRUST_PILLARS = [
  {
    title: "ID & Contact Verification",
    desc: "Every listed partner must verify their working mobile phone and valid government identification prior to taking customer bookings.",
  },
  {
    title: "Authentic Customer Reviews",
    desc: "Ratings and feedback on SevaHub are strictly tied to completed jobs. We never permit bought reviews or fabricated 5-star ratings.",
  },
  {
    title: "Direct & Upfront Pricing",
    desc: "Providers disclose their minimum visiting fee in ₹ advance. You deal directly with the service technician without hidden platform fees.",
  },
  {
    title: "Neighborhood Availability",
    desc: "Connect with tradespeople operating close to your residential colony or apartment complex for faster response times.",
  },
];

export default function Home() {
  const router = useRouter();
  const { role, isLoggedIn } = useAuth();

  const [currentCity, setCurrentCity] = useState<CityLocation | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [providers, setProviders] = useState<(Provider & { serviceName?: string })[]>([]);
  const [reviewsMap, setReviewsMap] = useState<Record<string, Review[]>>({});
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingProviders, setLoadingProviders] = useState(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Selected provider for direct booking modal
  const [bookingProvider, setBookingProvider] = useState<Provider | null>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingAddress, setBookingAddress] = useState<ServiceAddress>({ address: "", recipientName: "" });
  const [bookingLocationLoading, setBookingLocationLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState("");

  useEffect(() => {
    setCurrentCity(getSelectedCity());
    const onCityChange = (e: any) => {
      if (e.detail) setCurrentCity(e.detail);
    };
    window.addEventListener("city_changed", onCityChange);
    return () => window.removeEventListener("city_changed", onCityChange);
  }, []);

  useEffect(() => {
    let active = true;
    setLoadingServices(true);
    api.get<Service[]>("/services").then((serviceList) => {
      if (active) setServices(serviceList || []);
    }).catch((err) => {
      if (active) console.error("Error fetching services:", err);
    }).finally(() => {
      if (active) setLoadingServices(false);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (loadingServices) return;
    let active = true;
    setLoadingProviders(true);
    setProviders([]);
    setReviewsMap({});
    const locationParams = new URLSearchParams();
    if (currentCity?.city) locationParams.set("city", currentCity.city);
    if (currentCity?.locality) locationParams.set("locality", currentCity.locality);
    if (currentCity?.pincode) locationParams.set("pincode", currentCity.pincode);
    if (typeof currentCity?.lat === "number") locationParams.set("lat", String(currentCity.lat));
    if (typeof currentCity?.lng === "number") locationParams.set("lng", String(currentCity.lng));
    const query = locationParams.toString();
    const fetchProviders = async () => {
      const collectedProviders: (Provider & { serviceName?: string })[] = [];
      const collectedReviews: Record<string, Review[]> = {};
      for (const service of services.slice(0, 6)) {
        if (!active) return;
        try {
          const providersForService = await api.get<Provider[]>(`/providers/${service._id}${query ? `?${query}` : ""}`);
          for (const provider of providersForService || []) {
            collectedProviders.push({ ...provider, serviceName: service.name });
            try { collectedReviews[provider._id] = await api.get<Review[]>(`/reviews/${provider._id}`); } catch { collectedReviews[provider._id] = []; }
          }
        } catch { /* Keep honest empty results for unavailable services. */ }
      }
      if (active) {
        setProviders(collectedProviders);
        setReviewsMap(collectedReviews);
        setLoadingProviders(false);
      }
    };
    void fetchProviders();
    return () => { active = false; };
  }, [currentCity, loadingServices, services]);
  // Search suggestions based on real active services
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return services.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q))
    );
  }, [searchQuery, services]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      router.push("/services");
      return;
    }
    // If exact match found, go to its provider listing
    const exact = services.find(
      (s) => s.name.toLowerCase() === searchQuery.trim().toLowerCase()
    );
    if (exact) {
      router.push(`/providers/${exact._id}`);
    } else {
      router.push(`/services?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleQuickTagClick = (serviceName: string) => {
    const matched = services.find((s) =>
      s.name.toLowerCase().includes(serviceName.toLowerCase())
    );
    if (matched) {
      router.push(`/providers/${matched._id}`);
    } else {
      router.push(`/services?q=${encodeURIComponent(serviceName)}`);
    }
  };

  const useBookingLocation = () => {
    if (!navigator.geolocation) { setBookingError("Current location is not supported by this browser."); return; }
    setBookingLocationLoading(true); setBookingError("");
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try { const location = await reverseGeocodeCoords(coords.latitude, coords.longitude); setBookingAddress((current) => ({ ...current, address: location.address || current.address, locality: location.locality, city: location.city, state: location.state, pincode: location.pincode, lat: location.lat, lng: location.lng })); }
      catch (error) { setBookingError(error instanceof Error ? error.message : "Unable to determine the service address."); }
      finally { setBookingLocationLoading(false); }
    }, () => { setBookingLocationLoading(false); setBookingError("Location permission was denied. Enter the service address manually."); }, { timeout: 10000 });
  };

  const handleConfirmBooking = async () => {
    if (!bookingDate) {
      setBookingError("Please pick a service date");
      return;
    }
    if (!bookingAddress.address.trim()) { setBookingError("Enter the address where the service is needed."); return; }
    setBookingLoading(true);
    setBookingError("");
    try {
      await api.post("/bookings", {
        userId: localStorage.getItem("userId"),
        serviceId:
          typeof bookingProvider?.serviceId === "object"
            ? (bookingProvider.serviceId as any)._id
            : bookingProvider?.serviceId,
        providerId: bookingProvider?._id,
        date: bookingDate,
        serviceAddress: bookingAddress,
      });
      setBookingSuccess("Booking request sent! You can track this in 'My Bookings'.");
      setTimeout(() => {
        setBookingProvider(null);
        setBookingSuccess(null);
        router.push("/bookings");
      }, 1800);
    } catch (err: any) {
      setBookingError(err.message || "Failed to complete booking");
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="page" style={{ paddingTop: "68px" }}>
      {/* 1. HERO SECTION */}
      <section
        style={{
          background: "var(--hero-bg)",
          borderBottom: "1px solid var(--border)",
          padding: "64px 20px 72px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ maxWidth: "1080px", margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
          {/* Trust Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              borderRadius: "var(--radius-full)",
              background: "var(--sage-light)",
              border: "1px solid var(--sage)",
              color: "var(--primary)",
              fontSize: "13px",
              fontWeight: 600,
              marginBottom: "20px",
            }}
          >
            <ShieldCheck size={16} strokeWidth={2.4} />
            <span>Independent Local Technicians & Home Care in {currentCity?.name || "India"}</span>
          </div>

          <h1
            style={{
              fontSize: "clamp(2.2rem, 5vw, 3.75rem)",
              fontWeight: 800,
              lineHeight: 1.15,
              marginBottom: "16px",
              letterSpacing: "-0.03em",
            }}
          >
            <span style={{ color: "var(--primary)" }}>Expert Local Services, </span>
            <span style={{ color: "var(--text-primary)" }}>Right to Your Door</span>
          </h1>

          <p
            style={{
              fontSize: "clamp(1rem, 2vw, 1.15rem)",
              color: "var(--text-secondary)",
              maxWidth: "680px",
              margin: "0 auto 36px",
              lineHeight: 1.6,
            }}
          >
            Connect directly with verified electricians, plumbers, appliance technicians, and home tutors across your neighborhood with honest ratings and upfront fees.
          </p>

          {/* COMBINED SEARCH & LOCATION BAR */}
          <div
            style={{
              maxWidth: "760px",
              margin: "0 auto",
              position: "relative",
            }}
          >
            <form
              onSubmit={handleSearchSubmit}
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                background: "var(--bg-card)",
                padding: "8px",
                borderRadius: "var(--radius-lg)",
                border: "1.5px solid var(--border)",
                boxShadow: "var(--shadow-md)",
                gap: "8px",
              }}
            >
              {/* City Pill inside search */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--bg-muted)",
                  color: "var(--text-primary)",
                  fontSize: "14px",
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                <MapPin size={16} color="var(--primary)" />
                <span>{currentCity?.name || "All India"}</span>
              </div>

              {/* Service Input */}
              <div
                style={{
                  flex: 1,
                  minWidth: "220px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "0 8px",
                }}
              >
                <Search size={18} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Try 'Electrician', 'AC Servicing', 'Plumber'..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  style={{
                    width: "100%",
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    color: "var(--text-primary)",
                    fontSize: "15px",
                    fontFamily: "var(--font-body)",
                  }}
                />
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  padding: "12px 24px",
                  fontSize: "14px",
                  fontWeight: 600,
                  borderRadius: "var(--radius-md)",
                }}
              >
                Find Services
              </button>
            </form>

            {/* Instant Search Suggestions Dropdown */}
            {isSearchFocused && searchSuggestions.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  left: 0,
                  right: 0,
                  background: "var(--bg-card)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--shadow-lg)",
                  zIndex: 20,
                  overflow: "hidden",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    padding: "8px 16px",
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--text-muted)",
                    background: "var(--bg-muted)",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  Matching Service Categories
                </div>
                {searchSuggestions.map((s) => (
                  <div
                    key={s._id}
                    onMouseDown={() => router.push(`/providers/${s._id}`)}
                    style={{
                      padding: "12px 16px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderBottom: "1px solid var(--border-subtle)",
                      transition: "background 0.15s ease",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "14px" }}>
                        {s.name}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                        {s.description || "View verified technicians"}
                      </div>
                    </div>
                    {s.price && (
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--primary)" }}>
                        Starts ₹{s.price}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. POPULAR SEARCH TAGS */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "8px",
              marginTop: "24px",
            }}
          >
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>
              Popular in {currentCity?.name || "India"}:
            </span>
            {["Electrician", "Plumber", "AC Repair", "Cleaner", "Laptop Repair", "Painter"].map((tag) => (
              <button
                key={tag}
                onClick={() => handleQuickTagClick(tag)}
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-full)",
                  padding: "5px 12px",
                  fontSize: "12px",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  fontWeight: 500,
                  transition: "all 0.15s ease",
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 4. SERVICE CATEGORIES GRID */}
      <section className="section">
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", marginBottom: "36px" }}>
          <div>
            <h2 className="section-title">Explore Verified Services</h2>
            <p className="section-subtitle" style={{ marginBottom: 0 }}>
              Select a specialized category to inspect available professionals and transparent visiting charges
            </p>
          </div>
          <Link
            href="/services"
            className="btn btn-secondary"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <span>All Categories ({services.length})</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        {loadingServices ? (
          <div className="grid-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="skeleton" style={{ height: "180px" }} />
            ))}
          </div>
        ) : services.length === 0 ? (
          <div
            className="card"
            style={{
              padding: "48px 24px",
              textAlign: "center",
              background: "var(--bg-card)",
            }}
          >
            <Sparkles size={36} color="var(--primary)" style={{ margin: "0 auto 12px" }} />
            <h3 style={{ fontSize: "1.2rem", color: "var(--text-primary)", marginBottom: "6px" }}>
              Loading Service Categories
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
              Connecting to local service registry...
            </p>
          </div>
        ) : (
          <div className="grid-4">
            {services.slice(0, 8).map((service) => (
              <ServiceCard key={service._id} service={service} />
            ))}
          </div>
        )}
      </section>

      {/* 5. FEATURED / REAL AVAILABLE PROVIDERS */}
      <section style={{ background: "var(--bg-muted)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "72px 20px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", marginBottom: "36px" }}>
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--primary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: "8px",
                }}
              >
                <Award size={15} />
                <span>Available Professionals</span>
              </div>
              <h2 className="section-title">Verified Tradespeople</h2>
              <p className="section-subtitle" style={{ marginBottom: 0 }}>
                Real registered providers ready to assist you. Ratings only appear when verified by customer reviews.
              </p>
            </div>

            <Link
              href="/signup?role=provider"
              className="btn btn-sage"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Briefcase size={15} />
              <span>Register as a Professional</span>
            </Link>
          </div>

          {loadingProviders ? (
            <div className="grid-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton" style={{ height: "240px" }} />
              ))}
            </div>
          ) : providers.length > 0 ? (
            <div className="grid-3">
              {providers.slice(0, 6).map((provider) => (
                <ProviderCard
                  key={provider._id}
                  provider={provider}
                  reviews={reviewsMap[provider._id] || []}
                  serviceName={provider.serviceName}
                  onBook={(p) => {
                    if (!isLoggedIn) {
                      router.push("/login");
                    } else {
                      setBookingProvider(p);
                      setBookingDate("");
                      setBookingError("");
                      setBookingSuccess(null);
                    }
                  }}
                  onViewReviews={(p) => {
                    const sid =
                      typeof p.serviceId === "object"
                        ? (p.serviceId as any)._id
                        : p.serviceId;
                    router.push(`/providers/${sid}`);
                  }}
                />
              ))}
            </div>
          ) : (
            /* Honest, attractive empty state without fabricating numbers */
            <div
              className="card"
              style={{
                padding: "48px 32px",
                textAlign: "center",
                maxWidth: "680px",
                margin: "0 auto",
                background: "var(--bg-card)",
              }}
            >
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  background: "var(--sage-light)",
                  color: "var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <Users size={28} strokeWidth={2} />
              </div>
              <h3 style={{ fontSize: "1.25rem", color: "var(--text-primary)", marginBottom: "8px" }}>
                Early Provider Onboarding
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.6, marginBottom: "24px" }}>
                We are actively registering independent local electricians, plumbers, and technicians across Indian neighborhoods with zero commission fees.
              </p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                <Link href="/signup?role=provider" className="btn btn-primary">
                  List Your Service (0% Listing Fee)
                </Link>
                <Link href="/services" className="btn btn-secondary">
                  Browse Categories
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 6. HOW IT WORKS SECTION */}
      <section className="section">
        <div style={{ textAlign: "center", maxWidth: "680px", margin: "0 auto 48px" }}>
          <h2 className="section-title">Transparent & Direct</h2>
          <p className="section-subtitle" style={{ margin: "0 auto" }}>
            How SevaHub works for homeowners and local service professionals
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "28px",
          }}
        >
          {HOW_IT_WORKS_STEPS.map((step) => (
            <div
              key={step.number}
              className="card"
              style={{
                padding: "32px 24px",
                position: "relative",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  fontSize: "2rem",
                  fontWeight: 900,
                  fontFamily: "var(--font-heading)",
                  color: "var(--sage-dark)",
                  marginBottom: "16px",
                  lineHeight: 1,
                }}
              >
                {step.number}
              </div>
              <h3
                style={{
                  fontSize: "1.15rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  marginBottom: "10px",
                }}
              >
                {step.title}
              </h3>
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                }}
              >
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. DEDICATED PRO ONBOARDING SECTION */}
      <section
        style={{
          background: "var(--primary)",
          color: "var(--text-inverse)",
          padding: "72px 20px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            maxWidth: "1080px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "48px",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "5px 12px",
                borderRadius: "var(--radius-full)",
                background: "rgba(255, 255, 255, 0.15)",
                fontSize: "12px",
                fontWeight: 600,
                marginBottom: "16px",
              }}
            >
              <Briefcase size={14} />
              <span>For Independent Professionals & Technicians</span>
            </div>
            <h2
              style={{
                fontSize: "clamp(2rem, 4vw, 2.75rem)",
                fontWeight: 800,
                color: "#FFFFFF",
                lineHeight: 1.2,
                marginBottom: "16px",
              }}
            >
              Grow Your Local Service Practice
            </h2>
            <p
              style={{
                fontSize: "15px",
                color: "rgba(255, 255, 255, 0.85)",
                lineHeight: 1.6,
                marginBottom: "28px",
              }}
            >
              Join SevaHub to connect directly with homeowners in your city. Keep 100% of your earnings, set your own visiting fees, and build an honest online reputation verified by real customers.
            </p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <Link
                href="/signup?role=provider"
                className="btn btn-amber"
                style={{
                  padding: "12px 28px",
                  fontSize: "15px",
                  fontWeight: 700,
                }}
              >
                Join as a Partner
              </Link>
              <Link
                href="/login"
                className="btn"
                style={{
                  padding: "12px 24px",
                  fontSize: "14px",
                  fontWeight: 600,
                  background: "rgba(255, 255, 255, 0.12)",
                  color: "#FFFFFF",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                }}
              >
                Partner Login
              </Link>
            </div>
          </div>

          <div
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "var(--radius-lg)",
              padding: "32px",
              backdropFilter: "blur(10px)",
            }}
          >
            <h3 style={{ fontSize: "1.2rem", color: "#FFFFFF", marginBottom: "20px" }}>
              Why Professionals Choose SevaHub
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "14px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <CheckCircle2 size={18} color="var(--amber)" style={{ flexShrink: 0, marginTop: "2px" }} />
                <span><strong>Zero upfront fees:</strong> Free registration with clear, straightforward profile management.</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <CheckCircle2 size={18} color="var(--amber)" style={{ flexShrink: 0, marginTop: "2px" }} />
                <span><strong>Direct customer calls:</strong> Customers contact you directly for scheduled appointments.</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <CheckCircle2 size={18} color="var(--amber)" style={{ flexShrink: 0, marginTop: "2px" }} />
                <span><strong>Verified digital badge:</strong> Build verified credentials that neighborhood clients trust.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. TRUST & SAFETY SECTION */}
      <section className="section">
        <div style={{ textAlign: "center", maxWidth: "680px", margin: "0 auto 48px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              fontWeight: 700,
              color: "var(--primary)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "8px",
            }}
          >
            <ShieldCheck size={16} />
            <span>Honest & Verified Standards</span>
          </div>
          <h2 className="section-title">Safety & Verification Policy</h2>
          <p className="section-subtitle" style={{ margin: "0 auto" }}>
            We do not manufacture fake statistics or synthetic reviews. Here is exactly how we ensure quality.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "24px",
          }}
        >
          {TRUST_PILLARS.map((pillar) => (
            <div
              key={pillar.title}
              className="card"
              style={{
                padding: "28px",
                display: "flex",
                flexDirection: "column",
                background: "var(--bg-card)",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "var(--sage-light)",
                  color: "var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "16px",
                }}
              >
                <ShieldCheck size={22} strokeWidth={2.2} />
              </div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
                {pillar.title}
              </h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                {pillar.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* BOOKING MODAL */}
      {bookingProvider && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setBookingProvider(null)}
        >
          <div className="modal">
            <h3 style={{ fontSize: "1.25rem", color: "var(--text-primary)", marginBottom: "4px" }}>
              Book Service with {bookingProvider.name}
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px" }}>
              Visiting / Diagnostic Fee: <strong>₹{bookingProvider.price || 0}</strong>
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}><label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Service address<input className="input" placeholder="Full address where service is needed" value={bookingAddress.address} onChange={(event) => setBookingAddress((current) => ({ ...current, address: event.target.value }))} /></label><label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>City or PIN code<input className="input" placeholder="City, locality, or PIN code" value={bookingAddress.city || ""} onChange={(event) => setBookingAddress((current) => ({ ...current, city: event.target.value }))} /></label></div><button type="button" onClick={useBookingLocation} className="btn btn-secondary" disabled={bookingLocationLoading} style={{ alignSelf: "flex-start", marginBottom: "16px" }}>{bookingLocationLoading ? "Resolving current location..." : "Use my current location"}</button>{bookingError && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--danger-bg)",
                  color: "var(--danger)",
                  fontSize: "13px",
                  marginBottom: "16px",
                }}
              >
                {bookingError}
              </div>
            )}

            {bookingSuccess && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--success-bg)",
                  color: "var(--success)",
                  fontSize: "13px",
                  marginBottom: "16px",
                }}
              >
                {bookingSuccess}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    marginBottom: "6px",
                  }}
                >
                  Select Preferred Service Date
                </label>
                <input
                  type="date"
                  className="input"
                  min={new Date().toISOString().split("T")[0]}
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                />
              </div>

              <div
                style={{
                  padding: "12px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--bg-muted)",
                  fontSize: "12px",
                  color: "var(--text-secondary)",
                  lineHeight: 1.5,
                }}
              >
                ℹ️ Direct Payment Policy: Pay the technician directly after completion of work. No online pre-payments required.
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setBookingProvider(null)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBooking}
                  disabled={bookingLoading}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  {bookingLoading ? "Scheduling..." : "Confirm Booking"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
