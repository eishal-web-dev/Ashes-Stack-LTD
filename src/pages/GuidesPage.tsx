import { Link } from 'react-router-dom';
import AdSenseBootstrap from '../ads/AdSenseBootstrap';

const guides = [
  {
    slug: 'shared-ai-memory-chatgpt-claude-gemini',
    label: 'AI SECOND BRAIN',
    title: 'Shared AI memory: one brain for ChatGPT, Claude and Gemini',
    desc: 'Learn how a shared AI brain keeps project context, decisions and handoffs available across multiple AI assistants without repeating everything.',
  },
  {
    slug: 'share-memory-between-chatgpt-and-claude',
    label: 'SHARED AI MEMORY',
    title: 'How to share project memory between ChatGPT and Claude',
    desc: 'A practical explanation of why AI chats are isolated, how shared memory works, and how MCP can keep project context consistent across tools.',
  },
  {
    slug: 'what-is-mcp',
    label: 'MCP EXPLAINED',
    title: 'What is MCP? A simple guide to the Model Context Protocol',
    desc: 'Understand MCP without protocol jargon: clients, servers, tools, OAuth, and why it matters for AI apps.',
  },
  {
    slug: 'connect-claude-to-mcp-server',
    label: 'CLAUDE + MCP',
    title: 'How to connect Claude to a remote MCP server',
    desc: 'A clean setup walkthrough plus the security checks you should make before approving an MCP connector.',
  },
];

export default function GuidesPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#080808', color: '#f4f3ef', fontFamily: 'Inter,system-ui,sans-serif' }}>
      <AdSenseBootstrap />
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '72px 24px 100px' }}>
        <Link to="/" style={{ color: '#999', textDecoration: 'none', fontSize: 12 }}>← ASHES</Link>
        <p style={{ marginTop: 56, color: '#777', fontSize: 11, letterSpacing: '.16em' }}>ASHES GUIDES</p>
        <h1 style={{ fontSize: 'clamp(48px,8vw,88px)', lineHeight: .93, letterSpacing: '-.055em', margin: '14px 0 22px', maxWidth: 850 }}>Use AI without repeating yourself.</h1>
        <p style={{ maxWidth: 720, color: '#a6a39d', fontSize: 17, lineHeight: 1.75 }}>Original, practical guides about shared AI memory, MCP, connectors and working across ChatGPT, Claude and other AI tools. No filler, no copied docs.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 14, marginTop: 46 }}>
          {guides.map((guide) => (
            <Link key={guide.slug} to={`/guides/${guide.slug}`} style={{ textDecoration: 'none', color: 'inherit', border: '1px solid #242424', borderRadius: 18, padding: 24, background: '#0d0d0d', minHeight: 250, display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: '#777', fontSize: 10, letterSpacing: '.15em' }}>{guide.label}</span>
              <h2 style={{ fontSize: 25, lineHeight: 1.1, letterSpacing: '-.03em', margin: '18px 0 14px' }}>{guide.title}</h2>
              <p style={{ color: '#96938d', fontSize: 13, lineHeight: 1.7, margin: 0 }}>{guide.desc}</p>
              <span style={{ marginTop: 'auto', paddingTop: 28, fontWeight: 800, fontSize: 12 }}>READ GUIDE ↗</span>
            </Link>
          ))}
        </div>

        <div style={{ marginTop: 52, borderTop: '1px solid #222', paddingTop: 24, display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13 }}>
          <Link to="/workspace" style={{ color: '#fff' }}>Try Ashes Brain</Link>
          <Link to="/brain/docs" style={{ color: '#fff' }}>Connector docs</Link>
          <Link to="/privacy" style={{ color: '#fff' }}>Privacy</Link>
        </div>
      </section>
    </main>
  );
}
