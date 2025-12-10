// Slot Machine - Using Aspenini SDK

class SlotMachine {
    constructor() {
        this.balance = 1000;
        this.bet = 5;
        this.isSpinning = false;
        this.highScore = 1000;
        
        this.symbols = ['💎', '⭐', '🍀', '7️⃣', '🔔', '🍒', '🍋', '🍊', '🍇'];
        
        this.payouts = {
            '💎': 1000,
            '⭐': 500,
            '🍀': 100,
            '7️⃣': 77,
            '🔔': 50,
            '🍒': 20,
            '🍋': 10,
            '🍊': 5,
            '🍇': 3
        };
        
        this.stats = {
            totalSpins: 0,
            totalWins: 0,
            biggestWin: 0
        };
        
        this.reels = [null, null, null];
        
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
        document.getElementById('spinBtn').addEventListener('click', () => this.spin());
        document.getElementById('minBet').addEventListener('click', () => this.setBet(1));
        document.getElementById('maxBet').addEventListener('click', () => this.setBet(50));
        document.getElementById('increaseBet').addEventListener('click', () => this.adjustBet(1));
        document.getElementById('decreaseBet').addEventListener('click', () => this.adjustBet(-1));
        
        document.getElementById('betSlider').addEventListener('input', (e) => {
            this.setBet(parseInt(e.target.value));
        });
    }

    loadGame() {
        const saveData = Aspenini.load();
        if (saveData) {
            this.balance = saveData.balance || 1000;
            this.highScore = saveData.highScore || 1000;
            this.stats = saveData.stats || {
                totalSpins: 0,
                totalWins: 0,
                biggestWin: 0
            };
            
            if (this.balance <= 0) {
                this.balance = 1000;
                this.showMessage('Fresh start! 1000 credits!');
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
                stats: this.stats,
                timestamp: Date.now()
            });
        }
    }

    setBet(amount) {
        if (this.isSpinning) return;
        this.bet = Math.max(1, Math.min(50, Math.min(amount, this.balance)));
        document.getElementById('betSlider').value = this.bet;
        this.updateUI();
    }

    adjustBet(delta) {
        this.setBet(this.bet + delta);
    }

    async spin() {
        if (this.isSpinning) return;
        
        if (this.bet > this.balance) {
            this.showMessage('Insufficient credits!');
            return;
        }

        this.balance -= this.bet;
        this.stats.totalSpins++;
        this.isSpinning = true;
        
        document.getElementById('spinBtn').disabled = true;
        document.getElementById('spinBtn').classList.add('spinning');
        this.showMessage('Spinning...');
        
        // Clear previous winning highlights
        document.querySelectorAll('.payout-line').forEach(line => {
            line.classList.remove('winning');
        });
        
        // Start spinning animation
        this.reels = [
            this.getRandomSymbol(),
            this.getRandomSymbol(),
            this.getRandomSymbol()
        ];
        
        // Spin each reel with staggered stops
        await this.spinReel(0, 1000);
        await this.spinReel(1, 1500);
        await this.spinReel(2, 2000);
        
        this.checkWin();
        
        this.isSpinning = false;
        document.getElementById('spinBtn').disabled = false;
        document.getElementById('spinBtn').classList.remove('spinning');
        
        this.updateUI();
        this.saveGame();

        if (this.balance <= 0) {
            setTimeout(() => {
                this.balance = 1000;
                this.showMessage('Out of credits! Fresh start!');
                this.updateUI();
                this.saveGame();
            }, 3000);
        }
    }

    async spinReel(reelIndex, duration) {
        const reel = document.getElementById(`reel${reelIndex + 1}`);
        reel.classList.add('spinning');
        
        // Animate symbols changing rapidly
        const interval = setInterval(() => {
            reel.querySelector('.symbol').textContent = this.getRandomSymbol();
        }, 50);
        
        // Stop after duration
        await new Promise(resolve => setTimeout(resolve, duration));
        clearInterval(interval);
        
        reel.classList.remove('spinning');
        reel.classList.add('stopping');
        reel.querySelector('.symbol').textContent = this.reels[reelIndex];
        
        // Remove stopping animation
        setTimeout(() => reel.classList.remove('stopping'), 300);
    }

    getRandomSymbol() {
        // Weighted random - lower value symbols more common
        const weights = {
            '💎': 1,
            '⭐': 2,
            '🍀': 3,
            '7️⃣': 4,
            '🔔': 6,
            '🍒': 12,
            '🍋': 15,
            '🍊': 20,
            '🍇': 25
        };
        
        const pool = [];
        Object.keys(weights).forEach(symbol => {
            for (let i = 0; i < weights[symbol]; i++) {
                pool.push(symbol);
            }
        });
        
        return pool[Math.floor(Math.random() * pool.length)];
    }

    checkWin() {
        const [s1, s2, s3] = this.reels;
        let winAmount = 0;
        let winMessage = '';
        let winningLine = null;
        
        // Check for three of a kind
        if (s1 === s2 && s2 === s3) {
            winAmount = this.payouts[s1] * this.bet;
            winMessage = `${s1} ${s1} ${s1} - WIN ${winAmount} CREDITS!`;
            winningLine = `${s1} ${s1} ${s1}`;
        }
        // Check for two cherries (special case)
        else if (s1 === '🍒' && s2 === '🍒') {
            winAmount = 2 * this.bet;
            winMessage = `🍒🍒 - WIN ${winAmount} CREDITS!`;
            winningLine = '🍒 🍒 -';
        }
        
        if (winAmount > 0) {
            this.balance += winAmount;
            this.stats.totalWins++;
            
            if (winAmount > this.stats.biggestWin) {
                this.stats.biggestWin = winAmount;
            }
            
            if (winAmount >= this.bet * 50) {
                this.showMessage(`🎉 BIG WIN! ${winMessage}`, true);
            } else {
                this.showMessage(`✨ ${winMessage}`, true);
            }
            
            this.highlightWinningLine(winningLine);
        } else {
            this.showMessage('No match. Spin again!');
        }
    }

    highlightWinningLine(lineText) {
        if (!lineText) return;
        
        const lines = document.querySelectorAll('.payout-line');
        lines.forEach(line => {
            const symbols = line.querySelector('.symbols').textContent.trim();
            if (symbols === lineText) {
                line.classList.add('winning');
            }
        });
    }

    showMessage(text, isBigWin = false) {
        const display = document.getElementById('winDisplay');
        display.textContent = text;
        display.className = 'win-display ' + (isBigWin ? 'big-win' : '');
    }

    updateUI() {
        document.getElementById('balance').textContent = this.balance;
        document.getElementById('highScore').textContent = this.highScore;
        document.getElementById('highScoreStat').textContent = this.highScore;
        document.getElementById('betAmount').textContent = this.bet;
        document.getElementById('totalSpins').textContent = this.stats.totalSpins;
        document.getElementById('totalWins').textContent = this.stats.totalWins;
        document.getElementById('biggestWin').textContent = this.stats.biggestWin;
        
        const winRate = this.stats.totalSpins > 0 
            ? Math.round((this.stats.totalWins / this.stats.totalSpins) * 100)
            : 0;
        document.getElementById('winRate').textContent = winRate + '%';
    }
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    window.game = new SlotMachine();
});

