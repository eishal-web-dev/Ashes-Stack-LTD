import { useEffect, useMemo, useState } from 'react';
import './workspace.css';

type MemoryItem = {
  id: string;
  text: string;
  createdAt: number;
  source: string;
};

type WorkspaceProject = {
  id: string;
  name: string;
  goal: string;
  memory: MemoryItem[];
};

const AGENTS = ['ChatGPT', 'Claude', 'Codex', 'Gemini'];
const APPS = ['GitHub', 'Vercel', 'Canva'];
const STORAGE_KEY = 'ashes-work-os-projects-v1';

const starterProject: WorkspaceProject = {
  id: 'ashes-demo',
  name: 'My first shared brain',
  goal: 'Keep every AI and connected app working from the same project context.',
  memory: [
    {
      id: 'welcome-memory',
      text: 'This project uses one shared memory. Anything saved here is available no matter which AI you switch to.',
      createdAt: Date.now(),
      source: 'Ashes',
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

export default function Workspace() {
  const [projects, setProjects] = useState<WorkspaceProject[]>(loadProjects);
  const [activeProjectId, setActiveProjectId] = useState(() => loadProjects()[0]?.id ?? starterProject.id);
  const [activeAgent, setActiveAgent] = useState('ChatGPT');
  const [memoryDraft, setMemoryDraft] = useState('');
  const [projectName, setProjectName] = useState('');

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? projects[0],
    [projects, activeProjectId],
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  function createProject() {
    const name = projectName.trim();
    if (!name) return;

    const project: WorkspaceProject = {
      id: `project-${Date.now()}`,
      name,
      goal: 'Shared project context for every connected AI and app.',
      memory: [],
    };

    setProjects((current) => [...current, project]);
    setActiveProjectId(project.id);
    setProjectName('');
  }

  function addMemory() {
    const text = memoryDraft.trim();
    if (!text || !activeProject) return;

    const item: MemoryItem = {
      id: `memory-${Date.now()}`,
      text,
      createdAt: Date.now(),
      source: activeAgent,
    };

    setProjects((current) =>
      current.map((project) =>
        project.id === activeProject.id
          ? { ...project, memory: [item, ...project.memory] }
          : project,
      ),
    );
    setMemoryDraft('');
  }

  if (!activeProject) return null;

  return (
    <main className="workos-shell">
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
          <button onClick={createProject}>+</button>
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

        <div className="workos-sidebar-bottom">
          <div><span className="status-dot" /> Free preview</div>
          <a href="/">Back to Ashes Stack</a>
        </div>
      </aside>

      <section className="workos-main">
        <header className="workos-topbar">
          <div>
            <p className="workos-eyebrow">SHARED PROJECT BRAIN</p>
            <h1>{activeProject.name}</h1>
          </div>
          <div className="workos-pill"><span className="status-dot" /> Memory online</div>
        </header>

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
              Save project decisions here. Switch from ChatGPT to Claude or Codex and the context stays with the project.
            </p>

            <div className="workos-composer">
              <textarea
                value={memoryDraft}
                onChange={(event) => setMemoryDraft(event.target.value)}
                placeholder={`Tell ${activeAgent} something the whole project should remember…`}
              />
              <div className="workos-composer-footer">
                <span>Saving as {activeAgent}</span>
                <button onClick={addMemory}>Save to brain</button>
              </div>
            </div>

            <div className="workos-memory-list">
              {activeProject.memory.length === 0 ? (
                <div className="workos-empty">No memory yet. Add the first project decision above.</div>
              ) : (
                activeProject.memory.map((item) => (
                  <article key={item.id}>
                    <div>
                      <strong>{item.source}</strong>
                      <time>{new Date(item.createdAt).toLocaleString()}</time>
                    </div>
                    <p>{item.text}</p>
                  </article>
                ))
              )}
            </div>
          </section>

          <aside className="workos-right-column">
            <section className="workos-card">
              <div className="workos-card-heading compact">
                <div>
                  <p className="workos-eyebrow">CONNECTIONS</p>
                  <h2>Your tools</h2>
                </div>
              </div>

              <div className="workos-connections">
                {[...AGENTS, ...APPS].map((app) => (
                  <div key={app}>
                    <span className={`agent-orb agent-${app.toLowerCase()}`} />
                    <div>
                      <strong>{app}</strong>
                      <small>{AGENTS.includes(app) ? 'AI context bridge' : 'App integration'}</small>
                    </div>
                    <button title={`${app} connection will use its official integration method`}>Connect</button>
                  </div>
                ))}
              </div>
              <p className="workos-footnote">Connections will use official OAuth, MCP, API or provider-supported integrations.</p>
            </section>

            <section className="workos-card workos-handoff">
              <p className="workos-eyebrow">HANDOFF</p>
              <h2>{activeAgent} knows the project.</h2>
              <p>
                {activeProject.memory[0]?.text ?? 'Add shared memory and every supported agent will receive the same project context.'}
              </p>
              <div className="handoff-route">
                <span>YOU</span><b>→</b><span>ASHES BRAIN</span><b>→</b><span>{activeAgent.toUpperCase()}</span>
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
