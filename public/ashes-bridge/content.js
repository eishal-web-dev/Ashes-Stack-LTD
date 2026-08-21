(() => {
  const STORAGE_KEY = 'ashes-work-os-projects-v2';
  const ACTIVE_KEY = 'ashes-work-os-active-project-v1';
  const host = location.hostname;
  const isAshes = host === 'ashesstack.cloud' || host.endsWith('.ashesstack.cloud');

  const site = host === 'chatgpt.com' ? 'ChatGPT'
    : host === 'claude.ai' ? 'Claude'
    : host === 'gemini.google.com' ? 'Gemini'
    : 'Ashes';

  function storageGet(keys) {
    if (typeof browser !== 'undefined') return browser.storage.local.get(keys);
    return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
  }
  function storageSet(value) {
    if (typeof browser !== 'undefined') return browser.storage.local.set(value);
    return new Promise((resolve) => chrome.storage.local.set(value, resolve));
  }
  function postReady() {
    window.postMessage({ type: 'ASHES_BRIDGE_READY' }, location.origin);
  }

  if (isAshes) {
    let lastState = '';
    async function pushPageState() {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw || raw === lastState) return;
      try {
        const projects = JSON.parse(raw);
        if (!Array.isArray(projects)) return;
        const activeProjectId = localStorage.getItem(ACTIVE_KEY) || projects[0]?.id || '';
        lastState = raw;
        await storageSet({ ashesProjects: projects, ashesActiveProjectId: activeProjectId, ashesUpdatedAt: Date.now() });
      } catch {}
    }

    window.addEventListener('message', async (event) => {
      if (event.source !== window || event.origin !== location.origin) return;
      const data = event.data;
      if (data?.type === 'ASHES_WORKSPACE_PING') {
        postReady();
        return;
      }
      if (data?.type === 'ASHES_WORKSPACE_STATE' && Array.isArray(data.projects)) {
        const serialized = JSON.stringify(data.projects);
        lastState = serialized;
        localStorage.setItem(STORAGE_KEY, serialized);
        if (data.activeProjectId) localStorage.setItem(ACTIVE_KEY, data.activeProjectId);
        await storageSet({
          ashesProjects: data.projects,
          ashesActiveProjectId: data.activeProjectId || data.projects[0]?.id || '',
          ashesUpdatedAt: Date.now(),
        });
      }
    });

    const onStorageChanged = (changes, area) => {
      if (area !== 'local' || !changes.ashesProjects?.newValue) return;
      const projects = changes.ashesProjects.newValue;
      if (!Array.isArray(projects) || !projects.length) return;
      const serialized = JSON.stringify(projects);
      lastState = serialized;
      localStorage.setItem(STORAGE_KEY, serialized);
      const active = changes.ashesActiveProjectId?.newValue || localStorage.getItem(ACTIVE_KEY) || projects[0].id;
      localStorage.setItem(ACTIVE_KEY, active);
      window.postMessage({ type: 'ASHES_BRIDGE_PROJECTS', projects, activeProjectId: active }, location.origin);
    };
    if (typeof browser !== 'undefined') browser.storage.onChanged.addListener(onStorageChanged);
    else chrome.storage.onChanged.addListener(onStorageChanged);

    postReady();
    pushPageState();
    setInterval(pushPageState, 1200);
    return;
  }

  if (!['ChatGPT', 'Claude', 'Gemini'].includes(site)) return;

  let linked = false;
  let lastCaptured = '';
  let statusEl;
  let projectEl;
  let panelEl;
  let captureTimer;

  function hash(text) {
    let value = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      value ^= text.charCodeAt(i);
      value = Math.imul(value, 16777619);
    }
    return (value >>> 0).toString(36);
  }

  async function getBrain() {
    const data = await storageGet(['ashesProjects', 'ashesActiveProjectId']);
    const projects = Array.isArray(data.ashesProjects) ? data.ashesProjects : [];
    const activeId = data.ashesActiveProjectId || projects[0]?.id;
    const project = projects.find((item) => item.id === activeId) || projects[0];
    return { projects, project };
  }

  function buildContext(project) {
    const memory = Array.isArray(project?.memory) ? project.memory : [];
    const body = memory.slice(0, 24).reverse()
      .map((item) => `[${item.kind || 'memory'} · ${item.source || 'Ashes'}] ${item.text || ''}`)
      .join('\n\n');
    return [
      'ASHES SHARED PROJECT BRAIN',
      `Project: ${project?.name || 'Untitled'}`,
      `Goal: ${project?.goal || 'No goal set.'}`,
      '',
      'Continue this project using the shared context below. Do not ask me to repeat information already present. Preserve existing decisions unless I change them.',
      '',
      body || 'No shared memory yet.',
    ].join('\n').slice(-22000);
  }

  function extractChat() {
    let nodes = [];
    if (site === 'ChatGPT') {
      nodes = [...document.querySelectorAll('main [data-message-author-role]')];
    } else if (site === 'Claude') {
      nodes = [...document.querySelectorAll('main [data-testid*="user-message"], main [data-testid*="assistant"], main .font-claude-message')];
    } else {
      nodes = [...document.querySelectorAll('main user-query, main model-response, main .query-text, main .response-container')];
    }
    let text = nodes.map((node) => (node.innerText || node.textContent || '').trim()).filter(Boolean).join('\n\n');
    if (text.length < 40) {
      const main = document.querySelector('main');
      text = (main?.innerText || '').trim();
    }
    return text.slice(-12000);
  }

  async function saveChat(manual = false) {
    const text = extractChat();
    if (text.length < 40 || (!manual && text === lastCaptured)) return false;
    const { projects, project } = await getBrain();
    if (!project) {
      setStatus('Open Ashes Work OS first');
      return false;
    }
    lastCaptured = text;
    const memory = Array.isArray(project.memory) ? [...project.memory] : [];
    const id = `bridge-${site.toLowerCase()}-${hash(location.origin + location.pathname + location.search)}`;
    const existingIndex = memory.findIndex((item) => item.id === id);
    const item = { id, text, source: site, kind: 'conversation', createdAt: Date.now() };
    if (existingIndex >= 0) memory[existingIndex] = item;
    else memory.unshift(item);
    const nextProjects = projects.map((candidate) =>
      candidate.id === project.id ? { ...candidate, memory: memory.slice(0, 250), updatedAt: new Date().toISOString() } : candidate
    );
    await storageSet({ ashesProjects: nextProjects, ashesActiveProjectId: project.id, ashesUpdatedAt: Date.now() });
    if (manual) setStatus('Chat saved to brain');
    return true;
  }

  function findComposer() {
    const selectors = site === 'ChatGPT'
      ? ['#prompt-textarea', 'textarea', 'main [contenteditable="true"]']
      : site === 'Claude'
        ? ['main [contenteditable="true"]', 'textarea']
        : ['rich-textarea [contenteditable="true"]', 'main [contenteditable="true"]', 'textarea'];
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) return element;
    }
    return null;
  }

  async function injectBrain() {
    const { project } = await getBrain();
    if (!project) {
      setStatus('Open Ashes Work OS first');
      return;
    }
    const text = buildContext(project);
    const composer = findComposer();
    if (!composer) {
      try {
        await navigator.clipboard.writeText(text);
        setStatus('Brain copied — paste it');
      } catch {
        setStatus('Could not find prompt box');
      }
      return;
    }
    composer.focus();
    if ('value' in composer) {
      composer.value = text;
      composer.dispatchEvent(new Event('input', { bubbles: true }));
      composer.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      try {
        document.execCommand('selectAll', false);
        const inserted = document.execCommand('insertText', false, text);
        if (!inserted) throw new Error('insertText failed');
      } catch {
        composer.textContent = text;
        composer.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
      }
    }
    linked = true;
    await saveChat(true);
    setStatus('Brain loaded · chat linked');
  }

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text;
  }
  async function refreshProjectName() {
    const { project } = await getBrain();
    if (projectEl) projectEl.textContent = project?.name || 'Open Ashes Work OS';
  }

  function mountUi() {
    if (document.getElementById('ashes-bridge-root')) return;
    const root = document.createElement('div');
    root.id = 'ashes-bridge-root';
    Object.assign(root.style, { position: 'fixed', right: '18px', bottom: '18px', zIndex: '2147483647' });
    document.documentElement.appendChild(root);
    const shadow = root.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        *{box-sizing:border-box;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
        button{font:inherit}.pill{width:38px;height:38px;border-radius:12px;border:1px solid rgba(255,255,255,.18);background:#0d0d0d;color:#fff;font-weight:900;cursor:pointer;box-shadow:0 8px 35px rgba(0,0,0,.3)}
        .panel{display:none;position:absolute;right:0;bottom:48px;width:230px;border:1px solid #292929;background:#0d0d0d;color:#f1f1ee;border-radius:13px;padding:12px;box-shadow:0 18px 60px rgba(0,0,0,.45)}
        .panel.open{display:block}.title{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:2px}.title strong{font-size:11px}.site{font-size:8px;color:#666;text-transform:uppercase;letter-spacing:.12em}
        .project{font-size:10px;color:#aaa;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:9px 0 10px}.action{width:100%;border:0;border-radius:8px;padding:9px;margin-top:6px;cursor:pointer;font-size:10px;font-weight:700}
        .primary{background:#f1f1ed;color:#111}.secondary{background:#171717;color:#b7b7b2;border:1px solid #262626}.status{font-size:8px;color:#686868;line-height:1.4;margin-top:9px}.dot{width:6px;height:6px;background:#7ef3ad;border-radius:50%;display:inline-block;margin-right:5px}
      </style>
      <button class="pill" aria-label="Ashes Bridge">A</button>
      <div class="panel">
        <div class="title"><strong>Ashes Bridge</strong><span class="site">${site}</span></div>
        <div class="project">Loading project…</div>
        <button class="action primary use">Use project brain</button>
        <button class="action secondary save">Save this chat</button>
        <div class="status"><span class="dot"></span>Use the brain once. This tab then auto-syncs back to Ashes.</div>
      </div>`;
    panelEl = shadow.querySelector('.panel');
    statusEl = shadow.querySelector('.status');
    projectEl = shadow.querySelector('.project');
    shadow.querySelector('.pill').addEventListener('click', () => { panelEl.classList.toggle('open'); refreshProjectName(); });
    shadow.querySelector('.use').addEventListener('click', injectBrain);
    shadow.querySelector('.save').addEventListener('click', async () => { linked = true; await saveChat(true); });
    refreshProjectName();
  }

  mountUi();

  const observer = new MutationObserver(() => {
    if (!linked) return;
    clearTimeout(captureTimer);
    captureTimer = setTimeout(() => saveChat(false), 2600);
  });
  const target = document.querySelector('main') || document.body;
  if (target) observer.observe(target, { childList: true, subtree: true, characterData: true });

  setInterval(() => {
    refreshProjectName();
    if (linked) saveChat(false);
  }, 6000);
})();
