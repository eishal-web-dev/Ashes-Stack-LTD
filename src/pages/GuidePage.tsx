import { Link, useParams } from 'react-router-dom';
import AdSenseBootstrap from '../ads/AdSenseBootstrap';

const articles: Record<string, { eyebrow: string; title: string; intro: string; sections: { title: string; body: string[] }[] }> = {
  'share-memory-between-chatgpt-and-claude': {
    eyebrow: 'SHARED AI MEMORY',
    title: 'How to share project memory between ChatGPT and Claude',
    intro: 'ChatGPT and Claude normally do not share a private memory store. If you explain a project in one chat, the other AI will not automatically know it. A shared-memory service solves that by putting durable project context in one place that both AI clients can access with your permission.',
    sections: [
      { title: 'Why the two AIs forget each other', body: [
        'Each provider runs its own product, account system and conversation storage. A ChatGPT conversation is not automatically available to Claude, and a Claude conversation is not automatically available to ChatGPT. That separation is intentional for privacy and security.',
        'Copying and pasting summaries works, but it becomes painful on long projects. The better pattern is to store decisions, goals, handoffs and durable facts in a neutral project brain instead of treating one chat window as the only source of truth.'
      ]},
      { title: 'The shared-brain pattern', body: [
        'A shared brain has three pieces: a project store, an authorization layer, and tools an AI can call. The project store holds only the context you want to keep. Authorization ensures an AI client only sees the account you approved. Tools let the AI read project context, search memory, save a decision or leave a handoff for the next AI.',
        'This means the workflow becomes: open ChatGPT, work normally, save an important decision to the shared brain, then open Claude and ask it to read the same project context. Claude does not need ChatGPT credentials or browser cookies; it only needs access to the shared project brain you authorized.'
      ]},
      { title: 'What should be stored', body: [
        'Good shared memory is compact and durable. Store project goals, technical decisions, customer requirements, naming conventions, unresolved blockers, important links and a concise handoff after major work. Avoid dumping every sentence of every conversation unless you actually need it.',
        'The rule is simple: if another AI would need this fact tomorrow to continue correctly, it is probably worth saving.'
      ]},
      { title: 'How Ashes Brain does it', body: [
        'Ashes Brain exposes a remote MCP endpoint with OAuth. Supported AI clients can list projects, get project context, search memory, fetch a result, remember a durable fact and save a handoff. Projects remain tied to the user who approved the connection.',
        'Ashes does not require your ChatGPT or Claude passwords. The AI provider shows its own permission flow, while Ashes controls access to the shared Brain account.'
      ]},
    ],
  },
  'what-is-mcp': {
    eyebrow: 'MCP EXPLAINED',
    title: 'What is MCP? A simple guide to the Model Context Protocol',
    intro: 'MCP is a standard way for an AI client to discover and use tools or data exposed by another service. Think of it as a common plug shape for AI integrations: the AI client connects to an MCP server, sees what tools are available, and calls them when useful.',
    sections: [
      { title: 'Client, server and tools', body: [
        'The MCP client is the AI application. The MCP server is the service exposing capabilities. The tools are the actions the server allows, such as search documents, list projects, read a record, create a task or save a memory.',
        'Instead of every AI provider inventing a completely different integration format, MCP gives developers a shared protocol for describing tools and passing structured inputs and outputs.'
      ]},
      { title: 'Why MCP matters', body: [
        'Without a shared protocol, a product might need a separate custom integration for every AI client. With MCP, one well-designed server can potentially work across multiple compatible clients.',
        'That is especially useful for company data and shared memory. The data stays in the original service, while the AI requests only the specific information or action it needs.'
      ]},
      { title: 'Authentication still matters', body: [
        'MCP does not mean an AI should receive unlimited access. A production server still needs authentication, authorization and clear tool boundaries. OAuth is useful because the user can approve a client without giving the client the user\'s password.',
        'Good MCP servers also separate read-only tools from write tools, validate every input, scope data by user, and avoid exposing secrets in tool results.'
      ]},
      { title: 'A shared-memory example', body: [
        'Imagine an MCP server with list_projects, get_project_context, search, remember and handoff. ChatGPT can read the project before helping. After making a durable decision it can call remember. Claude can later read the same project and continue from that state.',
        'That is the core idea behind Ashes Brain: one neutral project memory that compatible AI clients can use instead of forcing you to re-explain the project in every new tool.'
      ]},
    ],
  },
  'connect-claude-to-mcp-server': {
    eyebrow: 'CLAUDE + MCP',
    title: 'How to connect Claude to a remote MCP server',
    intro: 'Claude supports remote MCP connectors on supported surfaces. The exact menu can change over time, but the important parts are always the same: add the remote server URL, review the permissions, complete authentication if required, and then verify the tools before trusting the connection with important data.',
    sections: [
      { title: 'Before you connect', body: [
        'Only connect to an MCP server you trust. Check that the URL uses HTTPS, the service has a privacy policy, and the authorization page clearly explains what the AI client will be able to read or change.',
        'For Ashes Brain, the public MCP endpoint is https://www.ashesstack.cloud/mcp. The Brain login is separate from the Ashes Stack client, team and admin portal.'
      ]},
      { title: 'Typical setup flow', body: [
        'Open Claude\'s connector settings and choose the option for adding a custom or remote connector. Give it a recognizable name, paste the MCP server URL, and continue. If the server uses OAuth, Claude should redirect you to the service to sign in and approve access.',
        'After authorization, return to Claude and confirm that the connector is enabled. Start with a harmless read operation such as listing projects before allowing the connector to save or modify anything.'
      ]},
      { title: 'A useful first test', body: [
        'For a shared-memory server, ask Claude to list the available projects, then ask it to summarize one project\'s current goal and recent decisions. If that is correct, save a small test memory and confirm that it appears in the source service.',
        'This tests the whole chain: Claude to OAuth, OAuth to the MCP server, the server to the database, and the tool result back to Claude.'
      ]},
      { title: 'Security checks', body: [
        'A remote connector should never ask you to paste your Claude password into the third-party service. The service should authenticate its own account, not impersonate Claude. You should also be able to revoke or disable access later.',
        'For sensitive workflows, keep the server tools narrow and review what write actions are available. Shared memory usually needs far fewer permissions than a full account-management integration.'
      ]},
    ],
  },
};

export default function GuidePage() {
  const { slug = '' } = useParams();
  const article = articles[slug];

  if (!article) {
    return <main style={{ minHeight: '100vh', background: '#080808', color: '#fff', padding: 72, fontFamily: 'Inter,system-ui,sans-serif' }}><h1>Guide not found.</h1><Link to="/guides" style={{ color: '#fff' }}>Back to guides</Link></main>;
  }

  return (
    <main style={{ minHeight: '100vh', background: '#080808', color: '#f3f3ef', fontFamily: 'Inter,system-ui,sans-serif' }}>
      <AdSenseBootstrap />
      <article style={{ maxWidth: 820, margin: '0 auto', padding: '72px 24px 110px' }}>
        <Link to="/guides" style={{ color: '#999', textDecoration: 'none', fontSize: 12 }}>← ASHES GUIDES</Link>
        <p style={{ marginTop: 54, color: '#777', fontSize: 11, letterSpacing: '.16em' }}>{article.eyebrow}</p>
        <h1 style={{ fontSize: 'clamp(42px,7vw,72px)', lineHeight: .98, letterSpacing: '-.05em', margin: '14px 0 26px' }}>{article.title}</h1>
        <p style={{ color: '#aaa69f', lineHeight: 1.8, fontSize: 18 }}>{article.intro}</p>

        {article.sections.map((section) => (
          <section key={section.title} style={{ marginTop: 48 }}>
            <h2 style={{ fontSize: 28, letterSpacing: '-.025em', marginBottom: 14 }}>{section.title}</h2>
            {section.body.map((p) => <p key={p} style={{ color: '#a6a39d', lineHeight: 1.85, fontSize: 16 }}>{p}</p>)}
          </section>
        ))}

        <aside style={{ marginTop: 56, padding: 24, border: '1px solid #242424', borderRadius: 16, background: '#0d0d0d' }}>
          <span style={{ color: '#777', fontSize: 10, letterSpacing: '.15em' }}>ASHES BRAIN</span>
          <h2 style={{ fontSize: 28, margin: '12px 0 8px' }}>Tell one. All of them know.</h2>
          <p style={{ color: '#999', lineHeight: 1.7 }}>Keep project context in one shared brain and connect supported AI clients through MCP.</p>
          <Link to="/workspace" style={{ color: '#fff', fontWeight: 800 }}>TRY ASHES BRAIN ↗</Link>
        </aside>

        <div style={{ marginTop: 48, borderTop: '1px solid #222', paddingTop: 22, display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          <Link to="/guides" style={{ color: '#fff' }}>More guides</Link>
          <Link to="/privacy" style={{ color: '#fff' }}>Privacy</Link>
          <Link to="/terms" style={{ color: '#fff' }}>Terms</Link>
        </div>
      </article>
    </main>
  );
}
