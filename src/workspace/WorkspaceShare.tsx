import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import './workspace-share.css';

type MemoryItem = { id: string; text: string; createdAt: number; source: string; kind?: string };
type SharedProject = { id: string; name: string; goal: string; memory: MemoryItem[]; updatedAt?: string };

function kindLabel(kind?: string) {
  if (kind === 'conversation') return 'chat';
  if (kind === 'decision') return 'decision';
  if (kind === 'handoff') return 'handoff';
  return 'memory';
}

export default function WorkspaceShare() {
  const { token = '' } = useParams();
  const [project, setProject] = useState<SharedProject | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/workspace?share=${encodeURIComponent(token)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'This shared Brain is unavailable.');
        if (!cancelled) setProject(data.project);
      })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'This shared Brain is unavailable.'); });
    return () => { cancelled = true; };
  }, [token]);

  if (error) {
    return <main className="shared-brain-page"><section className="shared-brain-card shared-error"><span>ASHES BRAIN</span><h1>Link unavailable.</h1><p>{error}</p><Link to="/workspace">Create your own Brain →</Link></section></main>;
  }

  if (!project) return <main className="shared-brain-page"><section className="shared-brain-card"><span>ASHES BRAIN</span><h1>Loading shared Brain…</h1></section></main>;

  return (
    <main className="shared-brain-page">
      <nav className="shared-brain-nav"><Link to="/">ASHES</Link><Link to="/workspace">Create your Brain</Link></nav>
      <section className="shared-brain-hero">
        <p>SHARED WITH ASHES</p>
        <h1>{project.name}</h1>
        <h2>{project.goal || 'One shared context across AI tools.'}</h2>
        <div className="shared-brain-flow"><span>ChatGPT</span><i>→</i><b>Ashes Brain</b><i>→</i><span>Claude · Codex · Gemini</span></div>
      </section>

      <section className="shared-brain-memory">
        <div className="shared-brain-title"><div><p>PROJECT MEMORY</p><h2>What the AIs know.</h2></div><span>{project.memory.length}</span></div>
        <div className="shared-brain-list">
          {project.memory.length === 0 ? <div className="shared-empty">No shared memory yet.</div> : project.memory.map((item) => (
            <article key={item.id}><small>{item.source} · {kindLabel(item.kind)}</small><p>{item.text}</p></article>
          ))}
        </div>
      </section>

      <section className="shared-brain-cta">
        <p>STOP EXPLAINING YOURSELF TO EVERY AI.</p>
        <h2>Tell one. All of them know.</h2>
        <Link to="/workspace/login">Create your Ashes Brain <b>↗</b></Link>
        <small>Keep the AI subscriptions you already use. Ashes gives them one shared project memory.</small>
      </section>
    </main>
  );
}
