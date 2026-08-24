import { useEffect, useMemo, useRef, useState } from 'react';
import './workspace.css';

type MemoryKind = 'memory' | 'conversation' | 'decision' | 'handoff';
type MemoryItem = { id: string; text: string; createdAt: number; source: string; kind?: MemoryKind; };
type WorkspaceProject = { id: string; name: string; goal: string; memory: MemoryItem[]; updatedAt?: string; };
type AgentName = 'ChatGPT' | 'Claude' | 'Codex' | 'Gemini';
type AuthState = 'checking' | 'guest' | 'signed-in';
type SyncState = 'local' | 'syncing' | 'synced' | 'error';
type BrainPlan = 'free' | 'pro' | 'team';

const AGENTS: AgentName[] = ['ChatGPT', 'Claude', 'Codex', 'Gemini'];
const AGENT_LINKS: Record<AgentName, string> = {
  ChatGPT: 'https://chatgpt.com/',
  Claude: 'https://claude.ai/new',
  Codex: 'https://chatgpt.com/codex',
  Gemini: 'https://gemini.google.com/app',
};
const STORAGE_KEY = 'ashes-work-os-projects-v2';
const ACTIVE_KEY = 'ashes-work-os-active-project-v1';
const MCP_URL = 'https://www.ashesstack.cloud/mcp';

const CONNECTIONS = [
  {
    name: 'ChatGPT',
    method: 'ChatGPT App · MCP',
    status: 'MCP LIVE · APP UNPUBLISHED',
    tone: 'soon',
    steps: [
      'Ashes is not in the public directory yet, so do not search for it there.',
      'If your ChatGPT workspace shows Developer Mode: Settings → Apps & Connectors → Advanced settings → Developer Mode.',
      'Open Apps → Create.',
      `Paste this MCP URL exactly: ${MCP_URL}`,
      'Let ChatGPT discover the Ashes tools, then approve the Ashes sign-in/permission screen.',
      'After public approval, normal users will only need to search “Ashes” in the app/plugin directory and press Connect.',
    ],
    note: 'The Ashes MCP server is live now. Private ChatGPT testing still depends on whether Developer Mode/custom MCP is available on that ChatGPT account or workspace.',
    href: 'https://help.openai.com/en/articles/12584461-developer-mode-and-full-mcp-connectors-in-chatgpt',
    action: 'Open official ChatGPT setup guide',
  },
  {
    name: 'Codex',
    method: 'Plugin / app connection',
    status: 'MCP LIVE · DIRECTORY LATER',
    tone: 'soon',
    steps: [
      'Ashes is not searchable in Codex yet.',
      `The shared backend is already live at ${MCP_URL}.`,
      'Once the Ashes plugin/app is submitted and approved, open the Plugins Directory in Codex.',
      'Search for Ashes, open its listing, and press Connect.',
    ],
    note: 'The shared brain backend is ready; public discovery is the remaining Codex publishing step.',
    href: 'https://help.openai.com/en/articles/20001256-plugins-in-codexOpenAI',
    action: 'Open official Codex plugin guide',
  },
  {
    name: 'Claude',
    method: 'Remote MCP connector',
    status: 'MCP ENDPOINT LIVE',
    tone: 'ready',
    steps: [
      'Open Claude → Settings → Connectors.',
      'Choose Add custom connector.',
      `Paste this URL exactly: ${MCP_URL}`,
      'Claude should open the Ashes Brain sign-in/permission flow. Sign in and press Allow Ashes once.',
      'After approval, Claude can read the shared project brain and use the Ashes memory/handoff tools exposed to it.',
    ],
    note: 'The Brain login is separate from the Ashes Stack client/team/admin portal.',
    href: 'https://claude.ai/',
    action: 'Open Claude',
  },
  {
    name: 'Gemini',
    method: 'MCP via CLI / agent mode',
    status: 'MCP ENDPOINT LIVE · CLI / AGENT',
    tone: 'limited',
    steps: [
      'Ordinary Gemini web chat does not currently have the same custom-connector flow.',
      'Use Gemini CLI or a supported Gemini agent surface with MCP support.',
      `Add this MCP server: ${MCP_URL}`,
      'Approve Ashes when the client starts the authorization flow.',
      'Then use Ashes as the same shared project-memory service.',
    ],
    note: 'This stays marked separately so users are not told to look for an Ashes button in normal Gemini web chat.',
    href: 'https://developers.google.com/gemini-code-assist/docs/gemini-cli',
    action: 'Open Gemini MCP guide',
  },
] as const;

const starterProject: WorkspaceProject = {
  id: 'ashes-demo',
  name: 'My shared brain',
  goal: 'Keep every AI working from the same project context.',
  memory: [{
    id: 'welcome-memory',
    text: 'Ashes is the shared project brain. Connect supported AI clients to Ashes once, then let every client read and update the same project context.',
    createdAt: Date.now(), source: 'Ashes', kind: 'memory',
  }],
};

function loadProjects(): WorkspaceProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [starterProject];
    const parsed = JSON.parse(raw) as WorkspaceProject[];
    return Array.isArray(parsed) && parsed.length ? parsed : [starterProject];
  } catch { return [starterProject]; }
}

function kindLabel(kind?: MemoryKind) {
  if (kind === 'conversation') return 'chat';
  if (kind === 'decision') return 'decision';
  if (kind === 'handoff') return 'handoff';
  return 'memory';
}

async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch {
    const area = document.createElement('textarea');
    area.value = text; area.style.position = 'fixed'; area.style.opacity = '0';
    document.body.appendChild(area); area.select(); const ok = document.execCommand('copy'); area.remove(); return ok;
  }
}

export default function Workspace() {
  const initial = useRef(loadProjects());
  const [projects, setProjects] = useState<WorkspaceProject[]>(initial.current);
  const [activeProjectId, setActiveProjectId] = useState(() => localStorage.getItem(ACTIVE_KEY) || initial.current[0]?.id || starterProject.id);
  const [draft, setDraft] = useState('');
  const [projectName, setProjectName] = useState('');
  const [bridgeReady, setBridgeReady] = useState(false);
  const [bridgeAuto, setBridgeAuto] = useState(false);
  const [authState, setAuthState] = useState<AuthState>('checking');
  const [syncState, setSyncState] = useState<SyncState>('local');
  const [toast, setToast] = useState('');
  const [plan, setPlan] = useState<BrainPlan>('free');
  const [limits, setLimits] = useState({ projects: 2, messagesPerChat: 10 });

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? projects[0],
    [projects, activeProjectId],
  );

  const contextPacket = useMemo(() => {
    if (!activeProject) return '';
    const header = [
      'ASHES SHARED PROJECT BRAIN',
      `Project: ${activeProject.name}`,
      `Goal: ${activeProject.goal || 'No goal set.'}`,
      '',
      'Use the shared project context below. Do not ask the user to repeat information already here. Preserve existing decisions unless the user changes them.',
      '',
    ].join('\n');
    const footer = '\n\nMy next instruction: ';
    const availableMemory = Math.max(0, 22000 - header.length - footer.length);
    const memory = activeProject.memory.slice(0, 24).reverse()
      .map((item) => `[${kindLabel(item.kind)} · ${item.source}] ${item.text}`).join('\n\n')
      .slice(-availableMemory);
    return `${header}${memory || 'No shared memory yet.'}${footer}`;
  }, [activeProject]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    window.postMessage({ type: 'ASHES_WORKSPACE_STATE', projects, activeProjectId }, window.location.origin);
  }, [projects, activeProjectId]);

  useEffect(() => { localStorage.setItem(ACTIVE_KEY, activeProjectId); }, [activeProjectId]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== window || event.origin !== window.location.origin) return;
      const data = event.data;
      if (data?.type === 'ASHES_BRIDGE_READY') {
        setBridgeReady(true); setBridgeAuto(data.autoSync === true); return;
      }
      if (data?.type === 'ASHES_AUTO_SYNC_STATE') { setBridgeAuto(data.enabled === true); return; }
      if (data?.type === 'ASHES_BRIDGE_PROJECTS' && Array.isArray(data.projects) && data.projects.length) {
        const incoming = data.projects as WorkspaceProject[];
        setProjects(incoming);
        if (data.activeProjectId && incoming.some((project) => project.id === data.activeProjectId)) setActiveProjectId(data.activeProjectId);
      }
    };
    window.addEventListener('message', onMessage);
    window.postMessage({ type: 'ASHES_WORKSPACE_PING' }, window.location.origin);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function bootCloud() {
      try {
        const me = await fetch('/api/workspace?auth=me', { credentials: 'include' });
        if (!me.ok) { if (!cancelled) { setAuthState('guest'); setSyncState('local'); } return; }
        if (!cancelled) setAuthState('signed-in');
        const response = await fetch('/api/workspace', { credentials: 'include' });
        if (!response.ok) throw new Error('Cloud unavailable');
        const data = await response.json() as { projects?: WorkspaceProject[]; plan?: BrainPlan; limits?: { projects: number; messagesPerChat: number } };
        if (data.plan) setPlan(data.plan);
        if (data.limits) setLimits(data.limits);
        const cloudProjects = Array.isArray(data.projects) ? data.projects : [];
        if (cancelled) return;
        if (cloudProjects.length) {
          setProjects(cloudProjects);
          if (!cloudProjects.some((project) => project.id === activeProjectId)) setActiveProjectId(cloudProjects[0].id);
          setSyncState('synced');
        } else {
          setSyncState('syncing');
          const seed = await fetch('/api/workspace', {
            method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'sync', projects: initial.current, replace: true }),
          });
          if (!seed.ok) throw new Error('Seed failed');
          setSyncState('synced');
        }
      } catch {
        if (!cancelled) { setAuthState((current) => current === 'checking' ? 'guest' : current); setSyncState('error'); }
      }
    }
    bootCloud();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (authState !== 'signed-in') return;
    const timer = window.setTimeout(async () => {
      try {
        setSyncState('syncing');
        const response = await fetch('/api/workspace', {
          method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'sync', projects, replace: true }),
        });
        if (!response.ok) throw new Error('Sync failed');
        setSyncState('synced');
      } catch { setSyncState('error'); }
    }, 650);
    return () => window.clearTimeout(timer);
  }, [projects, authState]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function updateActive(patch: Partial<WorkspaceProject>) {
    if (!activeProject) return;
    setProjects((current) => current.map((project) => project.id === activeProject.id ? { ...project, ...patch } : project));
  }

  function createProject() {
    const name = projectName.trim(); if (!name) return;
    if (projects.length >= limits.projects) {
      setToast(`Free limit reached: ${limits.projects} chats. Upgrade to Pro.`);
      window.setTimeout(() => window.location.assign('/pricing'), 900);
      return;
    }
    const project: WorkspaceProject = { id: `project-${Date.now()}`, name, goal: 'One shared context across my AI tools.', memory: [] };
    setProjects((current) => [project, ...current]); setActiveProjectId(project.id); setProjectName('');
  }

  function addMemory(kind: MemoryKind = 'memory') {
    const text = draft.trim(); if (!text || !activeProject) return;
    if (activeProject.memory.length >= limits.messagesPerChat) {
      setToast(`Limit reached: ${limits.messagesPerChat} messages in this chat. Upgrade to Pro.`);
      window.setTimeout(() => window.location.assign('/pricing'), 900);
      return;
    }
    const item: MemoryItem = { id: `memory-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, text: text.slice(0, 12000), createdAt: Date.now(), source: 'You', kind };
    updateActive({ memory: [item, ...activeProject.memory].slice(0, 250) }); setDraft('');
  }

  function removeMemory(id: string) {
    if (!activeProject) return;
    updateActive({ memory: activeProject.memory.filter((item) => item.id !== id) });
  }

  async function shareProject() {
    if (!activeProject) return;
    if (authState !== 'signed-in') {
      setToast('Sign in to Brain to share');
      window.setTimeout(() => window.location.assign('/workspace/login'), 650);
      return;
    }
    try {
      setToast('Creating share link…');
      const sync = await fetch('/api/workspace', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync', projects, replace: true }),
      });
      if (!sync.ok) throw new Error('Could not sync project');
      const response = await fetch('/api/workspace', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'share', id: activeProject.id }),
      });
      const data = await response.json() as { shareUrl?: string; error?: string };
      if (!response.ok || !data.shareUrl) throw new Error(data.error || 'Could not create share link');
      await copyText(data.shareUrl);
      setToast('Share link copied');
    } catch {
      setToast('Could not create share link');
    }
  }

  async function copyBrain() {
    const copied = await copyText(contextPacket);
    setToast(copied ? 'Brain context copied — paste it into any AI' : 'Could not copy brain context');
  }

  async function openAgent(agent: AgentName) {
    if (!activeProject) return;
    const url = AGENT_LINKS[agent];
    if (bridgeReady) {
      if (!bridgeAuto) {
        window.postMessage({ type: 'ASHES_SET_AUTO_SYNC', enabled: true }, window.location.origin);
        setBridgeAuto(true);
      }
      const popup = window.open('about:blank', '_blank');
      window.postMessage({
        type: 'ASHES_OPEN_AGENT',
        agent,
        targetSite: agent === 'Codex' ? 'ChatGPT' : agent,
        projectId: activeProject.id,
      }, window.location.origin);
      window.setTimeout(() => {
        if (popup) popup.location.href = url;
        else window.open(url, '_blank', 'noopener,noreferrer');
      }, 180);
      setToast(`${agent} is opening with the shared brain`);
      return;
    }
    await copyText(contextPacket);
    window.open(url, '_blank', 'noopener,noreferrer');
    setToast(`Opened ${agent}. Use the live MCP setup below to connect Ashes.`);
  }

  function deleteProject() {
    if (!activeProject || projects.length === 1) { setToast('Keep one project'); return; }
    if (!window.confirm(`Delete “${activeProject.name}”?`)) return;
    const next = projects.filter((project) => project.id !== activeProject.id);
    setProjects(next); setActiveProjectId(next[0].id);
  }

  if (!activeProject) return null;
  const syncLabel = authState === 'checking' ? 'checking' : authState === 'guest' ? 'local'
    : syncState === 'syncing' ? 'syncing' : syncState === 'error' ? 'sync issue' : 'brain cloud synced';

  return (
    <main className="brain-shell">
      {toast && <div className="brain-toast">{toast}</div>}
      <aside className="brain-sidebar">
        <a href="/" className="brain-brand"><span>A</span> Ashes</a>
        <div className="brain-create">
          <input value={projectName} onChange={(e) => setProjectName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && createProject()} placeholder="New project" />
          <button onClick={createProject}>+</button>
        </div>
        <nav className="brain-projects">
          {projects.map((project) => <button key={project.id} className={project.id === activeProject.id ? 'active' : ''} onClick={() => setActiveProjectId(project.id)}>{project.name}</button>)}
        </nav>
        <div className="brain-sidebar-bottom">
          <span><i className={syncState === 'error' ? 'error' : ''} />{syncLabel}</span>
          {authState === 'guest' && <a href="/workspace/login">Sign in to Brain</a>}
          <a href="/pricing">{plan === 'free' ? `Free · ${limits.projects} chats · ${limits.messagesPerChat} messages` : `${plan.toUpperCase()} plan`}</a>
          <a href="/">Back home</a>
        </div>
      </aside>

      <section className="brain-main">
        <header className="brain-header">
          <div><p>SHARED BRAIN</p><h1>{activeProject.name}</h1>
            <input className="brain-goal" value={activeProject.goal} onChange={(e) => updateActive({ goal: e.target.value })} aria-label="Project goal" />
          </div>
          <div className="brain-header-actions">
            <button className="brain-quiet" onClick={shareProject}>Share brain ↗</button>
            <a className="brain-connect" href="#connect-ais"><span />Connect your AIs</a>
            <button className="brain-quiet danger" onClick={deleteProject}>Delete</button>
          </div>
        </header>

        <section className="brain-launch">
          <div><p>CONTINUE ANYWHERE</p><h2>One brain. One click.</h2></div>
          <div className="brain-launch-actions">
            <button className="brain-copy" onClick={copyBrain}>Copy brain <b>{contextPacket.length.toLocaleString()} chars</b></button>
            {AGENTS.map((agent) => <button key={agent} onClick={() => openAgent(agent)}>{agent}<b>↗</b></button>)}
          </div>
        </section>

        <section className="brain-panel brain-memory">
          <div className="brain-panel-title"><div><p>MEMORY</p><h2>What every AI knows.</h2></div><span>{activeProject.memory.length}</span></div>
          <div className="brain-composer">
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a decision or project fact…" />
            <div><button className="brain-quiet" onClick={() => addMemory('decision')}>Decision</button><button onClick={() => addMemory('memory')}>Save</button></div>
          </div>
          <div className="brain-memory-list">
            {activeProject.memory.length === 0 ? <div className="brain-empty">Your synced AI chats and decisions will appear here.</div> : activeProject.memory.map((item) => (
              <article key={item.id}><div><span>{item.source} · {kindLabel(item.kind)}</span><button onClick={() => removeMemory(item.id)} aria-label="Remove memory">×</button></div><p>{item.text}</p></article>
            ))}
          </div>
        </section>

        <section className="brain-connect-guide" id="connect-ais">
          <div className="connect-guide-head">
            <div><p>CONNECT ONCE</p><h2>Exact setup for each AI.</h2></div>
            <span>MCP live</span>
          </div>
          <p className="connect-guide-intro"><strong>Live endpoint:</strong> {MCP_URL}. Ashes Brain authentication is separate from the existing Ashes Stack client/team/admin portal.</p>
          <div className="connect-guide-list">
            {CONNECTIONS.map((connection) => (
              <details key={connection.name} className={`connect-row ${connection.tone}`}>
                <summary>
                  <div className="connect-name"><b>{connection.name}</b><small>{connection.method}</small></div>
                  <span className="connect-status">{connection.status}</span>
                  <i>⌄</i>
                </summary>
                <div className="connect-body">
                  <ol>{connection.steps.map((step) => <li key={step}>{step}</li>)}</ol>
                  <p>{connection.note}</p>
                  <a href={connection.href} target="_blank" rel="noreferrer">{connection.action} ↗</a>
                </div>
              </details>
            ))}
          </div>
          <div className="connect-result"><span>Live architecture</span><b>Supported AI client → Brain-only OAuth → Ashes Brain → same project memory everywhere</b></div>
        </section>
      </section>
    </main>
  );
}
