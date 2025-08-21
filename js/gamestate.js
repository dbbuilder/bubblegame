/**
 * GameState Class - Manages game progression, scoring, and timing
 * Handles level advancement, score tracking, and difficulty scaling
 */
class GameState {
    constructor() {
        console.log('Initializing GameState...');
        
        // Core game state variables
        this.score = 0;
        this.level = 1;
        this.timeLeft = 30;
        this.gameRunning = false;
        this.bubbles = [];
        this.lastBubbleSpawn = 0;
        this.gameStartTime = 0;
        
        // Level progression system - each level requires specific points
        this.levelTargets = [5, 10, 20, 35, 55, 80, 110, 145, 185, 230];
        this.currentLevelScore = 0; // Score achieved in current level only
        
        // Performance tracking
        this.bubblesPopped = 0;
        this.bubblesSpawned = 0;
        this.goldBubblesPopped = 0;
        
        console.log('GameState initialized successfully');
    }

    /**
     * Calculate target score for current level
     * @returns {number} Points needed to advance to next level
     */
    getCurrentTarget() {
        try {
            if (this.level <= this.levelTargets.length) {
                return this.levelTargets[this.level - 1];
            } else {
                // For levels beyond predefined targets, add 50 points per level
                const extraLevels = this.level - this.levelTargets.length;
                const lastTarget = this.levelTargets[this.levelTargets.length - 1];
                return lastTarget + (extraLevels * 50);
            }
        } catch (error) {
            console.error('Error calculating current target:', error);
            return 5; // Default fallback
        }
    }

    /**
     * Check if player has reached the target for current level
     * @returns {boolean} True if target achieved
     */
    hasReachedTarget() {
        return this.currentLevelScore >= this.getCurrentTarget();
    }

    /**
     * Advance to next level and reset level-specific progress
     */
    levelUp() {
        try {
            const previousLevel = this.level;
            this.level++;
            this.currentLevelScore = 0; // Reset level score
            this.timeLeft = 30; // Reset timer for new level
            
            console.log(`Level up! Advanced from level ${previousLevel} to ${this.level}`);
            console.log(`New target: ${this.getCurrentTarget()} points`);
            
            // Track level progression for statistics
            this.logLevelProgression();
            
        } catch (error) {
            console.error('Error during level up:', error);
        }
    }

    /**
     * Add score and track level progress
     * @param {number} points - Points to add to score
     */
    addScore(points) {
        try {
            if (typeof points !== 'number' || points < 0) {
                console.warn('Invalid points value:', points);
                return;
            }
            
            this.score += points;
            this.currentLevelScore += points;
            
            // Track statistics
            this.bubblesPopped++;
            if (points === 5) {
                this.goldBubblesPopped++;
            }
            
            console.log(`Added ${points} points. Total: ${this.score}, Level progress: ${this.currentLevelScore}/${this.getCurrentTarget()}`);
            
        } catch (error) {
            console.error('Error adding score:', error);
        }
    }

    /**
     * Get bubble spawn rate based on current level (faster each level)
     * @returns {number} Milliseconds between bubble spawns
     */
    getBubbleSpawnRate() {
        try {
            const baseRate = 800;
            const levelMultiplier = (this.level - 1) * 100;
            const minRate = 200;
            
            return Math.max(baseRate - levelMultiplier, minRate);
        } catch (error) {
            console.error('Error calculating spawn rate:', error);
            return 800; // Default fallback
        }
    }

    /**
     * Get bubble fall speed based on current level
     * @returns {number} Pixels per frame fall speed
     */
    getBubbleFallSpeed() {
        try {
            const baseSpeed = 1;
            const levelIncrease = (this.level - 1) * 0.5;
            return baseSpeed + levelIncrease;
        } catch (error) {
            console.error('Error calculating fall speed:', error);
            return 1; // Default fallback
        }
    }

    /**
     * Reset game state for new game
     */
    resetGame() {
        try {
            console.log('Resetting game state...');
            
            this.score = 0;
            this.level = 1;
            this.timeLeft = 30;
            this.gameRunning = false;
            this.bubbles = [];
            this.lastBubbleSpawn = 0;
            this.gameStartTime = 0;
            this.currentLevelScore = 0;
            
            // Reset statistics
            this.bubblesPopped = 0;
            this.bubblesSpawned = 0;
            this.goldBubblesPopped = 0;
            
            console.log('Game state reset successfully');
            
        } catch (error) {
            console.error('Error resetting game state:', error);
        }
    }

    /**
     * Start the game timer and set initial state
     */
    startGame() {
        try {
            this.gameRunning = true;
            this.gameStartTime = Date.now();
            console.log('Game started at:', new Date(this.gameStartTime).toLocaleTimeString());
            
        } catch (error) {
            console.error('Error starting game:', error);
        }
    }

    /**
     * End the game and log final statistics
     */
    endGame() {
        try {
            this.gameRunning = false;
            const gameEndTime = Date.now();
            const totalGameTime = (gameEndTime - this.gameStartTime) / 1000;
            
            console.log('Game ended. Final statistics:');
            console.log(`- Final Score: ${this.score}`);
            console.log(`- Level Reached: ${this.level}`);
            console.log(`- Total Game Time: ${totalGameTime.toFixed(1)} seconds`);
            console.log(`- Bubbles Popped: ${this.bubblesPopped}`);
            console.log(`- Gold Bubbles Popped: ${this.goldBubblesPopped}`);
            console.log(`- Accuracy: ${this.calculateAccuracy().toFixed(1)}%`);
            
        } catch (error) {
            console.error('Error ending game:', error);
        }
    }

    /**
     * Calculate player accuracy percentage
     * @returns {number} Accuracy as percentage
     */
    calculateAccuracy() {
        try {
            if (this.bubblesSpawned === 0) return 0;
            return (this.bubblesPopped / this.bubblesSpawned) * 100;
        } catch (error) {
            console.error('Error calculating accuracy:', error);
            return 0;
        }
    }

    /**
     * Get current game statistics
     * @returns {Object} Statistics object
     */
    getStatistics() {
        return {
            score: this.score,
            level: this.level,
            bubblesPopped: this.bubblesPopped,
            goldBubblesPopped: this.goldBubblesPopped,
            accuracy: this.calculateAccuracy(),
            timeElapsed: this.gameStartTime ? (Date.now() - this.gameStartTime) / 1000 : 0
        };
    }

    /**
     * Log level progression for debugging
     */
    logLevelProgression() {
        try {
            console.log(`Level Progression Summary:`);
            console.log(`- Current Level: ${this.level}`);
            console.log(`- Target Score: ${this.getCurrentTarget()}`);
            console.log(`- Spawn Rate: ${this.getBubbleSpawnRate()}ms`);
            console.log(`- Fall Speed: ${this.getBubbleFallSpeed()}px/frame`);
        } catch (error) {
            console.error('Error logging level progression:', error);
        }
    }

    /**
     * Validate game state integrity
     * @returns {boolean} True if state is valid
     */
    validateState() {
        try {
            const isValid = 
                this.score >= 0 &&
                this.level >= 1 &&
                this.timeLeft >= 0 &&
                this.currentLevelScore >= 0 &&
                Array.isArray(this.bubbles);
                
            if (!isValid) {
                console.error('Invalid game state detected:', this);
            }
            
            return isValid;
        } catch (error) {
            console.error('Error validating state:', error);
            return false;
        }
    }
}
