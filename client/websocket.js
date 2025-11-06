/**
 * WebSocket Manager - Handles all real-time communication
 * Manages connection, drawing events, cursor positions, and user presence
 */
class WebSocketManager {
    constructor(canvasManager) {
        this.canvasManager = canvasManager;
        this.socket = null;
        this.userId = null;
        this.username = null;
        this.userColor = null;
        this.users = new Map();
        this.cursors = new Map();
        
        // Performance tracking
        this.pingStart = 0;
        this.latency = 0;
        
        // Batching for performance
        this.cursorUpdateTimeout = null;
        this.lastCursorUpdate = 0;
        this.cursorUpdateInterval = 50; // Update every 50ms max
        
        this.connect();
    }
    
    connect() {
        // Connect to Socket.io server
        this.socket = io({
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 10
        });
        
        this.setupSocketListeners();
    }
    
    setupSocketListeners() {
        // Connection events
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.updateConnectionStatus('connected');
            this.measureLatency();
        });
        
        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.updateConnectionStatus('disconnected');
        });
        
        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            this.updateConnectionStatus('disconnected');
        });
        
        // User initialization
        this.socket.on('init', (data) => {
            this.userId = data.userId;
            this.username = data.username;
            this.userColor = data.color;
            
            console.log('Initialized:', data);
            
            // Load existing canvas state if available
            if (data.canvasState) {
                this.loadCanvasState(data.canvasState);
            }
        });
        
        // User management
        this.socket.on('users', (users) => {
            this.updateUsersList(users);
        });
        
        this.socket.on('user-joined', (user) => {
            console.log('User joined:', user);
            this.users.set(user.id, user);
            this.updateUsersList(Array.from(this.users.values()));
            this.showNotification(`${user.username} joined`);
        });
        
        this.socket.on('user-left', (userId) => {
            const user = this.users.get(userId);
            if (user) {
                console.log('User left:', user);
                this.showNotification(`${user.username} left`);
            }
            this.users.delete(userId);
            this.removeCursor(userId);
            this.updateUsersList(Array.from(this.users.values()));
        });
        
        // Drawing events from other users
        this.socket.on('draw-start', (data) => {
            // Initialize path for this user
            if (!this.users.has(data.userId)) return;
            
            const user = this.users.get(data.userId);
            user.currentPath = [data.point];
        });
        
        this.socket.on('draw-move', (data) => {
            if (!this.users.has(data.userId)) return;
            
            const user = this.users.get(data.userId);
            if (!user.currentPath) {
                user.currentPath = [];
            }
            
            // Add points to path
            data.points.forEach(point => {
                user.currentPath.push(point);
            });
            
            // Render the path in real-time
            this.canvasManager.drawRemotePath(user.currentPath);
        });
        
        this.socket.on('draw-end', (data) => {
            if (!this.users.has(data.userId)) return;
            
            const user = this.users.get(data.userId);
            
            // Final render of complete path
            if (data.path && data.path.length > 0) {
                this.canvasManager.drawRemotePath(data.path);
            }
            
            user.currentPath = null;
        });
        
        // Cursor positions
        this.socket.on('cursor-move', (data) => {
            if (!this.users.has(data.userId)) return;
            
            this.updateRemoteCursor(data.userId, data.x, data.y);
        });
        
        // Undo/Redo events
        this.socket.on('undo', (data) => {
            console.log('Remote undo from:', data.userId);
            // Load the canvas state from server
            if (data.canvasState) {
                this.loadCanvasState(data.canvasState);
            }
        });
        
        this.socket.on('redo', (data) => {
            console.log('Remote redo from:', data.userId);
            // Load the canvas state from server
            if (data.canvasState) {
                this.loadCanvasState(data.canvasState);
            }
        });
        
        // Clear canvas event
        this.socket.on('clear-canvas', () => {
            console.log('Remote clear canvas');
            this.canvasManager.clear();
        });
        
        // Canvas state sync
        this.socket.on('canvas-state', (data) => {
            console.log('Received canvas state');
            this.loadCanvasState(data.state);
        });
        
        // Latency measurement
        this.socket.on('pong', () => {
            this.latency = Date.now() - this.pingStart;
            this.updateLatencyDisplay(this.latency);
        });
    }
    
    // Send drawing events
    sendDrawStart(point) {
        this.socket.emit('draw-start', { point });
    }
    
    sendDrawMove(points) {
        this.socket.emit('draw-move', { points });
    }
    
    sendDrawEnd(path) {
        this.socket.emit('draw-end', { path });
    }
    
    sendCursorMove(x, y) {
        // Throttle cursor updates for performance
        const now = Date.now();
        if (now - this.lastCursorUpdate < this.cursorUpdateInterval) {
            return;
        }
        
        this.lastCursorUpdate = now;
        this.socket.emit('cursor-move', { x, y });
    }
    
    sendUndo() {
        const canvasDataURL = this.canvasManager.getCanvasDataURL();
        this.socket.emit('undo', { canvasState: canvasDataURL });
    }
    
    sendRedo() {
        const canvasDataURL = this.canvasManager.getCanvasDataURL();
        this.socket.emit('redo', { canvasState: canvasDataURL });
    }
    
    sendClearCanvas() {
        this.socket.emit('clear-canvas');
    }
    
    // UI Updates
    updateConnectionStatus(status) {
        const statusElement = document.getElementById('connection-status');
        statusElement.textContent = status === 'connected' ? 'Connected' : 'Disconnected';
        statusElement.className = `status ${status}`;
    }
    
    updateUsersList(users) {
        const usersList = document.getElementById('users-list');
        const userCount = document.getElementById('user-count');
        
        usersList.innerHTML = '';
        users.forEach(user => {
            this.users.set(user.id, user);
            
            const userItem = document.createElement('div');
            userItem.className = 'user-item';
            userItem.innerHTML = `
                <div class="user-color" style="background-color: ${user.color}"></div>
                <span>${user.username}${user.id === this.userId ? ' (You)' : ''}</span>
            `;
            usersList.appendChild(userItem);
        });
        
        userCount.textContent = `Users: ${users.length}`;
    }
    
    updateRemoteCursor(userId, x, y) {
        const user = this.users.get(userId);
        if (!user) return;
        
        let cursor = this.cursors.get(userId);
        const container = document.getElementById('cursors-container');
        
        if (!cursor) {
            cursor = document.createElement('div');
            cursor.className = 'user-cursor';
            cursor.style.backgroundColor = user.color;
            cursor.setAttribute('data-username', user.username);
            container.appendChild(cursor);
            this.cursors.set(userId, cursor);
        }
        
        // Convert canvas coordinates to container coordinates
        const canvas = document.getElementById('drawing-canvas');
        const rect = canvas.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        const scaleX = rect.width / canvas.width;
        const scaleY = rect.height / canvas.height;
        
        const displayX = x * scaleX + (rect.left - containerRect.left);
        const displayY = y * scaleY + (rect.top - containerRect.top);
        
        cursor.style.left = `${displayX}px`;
        cursor.style.top = `${displayY}px`;
    }
    
    removeCursor(userId) {
        const cursor = this.cursors.get(userId);
        if (cursor) {
            cursor.remove();
            this.cursors.delete(userId);
        }
    }
    
    loadCanvasState(canvasDataURL) {
        const img = new Image();
        img.onload = () => {
            const canvas = this.canvasManager.canvas;
            const ctx = this.canvasManager.ctx;
            
            // Clear canvas
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw image
            ctx.drawImage(img, 0, 0);
            
            // Update history
            this.canvasManager.saveState();
        };
        img.src = canvasDataURL;
    }
    
    showNotification(message) {
        // Simple notification - could be enhanced with a proper notification system
        console.log('Notification:', message);
    }
    
    measureLatency() {
        this.pingStart = Date.now();
        this.socket.emit('ping');
        
        // Measure periodically
        setTimeout(() => this.measureLatency(), 5000);
    }
    
    updateLatencyDisplay(latency) {
        const latencyElement = document.getElementById('latency');
        if (latencyElement) {
            latencyElement.textContent = latency;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebSocketManager;
}
