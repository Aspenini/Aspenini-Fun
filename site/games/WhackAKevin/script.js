// Whack-A-Kevin Game
class WhackAKevin {
    constructor() {
        this.boardSize = 3; // 3x3 grid
        this.holes = [];
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('whackAKevinBest') || '0');
        this.level = 1;
        this.lives = 3;
        this.maxLives = 3;
        this.gameRunning = false;
        this.isPaused = false;
        this.currentKevin = null;
        this.spawnTimer = 0;
        this.spawnInterval = 2000; // Start with 2 seconds
        this.kevinVisibleTime = 1500; // Kevin stays visible for 1.5 seconds
        this.lastUpdate = performance.now();
        this.animationFrameId = null;
        this.pendingTimeouts = []; // Track all timeouts for cleanup
        
        this.elements = {
            score: document.getElementById('score'),
            bestScore: document.getElementById('bestScore'),
            level: document.getElementById('level'),
            lives: document.getElementById('lives'),
            gameBoard: document.getElementById('gameBoard'),
            gameButton: document.getElementById('gameButton')
        };
        
        this.init();
    }
    
    clearAllTimeouts() {
        this.pendingTimeouts.forEach(timeout => clearTimeout(timeout));
        this.pendingTimeouts = [];
    }
    
    addTimeout(callback, delay) {
        const timeout = setTimeout(() => {
            this.pendingTimeouts = this.pendingTimeouts.filter(t => t !== timeout);
            callback();
        }, delay);
        this.pendingTimeouts.push(timeout);
        return timeout;
    }
    
    init() {
        this.loadSaveData();
        this.createBoard();
        this.bindEvents();
        this.updateDisplay();
    }
    
    createBoard() {
        this.elements.gameBoard.innerHTML = '';
        this.holes = [];
        
        for (let i = 0; i < this.boardSize * this.boardSize; i++) {
            const hole = document.createElement('div');
            hole.className = 'hole';
            hole.dataset.index = i;
            
            // Create death indicator container
            const deathIndicator = document.createElement('div');
            deathIndicator.className = 'death-indicator';
            deathIndicator.innerHTML = '❌';
            deathIndicator.style.display = 'none';
            
            const kevin = document.createElement('div');
            kevin.className = 'kevin';
            kevin.style.display = 'none';
            kevin.innerHTML = '<img src="kevin_stand.png" alt="Kevin">';
            
            hole.appendChild(deathIndicator);
            hole.appendChild(kevin);
            this.elements.gameBoard.appendChild(hole);
            this.holes.push({ 
                element: hole, 
                kevin: kevin, 
                deathIndicator: deathIndicator,
                misses: 0,
                index: i 
            });
            
            // Add click handler
            kevin.addEventListener('click', () => this.whackKevin(i));
        }
    }
    
    bindEvents() {
        if (this.elements.gameButton) {
            this.elements.gameButton.addEventListener('click', () => {
                if (!this.gameRunning) {
                    this.startGame();
                } else {
                    this.togglePause();
                }
            });
        }
        
        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'Enter') {
                e.preventDefault();
                if (!this.gameRunning) {
                    this.startGame();
                } else if (this.isPaused) {
                    this.togglePause();
                }
            }
            if (e.code === 'KeyP') {
                this.togglePause();
            }
        });
    }
    
    startGame() {
        // Clean up any existing game state
        this.stopGame();
        
        this.gameRunning = true;
        this.isPaused = false;
        this.score = 0;
        this.level = 1;
        this.lives = this.maxLives;
        this.spawnInterval = 2000;
        this.kevinVisibleTime = 1500;
        this.currentKevin = null;
        this.spawnTimer = 0;
        
        // Reset all holes
        this.holes.forEach(hole => {
            hole.kevin.style.display = 'none';
            hole.kevin.classList.remove('visible', 'missed', 'whacked');
            hole.misses = 0;
            hole.deathIndicator.style.display = 'none';
        });
        
        this.updateButton();
        this.updateDisplay();
        this.lastUpdate = performance.now();
        this.gameLoop();
    }
    
    stopGame() {
        this.gameRunning = false;
        this.isPaused = false;
        this.currentKevin = null;
        
        // Cancel animation frame
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // Clear all pending timeouts
        this.clearAllTimeouts();
        
        // Hide all Kevins
        this.holes.forEach(hole => {
            hole.kevin.style.display = 'none';
            hole.kevin.classList.remove('visible', 'missed', 'whacked');
        });
    }
    
    togglePause() {
        if (!this.gameRunning) return;
        
        this.isPaused = !this.isPaused;
        this.updateButton();
        
        if (this.isPaused) {
            // Cancel animation frame when pausing
            if (this.animationFrameId !== null) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
        } else {
            // Resume game loop
            this.lastUpdate = performance.now();
            this.gameLoop();
        }
    }
    
    updateButton() {
        if (this.elements.gameButton) {
            if (!this.gameRunning) {
                this.elements.gameButton.textContent = 'Start';
            } else if (this.isPaused) {
                this.elements.gameButton.textContent = 'Resume';
            } else {
                this.elements.gameButton.textContent = 'Pause';
            }
        }
    }
    
    gameLoop() {
        if (!this.gameRunning || this.isPaused) {
            this.animationFrameId = null;
            return;
        }
        
        const now = performance.now();
        const dt = Math.min((now - this.lastUpdate) / 1000, 0.1);
        this.lastUpdate = now;
        
        // Update spawn timer
        this.spawnTimer += dt * 1000;
        
        // Spawn Kevin if timer is up and no Kevin is currently visible
        if (this.spawnTimer >= this.spawnInterval && !this.currentKevin && this.gameRunning) {
            this.spawnKevin();
            this.spawnTimer = 0;
        }
        
        // Update level based on score
        const newLevel = Math.floor(this.score / 100) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            // Increase difficulty with reasonable caps
            // Minimum spawn interval: 1000ms (1 second) - prevents it from getting too fast
            // Maximum spawn interval: 2000ms (2 seconds) at start
            this.spawnInterval = Math.max(1000, 2000 - (this.level - 1) * 50);
            // Minimum visible time: 1000ms (1 second) - gives player time to react
            // Maximum visible time: 1500ms (1.5 seconds) at start
            this.kevinVisibleTime = Math.max(1000, 1500 - (this.level - 1) * 25);
            this.updateDisplay();
            this.showLevelUp();
        }
        
        // Continue loop only if game is still running
        if (this.gameRunning && !this.isPaused) {
            this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
        } else {
            this.animationFrameId = null;
        }
    }
    
    spawnKevin() {
        if (!this.gameRunning) return;
        
        // Hide previous Kevin if any
        if (this.currentKevin !== null) {
            const prevHole = this.holes[this.currentKevin];
            prevHole.kevin.style.display = 'none';
            prevHole.kevin.classList.remove('visible');
        }
        
        // Choose random hole (not the same as current)
        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * this.holes.length);
        } while (randomIndex === this.currentKevin && this.holes.length > 1);
        
        this.currentKevin = randomIndex;
        const hole = this.holes[randomIndex];
        
        // Show Kevin with animation
        hole.kevin.style.display = 'flex';
        hole.kevin.classList.add('visible');
        
        // Auto-hide after timeout - use tracked timeout
        this.addTimeout(() => {
            if (this.currentKevin === randomIndex && this.gameRunning && !this.isPaused) {
                this.missKevin(randomIndex);
            }
        }, this.kevinVisibleTime);
    }
    
    whackKevin(index) {
        if (!this.gameRunning || this.isPaused) return;
        if (this.currentKevin !== index) return; // Clicked wrong hole or no Kevin
        
        const hole = this.holes[index];
        
        // Score points based on level
        const points = 10 * this.level;
        this.score += points;
        
        // Reset misses for this hole when successfully whacked
        hole.misses = 0;
        hole.deathIndicator.style.display = 'none';
        
        // Visual feedback - slide down into hole
        hole.kevin.classList.add('whacked');
        this.addTimeout(() => {
            hole.kevin.classList.remove('whacked', 'visible');
            hole.kevin.style.display = 'none';
            if (this.currentKevin === index) {
                this.currentKevin = null;
            }
        }, 400); // Match animation duration
        
        // Show points popup
        this.showPointsPopup(hole.element, points);
        
        // Update best score
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('whackAKevinBest', this.bestScore.toString());
        }
        
        this.updateDisplay();
        this.saveGameData();
    }
    
    missKevin(index) {
        if (!this.gameRunning) return;
        if (this.currentKevin !== index) return;
        
        const hole = this.holes[index];
        hole.misses++;
        
        // Show death indicator on this hole
        if (hole.misses > 0) {
            hole.deathIndicator.style.display = 'flex';
            hole.deathIndicator.textContent = '❌'.repeat(hole.misses);
        }
        
        // Lose a life (3 total misses = game over)
        this.lives--;
        this.updateDisplay();
        
        // Check for game over
        if (this.lives <= 0) {
            this.endGame();
            return;
        }
        
        hole.kevin.classList.add('missed');
        
        this.addTimeout(() => {
            hole.kevin.classList.remove('missed', 'visible');
            hole.kevin.style.display = 'none';
            if (this.currentKevin === index) {
                this.currentKevin = null;
            }
        }, 400); // Match animation duration
    }
    
    showPointsPopup(holeElement, points) {
        const popup = document.createElement('div');
        popup.className = 'points-popup';
        popup.textContent = `+${points}`;
        
        const rect = holeElement.getBoundingClientRect();
        popup.style.left = rect.left + rect.width / 2 + 'px';
        popup.style.top = rect.top + 'px';
        
        document.body.appendChild(popup);
        
        setTimeout(() => {
            popup.style.opacity = '0';
            popup.style.transform = 'translateY(-30px)';
            setTimeout(() => popup.remove(), 300);
        }, 100);
    }
    
    showLevelUp() {
        const notification = document.createElement('div');
        notification.className = 'level-up';
        notification.textContent = `Level ${this.level}!`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }, 2000);
    }
    
    endGame() {
        this.stopGame();
        
        // Update best score
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('whackAKevinBest', this.bestScore.toString());
            this.saveGameData();
        }
        
        this.updateButton();
        this.updateDisplay();
        
        // Show game over message
        alert(`Game Over!\nYour Score: ${this.score.toLocaleString()}\n${this.score > this.bestScore ? 'New Best Score! 🎉' : `Best Score: ${this.bestScore.toLocaleString()}`}`);
    }
    
    updateDisplay() {
        this.elements.score.textContent = this.score.toLocaleString();
        this.elements.bestScore.textContent = this.bestScore.toLocaleString();
        this.elements.level.textContent = this.level;
        this.elements.lives.textContent = this.lives;
    }
    
    loadSaveData() {
        if (window.Aspenini) {
            const saveData = window.Aspenini.load();
            if (saveData && saveData.bestScore) {
                if (saveData.bestScore > this.bestScore) {
                    this.bestScore = saveData.bestScore;
                    localStorage.setItem('whackAKevinBest', this.bestScore.toString());
                }
            }
        } else {
            window.addEventListener('aspenini:ready', () => {
                this.loadSaveData();
            }, { once: true });
        }
    }
    
    setupAutoSave() {
        setInterval(() => {
            this.saveGameData();
        }, 5000);
    }
    
    saveGameData() {
        if (window.Aspenini) {
            window.Aspenini.save({
                bestScore: this.bestScore
            });
        }
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const game = new WhackAKevin();
    game.setupAutoSave();
    window.whackAKevin = game;
});

