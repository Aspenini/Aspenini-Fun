// Cosmic Blackjack - Using Aspenini SDK for save management

class Blackjack {
    constructor() {
        this.deck = [];
        this.playerHand = [];
        this.dealerHand = [];
        this.balance = 1000;
        this.currentBet = 0;
        this.gameInProgress = false;
        this.dealerRevealed = false;
        this.highScore = 1000;
        
        // Statistics
        this.stats = {
            gamesPlayed: 0,
            gamesWon: 0,
            blackjacks: 0
        };
        
        this.init();
    }

    init() {
        // Wait for Aspenini SDK to be ready
        if (window.Aspenini) {
            Aspenini.waitForReady().then(() => {
                this.loadGame();
                this.bindEvents();
                this.updateUI();
            });
        } else {
            // Fallback if SDK not available
            this.bindEvents();
            this.updateUI();
        }
    }

    bindEvents() {
        document.getElementById('dealBtn').addEventListener('click', () => this.startGame());
        document.getElementById('hitBtn').addEventListener('click', () => this.hit());
        document.getElementById('standBtn').addEventListener('click', () => this.stand());
        document.getElementById('doubleBtn').addEventListener('click', () => this.doubleDown());
        document.getElementById('newGameBtn').addEventListener('click', () => this.resetGame());

        // Chip buttons
        document.querySelectorAll('.chip-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const amount = parseInt(btn.dataset.amount);
                this.addToBet(amount);
            });
        });

        // Bet input
        document.getElementById('betAmount').addEventListener('change', (e) => {
            let value = parseInt(e.target.value);
            if (value < 1) value = 1;
            if (value > this.balance) value = this.balance;
            e.target.value = value;
        });
    }

    loadGame() {
        const saveData = Aspenini.load();
        if (saveData) {
            this.balance = saveData.balance || 1000;
            this.highScore = saveData.highScore || 1000;
            this.stats = saveData.stats || {
                gamesPlayed: 0,
                gamesWon: 0,
                blackjacks: 0
            };
            
            // If player is broke, give them a fresh start
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
        const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        this.deck = [];

        for (let suit of suits) {
            for (let value of values) {
                this.deck.push({
                    suit: suit,
                    value: value,
                    numValue: this.getCardValue(value)
                });
            }
        }

        // Shuffle deck
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    getCardValue(value) {
        if (value === 'A') return 11;
        if (['J', 'Q', 'K'].includes(value)) return 10;
        return parseInt(value);
    }

    addToBet(amount) {
        if (this.gameInProgress) return;
        
        const betInput = document.getElementById('betAmount');
        let currentBet = parseInt(betInput.value);
        currentBet += amount;
        
        if (currentBet > this.balance) {
            currentBet = this.balance;
        }
        
        betInput.value = currentBet;
    }

    startGame() {
        const betAmount = parseInt(document.getElementById('betAmount').value);
        
        if (betAmount < 1) {
            this.showMessage('Please place a bet!');
            return;
        }
        
        if (betAmount > this.balance) {
            this.showMessage('Insufficient credits!');
            return;
        }

        this.currentBet = betAmount;
        this.balance -= betAmount;
        this.gameInProgress = true;
        this.dealerRevealed = false;
        this.playerHand = [];
        this.dealerHand = [];

        this.createDeck();
        
        // Deal initial cards
        this.playerHand.push(this.deck.pop());
        this.dealerHand.push(this.deck.pop());
        this.playerHand.push(this.deck.pop());
        this.dealerHand.push(this.deck.pop());

        this.updateUI();
        this.renderCards();

        // Check for immediate blackjack
        if (this.calculateHand(this.playerHand) === 21) {
            setTimeout(() => this.checkBlackjack(), 500);
        } else {
            this.enableGameButtons();
        }
    }

    hit() {
        if (!this.gameInProgress) return;

        this.playerHand.push(this.deck.pop());
        this.renderCards();
        
        const playerValue = this.calculateHand(this.playerHand);
        
        if (playerValue > 21) {
            this.endGame('bust');
        } else if (playerValue === 21) {
            this.stand();
        }
    }

    stand() {
        if (!this.gameInProgress) return;

        this.dealerRevealed = true;
        this.disableGameButtons();
        
        // Dealer must hit on 16 and stand on 17
        const dealerPlay = () => {
            const dealerValue = this.calculateHand(this.dealerHand);
            
            if (dealerValue < 17) {
                setTimeout(() => {
                    this.dealerHand.push(this.deck.pop());
                    this.renderCards();
                    dealerPlay();
                }, 600);
            } else {
                setTimeout(() => this.determineWinner(), 600);
            }
        };

        this.renderCards();
        setTimeout(() => dealerPlay(), 600);
    }

    doubleDown() {
        if (!this.gameInProgress || this.playerHand.length !== 2) return;
        if (this.currentBet > this.balance) {
            this.showMessage('Insufficient credits to double!');
            return;
        }

        this.balance -= this.currentBet;
        this.currentBet *= 2;
        this.updateUI();

        this.playerHand.push(this.deck.pop());
        this.renderCards();

        const playerValue = this.calculateHand(this.playerHand);
        
        if (playerValue > 21) {
            this.endGame('bust');
        } else {
            this.stand();
        }
    }

    checkBlackjack() {
        const playerValue = this.calculateHand(this.playerHand);
        this.dealerRevealed = true;
        this.renderCards();
        
        const dealerValue = this.calculateHand(this.dealerHand);
        
        if (playerValue === 21 && dealerValue === 21) {
            this.endGame('push');
        } else if (playerValue === 21) {
            this.stats.blackjacks++;
            this.endGame('blackjack');
        } else if (dealerValue === 21) {
            this.endGame('dealer-blackjack');
        }
    }

    determineWinner() {
        const playerValue = this.calculateHand(this.playerHand);
        const dealerValue = this.calculateHand(this.dealerHand);

        if (dealerValue > 21) {
            this.endGame('dealer-bust');
        } else if (playerValue > dealerValue) {
            this.endGame('win');
        } else if (playerValue < dealerValue) {
            this.endGame('lose');
        } else {
            this.endGame('push');
        }
    }

    endGame(result) {
        this.gameInProgress = false;
        this.dealerRevealed = true;
        this.stats.gamesPlayed++;

        let winAmount = 0;
        let message = '';
        let messageClass = '';

        switch (result) {
            case 'blackjack':
                winAmount = Math.floor(this.currentBet * 2.5); // 3:2 payout
                message = `🎉 BLACKJACK! You win ${winAmount} credits!`;
                messageClass = 'win';
                this.stats.gamesWon++;
                break;
            case 'win':
                winAmount = this.currentBet * 2;
                message = `🎊 You Win! +${winAmount} credits!`;
                messageClass = 'win';
                this.stats.gamesWon++;
                break;
            case 'dealer-bust':
                winAmount = this.currentBet * 2;
                message = `💥 Dealer Bust! You win ${winAmount} credits!`;
                messageClass = 'win';
                this.stats.gamesWon++;
                break;
            case 'push':
                winAmount = this.currentBet;
                message = '🤝 Push! Bet returned.';
                messageClass = '';
                break;
            case 'bust':
                message = '💥 BUST! You lose.';
                messageClass = 'lose';
                break;
            case 'dealer-blackjack':
                message = '🎰 Dealer Blackjack! You lose.';
                messageClass = 'lose';
                break;
            case 'lose':
                message = '😞 Dealer wins. You lose.';
                messageClass = 'lose';
                break;
        }

        this.balance += winAmount;
        this.currentBet = 0;

        this.renderCards();
        this.updateUI();
        this.showMessage(message, messageClass);
        this.saveGame();

        document.getElementById('newGameBtn').disabled = false;

        // Check if player is broke
        if (this.balance <= 0) {
            setTimeout(() => {
                this.balance = 1000;
                this.showMessage('💸 Out of credits! Fresh start: 1000 credits!');
                this.updateUI();
                this.saveGame();
            }, 3000);
        }
    }

    calculateHand(hand) {
        let value = 0;
        let aces = 0;

        for (let card of hand) {
            value += card.numValue;
            if (card.value === 'A') aces++;
        }

        // Adjust for aces
        while (value > 21 && aces > 0) {
            value -= 10;
            aces--;
        }

        return value;
    }

    renderCards() {
        const playerContainer = document.getElementById('playerCards');
        const dealerContainer = document.getElementById('dealerCards');

        // Render player cards
        playerContainer.innerHTML = '';
        this.playerHand.forEach((card, index) => {
            playerContainer.appendChild(this.createCardElement(card, false, index));
        });

        // Render dealer cards
        dealerContainer.innerHTML = '';
        this.dealerHand.forEach((card, index) => {
            const hideCard = !this.dealerRevealed && index === 1;
            dealerContainer.appendChild(this.createCardElement(card, hideCard, index));
        });

        // Update hand values
        document.getElementById('playerValue').textContent = this.calculateHand(this.playerHand);
        
        if (this.dealerRevealed) {
            document.getElementById('dealerValue').textContent = this.calculateHand(this.dealerHand);
        } else {
            document.getElementById('dealerValue').textContent = '?';
        }
    }

    createCardElement(card, hidden, index) {
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        cardEl.style.animationDelay = `${index * 0.1}s`;

        if (hidden) {
            cardEl.classList.add('card-back');
        } else {
            const isRed = ['♥', '♦'].includes(card.suit);
            cardEl.classList.add(isRed ? 'red' : 'black');
            cardEl.innerHTML = `
                <div style="font-size: 1.5rem;">${card.value}</div>
                <div style="font-size: 1.2rem;">${card.suit}</div>
            `;
        }

        return cardEl;
    }

    enableGameButtons() {
        document.getElementById('hitBtn').disabled = false;
        document.getElementById('standBtn').disabled = false;
        document.getElementById('doubleBtn').disabled = this.playerHand.length !== 2 || this.currentBet > this.balance;
        document.getElementById('dealBtn').disabled = true;
        document.getElementById('newGameBtn').disabled = true;
    }

    disableGameButtons() {
        document.getElementById('hitBtn').disabled = true;
        document.getElementById('standBtn').disabled = true;
        document.getElementById('doubleBtn').disabled = true;
    }

    resetGame() {
        this.gameInProgress = false;
        this.currentBet = 0;
        this.dealerRevealed = false;
        this.playerHand = [];
        this.dealerHand = [];

        document.getElementById('playerCards').innerHTML = '';
        document.getElementById('dealerCards').innerHTML = '';
        document.getElementById('playerValue').textContent = '0';
        document.getElementById('dealerValue').textContent = '0';

        document.getElementById('dealBtn').disabled = false;
        document.getElementById('newGameBtn').disabled = true;
        this.disableGameButtons();

        this.showMessage('Place your bet to start!');
        this.updateUI();
    }

    showMessage(text, className = '') {
        const messageBox = document.getElementById('messageBox');
        messageBox.textContent = text;
        messageBox.className = 'message-box ' + className;
    }

    updateUI() {
        document.getElementById('balance').textContent = this.balance;
        document.getElementById('highScore').textContent = this.highScore;
        document.getElementById('highScoreStat').textContent = this.highScore;
        document.getElementById('gamesPlayed').textContent = this.stats.gamesPlayed;
        document.getElementById('gamesWon').textContent = this.stats.gamesWon;
        document.getElementById('blackjacks').textContent = this.stats.blackjacks;
        
        const winRate = this.stats.gamesPlayed > 0 
            ? Math.round((this.stats.gamesWon / this.stats.gamesPlayed) * 100)
            : 0;
        document.getElementById('winRate').textContent = winRate + '%';
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Blackjack();
});

