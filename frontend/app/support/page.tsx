"use client";

import { useState, useRef, useEffect } from "react";
import api from "../../lib/api";

interface Message {
  role: "user" | "bot";
  text: string;
  time: string;
}

const FAQs = [
  "How do I book a service?",
  "How do I become a provider?",
  "How do I cancel a booking?",
  "What do the booking statuses mean?",
];

export default function SupportPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      text: "👋 Hi! I'm your ServiceHub assistant. Ask me anything about bookings, providers, or how to use the platform. You can also click a quick question below!",
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
      setMessages((m) => [...m, { role: "bot", text: "Sorry, I'm having trouble right now. Please try again.", time }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ paddingTop: "64px" }}>
      <div style={{ background: "var(--gradient-hero)", padding: "60px 24px 48px", textAlign: "center" }}>
        <h1 style={{ fontFamily: "var(--font-outfit)", fontSize: "2.2rem", fontWeight: 700, color: "white", marginBottom: "8px" }}>
          🤖 Support Center
        </h1>
        <p style={{ color: "rgba(255,255,255,0.65)" }}>Ask questions about ServiceHub — instant AI-powered answers</p>
      </div>

      <div className="section" style={{ paddingTop: "32px", maxWidth: "760px" }}>
        {/* Chat window */}
        <div className="card" style={{ overflow: "hidden" }}>
          {/* Chat header */}
          <div style={{
            padding: "16px 20px", background: "var(--gradient-primary)",
            display: "flex", alignItems: "center", gap: "12px",
          }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "50%",
              background: "rgba(255,255,255,0.2)", display: "flex",
              alignItems: "center", justifyContent: "center", fontSize: "18px",
            }}>
              🤖
            </div>
            <div>
              <div style={{ fontWeight: 700, color: "white", fontSize: "15px" }}>ServiceHub Assistant</div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", gap: "5px" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80" }} />
                Online — typically replies instantly
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ padding: "20px", height: "420px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px", background: "var(--bg-muted)" }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{ maxWidth: "75%" }}>
                  <div style={{
                    padding: "12px 16px", borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    background: msg.role === "user" ? "var(--gradient-primary)" : "var(--bg-card)",
                    color: msg.role === "user" ? "white" : "var(--text-primary)",
                    fontSize: "14px", lineHeight: 1.7, border: "1px solid var(--border)",
                    boxShadow: "var(--shadow-sm)",
                  }}>
                    {msg.text}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", textAlign: msg.role === "user" ? "right" : "left" }}>
                    {msg.time}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ padding: "12px 16px", background: "var(--bg-card)", borderRadius: "16px 16px 16px 4px", border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", gap: "4px" }}>
                    {[0,1,2].map((i) => (
                      <div key={i} style={{
                        width: "8px", height: "8px", borderRadius: "50%", background: "var(--primary)",
                        animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite`,
                      }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick FAQs */}
          <div style={{ padding: "12px 20px", background: "var(--bg-card)", borderTop: "1px solid var(--border)", display: "flex", gap: "8px", overflowX: "auto", flexWrap: "wrap" }}>
            {FAQs.map((faq) => (
              <button
                key={faq}
                onClick={() => sendMessage(faq)}
                style={{
                  padding: "6px 12px", borderRadius: "9999px", border: "1.5px solid var(--border)",
                  background: "var(--bg-muted)", color: "var(--text-secondary)",
                  fontSize: "12px", cursor: "pointer", whiteSpace: "nowrap",
                  transition: "all 0.2s ease", flexShrink: 0,
                }}
              >
                {faq}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={{ padding: "16px 20px", background: "var(--bg-card)", borderTop: "1px solid var(--border)", display: "flex", gap: "12px" }}>
            <input
              className="input"
              placeholder="Type your question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
              style={{ flex: 1 }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="btn btn-primary"
              style={{ padding: "10px 20px", opacity: !input.trim() || loading ? 0.6 : 1 }}
            >
              Send ↗
            </button>
          </div>
        </div>

        {/* Tips */}
        <div style={{ marginTop: "24px", padding: "20px", background: "var(--bg-card)", borderRadius: "14px", border: "1px solid var(--border)" }}>
          <p style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "10px" }}>💡 What I can help with:</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {["How to book a service", "Becoming a provider", "Booking status meanings", "Cancellation process", "Review & ratings", "Account management"].map((t) => (
              <div key={t} style={{ fontSize: "13px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ color: "var(--primary)" }}>✓</span> {t}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
