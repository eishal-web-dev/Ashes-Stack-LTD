import { Link } from 'react-router-dom';

const tools = [
  ['list_projects', 'Lists the authenticated user’s Ashes Brain projects.'],
  ['get_project_context', 'Returns a project goal plus recent decisions, memories, conversations and handoffs.'],
  ['search', 'Searches private Ashes project memory for relevant saved context.'],
  ['fetch', 'Retrieves a project or memory item returned by Ashes search.'],
  ['remember', 'Saves durable project context, decisions or conversation memory.'],
  ['handoff', 'Saves a concise state handoff for the next AI working on the project.'],
];

export default function BrainDocsPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#080808', color: '#f3f3ef', padding: '72px 24px', fontFamily: 'Inter,system-ui,sans-serif' }}>
      <article style={{ maxWidth: 860, margin: '0 auto' }}>
        <Link to="/" style={{ color: '#aaa', textDecoration: 'none', fontSize: 12 }}>← ASHES</Link>
        <p style={{ marginTop: 54, color: '#777', fontSize: 11, letterSpacing: '.16em' }}>ASHES BRAIN · CONNECTOR DOCUMENTATION</p>
        <h1 style={{ fontSize: 'clamp(42px,8vw,76px)', lineHeight: .95, letterSpacing: '-.05em', margin: '14px 0 24px' }}>One project memory for every AI.</h1>
        <p style={{ color: '#aaa', lineHeight: 1.75, maxWidth: 720 }}>Ashes Brain is a remote MCP service for keeping project context consistent across supported AI clients. Users create a Brain account, create projects, authorize an AI client through OAuth, then let that client read or update the same shared project memory.</p>

        <h2>Server</h2>
        <div style={{ border: '1px solid #222', background: '#0d0d0d', borderRadius: 14, padding: 18, overflowWrap: 'anywhere' }}><code>https://www.ashesstack.cloud/mcp</code></div>
        <p>Transport: streamable HTTP / JSON-RPC over HTTPS. Authentication: OAuth 2.0 authorization code with PKCE and dynamic client registration. Ashes issues Brain-scoped access and refresh tokens.</p>

        <h2>Connect from Claude</h2>
        <ol>
          <li>Open Claude and go to Settings → Connectors.</li>
          <li>Add a custom connector.</li>
          <li>Use <code>https://www.ashesstack.cloud/mcp</code>.</li>
          <li>Claude opens the Ashes Brain authorization flow.</li>
          <li>Sign in to an Ashes Brain account and approve the connection.</li>
          <li>Ask Claude to list Ashes projects or continue a specific Ashes project.</li>
        </ol>

        <h2>Tools</h2>
        <div style={{ display: 'grid', gap: 10 }}>
          {tools.map(([name, description]) => <div key={name} style={{ border: '1px solid #222', borderRadius: 12, padding: 16 }}><code>{name}</code><p style={{ marginBottom: 0, color: '#aaa' }}>{description}</p></div>)}
        </div>

        <h2>Data access</h2>
        <p>Read tools access only projects owned by the authenticated Ashes Brain account. Write tools add private memory items to those projects. Ashes does not request provider passwords, browser cookies, provider API keys or one-time authentication codes.</p>

        <h2>Project sharing</h2>
        <p>Projects are private by default. Owners can explicitly press Share brain to generate a public, hard-to-guess link. Public sharing is separate from MCP authorization and does not grant write access.</p>

        <h2>Testing prompts</h2>
        <ul>
          <li>“List my Ashes projects.”</li>
          <li>“Continue my latest Ashes project and summarize what we already decided.”</li>
          <li>“Remember that the mobile launch should happen after the web beta.”</li>
          <li>“Save a handoff for the next AI with what we completed and the next step.”</li>
        </ul>

        <h2>Support & policies</h2>
        <p>Support: <a href="mailto:hello@ashes.studio" style={{ color: '#fff' }}>hello@ashes.studio</a></p>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}><Link to="/privacy" style={{ color: '#fff' }}>Privacy policy</Link><Link to="/terms" style={{ color: '#fff' }}>Terms</Link><Link to="/workspace" style={{ color: '#fff' }}>Open Ashes Brain</Link></div>
      </article>
    </main>
  );
}
