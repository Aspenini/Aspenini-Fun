// Space 2048 - Full Game Implementation
class Space2048 {
    constructor() {
        this.size = 4;
        this.board = [];
        this.previousBoard = [];
        this.score = 0;
        this.previousScore = 0;
        this.moves = 0;
        this.bestScore = parseInt(localStorage.getItem('space2048Best') || '0');
        this.gameStarted = false;
        this.gameWon = false;
        this.gameOver = false;
        this.animating = false;
        
        // Account system integration
        this.accountData = null;
        
        // Achievement tracking
        this.achievements = {
            firstMove: { unlocked: false, title: "First Steps", desc: "Make your first move", icon: "👶" },
            reach128: { unlocked: false, title: "Getting Warmer", desc: "Reach 128", icon: "🔥" },
            reach512: { unlocked: false, title: "Half Way There", desc: "Reach 512", icon: "⭐" },
            reach1024: { unlocked: false, title: "So Close!", desc: "Reach 1024", icon: "🚀" },
            reach2048: { unlocked: false, title: "Space Champion!", desc: "Reach 2048", icon: "👑" },
            score10k: { unlocked: false, title: "High Scorer", desc: "Score 10,000 points", icon: "💎" },
            moves100: { unlocked: false, title: "Persistent", desc: "Make 100 moves in one game", icon: "💪" }
        };
        
        this.loadAchievements();
        this.setupAccountIntegration();
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.updateDisplay();
        this.renderAchievements();
        this.showOverlay();
    }
    
    bindEvents() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Button controls
        document.getElementById('startButton').addEventListener('click', () => this.startGame());
        document.getElementById('newGameBtn').addEventListener('click', () => this.startGame());
        document.getElementById('undoBtn').addEventListener('click', () => this.undoMove());
        
        // Touch controls for mobile
        let startX, startY;
        const gameBoard = document.getElementById('gameBoard');
        
        gameBoard.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });
        
        gameBoard.addEventListener('touchend', (e) => {
            if (!startX || !startY) return;
            
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            
            const diffX = startX - endX;
            const diffY = startY - endY;
            
            if (Math.abs(diffX) > Math.abs(diffY)) {
                if (diffX > 0) this.move('left');
                else this.move('right');
            } else {
                if (diffY > 0) this.move('up');
                else this.move('down');
            }
            
            startX = startY = null;
        });
    }
    
    handleKeyPress(e) {
        if (!this.gameStarted || this.gameOver) {
            if (e.code === 'Space' || e.code === 'Enter') {
                this.startGame();
            }
            return;
        }
        
        switch (e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                this.move('left');
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.move('right');
                break;
            case 'ArrowUp':
            case 'KeyW':
                this.move('up');
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.move('down');
                break;
        }
        e.preventDefault();
    }
    
    startGame() {
        this.board = Array(this.size).fill().map(() => Array(this.size).fill(0));
        this.previousBoard = [];
        this.score = 0;
        this.previousScore = 0;
        this.moves = 0;
        this.gameStarted = true;
        this.gameWon = false;
        this.gameOver = false;
        
        // Add two initial tiles
        this.addRandomTile();
        this.addRandomTile();
        
        this.hideOverlay();
        this.updateDisplay();
        this.renderBoard();
    }
    
    addRandomTile() {
        const emptyCells = [];
        
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.board[i][j] === 0) {
                    emptyCells.push({row: i, col: j});
                }
            }
        }
        
        if (emptyCells.length > 0) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.board[randomCell.row][randomCell.col] = Math.random() < 0.9 ? 2 : 4;
        }
    }
    
    move(direction) {
        if (!this.gameStarted || this.gameOver || this.animating) return;
        
        // Save current state for undo
        this.previousBoard = this.board.map(row => [...row]);
        this.previousScore = this.score;
        
        let moved = false;
        const newBoard = this.board.map(row => [...row]);
        
        if (direction === 'left') {
            moved = this.moveLeft(newBoard);
        } else if (direction === 'right') {
            moved = this.moveRight(newBoard);
        } else if (direction === 'up') {
            moved = this.moveUp(newBoard);
        } else if (direction === 'down') {
            moved = this.moveDown(newBoard);
        }
        
        if (moved) {
            this.animating = true;
            this.moves++;
            
            // Animate the move
            this.animateMove(this.board, newBoard, direction, () => {
                this.board = newBoard;
                this.addRandomTile();
                this.updateDisplay();
                this.renderBoard();
                this.checkAchievements();
                this.animating = false;
            });
            
            if (this.isGameWon() && !this.gameWon) {
                this.gameWon = true;
                // Show win message on screen instead of popup
                this.showInGameMessage('🎉 You reached 2048! 🎉', 'success');
            } else if (this.isGameOver()) {
                this.gameOver = true;
                // Show game over message on screen
                this.showInGameMessage('Game Over!', 'error');
            }
        }
    }
    
    moveLeft(board) {
        let moved = false;
        
        for (let i = 0; i < this.size; i++) {
            const row = board[i].filter(val => val !== 0);
            
            // Merge tiles
            for (let j = 0; j < row.length - 1; j++) {
                if (row[j] === row[j + 1]) {
                    row[j] *= 2;
                    this.score += row[j];
                    row.splice(j + 1, 1);
                }
            }
            
            // Fill with zeros
            while (row.length < this.size) {
                row.push(0);
            }
            
            // Check if anything changed
            for (let j = 0; j < this.size; j++) {
                if (board[i][j] !== row[j]) {
                    moved = true;
                }
                board[i][j] = row[j];
            }
        }
        
        return moved;
    }
    
    moveRight(board) {
        let moved = false;
        
        for (let i = 0; i < this.size; i++) {
            const row = board[i].filter(val => val !== 0);
            
            // Merge tiles (from right)
            for (let j = row.length - 1; j > 0; j--) {
                if (row[j] === row[j - 1]) {
                    row[j] *= 2;
                    this.score += row[j];
                    row.splice(j - 1, 1);
                    j--;
                }
            }
            
            // Fill with zeros at the beginning
            while (row.length < this.size) {
                row.unshift(0);
            }
            
            // Check if anything changed
            for (let j = 0; j < this.size; j++) {
                if (board[i][j] !== row[j]) {
                    moved = true;
                }
                board[i][j] = row[j];
            }
        }
        
        return moved;
    }
    
    moveUp(board) {
        let moved = false;
        
        for (let j = 0; j < this.size; j++) {
            const column = [];
            for (let i = 0; i < this.size; i++) {
                if (board[i][j] !== 0) {
                    column.push(board[i][j]);
                }
            }
            
            // Merge tiles
            for (let i = 0; i < column.length - 1; i++) {
                if (column[i] === column[i + 1]) {
                    column[i] *= 2;
                    this.score += column[i];
                    column.splice(i + 1, 1);
                }
            }
            
            // Fill with zeros
            while (column.length < this.size) {
                column.push(0);
            }
            
            // Check if anything changed and update board
            for (let i = 0; i < this.size; i++) {
                if (board[i][j] !== column[i]) {
                    moved = true;
                }
                board[i][j] = column[i];
            }
        }
        
        return moved;
    }
    
    moveDown(board) {
        let moved = false;
        
        for (let j = 0; j < this.size; j++) {
            const column = [];
            for (let i = 0; i < this.size; i++) {
                if (board[i][j] !== 0) {
                    column.push(board[i][j]);
                }
            }
            
            // Merge tiles (from bottom)
            for (let i = column.length - 1; i > 0; i--) {
                if (column[i] === column[i - 1]) {
                    column[i] *= 2;
                    this.score += column[i];
                    column.splice(i - 1, 1);
                    i--;
                }
            }
            
            // Fill with zeros at the beginning
            while (column.length < this.size) {
                column.unshift(0);
            }
            
            // Check if anything changed and update board
            for (let i = 0; i < this.size; i++) {
                if (board[i][j] !== column[i]) {
                    moved = true;
                }
                board[i][j] = column[i];
            }
        }
        
        return moved;
    }
    
    undoMove() {
        if (this.previousBoard.length === 0) return;
        
        this.board = this.previousBoard.map(row => [...row]);
        this.score = this.previousScore;
        this.moves = Math.max(0, this.moves - 1);
        this.previousBoard = [];
        
        this.updateDisplay();
        this.renderBoard();
    }
    
    isGameWon() {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.board[i][j] >= 2048) {
                    return true;
                }
            }
        }
        return false;
    }
    
    isGameOver() {
        // Check for empty cells
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.board[i][j] === 0) {
                    return false;
                }
            }
        }
        
        // Check for possible merges
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const current = this.board[i][j];
                if ((j < this.size - 1 && current === this.board[i][j + 1]) ||
                    (i < this.size - 1 && current === this.board[i + 1][j])) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    renderBoard() {
        const gameBoard = document.getElementById('gameBoard');
        
        // Initialize board container if not exists
        if (!gameBoard.querySelector('.tile-container')) {
            gameBoard.innerHTML = `
                <div class="grid-container">
                    ${Array(16).fill('<div class="grid-cell"></div>').join('')}
                </div>
                <div class="tile-container"></div>
            `;
        }
        
        const tileContainer = gameBoard.querySelector('.tile-container');
        
        // Clear existing tiles
        tileContainer.innerHTML = '';
        
        // Create tiles with positions
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const value = this.board[i][j];
                if (value !== 0) {
                    const tile = document.createElement('div');
                    tile.className = 'tile';
                    tile.textContent = value;
                    tile.setAttribute('data-value', value);
                    tile.setAttribute('data-row', i);
                    tile.setAttribute('data-col', j);
                    
                    // Position tile using CSS transforms
                    const x = j * 120 + (j * 15); // tile width + gap
                    const y = i * 120 + (i * 15); // tile height + gap
                    tile.style.transform = `translate(${x}px, ${y}px)`;
                    
                    // Add animation class for new tiles
                    if (!this.previousBoard.length || this.previousBoard[i][j] !== value) {
                        if (this.previousBoard.length && this.previousBoard[i][j] === 0) {
                            tile.classList.add('new');
                        } else if (this.previousBoard.length && this.previousBoard[i][j] !== 0 && this.previousBoard[i][j] !== value) {
                            tile.classList.add('merged');
                        }
                    }
                    
                    tileContainer.appendChild(tile);
                }
            }
        }
        
        // Update undo button state
        document.getElementById('undoBtn').disabled = this.previousBoard.length === 0;
    }

    animateMove(oldBoard, newBoard, direction, callback) {
        const tileContainer = document.querySelector('.tile-container');
        const animationDuration = 150;
        
        // Create tiles for animation
        const animatingTiles = [];
        
        // Find tiles that moved
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const oldValue = oldBoard[i][j];
                if (oldValue !== 0) {
                    // Find where this tile ended up
                    const newPos = this.findTileDestination(oldBoard, newBoard, i, j, direction);
                    if (newPos && (newPos.row !== i || newPos.col !== j)) {
                        // Create animated tile
                        const tile = document.createElement('div');
                        tile.className = 'tile';
                        tile.textContent = oldValue;
                        tile.setAttribute('data-value', oldValue);
                        
                        // Start position
                        const startX = j * 135; // 120px width + 15px gap
                        const startY = i * 135;
                        tile.style.transform = `translate(${startX}px, ${startY}px)`;
                        
                        tileContainer.appendChild(tile);
                        animatingTiles.push({
                            element: tile,
                            startX,
                            startY,
                            endX: newPos.col * 135,
                            endY: newPos.row * 135
                        });
                    }
                }
            }
        }
        
        // Animate tiles
        if (animatingTiles.length > 0) {
            // Start animation
            requestAnimationFrame(() => {
                animatingTiles.forEach(tile => {
                    tile.element.style.transform = `translate(${tile.endX}px, ${tile.endY}px)`;
                });
            });
            
            // Clean up after animation
            setTimeout(() => {
                animatingTiles.forEach(tile => {
                    tile.element.remove();
                });
                callback();
            }, animationDuration);
        } else {
            callback();
        }
    }

    findTileDestination(oldBoard, newBoard, oldRow, oldCol, direction) {
        const value = oldBoard[oldRow][oldCol];
        
        // Find where this tile value appears in the new board
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (newBoard[i][j] === value) {
                    // Check if this is the correct destination based on direction
                    if (this.isValidDestination(oldRow, oldCol, i, j, direction)) {
                        // Mark as used to avoid duplicate matching
                        newBoard[i][j] = -1;
                        return { row: i, col: j };
                    }
                }
            }
        }
        return null;
    }

    isValidDestination(oldRow, oldCol, newRow, newCol, direction) {
        switch (direction) {
            case 'left':
                return oldRow === newRow && newCol <= oldCol;
            case 'right':
                return oldRow === newRow && newCol >= oldCol;
            case 'up':
                return oldCol === newCol && newRow <= oldRow;
            case 'down':
                return oldCol === newCol && newRow >= oldRow;
            default:
                return false;
        }
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score.toLocaleString();
        document.getElementById('moves').textContent = this.moves.toString();
        
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('space2048Best', this.bestScore.toString());
        }
        
        document.getElementById('bestScore').textContent = this.bestScore.toLocaleString();
    }
    
    checkAchievements() {
        const maxTile = Math.max(...this.board.flat());
        
        // Check tile-based achievements
        if (maxTile >= 128 && !this.achievements.reach128.unlocked) {
            this.unlockAchievement('reach128');
        }
        if (maxTile >= 512 && !this.achievements.reach512.unlocked) {
            this.unlockAchievement('reach512');
        }
        if (maxTile >= 1024 && !this.achievements.reach1024.unlocked) {
            this.unlockAchievement('reach1024');
        }
        if (maxTile >= 2048 && !this.achievements.reach2048.unlocked) {
            this.unlockAchievement('reach2048');
        }
        
        // Check score-based achievements
        if (this.score >= 10000 && !this.achievements.score10k.unlocked) {
            this.unlockAchievement('score10k');
        }
        
        // Check move-based achievements
        if (this.moves === 1 && !this.achievements.firstMove.unlocked) {
            this.unlockAchievement('firstMove');
        }
        if (this.moves >= 100 && !this.achievements.moves100.unlocked) {
            this.unlockAchievement('moves100');
        }
    }
    
    unlockAchievement(id) {
        this.achievements[id].unlocked = true;
        this.saveAchievements();
        this.renderAchievements();
        
        // Just silently unlock, no popup
    }
    
    showInGameMessage(message, type = 'info') {
        // Remove existing message
        const existing = document.querySelector('.in-game-message');
        if (existing) existing.remove();
        
        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `in-game-message ${type}`;
        messageEl.textContent = message;
        
        // Add to game area
        document.querySelector('.game-area').appendChild(messageEl);
        
        // Auto remove after delay
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.remove();
            }
        }, 3000);
    }
    
    renderAchievements() {
        const achievementsList = document.getElementById('achievements');
        achievementsList.innerHTML = '';
        
        Object.entries(this.achievements).forEach(([id, achievement]) => {
            const achievementEl = document.createElement('div');
            achievementEl.className = `achievement ${achievement.unlocked ? 'unlocked' : ''}`;
            
            achievementEl.innerHTML = `
                <div class="achievement-icon">${achievement.unlocked ? achievement.icon : '🔒'}</div>
                <div class="achievement-text">
                    <div class="achievement-title">${achievement.title}</div>
                    <div class="achievement-desc">${achievement.desc}</div>
                </div>
            `;
            
            achievementsList.appendChild(achievementEl);
        });
    }
    
    saveAchievements() {
        localStorage.setItem('space2048Achievements', JSON.stringify(this.achievements));
    }
    
    loadAchievements() {
        const saved = localStorage.getItem('space2048Achievements');
        if (saved) {
            const savedAchievements = JSON.parse(saved);
            Object.keys(this.achievements).forEach(key => {
                if (savedAchievements[key]) {
                    this.achievements[key].unlocked = savedAchievements[key].unlocked;
                }
            });
        }
    }
    
    showOverlay(title = 'Space 2048', message = 'Slide tiles to combine numbers and reach 2048!', buttons = [{ text: 'Start Game', action: () => this.startGame() }]) {
        document.getElementById('overlayTitle').textContent = title;
        document.getElementById('overlayMessage').textContent = message;
        
        const buttonsContainer = document.querySelector('.overlay-buttons');
        buttonsContainer.innerHTML = '';
        
        buttons.forEach(button => {
            const btn = document.createElement('button');
            btn.className = 'game-btn';
            btn.textContent = button.text;
            btn.addEventListener('click', button.action);
            buttonsContainer.appendChild(btn);
        });
        
        document.getElementById('gameOverlay').classList.remove('hidden');
    }
    
    hideOverlay() {
        document.getElementById('gameOverlay').classList.add('hidden');
    }
    
    setupAccountIntegration() {
        // Listen for account data from the bridge
        window.addEventListener('accountDataLoaded', (event) => {
            this.accountData = event.detail;
            this.loadFromAccount();
        });
        
        // Try to load immediately if already available
        setTimeout(() => {
            this.loadFromAccount();
        }, 100);
        
        // Auto-save to account every 5 seconds
        setInterval(() => {
            this.saveToAccount();
        }, 5000);
    }
    
    saveToAccount() {
        const saveData = {
            bestScore: this.bestScore,
            achievements: this.achievements
        };
        
        if (window.saveToAccount) {
            window.saveToAccount(saveData);
        }
    }
    
    loadFromAccount() {
        const accountSave = window.loadFromAccount();
        if (accountSave) {
            if (accountSave.bestScore && accountSave.bestScore > this.bestScore) {
                this.bestScore = accountSave.bestScore;
                localStorage.setItem('space2048Best', this.bestScore.toString());
            }
            
            if (accountSave.achievements) {
                Object.keys(this.achievements).forEach(key => {
                    if (accountSave.achievements[key]) {
                        this.achievements[key].unlocked = accountSave.achievements[key].unlocked;
                    }
                });
                this.renderAchievements();
            }
            
            this.updateDisplay();
            console.log('Loaded Space 2048 save from account system');
        }
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new Space2048();
});
