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
        
        // Audio file caching system
        this.letterAudioCache = new Map(); // Cache for preloaded letter audio
        this.audioFilesEnabled = true; // Prefer audio files over speech synthesis
        this.audioFilesLoaded = false;
        this.letterAudioBaseUrl = 'https://ssl.gstatic.com/dictionary/static/sounds/20220808/'; // Google's letter sounds
        
        this.setupSpeechSynthesis();
        this.preloadLetterAudioFiles();
        
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
     * Preload letter pronunciation audio files for reliable mobile playback
     */
    async preloadLetterAudioFiles() {
        try {
            console.log('Preloading letter audio files...');
            
            // Define letter audio mappings - using phonetic file names
            const letterMappings = {
                'A': 'a--_us_1.mp3', 'B': 'b--_us_1.mp3', 'C': 'c--_us_1.mp3', 'D': 'd--_us_1.mp3',
                'E': 'e--_us_1.mp3', 'F': 'f--_us_1.mp3', 'G': 'g--_us_1.mp3', 'H': 'h--_us_1.mp3',
                'I': 'i--_us_1.mp3', 'J': 'j--_us_1.mp3', 'K': 'k--_us_1.mp3', 'L': 'l--_us_1.mp3',
                'M': 'm--_us_1.mp3', 'N': 'n--_us_1.mp3', 'O': 'o--_us_1.mp3', 'P': 'p--_us_1.mp3',
                'Q': 'q--_us_1.mp3', 'R': 'r--_us_1.mp3', 'S': 's--_us_1.mp3', 'T': 't--_us_1.mp3',
                'U': 'u--_us_1.mp3', 'V': 'v--_us_1.mp3', 'W': 'w--_us_1.mp3', 'X': 'x--_us_1.mp3',
                'Y': 'y--_us_1.mp3', 'Z': 'z--_us_1.mp3'
            };
            
            // Load each letter audio file
            const loadPromises = Object.entries(letterMappings).map(async ([letter, filename]) => {
                try {
                    const audio = new Audio();
                    audio.preload = 'auto';
                    audio.crossOrigin = 'anonymous';
                    
                    // Set up promise to resolve when audio is loaded
                    return new Promise((resolve, reject) => {
                        audio.addEventListener('canplaythrough', () => {
                            this.letterAudioCache.set(letter, audio);
                            console.log(`✅ Loaded audio for letter: ${letter}`);
                            resolve();
                        });
                        
                        audio.addEventListener('error', (e) => {
                            console.warn(`⚠️ Failed to load audio for letter ${letter}:`, e);
                            resolve(); // Don't reject, just continue without this file
                        });
                        
                        // Try to load the audio file
                        audio.src = `${this.letterAudioBaseUrl}${filename}`;
                    });
                } catch (error) {
                    console.warn(`Error setting up audio for letter ${letter}:`, error);
                }
            });
            
            // Wait for all files to load (or fail)
            await Promise.all(loadPromises);
            
            const loadedCount = this.letterAudioCache.size;
            console.log(`🎵 Letter audio preloading complete: ${loadedCount}/26 files loaded`);
            
            // Mark as loaded if we got at least some files
            this.audioFilesLoaded = loadedCount > 0;
            
            if (loadedCount === 0) {
                console.warn('No letter audio files loaded, will fall back to speech synthesis');
                this.audioFilesEnabled = false;
            }
            
        } catch (error) {
            console.error('Error preloading letter audio files:', error);
            this.audioFilesEnabled = false;
        }
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
     * Announce letter name using cached audio files or speech synthesis fallback
     * @param {string} letter - Letter to announce
     */
    announceLetter(letter) {
        try {
            // Skip if muted
            if (this.masterVolume === 0) {
                console.log('Audio muted, skipping letter announcement');
                return;
            }
            
            console.log(`Announcing letter: ${letter}`);
            
            // Try cached audio files first (more reliable on mobile)
            if (this.audioFilesEnabled && this.letterAudioCache.has(letter.toUpperCase())) {
                this.playLetterAudioFile(letter.toUpperCase());
                return;
            }
            
            // Fallback to speech synthesis
            if (!this.speechEnabled) {
                console.warn('Speech synthesis not supported and no audio file available');
                return;
            }
            
            // iOS workaround: Check if voices are loaded
            let voices = speechSynthesis.getVoices();
            if (voices.length === 0) {
                // Wait for voices to load on iOS
                setTimeout(() => this.announceLetter(letter), 100);
                return;
            }
            
            // Create speech utterance - Chrome iOS needs sentence context
            const isChrome = navigator.userAgent.includes('Chrome');
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            
            let speechText;
            if (isChrome && isIOS) {
                // Chrome on iOS - use full sentence approach to force speech
                speechText = `The letter ${letter.toUpperCase()}`;
                console.log(`Chrome iOS - Speaking sentence: "${speechText}"`);
            } else {
                // Other browsers - direct letter
                speechText = letter.toUpperCase();
                console.log(`Other browser - Speaking letter: "${speechText}"`);
            }
            
            const utterance = new SpeechSynthesisUtterance(speechText);
            
            // Configure speech parameters - simple approach that was working
            utterance.rate = 1.0; // Normal rate
            utterance.pitch = 1.0; // Normal pitch  
            utterance.volume = 1.0; // Full volume
            
            // Simplified voice selection for reliability
            let preferredVoice = null;
            
            if (voices.length > 0) {
                // Simple voice selection - find any good English voice
                preferredVoice = voices.find(voice => 
                    voice.lang.startsWith('en') && voice.localService
                ) || voices.find(voice => 
                    voice.lang.startsWith('en')
                ) || voices[0]; // Fallback to any voice
            }
            
            if (preferredVoice) {
                utterance.voice = preferredVoice;
                console.log(`🗣️  Using voice: ${preferredVoice.name} (${preferredVoice.lang}) - Local: ${preferredVoice.localService}`);
            } else {
                console.log('⚠️  Using default voice - no preferred voice found');
                console.log(`Available voices: ${voices.length}`);
                if (voices.length > 0) {
                    voices.slice(0, 3).forEach((v, i) => {
                        console.log(`  ${i}: ${v.name} (${v.lang}) - Local: ${v.localService}`);
                    });
                }
            }
            
            // Error handling for speech synthesis
            utterance.onerror = (event) => {
                console.error('Speech synthesis error:', event.error);
                // Simple fallback: try again with basic settings
                if (event.error === 'not-allowed' || event.error === 'interrupted') {
                    console.log('Retrying speech synthesis with basic settings...');
                    setTimeout(() => {
                        const fallbackUtterance = new SpeechSynthesisUtterance(letter);
                        fallbackUtterance.rate = 1.0;
                        fallbackUtterance.pitch = 1.0;
                        fallbackUtterance.volume = 1.0;
                        speechSynthesis.speak(fallbackUtterance);
                    }, 200);
                }
            };
            
            utterance.onend = () => {
                console.log(`✅ Speech finished: ${speechText}`);
            };
            
            utterance.onstart = () => {
                console.log(`🎵 Speech started: ${speechText}`);
            };
            
            utterance.onboundary = (event) => {
                console.log(`📍 Speech boundary: ${event.name} at ${event.charIndex}`);
            };
            
            // Cancel any ongoing speech and speak new utterance
            speechSynthesis.cancel();
            
            // Brief delay to ensure cancel completes, then speak
            setTimeout(() => {
                try {
                    console.log(`🚀 Speaking now: "${speechText}"`);
                    speechSynthesis.speak(utterance);
                } catch (error) {
                    console.error('Error speaking utterance:', error);
                }
            }, 100);
            
        } catch (error) {
            console.error('Error announcing letter:', error);
        }
    }

    /**
     * Play letter pronunciation from cached audio file
     * @param {string} letter - Letter to play (A-Z)
     */
    playLetterAudioFile(letter) {
        try {
            const audio = this.letterAudioCache.get(letter);
            if (!audio) {
                console.warn(`No cached audio file for letter: ${letter}`);
                return;
            }
            
            console.log(`🎵 Playing audio file for letter: ${letter}`);
            
            // Reset audio to beginning and play
            audio.currentTime = 0;
            audio.volume = this.masterVolume;
            
            // Create a clone to allow overlapping sounds
            const audioClone = audio.cloneNode();
            audioClone.volume = this.masterVolume;
            
            // Play the cloned audio
            const playPromise = audioClone.play();
            
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log(`✅ Successfully played audio for letter: ${letter}`);
                }).catch(error => {
                    console.warn(`Failed to play audio for letter ${letter}:`, error);
                    // Fallback to speech synthesis if audio fails
                    console.log('Falling back to speech synthesis...');
                    this.fallbackToSpeechSynthesis(letter);
                });
            }
            
        } catch (error) {
            console.error('Error playing letter audio file:', error);
            // Fallback to speech synthesis if audio fails
            this.fallbackToSpeechSynthesis(letter);
        }
    }

    /**
     * Fallback to speech synthesis when audio files fail
     * @param {string} letter - Letter to announce via speech
     */
    fallbackToSpeechSynthesis(letter) {
        try {
            if (!this.speechEnabled) {
                console.warn('Speech synthesis not available for fallback');
                return;
            }
            
            console.log(`Using speech synthesis fallback for letter: ${letter}`);
            
            const utterance = new SpeechSynthesisUtterance(letter.toUpperCase());
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            
            speechSynthesis.cancel();
            setTimeout(() => {
                speechSynthesis.speak(utterance);
            }, 100);
            
        } catch (error) {
            console.error('Error in speech synthesis fallback:', error);
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
