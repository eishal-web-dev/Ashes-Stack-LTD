import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import './workspace.css';

type MemoryKind = 'memory' | 'conversation' | 'decision' | 'handoff';

type MemoryItem = {
  id: string;
  text: string;
  createdAt: number;
  source: string;
  kind?: MemoryKind;
};

type WorkspaceProject = {
  id: string;
  name: string;
  goal: string;
  memory: MemoryItem[];
  updatedAt?: string;
};

type AuthState = 'checking' | 'guest' | 'signed-in';
type SyncState = 'local' | 'syncing' | 'synced' | 'error';

type AgentName = 'ChatGPT' | 'Claude' | 'Codex' | 'Gemini';

const AGENTS: AgentName[] = ['ChatGPT', 'Claude', 'Codex', 'Gemini'];
const AGENT_LINKS: Record<AgentName, string> = {
  ChatGPT: 'https://chatgpt.com/',
  Claude: 'https://claude.ai/new',
  Codex: 'https://chatgpt.com/codex',
  Gemini: 'https://gemini.google.com/app',
};
const APPS = [
  { name: 'GitHub', url: 'https://github.com/', note: 'Code + repos' },
  { name: 'Vercel', url: 'https://vercel.com/dashboard', note: 'Deployments' },
  { name: 'Canva', url: 'https://www.canva.com/', note: 'Design assets' },
];
const STORAGE_KEY = 'ashes-work-os-projects-v2';

const starterProject: WorkspaceProject = {
  id: 'ashes-demo',
  name: 'My first shared brain',
  goal: 'Keep every AI and connected app working from the same project context.',
  memory: [
    {
      id: 'welcome-memory',
      text: 'This project uses one shared memory. Save decisions or import a conversation once, then hand the same context to any AI.',
      createdAt: Date.now(),
      source: 'Ashes',
      kind: 'memory',
    },
  ],
};

function loadProjects(): WorkspaceProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [starterProject];
    const parsed = JSON.parse(raw) as WorkspaceProject[];
    return Array.isArray(parsed) && parsed.length ? parsed : [starterProject];
  } catch {
    return [starterProject];
  }
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.focus();
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  }
}

function memoryKindLabel(kind?: MemoryKind) {
  if (kind === 'conversation') return 'Conversation';
  if (kind === 'decision') return 'Decision';
  if (kind === 'handoff') return 'Handoff';
  return 'Memory';
}

export default function Workspace() {
  const initialProjects = useRef(loadProjects());
  const [projects, setProjects] = useState<WorkspaceProject[]>(initialProjects.current);
  const [activeProjectId, setActiveProjectId] = useState(initialProjects.current[0]?.id ?? starterProject.id);
  const [activeAgent, setActiveAgent] = useState<AgentName>('ChatGPT');
  const [memoryDraft, setMemoryDraft] = useState('');
  const [projectName, setProjectName] = useState('');
  const [importDraft, setImportDraft] = useState('');
  const [showImporter, setShowImporter] = useState(false);
  const [authState, setAuthState] = useState<AuthState>('checking');
  const [syncState, setSyncState] = useState<SyncState>('local');
  const [toast, setToast] = useState('');

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? projects[0],
    [projects, activeProjectId],
  );

  const contextPacket = useMemo(() => {
    if (!activeProject) return '';
    const timeline = activeProject.memory
      .slice(0, 40)
      .reverse()
      .map((item) => `[${memoryKindLabel(item.kind)} · ${item.source}] ${item.text}`)
      .join('\n\n');

    return [
      'ASHES WORK OS — SHARED PROJECT CONTEXT',
      `Project: ${activeProject.name}`,
      `Goal: ${activeProject.goal || 'No goal set yet.'}`,
      '',
      'You are continuing an existing project. Treat the context below as shared project memory. Do not ask the user to repeat information that is already here. Continue from the latest relevant state and preserve existing decisions unless the user changes them.',
      '',
      'SHARED MEMORY',
      timeline || 'No project memory has been saved yet.',
    ].join('\n');
  }, [activeProject]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    let cancelled = false;

    async function bootCloud() {
      try {
        const me = await fetch('/api/auth/me', { credentials: 'include' });
        if (!me.ok) {
          if (!cancelled) {
            setAuthState('guest');
            setSyncState('local');
          }
          return;
        }

        if (!cancelled) setAuthState('signed-in');
        const response = await fetch('/api/workspace', { credentials: 'include' });
        if (!response.ok) throw new Error('Cloud memory unavailable');
        const data = await response.json() as { projects?: WorkspaceProject[] };
        const cloudProjects = Array.isArray(data.projects) ? data.projects : [];

        if (cancelled) return;
        if (cloudProjects.length) {
          setProjects(cloudProjects);
          setActiveProjectId(cloudProjects[0].id);
          setSyncState('synced');
        } else {
          setSyncState('syncing');
          const seed = await fetch('/api/workspace', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'sync', projects: initialProjects.current, replace: true }),
          });
          if (!seed.ok) throw new Error('Could not create cloud brain');
          setSyncState('synced');
        }
      } catch {
        if (!cancelled) {
          setAuthState((current) => current === 'checking' ? 'guest' : current);
          setSyncState('error');
        }
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
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'sync', projects, replace: true }),
        });
        if (!response.ok) throw new Error('Sync failed');
        setSyncState('synced');
      } catch {
        setSyncState('error');
      }
    }, 700);

    return () => window.clearTimeout(timer);
  }, [projects, authState]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function updateActiveProject(patch: Partial<WorkspaceProject>) {
    if (!activeProject) return;
    setProjects((current) => current.map((project) => project.id === activeProject.id ? { ...project, ...patch } : project));
  }

  function createProject() {
    const name = projectName.trim();
    if (!name) return;
    const project: WorkspaceProject = {
      id: `project-${Date.now()}`,
      name,
      goal: 'Shared project context for every AI and connected app.',
      memory: [],
    };
    setProjects((current) => [project, ...current]);
    setActiveProjectId(project.id);
    setProjectName('');
  }

  function addMemory(kind: MemoryKind = 'memory', textOverride?: string, sourceOverride?: string) {
    const text = (textOverride ?? memoryDraft).trim();
    if (!text || !activeProject) return;
    const item: MemoryItem = {
      id: `memory-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      text,
      createdAt: Date.now(),
      source: sourceOverride || activeAgent,
      kind,
    };
    updateActiveProject({ memory: [item, ...activeProject.memory] });
    if (!textOverride) setMemoryDraft('');
  }

  function importConversation() {
    const text = importDraft.trim();
    if (!text) return;
    addMemory('conversation', text, activeAgent);
    setImportDraft('');
    setShowImporter(false);
    setToast('Conversation added to the shared brain');
  }

  async function copyContext() {
    const ok = await copyText(contextPacket);
    setToast(ok ? 'Shared context copied' : 'Could not copy context');
  }

  async function handoffTo(agent: AgentName) {
    setActiveAgent(agent);
    const ok = await copyText(contextPacket);
    const route = AGENT_LINKS[agent];
    window.open(route, '_blank', 'noopener,noreferrer');
    if (ok) {
      addMemory('handoff', `Context packet prepared for ${agent}.`, 'Ashes');
      setToast(`Context copied — paste it into ${agent}`);
    } else {
      setToast(`${agent} opened — copy the context packet manually`);
    }
  }

  function renameProject() {
    if (!activeProject) return;
    const next = window.prompt('Rename project', activeProject.name)?.trim();
    if (next) updateActiveProject({ name: next.slice(0, 120) });
  }

  function deleteProject() {
    if (!activeProject || projects.length <= 1) {
      setToast('Keep at least one project');
      return;
    }
    if (!window.confirm(`Delete “${activeProject.name}”?`)) return;
    const next = projects.filter((project) => project.id !== activeProject.id);
    setProjects(next);
    setActiveProjectId(next[0].id);
  }

  function exportProject() {
    if (!activeProject) return;
    const blob = new Blob([JSON.stringify(activeProject, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${activeProject.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'ashes-project'}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function importProjectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '')) as WorkspaceProject;
        if (!parsed?.name || !Array.isArray(parsed.memory)) throw new Error('Invalid file');
        const imported: WorkspaceProject = {
          ...parsed,
          id: `project-${Date.now()}`,
          name: `${parsed.name} (imported)`,
        };
        setProjects((current) => [imported, ...current]);
        setActiveProjectId(imported.id);
        setToast('Project imported');
      } catch {
        setToast('That file is not an Ashes project export');
      }
      event.target.value = '';
    };
    reader.readAsText(file);
  }

  if (!activeProject) return null;

  const syncLabel = authState === 'checking'
    ? 'Checking cloud…'
    : authState === 'guest'
      ? 'Local brain'
      : syncState === 'syncing'
        ? 'Syncing…'
        : syncState === 'error'
          ? 'Cloud sync issue'
          : 'Cloud brain synced';

  return (
    <main className="workos-shell">
      {toast && <div className="workos-toast">{toast}</div>}
      <aside className="workos-sidebar">
        <a className="workos-brand" href="/" aria-label="Back to Ashes Stack">
          <span className="workos-mark">A</span>
          <span>Ashes Work OS</span>
        </a>

        <div className="workos-new-project">
          <input
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && createProject()}
            placeholder="New project name"
            aria-label="New project name"
          />
          <button onClick={createProject} aria-label="Create project">+</button>
        </div>

        <p className="workos-label">PROJECTS</p>
        <div className="workos-project-list">
          {projects.map((project) => (
            <button
              key={project.id}
              className={project.id === activeProject.id ? 'is-active' : ''}
              onClick={() => setActiveProjectId(project.id)}
            >
              <span className="project-dot" />
              <span>{project.name}</span>
            </button>
          ))}
        </div>

        <div className="workos-sidebar-actions">
          <button onClick={exportProject}>Export project</button>
          <label>
            Import project
            <input type="file" accept="application/json,.json" onChange={importProjectFile} />
          </label>
        </div>

        <div className="workos-sidebar-bottom">
          <div><span className={`status-dot ${syncState === 'error' ? 'is-error' : ''}`} /> {syncLabel}</div>
          {authState === 'guest' ? <a href="/login">Sign in for cloud memory</a> : <a href="/">Back to Ashes Stack</a>}
        </div>
      </aside>

      <section className="workos-main">
        <header className="workos-topbar">
          <div>
            <p className="workos-eyebrow">SHARED PROJECT BRAIN</p>
            <div className="workos-title-row">
              <h1>{activeProject.name}</h1>
              <button onClick={renameProject}>Rename</button>
              <button className="danger" onClick={deleteProject}>Delete</button>
            </div>
          </div>
          <div className="workos-pill"><span className="status-dot" /> {syncLabel}</div>
        </header>

        <section className="workos-goal-bar">
          <span>PROJECT GOAL</span>
          <input
            value={activeProject.goal}
            onChange={(event) => updateActiveProject({ goal: event.target.value })}
            placeholder="What are all the AIs working toward?"
          />
        </section>

        <section className="workos-agent-strip" aria-label="AI agents">
          <div className="workos-agent-title">
            <span>Choose AI</span>
            <small>Same brain, different model</small>
          </div>
          <div className="workos-agent-buttons">
            {AGENTS.map((agent) => (
              <button
                key={agent}
                className={activeAgent === agent ? 'is-active' : ''}
                onClick={() => setActiveAgent(agent)}
              >
                <span className={`agent-orb agent-${agent.toLowerCase()}`} />
                {agent}
              </button>
            ))}
          </div>
        </section>

        <div className="workos-grid">
          <section className="workos-card workos-memory-card">
            <div className="workos-card-heading">
              <div>
                <p className="workos-eyebrow">UNIVERSAL MEMORY</p>
                <h2>Tell it once.</h2>
              </div>
              <span>{activeProject.memory.length} memories</span>
            </div>

            <p className="workos-muted">
              Add a decision or paste an existing AI conversation. Ashes turns the project into one portable context brain.
            </p>

            <div className="workos-composer">
              <textarea
                value={memoryDraft}
                onChange={(event) => setMemoryDraft(event.target.value)}
                placeholder={`Tell ${activeAgent} something the whole project should remember…`}
              />
              <div className="workos-composer-footer">
                <span>Saving as {activeAgent}</span>
                <div className="workos-composer-actions">
                  <button className="secondary" onClick={() => addMemory('decision')}>Save decision</button>
                  <button onClick={() => addMemory('memory')}>Save to brain</button>
                </div>
              </div>
            </div>

            <div className="workos-import-row">
              <button onClick={() => setShowImporter((current) => !current)}>
                {showImporter ? 'Close conversation import' : '+ Import an existing AI conversation'}
              </button>
              <button onClick={copyContext}>Copy full context packet</button>
            </div>

            {showImporter && (
              <div className="workos-importer">
                <textarea
                  value={importDraft}
                  onChange={(event) => setImportDraft(event.target.value)}
                  placeholder="Paste a ChatGPT, Claude, Codex or Gemini conversation here. It becomes shared project context."
                />
                <div>
                  <span>Source: {activeAgent}</span>
                  <button onClick={importConversation}>Add conversation to brain</button>
                </div>
              </div>
            )}

            <div className="workos-memory-list">
              {activeProject.memory.length === 0 ? (
                <div className="workos-empty">No memory yet. Add the first project decision above.</div>
              ) : (
                activeProject.memory.map((item) => (
                  <article key={item.id}>
                    <div>
                      <div className="memory-meta">
                        <strong>{item.source}</strong>
                        <span>{memoryKindLabel(item.kind)}</span>
                      </div>
                      <time>{new Date(item.createdAt).toLocaleString()}</time>
                    </div>
                    <p>{item.text}</p>
                  </article>
                ))
              )}
            </div>
          </section>

          <aside className="workos-right-column">
            <section className="workos-card workos-handoff-card">
              <div className="workos-card-heading compact">
                <div>
                  <p className="workos-eyebrow">ONE-CLICK HANDOFF</p>
                  <h2>Continue anywhere.</h2>
                </div>
              </div>
              <p className="workos-muted">Ashes copies this project's shared context, then opens your chosen AI. Paste once and continue without explaining the project again.</p>
              <div className="workos-handoff-buttons">
                {AGENTS.map((agent) => (
                  <button key={agent} onClick={() => handoffTo(agent)}>
                    <span className={`agent-orb agent-${agent.toLowerCase()}`} />
                    <span><strong>Open {agent}</strong><small>Copy shared context first</small></span>
                    <b>↗</b>
                  </button>
                ))}
              </div>
            </section>

            <section className="workos-card">
              <div className="workos-card-heading compact">
                <div>
                  <p className="workos-eyebrow">WORK APPS</p>
                  <h2>Launch your stack.</h2>
                </div>
              </div>
              <div className="workos-connections">
                {APPS.map((app) => (
                  <div key={app.name}>
                    <span className={`agent-orb agent-${app.name.toLowerCase()}`} />
                    <div>
                      <strong>{app.name}</strong>
                      <small>{app.note}</small>
                    </div>
                    <a href={app.url} target="_blank" rel="noreferrer">Open ↗</a>
                  </div>
                ))}
              </div>
              <p className="workos-footnote">Deep account actions will use official OAuth/MCP integrations. This V1 never asks for your ChatGPT or Claude password.</p>
            </section>

            <section className="workos-card workos-packet-card">
              <p className="workos-eyebrow">LIVE CONTEXT PACKET</p>
              <pre>{contextPacket}</pre>
              <button onClick={copyContext}>Copy packet</button>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
