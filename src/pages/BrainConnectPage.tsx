import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';

type Doc = {
  label: string;
  title: string;
  description: string;
  keywords: string;
  intro: string;
  steps: string[];
  verify: string[];
  troubleshoot: { title: string; body: string }[];
  faq: { question: string; answer: string }[];
  official?: string;
};

const endpoint = 'https://www.ashesstack.cloud/mcp';

const docs: Record<string, Doc> = {
  'connect-codex': {
    label: 'CODEX + ASHES BRAIN',
    title: 'How to connect Codex to Ashes Brain shared memory',
    description: 'Connect OpenAI Codex CLI or the Codex IDE extension to Ashes Brain with MCP so coding projects keep shared goals, decisions, context and handoffs.',
    keywords: 'connect Codex to MCP, Codex shared memory, Codex MCP server, Codex AI memory, connect Codex to Ashes Brain, Codex project context, Codex Claude shared memory',
    intro: 'Connect Codex to Ashes Brain once, then let it read the same project goals, decisions and handoffs used by your other approved AI tools. Ashes Brain uses a remote Streamable HTTP MCP endpoint with OAuth, so you do not paste an OpenAI password, API key or browser cookie into Ashes.',
    steps: [
      'Create or sign in to your Ashes Brain account and create at least one project.',
      'Open a terminal and run: codex mcp add ashes-brain --url https://www.ashesstack.cloud/mcp',
      'Start authentication with: codex mcp login ashes-brain',
      'Complete the Ashes Brain sign-in and approval page opened by Codex.',
      'Run codex mcp list and confirm ashes-brain is enabled.',
      'Open Codex and ask: List my Ashes projects.'
    ],
    verify: [
      'List my Ashes projects.',
      'Read the current goal and recent decisions from my Ashes project.',
      'Remember that the next release must be tested on mobile.',
      'Save a handoff describing what we completed and what the next AI should do.'
    ],
    troubleshoot: [
      { title: 'Codex says the server is not authenticated', body: 'Run codex mcp login ashes-brain again and complete the Ashes authorization flow in the browser.' },
      { title: 'The server does not appear', body: 'Run codex mcp list. You can also inspect ~/.codex/config.toml and confirm the ashes-brain server URL exactly matches the endpoint above.' },
      { title: 'No projects are returned', body: 'Sign in to the same Ashes Brain account used during OAuth and create a project before testing the connection.' }
    ],
    faq: [
      { question: 'Does Codex share its complete chat history with Ashes?', answer: 'No. Codex uses the specific Ashes Brain tools you approve. Save durable project facts and handoffs intentionally.' },
      { question: 'Do Codex CLI and the IDE extension share MCP setup?', answer: 'OpenAI documents that the Codex CLI and IDE extension share MCP configuration for the same Codex host.' },
      { question: 'Can Claude read a decision saved by Codex?', answer: 'Yes, when both clients are connected to the same Ashes account and project, Claude can read the durable context Codex saved there.' }
    ],
    official: 'https://developers.openai.com/codex/mcp'
  },
  'connect-chatgpt': {
    label: 'CHATGPT + ASHES BRAIN',
    title: 'How to connect ChatGPT to Ashes Brain with MCP',
    description: 'Connect ChatGPT to Ashes Brain through a remote MCP connection so ChatGPT can use shared project memory, decisions and AI handoffs.',
    keywords: 'connect ChatGPT to MCP, ChatGPT shared memory, ChatGPT MCP server, connect ChatGPT to Ashes Brain, ChatGPT Claude shared context, ChatGPT external memory',
    intro: 'Ashes Brain gives ChatGPT access to project memory that can also be used by Codex and Claude. The connection exposes narrow project tools through MCP and authenticates against your Ashes Brain account.',
    steps: [
      'Create an Ashes Brain account and at least one project.',
      'In ChatGPT, open Settings, then Security and login, and enable Developer mode when it is available for your account or workspace.',
      'Open ChatGPT Plugins and select the plus button to add an MCP connection.',
      'Name it Ashes Brain and enter: https://www.ashesstack.cloud/mcp',
      'Create the connection, review the discovered tools and complete the Ashes Brain authorization flow.',
      'Start a new chat with the Ashes Brain connection enabled and ask: List my Ashes projects.'
    ],
    verify: [
      'List my Ashes projects.',
      'Summarize the goal and latest handoff in my project.',
      'Remember this decision in my Ashes project.',
      'Prepare a handoff so Claude or Codex can continue this work.'
    ],
    troubleshoot: [
      { title: 'Developer mode is not visible', body: 'Availability can depend on the ChatGPT account and workspace policy. ChatGPT desktop can also configure supported MCP servers from Settings → MCP servers.' },
      { title: 'ChatGPT cannot discover tools', body: 'Confirm the full HTTPS endpoint includes /mcp, then refresh the connection metadata and start a new chat.' },
      { title: 'Authorization opens the wrong account', body: 'Sign out of the incorrect Ashes account, reconnect and approve access using the account that owns the intended projects.' }
    ],
    faq: [
      { question: 'Does Ashes need my ChatGPT password?', answer: 'No. Ashes authenticates its own Brain account and does not request your ChatGPT password, provider API key or browser cookie.' },
      { question: 'Can ChatGPT web read my local Codex configuration?', answer: 'No. OpenAI documents that ChatGPT web does not read local Codex configuration files; add the hosted MCP connection through ChatGPT Plugins.' },
      { question: 'Can I disconnect later?', answer: 'Yes. Disable or remove the connection in ChatGPT and revoke access from the relevant account controls when available.' }
    ],
    official: 'https://developers.openai.com/plugins/deploy/connect-chatgpt'
  },
  'connect-claude': {
    label: 'CLAUDE + ASHES BRAIN',
    title: 'How to connect Claude to Ashes Brain shared memory',
    description: 'Connect Claude to Ashes Brain using its remote MCP URL and keep project context shared with ChatGPT, Codex and other approved AI clients.',
    keywords: 'connect Claude to MCP server, Claude shared memory, Claude MCP connector, connect Claude to Ashes Brain, Claude ChatGPT shared memory, Claude project context',
    intro: 'Claude and ChatGPT normally keep separate conversation histories. Connecting Claude to Ashes Brain gives it an approved external project memory containing goals, decisions, requirements and handoffs saved by you or another connected AI.',
    steps: [
      'Create or sign in to Ashes Brain and create a project.',
      'Open Claude and go to Settings → Connectors.',
      'Choose the option to add a custom or remote connector.',
      'Name the connector Ashes Brain and enter: https://www.ashesstack.cloud/mcp',
      'Continue to the Ashes authorization page, sign in and approve access.',
      'Return to Claude, enable the connector and ask: List my Ashes projects.'
    ],
    verify: [
      'List my Ashes projects.',
      'Continue my latest project using its current goal and handoff.',
      'Remember this decision in the project.',
      'Create a handoff for ChatGPT or Codex.'
    ],
    troubleshoot: [
      { title: 'The connector option is missing', body: 'Claude connector availability and menu names can vary by plan and surface. Check the current connector settings for custom or remote MCP support.' },
      { title: 'Claude connects but returns no project', body: 'Verify that the authenticated Ashes account owns a project and that you approved the correct account.' },
      { title: 'Claude does not use the connector', body: 'Enable Ashes Brain for the conversation and ask a direct first test such as List my Ashes projects.' }
    ],
    faq: [
      { question: 'Can Claude automatically read my ChatGPT chats?', answer: 'No. It can only read project context intentionally stored in the shared Ashes Brain project.' },
      { question: 'Does public project sharing give Claude write access?', answer: 'No. Public share links are separate from MCP authorization and do not silently grant write permission.' },
      { question: 'Which Ashes tools can Claude use?', answer: 'The current Brain tools cover listing projects, reading context, searching and fetching memory, remembering durable facts and saving handoffs.' }
    ]
  },
  'shared-memory': {
    label: 'ONE BRAIN · MULTIPLE AI TOOLS',
    title: 'Connect ChatGPT, Claude and Codex to one shared AI memory',
    description: 'Use Ashes Brain as one shared project memory for ChatGPT, Claude and Codex so every approved AI can continue from the same goals, decisions and handoffs.',
    keywords: 'connect ChatGPT Claude Codex, shared memory between AI tools, one memory for ChatGPT and Claude, shared AI project context, AI second brain MCP, stop repeating context to AI',
    intro: 'ChatGPT, Claude and Codex do not automatically share private conversations. Ashes Brain acts as a neutral project memory between them. Each connected client reads the same approved project context and can save durable decisions or a handoff for the next AI.',
    steps: [
      'Create one project in Ashes Brain and write a clear project goal.',
      'Connect Codex, ChatGPT or Claude using its dedicated guide and the same Ashes MCP endpoint.',
      'Authorize every client with the same Ashes Brain account.',
      'Ask the first AI to read the project before working.',
      'Save decisions that another AI will need later.',
      'Before switching clients, ask the current AI to save a concise handoff.',
      'Ask the next AI to read the goal, recent decisions and latest handoff before continuing.'
    ],
    verify: [
      'Read my project goal and recent decisions before answering.',
      'Remember this as a durable project decision.',
      'Save a handoff with completed work, blockers and the next action.',
      'Continue from the latest Ashes handoff without asking me to repeat the project.'
    ],
    troubleshoot: [
      { title: 'Different AIs show different information', body: 'Confirm every client is connected to the same Ashes account and project, then ask the previous AI to save its decisions or handoff.' },
      { title: 'The project contains too much noise', body: 'Save compact durable facts rather than every sentence. Update changed decisions and use handoffs for the latest state.' },
      { title: 'A client asks you to explain everything again', body: 'Explicitly ask it to read the Ashes project context and latest handoff before starting the task.' }
    ],
    faq: [
      { question: 'Do the AI companies merge their chat histories?', answer: 'No. Ashes stores only the external project context intentionally written to the Brain.' },
      { question: 'What should I save?', answer: 'Save goals, requirements, decisions, constraints, useful links, completed work, blockers and the next action.' },
      { question: 'Is Ashes Brain an MCP server?', answer: 'Yes. The production endpoint uses remote Streamable HTTP over HTTPS and OAuth for Brain-scoped access.' }
    ]
  }
};

export default function BrainConnectPage() {
  const { client = '' } = useParams();
  const doc = docs[client];

  useEffect(() => {
    if (!doc) return;
    const url = 'https://www.ashesstack.cloud/brain/docs/' + client;
    const oldTitle = document.title;
    document.title = doc.title + ' | Ashes Brain';
    const setMeta = (selector: string, attribute: 'name' | 'property', key: string, value: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attribute, key);
        document.head.appendChild(el);
      }
      el.content = value;
    };
    setMeta('meta[name="description"]', 'name', 'description', doc.description);
    setMeta('meta[name="keywords"]', 'name', 'keywords', doc.keywords);
    setMeta('meta[property="og:title"]', 'property', 'og:title', doc.title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', doc.description);
    setMeta('meta[property="og:type"]', 'property', 'og:type', 'article');
    setMeta('meta[property="og:url"]', 'property', 'og:url', url);
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', doc.title);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', doc.description);
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;
    const schema = document.createElement('script');
    schema.type = 'application/ld+json';
    schema.dataset.ashesBrainDoc = client;
    schema.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: doc.title,
      description: doc.description,
      datePublished: '2026-08-24',
      dateModified: '2026-08-24',
      author: { '@type': 'Person', name: 'Eishal' },
      publisher: { '@type': 'Organization', name: 'Ashes Stack' },
      mainEntityOfPage: url,
      hasPart: {
        '@type': 'FAQPage',
        mainEntity: doc.faq.map(item => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer }
        }))
      }
    });
    document.head.appendChild(schema);
    return () => {
      document.title = oldTitle;
      schema.remove();
    };
  }, [client, doc]);

  if (!doc) return <main style={{ minHeight: '100vh', background: '#080808', color: '#fff', padding: 72 }}><h1>Documentation not found.</h1><Link to="/brain/docs" style={{ color: '#fff' }}>Back to Ashes Brain docs</Link></main>;

  return (
    <main style={{ minHeight: '100vh', background: '#080808', color: '#f3f3ef', fontFamily: 'Inter,system-ui,sans-serif' }}>
      <article style={{ maxWidth: 860, margin: '0 auto', padding: '72px 24px 110px' }}>
        <Link to="/brain/docs" style={{ color: '#999', textDecoration: 'none', fontSize: 12 }}>← ASHES BRAIN DOCS</Link>
        <p style={{ marginTop: 54, color: '#777', fontSize: 11, letterSpacing: '.16em' }}>{doc.label}</p>
        <h1 style={{ fontSize: 'clamp(42px,7vw,74px)', lineHeight: .96, letterSpacing: '-.05em', margin: '14px 0 24px' }}>{doc.title}</h1>
        <p style={{ color: '#aaa69f', fontSize: 18, lineHeight: 1.8 }}>{doc.intro}</p>

        <section style={{ marginTop: 44, padding: 22, border: '1px solid #262626', borderRadius: 16, background: '#0d0d0d' }}>
          <span style={{ color: '#777', fontSize: 10, letterSpacing: '.15em' }}>ASHES BRAIN MCP ENDPOINT</span>
          <code style={{ display: 'block', marginTop: 12, overflowWrap: 'anywhere', color: '#fff', fontSize: 15 }}>{endpoint}</code>
        </section>

        <section style={{ marginTop: 52 }}>
          <h2 style={{ fontSize: 32, letterSpacing: '-.03em' }}>Connect in a few steps</h2>
          <ol style={{ color: '#aaa69f', lineHeight: 1.8, paddingLeft: 24 }}>
            {doc.steps.map(step => <li key={step} style={{ marginBottom: 14 }}>{step}</li>)}
          </ol>
        </section>

        <section style={{ marginTop: 52 }}>
          <h2 style={{ fontSize: 32, letterSpacing: '-.03em' }}>Copy these test prompts</h2>
          <div style={{ display: 'grid', gap: 10 }}>
            {doc.verify.map(prompt => <div key={prompt} style={{ border: '1px solid #242424', borderRadius: 12, padding: 16, background: '#0b0b0b' }}><code>{prompt}</code></div>)}
          </div>
        </section>

        <section style={{ marginTop: 52 }}>
          <h2 style={{ fontSize: 32, letterSpacing: '-.03em' }}>Troubleshooting</h2>
          {doc.troubleshoot.map(item => <div key={item.title} style={{ borderTop: '1px solid #242424', padding: '18px 0' }}><h3 style={{ margin: '0 0 8px' }}>{item.title}</h3><p style={{ margin: 0, color: '#aaa69f', lineHeight: 1.75 }}>{item.body}</p></div>)}
        </section>

        <section style={{ marginTop: 52 }}>
          <p style={{ color: '#777', fontSize: 11, letterSpacing: '.16em' }}>FREQUENTLY ASKED QUESTIONS</p>
          <h2 style={{ fontSize: 32, letterSpacing: '-.03em' }}>Ashes Brain connection FAQs</h2>
          {doc.faq.map(item => <details key={item.question} style={{ borderTop: '1px solid #242424', padding: '18px 0' }}><summary style={{ cursor: 'pointer', fontWeight: 750 }}>{item.question}</summary><p style={{ color: '#aaa69f', lineHeight: 1.75 }}>{item.answer}</p></details>)}
        </section>

        {doc.official ? <p style={{ marginTop: 34, color: '#888', fontSize: 13 }}>Platform steps checked against <a href={doc.official} target="_blank" rel="noreferrer" style={{ color: '#fff' }}>official platform documentation ↗</a>.</p> : null}

        <aside style={{ marginTop: 48, padding: 24, border: '1px solid #282828', borderRadius: 16, background: '#0d0d0d' }}>
          <span style={{ color: '#777', fontSize: 10, letterSpacing: '.15em' }}>START HERE</span>
          <h2 style={{ fontSize: 28, margin: '12px 0 8px' }}>Create one brain. Stop repeating the project.</h2>
          <p style={{ color: '#999', lineHeight: 1.7 }}>Keep your goals, decisions and AI handoffs together, then connect the tools you use.</p>
          <Link to="/workspace" style={{ color: '#fff', fontWeight: 800 }}>OPEN ASHES BRAIN ↗</Link>
        </aside>
      </article>
    </main>
  );
}