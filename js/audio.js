/**
 * AudioManager Class - Handles all game sound effects using Web Audio API
 * Generates dynamic sound effects without requiring external audio files
 */
class AudioManager {
    constructor() {
        console.log('Initializing AudioManager...');
        
        this.audioContext = null;
        this.initialized = false;
        this.masterVolume = 0.3; // Overall volume control
        this.soundQueue = []; // Queue for sound effects
        
        // Sound configuration
        this.sounds = {
            pop: { frequency: 800, duration: 0.2, type: 'sine' },
            goldPop: { frequency: 1000, duration: 0.3, type: 'sine' },
            levelComplete: { 
                notes: [1200, 1400, 1600], 
                duration: 0.4, 
                type: 'triangle' 
            },
            gameOver: { 
                notes: [300, 250, 200], 
                duration: 0.5, 
                type: 'sawtooth' 
            }
        };
        
        console.log('AudioManager created (not yet initialized)');
    }

    /**
     * Initialize Web Audio API - requires user interaction
     * @returns {Promise<boolean>} Success status
     */
    async initialize() {
        try {
            console.log('Attempting to initialize Web Audio API...');
            
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Check if context is suspended and resume if needed
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            this.initialized = true;
            console.log('Web Audio API initialized successfully');
            console.log(`Sample rate: ${this.audioContext.sampleRate}Hz`);
            
            return true;
            
        } catch (error) {
            console.warn('Failed to initialize Web Audio API:', error);
            this.initialized = false;
            return false;
        }
    }

    /**
     * Play bubble pop sound with specified parameters
     * @param {number} frequency - Sound frequency in Hz
     * @param {number} duration - Sound duration in seconds
     * @param {string} waveType - Oscillator wave type
     */
    playPopSound(frequency = 800, duration = 0.2, waveType = 'sine') {
        try {
            if (!this.initialized || !this.audioContext) {
                console.warn('Audio system not initialized, skipping sound');
                return;
            }
            
            console.log(`Playing pop sound: ${frequency}Hz, ${duration}s, ${waveType}`);
            
            // Create oscillator for tone generation
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            // Connect audio nodes
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Configure oscillator
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            oscillator.type = waveType;
            
            // Configure volume envelope (attack, decay, sustain, release)
            const now = this.audioContext.currentTime;
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(this.masterVolume, now + 0.01); // Quick attack
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration); // Exponential decay
            
            // Start and stop oscillator
            oscillator.start(now);
            oscillator.stop(now + duration);
            
        } catch (error) {
            console.error('Failed to play pop sound:', error);
        }
    }

    /**
     * Play regular bubble pop sound
     */
    playBubblePop() {
        try {
            const config = this.sounds.pop;
            this.playPopSound(config.frequency, config.duration, config.type);
        } catch (error) {
            console.error('Error playing bubble pop:', error);
        }
    }

    /**
     * Play gold bubble pop sound (higher pitched)
     */
    playGoldBubblePop() {
        try {
            const config = this.sounds.goldPop;
            this.playPopSound(config.frequency, config.duration, config.type);
        } catch (error) {
            console.error('Error playing gold bubble pop:', error);
        }
    }

    /**
     * Set master volume level
     * @param {number} volume - Volume level (0.0 to 1.0)
     */
    setVolume(volume) {
        try {
            if (typeof volume !== 'number' || volume < 0 || volume > 1) {
                console.warn('Invalid volume level:', volume);
                return;
            }
            
            this.masterVolume = volume;
            console.log(`Master volume set to: ${(volume * 100).toFixed(0)}%`);
            
        } catch (error) {
            console.error('Error setting volume:', error);
        }
    }

    /**
     * Mute or unmute all sounds
     * @param {boolean} muted - True to mute, false to unmute
     */
    setMuted(muted) {
        try {
            if (muted) {
                this.previousVolume = this.masterVolume;
                this.masterVolume = 0;
                console.log('Audio muted');
            } else {
                this.masterVolume = this.previousVolume || 0.3;
                console.log('Audio unmuted');
            }
        } catch (error) {
            console.error('Error setting mute state:', error);
        }
    }

    /**
     * Check if audio system is ready for use
     * @returns {boolean} True if audio is initialized and ready
     */
    isReady() {
        return this.initialized && this.audioContext && this.audioContext.state === 'running';
    }

    /**
     * Get audio system status information
     * @returns {Object} Status information
     */
    getStatus() {
        return {
            initialized: this.initialized,
            contextState: this.audioContext ? this.audioContext.state : 'none',
            masterVolume: this.masterVolume,
            sampleRate: this.audioContext ? this.audioContext.sampleRate : 0
        };
    }

    /**
     * Cleanup audio resources
     */
    cleanup() {
        try {
            if (this.audioContext) {
                this.audioContext.close();
                console.log('Audio context closed');
            }
            
            this.audioContext = null;
            this.initialized = false;
            
        } catch (error) {
            console.error('Error cleaning up audio:', error);
        }
    }
}
