/**
 * Canvas Manager - Handles all canvas drawing operations
 * Implements efficient path rendering, undo/redo, and layer management
 */
class CanvasManager {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: false });
        
        // Canvas state
        this.isDrawing = false;
        this.currentPath = [];
        
        // Tool settings
        this.tool = 'brush';
        this.color = '#000000';
        this.strokeWidth = 3;
        
        // History management for undo/redo
        this.history = [];
        this.historyStep = -1;
        
        // Performance optimization
        this.rafId = null;
        this.pathBuffer = [];
        
        this.initCanvas();
        this.setupEventListeners();
    }
    
    initCanvas() {
        // Set canvas size
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        // Use fixed size for consistency across users
        this.canvas.width = 1200;
        this.canvas.height = 700;
        
        // Set canvas style for responsive display
        this.canvas.style.maxWidth = '100%';
        this.canvas.style.height = 'auto';
        
        // Configure context for better drawing
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // Fill with white background
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Save initial state
        this.saveState();
    }
    
    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseleave', this.stopDrawing.bind(this));
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.stopDrawing.bind(this));
        
        // Prevent default touch behavior
        this.canvas.addEventListener('touchstart', (e) => e.preventDefault());
    }
    
    getCanvasPoint(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }
    
    startDrawing(e) {
        this.isDrawing = true;
        const point = this.getCanvasPoint(e.clientX, e.clientY);
        
        this.currentPath = [{
            x: point.x,
            y: point.y,
            color: this.color,
            width: this.strokeWidth,
            tool: this.tool,
            timestamp: Date.now()
        }];
        
        // Emit to other users
        if (window.websocketManager) {
            window.websocketManager.sendDrawStart({
                x: point.x,
                y: point.y,
                color: this.color,
                width: this.strokeWidth,
                tool: this.tool
            });
        }
    }
    
    draw(e) {
        if (!this.isDrawing) {
            // Send cursor position even when not drawing
            const point = this.getCanvasPoint(e.clientX, e.clientY);
            if (window.websocketManager) {
                window.websocketManager.sendCursorMove(point.x, point.y);
            }
            return;
        }
        
        const point = this.getCanvasPoint(e.clientX, e.clientY);
        
        // Add point to current path
        this.currentPath.push({
            x: point.x,
            y: point.y,
            color: this.color,
            width: this.strokeWidth,
            tool: this.tool,
            timestamp: Date.now()
        });
        
        // Batch points for performance
        this.pathBuffer.push(point);
        
        // Use requestAnimationFrame for smooth rendering
        if (!this.rafId) {
            this.rafId = requestAnimationFrame(() => {
                this.renderPath(this.currentPath);
                
                // Emit batched points to other users
                if (window.websocketManager && this.pathBuffer.length > 0) {
                    window.websocketManager.sendDrawMove(this.pathBuffer);
                    this.pathBuffer = [];
                }
                
                this.rafId = null;
            });
        }
    }
    
    stopDrawing(e) {
        if (!this.isDrawing) return;
        
        this.isDrawing = false;
        
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        
        // Save the completed path to history
        if (this.currentPath.length > 0) {
            this.saveState();
            
            // Emit to other users
            if (window.websocketManager) {
                window.websocketManager.sendDrawEnd(this.currentPath);
            }
        }
        
        this.currentPath = [];
        this.pathBuffer = [];
    }
    
    renderPath(path) {
        if (path.length < 2) return;
        
        const firstPoint = path[0];
        
        this.ctx.strokeStyle = firstPoint.tool === 'eraser' ? '#ffffff' : firstPoint.color;
        this.ctx.lineWidth = firstPoint.width;
        this.ctx.globalCompositeOperation = firstPoint.tool === 'eraser' ? 'destination-out' : 'source-over';
        
        this.ctx.beginPath();
        this.ctx.moveTo(firstPoint.x, firstPoint.y);
        
        // Use quadratic curves for smoother lines
        for (let i = 1; i < path.length - 1; i++) {
            const xc = (path[i].x + path[i + 1].x) / 2;
            const yc = (path[i].y + path[i + 1].y) / 2;
            this.ctx.quadraticCurveTo(path[i].x, path[i].y, xc, yc);
        }
        
        // Draw last line segment
        const lastPoint = path[path.length - 1];
        this.ctx.lineTo(lastPoint.x, lastPoint.y);
        this.ctx.stroke();
        
        // Reset composite operation
        this.ctx.globalCompositeOperation = 'source-over';
    }
    
    drawRemotePath(path) {
        if (!path || path.length === 0) return;
        this.renderPath(path);
    }
    
    saveState() {
        // Remove any redo history
        this.history = this.history.slice(0, this.historyStep + 1);
        
        // Save current canvas state
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        this.history.push(imageData);
        this.historyStep++;
        
        // Limit history to 50 steps to prevent memory issues
        if (this.history.length > 50) {
            this.history.shift();
            this.historyStep--;
        }
    }
    
    undo() {
        if (this.historyStep > 0) {
            this.historyStep--;
            const imageData = this.history[this.historyStep];
            this.ctx.putImageData(imageData, 0, 0);
            return true;
        }
        return false;
    }
    
    redo() {
        if (this.historyStep < this.history.length - 1) {
            this.historyStep++;
            const imageData = this.history[this.historyStep];
            this.ctx.putImageData(imageData, 0, 0);
            return true;
        }
        return false;
    }
    
    clear() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.saveState();
    }
    
    loadState(imageData) {
        if (imageData) {
            this.ctx.putImageData(imageData, 0, 0);
            this.saveState();
        }
    }
    
    getCanvasDataURL() {
        return this.canvas.toDataURL('image/png');
    }
    
    // Touch event handlers
    handleTouchStart(e) {
        if (e.touches.length > 0) {
            const touch = e.touches[0];
            this.startDrawing({
                clientX: touch.clientX,
                clientY: touch.clientY
            });
        }
    }
    
    handleTouchMove(e) {
        if (e.touches.length > 0) {
            const touch = e.touches[0];
            this.draw({
                clientX: touch.clientX,
                clientY: touch.clientY
            });
        }
    }
    
    setTool(tool) {
        this.tool = tool;
    }
    
    setColor(color) {
        this.color = color;
    }
    
    setStrokeWidth(width) {
        this.strokeWidth = width;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CanvasManager;
}
