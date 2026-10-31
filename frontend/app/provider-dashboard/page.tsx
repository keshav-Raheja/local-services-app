"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, BarChart3, BriefcaseBusiness, CalendarDays, CheckCircle2, ChevronRight, Clock3, DollarSign, Menu, PanelLeftClose, Settings, Star, UserRound, Users, XCircle } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import api, { ApiError } from "../../lib/api";
import { Booking, Provider, Review, Service } from "../../types";
import { reverseGeocodeCoordsStrict } from "../../lib/locations";

type Section = "overview" | "bookings" | "earnings" | "services" | "availability" | "customers" | "insights" | "credit" | "profile";
type Period = "this-week" | "last-week" | "this-month" | "last-month" | "custom";

type DashboardData = {
  period: { start: string; end: string };
  provider: Provider;
  metrics: { earnings: { available: boolean; gross: number | null; fees: number | null; refunds: number | null; net: number | null }; completedJobs: number; pendingRequests: number; averageRating: number; reviewCount: number; completedChange: number | null; earningsChange: number | null };
  chart: { available: boolean; points: Array<{ date: string; net: number | null }>; reason?: string };
  pipeline: { pending: number; confirmed: number; inProgress: number; completed: number; rejected: number };
  schedule: Booking[];
  insights: { repeatCustomerRate: number | null; uniqueCustomers: number; responseTimeHours: number | null; conversionRate: number | null };
  growth: Array<{ key: string; title: string; detail: string; href: string }>;
  recentBookings: Booking[];
};

type CreditRecord = { _id: string; customerId: { name?: string; email?: string } | string; bookingId: { _id?: string; date?: string } | string; totalPaise: number; initialPaidPaise: number; outstandingPaise: number; dueDate?: string; status: "outstanding" | "settled"; note?: string };
type RepaymentRecord = { _id: string; creditId: string; amountPaise: number; paymentMethod: string; recordedAt: string; note?: string };
type CreditData = { credits: CreditRecord[]; repayments: RepaymentRecord[] };

const sections: Array<{ key: Section; label: string; icon: typeof BriefcaseBusiness }> = [
  { key: "overview", label: "Overview", icon: BarChart3 },
  { key: "bookings", label: "Bookings", icon: CalendarDays },
  { key: "earnings", label: "Earnings & Payouts", icon: DollarSign },
  { key: "services", label: "Services & Pricing", icon: BriefcaseBusiness },
  { key: "availability", label: "Availability", icon: Clock3 },
  { key: "customers", label: "Customers & Reviews", icon: Users },
  { key: "insights", label: "Insights", icon: BarChart3 },
  { key: "credit", label: "Customer Credit", icon: DollarSign },
  { key: "profile", label: "Profile", icon: UserRound },
];

const sectionDetails: Record<Section, { title: string; description: string }> = {
  overview: { title: "Business Overview", description: "A clear view of your services, bookings, and customer activity." },
  bookings: { title: "Bookings", description: "Review requests and keep your booking workflow moving." },
  earnings: { title: "Earnings & Payouts", description: "Review available financial records and payout status." },
  services: { title: "Services & Pricing", description: "Review the service and provider pricing details customers see." },
  availability: { title: "Availability", description: "Manage appointment availability when scheduling data is configured." },
  customers: { title: "Customers & Reviews", description: "Review customer activity and feedback for your business." },
  insights: { title: "Insights", description: "Review performance metrics supported by your current data." },
  credit: { title: "Customer Credit", description: "Record and reconcile provider-owned customer credit without confusing it with platform earnings." },
  profile: { title: "Profile", description: "Keep the information customers use to choose your business up to date." },
};

function sectionFromQuery(value: string | null): Section {
  return value && sections.some((item) => item.key === value) ? value as Section : "overview";
}
function dayStart(value: Date) { const date = new Date(value); date.setUTCHours(0, 0, 0, 0); return date; }
function monday(value: Date) { const date = dayStart(value); const day = date.getUTCDay(); date.setUTCDate(date.getUTCDate() - (day === 0 ? 6 : day - 1)); return date; }
function periodDates(period: Period, customStart: string, customEnd: string) {
  const now = new Date(); let start: Date; let end: Date;
  if (period === "custom") return { start: customStart, end: customEnd };
  if (period === "this-month" || period === "last-month") { start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + (period === "last-month" ? -1 : 0), 1)); end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1)); return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }; }
  start = monday(now); if (period === "last-week") start.setUTCDate(start.getUTCDate() - 7); end = new Date(start); end.setUTCDate(end.getUTCDate() + 7); return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}
function money(value: number | null) { return value === null ? "Unavailable" : `₹${value.toLocaleString("en-IN")}`; }
function bookingName(booking: Booking) { const customer = booking.userId as unknown as { name?: string }; return customer?.name || "Customer"; }
function serviceName(booking: Booking) { const service = booking.serviceId as unknown as { name?: string }; return service?.name || "Service"; }
function errorMessage(error: unknown) { return error instanceof Error ? error.message : "Something went wrong"; }

export default function ProviderDashboard() {
  const { userId, mounted } = useAuth();
  const [section, setSection] = useState<Section>(() => typeof window === "undefined" ? "overview" : sectionFromQuery(new URLSearchParams(window.location.search).get("section")));
  const contentRef = useRef<HTMLElement>(null);
  const [period, setPeriod] = useState<Period>("this-month"); const [customStart, setCustomStart] = useState(""); const [customEnd, setCustomEnd] = useState("");
  const [data, setData] = useState<DashboardData | null>(null); const [reviews, setReviews] = useState<Review[]>([]); const [creditData, setCreditData] = useState<CreditData | null>(null); const [creditLoading, setCreditLoading] = useState(false); const [creditError, setCreditError] = useState(""); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [errorKind, setErrorKind] = useState<"missing-profile" | "auth" | "network" | "server" | "validation" | "">(""); const [notice, setNotice] = useState(""); const [busy, setBusy] = useState<string | null>(null); const [sidebar, setSidebar] = useState(false);
  const dates = useMemo(() => periodDates(period, customStart, customEnd), [period, customStart, customEnd]);
  const dateError = period === "custom" && (!customStart || !customEnd || customEnd <= customStart) ? "Choose a valid start and end date." : "";
  const requestInFlight = useRef(false);
  const load = useCallback(async () => { if (!userId || requestInFlight.current) return; if (dateError) { setError(dateError); setErrorKind("validation"); return; } requestInFlight.current = true; setLoading(true); setError(""); setErrorKind(""); try { const result = await api.get<DashboardData>(`/providers/dashboard?start=${dates.start}&end=${dates.end}`); setData(result); } catch (err) { const apiError = err instanceof ApiError ? err : null; setError(errorMessage(err)); setErrorKind(apiError?.code === "PROVIDER_PROFILE_MISSING" ? "missing-profile" : apiError?.status === 401 ? "auth" : apiError?.isNetworkError ? "network" : apiError?.status === 400 ? "validation" : "server"); } finally { requestInFlight.current = false; setLoading(false); } }, [dateError, dates.end, dates.start, userId]);
  useEffect(() => { if (mounted && userId) void load(); }, [load, mounted, userId]);
  const selectSection = useCallback((next: Section) => {
    const url = new URL(window.location.href);
    url.searchParams.set("section", next);
    window.history.pushState({}, "", url);
    setSection(next);
    window.requestAnimationFrame(() => contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, []);
  useEffect(() => {
    const syncSection = () => {
      const next = sectionFromQuery(new URLSearchParams(window.location.search).get("section"));
      setSection(next);
      window.requestAnimationFrame(() => contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    };
    syncSection();
    window.addEventListener("popstate", syncSection);
    return () => window.removeEventListener("popstate", syncSection);
  }, []);
  useEffect(() => { if (section !== "customers" || !data?.provider?._id) return; api.get<{ reviews?: Review[] } | Review[]>(`/reviews/${data.provider._id}`).then((result) => setReviews(Array.isArray(result) ? result : (result.reviews || []))).catch(() => setReviews([])); }, [section, data?.provider?._id]);
  useEffect(() => { if (section !== "credit" || creditData) return; setCreditLoading(true); setCreditError(""); api.get<CreditData>("/providers/credits").then(setCreditData).catch((err) => setCreditError(errorMessage(err))).finally(() => setCreditLoading(false)); }, [section, creditData]);
  const changeStatus = async (bookingId: string, status: "confirmed" | "rejected" | "completed") => { setBusy(bookingId); setNotice(""); try { await api.put(`/bookings/${bookingId}`, { status }); setNotice("Booking updated"); await load(); } catch (err) { setError(errorMessage(err)); } finally { setBusy(null); } };
  if (!mounted || loading && !data) return <main className="provider-dashboard-shell"><div className="dashboard-loading">Loading your business dashboard…</div></main>;
  if (!userId) return <main className="provider-dashboard-shell"><style>{styles}</style><div className="dashboard-empty"><AlertCircle size={28} /><h1>Provider access required</h1><p>Please sign in with your provider account to continue.</p><Link href="/login" className="dashboard-action">Sign in</Link></div></main>;
  if (error && !data) return <main className="provider-dashboard-shell"><style>{styles}</style><div className="dashboard-empty">{errorKind === "missing-profile" ? <><UserRound size={30} /><h1>Complete your provider profile</h1><p>Your provider account is ready, but it needs a business profile before bookings and dashboard metrics can be shown.</p><Link href="/services?setup=provider" className="dashboard-action">Set up provider profile</Link><button className="dashboard-secondary-action" onClick={() => void load()} disabled={loading}>{loading ? "Retrying…" : "Check again"}</button></> : errorKind === "auth" ? <><AlertCircle size={30} /><h1>Your session has expired</h1><p>Please sign in again to securely access your provider workspace.</p><Link href="/login" className="dashboard-action">Sign in again</Link></> : <><AlertCircle size={30} /><h1>{errorKind === "network" ? "We cannot reach SevaHub" : "Dashboard unavailable"}</h1><p>{errorKind === "network" ? "The dashboard shell is ready, but the service is temporarily unreachable." : error}</p><button className="dashboard-action" onClick={() => void load()} disabled={loading}>{loading ? "Retrying…" : "Try again"}</button></>}</div></main>;
  const provider = data?.provider; const service = provider?.serviceId as unknown as Service | undefined; const currentSection = sectionDetails[section];
  return <main className="provider-dashboard-shell"><style>{styles}</style><button className="dashboard-mobile-menu" aria-label="Open dashboard menu" onClick={() => setSidebar(true)}><Menu size={20} /></button><aside className={`dashboard-sidebar ${sidebar ? "open" : ""}`}><div className="dashboard-brand">Seva<span>Hub</span></div><button className="dashboard-close" onClick={() => setSidebar(false)}><PanelLeftClose size={18} /></button><p className="dashboard-sidebar-label">Provider workspace</p>{sections.map(({ key, label, icon: Icon }) => <button key={key} className={`dashboard-nav-item ${section === key ? "active" : ""}`} onClick={() => selectSection(key)}><Icon size={18} />{label}</button>)}</aside><section className="dashboard-content" ref={contentRef}><header className="dashboard-header"><div><p className="dashboard-eyebrow">Provider workspace</p><h1>{currentSection.title}</h1><p className="dashboard-subtitle">{currentSection.description}</p></div><div className="dashboard-header-actions"><span className="dashboard-provider"><UserRound size={16} />{provider?.name || "Provider"}</span><Link href="/" className="dashboard-link">View marketplace</Link></div></header>{notice && <div className="dashboard-notice">{notice}</div>}{error && <div className="dashboard-error"><AlertCircle size={16} />{error}</div>}{section === "overview" && data && <Overview data={data} period={period} setPeriod={setPeriod} customStart={customStart} customEnd={customEnd} setCustomStart={setCustomStart} setCustomEnd={setCustomEnd} changeStatus={changeStatus} busy={busy} selectSection={selectSection} />}{section === "bookings" && data && <Bookings data={data} changeStatus={changeStatus} busy={busy} />}{section === "earnings" && <Unavailable title="Earnings & Payouts" detail="Payment and payout records are not available in the current backend, so no financial figures are fabricated." />}{section === "services" && <ProviderServices provider={provider} service={service} />}{section === "availability" && <Unavailable title="Availability" detail="The current schema does not store provider availability or appointment duration. Add availability rules before showing editable slots." />}{section === "customers" && <Customers reviews={reviews} data={data} />}{section === "insights" && data && <Insights data={data} />}{section === "credit" && <CreditLedger data={creditData} loading={creditLoading} error={creditError} onReload={() => setCreditData(null)} bookings={data?.recentBookings || []} />}{section === "profile" && provider && <Profile provider={provider} onSaved={() => void load()} />}</section></main>;
}

function paiseToRupees(value: number) { return `₹${(value / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function CreditLedger({ data, loading, error, onReload, bookings }: { data: CreditData | null; loading: boolean; error: string; onReload: () => void; bookings: Booking[] }) {
  const [selectedCredit, setSelectedCredit] = useState<string>("");
  const [repayment, setRepayment] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [createBooking, setCreateBooking] = useState("");
  const [total, setTotal] = useState("");
  const [initialPaid, setInitialPaid] = useState("0");
  const [creating, setCreating] = useState(false);
  if (loading) return <><PageTitle title="Customer Credit" detail="Loading provider-owned credit records…" /><div className="dashboard-empty"><div className="dashboard-loading">Loading credit records…</div></div></>;
  if (error) return <><PageTitle title="Customer Credit" detail="Credit records could not be loaded." /><div className="dashboard-empty"><AlertCircle size={28} /><p>{error}</p><button className="dashboard-action" onClick={onReload}>Try again</button></div></>;
  const credits = data?.credits || [];
  const outstanding = credits.reduce((sum, credit) => sum + credit.outstandingPaise, 0);
  const create = async (event: FormEvent) => { event.preventDefault(); const totalPaise = Math.round(Number(total) * 100); const initialPaise = Math.round(Number(initialPaid || 0) * 100); if (!createBooking || !Number.isInteger(totalPaise) || totalPaise <= 0 || !Number.isInteger(initialPaise) || initialPaise < 0 || initialPaise > totalPaise) { setMessage("Enter a completed booking and valid amounts."); return; } setCreating(true); setMessage(""); try { await api.post("/providers/credits", { bookingId: createBooking, totalPaise, initialPaidPaise: initialPaise }); setMessage("Credit recorded."); onReload(); } catch (err) { setMessage(errorMessage(err)); } finally { setCreating(false); } };
  const repay = async (event: FormEvent) => { event.preventDefault(); const amountPaise = Math.round(Number(repayment) * 100); if (!selectedCredit || !Number.isInteger(amountPaise) || amountPaise <= 0) { setMessage("Enter a valid repayment amount."); return; } setSaving(true); setMessage(""); try { await api.post(`/providers/credits/${selectedCredit}/repayments`, { amountPaise, paymentMethod: "cash" }, { headers: { "Idempotency-Key": `${selectedCredit}-${Date.now()}` } }); setMessage("Repayment recorded."); setRepayment(""); onReload(); } catch (err) { setMessage(errorMessage(err)); } finally { setSaving(false); } };
  return <><PageTitle title="Customer Credit" detail="Outstanding customer balances are separate from platform earnings and payouts." /><Panel title="Outstanding balance" icon={DollarSign}><strong className="credit-total">{paiseToRupees(outstanding)}</strong>{message && <p className="form-error">{message}</p>}<div className="credit-forms"><form onSubmit={create}><h3>Record service credit</h3><select value={createBooking} onChange={(event) => setCreateBooking(event.target.value)}><option value="">Completed booking</option>{bookings.filter((booking) => booking.status === "completed").map((booking) => <option value={booking._id} key={booking._id}>{booking._id} · {bookingName(booking)}</option>)}</select><input type="number" min="0.01" step="0.01" placeholder="Total charge (₹)" value={total} onChange={(event) => setTotal(event.target.value)} /><input type="number" min="0" step="0.01" placeholder="Initial payment (₹)" value={initialPaid} onChange={(event) => setInitialPaid(event.target.value)} /><button className="dashboard-action" disabled={creating}>{creating ? "Recording…" : "Record credit"}</button></form><form onSubmit={repay}><h3>Record repayment</h3><select value={selectedCredit} onChange={(event) => setSelectedCredit(event.target.value)}><option value="">Outstanding credit</option>{credits.filter((credit) => credit.outstandingPaise > 0).map((credit) => <option value={credit._id} key={credit._id}>{bookingName({ userId: credit.customerId } as unknown as Booking)} · {paiseToRupees(credit.outstandingPaise)}</option>)}</select><input type="number" min="0.01" step="0.01" placeholder="Repayment (₹)" value={repayment} onChange={(event) => setRepayment(event.target.value)} /><button className="dashboard-action" disabled={saving}>{saving ? "Recording…" : "Record cash repayment"}</button></form></div></Panel><Panel title="Credit history" icon={DollarSign}>{credits.length ? <div className="booking-table">{credits.map((credit) => <div className="booking-row" key={credit._id}><div><strong>{typeof credit.customerId === "object" ? credit.customerId.name || "Customer" : "Customer"}</strong><span>{credit.status === "settled" ? "Settled" : `${paiseToRupees(credit.outstandingPaise)} outstanding`}</span></div><span className={`booking-status ${credit.status === "settled" ? "confirmed" : "pending"}`}>{credit.status}</span></div>)}</div> : <Empty text="No customer credit has been recorded." />}</Panel></>;
}
function Overview({ data, period, setPeriod, customStart, customEnd, setCustomStart, setCustomEnd, changeStatus, busy, selectSection }: { data: DashboardData; period: Period; setPeriod: (value: Period) => void; customStart: string; customEnd: string; setCustomStart: (value: string) => void; setCustomEnd: (value: string) => void; changeStatus: (id: string, status: "confirmed" | "rejected" | "completed") => Promise<void>; busy: string | null; selectSection: (section: Section) => void }) { const { metrics, pipeline } = data; return <><div className="period-toolbar"><div>{(["this-week", "last-week", "this-month", "last-month"] as Period[]).map((value) => <button key={value} className={period === value ? "selected" : ""} onClick={() => setPeriod(value)}>{value.replace("this-", "This ").replace("last-", "Last ")}</button>)}<button className={period === "custom" ? "selected" : ""} onClick={() => setPeriod("custom")}>Custom</button></div>{period === "custom" && <div className="custom-dates"><input type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} /><span>to</span><input type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} /></div>}</div><div className="metric-grid"><Metric icon={DollarSign} label="Net earnings" value={money(metrics.earnings.net)} detail="Financial ledger unavailable" /><Metric icon={CheckCircle2} label="Completed jobs" value={String(metrics.completedJobs)} detail={metrics.completedChange === null ? "No comparison data" : `${metrics.completedChange}% vs prior period`} /><Metric icon={Clock3} label="Pending requests" value={String(metrics.pendingRequests)} detail="Current actionable requests" /><Metric icon={Star} label="Average rating" value={metrics.averageRating ? metrics.averageRating.toFixed(1) : "No rating"} detail={`${metrics.reviewCount} reviews`} /></div><div className="dashboard-grid"><Panel title="Earnings over time" icon={BarChart3}><div className="chart-empty"><BarChart3 size={28} /><strong>Financial data unavailable</strong><span>No payment or transaction model exists yet, so the chart remains truthful instead of showing demo values.</span></div></Panel><Panel title="Booking pipeline" icon={BriefcaseBusiness}><div className="pipeline">{[["New requests", pipeline.pending], ["Confirmed", pipeline.confirmed], ["In progress", pipeline.inProgress], ["Completed", pipeline.completed]].map(([label, value]) => <div className="pipeline-row" key={String(label)}><span>{label}</span><strong>{value}</strong></div>)}</div><button type="button" className="dashboard-inline-link dashboard-section-button" onClick={() => selectSection("bookings")}>Manage bookings <ChevronRight size={15} /></button></Panel><Panel title="Today’s schedule" icon={CalendarDays}><Schedule bookings={data.schedule} onNavigate={selectSection} /></Panel><Panel title="Business insights" icon={BarChart3}><InsightRows data={data} /></Panel></div><Panel title="Growth opportunities" icon={AwardIcon}><Growth growth={data.growth} onNavigate={selectSection} /></Panel><Panel title="Recent requests" icon={CalendarDays}><BookingsTable bookings={data.recentBookings.slice(0, 5)} changeStatus={changeStatus} busy={busy} /></Panel></>; }
const AwardIcon = Star;
function Metric({ icon: Icon, label, value, detail }: { icon: typeof Star; label: string; value: string; detail: string }) { return <div className="metric-card"><div className="metric-icon"><Icon size={18} /></div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>; }
function Panel({ title, icon: Icon, children }: { title: string; icon: typeof Star; children: React.ReactNode }) { return <section className="dashboard-panel"><div className="panel-heading"><h2><Icon size={18} />{title}</h2></div>{children}</section>; }
function Schedule({ bookings, onNavigate }: { bookings: Booking[]; onNavigate: (section: Section) => void }) { if (!bookings.length) return <Empty text="No upcoming appointments." />; return <div className="schedule-list">{bookings.slice(0, 5).map((booking) => <button type="button" onClick={() => onNavigate("bookings")} className="schedule-row dashboard-section-button" key={booking._id}><div><strong>{new Date(booking.date).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</strong><span>{serviceName(booking)} · {bookingName(booking)}</span></div><Status status={booking.status} /></button>)}</div>; }
function InsightRows({ data }: { data: DashboardData }) { return <div className="insight-list"><div><span>Repeat-customer rate</span><strong>{data.insights.repeatCustomerRate === null ? "Unavailable" : `${data.insights.repeatCustomerRate}%`}</strong></div><div><span>Unique customers</span><strong>{data.insights.uniqueCustomers}</strong></div><div><span>Response time</span><strong>{data.insights.responseTimeHours === null ? "Not tracked" : `${data.insights.responseTimeHours}h`}</strong></div><div><span>Conversion rate</span><strong>{data.insights.conversionRate === null ? "Not tracked" : `${data.insights.conversionRate}%`}</strong></div></div>; }
function Growth({ growth, onNavigate }: { growth: DashboardData["growth"]; onNavigate: (section: Section) => void }) { return growth.length ? <div className="growth-list">{growth.map((item) => <button type="button" className="growth-item dashboard-section-button" key={item.key} onClick={() => onNavigate(sectionFromQuery(new URL(item.href, window.location.href).searchParams.get("section")))}><strong>{item.title}</strong><span>{item.detail}</span><ChevronRight size={17} /></button>)}</div> : <Empty text="Your provider profile is up to date." />; }
function Bookings({ data, changeStatus, busy }: { data: DashboardData; changeStatus: (id: string, status: "confirmed" | "rejected" | "completed") => Promise<void>; busy: string | null }) { return <><PageTitle title="Bookings" detail="Review requests and keep your booking workflow moving." /><Panel title="Booking pipeline" icon={CalendarDays}><div className="pipeline-cards">{Object.entries(data.pipeline).map(([label, count]) => <div key={label}><span>{label}</span><strong>{count}</strong></div>)}</div></Panel><Panel title="All recent bookings" icon={BriefcaseBusiness}><BookingsTable bookings={data.recentBookings} changeStatus={changeStatus} busy={busy} /></Panel></>; }
function BookingsTable({ bookings, changeStatus, busy }: { bookings: Booking[]; changeStatus: (id: string, status: "confirmed" | "rejected" | "completed") => Promise<void>; busy: string | null }) { if (!bookings.length) return <Empty text="No bookings in this period." />; return <div className="booking-table">{bookings.map((booking) => <div className="booking-row" key={booking._id}><div><strong>{serviceName(booking)}</strong><span>{bookingName(booking)} · {new Date(booking.date).toLocaleDateString("en-IN")}</span></div><Status status={booking.status} /><div className="booking-actions">{booking.status === "pending" && <><button disabled={busy === booking._id} onClick={() => void changeStatus(booking._id, "confirmed")}>Accept</button><button disabled={busy === booking._id} onClick={() => void changeStatus(booking._id, "rejected")}><XCircle size={14} /></button></>}{booking.status === "confirmed" && <button disabled={busy === booking._id} onClick={() => void changeStatus(booking._id, "completed")}>Complete</button>}</div></div>)}</div>; }
type Offering = { _id: string; serviceId: string | Service; price: number; active: boolean };
function ProviderServices({ provider, service }: { provider?: Provider; service?: Service }) {
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState("");
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const loadOfferings = useCallback(async () => { try { const [offeringList, serviceList] = await Promise.all([api.get<Offering[]>("/providers/offerings"), api.get<Service[]>("/services")]); setOfferings(offeringList); setServices(serviceList); } catch (err) { setMessage(errorMessage(err)); } }, []);
  useEffect(() => { void loadOfferings(); }, [loadOfferings]);
  const addOffering = async (event: FormEvent) => { event.preventDefault(); const amount = Number(price); if (!selectedService || !Number.isFinite(amount) || amount < 0) { setMessage("Choose a profession and enter a valid price."); return; } setSaving(true); setMessage(""); try { await api.post("/providers/offerings", { serviceId: selectedService, price: amount }); setSelectedService(""); setPrice(""); setMessage("Profession added."); await loadOfferings(); } catch (err) { setMessage(errorMessage(err)); } finally { setSaving(false); } };
  const toggle = async (offering: Offering) => { setSaving(true); setMessage(""); try { await api.put(`/providers/offerings/${offering._id}`, { active: !offering.active }); await loadOfferings(); } catch (err) { setMessage(errorMessage(err)); } finally { setSaving(false); } };
  return <><PageTitle title="Services & Pricing" detail="Manage the professions customers can discover and book." /><Panel title="Your offerings" icon={BriefcaseBusiness}>{offerings.length ? <div className="offering-list">{offerings.map((offering) => { const current = typeof offering.serviceId === "object" ? offering.serviceId : services.find((item) => item._id === offering.serviceId); return <div className="offering-row" key={offering._id}><div><strong>{current?.name || (typeof offering.serviceId === "string" ? offering.serviceId : "Profession")}</strong><span>₹{offering.price.toLocaleString("en-IN")} · {offering.active ? "Published" : "Paused"}</span></div><button type="button" className="dashboard-secondary-action" onClick={() => void toggle(offering)} disabled={saving}>{offering.active ? "Pause" : "Publish"}</button></div>; })}</div> : <Empty text={`${service?.name || provider?.name || "Your provider"} has no offerings yet.`} />} </Panel><Panel title="Add another profession" icon={BriefcaseBusiness}><form className="profile-form" onSubmit={addOffering}><label>Profession<select value={selectedService} onChange={(event) => setSelectedService(event.target.value)}><option value="">Select a profession</option>{services.filter((item) => !offerings.some((offering) => String(typeof offering.serviceId === "object" ? offering.serviceId._id : offering.serviceId) === item._id)).map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></label><label>Starting price (₹)<input type="number" min="0" step="1" value={price} onChange={(event) => setPrice(event.target.value)} /></label>{message && <small className="form-error">{message}</small>}<button className="dashboard-action" disabled={saving}>{saving ? "Saving…" : "Add profession"}</button></form></Panel></>;
}function Customers({ reviews, data }: { reviews: Review[]; data: DashboardData | null }) { return <><PageTitle title="Customers & Reviews" detail={`${data?.insights.uniqueCustomers || 0} unique customers in the selected period.`} /><Panel title="Reviews" icon={Star}>{reviews.length ? <div className="review-list">{reviews.map((review) => <div className="review-row" key={review._id}><strong>{review.rating}/5</strong><span>{review.feedback || "No written feedback."}</span></div>)}</div> : <Empty text="No reviews available yet." />}</Panel></>; }
function Insights({ data }: { data: DashboardData }) { return <><PageTitle title="Insights" detail="Metrics are shown only where the current data model supports them." /><Panel title="Performance" icon={BarChart3}><InsightRows data={data} /></Panel><Unavailable title="Response and conversion tracking" detail="The booking schema does not record response events or status history, so these metrics remain unavailable." /></>; }
type ProfileForm = {
  name: string;
  phone: string;
  bio: string;
  avatar: string;
  experience: string;
  price: string;
  address: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  serviceAreas: string;
  serviceRadiusKm: string;
};

function Profile({ provider, onSaved }: { provider: Provider; onSaved: () => void }) {
  const [form, setForm] = useState<ProfileForm>({
    name: provider.name || "",
    phone: provider.phone || "",
    bio: provider.bio || "",
    avatar: provider.avatar || "",
    experience: provider.experience ? String(provider.experience) : "",
    price: provider.price ? String(provider.price) : "",
    address: provider.address || "",
    locality: provider.locality || "",
    city: provider.city || "",
    state: provider.state || "",
    pincode: provider.pincode || "",
    serviceAreas: (provider.serviceAreas || []).join(", "),
    serviceRadiusKm: provider.serviceRadiusKm ? String(provider.serviceRadiusKm) : "",
  });
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState("");
  const [validation, setValidation] = useState("");
  const [locationError, setLocationError] = useState("");
  const [detectedLocation, setDetectedLocation] = useState(provider.location);
  const update = (field: keyof ProfileForm, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const useCurrentLocation = () => {
    if (!navigator.geolocation) { setLocationError("This browser does not support location access."); return; }
    setLocationError(""); setMessage(""); setLocating(true);
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const location = await reverseGeocodeCoordsStrict(coords.latitude, coords.longitude);
        setDetectedLocation({ lat: location.lat as number, lng: location.lng as number });
        setForm((current) => ({ ...current, address: current.address || location.address || current.address, locality: location.locality || current.locality, city: location.city || current.city, state: location.state || current.state, pincode: location.pincode || current.pincode }));
        setMessage("Current location found. Review the address before saving.");
      } catch (error) { setLocationError(errorMessage(error)); }
      finally { setLocating(false); }
    }, (error) => {
      const message = error.code === error.PERMISSION_DENIED ? "Location permission was denied. Your saved address was not changed." : error.code === error.TIMEOUT ? "Location lookup timed out. Please try again." : "Unable to determine your current location.";
      setLocationError(message); setLocating(false);
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) { setValidation("Business name and phone are required."); return; }
    const experience = Number(form.experience || 0);
    const price = Number(form.price || 0);
    const radius = Number(form.serviceRadiusKm);
    if (!Number.isFinite(experience) || experience < 0) { setValidation("Experience must be a non-negative number."); return; }
    if (!Number.isFinite(price) || price < 0) { setValidation("Starting price must be a non-negative number."); return; }
    if (!Number.isFinite(radius) || radius <= 0) { setValidation("Service radius must be greater than zero."); return; }
    setValidation(""); setMessage(""); setSaving(true);
    try {
      await api.put(`/providers/profile/${provider.userId}`, {
        name: form.name.trim(), phone: form.phone.trim(), bio: form.bio, avatar: form.avatar.trim(),
        experience, price,
        address: form.address, locality: form.locality, city: form.city, state: form.state, pincode: form.pincode,
        serviceAreas: form.serviceAreas.split(",").map((value) => value.trim()).filter(Boolean),
        serviceRadiusKm: radius,
        location: detectedLocation,
      });
      setMessage("Profile saved successfully."); onSaved();
    } catch (err) { setMessage(errorMessage(err)); } finally { setSaving(false); }
  };
  const field = (label: string, key: keyof ProfileForm, type = "text") => <label key={key}>{label}<input type={type} value={form[key]} onChange={(event) => update(key, event.target.value)} /></label>;
  return <><PageTitle title="Profile" detail="Keep the information customers use to choose your business up to date." /><Panel title="Business profile" icon={Settings}><form className="profile-form" onSubmit={submit}><div className="profile-grid">{field("Business name", "name")}{field("Phone", "phone", "tel")}{field("Starting price", "price", "number")}{field("Experience (years)", "experience", "number")}{field("Address", "address")}{field("Locality", "locality")}{field("City", "city")}{field("State", "state")}{field("Pincode", "pincode")}{field("Service radius (km)", "serviceRadiusKm", "number")}{field("Profile photo URL", "avatar", "url")}</div><div className="profile-image-preview" aria-label="Profile image preview" style={form.avatar ? { backgroundImage: `url(${form.avatar})` } : undefined}>{!form.avatar && <UserRound size={24} />}</div><div className="location-actions"><button type="button" className="dashboard-secondary-action" onClick={useCurrentLocation} disabled={locating || saving}>{locating ? "Finding current location…" : "Use my current location"}</button><small>Uses this device location to suggest an address. Review it before saving; it does not track you in the background.</small></div><label>Service areas <input value={form.serviceAreas} onChange={(event) => update("serviceAreas", event.target.value)} placeholder="Localities or pincodes, separated by commas" /></label><label>Business description <textarea value={form.bio} onChange={(event) => update("bio", event.target.value)} rows={5} /></label>{validation && <small className="form-error">{validation}</small>}{locationError && <small className="form-error">{locationError}</small>}<button className="dashboard-action" disabled={saving || locating}>{saving ? "Saving…" : "Save profile"}</button>{message && <small className={message.includes("successfully") || message.includes("found") ? "form-success" : "form-error"}>{message}</small>}</form></Panel></>;
}
function PageTitle({ title, detail }: { title: string; detail: string }) { return <div className="subpage-title"><h2>{title}</h2><p>{detail}</p></div>; }
function Unavailable({ title, detail }: { title: string; detail: string }) { return <><PageTitle title={title} detail={detail} /><div className="dashboard-empty"><DollarSign size={28} /><strong>Not available yet</strong><p>{detail}</p></div></>; }
function Empty({ text }: { text: string }) { return <div className="inline-empty">{text}</div>; }
function Status({ status }: { status: Booking["status"] }) { return <span className={`booking-status ${status}`}>{status === "pending" ? "New request" : status}</span>; }

const styles = `
.provider-dashboard-shell{min-height:100vh;background:var(--bg);color:var(--text-primary);display:flex;padding-top:84px;font-family:inherit}.dashboard-sidebar{width:240px;flex:0 0 240px;background:var(--bg-card);border-right:1px solid var(--border);padding:28px 16px;position:sticky;top:0;height:100vh}.dashboard-brand{font-size:25px;font-weight:800;padding:0 12px 32px;color:var(--text-primary)}.dashboard-brand span{color:var(--primary)}.dashboard-sidebar-label,.dashboard-eyebrow{color:var(--text-muted);text-transform:uppercase;letter-spacing:.12em;font-size:11px;font-weight:700}.dashboard-sidebar-label{padding:0 12px;margin:0 0 12px}.dashboard-nav-item{width:100%;border:0;background:transparent;color:var(--text-secondary);display:flex;align-items:center;gap:12px;padding:12px;border-radius:10px;text-align:left;font-size:13px;margin:3px 0;cursor:pointer}.dashboard-nav-item:hover,.dashboard-nav-item.active{background:var(--primary-soft);color:var(--primary-light)}.dashboard-content{scroll-margin-top:84px;max-width:1450px;width:100%;padding:36px 42px}.dashboard-header{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;margin-bottom:28px}.dashboard-header h1{font-size:34px;line-height:1.1;margin:8px 0}.dashboard-subtitle,.subpage-title p{color:var(--text-secondary);margin:0}.dashboard-header-actions{display:flex;gap:14px;align-items:center}.dashboard-provider{display:flex;gap:7px;align-items:center;color:var(--text-secondary)}.dashboard-link,.dashboard-inline-link{color:var(--primary);text-decoration:none}.dashboard-mobile-menu,.dashboard-close{display:none}.period-toolbar{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:20px;flex-wrap:wrap}.period-toolbar>div:first-child{display:flex;gap:6px;flex-wrap:wrap}.period-toolbar button,.custom-dates input{background:var(--bg-muted);border:1px solid var(--border);color:var(--text-secondary);border-radius:8px;padding:9px 12px;font:inherit;font-size:12px}.period-toolbar button{cursor:pointer}.period-toolbar button.selected{background:var(--primary);color:var(--text-inverse);border-color:var(--primary)}.custom-dates{display:flex;gap:8px;align-items:center}.metric-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:18px}.metric-card,.dashboard-panel,.dashboard-empty{background:var(--bg-card);border:1px solid var(--border);border-radius:14px}.metric-card{padding:18px;display:flex;flex-direction:column;gap:7px}.metric-card span,.metric-card small,.detail-grid span,.booking-row span,.schedule-row span,.insight-list span,.growth-item span{color:var(--text-muted);font-size:12px}.metric-card strong{font-size:26px;color:var(--text-primary)}.metric-icon{color:var(--primary)}.dashboard-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.dashboard-panel{padding:20px;margin-bottom:18px}.panel-heading{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}.panel-heading h2{font-size:16px;margin:0;display:flex;gap:9px;align-items:center}.panel-heading svg{color:var(--primary)}.chart-empty,.dashboard-empty{min-height:190px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;gap:8px;color:var(--text-secondary)}.chart-empty svg,.dashboard-empty svg{color:var(--primary)}.chart-empty strong,.dashboard-empty strong{color:var(--text-primary)}.chart-empty span,.dashboard-empty p{max-width:470px;margin:0;font-size:13px;line-height:1.5}.pipeline,.insight-list,.schedule-list,.booking-table,.review-list,.growth-list{display:flex;flex-direction:column;gap:11px}.pipeline-row,.insight-list>div,.schedule-row,.booking-row,.growth-item,.review-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border-subtle)}.pipeline-row:last-child,.insight-list>div:last-child{border-bottom:0}.pipeline-row strong,.insight-list strong{color:var(--primary)}.schedule-row,.growth-item{color:var(--text-primary);text-decoration:none;background:transparent;border:0;font:inherit;text-align:left;width:100%;cursor:pointer}.schedule-row>div,.growth-item{display:flex;flex-direction:column;align-items:flex-start}.schedule-row strong,.growth-item strong{font-size:13px}.booking-status{font-size:11px;border-radius:999px;padding:5px 8px;background:var(--success-bg);color:var(--success)}.booking-status.pending{background:var(--warning-bg);color:var(--warning)}.booking-status.rejected{background:var(--danger-bg);color:var(--danger)}.booking-actions{display:flex;gap:6px;margin-left:auto}.booking-actions button,.dashboard-action{border:1px solid var(--primary);background:var(--primary);color:var(--text-inverse);border-radius:7px;padding:7px 10px;font:inherit;font-size:12px;cursor:pointer}.booking-actions button:disabled,.dashboard-action:disabled{opacity:.55;cursor:wait}.booking-actions button+button{background:var(--danger);border-color:var(--danger)}.pipeline-cards,.detail-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.pipeline-cards>div,.detail-grid>div{background:var(--bg-muted);border:1px solid var(--border);border-radius:10px;padding:14px;display:flex;flex-direction:column;gap:6px}.pipeline-cards span,.detail-grid span{color:var(--text-muted);font-size:12px;text-transform:capitalize}.pipeline-cards strong,.detail-grid strong{font-size:22px}.dashboard-inline-link{border:0;background:transparent;font:inherit;cursor:pointer;padding:0;display:flex;align-items:center;gap:4px;font-size:12px;margin-top:15px}.growth-item{display:grid;grid-template-columns:1fr auto;grid-template-rows:auto auto}.growth-item span{grid-column:1}.growth-item.dashboard-section-button{width:100%;border:0;background:transparent;text-align:left;font:inherit;color:var(--text-primary);cursor:pointer}.subpage-title{margin-bottom:20px}.subpage-title h2{font-size:24px;margin:0 0 6px}.inline-empty{padding:25px 0;color:var(--text-muted);font-size:13px}.dashboard-error,.dashboard-notice{border-radius:9px;padding:11px 14px;margin-bottom:18px;font-size:13px;display:flex;gap:8px;align-items:center}.dashboard-error{background:var(--danger-bg);color:var(--danger)}.dashboard-notice{background:var(--success-bg);color:var(--success)}.credit-total{display:block;font-size:30px;color:var(--primary);margin-bottom:18px}.credit-forms{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.credit-forms form{display:flex;flex-direction:column;gap:10px}.credit-forms h3{font-size:14px;margin:0;color:var(--text-primary)}.credit-forms input,.credit-forms select,.profile-form select{border:1px solid var(--border);border-radius:8px;background:var(--bg);color:var(--text-primary);padding:11px;font:inherit}.offering-list{display:flex;flex-direction:column;gap:10px}.offering-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid var(--border-subtle)}.offering-row>div{display:flex;flex-direction:column;gap:4px}.offering-row span{font-size:12px;color:var(--text-muted)}.profile-image-preview{width:64px;height:64px;border-radius:50%;border:1px solid var(--border);background:var(--bg-muted) center/cover no-repeat;display:flex;align-items:center;justify-content:center;color:var(--text-muted)}.location-actions{display:flex;flex-direction:column;align-items:flex-start;gap:7px}.location-actions small{color:var(--text-muted)}.dashboard-secondary-action{border:1px solid var(--border);background:var(--bg-muted);color:var(--text-primary);border-radius:7px;padding:7px 10px;font:inherit;font-size:12px;cursor:pointer}.dashboard-secondary-action:disabled{opacity:.55;cursor:wait}.profile-form{display:flex;flex-direction:column;gap:16px;max-width:900px}.profile-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.form-error{color:var(--danger)}.form-success{color:var(--success)}.profile-form label{display:flex;flex-direction:column;gap:7px;color:var(--text-secondary);font-size:13px}.profile-form input,.profile-form textarea{border:1px solid var(--border);border-radius:8px;background:var(--bg);color:var(--text-primary);padding:11px;font:inherit}.profile-form small{color:var(--success)}.review-row{justify-content:flex-start}.review-row strong{color:var(--warning)}.review-row span{color:var(--text-secondary);font-size:13px}.dashboard-loading{padding:100px;text-align:center;color:var(--text-secondary);width:100%}
.credit-forms{grid-template-columns:1fr}@media(max-width:900px){.dashboard-sidebar{position:fixed;z-index:5;left:-260px;transition:left .2s}.dashboard-sidebar.open{left:0}.dashboard-close,.dashboard-mobile-menu{display:block}.dashboard-close{position:absolute;right:12px;top:12px;background:transparent;color:var(--text-secondary);border:0}.dashboard-mobile-menu{position:fixed;z-index:4;top:15px;left:15px;background:var(--primary-soft);color:var(--primary);border:1px solid var(--border);padding:8px;border-radius:8px}.dashboard-content{padding:70px 18px 28px}.dashboard-header{display:block}.dashboard-header-actions{margin-top:18px}.metric-grid{grid-template-columns:repeat(2,1fr)}.dashboard-grid{grid-template-columns:1fr}}
@media(max-width:560px){.profile-grid{grid-template-columns:1fr}.metric-grid,.pipeline-cards,.detail-grid{grid-template-columns:1fr 1fr}.dashboard-header h1{font-size:28px}.booking-row{align-items:flex-start;flex-wrap:wrap}.booking-actions{width:100%;margin-left:0}.custom-dates{width:100%}.custom-dates input{min-width:0;width:45%}}
@media(prefers-reduced-motion:reduce){.dashboard-sidebar{transition:none}}
`;
