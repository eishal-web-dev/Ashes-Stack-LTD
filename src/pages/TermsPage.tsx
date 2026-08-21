import { Link } from 'react-router-dom';

export default function TermsPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#080808', color: '#f3f3ef', padding: '72px 24px', fontFamily: 'Inter,system-ui,sans-serif' }}>
      <article style={{ maxWidth: 780, margin: '0 auto' }}>
        <Link to="/" style={{ color: '#aaa', textDecoration: 'none', fontSize: 12 }}>← ASHES</Link>
        <p style={{ marginTop: 54, color: '#777', fontSize: 11, letterSpacing: '.16em' }}>TERMS OF USE · UPDATED AUGUST 21, 2026</p>
        <h1 style={{ fontSize: 'clamp(42px,8vw,76px)', lineHeight: .95, letterSpacing: '-.05em', margin: '14px 0 28px' }}>Use Ashes like a shared brain, not a vault.</h1>
        <p style={{ color: '#aaa', lineHeight: 1.75 }}>These terms apply to Ashes Brain and related Ashes Stack services. By creating an account or connecting an AI client, you agree to use the service responsibly and only with data you are permitted to store and share.</p>

        <h2>What Ashes Brain does</h2>
        <p>Ashes Brain stores project context and exposes authorized tools that supported AI clients can use to retrieve project information and, where allowed, save memories, decisions and handoffs. Availability and behavior of third-party AI clients can change independently of Ashes.</p>

        <h2>Your account and content</h2>
        <p>You are responsible for maintaining the confidentiality of your Brain credentials and for the content you save. Do not upload passwords, authentication secrets, unlawful content or information you do not have the right to use. You retain responsibility for deciding what information is appropriate to send to connected AI providers.</p>

        <h2>AI-generated output</h2>
        <p>Ashes coordinates context; it does not guarantee the accuracy of responses produced by third-party AI models. Review important outputs before relying on them for legal, financial, medical, security or other high-impact decisions.</p>

        <h2>Public project links</h2>
        <p>Projects are private by default. If you choose Share brain, Ashes creates a public link. Anyone with that link may view the shared project data while sharing remains enabled. You are responsible for who receives the link.</p>

        <h2>Acceptable use</h2>
        <p>Do not use Ashes to break laws, bypass provider access controls, interfere with the service, distribute malware, scrape credentials, impersonate others or access another person's Brain without permission.</p>

        <h2>Service changes</h2>
        <p>Ashes Brain is an evolving product. Features, supported AI providers, limits and integrations may change. We may suspend abusive activity or make changes needed for security, reliability or compliance.</p>

        <h2>Availability and warranties</h2>
        <p>The service is provided on an as-available basis. We work to keep it reliable, but we do not promise uninterrupted availability or that every third-party connector will remain compatible at all times.</p>

        <h2>Contact</h2>
        <p>Questions about these terms can be sent to <a href="mailto:hello@ashes.studio" style={{ color: '#fff' }}>hello@ashes.studio</a>.</p>

        <div style={{ borderTop: '1px solid #222', marginTop: 48, paddingTop: 22, display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          <Link to="/privacy" style={{ color: '#fff' }}>Privacy</Link><Link to="/workspace" style={{ color: '#fff' }}>Ashes Brain</Link><Link to="/" style={{ color: '#fff' }}>Home</Link>
        </div>
      </article>
    </main>
  );
}
