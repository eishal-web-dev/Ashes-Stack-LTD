import { useEffect, useMemo, useRef, useState } from 'react';
import './workspace.css';

type MemoryKind = 'memory' | 'conversation' | 'decision' | 'handoff';
type MemoryItem = { id: string; text: string; createdAt: number; source: string; kind?: MemoryKind; };
type WorkspaceProject = { id: string; name: string; goal: string; memory: MemoryItem[]; updatedAt?: string; };
type AgentName = 'ChatGPT' | 'Claude' | 'Codex' | 'Gemini';
type AuthState = 'checking' | 'guest' | 'signed-in';
type SyncState = 'local' | 'syncing' | 'synced' | 'error';

const AGENTS: AgentName[] = ['ChatGPT', 'Claude', 'Codex', 'Gemini'];
const AGENT_LINKS: Record<AgentName, string> = {
  ChatGPT: 'https://chatgpt.com/',
  Claude: 'https://claude.ai/new',
  Codex: 'https://chatgpt.com/codex',
  Gemini: 'https://gemini.google.com/app',
};
const STORAGE_KEY = 'ashes-work-os-projects-v2';
const ACTIVE_KEY = 'ashes-work-os-active-project-v1';

const starterProject: WorkspaceProject = {
  id: 'ashes-demo',
  name: 'My shared brain',
  goal: 'Keep every AI working from the same project context.',
  memory: [{
    id: 'welcome-memory',
    text: 'Install the Ashes Bridge, link a chat once, and that conversation can become shared context for the other supported AIs.',
    createdAt: Date.now(),
    source: 'Ashes',
    kind: 'memory',
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
    document.body.appendChild(area); area.select();
    const ok = document.execCommand('copy'); area.remove(); return ok;
  }
}

export default function Workspace() {
  const initial = useRef(loadProjects());
  const [projects, setProjects] = useState<WorkspaceProject[]>(initial.current);
  const [activeProjectId, setActiveProjectId] = useState(
    () => localStorage.getItem(ACTIVE_KEY) || initial.current[0]?.id || starterProject.id,
  );
  const [activeAgent, setActiveAgent] = useState<AgentName>('ChatGPT');
  const [draft, setDraft] = useState('');
  const [projectName, setProjectName] = useState('');
  const [importDraft, setImportDraft] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [bridgeReady, setBridgeReady] = useState(false);
  const [authState, setAuthState] = useState<AuthState>('checking');
  const [syncState, setSyncState] = useState<SyncState>('local');
  const [toast, setToast] = useState('');

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? projects[0],
    [projects, activeProjectId],
  );

  const contextPacket = useMemo(() => {
    if (!activeProject) return '';
    const memory = activeProject.memory.slice(0, 24).reverse()
      .map((item) => `[${kindLabel(item.kind)} · ${item.source}] ${item.text}`).join('\n\n');
    return [
      'ASHES SHARED PROJECT BRAIN',
      `Project: ${activeProject.name}`,
      `Goal: ${activeProject.goal || 'No goal set.'}`,
      '',
      'Continue this project using the shared context below. Do not ask the user to repeat information already present. Preserve existing decisions unless the user changes them.',
      '',
      memory || 'No shared memory yet.',
    ].join('\n').slice(-22000);
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
      if (data?.type === 'ASHES_BRIDGE_READY') { setBridgeReady(true); return; }
      if (data?.type === 'ASHES_BRIDGE_PROJECTS' && Array.isArray(data.projects) && data.projects.length) {
        const incoming = data.projects as WorkspaceProject[];
        setProjects(incoming);
        if (data.activeProjectId && incoming.some((project) => project.id === data.activeProjectId)) {
          setActiveProjectId(data.activeProjectId);
        }
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
        const me = await fetch('/api/auth/me', { credentials: 'include' });
        if (!me.ok) {
          if (!cancelled) { setAuthState('guest'); setSyncState('local'); }
          return;
        }
        if (!cancelled) setAuthState('signed-in');
        const response = await fetch('/api/workspace', { credentials: 'include' });
        if (!response.ok) throw new Error('Cloud unavailable');
        const data = await response.json() as { projects?: WorkspaceProject[] };
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
    const timer = window.setTimeout(() => setToast(''), 2000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function updateActive(patch: Partial<WorkspaceProject>) {
    if (!activeProject) return;
    setProjects((current) => current.map((project) => project.id === activeProject.id ? { ...project, ...patch } : project));
  }

  function createProject() {
    const name = projectName.trim(); if (!name) return;
    const project: WorkspaceProject = { id: `project-${Date.now()}`, name, goal: 'One shared context across my AI tools.', memory: [] };
    setProjects((current) => [project, ...current]); setActiveProjectId(project.id); setProjectName('');
  }

  function addMemory(kind: MemoryKind = 'memory', textOverride?: string, sourceOverride?: string) {
    const text = (textOverride ?? draft).trim(); if (!text || !activeProject) return;
    const item: MemoryItem = {
      id: `memory-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      text: text.slice(0, 12000), createdAt: Date.now(), source: sourceOverride || activeAgent, kind,
    };
    updateActive({ memory: [item, ...activeProject.memory].slice(0, 250) });
    if (!textOverride) setDraft('');
  }

  function importConversation() {
    const text = importDraft.trim(); if (!text) return;
    addMemory('conversation', text, activeAgent); setImportDraft(''); setShowImport(false); setToast('Chat added to brain');
  }

  async function copyContext() { setToast(await copyText(contextPacket) ? 'Context copied' : 'Copy failed'); }

  async function openAgent(agent: AgentName) {
    setActiveAgent(agent); await copyText(contextPacket);
    window.open(AGENT_LINKS[agent], '_blank', 'noopener,noreferrer');
    addMemory('handoff', `Prepared shared context for ${agent}.`, 'Ashes');
    setToast(bridgeReady ? `Open ${agent} and use the Ashes bubble` : `Context copied for ${agent}`);
  }

  function removeMemory(id: string) {
    if (!activeProject) return;
    updateActive({ memory: activeProject.memory.filter((item) => item.id !== id) });
  }

  function deleteProject() {
    if (!activeProject || projects.length === 1) { setToast('Keep one project'); return; }
    if (!window.confirm(`Delete “${activeProject.name}”?`)) return;
    const next = projects.filter((project) => project.id !== activeProject.id);
    setProjects(next); setActiveProjectId(next[0].id);
  }

  if (!activeProject) return null;

  const syncLabel = authState === 'checking' ? 'checking' : authState === 'guest' ? 'local'
    : syncState === 'syncing' ? 'syncing' : syncState === 'error' ? 'sync issue' : 'cloud synced';

  return (
    <main className="brain-shell">
      {toast && <div className="brain-toast">{toast}</div>}
      <aside className="brain-sidebar">
        <a href="/" className="brain-brand"><span>A</span> Ashes</a>
        <div className="brain-create">
          <input value={projectName} onChange={(e) => setProjectName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createProject()} placeholder="New project" />
          <button onClick={createProject}>+</button>
        </div>
        <nav className="brain-projects">
          {projects.map((project) => (
            <button key={project.id} className={project.id === activeProject.id ? 'active' : ''}
              onClick={() => setActiveProjectId(project.id)}>{project.name}</button>
          ))}
        </nav>
        <div className="brain-sidebar-bottom">
          <span><i className={syncState === 'error' ? 'error' : ''} />{syncLabel}</span>
          {authState === 'guest' && <a href="/login">Sign in for cloud</a>}
          <a href="/">Back home</a>
        </div>
      </aside>

      <section className="brain-main">
        <header className="brain-header">
          <div>
            <p>SHARED BRAIN</p><h1>{activeProject.name}</h1>
            <input className="brain-goal" value={activeProject.goal}
              onChange={(e) => updateActive({ goal: e.target.value })} aria-label="Project goal" />
          </div>
          <button className="brain-quiet danger" onClick={deleteProject}>Delete</button>
        </header>

        <div className="brain-agents">
          {AGENTS.map((agent) => <button key={agent} className={activeAgent === agent ? 'active' : ''}
            onClick={() => setActiveAgent(agent)}>{agent}</button>)}
        </div>

        <div className="brain-layout">
          <section className="brain-panel brain-memory">
            <div className="brain-panel-title"><div><p>MEMORY</p><h2>Tell it once.</h2></div><span>{activeProject.memory.length}</span></div>
            <div className="brain-composer">
              <textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="What should every AI know?" />
              <div><button className="brain-quiet" onClick={() => addMemory('decision')}>Decision</button><button onClick={() => addMemory('memory')}>Save</button></div>
            </div>
            <div className="brain-memory-list">
              {activeProject.memory.length === 0 ? <div className="brain-empty">No memory yet.</div> : activeProject.memory.map((item) => (
                <article key={item.id}>
                  <div><span>{item.source} · {kindLabel(item.kind)}</span><button onClick={() => removeMemory(item.id)} aria-label="Remove memory">×</button></div>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </section>

          <aside className="brain-side">
            <section className="brain-panel bridge-panel">
              <div className="bridge-status"><span className={bridgeReady ? 'on' : ''} /><div><strong>Browser bridge</strong><small>{bridgeReady ? 'connected' : 'not installed'}</small></div></div>
              <p>Link a ChatGPT, Claude or Gemini chat once. Ashes keeps that chat synced to this project and can inject the same brain into the next AI.</p>
              <a className="bridge-download" href="/ashes-bridge.zip" download>Download bridge</a>
              <details><summary>Install steps</summary><ol>
                <li>Unzip the file.</li><li>Firefox: open <b>about:debugging</b> → This Firefox → Load Temporary Add-on.</li>
                <li>Select <b>manifest.json</b>.</li><li>Refresh this page.</li>
              </ol></details>
            </section>

            <section className="brain-panel">
              <div className="brain-panel-title compact"><div><p>CONTINUE IN</p><h2>Same brain.</h2></div></div>
              <div className="brain-open-list">
                {AGENTS.map((agent) => <button key={agent} onClick={() => openAgent(agent)}><span>{agent}</span><b>↗</b></button>)}
              </div>
            </section>

            <section className="brain-panel brain-small-actions">
              <button onClick={() => setShowImport((v) => !v)}>Import chat</button>
              <button onClick={copyContext}>Copy context</button>
              {showImport && <div className="brain-import">
                <textarea value={importDraft} onChange={(e) => setImportDraft(e.target.value)} placeholder={`Paste a ${activeAgent} chat`} />
                <button onClick={importConversation}>Add to brain</button>
              </div>}
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
