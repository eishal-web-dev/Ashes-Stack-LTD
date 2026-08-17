import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import MarketingNav from "../components/MarketingNav";

const STEPS = [
  {
    n: "01",
    title: "Free demo, no obligation",
    body: "We put together a concept first. You review it — if it's not a fit, you owe nothing.",
  },
  {
    n: "02",
    title: "Approve & we get to work",
    body: "Approve the demo in writing (portal, WhatsApp or email) and the project fee is confirmed before production starts.",
  },
  {
    n: "03",
    title: "Everything lands in your portal",
    body: "Contracts, invoices, reports and final files show up in your Client Portal — no digging through email threads.",
  },
];

const DOCS = [
  { tag: "Onboarding", title: "Welcome Packet", body: "What to expect and who to contact once your project kicks off." },
  { tag: "Agreement", title: "Contract", body: "Scope, fee and terms, laid out clearly and stored for reference." },
  { tag: "Billing", title: "Invoice", body: "Itemized, with a clear total and payment instructions." },
  { tag: "Action needed", title: "Access Request", body: "A clear checklist when we need assets, logins or info from you." },
  { tag: "Progress", title: "Monthly Report", body: "What shipped this month and what's coming next." },
  { tag: "Handover", title: "Fulfillment Doc", body: "Confirms exactly what was delivered when your project wraps." },
];

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((user) => {
        if (user) {
          router.replace(user.role === "admin" ? "/admin" : "/portal");
        } else {
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
  }, [router]);

  if (checking) return null;

  return (
    <>
      <MarketingNav />

      <div className="hero">
        <div className="eyebrow">ASHES STACK · CLIENT PORTAL</div>
        <h1>Every approval, invoice, and file — in one place.</h1>
        <p className="lead">
          No more digging through WhatsApp for the contract or asking "did you get the invoice?" Sign in
          to see exactly where your project stands.
        </p>
        <div className="hero-actions">
          <Link href="/login" className="btn orange">Sign in</Link>
          <Link href="/signup" className="btn outline" style={{ background: "transparent", color: "#fff", borderColor: "#444" }}>
            Create account
          </Link>
        </div>
      </div>

      <div className="section" id="process">
        <div className="section-head">
          <div className="eyebrow">HOW IT WORKS</div>
          <h2>A simple, transparent process</h2>
          <p>From free demo to final handover, every step is on the record.</p>
        </div>
        <div className="steps">
          {STEPS.map((s) => (
            <div className="step-card" key={s.n}>
              <div className="step-num">{s.n}</div>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="section" id="documents">
        <div className="section-head">
          <div className="eyebrow">WHAT YOU GET</div>
          <h2>Everything shows up in your portal</h2>
          <p>Every document we send is generated, tracked, and ready to download the moment it's sent.</p>
        </div>
        <div className="doc-grid">
          {DOCS.map((d) => (
            <div className="doc-card" key={d.title}>
              <div className="tag">{d.tag}</div>
              <h4>{d.title}</h4>
              <p>{d.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="section" id="faq">
        <div className="section-head">
          <div className="eyebrow">FAQ</div>
          <h2>A couple of things worth knowing</h2>
        </div>
        <div className="doc-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="doc-card">
            <h4>Do I pay for the demo?</h4>
            <p>No. The initial demo/concept is free — you only owe a fee once you approve it in writing and ask us to proceed.</p>
          </div>
          <div className="doc-card">
            <h4>How do I join a call?</h4>
            <p>Add your Gmail in your portal profile once you're signed in, and we'll send Google Meet invites there.</p>
          </div>
        </div>
      </div>

      <div className="cta-band">
        <h2>Ready to see your project's status?</h2>
        <p>Sign in to your Client Portal — or create an account if this is your first time here.</p>
        <Link href="/login" className="btn">Sign in</Link>
      </div>

      <div className="site-footer">
        <div className="brand">ASH<span>ES</span> STACK</div>
        <div>Software House · Confidential client documents</div>
      </div>
    </>
  );
}
