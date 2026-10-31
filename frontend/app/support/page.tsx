"use client";

import { useState, useRef, useEffect } from "react";
import {
  HelpCircle,
  Bot,
  Send,
  User,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import api from "../../lib/api";

interface Message {
  role: "user" | "bot";
  text: string;
  time: string;
}

const FAQs = [
  "How do I book a local service?",
  "How do I register as a provider?",
  "How are charges and visiting fees handled?",
  "What do booking statuses mean?",
];

export default function SupportPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      text: "Namaste! I'm your SevaHub assistant. Ask me about finding local trade professionals, booking procedures, or listing your trade service.",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages((m) => [...m, { role: "user", text, time }]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post<{ answer: string }>("/support/ask", { message: text });
      setMessages((m) => [...m, { role: "bot", text: res.answer, time }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "bot",
          text: "I am having temporary trouble reaching the knowledge service. You can also review the quick FAQ suggestions below.",
          time,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ paddingTop: "68px" }}>
      {/* Header */}
      <section
        style={{
          background: "var(--hero-bg)",
          borderBottom: "1px solid var(--border)",
          padding: "48px 20px 40px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
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
            <HelpCircle size={14} />
            <span>Customer & Partner Support</span>
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
            SevaHub Help Center
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Instant answers regarding verified technicians, direct bookings, and provider policies.
          </p>
        </div>
      </section>

      <section className="section" style={{ maxWidth: "780px", paddingTop: "32px" }}>
        {/* Chat Window */}
        <div className="card" style={{ overflow: "hidden", border: "1px solid var(--border)" }}>
          {/* Chat Header */}
          <div
            style={{
              padding: "16px 20px",
              background: "var(--primary)",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(255, 255, 255, 0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bot size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "15px" }}>SevaHub Virtual Assistant</div>
              <div style={{ fontSize: "12px", opacity: 0.85, display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80" }} />
                Online & ready to assist
              </div>
            </div>
          </div>

          {/* Messages */}
          <div
            style={{
              padding: "20px",
              height: "400px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              background: "var(--bg-muted)",
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div style={{ maxWidth: "80%" }}>
                  <div
                    style={{
                      padding: "12px 16px",
                      borderRadius:
                        msg.role === "user"
                          ? "16px 16px 4px 16px"
                          : "16px 16px 16px 4px",
                      background: msg.role === "user" ? "var(--primary)" : "var(--bg-card)",
                      color: msg.role === "user" ? "var(--text-inverse)" : "var(--text-primary)",
                      fontSize: "14px",
                      lineHeight: 1.6,
                      border: "1px solid var(--border)",
                      boxShadow: "var(--shadow-xs)",
                    }}
                  >
                    {msg.text}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      marginTop: "4px",
                      textAlign: msg.role === "user" ? "right" : "left",
                    }}
                  >
                    {msg.time}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    padding: "10px 16px",
                    background: "var(--bg-card)",
                    borderRadius: "14px",
                    border: "1px solid var(--border)",
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                  }}
                >
                  Typing answer...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick FAQ Chips */}
          <div
            style={{
              padding: "12px 16px",
              background: "var(--bg-card)",
              borderTop: "1px solid var(--border)",
              display: "flex",
              gap: "8px",
              overflowX: "auto",
              flexWrap: "wrap",
            }}
          >
            {FAQs.map((faq) => (
              <button
                key={faq}
                onClick={() => sendMessage(faq)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "var(--radius-full)",
                  border: "1px solid var(--border)",
                  background: "var(--bg-muted)",
                  color: "var(--text-secondary)",
                  fontSize: "12px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  fontWeight: 500,
                  transition: "all 0.15s ease",
                }}
              >
                {faq}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div
            style={{
              padding: "14px 16px",
              background: "var(--bg-card)",
              borderTop: "1px solid var(--border)",
              display: "flex",
              gap: "10px",
            }}
          >
            <input
              className="input"
              placeholder="Ask a question about SevaHub..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
              style={{ flex: 1 }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="btn btn-primary"
              style={{ padding: "10px 20px" }}
            >
              <Send size={15} />
              <span>Ask</span>
            </button>
          </div>
        </div>

        {/* Helpful Guides */}
        <div className="card" style={{ marginTop: "24px", padding: "24px" }}>
          <h3 style={{ fontSize: "1.05rem", color: "var(--text-primary)", marginBottom: "12px" }}>
            Common Help Topics
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "10px",
              fontSize: "13px",
              color: "var(--text-secondary)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle2 size={16} color="var(--primary)" />
              <span>Booking appointment flow</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle2 size={16} color="var(--primary)" />
              <span>Direct pay after work completion</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle2 size={16} color="var(--primary)" />
              <span>KYC & Provider verification</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle2 size={16} color="var(--primary)" />
              <span>Submitting verified reviews</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
