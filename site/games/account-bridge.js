/**
 * Aspenini-Fun Account Bridge (Legacy)
 * 
 * This file is deprecated. Please use the Aspenini SDK instead:
 * 
 *   <script src="../../aspenini-sdk.js"></script>
 * 
 * Migration guide:
 *   - Replace: window.saveToAccount(data)  →  Aspenini.save(data)
 *   - Replace: window.loadFromAccount()   →  Aspenini.load()
 *   - Replace: window.getAccountUsername() → Aspenini.getUsername()
 *   - Replace: window.isAccountLoggedIn()  → Aspenini.isLoggedIn()
 * 
 * This bridge now simply loads the SDK and provides backward compatibility.
 */

// Load the SDK
if (typeof window.Aspenini === 'undefined') {
    const script = document.createElement('script');
    script.src = '../../aspenini-sdk.js';
    script.onload = () => {
        // Provide backward compatibility shims
        window.saveToAccount = (data) => window.Aspenini.save(data);
        window.loadFromAccount = () => window.Aspenini.load();
        window.getAccountUsername = () => window.Aspenini.getUsername();
        window.isAccountLoggedIn = () => window.Aspenini.isLoggedIn();
        
        // Dispatch legacy event for games that still listen to it
        window.dispatchEvent(new CustomEvent('accountDataLoaded', {
            detail: {
                username: window.Aspenini.getUsername(),
                saveData: window.Aspenini.load()
            }
        }));
    };
    document.head.appendChild(script);
} else {
    // SDK already loaded, just provide shims
    window.saveToAccount = (data) => window.Aspenini.save(data);
    window.loadFromAccount = () => window.Aspenini.load();
    window.getAccountUsername = () => window.Aspenini.getUsername();
    window.isAccountLoggedIn = () => window.Aspenini.isLoggedIn();
}

