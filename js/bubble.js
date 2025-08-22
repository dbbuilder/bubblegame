/**
 * Bubble Class - Individual bubble entities with physics and rendering
 * Handles bubble movement, rendering, collision detection, and visual effects
 */
class Bubble {
    constructor(x, y, color, isGold = false) {
        try {
            console.log(`Creating ${isGold ? 'gold' : color} bubble at (${x}, ${y})`);
            
            // Position and physics properties
            this.x = x;
            this.y = y;
            this.radius = this.generateRandomRadius();
            this.color = color;
            this.isGold = isGold;
            this.speed = this.calculateInitialSpeed();
            this.points = isGold ? 5 : 1;
            this.letter = this.generateRandomLetter();
            
            // Visual effect properties
            this.opacity = 0.85;
            this.shadowOffset = 3;
            this.highlightIntensity = 0.6;
            
            // Animation properties
            this.bobOffset = Math.random() * Math.PI * 2; // For floating animation
            this.baseY = y;
            
            // State tracking
            this.created = Date.now();
            this.id = this.generateUniqueId();
            
        } catch (error) {
            console.error('Error creating bubble:', error);
            // Set safe defaults if creation fails
            this.x = x || 100;
            this.y = y || 100;
            this.radius = 30;
            this.color = 'blue';
            this.isGold = false;
            this.speed = 1;
            this.points = 1;
        }
    }

    /**
     * Generate random bubble radius within acceptable range
     * @returns {number} Bubble radius in pixels
     */
    generateRandomRadius() {
        try {
            const minRadius = 20;
            const maxRadius = 40;
            return Math.random() * (maxRadius - minRadius) + minRadius;
        } catch (error) {
            console.error('Error generating radius:', error);
            return 30; // Default fallback
        }
    }

    /**
     * Calculate initial speed with slight variation
     * @returns {number} Fall speed in pixels per frame
     */
    calculateInitialSpeed() {
        try {
            // Get base speed from game state, add small random variation
            const baseSpeed = window.gameState ? window.gameState.getBubbleFallSpeed() : 1;
            const variation = (Math.random() - 0.5) * 0.5; // ±0.25 variation
            return Math.max(baseSpeed + variation, 0.5); // Minimum speed of 0.5
        } catch (error) {
            console.error('Error calculating speed:', error);
            return 1; // Default fallback
        }
    }

    /**
     * Generate random letter for bubble
     * @returns {string} Random letter A-Z
     */
    generateRandomLetter() {
        try {
            const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            return letters[Math.floor(Math.random() * letters.length)];
        } catch (error) {
            console.error('Error generating letter:', error);
            return 'A'; // Default fallback
        }
    }

    /**
     * Generate unique identifier for bubble tracking
     * @returns {string} Unique bubble ID
     */
    generateUniqueId() {
        return `bubble_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Update bubble position and animation each frame
     */
    update() {
        try {
            // Main downward movement
            this.y += this.speed;
            
            // Add subtle floating animation (optional)
            const time = (Date.now() - this.created) / 1000;
            const bobAmount = Math.sin(time * 2 + this.bobOffset) * 0.5;
            this.x += bobAmount;
            
        } catch (error) {
            console.error('Error updating bubble:', error);
        }
    }

    /**
     * Render bubble with gradient effects and shadows
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    draw(ctx) {
        try {
            if (!ctx) {
                console.error('No canvas context provided to bubble draw method');
                return;
            }
            
            // Save current context state
            ctx.save();
            
            // Draw shadow first
            this.drawShadow(ctx);
            
            // Draw main bubble with gradient
            this.drawMainBubble(ctx);
            
            // Draw highlight for glossy effect
            this.drawHighlight(ctx);
            
            // Draw letter on bubble
            this.drawLetter(ctx);
            
            // Restore context state
            ctx.restore();
            
        } catch (error) {
            console.error('Error drawing bubble:', error);
        }
    }

    /**
     * Draw bubble shadow
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    drawShadow(ctx) {
        try {
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.beginPath();
            ctx.arc(
                this.x + this.shadowOffset, 
                this.y + this.shadowOffset, 
                this.radius, 
                0, 
                Math.PI * 2
            );
            ctx.fill();
        } catch (error) {
            console.error('Error drawing shadow:', error);
        }
    }

    /**
     * Draw main bubble with gradient
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    drawMainBubble(ctx) {
        try {
            ctx.globalAlpha = this.opacity;
            
            // Create radial gradient for 3D effect
            const gradient = ctx.createRadialGradient(
                this.x - this.radius * 0.3, 
                this.y - this.radius * 0.3, 
                0,
                this.x, 
                this.y, 
                this.radius
            );
            
            // Apply color-specific gradient
            this.applyGradientColors(gradient);
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            
        } catch (error) {
            console.error('Error drawing main bubble:', error);
        }
    }

    /**
     * Apply gradient colors based on bubble type
     * @param {CanvasGradient} gradient - Gradient object to modify
     */
    applyGradientColors(gradient) {
        try {
            if (this.isGold) {
                gradient.addColorStop(0, '#FFE55C');
                gradient.addColorStop(0.4, '#FFD700');
                gradient.addColorStop(0.7, '#FFA500');
                gradient.addColorStop(1, '#FF8C00');
            } else {
                const colorMap = this.getColorMap();
                const colors = colorMap[this.color] || colorMap.blue;
                
                gradient.addColorStop(0, colors.light);
                gradient.addColorStop(0.3, colors.main);
                gradient.addColorStop(1, colors.dark);
            }
        } catch (error) {
            console.error('Error applying gradient colors:', error);
        }
    }

    /**
     * Get color mapping for gradients
     * @returns {Object} Color map with light, main, and dark shades
     */
    getColorMap() {
        return {
            red: { light: '#FFB3BA', main: '#FF6B6B', dark: '#E53E3E' },
            blue: { light: '#AED6F1', main: '#3498DB', dark: '#2980B9' },
            green: { light: '#A9DFBF', main: '#52C41A', dark: '#389E0D' },
            purple: { light: '#D2B4DE', main: '#9B59B6', dark: '#7D3C98' },
            orange: { light: '#FADBD8', main: '#FF7F50', dark: '#E55722' },
            pink: { light: '#F8D7DA', main: '#FF69B4', dark: '#C71585' }
        };
    }

    /**
     * Draw highlight for glossy effect
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    drawHighlight(ctx) {
        try {
            ctx.globalAlpha = this.highlightIntensity;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(
                this.x - this.radius * 0.3, 
                this.y - this.radius * 0.3, 
                this.radius * 0.3, 
                0, 
                Math.PI * 2
            );
            ctx.fill();
        } catch (error) {
            console.error('Error drawing highlight:', error);
        }
    }

    /**
     * Draw letter on bubble
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    drawLetter(ctx) {
        try {
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = this.isGold ? '#8B4513' : '#000000'; // Brown for gold, black for regular
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            
            // Calculate font size based on bubble radius
            const fontSize = Math.max(this.radius * 0.8, 16);
            ctx.font = `bold ${fontSize}px Arial, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Draw text with outline for better visibility
            ctx.strokeText(this.letter, this.x, this.y);
            ctx.fillText(this.letter, this.x, this.y);
            
        } catch (error) {
            console.error('Error drawing letter on bubble:', error);
        }
    }

    /**
     * Check if point is inside bubble (for click detection)
     * @param {number} x - X coordinate to test
     * @param {number} y - Y coordinate to test
     * @returns {boolean} True if point is inside bubble
     */
    containsPoint(x, y) {
        try {
            const distance = Math.sqrt(
                Math.pow(x - this.x, 2) + Math.pow(y - this.y, 2)
            );
            return distance <= this.radius;
        } catch (error) {
            console.error('Error checking point containment:', error);
            return false;
        }
    }

    /**
     * Check if bubble has fallen off screen
     * @param {number} canvasHeight - Height of game canvas
     * @returns {boolean} True if bubble is off screen
     */
    isOffScreen(canvasHeight) {
        try {
            return this.y - this.radius > canvasHeight;
        } catch (error) {
            console.error('Error checking off-screen status:', error);
            return false;
        }
    }

    /**
     * Get bubble age in seconds
     * @returns {number} Age in seconds
     */
    getAge() {
        try {
            return (Date.now() - this.created) / 1000;
        } catch (error) {
            console.error('Error calculating bubble age:', error);
            return 0;
        }
    }

    /**
     * Check if bubble is within canvas bounds
     * @param {number} canvasWidth - Width of game canvas
     * @param {number} canvasHeight - Height of game canvas
     * @returns {boolean} True if bubble is within bounds
     */
    isWithinBounds(canvasWidth, canvasHeight) {
        try {
            return (
                this.x - this.radius >= 0 &&
                this.x + this.radius <= canvasWidth &&
                this.y - this.radius >= 0 &&
                this.y + this.radius <= canvasHeight
            );
        } catch (error) {
            console.error('Error checking bounds:', error);
            return false;
        }
    }

    /**
     * Get bubble information for debugging
     * @returns {Object} Bubble debug information
     */
    getDebugInfo() {
        return {
            id: this.id,
            position: { x: this.x, y: this.y },
            radius: this.radius,
            color: this.color,
            letter: this.letter,
            isGold: this.isGold,
            speed: this.speed,
            points: this.points,
            age: this.getAge()
        };
    }

    /**
     * Update bubble based on new game speed (for level changes)
     * @param {number} newSpeed - New fall speed
     */
    updateSpeed(newSpeed) {
        try {
            if (typeof newSpeed === 'number' && newSpeed > 0) {
                this.speed = newSpeed;
                console.log(`Updated bubble ${this.id} speed to ${newSpeed}`);
            }
        } catch (error) {
            console.error('Error updating bubble speed:', error);
        }
    }
}
