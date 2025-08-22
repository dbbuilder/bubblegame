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
        this.speechEnabled = 'speechSynthesis' in window; // Check for speech support
        this.voicesLoaded = false;
        this.setupSpeechSynthesis();
        
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
     * Setup speech synthesis and wait for voices to load
     */
    setupSpeechSynthesis() {
        if (!this.speechEnabled) return;
        
        // Load voices if not already loaded
        const loadVoices = () => {
            const voices = speechSynthesis.getVoices();
            if (voices.length > 0) {
                this.voicesLoaded = true;
                console.log(`Speech synthesis ready with ${voices.length} voices`);
            }
        };
        
        // Try to load voices immediately
        loadVoices();
        
        // Listen for voices changed event (some browsers need this)
        speechSynthesis.addEventListener('voiceschanged', loadVoices);
        
        // Fallback timeout to enable speech even if voices don't load properly
        setTimeout(() => {
            if (!this.voicesLoaded) {
                console.warn('Speech voices not loaded, enabling speech anyway');
                this.voicesLoaded = true;
            }
        }, 1000);
    }

    /**
     * Initialize Web Audio API - requires user interaction
     * @returns {Promise<boolean>} Success status
     */
    async initialize() {
        try {
            console.log('Attempting to initialize Web Audio API...');
            
            // Create audio context with iOS compatibility
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // iOS specific: Always try to resume context
            if (this.audioContext.state !== 'running') {
                console.log(`Audio context state: ${this.audioContext.state}, attempting to resume...`);
                await this.audioContext.resume();
                
                // Wait a moment for context to start
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // Create a silent buffer to initialize iOS audio
            this.createSilentBuffer();
            
            this.initialized = true;
            console.log('Web Audio API initialized successfully');
            console.log(`Sample rate: ${this.audioContext.sampleRate}Hz`);
            console.log(`Audio context state: ${this.audioContext.state}`);
            
            return true;
            
        } catch (error) {
            console.warn('Failed to initialize Web Audio API:', error);
            this.initialized = false;
            return false;
        }
    }

    /**
     * Create silent buffer to initialize iOS audio
     */
    createSilentBuffer() {
        try {
            if (!this.audioContext) return;
            
            // Create a very short silent buffer
            const buffer = this.audioContext.createBuffer(1, 1, this.audioContext.sampleRate);
            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(this.audioContext.destination);
            source.start(0);
            
            console.log('Silent buffer created for iOS audio initialization');
        } catch (error) {
            console.warn('Could not create silent buffer:', error);
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
     * Announce letter name using speech synthesis
     * @param {string} letter - Letter to announce
     */
    announceLetter(letter) {
        try {
            if (!this.speechEnabled) {
                console.warn('Speech synthesis not supported');
                return;
            }
            
            // Skip if muted
            if (this.masterVolume === 0) {
                console.log('Audio muted, skipping speech');
                return;
            }
            
            console.log(`Announcing letter: ${letter}`);
            
            // iOS workaround: Check if voices are loaded
            let voices = speechSynthesis.getVoices();
            if (voices.length === 0) {
                // Wait for voices to load on iOS
                setTimeout(() => this.announceLetter(letter), 100);
                return;
            }
            
            // Create speech utterance
            const utterance = new SpeechSynthesisUtterance(letter);
            
            // Configure speech parameters for mobile compatibility
            utterance.rate = 0.9; // Slightly slower for clarity on mobile
            utterance.pitch = 1.0; // Normal pitch
            utterance.volume = 1.0; // Full volume
            
            // iOS/mobile voice selection
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            let preferredVoice = null;
            
            if (isIOS) {
                // iOS: prefer system voices
                preferredVoice = voices.find(voice => 
                    voice.lang.startsWith('en') && voice.default
                ) || voices.find(voice => 
                    voice.localService && voice.lang.startsWith('en')
                );
            } else {
                // Android/other: prefer local English voices
                preferredVoice = voices.find(voice => 
                    voice.lang.startsWith('en') && voice.localService
                ) || voices.find(voice => 
                    voice.lang.startsWith('en')
                );
            }
            
            if (preferredVoice) {
                utterance.voice = preferredVoice;
                console.log(`Using voice: ${preferredVoice.name} (${preferredVoice.lang})`);
            } else {
                console.log('Using default voice');
            }
            
            // Enhanced error handling for mobile
            utterance.onerror = (event) => {
                console.error('Speech synthesis error:', event.error);
                // iOS fallback: try again with different voice
                if (isIOS && event.error === 'not-allowed') {
                    console.log('Retrying speech synthesis for iOS...');
                    setTimeout(() => {
                        const fallbackUtterance = new SpeechSynthesisUtterance(letter);
                        fallbackUtterance.rate = 1.0;
                        fallbackUtterance.volume = 1.0;
                        speechSynthesis.speak(fallbackUtterance);
                    }, 100);
                }
            };
            
            utterance.onend = () => {
                console.log(`Finished announcing: ${letter}`);
            };
            
            utterance.onstart = () => {
                console.log(`Started announcing: ${letter}`);
            };
            
            // Cancel any ongoing speech (iOS safe)
            if (speechSynthesis.speaking) {
                speechSynthesis.cancel();
                // Wait briefly before speaking on iOS
                setTimeout(() => speechSynthesis.speak(utterance), isIOS ? 50 : 0);
            } else {
                speechSynthesis.speak(utterance);
            }
            
        } catch (error) {
            console.error('Error announcing letter:', error);
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
