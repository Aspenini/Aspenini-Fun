// Video Poker - Using Aspenini SDK

class VideoPoker {
    constructor() {
        this.deck = [];
        this.hand = [];
        this.heldCards = new Set();
        this.balance = 1000;
        this.currentBet = 5;
        this.gameState = 'betting'; // betting, dealt, drawn
        this.highScore = 1000;
        
        this.stats = {
            handsPlayed: 0,
            handsWon: 0
        };
        
        this.payouts = {
            'royal-flush': 800,
            'straight-flush': 50,
            'four-kind': 25,
            'full-house': 9,
            'flush': 6,
            'straight': 4,
            'three-kind': 3,
            'two-pair': 2,
            'jacks-better': 1
        };
        
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
        document.getElementById('dealBtn').addEventListener('click', () => this.deal());
        document.getElementById('drawBtn').addEventListener('click', () => this.draw());
        
        document.getElementById('betAmount').addEventListener('change', (e) => {
            let value = parseInt(e.target.value);
            if (value < 1) value = 1;
            if (value > this.balance) value = this.balance;
            this.currentBet = value;
            e.target.value = value;
            this.updatePayoutTable();
        });

        document.querySelectorAll('.bet-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const betValue = btn.dataset.bet;
                if (betValue === 'max') {
                    this.currentBet = Math.min(100, this.balance);
                } else {
                    this.currentBet = Math.min(parseInt(betValue), this.balance);
                }
                document.getElementById('betAmount').value = this.currentBet;
                this.updatePayoutTable();
            });
        });
    }

    loadGame() {
        const saveData = Aspenini.load();
        if (saveData) {
            this.balance = saveData.balance || 1000;
            this.highScore = saveData.highScore || 1000;
            this.stats = saveData.stats || {
                handsPlayed: 0,
                handsWon: 0
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
                stats: this.stats,
                timestamp: Date.now()
            });
        }
    }

    createDeck() {
        const suits = ['♠', '♥', '♦', '♣'];
        const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        this.deck = [];

        for (let suit of suits) {
            for (let value of values) {
                this.deck.push({ suit, value });
            }
        }

        // Shuffle
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    deal() {
        if (this.currentBet > this.balance) {
            this.showMessage('Insufficient credits!');
            return;
        }

        this.balance -= this.currentBet;
        this.gameState = 'dealt';
        this.heldCards.clear();
        this.hand = [];
        
        this.createDeck();
        
        for (let i = 0; i < 5; i++) {
            this.hand.push(this.deck.pop());
        }

        this.renderCards();
        this.updateUI();
        this.showMessage('Select cards to hold, then click Draw');
        
        document.getElementById('dealBtn').disabled = true;
        document.getElementById('drawBtn').disabled = false;
    }

    draw() {
        this.gameState = 'drawn';
        this.stats.handsPlayed++;

        // Replace non-held cards
        for (let i = 0; i < 5; i++) {
            if (!this.heldCards.has(i)) {
                this.hand[i] = this.deck.pop();
            }
        }

        this.renderCards();
        
        const result = this.evaluateHand();
        if (result.hand) {
            const winAmount = this.payouts[result.hand] * this.currentBet;
            this.balance += winAmount;
            this.stats.handsWon++;
            this.showMessage(`${result.name}! You win ${winAmount} credits!`, true);
            this.highlightPayout(result.hand);
        } else {
            this.showMessage('No winning hand. Try again!');
        }

        this.updateUI();
        this.saveGame();

        document.getElementById('dealBtn').disabled = false;
        document.getElementById('drawBtn').disabled = true;

        if (this.balance <= 0) {
            setTimeout(() => {
                this.balance = 1000;
                this.showMessage('Out of credits! Fresh start: 1000 credits!');
                this.updateUI();
                this.saveGame();
            }, 3000);
        }
    }

    toggleHold(index) {
        if (this.gameState !== 'dealt') return;
        
        if (this.heldCards.has(index)) {
            this.heldCards.delete(index);
        } else {
            this.heldCards.add(index);
        }
        this.renderCards();
    }

    renderCards() {
        const container = document.getElementById('cardsContainer');
        container.innerHTML = '';

        this.hand.forEach((card, index) => {
            const cardEl = this.createCardElement(card, index);
            container.appendChild(cardEl);
        });
    }

    createCardElement(card, index) {
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        
        const isRed = ['♥', '♦'].includes(card.suit);
        cardEl.classList.add(isRed ? 'red' : 'black');
        
        if (this.heldCards.has(index)) {
            cardEl.classList.add('held');
        }

        cardEl.innerHTML = `
            <div style="font-size: 1.5rem;">${card.value}</div>
            <div style="font-size: 1.2rem;">${card.suit}</div>
        `;

        if (this.gameState === 'dealt') {
            cardEl.addEventListener('click', () => this.toggleHold(index));
        }

        return cardEl;
    }

    evaluateHand() {
        const values = this.hand.map(c => c.value);
        const suits = this.hand.map(c => c.suit);
        const valueCounts = {};
        
        // Count values
        values.forEach(v => {
            valueCounts[v] = (valueCounts[v] || 0) + 1;
        });

        const counts = Object.values(valueCounts).sort((a, b) => b - a);
        const isFlush = suits.every(s => s === suits[0]);
        const valueOrder = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
        const sortedValues = values.map(v => valueOrder.indexOf(v)).sort((a, b) => a - b);
        const isStraight = sortedValues.every((v, i) => i === 0 || v === sortedValues[i-1] + 1) ||
                          (sortedValues.join('') === '0,1,2,3,12'); // A-2-3-4-5

        const isRoyal = isStraight && sortedValues[0] === 8; // 10-J-Q-K-A

        // Check hands
        if (isRoyal && isFlush) {
            return { hand: 'royal-flush', name: '🌟 Royal Flush' };
        }
        if (isStraight && isFlush) {
            return { hand: 'straight-flush', name: '💎 Straight Flush' };
        }
        if (counts[0] === 4) {
            return { hand: 'four-kind', name: '🎰 Four of a Kind' };
        }
        if (counts[0] === 3 && counts[1] === 2) {
            return { hand: 'full-house', name: '🏠 Full House' };
        }
        if (isFlush) {
            return { hand: 'flush', name: '💧 Flush' };
        }
        if (isStraight) {
            return { hand: 'straight', name: '📏 Straight' };
        }
        if (counts[0] === 3) {
            return { hand: 'three-kind', name: '🎲 Three of a Kind' };
        }
        if (counts[0] === 2 && counts[1] === 2) {
            return { hand: 'two-pair', name: '👥 Two Pair' };
        }
        
        // Jacks or Better
        const highCards = ['J', 'Q', 'K', 'A'];
        if (counts[0] === 2) {
            const pairValue = Object.keys(valueCounts).find(k => valueCounts[k] === 2);
            if (highCards.includes(pairValue)) {
                return { hand: 'jacks-better', name: '🃏 Jacks or Better' };
            }
        }

        return { hand: null, name: 'No Win' };
    }

    showMessage(text, isWin = false) {
        const messageBox = document.getElementById('messageBox');
        messageBox.textContent = text;
        messageBox.className = 'message-box ' + (isWin ? 'win' : '');
    }

    highlightPayout(handType) {
        document.querySelectorAll('.payout-item').forEach(item => {
            item.classList.remove('highlight');
        });
        
        const item = document.querySelector(`[data-hand="${handType}"]`);
        if (item) {
            item.classList.add('highlight');
            setTimeout(() => item.classList.remove('highlight'), 2000);
        }
    }

    updatePayoutTable() {
        document.getElementById('betDisplay').textContent = this.currentBet;
        
        Object.keys(this.payouts).forEach(hand => {
            const elem = document.getElementById(`payout-${hand}`);
            if (elem) {
                elem.textContent = this.payouts[hand] * this.currentBet;
            }
        });
    }

    updateUI() {
        document.getElementById('balance').textContent = this.balance;
        document.getElementById('highScore').textContent = this.highScore;
        document.getElementById('highScoreStat').textContent = this.highScore;
        document.getElementById('handsPlayed').textContent = this.stats.handsPlayed;
        document.getElementById('handsWon').textContent = this.stats.handsWon;
        
        const winRate = this.stats.handsPlayed > 0 
            ? Math.round((this.stats.handsWon / this.stats.handsPlayed) * 100)
            : 0;
        document.getElementById('winRate').textContent = winRate + '%';

        this.updatePayoutTable();
    }
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    window.game = new VideoPoker();
});

