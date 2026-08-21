(() => {
  const STORAGE_KEY = 'ashes-work-os-projects-v2';
  const ACTIVE_KEY = 'ashes-work-os-active-project-v1';
  const host = location.hostname;
  const isAshes = host === 'ashesstack.cloud' || host.endsWith('.ashesstack.cloud');
  const site = host === 'chatgpt.com' ? 'ChatGPT'
    : host === 'claude.ai' ? 'Claude'
    : host === 'gemini.google.com' ? 'Gemini'
    : 'Ashes';

  const storageGet = (keys) => typeof browser !== 'undefined'
    ? browser.storage.local.get(keys)
    : new Promise((resolve) => chrome.storage.local.get(keys, resolve));
  const storageSet = (value) => typeof browser !== 'undefined'
    ? browser.storage.local.set(value)
    : new Promise((resolve) => chrome.storage.local.set(value, resolve));

  async function postReady() {
    const state = await storageGet(['ashesAutoSync']);
    window.postMessage({ type: 'ASHES_BRIDGE_READY', autoSync: state.ashesAutoSync === true }, location.origin);
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
        await postReady();
        return;
      }
      if (data?.type === 'ASHES_SET_AUTO_SYNC') {
        const enabled = data.enabled === true;
        await storageSet({ ashesAutoSync: enabled });
        window.postMessage({ type: 'ASHES_AUTO_SYNC_STATE', enabled }, location.origin);
        return;
      }
      if (data?.type === 'ASHES_OPEN_AGENT') {
        await storageSet({
          ashesAutoSync: true,
          ashesPendingTarget: data.targetSite || data.agent,
          ashesPendingAgent: data.agent,
          ashesPendingProjectId: data.projectId || '',
          ashesPendingAt: Date.now(),
        });
        window.postMessage({ type: 'ASHES_HANDOFF_READY', agent: data.agent }, location.origin);
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
      if (area !== 'local') return;
      if (changes.ashesAutoSync) {
        window.postMessage({ type: 'ASHES_AUTO_SYNC_STATE', enabled: changes.ashesAutoSync.newValue === true }, location.origin);
      }
      if (!changes.ashesProjects?.newValue) return;
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
  let autoSync = false;
  let lastCaptured = '';
  let captureTimer;
  let indicator;

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
      'Use the shared project context below. Do not ask me to repeat information already here. Preserve existing decisions unless I change them.',
      '',
      body || 'No shared memory yet.',
      '',
      'My next instruction: ',
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
    if (text.length < 40) text = (document.querySelector('main')?.innerText || '').trim();
    return text.slice(-12000);
  }

  async function saveChat() {
    if (!linked || !autoSync) return false;
    const text = extractChat();
    if (text.length < 40 || text === lastCaptured) return false;
    const { projects, project } = await getBrain();
    if (!project) return false;
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

  async function waitForComposer(timeout = 12000) {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      const composer = findComposer();
      if (composer) return composer;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    return null;
  }

  function setComposer(composer, text) {
    composer.focus();
    if ('value' in composer) {
      const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(composer), 'value')?.set;
      if (setter) setter.call(composer, text); else composer.value = text;
      composer.dispatchEvent(new Event('input', { bubbles: true }));
      composer.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }
    try {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(composer);
      selection?.removeAllRanges();
      selection?.addRange(range);
      const inserted = document.execCommand('insertText', false, text);
      if (!inserted) throw new Error('insertText failed');
    } catch {
      composer.textContent = text;
      composer.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
    }
  }

  async function injectBrain() {
    const { project } = await getBrain();
    if (!project) return false;
    const composer = await waitForComposer();
    if (!composer) return false;
    setComposer(composer, buildContext(project));
    linked = true;
    updateIndicator();
    return true;
  }

  function updateIndicator() {
    if (!indicator) return;
    indicator.style.opacity = autoSync ? '1' : '.45';
    indicator.style.borderColor = autoSync ? '#7ef3ad' : '#3b3b3b';
    indicator.title = autoSync ? 'Ashes is syncing this AI to your active project' : 'Click to connect Ashes';
  }

  function mountIndicator() {
    if (document.getElementById('ashes-bridge-root')) return;
    const root = document.createElement('div');
    root.id = 'ashes-bridge-root';
    Object.assign(root.style, { position: 'fixed', right: '16px', bottom: '16px', zIndex: '2147483647' });
    document.documentElement.appendChild(root);
    const shadow = root.attachShadow({ mode: 'open' });
    shadow.innerHTML = `<button aria-label="Ashes Bridge" style="width:32px;height:32px;border-radius:10px;border:1px solid #3b3b3b;background:#0d0d0d;color:#fff;font:800 12px system-ui;cursor:pointer;box-shadow:0 8px 30px rgba(0,0,0,.25)">A</button>`;
    indicator = shadow.querySelector('button');
    indicator.addEventListener('click', async () => {
      autoSync = !autoSync;
      linked = autoSync;
      await storageSet({ ashesAutoSync: autoSync });
      updateIndicator();
      if (autoSync) saveChat();
    });
    updateIndicator();
  }

  async function boot() {
    const state = await storageGet(['ashesAutoSync', 'ashesPendingTarget', 'ashesPendingProjectId', 'ashesPendingAt']);
    autoSync = state.ashesAutoSync === true;
    linked = autoSync;
    mountIndicator();

    const pendingFresh = Date.now() - Number(state.ashesPendingAt || 0) < 90000;
    if (pendingFresh && state.ashesPendingTarget === site) {
      if (state.ashesPendingProjectId) await storageSet({ ashesActiveProjectId: state.ashesPendingProjectId });
      autoSync = true;
      linked = true;
      await storageSet({ ashesAutoSync: true });
      await injectBrain();
      await storageSet({ ashesPendingTarget: '', ashesPendingAgent: '', ashesPendingProjectId: '', ashesPendingAt: 0 });
      updateIndicator();
    } else if (autoSync) {
      setTimeout(() => saveChat(), 1600);
    }
  }

  const observer = new MutationObserver(() => {
    if (!linked || !autoSync) return;
    clearTimeout(captureTimer);
    captureTimer = setTimeout(() => saveChat(), 2200);
  });
  const target = document.querySelector('main') || document.body;
  if (target) observer.observe(target, { childList: true, subtree: true, characterData: true });

  const onStorageChanged = (changes, area) => {
    if (area !== 'local') return;
    if (changes.ashesAutoSync) {
      autoSync = changes.ashesAutoSync.newValue === true;
      linked = autoSync;
      updateIndicator();
    }
  };
  if (typeof browser !== 'undefined') browser.storage.onChanged.addListener(onStorageChanged);
  else chrome.storage.onChanged.addListener(onStorageChanged);

  boot();
  setInterval(() => { if (linked && autoSync) saveChat(); }, 5500);
})();
