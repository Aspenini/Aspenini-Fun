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

        // Add search functionality
        this.addSearchFunctionality();
    }

    addSearchFunctionality() {
        // Create search input if it doesn't exist
        const existingSearch = document.querySelector('.search-container');
        if (existingSearch) return;

        const searchContainer = document.createElement('div');
        searchContainer.className = 'search-container';
        searchContainer.innerHTML = `
            <input type="text" id="gameSearch" placeholder="Search games..." class="search-input">
        `;

        const gamesSection = document.querySelector('.games-section');
        gamesSection.insertBefore(searchContainer, this.gamesGrid);

        // Add search functionality
        const searchInput = document.getElementById('gameSearch');
        searchInput.addEventListener('input', (e) => {
            this.filterGames(e.target.value);
        });
    }


    filterGames(searchTerm) {
        // Debounce search for better performance
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            const cards = document.querySelectorAll('.game-card');
            const term = searchTerm.toLowerCase();

            // Use requestAnimationFrame for smoother filtering
            requestAnimationFrame(() => {
                cards.forEach(card => {
                    const title = card.querySelector('.game-title').textContent.toLowerCase();
                    const description = card.querySelector('.game-description').textContent.toLowerCase();
                    
                    if (title.includes(term) || description.includes(term)) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        }, 150); // Debounce delay
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

// Initialize the game hub when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.gameHub = new GameHub();
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
