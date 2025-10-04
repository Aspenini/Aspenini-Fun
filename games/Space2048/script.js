// Space 2048 - Proper Implementation
class Space2048 {
    constructor() {
        this.size = 4;
        this.board = [];
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('space2048Best') || '0');
        this.gameStarted = false;
        this.gameWon = false;
        this.gameOver = false;
        this.animating = false;
        this.previousBoard = [];
        
        // Account system integration
        this.accountData = null;
        
        // Achievement tracking
        this.achievements = {
            firstMove: { unlocked: false, title: "First Steps", desc: "Make your first move", icon: "👶" },
            reach128: { unlocked: false, title: "Getting Warmer", desc: "Reach 128", icon: "🔥" },
            reach512: { unlocked: false, title: "Half Way There", desc: "Reach 512", icon: "⭐" },
            reach1024: { unlocked: false, title: "So Close!", desc: "Reach 1024", icon: "🚀" },
            reach2048: { unlocked: false, title: "Space Champion!", desc: "Reach 2048", icon: "👑" },
            score10k: { unlocked: false, title: "High Scorer", desc: "Score 10,000 points", icon: "💎" }
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
                if (diffX > 50) this.move('left');
                else if (diffX < -50) this.move('right');
            } else {
                if (diffY > 50) this.move('up');
                else if (diffY < -50) this.move('down');
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
        this.board = this.createEmptyBoard();
        this.score = 0;
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
    
    createEmptyBoard() {
        return Array(this.size).fill().map(() => Array(this.size).fill(0));
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
            // 90% chance for 2, 10% chance for 4
            this.board[randomCell.row][randomCell.col] = Math.random() < 0.9 ? 2 : 4;
        }
    }
    
    move(direction) {
        if (!this.gameStarted || this.gameOver || this.animating) return;
        
        const oldBoard = this.board.map(row => [...row]);
        let moved = false;
        
        switch (direction) {
            case 'left':
                moved = this.moveLeft();
                break;
            case 'right':
                moved = this.moveRight();
                break;
            case 'up':
                moved = this.moveUp();
                break;
            case 'down':
                moved = this.moveDown();
                break;
        }
        
        if (moved) {
            this.animating = true;
            // Animate the move
            this.animateMove(oldBoard, this.board, direction, () => {
                this.addRandomTile();
                this.updateDisplay();
                this.renderBoard();
                this.checkAchievements();
                this.checkGameStatus();
                this.animating = false;
            });
        }
    }
    
    moveLeft() {
        let moved = false;
        
        for (let i = 0; i < this.size; i++) {
            const row = this.board[i].filter(val => val !== 0);
            
            // Merge adjacent equal tiles
            for (let j = 0; j < row.length - 1; j++) {
                if (row[j] === row[j + 1]) {
                    row[j] *= 2;
                    this.score += row[j];
                    row.splice(j + 1, 1);
                }
            }
            
            // Pad with zeros
            while (row.length < this.size) {
                row.push(0);
            }
            
            // Check if anything changed
            for (let j = 0; j < this.size; j++) {
                if (this.board[i][j] !== row[j]) {
                    moved = true;
                }
                this.board[i][j] = row[j];
            }
        }
        
        return moved;
    }
    
    moveRight() {
        let moved = false;
        
        for (let i = 0; i < this.size; i++) {
            const row = this.board[i].filter(val => val !== 0);
            
            // Merge adjacent equal tiles (from right)
            for (let j = row.length - 1; j > 0; j--) {
                if (row[j] === row[j - 1]) {
                    row[j] *= 2;
                    this.score += row[j];
                    row.splice(j - 1, 1);
                }
            }
            
            // Pad with zeros at the beginning
            while (row.length < this.size) {
                row.unshift(0);
            }
            
            // Check if anything changed
            for (let j = 0; j < this.size; j++) {
                if (this.board[i][j] !== row[j]) {
                    moved = true;
                }
                this.board[i][j] = row[j];
            }
        }
        
        return moved;
    }
    
    moveUp() {
        let moved = false;
        
        for (let j = 0; j < this.size; j++) {
            const column = [];
            
            // Extract non-zero values
            for (let i = 0; i < this.size; i++) {
                if (this.board[i][j] !== 0) {
                    column.push(this.board[i][j]);
                }
            }
            
            // Merge adjacent equal tiles
            for (let i = 0; i < column.length - 1; i++) {
                if (column[i] === column[i + 1]) {
                    column[i] *= 2;
                    this.score += column[i];
                    column.splice(i + 1, 1);
                }
            }
            
            // Pad with zeros
            while (column.length < this.size) {
                column.push(0);
            }
            
            // Update board
            for (let i = 0; i < this.size; i++) {
                if (this.board[i][j] !== column[i]) {
                    moved = true;
                }
                this.board[i][j] = column[i];
            }
        }
        
        return moved;
    }
    
    moveDown() {
        let moved = false;
        
        for (let j = 0; j < this.size; j++) {
            const column = [];
            
            // Extract non-zero values
            for (let i = 0; i < this.size; i++) {
                if (this.board[i][j] !== 0) {
                    column.push(this.board[i][j]);
                }
            }
            
            // Merge adjacent equal tiles (from bottom)
            for (let i = column.length - 1; i > 0; i--) {
                if (column[i] === column[i - 1]) {
                    column[i] *= 2;
                    this.score += column[i];
                    column.splice(i - 1, 1);
                }
            }
            
            // Pad with zeros at the beginning
            while (column.length < this.size) {
                column.unshift(0);
            }
            
            // Update board
            for (let i = 0; i < this.size; i++) {
                if (this.board[i][j] !== column[i]) {
                    moved = true;
                }
                this.board[i][j] = column[i];
            }
        }
        
        return moved;
    }
    
    checkGameStatus() {
        // Check for win condition
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.board[i][j] >= 2048) {
                    if (!this.gameWon) {
                        this.gameWon = true;
                        this.showInGameMessage('🎉 You reached 2048! 🎉', 'success');
                    }
                }
            }
        }
        
        // Check for game over
        if (this.isGameOver()) {
            this.gameOver = true;
            this.showInGameMessage('Game Over!', 'error');
        }
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
                // Check right neighbor
                if (j < this.size - 1 && current === this.board[i][j + 1]) {
                    return false;
                }
                // Check bottom neighbor
                if (i < this.size - 1 && current === this.board[i + 1][j]) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    animateMove(oldBoard, newBoard, direction, callback) {
        const gameBoard = document.getElementById('gameBoard');
        const animationDuration = 150;
        
        // Create animated tiles
        const animatingTiles = [];
        
        // Find tiles that moved or merged
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const oldValue = oldBoard[i][j];
                const newValue = newBoard[i][j];
                
                if (oldValue !== 0) {
                    // Find where this tile ended up
                    const destination = this.findTileDestination(oldBoard, newBoard, i, j, direction);
                    
                    if (destination && (destination.row !== i || destination.col !== j)) {
                        // Create animated tile
                        const tile = document.createElement('div');
                        tile.className = 'tile animated-tile';
                        tile.textContent = oldValue;
                        tile.setAttribute('data-value', oldValue);
                        
                        // Position at starting location
                        const startRow = i;
                        const startCol = j;
                        const endRow = destination.row;
                        const endCol = destination.col;
                        
                        tile.style.gridRow = startRow + 1;
                        tile.style.gridColumn = startCol + 1;
                        tile.style.zIndex = '100';
                        
                        gameBoard.appendChild(tile);
                        
                        // Animate to destination
                        requestAnimationFrame(() => {
                            tile.style.gridRow = endRow + 1;
                            tile.style.gridColumn = endCol + 1;
                            
                            // Handle merged tiles
                            if (oldValue !== newValue && newValue > oldValue) {
                                setTimeout(() => {
                                    tile.textContent = newValue;
                                    tile.setAttribute('data-value', newValue);
                                }, animationDuration / 2);
                            }
                        });
                        
                        animatingTiles.push(tile);
                    }
                }
            }
        }
        
        // Clean up after animation
        setTimeout(() => {
            animatingTiles.forEach(tile => {
                if (tile.parentNode) {
                    tile.parentNode.removeChild(tile);
                }
            });
            callback();
        }, animationDuration);
    }
    
    findTileDestination(oldBoard, newBoard, oldRow, oldCol, direction) {
        const oldValue = oldBoard[oldRow][oldCol];
        
        // Find where this tile value appears in the new board
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (newBoard[i][j] === oldValue || newBoard[i][j] === oldValue * 2) {
                    // Check if this is a valid destination based on direction
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
    
    renderBoard() {
        const gameBoard = document.getElementById('gameBoard');
        
        // Clear the board
        gameBoard.innerHTML = '';
        
        // Create grid cells
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                
                const value = this.board[i][j];
                if (value !== 0) {
                    const tile = document.createElement('div');
                    tile.className = 'tile';
                    tile.textContent = value;
                    tile.setAttribute('data-value', value);
                    
                    // Add animation classes for new tiles
                    if (this.previousBoard && this.previousBoard.length > 0) {
                        const oldValue = this.previousBoard[i][j];
                        if (oldValue === 0) {
                            tile.classList.add('new');
                        } else if (oldValue !== value && value > oldValue) {
                            tile.classList.add('merged');
                        }
                    } else {
                        // Initial tiles
                        tile.classList.add('new');
                    }
                    
                    cell.appendChild(tile);
                }
                
                gameBoard.appendChild(cell);
            }
        }
        
        // Store current board state for next render
        this.previousBoard = this.board.map(row => [...row]);
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score.toLocaleString();
        
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
    }
    
    unlockAchievement(id) {
        this.achievements[id].unlocked = true;
        this.saveAchievements();
        this.renderAchievements();
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