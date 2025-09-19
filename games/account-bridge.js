// Account System Bridge for Inline Games
// This script enables games to communicate with the main hub's account system

class AccountBridge {
    constructor() {
        this.accountData = null;
        this.isInIframe = window !== window.top;
        this.init();
    }

    init() {
        if (this.isInIframe) {
            // We're running in an iframe, set up communication with parent
            this.setupIframeCommunication();
            // Add inline mode class to hide back buttons
            document.body.classList.add('inline-mode');
        } else {
            // We're running standalone, use local storage
            this.setupStandaloneMode();
        }
    }

    setupIframeCommunication() {
        // Listen for account data from parent window
        window.addEventListener('message', (event) => {
            if (event.data.type === 'ACCOUNT_DATA') {
                this.accountData = event.data.data;
                console.log('Account data received:', this.accountData);
                
                // Trigger custom event for games to listen to
                window.dispatchEvent(new CustomEvent('accountDataLoaded', {
                    detail: this.accountData
                }));
            }
        });

        // Request account data when the game loads
        this.requestAccountData();
    }

    setupStandaloneMode() {
        // In standalone mode, try to access the parent account system
        if (window.parent && window.parent.accountSystem) {
            this.accountData = {
                username: window.parent.accountSystem.currentUser,
                saveData: window.parent.accountSystem.getGameSave(this.getGameId())
            };
        }
    }

    requestAccountData() {
        if (this.isInIframe && window.parent) {
            window.parent.postMessage({
                type: 'REQUEST_ACCOUNT_DATA'
            }, '*');
        }
    }

    getGameId() {
        // Try to determine game ID from URL or other means
        const path = window.location.pathname;
        if (path.includes('KevinKlicker')) return 'kevin-klicker';
        if (path.includes('SpaceTetris')) return 'space-tetris';
        if (path.includes('Space2048')) return 'space-2048';
        if (path.includes('ColorMemory')) return 'color-memory';
        return 'unknown';
    }

    saveGameData(gameData) {
        if (this.isInIframe && window.parent) {
            // Send save data to parent
            window.parent.postMessage({
                type: 'SAVE_GAME_DATA',
                data: gameData
            }, '*');
        } else if (window.parent && window.parent.accountSystem) {
            // Direct access to parent account system
            window.parent.accountSystem.setGameSave(this.getGameId(), gameData);
        } else {
            // Fallback to localStorage
            localStorage.setItem(`${this.getGameId()}-save`, JSON.stringify(gameData));
        }
    }

    loadGameData() {
        if (this.accountData && this.accountData.saveData) {
            return this.accountData.saveData;
        }
        
        // Fallback to localStorage
        const saved = localStorage.getItem(`${this.getGameId()}-save`);
        return saved ? JSON.parse(saved) : null;
    }

    getUsername() {
        return this.accountData ? this.accountData.username : null;
    }

    isLoggedIn() {
        return this.accountData && this.accountData.username;
    }
}

// Create global instance
window.accountBridge = new AccountBridge();

// Helper functions for easy access
window.saveToAccount = (data) => window.accountBridge.saveGameData(data);
window.loadFromAccount = () => window.accountBridge.loadGameData();
window.getAccountUsername = () => window.accountBridge.getUsername();
window.isAccountLoggedIn = () => window.accountBridge.isLoggedIn();
