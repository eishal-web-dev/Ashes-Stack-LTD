import { Link } from 'react-router-dom';

export default function PrivacyPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#080808', color: '#f3f3ef', padding: '72px 24px', fontFamily: 'Inter,system-ui,sans-serif' }}>
      <article style={{ maxWidth: 780, margin: '0 auto' }}>
        <Link to="/" style={{ color: '#aaa', textDecoration: 'none', fontSize: 12 }}>← ASHES</Link>
        <p style={{ marginTop: 54, color: '#777', fontSize: 11, letterSpacing: '.16em' }}>PRIVACY POLICY · UPDATED AUGUST 21, 2026</p>
        <h1 style={{ fontSize: 'clamp(42px,8vw,76px)', lineHeight: .95, letterSpacing: '-.05em', margin: '14px 0 28px' }}>Your Brain stays yours.</h1>
        <p style={{ color: '#aaa', lineHeight: 1.75 }}>Ashes Brain is a shared project-memory service that lets supported AI clients read and update project context you choose to store in Ashes. This policy explains the data used by Ashes Brain and the Ashes Stack website.</p>

        <h2>What we store</h2>
        <p>For Ashes Brain accounts we store account details such as name, email and a securely hashed password, plus the projects, goals, memories, decisions, conversations and handoffs you save to your Brain. When you explicitly create a public project share link, the shared project content is viewable by anyone who has that link until sharing is disabled.</p>

        <h2>AI connections</h2>
        <p>When you authorize an AI client through Ashes MCP, that client receives permission to use the Ashes Brain tools available to it. Ashes does not ask for or store your ChatGPT, Claude, Gemini or Codex passwords, browser cookies or provider session tokens. OAuth access tokens issued by Ashes identify the authorized Brain account and are scoped to Ashes Brain.</p>

        <h2>How data is used</h2>
        <p>We use your data to provide account access, synchronize project context, return relevant project memory to authorized AI clients, save memories and handoffs you request, operate project sharing, prevent abuse and troubleshoot the service. We do not sell personal data to advertisers.</p>

        <h2>Public sharing</h2>
        <p>Projects are private by default. A project only becomes accessible through a public share URL after the Brain owner presses Share brain. Treat a share URL like any other private link and only share it with people you intend to give access to that snapshot.</p>

        <h2>Security and retention</h2>
        <p>Authentication cookies are HTTP-only and secure in production. Passwords are stored as hashes rather than plaintext. We retain account and Brain data while the service needs it to provide the product, subject to deletion and retention features as they are added. No internet service can guarantee absolute security, so avoid placing secrets, passwords or highly sensitive personal information in project memory.</p>

        <h2>Your choices</h2>
        <p>You control what is saved to your Brain and when a project is shared. You can remove individual memories and delete projects from Work OS. For account or privacy requests, contact <a href="mailto:hello@ashes.studio" style={{ color: '#fff' }}>hello@ashes.studio</a>.</p>

        <h2>Changes</h2>
        <p>We may update this policy as Ashes Brain gains new integrations or features. The updated date at the top of this page will change when the policy changes materially.</p>

        <div style={{ borderTop: '1px solid #222', marginTop: 48, paddingTop: 22, display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          <Link to="/terms" style={{ color: '#fff' }}>Terms</Link><Link to="/workspace" style={{ color: '#fff' }}>Ashes Brain</Link><Link to="/" style={{ color: '#fff' }}>Home</Link>
        </div>
      </article>
    </main>
  );
}
