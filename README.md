# Bubble Pop Game

A web-based bubble popping game with progressive difficulty, sound effects, and level-based scoring system.

## Features

- **Multi-colored bubbles** with different point values
- **Gold bubbles** worth 5 points (special bubbles)
- **Progressive difficulty** - faster bubbles each level
- **Sound effects** using Web Audio API
- **Level system** with increasing point targets
- **30-second timer** per level
- **Responsive design** with modern CSS effects

## Game Mechanics

### Scoring System
- Regular colored bubbles: 1 point each
- Gold bubbles: 5 points each
- Level targets: 5, 10, 20, 35, 55, 80, 110, 145, 185, 230, then +50 per level

### Difficulty Progression
- Each level increases bubble spawn rate
- Each level increases bubble fall speed
- Gold bubble spawn rate: 15%

## Technology Stack

- **Frontend**: HTML5 Canvas, Vanilla JavaScript, CSS3
- **Audio**: Web Audio API for dynamic sound generation
- **Styling**: Modern CSS with glassmorphism effects
- **Architecture**: Object-oriented JavaScript with proper separation of concerns

## File Structure

```
bubblegame/
├── index.html          # Main game page
├── css/
│   └── styles.css      # Game styling
├── js/
│   ├── game.js         # Main game logic
│   ├── bubble.js       # Bubble entity class
│   ├── gamestate.js    # Game state management
│   └── audio.js        # Audio system
├── assets/             # Game assets (future)
├── docs/               # Documentation
│   ├── REQUIREMENTS.md
│   ├── TODO.md
│   └── FUTURE.md
└── README.md           # This file
```

## Getting Started

1. Clone the repository
2. Open `index.html` in a modern web browser
3. Click "Start Game" to begin playing
4. Pop bubbles by clicking on them before they fall off screen
5. Reach the target score to advance to the next level

## Browser Compatibility

- Chrome 66+
- Firefox 60+
- Safari 12+
- Edge 79+

Requires Web Audio API support for sound effects.

## Development

The game is built with vanilla JavaScript for maximum performance and minimal dependencies. The modular architecture makes it easy to extend with new features.

### Key Classes

- `GameState`: Manages game progression, scoring, and timing
- `Bubble`: Individual bubble entities with physics and rendering
- `AudioManager`: Handles all sound effect generation
- `GameRenderer`: Canvas rendering and visual effects

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use and modify as needed.
