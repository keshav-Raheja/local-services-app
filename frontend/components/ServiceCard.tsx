"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Service } from "../types";
import { getServiceIcon } from "../lib/icons";

interface ServiceCardProps {
  service: Service;
}

export default function ServiceCard({ service }: ServiceCardProps) {
  const Icon = getServiceIcon(service.name);

  return (
    <Link
      href={`/providers/${service._id}`}
      style={{ textDecoration: "none", color: "inherit", display: "block", height: "100%" }}
    >
      <div
        className="card"
        style={{
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          height: "100%",
          cursor: "pointer",
        }}
      >
        <div>
          {/* Icon Badge */}
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "14px",
              background: "var(--sage-light)",
              border: "1px solid var(--sage)",
              color: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
              transition: "transform 0.2s ease",
            }}
          >
            <Icon size={26} strokeWidth={2} />
          </div>

          <h3
            style={{
              fontSize: "1.15rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: "6px",
              lineHeight: 1.3,
            }}
          >
            {service.name}
          </h3>

          <p
            style={{
              fontSize: "13px",
              color: "var(--text-secondary)",
              lineHeight: 1.5,
              marginBottom: "16px",
            }}
          >
            {service.description || "Experienced and verified local professionals available."}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "14px",
            borderTop: "1px solid var(--border-subtle)",
            marginTop: "auto",
          }}
        >
          {service.price ? (
            <div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                Starts at
              </div>
              <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--primary)" }}>
                ₹{service.price}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>
              Transparent pricing
            </div>
          )}

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "13px",
              fontWeight: 700,
              color: "var(--primary)",
            }}
          >
            <span>View Pros</span>
            <ArrowUpRight size={15} />
          </div>
        </div>
      </div>
    </Link>
  );
}
