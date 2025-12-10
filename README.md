# 🎮 Aspenini-Fun Game Hub

A modern HTML5 game hub with themes, account system, and game SDK.

## Features

- **7 Space Themes** - Real-time theme switching with persistent preferences
- **Account System** - Save game progress across sessions with export/import
- **Game SDK** - Easy integration for developers with auto-save and theme support
- **Responsive** - Optimized for desktop, mobile, and Chromebooks
- **Offline Ready** - Works via HTTP server or file:// protocol

## Quick Start

```bash
cd site
python -m http.server 8080
# Open http://localhost:8080
```

Or just open `site/index.html` in your browser.

## Adding Games

1. Create game folder in `site/games/YourGame/`
2. Add to `site/games.json`:
```json
{
  "id": "your-game",
  "title": "Your Game",
  "description": "Game description",
  "icon": "🎮",
  "path": "games/YourGame/index.html",
  "inline": true
}
```

## SDK Integration

**HTML:**
```html
<meta name="aspenini-game-id" content="your-game">
<link rel="stylesheet" href="../shared-theme.css">
<script src="../../aspenini-sdk.js"></script>
```

**JavaScript:**
```javascript
// Load save data
const save = Aspenini.load();

// Save progress
Aspenini.save({ score: 100, level: 5 });
```

**CSS (for theme support):**
```css
button {
  background: var(--accent-gradient);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}
```

## Project Structure

```
site/
├── index.html              # Hub page
├── games.json              # Game database
├── aspenini-sdk.js        # SDK for games
├── themes.css             # Theme system
└── games/
    ├── shared-theme.css   # Theme variables
    └── YourGame/          # Game folders
```

## Theme System

7 themes available: Deep Space, Cosmic Blue, Aurora Green, Solar Red, Nebula Pink, Midnight Cyan, Dark Matter

Themes automatically sync to games using CSS variables and postMessage API.

## Account System

- Create account with username
- Auto-save game progress
- Export as `.afs` file or copy/paste
- Import to restore data

## Browser Support

✅ Chrome, Edge, Firefox, Safari  
✅ Chromebook optimized  
⚠️ Use HTTP server for best compatibility

---

**Made with ❤️ for the gaming community**
