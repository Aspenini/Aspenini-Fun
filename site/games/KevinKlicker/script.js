/* Kevin Klicker - Complete Rewrite with Real-Time Updates */
class KevinKlicker {
  constructor() {
    this.elements = {
      score: document.getElementById('score'),
      cps: document.getElementById('cps'),
      perClick: document.getElementById('perClick'),
      kevinBtn: document.getElementById('kevinBtn'),
      pop: document.getElementById('pop'),
      shop: document.getElementById('shop'),
      resetBtn: document.getElementById('resetBtn')
    };

    this.items = [
      { 
        id: 'click+', 
        name: 'Stronger Click', 
        desc: '+1 per click', 
        baseCost: 15, 
        costScale: 1.15, 
        onBuy: s => s.perClick += 1,
        icon: '💪'
      },
      { 
        id: 'auto', 
        name: 'Auto‑Clicker', 
        desc: '+0.2 CPS each', 
        baseCost: 50, 
        costScale: 1.18, 
        onBuy: s => s.cps += 0.2,
        icon: '🤖'
      },
      { 
        id: 'crew', 
        name: 'Kevin Crew', 
        desc: '+2 CPS each', 
        baseCost: 300, 
        costScale: 1.20, 
        onBuy: s => s.cps += 2,
        icon: '👥'
      },
      { 
        id: 'billboard', 
        name: 'Billboard Hype', 
        desc: 'Clicks give +25% more', 
        baseCost: 750, 
        costScale: 1.28, 
        unique: true, 
        onBuy: s => s.clickMult *= 1.25,
        icon: '📢'
      },
      { 
        id: 'stadium', 
        name: 'Stadium Event', 
        desc: '+10 CPS, one‑time', 
        baseCost: 2000, 
        costScale: 1.00, 
        unique: true, 
        onBuy: s => s.cps += 10,
        icon: '🏟️'
      },
    ];

    this.defaultState = {
      score: 0,
      perClick: 1,
      clickMult: 1,
      cps: 0,
      inventory: {}
    };

    this.state = this.loadState();
    this.lastUpdate = performance.now();
    this.animationFrame = null;
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.render();
    this.startGameLoop();
    this.setupAutoSave();
    this.loadFromSDK();
  }

  loadState() {
    const saved = this.load();
    const state = Object.assign({}, this.defaultState, saved);
    
    // Ensure all fields exist
    for (const k of Object.keys(this.defaultState)) {
      if (state[k] === undefined) state[k] = this.defaultState[k];
    }
    if (!state.inventory) state.inventory = {};
    
    return state;
  }

  load() {
    // Try SDK first, fallback to localStorage
    if (window.Aspenini) {
      const saveData = window.Aspenini.load();
      if (saveData) return saveData;
    }
    try {
      return JSON.parse(localStorage.getItem('kevin-klicker-save') || '{}');
    } catch {
      return {};
    }
  }

  save() {
    localStorage.setItem('kevin-klicker-save', JSON.stringify(this.state));
    // Also save via SDK
    if (window.Aspenini) {
      window.Aspenini.save(this.state);
    }
  }

  setupEventListeners() {
    this.elements.kevinBtn.addEventListener('click', () => this.handleClick());
    this.elements.resetBtn.addEventListener('click', () => this.handleReset());
    
    // Keyboard support
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        this.handleClick();
      }
    });
  }

  handleClick() {
    const add = this.state.perClick * this.state.clickMult;
    this.state.score += add;
    this.showPopAnimation(add);
    this.render(); // Update everything including shop
  }

  showPopAnimation(amount) {
    this.elements.pop.textContent = `+${this.format(amount)}`;
    this.elements.pop.style.opacity = '1';
    this.elements.pop.style.transform = 'translateY(-6px) scale(1)';
    
    setTimeout(() => {
      this.elements.pop.style.opacity = '0';
      this.elements.pop.style.transform = 'translateY(10px) scale(.9)';
    }, 160);
  }

  startGameLoop() {
    const loop = (now) => {
      const dt = Math.min((now - this.lastUpdate) / 1000, 0.1); // Cap at 100ms for lag spikes
      this.lastUpdate = now;
      
      if (this.state.cps > 0) {
        const oldScore = this.state.score;
        this.state.score += this.state.cps * dt;
        
        // Only update if score actually changed (to avoid unnecessary renders)
        if (Math.floor(this.state.score) !== Math.floor(oldScore)) {
          this.render();
        }
      }
      
      this.animationFrame = requestAnimationFrame(loop);
    };
    
    this.animationFrame = requestAnimationFrame(loop);
  }

  calcCost(item) {
    const count = this.state.inventory[item.id] || 0;
    return Math.round(item.baseCost * Math.pow(item.costScale, count));
  }

  canAfford(item) {
    const cost = this.calcCost(item);
    const owned = this.state.inventory[item.id] || 0;
    return this.state.score >= cost && (!item.unique || owned === 0);
  }

  buyItem(item) {
    const cost = this.calcCost(item);
    
    if (!this.canAfford(item)) return false;
    
    this.state.score -= cost;
    this.state.inventory[item.id] = (this.state.inventory[item.id] || 0) + 1;
    item.onBuy(this.state);
    
    // Visual feedback
    this.showPurchaseFeedback(item);
    
    this.render();
    this.save();
    
    return true;
  }

  showPurchaseFeedback(item) {
    // Create a temporary notification
    const notification = document.createElement('div');
    notification.textContent = `✓ ${item.name} purchased!`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(45deg, #8a77ff, #4c9aff);
      color: white;
      padding: 12px 20px;
      border-radius: 10px;
      font-weight: 600;
      z-index: 10000;
      animation: slideIn 0.3s ease;
      box-shadow: 0 4px 15px rgba(138, 119, 255, 0.4);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }

  render() {
    this.renderStats();
    this.renderShop();
  }

  renderStats() {
    this.elements.score.textContent = this.format(this.state.score);
    this.elements.cps.textContent = this.format(this.state.cps);
    this.elements.perClick.textContent = this.format(this.state.perClick * this.state.clickMult);
  }

  renderShop() {
    // Clear shop
    this.elements.shop.innerHTML = '';
    
    // Create shop items
    this.items.forEach(item => {
      const owned = this.state.inventory[item.id] || 0;
      const cost = this.calcCost(item);
      const canBuy = this.canAfford(item);
      
      const itemEl = document.createElement('div');
      itemEl.className = 'item';
      if (!canBuy) itemEl.classList.add('disabled');
      
      const meta = document.createElement('div');
      meta.className = 'meta';
      
      const header = document.createElement('div');
      header.className = 'item-header';
      
      const icon = document.createElement('span');
      icon.className = 'item-icon';
      icon.textContent = item.icon;
      
      const title = document.createElement('h3');
      title.textContent = item.name;
      if (owned > 0) {
        const badge = document.createElement('span');
        badge.className = 'owned-badge';
        badge.textContent = `x${owned}`;
        title.appendChild(badge);
      }
      
      header.appendChild(icon);
      header.appendChild(title);
      
      const desc = document.createElement('p');
      desc.textContent = item.desc;
      
      meta.appendChild(header);
      meta.appendChild(desc);
      
      const buyBtn = document.createElement('button');
      buyBtn.className = 'buy';
      buyBtn.textContent = canBuy ? `Buy (${this.format(cost)})` : `Need ${this.format(cost)}`;
      buyBtn.disabled = !canBuy;
      
      if (item.unique && owned > 0) {
        buyBtn.textContent = 'Owned';
        buyBtn.disabled = true;
      }
      
      buyBtn.addEventListener('click', () => {
        if (this.buyItem(item)) {
          // Button will be updated by renderShop() call in buyItem
        }
      });
      
      itemEl.appendChild(meta);
      itemEl.appendChild(buyBtn);
      this.elements.shop.appendChild(itemEl);
    });
  }

  handleReset() {
    if (!confirm('Reset all progress? This cannot be undone!')) return;
    
    this.state = Object.assign({}, this.defaultState);
    this.state.inventory = {};
    this.save();
    this.render();
    
    // Show reset feedback
    const notification = document.createElement('div');
    notification.textContent = 'Progress reset!';
    notification.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(255, 107, 107, 0.9);
      color: white;
      padding: 20px 40px;
      border-radius: 15px;
      font-weight: 600;
      z-index: 10000;
      animation: fadeIn 0.3s ease;
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 1500);
  }

  setupAutoSave() {
    setInterval(() => {
      this.save();
    }, 3000);
  }

  loadFromSDK() {
    const load = () => {
      if (window.Aspenini) {
        const accountSave = window.Aspenini.load();
        if (accountSave && Object.keys(accountSave).length > 0) {
          this.state = Object.assign({}, this.defaultState, accountSave);
          // Ensure all fields exist
          for (const k of Object.keys(this.defaultState)) {
            if (this.state[k] === undefined) this.state[k] = this.defaultState[k];
          }
          if (!this.state.inventory) this.state.inventory = {};
          console.log('Loaded Kevin Klicker save from SDK');
          this.render();
        }
      }
    };
    
    if (window.Aspenini && window.Aspenini.ready) {
      load();
    } else {
      window.addEventListener('aspenini:ready', load, { once: true });
    }
  }

  format(n) {
    return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.kevinKlicker = new KevinKlicker();
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
    to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  }
  
  .item-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .item-icon {
    font-size: 1.2rem;
  }
  
  .owned-badge {
    display: inline-block;
    margin-left: 8px;
    padding: 2px 8px;
    background: rgba(138, 119, 255, 0.2);
    border: 1px solid rgba(138, 119, 255, 0.3);
    border-radius: 10px;
    font-size: 0.75rem;
    font-weight: 600;
    color: #8a77ff;
  }
  
  .item.disabled {
    opacity: 0.6;
  }
`;
document.head.appendChild(style);
