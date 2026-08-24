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
    slug: 'ai-cctv-worker-monitoring-reports-whatsapp-alerts',
    category: 'AI CCTV systems',
    title: 'AI CCTV for worker monitoring, automatic reports and WhatsApp alerts',
    description: 'Learn how a custom AI CCTV system can detect workplace events, create activity reports, alert admins on WhatsApp and connect to a secure admin portal.',
    keywords: ['AI CCTV worker monitoring', 'CCTV AI employee monitoring', 'AI camera WhatsApp alerts', 'automatic worker activity reports', 'smart CCTV admin portal'],
    published: '2026-08-24', readTime: '8 min read',
    intro: 'Ordinary CCTV records video for someone to review later. An AI-assisted CCTV system can watch for defined operational events, create searchable activity records and notify an authorized manager when something requires attention. Ashes builds custom computer-vision systems that connect cameras, reports, WhatsApp notifications and an admin portal around a business’s real workflow.',
    sections: [
      { heading: 'What an AI CCTV system can monitor', paragraphs: ['The system can be configured around specific, visible events such as whether a work zone is occupied, whether required safety equipment appears to be present, when a queue becomes unusually long or when a restricted area is entered.', 'The objective should be operational awareness—not vague surveillance. Every event needs a clear business purpose, a defined response and a confidence threshold that reduces unnecessary alerts.'] },
      { heading: 'Automatic daily and weekly reports', paragraphs: ['Instead of watching hours of footage, an authorized admin can receive a summary of detected events, timestamps, trends and items that need human review. Reports can be filtered by site, camera, zone or date.', 'AI output is evidence to review, not an unquestionable judgment about a worker. Important employment or safety decisions should always include human verification.'] },
      { heading: 'WhatsApp alerts for urgent events', paragraphs: ['A WhatsApp integration can send an approved administrator a short alert when a configured event occurs. The message can include the site, time, event type and a secure link back to the admin portal.', 'Good alert design matters. Sending every low-confidence detection creates notification fatigue, so events should be prioritized and rate-limited.'] },
      { heading: 'The secure admin portal', paragraphs: ['The portal brings cameras, event history, reports, users and notification settings into one interface. Role-based access can keep a site manager’s view separate from a company-wide administrator.', 'Audit records, retention controls and secure links help the business understand who viewed or changed information. The exact portal is designed around the customer’s locations and operating process.'] },
      { heading: 'How Ashes builds the system', paragraphs: ['Ashes can design the interface, connect supported camera feeds, build the computer-vision workflow, create the reporting layer and integrate WhatsApp notifications.', 'A responsible project begins with one site and a small number of measurable events. It then expands only after accuracy, response procedures, privacy requirements and real operational value have been tested.'] }
    ],
    faq: [
      { question: 'Can AI CCTV replace a manager?', answer: 'No. It can highlight configured events and summarize activity, but an authorized person should verify important decisions.' },
      { question: 'Can alerts be sent to WhatsApp?', answer: 'Yes. A supported WhatsApp Business integration can notify approved recipients and link them to the secure admin portal.' },
      { question: 'Is worker monitoring legal?', answer: 'Requirements vary by location. Businesses should use a lawful purpose, employee notice, limited access and appropriate retention after obtaining local legal guidance.' }
    ]
  },
  {
    slug: 'whatsapp-ai-chatbot-admin-portal-business',
    category: 'WhatsApp AI',
    title: 'WhatsApp AI chatbot with an admin portal for your business',
    description: 'See how a custom WhatsApp AI assistant can answer customers, qualify leads, send updates and hand conversations to staff through one admin portal.',
    keywords: ['WhatsApp AI chatbot for business', 'WhatsApp chatbot admin portal', 'AI WhatsApp customer support', 'WhatsApp automation system', 'custom WhatsApp AI'],
    published: '2026-08-24', readTime: '7 min read',
    intro: 'Customers already use WhatsApp to ask about prices, availability, bookings and order status. A custom WhatsApp AI assistant can handle repeat questions immediately while keeping staff in control through an admin portal.',
    sections: [
      { heading: 'What a business WhatsApp AI can do', paragraphs: ['The assistant can answer from approved business information, collect lead details, guide a customer through services, send booking or order updates and route complex cases to a person.', 'It should not invent prices, policies or availability. Reliable systems use controlled data sources and clear fallback rules when the answer is uncertain.'] },
      { heading: 'Human handoff is part of the product', paragraphs: ['Automation is useful until a customer needs empathy, negotiation or an exception. Staff should be able to take over a conversation without forcing the customer to start again.', 'The admin portal can show conversation status, assigned team member, customer details and the reason the AI escalated the request.'] },
      { heading: 'One admin portal for messages and performance', paragraphs: ['A tailored dashboard can organize contacts, conversations, common questions, lead stages and response performance. Admins can update approved answers without changing code.', 'Permissions can separate agents, managers and owners. Sensitive customer information should be limited to the people who need it.'] },
      { heading: 'Connect WhatsApp to the rest of the business', paragraphs: ['Depending on the workflow, the assistant can connect to a CRM, booking system, product catalog, order database or reporting service through approved APIs.', 'Ashes builds the conversation experience, backend automation and admin portal as one system instead of leaving the business with disconnected tools.'] }
    ],
    faq: [
      { question: 'Does a WhatsApp AI require the WhatsApp Business Platform?', answer: 'Production automation normally uses an approved WhatsApp Business Platform setup rather than automating a personal account.' },
      { question: 'Can staff reply manually?', answer: 'Yes. A well-designed system supports human takeover and assignment inside the admin workflow.' }
    ]
  },
  {
    slug: '3d-website-design-for-brands-products',
    category: '3D web design',
    title: '3D website design for brands that want to be remembered',
    description: 'Discover how Ashes builds fast, cinematic 3D websites with interactive products, motion, premium graphics and conversion-focused development.',
    keywords: ['3D website design', 'interactive 3D website development', '3D website for brands', 'WebGL product website', 'premium animated website design'],
    published: '2026-08-24', readTime: '6 min read',
    intro: 'A strong 3D website is not a normal landing page with a spinning object added at the end. The product, motion, typography and interaction should work together to explain the brand and lead the visitor toward an action.',
    sections: [
      { heading: 'What makes a 3D website effective', paragraphs: ['The best experience gives the visitor something useful to inspect or understand: a product from every angle, a layered technical story, a spatial portfolio or a scroll-driven reveal.', 'Motion should support the message. If an effect delays the page or hides the call to action, it is decoration rather than design.'] },
      { heading: 'Premium graphics and interaction design', paragraphs: ['Ashes combines art direction, interface design, responsive development, animation and interactive 3D into one visual system. The result can include cinematic transitions, custom hover states, product viewers and branded motion.', 'The visual language is designed for the actual company rather than copied from a generic template.'] },
      { heading: 'Performance still comes first', paragraphs: ['Large models, textures and particle effects can make a website unusable on mobile. Assets need compression, sensible loading, device-aware quality and static fallbacks.', 'Ashes tests the experience as a website, not only as a visual demo. Navigation, readable text, accessibility and conversion paths remain part of the build.'] },
      { heading: 'Good uses for interactive 3D', paragraphs: ['3D works particularly well for products, furniture, architecture, automotive experiences, education, anatomy and launches where shape or transformation is central to the story.', 'Not every section needs 3D. A focused hero or product viewer can be stronger—and faster—than placing effects everywhere.'] },
      { heading: 'From concept to live website', paragraphs: ['A project moves through visual direction, interaction planning, asset preparation, frontend engineering, responsive testing and deployment.', 'Ashes can also connect the public experience to forms, authentication, analytics, ecommerce or a custom admin portal when the product needs more than a landing page.'] }
    ],
    faq: [
      { question: 'Will a 3D website be slow?', answer: 'It can be if assets are untreated. Compression, lazy loading, device-aware rendering and fallbacks are essential parts of the build.' },
      { question: 'Can 3D websites work on mobile?', answer: 'Yes, when interaction and asset quality are designed for touch devices and realistic mobile performance.' }
    ]
  },
  {
    slug: 'custom-ai-admin-portal-business-automation',
    category: 'Admin portals',
    title: 'Custom AI admin portals for reports, teams and business automation',
    description: 'Learn how a custom AI admin portal can combine reports, users, WhatsApp alerts, operations and business data in one secure dashboard.',
    keywords: ['custom AI admin portal', 'business automation dashboard', 'AI reporting portal', 'admin dashboard development', 'operations management software'],
    published: '2026-08-24', readTime: '6 min read',
    intro: 'Businesses often run operations through spreadsheets, chat messages and several disconnected dashboards. A custom admin portal brings the important actions and information into one system designed around the people who actually use it.',
    sections: [
      { heading: 'What belongs in an admin portal', paragraphs: ['The portal can manage users, customers, locations, tasks, reports, alerts, approvals and system settings. The exact modules should follow the company’s workflow rather than a generic dashboard template.', 'Each role sees only what it needs. An owner may view company-wide reporting while a site manager sees a single location.'] },
      { heading: 'Where AI helps', paragraphs: ['AI can summarize operational data, classify incoming requests, identify unusual patterns and prepare draft reports. It can also help staff search approved business knowledge in natural language.', 'High-impact actions should require confirmation. AI suggestions become more trustworthy when the portal shows the underlying records and allows correction.'] },
      { heading: 'Reports and notifications', paragraphs: ['Scheduled reports can be generated from live operational data and delivered to authorized recipients. Urgent events can trigger email or WhatsApp notifications with a secure portal link.', 'Notification rules should be visible and editable so administrators understand why a message was sent.'] },
      { heading: 'Ashes builds the complete system', paragraphs: ['Ashes can design the portal, implement the frontend and backend, connect approved services, create reporting workflows and deploy the application.', 'This is particularly useful when a business needs CCTV AI, WhatsApp automation, staff operations and management reporting to work together rather than remain separate products.'] }
    ],
    faq: [
      { question: 'Is a custom admin portal better than off-the-shelf software?', answer: 'It is most valuable when the workflow is specific, existing tools are disconnected or the business needs controlled integrations.' },
      { question: 'Can the portal support different user roles?', answer: 'Yes. Role-based permissions are a core requirement for secure operational software.' }
    ]
  },
  {
    slug: 'what-ashes-ai-builds',
    category: 'About Ashes AI',
    title: 'What does Ashes AI build? AI systems, 3D websites and connected software',
    description: 'Ashes designs custom AI systems, smart CCTV workflows, WhatsApp assistants, admin portals and premium interactive 3D websites.',
    keywords: ['Ashes AI', 'custom AI development company', 'AI automation development', '3D website agency', 'CCTV AI development'],
    published: '2026-08-24', readTime: '5 min read',
    intro: 'Ashes is a design-led software studio that turns ambitious ideas into connected, production-ready digital products. The work sits where AI engineering, full-stack development and memorable visual design meet.',
    sections: [
      { heading: 'Custom AI systems', paragraphs: ['Ashes builds AI features around a real workflow rather than adding a generic chatbot to a website. Projects can include knowledge assistants, document workflows, computer vision, reporting and operational automation.', 'The system is designed with a clear source of data, permissions, fallbacks and a human review path.'] },
      { heading: 'Smart CCTV and computer vision', paragraphs: ['A tailored CCTV AI workflow can identify defined operational events, prepare activity summaries and send prioritized alerts to approved administrators.', 'Ashes can connect the detection workflow to reporting, WhatsApp notifications and a secure management portal.'] },
      { heading: 'WhatsApp AI and admin portals', paragraphs: ['Businesses can use a WhatsApp AI assistant to answer approved questions, collect leads and hand conversations to staff. A custom portal gives the team control over conversations, data, reports and settings.', 'The public messaging experience and internal operations are built as one connected product.'] },
      { heading: '3D websites and premium graphics', paragraphs: ['Ashes creates cinematic, interactive websites with custom motion, responsive interfaces, product experiences and optimized 3D.', 'The goal is a site people remember without sacrificing performance, usability or the action the business needs visitors to take.'] },
      { heading: 'How to start a project', paragraphs: ['Begin with the business problem, current workflow and the one result that would make the project valuable. Ashes can then define a focused first version and the integrations it genuinely needs.', 'A small working pilot is usually more useful than a long feature list with no tested workflow.'] }
    ],
    faq: [
      { question: 'Does Ashes only build AI products?', answer: 'No. Ashes also builds full-stack web applications, admin portals and premium interactive 3D websites.' },
      { question: 'Can Ashes connect AI, WhatsApp and an admin dashboard?', answer: 'Yes. Those components can be designed as one custom operational system when the required platforms and APIs support the workflow.' }
    ]
  },
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
