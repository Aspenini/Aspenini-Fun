/* Kevin Klicker core game logic */
(() => {
  const scoreEl = document.getElementById('score');
  const cpsEl = document.getElementById('cps');
  const perClickEl = document.getElementById('perClick');
  const kevinBtn = document.getElementById('kevinBtn');
  const pop = document.getElementById('pop');
  const shopEl = document.getElementById('shop');
  const resetBtn = document.getElementById('resetBtn');
  const exportBtn = document.getElementById('exportBtn');
  const importFile = document.getElementById('importFile');

  const fmt = n => n.toLocaleString(undefined, {maximumFractionDigits:2});

  const baseItems = [
    { id:'click+', name:'Stronger Click', desc:'+1 per click', baseCost: 15, costScale: 1.15, onBuy: s => s.perClick += 1 },
    { id:'auto',  name:'Auto‑Clicker', desc:'+0.2 CPS each', baseCost: 50, costScale: 1.18, onBuy: s => s.cps += 0.2 },
    { id:'crew',  name:'Kevin Crew', desc:'+2 CPS each', baseCost: 300, costScale: 1.20, onBuy: s => s.cps += 2 },
    { id:'billboard', name:'Billboard Hype', desc:'Clicks give +25% more', baseCost: 750, costScale: 1.28, unique:true, onBuy: s => s.clickMult *= 1.25 },
    { id:'stadium', name:'Stadium Event', desc:'+10 CPS, one‑time', baseCost: 2000, costScale: 1.00, unique:true, onBuy: s => s.cps += 10 },
  ];

  const load = () => {
    try { return JSON.parse(localStorage.getItem('kevin-klicker-save') || '{}'); } catch { return {}; }
  }
  const save = (s) => localStorage.setItem('kevin-klicker-save', JSON.stringify(s));

  const defaultState = {
    score: 0,
    perClick: 1,
    clickMult: 1,
    cps: 0,
    inventory: {}, // id -> count
  };

  let state = Object.assign({}, defaultState, load());

  // Ensure all fields exist
  for (const k of Object.keys(defaultState)) {
    if (state[k] === undefined) state[k] = defaultState[k];
  }
  if (!state.inventory) state.inventory = {};

  function calcCost(item) {
    const count = state.inventory[item.id] || 0;
    return Math.round(item.baseCost * Math.pow(item.costScale, count));
  }

  function renderStats() {
    scoreEl.textContent = fmt(state.score);
    cpsEl.textContent = fmt(state.cps);
    perClickEl.textContent = fmt(state.perClick * state.clickMult);
  }

  function renderShop() {
    shopEl.innerHTML = '';
    for (const item of baseItems) {
      const owned = state.inventory[item.id] || 0;
      const cost = calcCost(item);
      const canBuy = state.score >= cost && (!item.unique || owned === 0);

      const wrap = document.createElement('div');
      wrap.className = 'item';

      const meta = document.createElement('div');
      meta.className = 'meta';

      const h3 = document.createElement('h3');
      h3.textContent = item.name + (owned ? ` x${owned}` : '');

      const p = document.createElement('p');
      p.textContent = `${item.desc} · Cost: ${fmt(cost)}`;

      meta.appendChild(h3); meta.appendChild(p);

      const btn = document.createElement('button');
      btn.className = 'buy';
      btn.textContent = 'Buy';
      btn.disabled = !canBuy;

      btn.addEventListener('click', () => {
        const price = calcCost(item);
        if (state.score < price) return;
        state.score -= price;
        state.inventory[item.id] = (state.inventory[item.id] || 0) + 1;
        item.onBuy(state);
        renderStats(); renderShop(); save(state);
      });

      wrap.appendChild(meta); wrap.appendChild(btn);
      shopEl.appendChild(wrap);
    }
  }

  function clickKevin() {
    const add = state.perClick * state.clickMult;
    state.score += add;
    pop.textContent = `+${fmt(add)}`;
    pop.style.opacity = 1;
    pop.style.transform = 'translateY(-6px) scale(1)';
    setTimeout(() => {
      pop.style.opacity = 0;
      pop.style.transform = 'translateY(10px) scale(.9)';
    }, 160);
    renderStats();
  }

  kevinBtn.addEventListener('click', clickKevin);

  // Passive income loop
  let last = performance.now();
  function loop(now) {
    const dt = (now - last) / 1000;
    last = now;
    state.score += state.cps * dt;
    renderStats();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // Auto-save
  setInterval(() => save(state), 3000);

  // Reset
  resetBtn.addEventListener('click', () => {
    if (!confirm('Reset all progress?')) return;
    state = JSON.parse(JSON.stringify(defaultState));
    save(state);
    renderStats(); renderShop();
  });

  // Export / Import
  exportBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const data = JSON.stringify(state);
    const blob = new Blob([data], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'kevin-klicker-save.json';
    a.click();
    URL.revokeObjectURL(url);
  });
  importFile.addEventListener('change', async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const text = await f.text();
      const incoming = JSON.parse(text);
      state = Object.assign({}, defaultState, incoming);
      save(state);
      renderStats(); renderShop();
      alert('Save imported!');
    } catch {
      alert('Invalid save file.');
    }
  });

  // First render
  renderStats(); renderShop();
})();
