import Link from "next/link";

export default function MarketingNav() {
  return (
    <div className="marketing-nav">
      <div className="brand">ASH<span>ES</span></div>
      <div className="nav-links">
        <a href="#process">Process</a>
        <a href="#documents">What you get</a>
        <a href="#faq">FAQ</a>
      </div>
      <div className="nav-actions">
        <Link href="/signup" className="ghost">Create account</Link>
        <Link href="/login" className="btn orange small">Sign in</Link>
      </div>
    </div>
  );
}
