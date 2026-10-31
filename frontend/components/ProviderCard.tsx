"use client";

import React, { useState } from "react";
import { ShieldCheck, Phone, Clock, Award, Star, Calendar, MessageSquare } from "lucide-react";
import { Provider, Review } from "../types";

interface ProviderCardProps {
  provider: Provider;
  reviews?: Review[];
  serviceName?: string;
  onBook?: (provider: Provider) => void;
  onViewReviews?: (provider: Provider) => void;
  showActions?: boolean;
}

export default function ProviderCard({
  provider,
  reviews = [],
  serviceName,
  onBook,
  onViewReviews,
  showActions = true,
}: ProviderCardProps) {
  const [imgError, setImgError] = useState(false);

  // Review calculations based strictly on real reviews
  const reviewCount = reviews.length;
  const avgRating =
    reviewCount > 0
      ? reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviewCount
      : provider.rating > 0
      ? provider.rating
      : 0;

  const initials = provider.name
    ? provider.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "SP";

  return (
    <div
      className="card"
      style={{
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: "100%",
        position: "relative",
      }}
    >
      <div>
        {/* Header with Avatar and Badges */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "16px" }}>
          {provider.avatar && !imgError ? (
            <img
              src={provider.avatar}
              alt={provider.name}
              onError={() => setImgError(true)}
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "14px",
                objectFit: "cover",
                border: "1.5px solid var(--border)",
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "14px",
                background: "var(--sage-light)",
                border: "1.5px solid var(--sage)",
                color: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "18px",
                flexShrink: 0,
                letterSpacing: "0.02em",
              }}
            >
              {initials}
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  lineHeight: 1.25,
                }}
              >
                {provider.name}
              </h3>
              {provider.isVerified && (
                <span className="badge badge-verified" title="Identity & Phone Verified">
                  <ShieldCheck size={13} strokeWidth={2.4} />
                  Verified
                </span>
              )}
            </div>

            {serviceName && (
              <div style={{ fontSize: "13px", color: "var(--primary)", fontWeight: 600 }}>
                {serviceName}
              </div>
            )}

            {/* Ratings - Strictly honest */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px" }}>
              {reviewCount > 0 || avgRating > 0 ? (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "2px", color: "var(--amber)" }}>
                    <Star size={15} fill="currentColor" stroke="none" />
                    <span style={{ fontWeight: 700, fontSize: "13px", color: "var(--text-primary)" }}>
                      {avgRating.toFixed(1)}
                    </span>
                  </div>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
                  </span>
                </>
              ) : (
                <span style={{ fontSize: "12px", color: "var(--text-muted)", background: "var(--bg-muted)", padding: "2px 8px", borderRadius: "var(--radius-sm)" }}>
                  New on Platform
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bio if present */}
        {provider.bio && (
          <p
            style={{
              fontSize: "13px",
              color: "var(--text-secondary)",
              lineHeight: 1.5,
              marginBottom: "16px",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {provider.bio}
          </p>
        )}

        {/* Details List */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
            padding: "12px",
            borderRadius: "var(--radius-md)",
            background: "var(--bg-muted)",
            marginBottom: "20px",
            fontSize: "13px",
          }}
        >
          <div>
            <div style={{ color: "var(--text-muted)", fontSize: "11px", textTransform: "uppercase", fontWeight: 600 }}>
              Experience
            </div>
            <div style={{ fontWeight: 600, color: "var(--text-primary)", marginTop: "2px" }}>
              {provider.experience && provider.experience > 0
                ? `${provider.experience} ${provider.experience === 1 ? "Year" : "Years"}`
                : "Experienced"}
            </div>
          </div>

          <div>
            <div style={{ color: "var(--text-muted)", fontSize: "11px", textTransform: "uppercase", fontWeight: 600 }}>
              Visiting / Fee
            </div>
            <div style={{ fontWeight: 700, color: "var(--primary)", marginTop: "2px" }}>
              {provider.price && provider.price > 0 ? `₹${provider.price}` : "Standard Rates"}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div style={{ display: "flex", gap: "10px", marginTop: "auto" }}>
          {onViewReviews && (
            <button
              onClick={() => onViewReviews(provider)}
              className="btn btn-secondary"
              style={{ flex: 1, padding: "8px 12px", fontSize: "13px" }}
              title="View customer feedback and ratings"
            >
              <MessageSquare size={14} />
              Reviews
            </button>
          )}

          {onBook && (
            <button
              onClick={() => onBook(provider)}
              className="btn btn-primary"
              style={{ flex: 1, padding: "8px 12px", fontSize: "13px" }}
            >
              <Calendar size={14} />
              Book Service
            </button>
          )}
        </div>
      )}
    </div>
  );
}
