/**
 * Aspenini-Fun SDK
 * Centralized API for games to interact with the hub's account and save system
 * 
 * Usage:
 *   <script src="../../aspenini-sdk.js"></script>
 *   const save = Aspenini.load();
 *   Aspenini.save({ score: 100, level: 5 });
 */

class AspeniniSDK {
    constructor() {
        this.accountData = null;
        this.gameId = null;
        this.isInIframe = window !== window.top;
        this.ready = false;
        
        this.init();
    }

    init() {
        // Detect game ID from URL path
        this.detectGameId();
        
        if (this.isInIframe) {
            // Running in hub iframe - use postMessage communication
            this.setupIframeMode();
        } else {
            // Running standalone - use localStorage fallback
            this.setupStandaloneMode();
        }
    }

    detectGameId() {
        // First, check for explicit game ID in meta tag (highest priority)
        const gameIdMeta = document.querySelector('meta[name="aspenini-game-id"]');
        if (gameIdMeta && gameIdMeta.content) {
            this.gameId = gameIdMeta.content;
            return;
        }
        
        // Second, check for data attribute on body/html
        const bodyGameId = document.body?.dataset?.gameId || document.documentElement?.dataset?.gameId;
        if (bodyGameId) {
            this.gameId = bodyGameId;
            return;
        }
        
        // Third, try to detect from URL path
        const path = window.location.pathname.toLowerCase();
        
        // Map common paths to game IDs
        const pathMap = {
            'kevinklicker': 'kevin-klicker',
            'spacetetris': 'space-tetris',
            'space2048': 'space-2048',
            'colormemory': 'color-memory',
            'webrtc-pong': 'webrtc-pong',
            'slope': 'slope',
            'eaglercraftx': 'eaglercraftx'
        };
        
        for (const [key, id] of Object.entries(pathMap)) {
            if (path.includes(key)) {
                this.gameId = id;
                return;
            }
        }
        
        // Fallback: use 'unknown' if nothing matches
        this.gameId = 'unknown';
    }

    setupIframeMode() {
        // Listen for account data from parent hub
        window.addEventListener('message', (event) => {
            if (event.data.type === 'ACCOUNT_DATA') {
                this.accountData = event.data.data;
                this.ready = true;
                
                // Dispatch event for games that want to listen
                window.dispatchEvent(new CustomEvent('aspenini:ready', {
                    detail: this.accountData
                }));
            }
        });

        // Request account data on load
        this.requestAccountData();
        
        // Add inline mode class to body
        document.body.classList.add('aspenini-inline-mode');
    }

    setupStandaloneMode() {
        // Try to access parent account system if available
        if (window.parent && window.parent.accountSystem) {
            this.accountData = {
                username: window.parent.accountSystem.currentUser,
                saveData: window.parent.accountSystem.getGameSave(this.gameId)
            };
        }
        
        this.ready = true;
        window.dispatchEvent(new CustomEvent('aspenini:ready', {
            detail: this.accountData
        }));
    }

    requestAccountData() {
        if (this.isInIframe && window.parent) {
            window.parent.postMessage({
                type: 'REQUEST_ACCOUNT_DATA'
            }, '*');
        }
    }

    /**
     * Load save data for this game
     * @returns {Object|null} Save data object or null if none exists
     */
    load() {
        if (this.accountData && this.accountData.saveData) {
            return this.accountData.saveData;
        }
        
        // Fallback to localStorage
        const saved = localStorage.getItem(`aspenini-${this.gameId}`);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.warn('Failed to parse save data:', e);
                return null;
            }
        }
        
        return null;
    }

    /**
     * Save game data
     * @param {Object} data - Game save data to store
     */
    save(data) {
        if (!data || typeof data !== 'object') {
            console.warn('Aspenini.save() expects an object');
            return;
        }

        if (this.isInIframe && window.parent) {
            // Send to parent hub via postMessage
            window.parent.postMessage({
                type: 'SAVE_GAME_DATA',
                gameId: this.gameId,
                data: data
            }, '*');
        } else if (window.parent && window.parent.accountSystem) {
            // Direct access to parent account system
            window.parent.accountSystem.setGameSave(this.gameId, data);
        } else {
            // Fallback to localStorage
            localStorage.setItem(`aspenini-${this.gameId}`, JSON.stringify(data));
        }
    }

    /**
     * Get current username
     * @returns {string|null} Username or null if guest
     */
    getUsername() {
        return this.accountData?.username || null;
    }

    /**
     * Check if user is logged in
     * @returns {boolean} True if logged in, false if guest
     */
    isLoggedIn() {
        return !!(this.accountData && this.accountData.username);
    }

    /**
     * Get game ID
     * @returns {string} Current game ID
     */
    getGameId() {
        return this.gameId;
    }

    /**
     * Wait for SDK to be ready
     * @returns {Promise} Resolves when SDK is ready
     */
    async waitForReady() {
        if (this.ready) {
            return Promise.resolve(this.accountData);
        }
        
        return new Promise((resolve) => {
            window.addEventListener('aspenini:ready', (event) => {
                resolve(event.detail);
            }, { once: true });
        });
    }
}

// Create global instance
const Aspenini = new AspeniniSDK();

// Expose globally for easy access
window.Aspenini = Aspenini;

// Export for module systems (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Aspenini;
}

