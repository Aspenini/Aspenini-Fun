// Space 2048 - Complete Rewrite
class Space2048 {
    constructor() {
        this.size = 4;
        this.board = [];
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('space2048Best') || '0');
        this.gameStarted = false;
        this.gameOver = false;
        this.gameWon = false;
        
        // Load save data using Aspenini SDK
        this.loadSaveData();
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.updateDisplay();
        this.startGame();
        this.setupAutoSave();
    }
    
    bindEvents() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Button controls
        document.getElementById('newGameBtn').addEventListener('click', () => this.startGame());
        
        // Touch controls for mobile
        let startX, startY;
        const gameBoard = document.getElementById('gameBoard');
        
        gameBoard.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });
        
        gameBoard.addEventListener('touchend', (e) => {
            if (!startX || !startY || !this.gameStarted || this.gameOver) return;
            
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            
            const diffX = startX - endX;
            const diffY = startY - endY;
            
            if (Math.abs(diffX) > Math.abs(diffY)) {
                if (Math.abs(diffX) > 30) {
                    if (diffX > 0) this.move('left');
                    else this.move('right');
                }
            } else {
                if (Math.abs(diffY) > 30) {
                    if (diffY > 0) this.move('up');
                    else this.move('down');
                }
            }
            
            startX = startY = null;
        });
    }
    
    handleKeyPress(e) {
        if (!this.gameStarted || this.gameOver) return;
        
        switch (e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                e.preventDefault();
                this.move('left');
                break;
            case 'ArrowRight':
            case 'KeyD':
                e.preventDefault();
                this.move('right');
                break;
            case 'ArrowUp':
            case 'KeyW':
                e.preventDefault();
                this.move('up');
                break;
            case 'ArrowDown':
            case 'KeyS':
                e.preventDefault();
                this.move('down');
                break;
        }
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
        if (!this.gameStarted || this.gameOver) return;
        
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
            this.addRandomTile();
            this.updateDisplay();
            this.renderBoard();
            this.checkGameStatus();
        }
    }
    
    moveLeft() {
        let moved = false;
        
        for (let i = 0; i < this.size; i++) {
            const row = this.board[i].filter(val => val !== 0);
            const newRow = [];
            
            // Merge adjacent equal tiles
            for (let j = 0; j < row.length; j++) {
                if (j < row.length - 1 && row[j] === row[j + 1]) {
                    newRow.push(row[j] * 2);
                    this.score += row[j] * 2;
                    j++; // Skip next tile as it's merged
                } else {
                    newRow.push(row[j]);
                }
            }
            
            // Pad with zeros
            while (newRow.length < this.size) {
                newRow.push(0);
            }
            
            // Check if anything changed
            for (let j = 0; j < this.size; j++) {
                if (this.board[i][j] !== newRow[j]) {
                    moved = true;
                }
                this.board[i][j] = newRow[j];
            }
        }
        
        return moved;
    }
    
    moveRight() {
        let moved = false;
        
        for (let i = 0; i < this.size; i++) {
            const row = this.board[i].filter(val => val !== 0);
            const newRow = [];
            
            // Merge adjacent equal tiles (from right)
            for (let j = row.length - 1; j >= 0; j--) {
                if (j > 0 && row[j] === row[j - 1]) {
                    newRow.unshift(row[j] * 2);
                    this.score += row[j] * 2;
                    j--; // Skip next tile as it's merged
                } else {
                    newRow.unshift(row[j]);
                }
            }
            
            // Pad with zeros at the beginning
            while (newRow.length < this.size) {
                newRow.unshift(0);
            }
            
            // Check if anything changed
            for (let j = 0; j < this.size; j++) {
                if (this.board[i][j] !== newRow[j]) {
                    moved = true;
                }
                this.board[i][j] = newRow[j];
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
            
            const newColumn = [];
            
            // Merge adjacent equal tiles
            for (let i = 0; i < column.length; i++) {
                if (i < column.length - 1 && column[i] === column[i + 1]) {
                    newColumn.push(column[i] * 2);
                    this.score += column[i] * 2;
                    i++; // Skip next tile as it's merged
                } else {
                    newColumn.push(column[i]);
                }
            }
            
            // Pad with zeros
            while (newColumn.length < this.size) {
                newColumn.push(0);
            }
            
            // Update board
            for (let i = 0; i < this.size; i++) {
                if (this.board[i][j] !== newColumn[i]) {
                    moved = true;
                }
                this.board[i][j] = newColumn[i];
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
            
            const newColumn = [];
            
            // Merge adjacent equal tiles (from bottom)
            for (let i = column.length - 1; i >= 0; i--) {
                if (i > 0 && column[i] === column[i - 1]) {
                    newColumn.unshift(column[i] * 2);
                    this.score += column[i] * 2;
                    i--; // Skip next tile as it's merged
                } else {
                    newColumn.unshift(column[i]);
                }
            }
            
            // Pad with zeros at the beginning
            while (newColumn.length < this.size) {
                newColumn.unshift(0);
            }
            
            // Update board
            for (let i = 0; i < this.size; i++) {
                if (this.board[i][j] !== newColumn[i]) {
                    moved = true;
                }
                this.board[i][j] = newColumn[i];
            }
        }
        
        return moved;
    }
    
    checkGameStatus() {
        // Check for win condition
        if (!this.gameWon) {
            for (let i = 0; i < this.size; i++) {
                for (let j = 0; j < this.size; j++) {
                    if (this.board[i][j] >= 2048) {
                        this.gameWon = true;
                        this.showInGameMessage('🎉 You reached 2048! 🎉', 'success');
                        break;
                    }
                }
                if (this.gameWon) break;
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
    
    renderBoard() {
        const gameBoard = document.getElementById('gameBoard');
        
        // Clear the board
        gameBoard.innerHTML = '';
        
        // Create grid cells and tiles
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                
                const value = this.board[i][j];
                if (value !== 0) {
                    const tile = document.createElement('div');
                    tile.className = 'tile new';
                    tile.textContent = value;
                    tile.setAttribute('data-value', value);
                    cell.appendChild(tile);
                }
                
                gameBoard.appendChild(cell);
            }
        }
        
        // Remove 'new' class after animation
        setTimeout(() => {
            document.querySelectorAll('.tile.new').forEach(tile => {
                tile.classList.remove('new');
            });
        }, 200);
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score.toLocaleString();
        
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('space2048Best', this.bestScore.toString());
            this.saveGameData();
        }
        
        document.getElementById('bestScore').textContent = this.bestScore.toLocaleString();
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
    
    loadSaveData() {
        if (window.Aspenini) {
            const saveData = window.Aspenini.load();
            if (saveData && saveData.bestScore) {
                if (saveData.bestScore > this.bestScore) {
                    this.bestScore = saveData.bestScore;
                    localStorage.setItem('space2048Best', this.bestScore.toString());
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

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new Space2048();
});
