// Space Tetris - Full Game Implementation
class SpaceTetris {
    constructor() {
        this.canvas = document.getElementById('tetris');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextPiece');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        // Game state
        this.board = [];
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameRunning = false;
        this.isPaused = false;
        this.dropTime = 0;
        this.dropInterval = 1000;
        
        // Game dimensions
        this.boardWidth = 10;
        this.boardHeight = 20;
        this.blockSize = 30;
        
        // Load best score
        this.bestScore = parseInt(localStorage.getItem('spaceTetrisBest') || '0');
        
        // Tetris pieces (tetrominoes)
        this.pieces = {
            'I': {
                shape: [[1, 1, 1, 1]],
                color: '#8a77ff'
            },
            'O': {
                shape: [
                    [1, 1],
                    [1, 1]
                ],
                color: '#4c9aff'
            },
            'T': {
                shape: [
                    [0, 1, 0],
                    [1, 1, 1]
                ],
                color: '#00d4ff'
            },
            'S': {
                shape: [
                    [0, 1, 1],
                    [1, 1, 0]
                ],
                color: '#7c4dff'
            },
            'Z': {
                shape: [
                    [1, 1, 0],
                    [0, 1, 1]
                ],
                color: '#ff6b6b'
            },
            'J': {
                shape: [
                    [1, 0, 0],
                    [1, 1, 1]
                ],
                color: '#4ecdc4'
            },
            'L': {
                shape: [
                    [0, 0, 1],
                    [1, 1, 1]
                ],
                color: '#ffd43b'
            }
        };
        
        this.init();
    }
    
    init() {
        this.initBoard();
        this.bindEvents();
        this.updateDisplay();
        this.showOverlay('Space Tetris', 'Press SPACE or click START to begin your cosmic puzzle adventure!');
    }
    
    initBoard() {
        this.board = Array(this.boardHeight).fill().map(() => Array(this.boardWidth).fill(0));
    }
    
    bindEvents() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Button controls
        document.getElementById('startButton').addEventListener('click', () => this.startGame());
        document.getElementById('pauseButton').addEventListener('click', () => this.togglePause());
        document.getElementById('restartButton').addEventListener('click', () => this.restartGame());
        
        // Prevent context menu on canvas
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    handleKeyPress(e) {
        if (!this.gameRunning || this.isPaused) {
            if (e.code === 'Space') {
                if (!this.gameRunning) {
                    this.startGame();
                } else if (this.isPaused) {
                    this.togglePause();
                }
            }
            if (e.code === 'KeyP') {
                this.togglePause();
            }
            return;
        }
        
        switch (e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                this.movePiece(-1, 0);
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.movePiece(1, 0);
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.movePiece(0, 1);
                break;
            case 'ArrowUp':
            case 'KeyW':
                this.rotatePiece();
                break;
            case 'Space':
                this.hardDrop();
                break;
            case 'KeyP':
                this.togglePause();
                break;
        }
        e.preventDefault();
    }
    
    startGame() {
        this.gameRunning = true;
        this.isPaused = false;
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.dropInterval = 1000;
        this.initBoard();
        this.currentPiece = this.createPiece();
        this.nextPiece = this.createPiece();
        this.hideOverlay();
        this.updateDisplay();
        this.gameLoop();
    }
    
    restartGame() {
        this.gameRunning = false;
        this.isPaused = false;
        this.startGame();
    }
    
    togglePause() {
        if (!this.gameRunning) return;
        
        this.isPaused = !this.isPaused;
        document.getElementById('pauseButton').textContent = this.isPaused ? 'Resume' : 'Pause';
        
        if (this.isPaused) {
            this.showOverlay('Game Paused', 'Press P or click Resume to continue');
        } else {
            this.hideOverlay();
            this.gameLoop();
        }
    }
    
    createPiece() {
        const pieceTypes = Object.keys(this.pieces);
        const randomType = pieceTypes[Math.floor(Math.random() * pieceTypes.length)];
        const piece = this.pieces[randomType];
        
        return {
            shape: piece.shape,
            color: piece.color,
            x: Math.floor(this.boardWidth / 2) - Math.floor(piece.shape[0].length / 2),
            y: 0
        };
    }
    
    movePiece(dx, dy) {
        if (!this.currentPiece) return false;
        
        const newX = this.currentPiece.x + dx;
        const newY = this.currentPiece.y + dy;
        
        if (this.canPlacePiece(this.currentPiece.shape, newX, newY)) {
            this.currentPiece.x = newX;
            this.currentPiece.y = newY;
            return true;
        }
        
        return false;
    }
    
    rotatePiece() {
        if (!this.currentPiece) return;
        
        const rotated = this.rotateMatrix(this.currentPiece.shape);
        
        if (this.canPlacePiece(rotated, this.currentPiece.x, this.currentPiece.y)) {
            this.currentPiece.shape = rotated;
        }
    }
    
    rotateMatrix(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const rotated = Array(cols).fill().map(() => Array(rows).fill(0));
        
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                rotated[j][rows - 1 - i] = matrix[i][j];
            }
        }
        
        return rotated;
    }
    
    hardDrop() {
        if (!this.currentPiece) return;
        
        let dropDistance = 0;
        while (this.movePiece(0, 1)) {
            dropDistance++;
        }
        
        // Bonus points for hard drop
        this.score += dropDistance * 2;
        this.placePiece();
    }
    
    canPlacePiece(shape, x, y) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const boardX = x + col;
                    const boardY = y + row;
                    
                    if (boardX < 0 || boardX >= this.boardWidth || 
                        boardY >= this.boardHeight ||
                        (boardY >= 0 && this.board[boardY][boardX])) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    
    placePiece() {
        if (!this.currentPiece) return;
        
        // Place piece on board
        for (let row = 0; row < this.currentPiece.shape.length; row++) {
            for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                if (this.currentPiece.shape[row][col]) {
                    const boardX = this.currentPiece.x + col;
                    const boardY = this.currentPiece.y + row;
                    
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            }
        }
        
        // Check for completed lines
        this.clearLines();
        
        // Get next piece
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.createPiece();
        
        // Check game over
        if (!this.canPlacePiece(this.currentPiece.shape, this.currentPiece.x, this.currentPiece.y)) {
            this.gameOver();
        }
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let row = this.boardHeight - 1; row >= 0; row--) {
            if (this.board[row].every(cell => cell !== 0)) {
                // Remove completed line
                this.board.splice(row, 1);
                // Add new empty line at top
                this.board.unshift(Array(this.boardWidth).fill(0));
                linesCleared++;
                row++; // Check same row again
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            
            // Score calculation (Tetris scoring system)
            const scoreMultipliers = [0, 100, 300, 500, 800];
            this.score += scoreMultipliers[linesCleared] * this.level;
            
            // Level progression
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(50, 1000 - (this.level - 1) * 50);
            
            this.updateDisplay();
        }
    }
    
    gameOver() {
        this.gameRunning = false;
        this.isPaused = false;
        
        // Update best score
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('spaceTetrisBest', this.bestScore.toString());
        }
        
        this.updateDisplay();
        this.showOverlay('Game Over', 
            `Final Score: ${this.score.toLocaleString()}\n` +
            `Lines Cleared: ${this.lines}\n` +
            `Level Reached: ${this.level}\n\n` +
            `${this.score === this.bestScore ? '🎉 New Best Score! 🎉\n\n' : ''}` +
            `Press SPACE or click START to play again!`);
        
        document.getElementById('pauseButton').textContent = 'Pause';
    }
    
    gameLoop() {
        if (!this.gameRunning || this.isPaused) return;
        
        const now = Date.now();
        
        if (now - this.dropTime > this.dropInterval) {
            if (!this.movePiece(0, 1)) {
                this.placePiece();
            }
            this.dropTime = now;
        }
        
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw board
        this.drawBoard();
        
        // Draw current piece
        if (this.currentPiece) {
            this.drawPiece(this.currentPiece, this.ctx);
        }
        
        // Draw next piece
        this.drawNextPiece();
    }
    
    drawBoard() {
        for (let row = 0; row < this.boardHeight; row++) {
            for (let col = 0; col < this.boardWidth; col++) {
                if (this.board[row][col]) {
                    this.ctx.fillStyle = this.board[row][col];
                    this.ctx.fillRect(
                        col * this.blockSize,
                        row * this.blockSize,
                        this.blockSize - 1,
                        this.blockSize - 1
                    );
                }
            }
        }
    }
    
    drawPiece(piece, context) {
        context.fillStyle = piece.color;
        
        for (let row = 0; row < piece.shape.length; row++) {
            for (let col = 0; col < piece.shape[row].length; col++) {
                if (piece.shape[row][col]) {
                    const x = (piece.x + col) * this.blockSize;
                    const y = (piece.y + row) * this.blockSize;
                    
                    context.fillRect(x, y, this.blockSize - 1, this.blockSize - 1);
                }
            }
        }
    }
    
    
    drawNextPiece() {
        // Clear next piece canvas
        this.nextCtx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        if (!this.nextPiece) return;
        
        const pieceWidth = this.nextPiece.shape[0].length;
        const pieceHeight = this.nextPiece.shape.length;
        const blockSize = 25;
        
        const offsetX = (this.nextCanvas.width - pieceWidth * blockSize) / 2;
        const offsetY = (this.nextCanvas.height - pieceHeight * blockSize) / 2;
        
        this.nextCtx.fillStyle = this.nextPiece.color;
        
        for (let row = 0; row < pieceHeight; row++) {
            for (let col = 0; col < pieceWidth; col++) {
                if (this.nextPiece.shape[row][col]) {
                    const x = offsetX + col * blockSize;
                    const y = offsetY + row * blockSize;
                    
                    this.nextCtx.fillRect(x, y, blockSize - 1, blockSize - 1);
                }
            }
        }
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score.toLocaleString();
        document.getElementById('lines').textContent = this.lines.toString();
        document.getElementById('level').textContent = this.level.toString();
        document.getElementById('bestScore').textContent = this.bestScore.toLocaleString();
    }
    
    showOverlay(title, message) {
        document.getElementById('overlayTitle').textContent = title;
        document.getElementById('overlayMessage').textContent = message;
        document.getElementById('gameOverlay').classList.remove('hidden');
    }
    
    hideOverlay() {
        document.getElementById('gameOverlay').classList.add('hidden');
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new SpaceTetris();
});
