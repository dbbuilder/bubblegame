/**
 * Main Game Controller - Orchestrates all game components
 * Handles game loop, user input, rendering, and component integration
 */

// Global game instances
let gameState = null;
let audioManager = null;
let canvas = null;
let ctx = null;
let gameLoop = null;
let timerInterval = null;

// UI elements
let scoreElement = null;
let timerElement = null;
let levelElement = null;
let targetElement = null;
let startButton = null;
let restartButton = null;

/**
 * Initialize the game system when page loads
 */
function initializeGame() {
    try {
        console.log('Starting game initialization...');
        
        // Initialize game components
        gameState = new GameState();
        audioManager = new AudioManager();
        
        // Get canvas and context
        canvas = document.getElementById('gameCanvas');
        ctx = canvas.getContext('2d');
        
        if (!canvas || !ctx) {
            throw new Error('Failed to get canvas or rendering context');
        }
        
        // Set up responsive canvas sizing
        setupCanvasSize();
        
        // Get UI elements
        scoreElement = document.getElementById('score');
        timerElement = document.getElementById('timer');
        levelElement = document.getElementById('level');
        targetElement = document.getElementById('target');
        startButton = document.getElementById('startButton');
        restartButton = document.getElementById('restartButton');
        
        // Validate all UI elements exist
        if (!scoreElement || !timerElement || !levelElement || !targetElement || !startButton || !restartButton) {
            throw new Error('Failed to find required UI elements');
        }
        
        // Set up event listeners
        setupEventListeners();
        
        // Initial UI update
        updateUI();
        
        console.log('Game initialization completed successfully');
        console.log(`Canvas size: ${canvas.width}x${canvas.height}`);
        
    } catch (error) {
        console.error('Fatal error during game initialization:', error);
        alert('Failed to initialize game. Please refresh the page.');
    }
}

/**
 * Set up responsive canvas sizing
 */
function setupCanvasSize() {
    try {
        // Get container size
        const container = canvas.parentElement;
        const containerWidth = container.clientWidth;
        
        // Calculate canvas size based on screen and container
        let canvasWidth, canvasHeight;
        
        if (window.innerWidth <= 600) {
            // Mobile: use most of screen width with 16:9 aspect ratio
            canvasWidth = Math.min(containerWidth - 20, window.innerWidth - 30);
            canvasHeight = Math.round(canvasWidth * 0.75); // 4:3 aspect ratio for mobile
        } else if (window.innerWidth <= 900) {
            // Tablet: slightly larger with same aspect ratio
            canvasWidth = Math.min(containerWidth - 40, 600);
            canvasHeight = Math.round(canvasWidth * 0.75);
        } else {
            // Desktop: original size or scaled
            canvasWidth = 800;
            canvasHeight = 600;
        }
        
        // Ensure minimum size for playability
        canvasWidth = Math.max(canvasWidth, 300);
        canvasHeight = Math.max(canvasHeight, 225);
        
        // Set canvas internal dimensions
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        
        // Update CSS for proper display
        canvas.style.width = canvasWidth + 'px';
        canvas.style.height = canvasHeight + 'px';
        
        console.log(`Canvas size set to: ${canvasWidth}x${canvasHeight}`);
        
    } catch (error) {
        console.error('Error setting up canvas size:', error);
        // Fallback to default size
        canvas.width = 800;
        canvas.height = 600;
    }
}

/**
 * Set up all event listeners for game interaction
 */
function setupEventListeners() {
    try {
        // Canvas click and touch handlers for bubble popping
        canvas.addEventListener('click', handleCanvasClick);
        canvas.addEventListener('touchstart', handleCanvasTouch, { passive: false });
        canvas.addEventListener('contextmenu', (e) => e.preventDefault()); // Disable right-click menu
        
        // Button event listeners
        startButton.addEventListener('click', startGame);
        restartButton.addEventListener('click', restartGame);
        
        // Keyboard shortcuts
        document.addEventListener('keydown', handleKeyPress);
        
        // Prevent canvas selection
        canvas.addEventListener('selectstart', (e) => e.preventDefault());
        
        console.log('Event listeners set up successfully');
        
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

/**
 * Handle keyboard input for game controls
 * @param {KeyboardEvent} event - Keyboard event
 */
function handleKeyPress(event) {
    try {
        switch (event.code) {
            case 'Space':
                event.preventDefault();
                if (!gameState.gameRunning) {
                    startGame();
                } else {
                    // Could add pause functionality here
                }
                break;
            case 'KeyR':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    restartGame();
                }
                break;
            case 'KeyM':
                // Toggle mute
                if (audioManager && audioManager.isReady()) {
                    const currentVolume = audioManager.masterVolume;
                    audioManager.setMuted(currentVolume > 0);
                }
                break;
        }
    } catch (error) {
        console.error('Error handling key press:', error);
    }
}

/**
 * Handle mouse clicks on canvas for bubble popping
 * @param {MouseEvent} event - Mouse click event
 */
function handleCanvasClick(event) {
    try {
        if (!gameState || !gameState.gameRunning) {
            console.log('Click ignored - game not running');
            return;
        }
        
        // Get click coordinates relative to canvas
        const rect = canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;
        
        // Scale coordinates if canvas is scaled
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const scaledX = clickX * scaleX;
        const scaledY = clickY * scaleY;
        
        console.log(`Click detected at (${scaledX.toFixed(1)}, ${scaledY.toFixed(1)})`);
        
        // Check if click hit any bubble (reverse order for front-to-back priority)
        for (let i = gameState.bubbles.length - 1; i >= 0; i--) {
            const bubble = gameState.bubbles[i];
            
            if (bubble.containsPoint(scaledX, scaledY)) {
                // Bubble hit! Process the pop
                processBubblePop(bubble, i);
                break; // Only pop one bubble per click
            }
        }
        
    } catch (error) {
        console.error('Error handling canvas click:', error);
    }
}

/**
 * Handle touch events on canvas (mobile support)
 * @param {TouchEvent} event - Touch event object
 */
function handleCanvasTouch(event) {
    try {
        // Prevent default touch behavior (scrolling, zooming)
        event.preventDefault();
        
        if (!gameState || !gameState.gameRunning) {
            console.log('Touch ignored - game not running');
            return;
        }
        
        // Get first touch point
        const touch = event.touches[0] || event.changedTouches[0];
        if (!touch) return;
        
        // Get touch coordinates relative to canvas
        const rect = canvas.getBoundingClientRect();
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;
        
        // Scale coordinates if canvas is scaled
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const scaledX = touchX * scaleX;
        const scaledY = touchY * scaleY;
        
        console.log(`Touch detected at (${scaledX.toFixed(1)}, ${scaledY.toFixed(1)})`);
        
        // Check if touch hit any bubble (reverse order for front-to-back priority)
        for (let i = gameState.bubbles.length - 1; i >= 0; i--) {
            const bubble = gameState.bubbles[i];
            
            if (bubble.containsPoint(scaledX, scaledY)) {
                // Bubble hit! Process the pop
                processBubblePop(bubble, i);
                break; // Only pop one bubble per touch
            }
        }
        
    } catch (error) {
        console.error('Error handling canvas touch:', error);
    }
}

/**
 * Process bubble pop - handle scoring, sound, and effects
 * @param {Bubble} bubble - The bubble that was popped
 * @param {number} index - Index of bubble in array
 */
function processBubblePop(bubble, index) {
    try {
        console.log(`Bubble popped! Letter: ${bubble.letter}, Type: ${bubble.isGold ? 'gold' : bubble.color}, Points: ${bubble.points}`);
        
        // Add score to game state
        gameState.addScore(bubble.points);
        
        // Play appropriate sound effect
        if (audioManager && audioManager.isReady()) {
            if (bubble.isGold) {
                audioManager.playGoldBubblePop();
            } else {
                audioManager.playBubblePop();
            }
        }
        
        // Announce the letter on the bubble
        if (audioManager && bubble.letter) {
            audioManager.announceLetter(bubble.letter);
        }
        
        // Remove bubble from array
        gameState.bubbles.splice(index, 1);
        
        // Add visual feedback to score
        animateScoreUpdate();
        
        // Check for level completion
        if (gameState.hasReachedTarget()) {
            handleLevelComplete();
        }
        
        // Update UI
        updateUI();
        
    } catch (error) {
        console.error('Error processing bubble pop:', error);
    }
}

/**
 * Animate score update for visual feedback
 */
function animateScoreUpdate() {
    try {
        if (scoreElement) {
            scoreElement.classList.add('score-animate');
            setTimeout(() => {
                scoreElement.classList.remove('score-animate');
            }, 300);
        }
    } catch (error) {
        console.error('Error animating score update:', error);
    }
}

/**
 * Handle level completion
 */
function handleLevelComplete() {
    try {
        console.log(`Level ${gameState.level} completed!`);
        
        // Play level complete sound
        if (audioManager && audioManager.isReady()) {
            audioManager.playLevelCompleteSound();
        }
        
        // Show level complete message
        showLevelCompleteMessage();
        
        // Advance to next level after delay
        setTimeout(() => {
            gameState.levelUp();
            updateUI();
            clearGameOverlays();
        }, 2000);
        
    } catch (error) {
        console.error('Error handling level complete:', error);
    }
}

/**
 * Start a new game
 */
async function startGame() {
    try {
        console.log('Starting new game...');
        
        // Initialize audio on first user interaction
        if (audioManager && !audioManager.initialized) {
            const audioInitialized = await audioManager.initialize();
            if (audioInitialized) {
                console.log('Audio system ready for game');
            } else {
                console.warn('Audio system failed to initialize - game will run without sound');
            }
        }
        
        // Test speech synthesis with user interaction
        if (audioManager && audioManager.speechEnabled) {
            // Use a silent utterance to "warm up" speech synthesis
            const testUtterance = new SpeechSynthesisUtterance(' ');
            testUtterance.volume = 0.01;
            speechSynthesis.speak(testUtterance);
            console.log('Speech synthesis initialized with user interaction');
        }
        
        // Reset game state
        gameState.resetGame();
        gameState.startGame();
        
        // Update UI buttons
        startButton.style.display = 'none';
        restartButton.style.display = 'inline-block';
        
        // Clear any existing overlays
        clearGameOverlays();
        
        // Start game loops
        startGameLoop();
        startTimer();
        
        // Initial UI update
        updateUI();
        
        console.log('Game started successfully');
        
    } catch (error) {
        console.error('Error starting game:', error);
        alert('Failed to start game. Please try again.');
    }
}

/**
 * Restart the current game
 */
function restartGame() {
    try {
        console.log('Restarting game...');
        
        // Stop current game loops
        stopGameLoop();
        stopTimer();
        
        // Clear overlays
        clearGameOverlays();
        
        // Start new game
        startGame();
        
    } catch (error) {
        console.error('Error restarting game:', error);
    }
}

/**
 * Start the main game loop
 */
function startGameLoop() {
    try {
        // Stop any existing loop
        stopGameLoop();
        
        // Start new loop at 60 FPS (approximately)
        gameLoop = setInterval(updateGame, 16);
        console.log('Game loop started');
        
    } catch (error) {
        console.error('Error starting game loop:', error);
    }
}

/**
 * Stop the main game loop
 */
function stopGameLoop() {
    try {
        if (gameLoop) {
            clearInterval(gameLoop);
            gameLoop = null;
            console.log('Game loop stopped');
        }
    } catch (error) {
        console.error('Error stopping game loop:', error);
    }
}

/**
 * Start the game timer
 */
function startTimer() {
    try {
        // Stop any existing timer
        stopTimer();
        
        // Start countdown timer
        timerInterval = setInterval(() => {
            if (!gameState || !gameState.gameRunning) {
                stopTimer();
                return;
            }
            
            gameState.timeLeft--;
            updateUI();
            
            // Check for game over
            if (gameState.timeLeft <= 0) {
                endGame();
            }
            
        }, 1000);
        
        console.log('Timer started');
        
    } catch (error) {
        console.error('Error starting timer:', error);
    }
}

/**
 * Stop the game timer
 */
function stopTimer() {
    try {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
            console.log('Timer stopped');
        }
    } catch (error) {
        console.error('Error stopping timer:', error);
    }
}

/**
 * Main game update loop - runs at 60 FPS
 */
function updateGame() {
    try {
        if (!gameState || !gameState.gameRunning) {
            return;
        }
        
        const currentTime = Date.now();
        
        // Spawn new bubbles based on level-adjusted spawn rate
        if (currentTime - gameState.lastBubbleSpawn > gameState.getBubbleSpawnRate()) {
            spawnBubble();
            gameState.lastBubbleSpawn = currentTime;
        }
        
        // Update all bubbles
        updateBubbles();
        
        // Render everything
        renderGame();
        
    } catch (error) {
        console.error('Error in game update loop:', error);
    }
}

/**
 * Update all bubble positions and remove off-screen bubbles
 */
function updateBubbles() {
    try {
        for (let i = gameState.bubbles.length - 1; i >= 0; i--) {
            const bubble = gameState.bubbles[i];
            
            // Update bubble position
            bubble.update();
            
            // Remove bubbles that have fallen off screen
            if (bubble.isOffScreen(canvas.height)) {
                console.log(`Bubble ${bubble.id} fell off screen`);
                gameState.bubbles.splice(i, 1);
            }
        }
    } catch (error) {
        console.error('Error updating bubbles:', error);
    }
}

/**
 * Spawn a new bubble at random position
 */
function spawnBubble() {
    try {
        // Random X position (keep away from edges)
        const margin = 50;
        const x = Math.random() * (canvas.width - 2 * margin) + margin;
        const y = -50; // Start above screen
        
        // Determine if this should be a gold bubble (15% chance)
        const isGold = Math.random() < 0.15;
        
        let color;
        if (isGold) {
            color = 'gold';
        } else {
            // Select random color for regular bubble
            const colors = ['red', 'blue', 'green', 'purple', 'orange', 'pink'];
            color = colors[Math.floor(Math.random() * colors.length)];
        }
        
        // Create and add bubble
        const bubble = new Bubble(x, y, color, isGold);
        gameState.bubbles.push(bubble);
        gameState.bubblesSpawned++; // Track for statistics
        
        console.log(`Spawned ${isGold ? 'gold' : color} bubble at (${x.toFixed(1)}, ${y})`);
        
    } catch (error) {
        console.error('Error spawning bubble:', error);
    }
}

/**
 * Render all game elements to canvas
 */
function renderGame() {
    try {
        // Clear canvas with gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.5, '#E0F6FF');
        gradient.addColorStop(1, '#87CEEB');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw all bubbles
        gameState.bubbles.forEach(bubble => {
            bubble.draw(ctx);
        });
        
        // Draw debug info if needed
        if (window.DEBUG_MODE) {
            drawDebugInfo();
        }
        
    } catch (error) {
        console.error('Error rendering game:', error);
    }
}

/**
 * Draw debug information overlay
 */
function drawDebugInfo() {
    try {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 200, 100);
        
        ctx.fillStyle = 'white';
        ctx.font = '12px monospace';
        ctx.fillText(`Bubbles: ${gameState.bubbles.length}`, 15, 25);
        ctx.fillText(`Spawn Rate: ${gameState.getBubbleSpawnRate()}ms`, 15, 40);
        ctx.fillText(`Fall Speed: ${gameState.getBubbleFallSpeed().toFixed(1)}px/f`, 15, 55);
        ctx.fillText(`FPS: ${(1000/16).toFixed(1)}`, 15, 70);
        ctx.fillText(`Accuracy: ${gameState.calculateAccuracy().toFixed(1)}%`, 15, 85);
        
    } catch (error) {
        console.error('Error drawing debug info:', error);
    }
}

/**
 * End the game
 */
function endGame() {
    try {
        console.log('Ending game...');
        
        // Stop game systems
        gameState.endGame();
        stopGameLoop();
        stopTimer();
        
        // Play game over sound
        if (audioManager && audioManager.isReady()) {
            audioManager.playGameOverSound();
        }
        
        // Show game over message
        showGameOverMessage();
        
        // Reset UI buttons
        startButton.style.display = 'inline-block';
        restartButton.style.display = 'none';
        
        console.log('Game ended');
        
    } catch (error) {
        console.error('Error ending game:', error);
    }
}

/**
 * Update UI display elements
 */
function updateUI() {
    try {
        if (!gameState) return;
        
        if (scoreElement) scoreElement.textContent = gameState.score;
        if (timerElement) timerElement.textContent = gameState.timeLeft;
        if (levelElement) levelElement.textContent = gameState.level;
        if (targetElement) targetElement.textContent = gameState.getCurrentTarget();
        
    } catch (error) {
        console.error('Error updating UI:', error);
    }
}

/**
 * Show level complete overlay message
 */
function showLevelCompleteMessage() {
    try {
        const overlay = document.createElement('div');
        overlay.className = 'level-complete';
        overlay.innerHTML = `
            <div>Level ${gameState.level} Complete!</div>
            <div style="font-size: 18px; margin-top: 10px;">Moving to Level ${gameState.level + 1}</div>
            <div style="font-size: 14px; margin-top: 5px;">Target: ${gameState.getCurrentTarget()} → ${gameState.level <= 9 ? gameState.levelTargets[gameState.level] : gameState.getCurrentTarget() + 50} points</div>
        `;
        document.body.appendChild(overlay);
        
    } catch (error) {
        console.error('Error showing level complete message:', error);
    }
}

/**
 * Show game over overlay message
 */
function showGameOverMessage() {
    try {
        const overlay = document.createElement('div');
        overlay.className = 'game-over';
        overlay.innerHTML = `
            <div>Time's Up!</div>
            <div style="font-size: 18px; margin-top: 10px;">Final Score: ${gameState.score}</div>
            <div style="font-size: 16px; margin-top: 5px;">Level Reached: ${gameState.level}</div>
            <div style="font-size: 14px; margin-top: 5px;">Bubbles Popped: ${gameState.bubblesPopped}</div>
            <div style="font-size: 14px;">Accuracy: ${gameState.calculateAccuracy().toFixed(1)}%</div>
        `;
        document.body.appendChild(overlay);
        
    } catch (error) {
        console.error('Error showing game over message:', error);
    }
}

/**
 * Clear all game overlay messages
 */
function clearGameOverlays() {
    try {
        const overlays = document.querySelectorAll('.level-complete, .game-over');
        overlays.forEach(overlay => {
            overlay.remove();
        });
    } catch (error) {
        console.error('Error clearing overlays:', error);
    }
}

/**
 * Handle window resize events
 */
function handleResize() {
    try {
        // Responsive canvas resizing on window resize/orientation change
        console.log('Window resized, updating canvas size');
        
        if (canvas && ctx) {
            setupCanvasSize();
            
            // If game is running, redraw current frame
            if (gameState && gameState.gameRunning) {
                drawGame();
            }
        }
    } catch (error) {
        console.error('Error handling resize:', error);
    }
}

/**
 * Handle page unload - cleanup resources
 */
function handleUnload() {
    try {
        console.log('Page unloading - cleaning up resources');
        
        stopGameLoop();
        stopTimer();
        
        if (audioManager) {
            audioManager.cleanup();
        }
        
    } catch (error) {
        console.error('Error during cleanup:', error);
    }
}

/**
 * Toggle debug mode
 */
function toggleDebugMode() {
    try {
        window.DEBUG_MODE = !window.DEBUG_MODE;
        console.log(`Debug mode: ${window.DEBUG_MODE ? 'ON' : 'OFF'}`);
    } catch (error) {
        console.error('Error toggling debug mode:', error);
    }
}

// Set up page event listeners
window.addEventListener('load', initializeGame);
window.addEventListener('resize', handleResize);
window.addEventListener('beforeunload', handleUnload);

// Global debug function
window.toggleDebug = toggleDebugMode;

// Test speech synthesis function
window.testSpeech = function(letter = 'A') {
    console.log('Testing speech synthesis...');
    if (audioManager) {
        audioManager.announceLetter(letter);
    } else {
        console.error('AudioManager not initialized');
    }
};

// Test speech synthesis directly
window.testSpeechDirect = function(text = 'A') {
    console.log('Testing speech synthesis directly...');
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.volume = 1.0;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        speechSynthesis.speak(utterance);
    } else {
        console.error('Speech synthesis not supported');
    }
};

// Make game functions available globally for console debugging
window.gameState = () => gameState;
window.audioManager = () => audioManager;
window.forceSpawnBubble = spawnBubble;
window.gameStats = () => gameState ? gameState.getStatistics() : null;

console.log('Game controller loaded - waiting for page load to initialize');
