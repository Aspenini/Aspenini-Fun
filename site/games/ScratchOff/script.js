// Scratch-Off Lottery - Using Aspenini SDK

class ScratchOff {
    constructor() {
        this.balance = 1000;
        this.ticketCost = 25;
        this.ticketNumber = 1;
        this.currentTicket = null;
        this.isScratching = false;
        this.scratchedAreas = new Set();
        this.highScore = 1000;
        
        this.stats = {
            ticketsPlayed: 0,
            ticketsWon: 0,
            totalWinnings: 0,
            biggestWin: 0
        };

        this.symbols = [
            { icon: '💎', value: 1000 },
            { icon: '⭐', value: 500 },
            { icon: '🍀', value: 100 },
            { icon: '🎰', value: 50 },
            { icon: '🍒', value: 25 },
            { icon: '🔔', value: 10 },
            { icon: '🍋', value: 5 }
        ];
        
        this.init();
    }

    init() {
        if (window.Aspenini) {
            Aspenini.waitForReady().then(() => {
                this.loadGame();
                this.bindEvents();
                this.updateUI();
            });
        } else {
            this.bindEvents();
            this.updateUI();
        }
    }

    bindEvents() {
        document.getElementById('buyBtn').addEventListener('click', () => this.buyTicket());
        document.getElementById('continueBtn').addEventListener('click', () => this.checkWin());
        
        document.getElementById('ticketCost').addEventListener('change', (e) => {
            this.ticketCost = parseInt(e.target.value);
        });
    }

    loadGame() {
        const saveData = Aspenini.load();
        if (saveData) {
            this.balance = saveData.balance || 1000;
            this.highScore = saveData.highScore || 1000;
            this.ticketNumber = saveData.ticketNumber || 1;
            this.stats = saveData.stats || {
                ticketsPlayed: 0,
                ticketsWon: 0,
                totalWinnings: 0,
                biggestWin: 0
            };
            
            if (this.balance <= 0) {
                this.balance = 1000;
                this.showMessage('Fresh start! 1000 credits added!');
            }
        }
    }

    saveGame() {
        // Update high score if current balance is higher
        if (this.balance > this.highScore) {
            this.highScore = this.balance;
        }
        
        if (window.Aspenini) {
            Aspenini.save({
                balance: this.balance,
                highScore: this.highScore,
                ticketNumber: this.ticketNumber,
                stats: this.stats,
                timestamp: Date.now()
            });
        }
    }

    buyTicket() {
        if (this.ticketCost > this.balance) {
            this.showMessage('Insufficient credits!');
            return;
        }

        this.balance -= this.ticketCost;
        this.stats.ticketsPlayed++;
        this.scratchedAreas.clear();
        
        this.currentTicket = this.generateTicket();
        this.renderTicket();
        
        document.getElementById('ticketNumber').textContent = String(this.ticketNumber).padStart(6, '0');
        this.ticketNumber++;
        
        this.showMessage('Scratch each symbol at least once!');
        document.getElementById('buyBtn').disabled = true;
        document.getElementById('continueBtn').disabled = true;
        
        this.updateUI();
    }

    generateTicket() {
        const ticket = [];
        const winChance = Math.random();
        
        // 30% chance to win
        if (winChance < 0.3) {
            // Generate winning ticket
            const winningSymbol = this.symbols[Math.floor(Math.random() * this.symbols.length)];
            
            // Place 3 matching symbols randomly
            const positions = [0, 1, 2, 3, 4, 5, 6, 7, 8];
            this.shuffleArray(positions);
            
            for (let i = 0; i < 9; i++) {
                if (i < 3) {
                    ticket[positions[i]] = winningSymbol;
                } else {
                    // Fill with random different symbols
                    let randomSymbol;
                    do {
                        randomSymbol = this.symbols[Math.floor(Math.random() * this.symbols.length)];
                    } while (randomSymbol.icon === winningSymbol.icon);
                    ticket[positions[i]] = randomSymbol;
                }
            }
        } else {
            // Generate losing ticket (no 3 matches)
            for (let i = 0; i < 9; i++) {
                ticket[i] = this.symbols[Math.floor(Math.random() * this.symbols.length)];
            }
            
            // Ensure no 3 matches
            const counts = {};
            ticket.forEach(s => {
                counts[s.icon] = (counts[s.icon] || 0) + 1;
            });
            
            // If accidentally created a winner, modify it
            Object.keys(counts).forEach(icon => {
                if (counts[icon] >= 3) {
                    for (let i = 0; i < 9; i++) {
                        if (ticket[i].icon === icon && counts[icon] > 2) {
                            let newSymbol;
                            do {
                                newSymbol = this.symbols[Math.floor(Math.random() * this.symbols.length)];
                            } while (newSymbol.icon === icon);
                            ticket[i] = newSymbol;
                            counts[icon]--;
                        }
                    }
                }
            });
        }
        
        return ticket;
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    renderTicket() {
        const container = document.getElementById('scratchAreas');
        container.innerHTML = '';

        this.currentTicket.forEach((symbol, index) => {
            const areaDiv = document.createElement('div');
            areaDiv.className = 'scratch-area';
            
            const symbolDiv = document.createElement('div');
            symbolDiv.className = 'scratch-symbol';
            symbolDiv.textContent = symbol.icon;
            
            const canvas = document.createElement('canvas');
            canvas.className = 'scratch-canvas';
            canvas.width = 200;
            canvas.height = 200;
            
            areaDiv.appendChild(symbolDiv);
            areaDiv.appendChild(canvas);
            container.appendChild(areaDiv);
            
            this.setupScratchCanvas(canvas, index);
        });
    }

    setupScratchCanvas(canvas, index) {
        const ctx = canvas.getContext('2d');
        
        // Draw silver overlay
        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        let isDrawing = false;
        
        const scratch = (x, y) => {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.arc(x, y, 15, 0, Math.PI * 2);
            ctx.fill();
            
            this.checkScratchProgress(canvas, index);
        };
        
        canvas.addEventListener('mousedown', () => isDrawing = true);
        canvas.addEventListener('mouseup', () => isDrawing = false);
        canvas.addEventListener('mouseleave', () => isDrawing = false);
        
        canvas.addEventListener('mousemove', (e) => {
            if (isDrawing) {
                const rect = canvas.getBoundingClientRect();
                const x = (e.clientX - rect.left) * (canvas.width / rect.width);
                const y = (e.clientY - rect.top) * (canvas.height / rect.height);
                scratch(x, y);
            }
        });
        
        // Touch support
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            isDrawing = true;
        });
        
        canvas.addEventListener('touchend', () => isDrawing = false);
        
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (isDrawing) {
                const rect = canvas.getBoundingClientRect();
                const touch = e.touches[0];
                const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
                const y = (touch.clientY - rect.top) * (canvas.height / rect.height);
                scratch(x, y);
            }
        });
    }

    checkScratchProgress(canvas, index) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        
        let transparentPixels = 0;
        for (let i = 3; i < pixels.length; i += 4) {
            if (pixels[i] < 128) transparentPixels++;
        }
        
        const scratchedPercent = (transparentPixels / (pixels.length / 4)) * 100;
        
        // Mark as scratched if at least 15% is revealed
        if (scratchedPercent > 15 && !this.scratchedAreas.has(index)) {
            this.scratchedAreas.add(index);
            
            // Enable continue button once all 9 areas are scratched
            if (this.scratchedAreas.size === 9) {
                document.getElementById('continueBtn').disabled = false;
                this.showMessage('All revealed! Click Continue to see your prize!');
            }
        }
    }

    checkWin() {
        // Clear all scratch overlays to fully reveal
        const canvases = document.querySelectorAll('.scratch-canvas');
        canvases.forEach(canvas => {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        });
        
        // Check for winning combinations
        const symbolCounts = {};
        this.currentTicket.forEach(symbol => {
            symbolCounts[symbol.icon] = (symbolCounts[symbol.icon] || 0) + 1;
        });
        
        let winningSymbol = null;
        Object.keys(symbolCounts).forEach(icon => {
            if (symbolCounts[icon] >= 3) {
                winningSymbol = this.currentTicket.find(s => s.icon === icon);
            }
        });
        
        if (winningSymbol) {
            const winAmount = winningSymbol.value * this.ticketCost;
            this.balance += winAmount;
            this.stats.ticketsWon++;
            this.stats.totalWinnings += winAmount;
            
            if (winAmount > this.stats.biggestWin) {
                this.stats.biggestWin = winAmount;
            }
            
            this.showMessage(`🎉 YOU WIN ${winAmount} CREDITS! 🎉`, true);
            this.highlightWinningSymbols(winningSymbol.icon);
        } else {
            this.showMessage('No match. Better luck next time!');
        }
        
        document.getElementById('buyBtn').disabled = false;
        document.getElementById('continueBtn').disabled = true;
        
        this.saveGame();
        this.updateUI();

        if (this.balance <= 0) {
            setTimeout(() => {
                this.balance = 1000;
                this.showMessage('Out of credits! Fresh start: 1000 credits!');
                this.updateUI();
                this.saveGame();
            }, 3000);
        }
    }

    highlightWinningSymbols(winningIcon) {
        const areas = document.querySelectorAll('.scratch-area');
        areas.forEach((area, index) => {
            if (this.currentTicket[index].icon === winningIcon) {
                area.classList.add('winning');
            }
        });
    }

    showMessage(text, isWin = false) {
        const messageBox = document.getElementById('messageBox');
        messageBox.textContent = text;
        messageBox.className = 'message-box ' + (isWin ? 'win' : '');
    }

    updateUI() {
        document.getElementById('balance').textContent = this.balance;
        document.getElementById('highScore').textContent = this.highScore;
        document.getElementById('highScoreStat').textContent = this.highScore;
        document.getElementById('ticketsPlayed').textContent = this.stats.ticketsPlayed;
        document.getElementById('ticketsWon').textContent = this.stats.ticketsWon;
        document.getElementById('totalWinnings').textContent = this.stats.totalWinnings;
        document.getElementById('biggestWin').textContent = this.stats.biggestWin;
    }
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    window.game = new ScratchOff();
});

