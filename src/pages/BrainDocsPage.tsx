import { Link } from 'react-router-dom';

const tools = [
  ['list_projects', 'Lists the authenticated user’s Ashes Brain projects.'],
  ['get_project_context', 'Returns a project goal plus recent decisions, memories and handoffs.'],
  ['search', 'Searches private project memory for relevant saved context.'],
  ['fetch', 'Retrieves a project or memory item returned by search.'],
  ['remember', 'Saves durable project context or a decision.'],
  ['handoff', 'Saves a concise state handoff for the next AI.']
];

const connectionGuides = [
  { path: '/brain/docs/connect-codex', label: 'OPENAI CODEX', title: 'Connect Codex to Ashes Brain', text: 'Use Codex CLI or the IDE extension with the Ashes remote MCP server.' },
  { path: '/brain/docs/connect-chatgpt', label: 'CHATGPT', title: 'Connect ChatGPT to Ashes Brain', text: 'Add Ashes Brain as a hosted MCP connection and authorize your project memory.' },
  { path: '/brain/docs/connect-claude', label: 'CLAUDE', title: 'Connect Claude to Ashes Brain', text: 'Add the remote connector, approve OAuth and test your first project.' },
  { path: '/brain/docs/shared-memory', label: 'ALL AI TOOLS', title: 'One shared memory for ChatGPT, Claude and Codex', text: 'Use goals, durable decisions and handoffs so every approved AI continues the same project.' }
];

export default function BrainDocsPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#080808', color: '#f3f3ef', padding: '72px 24px', fontFamily: 'Inter,system-ui,sans-serif' }}>
      <article style={{ maxWidth: 960, margin: '0 auto' }}>
        <Link to="/" style={{ color: '#aaa', textDecoration: 'none', fontSize: 12 }}>← ASHES</Link>
        <p style={{ marginTop: 54, color: '#777', fontSize: 11, letterSpacing: '.16em' }}>ASHES BRAIN · CONNECTION DOCUMENTATION</p>
        <h1 style={{ fontSize: 'clamp(42px,8vw,76px)', lineHeight: .95, letterSpacing: '-.05em', margin: '14px 0 24px' }}>Connect every AI to one project brain.</h1>
        <p style={{ color: '#aaa', lineHeight: 1.75, maxWidth: 760, fontSize: 17 }}>Step-by-step guides for connecting Codex, ChatGPT and Claude to Ashes Brain with MCP. Save project goals, decisions and handoffs once, then let each approved AI continue without making you explain everything again.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 14, marginTop: 44 }}>
          {connectionGuides.map(guide => <Link key={guide.path} to={guide.path} style={{ textDecoration: 'none', color: 'inherit', border: '1px solid #242424', borderRadius: 16, padding: 22, background: '#0d0d0d', minHeight: 210, display: 'flex', flexDirection: 'column' }}><span style={{ color: '#777', fontSize: 10, letterSpacing: '.15em' }}>{guide.label}</span><h2 style={{ fontSize: 25, lineHeight: 1.1, letterSpacing: '-.03em', margin: '16px 0 12px' }}>{guide.title}</h2><p style={{ color: '#999', lineHeight: 1.7, fontSize: 14 }}>{guide.text}</p><b style={{ marginTop: 'auto', fontSize: 12 }}>OPEN GUIDE ↗</b></Link>)}
        </div>

        <h2 style={{ marginTop: 54 }}>Ashes Brain MCP server</h2>
        <div style={{ border: '1px solid #222', background: '#0d0d0d', borderRadius: 14, padding: 18, overflowWrap: 'anywhere' }}><code>https://www.ashesstack.cloud/mcp</code></div>
        <p style={{ color: '#aaa', lineHeight: 1.75 }}>Remote Streamable HTTP / JSON-RPC over HTTPS. Authentication uses OAuth 2.0 authorization code with PKCE and dynamic client registration. Access is scoped to the authenticated Brain account.</p>

        <h2 style={{ marginTop: 46 }}>Available memory tools</h2>
        <div style={{ display: 'grid', gap: 10 }}>
          {tools.map(([name, description]) => <div key={name} style={{ border: '1px solid #222', borderRadius: 12, padding: 16 }}><code>{name}</code><p style={{ marginBottom: 0, color: '#aaa' }}>{description}</p></div>)}
        </div>

        <h2 style={{ marginTop: 46 }}>Privacy and access</h2>
        <p style={{ color: '#aaa', lineHeight: 1.75 }}>Ashes does not request provider passwords, browser cookies, provider API keys or one-time authentication codes. Projects are private by default. Public project links are separate from MCP authorization and do not grant write access.</p>

        <div style={{ marginTop: 42, display: 'flex', gap: 18, flexWrap: 'wrap' }}><Link to="/workspace" style={{ color: '#fff' }}>Open Ashes Brain</Link><Link to="/guides" style={{ color: '#fff' }}>SEO guides</Link><Link to="/privacy" style={{ color: '#fff' }}>Privacy</Link><Link to="/terms" style={{ color: '#fff' }}>Terms</Link></div>
      </article>
    </main>
  );
}