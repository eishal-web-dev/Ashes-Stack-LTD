import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import AdSenseBootstrap from '../ads/AdSenseBootstrap';

const articles: Record<string, { eyebrow: string; title: string; intro: string; description?: string; keywords?: string; sections: { title: string; body: string[] }[]; faq?: { question: string; answer: string }[] }> = {
  'shared-ai-memory-chatgpt-claude-gemini': {
    eyebrow: 'SHARED AI MEMORY · 8 MIN READ',
    title: 'Shared AI memory: one brain for ChatGPT, Claude and Gemini',
    description: 'Learn how shared AI memory gives ChatGPT, Claude, Gemini and other AI assistants the same project context, decisions and handoffs through one secure AI brain.',
    keywords: 'shared AI memory, AI second brain, ChatGPT Claude shared memory, ChatGPT Gemini memory, AI project memory, shared brain for AI, MCP memory server, connect ChatGPT and Claude',
    intro: 'Using several AI assistants usually means explaining the same project again and again. ChatGPT knows what happened in ChatGPT, Claude knows what happened in Claude, and Gemini keeps its own separate history. A shared AI memory—sometimes called an AI second brain—puts the useful project context in one secure place so every approved AI can continue from the same source of truth.',
    sections: [
      { title: 'What is shared AI memory?', body: [
        'Shared AI memory is a persistent project knowledge layer that sits outside any single chat provider. It stores the information that should survive after a conversation ends: goals, decisions, requirements, preferences, blockers, useful links and handoffs.',
        'The AI assistants do not directly read each other’s private conversations. Instead, each approved assistant connects to the same project brain, reads the context it needs and saves durable updates. You stay in control of what is stored and which AI client is allowed to access it.'
      ]},
      { title: 'Why ChatGPT, Claude and Gemini do not automatically share memory', body: [
        'ChatGPT, Claude and Gemini are separate products operated by separate companies. Their accounts, chats and memory systems are isolated for privacy and security. Signing into all three does not create a shared workspace between them.',
        'This is why Claude may say it does not know what you discussed with ChatGPT. Nothing is broken: the context was simply never transferred. Copy-and-paste can transfer it manually, but that becomes slow, inconsistent and easy to forget as a project grows.'
      ]},
      { title: 'How an AI second brain works', body: [
        'A practical AI second brain has a project store, access control and a small set of tools. The project store holds durable context. Access control confirms the user and approved AI client. The tools let an assistant list projects, read context, search memory, remember a decision and create a handoff.',
        'The flow is simple: create a project, connect an AI client, ask it to read the project, work normally, then save the decisions that matter. When you switch to another compatible AI, it reads the same project and continues without a full explanation.'
      ]},
      { title: 'Shared AI memory with MCP', body: [
        'The Model Context Protocol, or MCP, provides a standard way for AI applications to connect to external tools and data. A remote MCP memory server can expose focused actions such as get project context, search memory, remember and handoff.',
        'MCP is the connector, not the memory itself. The memory remains in the shared service, while OAuth can let you approve access without sharing your ChatGPT, Claude or Gemini password with that service.'
      ]},
      { title: 'What should you save in a shared brain?', body: [
        'Save information that another AI would need to continue the project correctly tomorrow: the project goal, audience, brand rules, chosen technology, important constraints, completed work, rejected ideas, open questions and the next action.',
        'Do not treat memory as a transcript landfill. Compact, well-labelled facts and handoffs are easier for an AI to search and less likely to introduce stale or conflicting context. Update a decision when it changes instead of preserving several unclear versions.'
      ]},
      { title: 'Example: moving a project from ChatGPT to Claude', body: [
        'Imagine planning a product in ChatGPT. You decide the audience, feature set and launch order, then save those decisions to the shared brain. Later, you open Claude and ask it to continue the same project. Claude reads the goal and recent decisions before suggesting the next implementation step.',
        'After Claude completes its part, it saves a handoff describing what changed, what remains blocked and what should happen next. Gemini—or a future AI client—can use that same handoff if it has been connected and approved.'
      ]},
      { title: 'Privacy and security checklist', body: [
        'Use a shared-memory service that explains what its tools can read and write, uses HTTPS, scopes data to the authenticated user and allows access to be revoked. A connector should never ask for another AI provider’s password, browser cookie or one-time code.',
        'Projects should be private by default. Public sharing should require a separate deliberate action, and a public view should not silently grant write permission. For sensitive work, store the minimum durable context required and review old memories regularly.'
      ]},
      { title: 'How Ashes Brain helps', body: [
        'Ashes Brain is a shared project memory designed for working across supported AI clients. You create one project brain, keep its goals, decisions, memories and handoffs together, then connect compatible AI tools through a remote MCP endpoint with OAuth.',
        'The aim is simple: tell one AI something important, save it once, and let the next approved AI continue with the same project context. You can start with one project and test the complete workflow before moving important work into it.'
      ]},
    ],
    faq: [
      { question: 'Can ChatGPT and Claude share memory automatically?', answer: 'Not through their normal separate chat histories. They need a shared external memory service or a manual context handoff that both can access.' },
      { question: 'Can Gemini read my ChatGPT conversations?', answer: 'No, not automatically. You must intentionally transfer the relevant context or connect both clients to an approved shared project memory.' },
      { question: 'Is shared AI memory the same as MCP?', answer: 'No. Shared AI memory is the stored project context. MCP is a standard connection method an AI client can use to access tools such as read, search, remember and handoff.' },
      { question: 'What is an AI second brain?', answer: 'An AI second brain is a persistent, searchable place for goals, decisions and knowledge that can support work across conversations and, when connected, across multiple AI assistants.' },
      { question: 'Is Ashes Brain free?', answer: 'You can open Ashes Brain and begin with the options currently shown on the Ashes pricing page. Available plans may change as the product develops.' },
    ],
  },
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

  useEffect(() => {
    if (!article) return;
    const url = `https://www.ashesstack.cloud/guides/${slug}`;
    const description = article.description || article.intro;
    const previousTitle = document.title;
    document.title = `${article.title} | Ashes Brain`;

    const setMeta = (selector: string, attribute: 'name' | 'property', key: string, content: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(selector);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }
      element.content = content;
    };
    setMeta('meta[name="description"]', 'name', 'description', description);
    if (article.keywords) setMeta('meta[name="keywords"]', 'name', 'keywords', article.keywords);
    setMeta('meta[property="og:title"]', 'property', 'og:title', article.title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    setMeta('meta[property="og:type"]', 'property', 'og:type', 'article');
    setMeta('meta[property="og:url"]', 'property', 'og:url', url);
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', article.title);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    const schema = document.createElement('script');
    schema.type = 'application/ld+json';
    schema.dataset.ashesGuide = slug;
    schema.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.title,
      description,
      datePublished: '2026-08-23',
      dateModified: '2026-08-23',
      mainEntityOfPage: url,
      author: { '@type': 'Person', name: 'Eishal' },
      publisher: { '@type': 'Organization', name: 'Ashes Stack', url: 'https://www.ashesstack.cloud/' },
      ...(article.faq?.length ? {
        hasPart: {
          '@type': 'FAQPage',
          mainEntity: article.faq.map(item => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: { '@type': 'Answer', text: item.answer },
          })),
        },
      } : {}),
    });
    document.head.appendChild(schema);
    return () => {
      document.title = previousTitle;
      schema.remove();
    };
  }, [article, slug]);

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


        {article.faq?.length ? (
          <section style={{ marginTop: 52 }}>
            <p style={{ color: '#777', fontSize: 11, letterSpacing: '.16em' }}>FREQUENTLY ASKED QUESTIONS</p>
            <h2 style={{ fontSize: 32, letterSpacing: '-.03em' }}>Shared AI memory FAQs</h2>
            {article.faq.map((item) => (
              <details key={item.question} style={{ borderTop: '1px solid #242424', padding: '18px 0' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 750, fontSize: 17 }}>{item.question}</summary>
                <p style={{ color: '#a6a39d', lineHeight: 1.8, fontSize: 15 }}>{item.answer}</p>
              </details>
            ))}
          </section>
        ) : null}

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
