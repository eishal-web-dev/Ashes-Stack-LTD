export type BlogPost = {
  slug: string;
  category: string;
  title: string;
  description: string;
  keywords: string[];
  published: string;
  readTime: string;
  intro: string;
  sections: { heading: string; paragraphs: string[]; steps?: string[] }[];
  faq: { question: string; answer: string }[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: 'share-context-between-chatgpt-claude-codex',
    category: 'Shared AI memory',
    title: 'How to share project context between ChatGPT, Claude and Codex',
    description: 'Stop repeating your project to every AI. Learn how shared AI memory keeps ChatGPT, Claude and Codex working from the same approved context.',
    keywords: ['share context between ChatGPT and Claude', 'ChatGPT Claude Codex shared memory', 'shared AI memory', 'AI project context'],
    published: '2026-08-24', readTime: '7 min read',
    intro: 'ChatGPT, Claude and Codex are powerful, but each conversation usually starts inside its own silo. The practical solution is not to merge private chat histories. It is to keep the durable parts of your project—goals, decisions, constraints and next steps—in one shared project brain that approved AI tools can read.',
    sections: [
      { heading: 'Why your AI tools do not automatically share context', paragraphs: ['Each AI product has separate accounts, permissions and conversation storage. Claude cannot simply inspect a private ChatGPT conversation, and Codex should not receive everything you have ever discussed.', 'That separation is good for privacy, but painful for ongoing work. Copying entire transcripts creates noise. A short, structured source of truth works better.'] },
      { heading: 'What belongs in shared AI memory', paragraphs: ['Save information that will still matter in the next session: the project goal, current architecture, important decisions, rejected approaches, customer requirements, blockers and the next action.', 'Do not save every greeting or draft. Shared memory should be a clean project brief that improves future work instead of becoming another messy chat log.'] },
      { heading: 'A simple workflow that works', paragraphs: ['Create one project brain, add the current goal, and save decisions as they happen. Before switching tools, create a compact handoff. The next AI reads that same project context and continues from the latest state.'], steps: ['Create a project in Ashes Brain.', 'Save the goal, constraints and latest decisions.', 'Connect or open the supported AI client.', 'Ask it to read the project context before continuing.', 'Save the new decision or handoff when the work changes.'] },
      { heading: 'How Ashes Brain fits', paragraphs: ['Ashes Brain is built as a shared context layer for people who move between ChatGPT, Claude, Codex, Gemini and coding tools. You control what becomes durable project memory.', 'The free plan is enough to test the workflow. Pro raises the project chat and message limits for people using it every day.'] }
    ],
    faq: [
      { question: 'Can Claude directly read my ChatGPT history?', answer: 'Not by default. A shared memory service carries only the project context you intentionally save and authorize.' },
      { question: 'Is shared AI memory the same as copying a transcript?', answer: 'No. Useful shared memory is compact, structured and focused on durable goals, decisions and handoffs.' }
    ]
  },
  {
    slug: 'connect-codex-claude-code-cursor-same-project',
    category: 'AI coding workflow',
    title: 'How to connect Codex, Claude Code and Cursor to the same project context',
    description: 'A practical workflow for keeping Codex, Claude Code and Cursor aligned on one codebase without explaining the project again and again.',
    keywords: ['connect Codex Claude Code Cursor', 'shared context coding agents', 'AI coding agent memory', 'Codex Claude same project'],
    published: '2026-08-24', readTime: '6 min read',
    intro: 'Using multiple coding agents can speed up development, but only when they agree on the current state of the project. If every tool receives a different explanation, you get repeated work, conflicting architecture and fixes that undo earlier decisions.',
    sections: [
      { heading: 'The real problem is not the model', paragraphs: ['Most coding-agent confusion comes from missing context: what has already shipped, which files matter, which tradeoffs were accepted and what must not change.', 'A repository contains code, but it rarely explains the business goal, rejected options or the reason behind a decision. That is the gap a project brain fills.'] },
      { heading: 'Keep one source of truth', paragraphs: ['Use Git for the code and a shared brain for durable project knowledge. Store the active objective, stack, conventions, deployment target, known problems and current next step.', 'This does not replace README files or issues. It gives each AI a compact starting point before it touches either.'] },
      { heading: 'Recommended handoff pattern', paragraphs: ['At the end of a useful session, save what changed and what remains. At the beginning of the next session, ask the new tool to read that handoff before proposing work.'], steps: ['Codex completes a code change and records the commit plus remaining blocker.', 'Claude Code reads the same project handoff before reviewing or extending it.', 'Cursor receives the current decisions instead of an outdated pasted prompt.', 'The next meaningful decision is saved back to the project brain.'] },
      { heading: 'Avoid these common mistakes', paragraphs: ['Do not give every agent unrestricted access to everything. Keep secrets outside memory, scope connections carefully and review write actions.', 'Do not treat generated summaries as unquestionable truth. The repository, tests and deployed product remain evidence; shared memory provides direction and continuity.'] }
    ],
    faq: [
      { question: 'Does this synchronize the agents in real time?', answer: 'It provides a shared source of project context. Each agent reads or writes through an approved connection; it is not a live stream of private chats.' },
      { question: 'Should API keys be stored in the project brain?', answer: 'No. Keep secrets in an environment-variable or secret-management system.' }
    ]
  },
  {
    slug: 'best-ai-memory-tool-for-developers',
    category: 'Developer tools',
    title: 'What is the best AI memory tool for developers?',
    description: 'Compare the features that matter in an AI memory tool for developers: shared project context, MCP support, handoffs, permissions and useful limits.',
    keywords: ['best AI memory tool for developers', 'AI second brain developers', 'persistent AI memory', 'MCP memory tool'],
    published: '2026-08-24', readTime: '7 min read',
    intro: 'The best AI memory tool is not the one that stores the most text. It is the one that helps your next AI session begin with the right context, without exposing information that should stay private.',
    sections: [
      { heading: 'Look for project-based memory', paragraphs: ['Developer work is organized around products, repositories and clients. Memory should be separated by project so an ecommerce decision never leaks into an unrelated legal-AI build.', 'A useful project record includes goals, stack, constraints, decisions, blockers and handoffs—not only a list of old messages.'] },
      { heading: 'Connections matter more than a pretty notes page', paragraphs: ['A memory product becomes valuable when the AI tools you already use can retrieve the right context. MCP support is useful because compatible clients can discover focused tools through a standard protocol.', 'Also look for a clear manual handoff. Even when a client cannot connect directly, you should be able to copy a clean context packet instead of an entire history.'] },
      { heading: 'Security and control are essential', paragraphs: ['You should decide what is remembered, which client can access it and when access can be revoked. The system should never require another provider’s password.', 'Avoid storing credentials, raw customer data or unnecessary private transcripts. The smallest useful context is usually the safest and easiest for an AI to follow.'] },
      { heading: 'Where Ashes Brain is different', paragraphs: ['Ashes Brain focuses on cross-tool continuity: project memory, decisions and handoffs that can move with you between supported AI clients.', 'It is designed for the moment when you are tired of saying “here is the whole project again.” You can begin on the free plan and upgrade only when you need higher working limits.'] }
    ],
    faq: [
      { question: 'Do developers need an AI memory tool?', answer: 'It becomes useful when a project spans several sessions, AI providers or collaborators and repeated explanations begin wasting time.' },
      { question: 'What is the most important feature?', answer: 'A trustworthy, project-scoped source of truth that your actual AI workflow can access.' }
    ]
  },
  {
    slug: 'stop-explaining-project-to-every-ai',
    category: 'Productivity',
    title: 'How to stop explaining your project to every AI assistant',
    description: 'Use a reusable AI project brief and shared memory so every new ChatGPT, Claude, Gemini or Codex session starts with the right context.',
    keywords: ['stop explaining project to AI', 'reusable AI project context', 'AI project brief', 'persistent context ChatGPT Claude'],
    published: '2026-08-24', readTime: '5 min read',
    intro: 'If your first ten messages are always a history lesson, you are using expensive attention on setup instead of progress. A reusable project brief fixes the immediate problem; shared project memory makes the fix durable.',
    sections: [
      { heading: 'Write context for the next action', paragraphs: ['Long transcripts feel complete but often hide the information that matters. Start with the objective, current state, hard constraints, recent decisions and one clear next action.', 'Include links or identifiers for evidence such as a repository, deployment or issue. Do not ask an AI to trust an old summary when it can verify the current code.'] },
      { heading: 'Use a compact context structure', paragraphs: ['A reliable structure is: Goal, Current State, Decisions, Constraints, Blockers and Next Step. Keep each section short enough to scan.', 'Update the record when a meaningful decision changes. Do not rewrite it for cosmetic conversation details.'] },
      { heading: 'Turn the brief into shared memory', paragraphs: ['A static prompt works until it becomes outdated or exists in five copies. Put the canonical version in one project brain, then let approved tools read it or generate a handoff.', 'That creates continuity without pretending every AI provider shares one hidden conversation database.'] },
      { heading: 'Start small', paragraphs: ['Create one brain for the project causing the most repetition. Add only the facts the next AI must know and test the handoff in a second tool.', 'If the second AI can accurately explain the goal, current state and next action, the memory is doing its job.'] }
    ],
    faq: [
      { question: 'How long should an AI project brief be?', answer: 'Use the shortest version that preserves the goal, current state, key decisions, constraints and next step.' },
      { question: 'Should I paste every previous AI conversation?', answer: 'Usually no. Save durable decisions and evidence; full transcripts add noise and may contain irrelevant private information.' }
    ]
  },
  {
    slug: 'mcp-shared-memory-explained',
    category: 'MCP explained',
    title: 'MCP shared memory explained: how AI assistants use one project brain',
    description: 'Understand how an MCP memory server lets approved AI assistants read and update shared project context without sharing private provider passwords.',
    keywords: ['MCP shared memory', 'MCP memory server', 'Model Context Protocol memory', 'AI shared project brain'],
    published: '2026-08-24', readTime: '8 min read',
    intro: 'The Model Context Protocol, or MCP, gives compatible AI applications a standard way to discover and call tools. When those tools connect to a project-memory service, several approved assistants can work from the same source of truth.',
    sections: [
      { heading: 'MCP is the connection, not the memory', paragraphs: ['An MCP server describes tools an AI client can use. A memory server might offer actions such as list projects, read context, search memories, save a decision and create a handoff.', 'The database and permission system hold the memory. MCP provides a consistent interface for compatible clients.'] },
      { heading: 'A typical request flow', paragraphs: ['You authorize a supported AI client to access a project. The client discovers the available tools, requests the current context and receives only the scoped result.', 'If you approve a write action, the client can save a durable decision. A different authorized client can retrieve that decision during a later session.'] },
      { heading: 'What secure implementation requires', paragraphs: ['HTTPS alone is not enough. A production service needs authentication, project-level authorization, input validation, revocable access and narrow tools.', 'A tool called “read this project” is safer and easier to reason about than broad, unexplained database access. Users should understand what will be read or written.'] },
      { heading: 'Try the pattern with Ashes Brain', paragraphs: ['Ashes Brain provides a workspace for project context and guided connection docs for supported clients. Start by creating one project, saving a decision and reading it from a second workflow.', 'The result should be simple: less repetition, clearer handoffs and fewer agents working from an outdated version of the project.'] }
    ],
    faq: [
      { question: 'Does MCP let one AI read every other AI chat?', answer: 'No. MCP exposes only the tools and data a server intentionally provides and the user authorizes.' },
      { question: 'Can an MCP memory server write data?', answer: 'Yes, if it exposes a write tool and the user is authorized. Good systems keep read and write capabilities explicit and scoped.' }
    ]
  }
];

export const getBlogPost = (slug: string) => blogPosts.find(post => post.slug === slug);
