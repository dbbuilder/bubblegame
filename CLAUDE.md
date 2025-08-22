# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a vanilla JavaScript bubble popping game with HTML5 Canvas, Web Audio API, and progressive difficulty. The game is built with zero dependencies and runs entirely in the browser.

## Development Commands

### Running the Game
```bash
# Open the game in any modern web browser
open index.html
# or for WSL/Linux:
xdg-open index.html
```

### Testing
- No automated test framework - manual testing by opening `index.html` in browser
- Test in Chrome 66+, Firefox 60+, Safari 12+, Edge 79+
- Debug mode available via browser console: `toggleDebug()`

### Browser Development Tools
```javascript
// Available debug commands in browser console:
toggleDebug()           // Enable/disable debug mode
trackEvent(action, category, label)  // Test analytics tracking
```

## Architecture

### Core Components (Object-Oriented Design)

**GameState (`js/gamestate.js`)**
- Manages game progression, scoring, and timing
- Handles level advancement with targets: [5, 10, 20, 35, 55, 80, 110, 145, 185, 230, then +50]
- Tracks performance metrics (bubbles popped, spawn rate, etc.)

**Bubble (`js/bubble.js`)**
- Individual bubble entities with physics simulation
- Handles rendering, collision detection, and visual effects
- Regular bubbles (1 point) vs Gold bubbles (5 points, 15% spawn rate)

**AudioManager (`js/audio.js`)**
- Web Audio API sound generation (no external audio files)
- Dynamic sound effects: pop, goldPop, levelComplete, gameOver
- Graceful degradation for unsupported browsers

**Game Controller (`js/game.js`)**
- Main game loop and component orchestration
- User input handling and canvas rendering
- Integration between GameState, Bubble, and AudioManager

### Load Order Dependencies
Scripts must load in this order (already configured in `index.html`):
1. `gamestate.js` - Core state management
2. `bubble.js` - Entity classes
3. `audio.js` - Audio system
4. `game.js` - Main controller (depends on all above)

### Game Loop Architecture
- 60 FPS game loop using `requestAnimationFrame`
- Separate timer interval for 30-second level countdown
- Canvas-based rendering with glassmorphism effects

## Key Technical Details

### Physics System
- Bubble speed increases with level: `baseSpeed * (1 + level * 0.15)`
- Spawn rate increases with level: `Math.max(800 - level * 50, 200)ms`
- Bubble radius randomized: 20-40px

### Performance Considerations
- Canvas cleared and redrawn each frame
- Bubble removal when off-screen to prevent memory leaks
- Error handling with global error handler and user-friendly messages

### Browser Compatibility
- Requires HTML5 Canvas and Web Audio API support
- Uses ES6 classes (no transpilation)
- Accessibility features included (ARIA labels, keyboard shortcuts)

## File Structure
```
bubblegame/
├── index.html          # Main entry point with full game UI
├── css/styles.css      # Complete styling with glassmorphism effects
├── js/
│   ├── gamestate.js    # Game state and progression logic
│   ├── bubble.js       # Bubble entity and physics
│   ├── audio.js        # Web Audio API sound system
│   └── game.js         # Main game controller and loop
└── docs/               # Requirements and planning documents
```

## Development Notes

- **No Build Process**: Direct file serving - just open `index.html`
- **Vanilla JavaScript**: Zero external dependencies or frameworks
- **Error Handling**: Comprehensive error catching with user-friendly fallbacks
- **Debug Features**: Console commands available for testing and debugging
- **Cross-Browser**: Designed for modern browsers with graceful degradation

## Keyboard Controls
- `Space` - Start game
- `Ctrl+R` - Restart game  
- `M` - Toggle sound
- Mouse click - Pop bubbles