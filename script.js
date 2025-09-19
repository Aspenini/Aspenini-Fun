// Aspenini-Fun Hub JavaScript
class GameHub {
    constructor() {
        this.games = [];
        this.gamesGrid = document.getElementById('gamesGrid');
        this.gameCount = document.getElementById('gameCount');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        
        this.init();
    }

    init() {
        this.showLoading();
        
        // Use requestIdleCallback for better performance on low-end devices
        if (window.requestIdleCallback) {
            window.requestIdleCallback(() => {
                this.loadGames();
                this.renderGames();
                this.updateStats();
                this.hideLoading();
                this.addEventListeners();
            });
        } else {
            // Fallback for browsers that don't support requestIdleCallback
            setTimeout(() => {
                this.loadGames();
                this.renderGames();
                this.updateStats();
                this.hideLoading();
                this.addEventListeners();
            }, 100);
        }
    }

    showLoading() {
        this.loadingOverlay.classList.add('active');
    }

    hideLoading() {
        this.loadingOverlay.classList.remove('active');
    }

    loadGames() {
        try {
            console.log('Loading games from embedded HTML data...');
            const gamesScript = document.getElementById('games-data');
            if (gamesScript) {
                this.games = JSON.parse(gamesScript.textContent);
                console.log('Games loaded successfully:', this.games);
            } else {
                console.log('No games data found - no games available');
                this.games = [];
            }
        } catch (error) {
            console.log('Could not parse games data:', error.message);
            this.games = [];
        }
    }
    

    // Method to add a new game (for future use)
    addGame(gameData) {
        this.games.push(gameData);
        
        // Show updated games array for easy copying to HTML
        console.log('Game added:', gameData);
        console.log('Updated games list (copy this to HTML games-data script tag):');
        console.log(JSON.stringify(this.games, null, 6));
        
        // Re-render the games
        this.renderGames();
        this.updateStats();
    }

    formatTitle(gameName) {
        return gameName
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    renderGames() {
        console.log('Rendering games. Count:', this.games.length);
        
        if (this.games.length === 0) {
            console.log('No games found, showing no games message');
            this.renderNoGames();
            return;
        }

        this.gamesGrid.innerHTML = '';
        
        // Use document fragment for better performance
        const fragment = document.createDocumentFragment();
        
        this.games.forEach((game, index) => {
            console.log(`Creating card for game ${index + 1}:`, game.title);
            const gameCard = this.createGameCard(game);
            fragment.appendChild(gameCard);
        });
        
        this.gamesGrid.appendChild(fragment);
        console.log('Games rendered successfully');
    }

    createGameCard(game) {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.dataset.gameId = game.id;
        
        // Create cover image element
        const coverImage = game.cover ? 
            `<img src="${game.cover}" alt="${game.title} cover" class="game-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
             <div class="game-icon fallback-icon" style="display: none;">
                <div class="fallback-emoji">${game.icon}</div>
                <div class="fallback-title">${game.title}</div>
             </div>` :
            `<div class="game-icon">
                <div class="fallback-emoji">${game.icon}</div>
                <div class="fallback-title">${game.title}</div>
             </div>`;
        
        // Determine if game should open in new tab
        const shouldOpenInNewTab = game.openInNewTab !== false; // Default to true if not specified
        const target = shouldOpenInNewTab ? '_blank' : '_self';
        
        card.innerHTML = `
            ${coverImage}
            <div class="game-info">
                <p class="game-description">${game.description}</p>
                <a href="${game.path}" class="play-button" target="${target}">Play Now</a>
            </div>
        `;

        // Add click event to the card (excluding the play button)
        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('play-button')) {
                this.openGame(game);
            }
        });

        return card;
    }

    renderNoGames() {
        this.gamesGrid.innerHTML = `
            <div class="no-games">
                <h3>No Games Found</h3>
                <p>Add your games to the <strong>games/</strong> folder to get started!</p>
                <p>Each game should be in its own subfolder with an <strong>index.html</strong> file.</p>
                <p>Optionally, add a <strong>game-info.json</strong> file for custom title, description, and icon.</p>
            </div>
        `;
    }

    openGame(game) {
        // Optimized visual feedback for Chromebook
        const card = document.querySelector(`[data-game-id="${game.id}"]`);
        
        // Use CSS class instead of direct style manipulation for better performance
        card.classList.add('clicked');
        
        // Determine if game should open in new tab
        const shouldOpenInNewTab = game.openInNewTab !== false; // Default to true if not specified
        const target = shouldOpenInNewTab ? '_blank' : '_self';
        
        setTimeout(() => {
            window.open(game.path, target);
            card.classList.remove('clicked');
        }, 100); // Reduced timeout for snappier feel
    }

    updateStats() {
        this.gameCount.textContent = this.games.length;
        
        // Add a counting animation
        this.animateNumber(this.gameCount, 0, this.games.length, 1000);
    }

    animateNumber(element, start, end, duration) {
        const startTime = performance.now();
        const range = end - start;

        const updateNumber = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const current = Math.floor(start + (range * this.easeOutQuart(progress)));
            
            element.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            }
        };

        requestAnimationFrame(updateNumber);
    }

    easeOutQuart(t) {
        return 1 - Math.pow(1 - t, 4);
    }

    addEventListeners() {
        // Add keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Close any modals or overlays
                this.hideLoading();
            }
        });

    }





    // Method to add a new game dynamically
    addGame(gameData) {
        this.games.push(gameData);
        this.renderGames();
        this.updateStats();
    }

    // Helper method to create properly formatted game data
    createGameData(id, title, description, icon, htmlFileName = 'index.html', coverImage = null, openInNewTab = true) {
        const gameData = {
            id: id,
            title: title,
            description: description,
            icon: icon,
            path: `games/${id}/${htmlFileName}`,
            openInNewTab: openInNewTab
        };
        
        if (coverImage) {
            gameData.cover = `games/${id}/${coverImage}`;
        }
        
        return gameData;
    }


    // Method to refresh the game list
    refresh() {
        this.showLoading();
        this.loadGames();
        this.renderGames();
        this.updateStats();
        this.hideLoading();
    }
}

// Account System
class AccountSystem {
    constructor() {
        this.currentUser = null;
        this.saveData = {};
        this.init();
    }
    
    init() {
        this.loadAccount();
        this.bindEvents();
        this.updateAccountDisplay();
    }
    
    bindEvents() {
        document.getElementById('accountBtn').addEventListener('click', () => this.showAccountPanel());
        document.getElementById('closeAccountPanel').addEventListener('click', () => this.hideAccountPanel());
        
        // Close panel when clicking outside
        document.getElementById('accountPanel').addEventListener('click', (e) => {
            if (e.target.id === 'accountPanel') {
                this.hideAccountPanel();
            }
        });
    }
    
    showAccountPanel() {
        const panel = document.getElementById('accountPanel');
        const body = document.getElementById('accountBody');
        
        if (this.currentUser) {
            this.showLoggedInView(body);
        } else {
            this.showLoginView(body);
        }
        
        panel.classList.add('active');
    }
    
    hideAccountPanel() {
        document.getElementById('accountPanel').classList.remove('active');
    }
    
    showLoginView(container) {
        container.innerHTML = `
            <div class="account-form">
                <p style="color: #b8b8ff; text-align: center; margin-bottom: 20px;">
                    Create an account to save your progress across all games!
                </p>
                
                <div class="form-group">
                    <label class="form-label">Choose a username:</label>
                    <input type="text" class="form-input" id="usernameInput" placeholder="@username" maxlength="20">
                </div>
                
                <div class="account-actions">
                    <button class="account-btn" id="createAccountBtn">Create Account</button>
                </div>
                
                <div style="text-align: center; margin: 20px 0; color: #b8b8ff;">- OR -</div>
                
                <div class="account-actions">
                    <button class="account-btn secondary" id="importDataBtn">Import Save Data</button>
                </div>
                
                <textarea class="form-input" id="importDataInput" placeholder="Paste your encoded save data here..." style="display: none; height: 100px; resize: vertical;"></textarea>
            </div>
        `;
        
        document.getElementById('createAccountBtn').addEventListener('click', () => this.createAccount());
        document.getElementById('importDataBtn').addEventListener('click', () => this.showImportInput());
    }
    
    showLoggedInView(container) {
        const stats = this.getSaveDataStats();
        
        container.innerHTML = `
            <div class="account-info">
                <div class="username-display">@${this.currentUser}</div>
                <div class="save-stats">
                    ${stats}
                </div>
            </div>
            
            <div class="account-actions">
                <button class="account-btn" id="copyDataBtn">Copy Save Data</button>
                <button class="account-btn secondary" id="logoutBtn">Logout</button>
            </div>
            
            <div style="margin-top: 20px;">
                <div class="form-group">
                    <label class="form-label">Import/Update Save Data:</label>
                    <textarea class="form-input" id="updateDataInput" placeholder="Paste encoded save data to update..." style="height: 80px; resize: vertical;"></textarea>
                </div>
                <div class="account-actions">
                    <button class="account-btn secondary" id="updateDataBtn">Update Data</button>
                </div>
            </div>
        `;
        
        document.getElementById('copyDataBtn').addEventListener('click', () => this.copyDataToClipboard());
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        document.getElementById('updateDataBtn').addEventListener('click', () => this.updateSaveData());
    }
    
    showImportInput() {
        const importInput = document.getElementById('importDataInput');
        const importBtn = document.getElementById('importDataBtn');
        
        if (importInput.style.display === 'none') {
            importInput.style.display = 'block';
            importBtn.textContent = 'Import Data';
            importBtn.onclick = () => this.importSaveData();
        }
    }
    
    createAccount() {
        const username = document.getElementById('usernameInput').value.trim();
        
        if (!username) {
            alert('Please enter a username!');
            return;
        }
        
        // Clean username (remove @ if added)
        const cleanUsername = username.replace(/^@/, '');
        
        if (cleanUsername.length < 3) {
            alert('Username must be at least 3 characters!');
            return;
        }
        
        this.currentUser = cleanUsername;
        this.saveData = {};
        this.saveAccount();
        this.updateAccountDisplay();
        this.hideAccountPanel();
    }
    
    importSaveData() {
        const encodedData = document.getElementById('importDataInput').value.trim();
        
        if (!encodedData) {
            alert('Please paste your save data!');
            return;
        }
        
        try {
            const decoded = this.decodeData(encodedData);
            const data = JSON.parse(decoded);
            
            this.currentUser = data.username;
            this.saveData = data.saveData || {};
            this.saveAccount();
            this.updateAccountDisplay();
            this.hideAccountPanel();
            
            alert('Save data imported successfully!');
        } catch (error) {
            alert('Invalid save data format!');
        }
    }
    
    updateSaveData() {
        const encodedData = document.getElementById('updateDataInput').value.trim();
        
        if (!encodedData) {
            alert('Please paste save data to update!');
            return;
        }
        
        try {
            const decoded = this.decodeData(encodedData);
            const data = JSON.parse(decoded);
            
            // Merge save data
            this.saveData = { ...this.saveData, ...data.saveData };
            this.saveAccount();
            
            alert('Save data updated successfully!');
            this.showAccountPanel(); // Refresh the panel
        } catch (error) {
            alert('Invalid save data format!');
        }
    }
    
    copyDataToClipboard() {
        const data = {
            username: this.currentUser,
            saveData: this.saveData,
            exportDate: new Date().toISOString()
        };
        
        const encoded = this.encodeData(JSON.stringify(data));
        
        navigator.clipboard.writeText(encoded).then(() => {
            alert('Save data copied to clipboard!');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = encoded;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('Save data copied to clipboard!');
        });
    }
    
    logout() {
        if (confirm('Are you sure you want to logout? Your save data will remain stored locally.')) {
            this.currentUser = null;
            this.saveData = {};
            localStorage.removeItem('aspeniniAccount');
            this.updateAccountDisplay();
            this.hideAccountPanel();
        }
    }
    
    // Simple encoding to prevent easy cheating (Base64 + simple scramble)
    encodeData(data) {
        const scrambled = data.split('').reverse().join('');
        return btoa(scrambled).split('').reverse().join('');
    }
    
    decodeData(encoded) {
        const unscrambled = encoded.split('').reverse().join('');
        return atob(unscrambled).split('').reverse().join('');
    }
    
    saveAccount() {
        const accountData = {
            username: this.currentUser,
            saveData: this.saveData
        };
        localStorage.setItem('aspeniniAccount', JSON.stringify(accountData));
    }
    
    loadAccount() {
        const saved = localStorage.getItem('aspeniniAccount');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.currentUser = data.username;
                this.saveData = data.saveData || {};
            } catch (error) {
                console.log('Error loading account:', error);
            }
        }
    }
    
    updateAccountDisplay() {
        const accountName = document.getElementById('accountName');
        accountName.textContent = this.currentUser ? `@${this.currentUser}` : 'Guest';
    }
    
    getSaveDataStats() {
        const gameCount = Object.keys(this.saveData).length;
        const totalSize = JSON.stringify(this.saveData).length;
        
        return `
            Games with save data: ${gameCount}
            Total save size: ${totalSize} characters
            Account created: ${this.currentUser ? 'Yes' : 'No'}
        `;
    }
    
    // Methods for games to use
    getGameSave(gameId) {
        return this.saveData[gameId] || null;
    }
    
    setGameSave(gameId, data) {
        this.saveData[gameId] = data;
        this.saveAccount();
    }
}

// Initialize the game hub and account system when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.gameHub = new GameHub();
    window.accountSystem = new AccountSystem();
});

// Add some fun easter eggs
document.addEventListener('keydown', (e) => {
    // Konami code easter egg
    const konamiCode = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
    window.konamiSequence = window.konamiSequence || [];
    
    window.konamiSequence.push(e.keyCode);
    if (window.konamiSequence.length > konamiCode.length) {
        window.konamiSequence.shift();
    }
    
    if (window.konamiSequence.join(',') === konamiCode.join(',')) {
        // Easter egg: Add some visual flair
        document.body.style.animation = 'rainbow 2s ease-in-out';
        setTimeout(() => {
            document.body.style.animation = '';
        }, 2000);
        
        console.log('🎮 Konami Code activated! You found the secret!');
        window.konamiSequence = [];
    }
});

// Add rainbow animation for easter egg
const style = document.createElement('style');
style.textContent = `
    @keyframes rainbow {
        0%, 100% { filter: hue-rotate(0deg); }
        25% { filter: hue-rotate(90deg); }
        50% { filter: hue-rotate(180deg); }
        75% { filter: hue-rotate(270deg); }
    }
    
    .search-container {
        margin-bottom: 30px;
        text-align: center;
    }
    
    .search-input {
        padding: 15px 20px;
        border: none;
        border-radius: 25px;
        background: rgba(255, 255, 255, 0.1);
        color: white;
        font-size: 1rem;
        width: 100%;
        max-width: 400px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .search-input::placeholder {
        color: rgba(255, 255, 255, 0.7);
    }
    
    .search-input:focus {
        outline: none;
        border-color: #4ecdc4;
        box-shadow: 0 0 20px rgba(78, 205, 196, 0.3);
    }
    
    .category-filter {
        margin-bottom: 20px;
        text-align: center;
    }
    
    .category-select {
        padding: 10px 20px;
        border: none;
        border-radius: 20px;
        background: rgba(255, 255, 255, 0.1);
        color: white;
        font-size: 0.9rem;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        cursor: pointer;
    }
    
    .category-select:focus {
        outline: none;
        border-color: #4ecdc4;
    }
    
    .category-select option {
        background: #333;
        color: white;
    }
`;
document.head.appendChild(style);
