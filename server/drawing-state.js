/**
 * Drawing State Manager
 * Manages canvas state, drawing history, and synchronization
 * Handles the complex undo/redo across multiple users
 */

class DrawingStateManager {
    constructor() {
        this.rooms = new Map();
        this.maxHistorySize = 100; // Maximum number of operations to keep
    }
    
    /**
     * Initialize state for a room
     * @param {string} roomId 
     */
    initRoom(roomId) {
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, {
                canvasState: null, // Current canvas state as data URL
                drawings: [], // Array of drawing operations
                history: [], // Canvas state history for undo/redo
                historyIndex: -1,
                createdAt: Date.now()
            });
            console.log(`Initialized drawing state for room: ${roomId}`);
        }
        return this.rooms.get(roomId);
    }
    
    /**
     * Get the current canvas state for a room
     * @param {string} roomId 
     */
    getCanvasState(roomId) {
        const room = this.initRoom(roomId);
        return room.canvasState;
    }
    
    /**
     * Set the canvas state for a room
     * @param {string} roomId 
     * @param {string} canvasDataURL - Canvas state as data URL
     */
    setCanvasState(roomId, canvasDataURL) {
        const room = this.initRoom(roomId);
        
        // Remove future history if we're not at the end
        if (room.historyIndex < room.history.length - 1) {
            room.history = room.history.slice(0, room.historyIndex + 1);
        }
        
        // Add to history
        room.history.push({
            state: canvasDataURL,
            timestamp: Date.now()
        });
        room.historyIndex++;
        
        // Limit history size
        if (room.history.length > this.maxHistorySize) {
            room.history.shift();
            room.historyIndex--;
        }
        
        // Update current state
        room.canvasState = canvasDataURL;
        
        console.log(`Canvas state updated for room ${roomId}, history size: ${room.history.length}`);
    }
    
    /**
     * Add a drawing operation to history
     * @param {string} roomId 
     * @param {object} drawing - Drawing operation data
     */
    addDrawing(roomId, drawing) {
        const room = this.initRoom(roomId);
        
        room.drawings.push({
            ...drawing,
            id: `${Date.now()}_${Math.random()}`,
            timestamp: Date.now()
        });
        
        // Limit drawings history
        if (room.drawings.length > this.maxHistorySize * 2) {
            room.drawings = room.drawings.slice(-this.maxHistorySize);
        }
        
        return true;
    }
    
    /**
     * Get all drawings for a room
     * @param {string} roomId 
     */
    getDrawings(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return [];
        
        return room.drawings;
    }
    
    /**
     * Undo operation - go back in history
     * @param {string} roomId 
     */
    undo(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return null;
        
        if (room.historyIndex > 0) {
            room.historyIndex--;
            const previousState = room.history[room.historyIndex];
            room.canvasState = previousState.state;
            
            console.log(`Undo in room ${roomId}, history index: ${room.historyIndex}`);
            return previousState.state;
        }
        
        return null;
    }
    
    /**
     * Redo operation - go forward in history
     * @param {string} roomId 
     */
    redo(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return null;
        
        if (room.historyIndex < room.history.length - 1) {
            room.historyIndex++;
            const nextState = room.history[room.historyIndex];
            room.canvasState = nextState.state;
            
            console.log(`Redo in room ${roomId}, history index: ${room.historyIndex}`);
            return nextState.state;
        }
        
        return null;
    }
    
    /**
     * Clear canvas for a room
     * @param {string} roomId 
     */
    clearCanvas(roomId) {
        const room = this.initRoom(roomId);
        
        room.drawings = [];
        room.canvasState = null;
        
        // Add clear operation to history
        room.history.push({
            state: null,
            timestamp: Date.now(),
            type: 'clear'
        });
        room.historyIndex++;
        
        console.log(`Canvas cleared for room ${roomId}`);
        return true;
    }
    
    /**
     * Get room statistics
     * @param {string} roomId 
     */
    getRoomStats(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return null;
        
        return {
            drawingCount: room.drawings.length,
            historySize: room.history.length,
            historyIndex: room.historyIndex,
            hasCanvasState: room.canvasState !== null,
            createdAt: room.createdAt
        };
    }
    
    /**
     * Delete room state
     * @param {string} roomId 
     */
    deleteRoom(roomId) {
        const deleted = this.rooms.delete(roomId);
        if (deleted) {
            console.log(`Drawing state deleted for room: ${roomId}`);
        }
        return deleted;
    }
    
    /**
     * Get all room states
     */
    getAllRoomStates() {
        const states = [];
        
        for (const [roomId, room] of this.rooms.entries()) {
            states.push({
                roomId,
                ...this.getRoomStats(roomId)
            });
        }
        
        return states;
    }
    
    /**
     * Clean up old room states
     * @param {number} maxAge - Maximum age in milliseconds
     */
    cleanup(maxAge = 86400000) { // Default 24 hours
        const now = Date.now();
        let cleaned = 0;
        
        for (const [roomId, room] of this.rooms.entries()) {
            if ((now - room.createdAt) > maxAge && room.drawings.length === 0) {
                this.deleteRoom(roomId);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            console.log(`Cleaned up ${cleaned} old room states`);
        }
        
        return cleaned;
    }
    
    /**
     * Get memory usage statistics
     */
    getMemoryStats() {
        let totalDrawings = 0;
        let totalHistory = 0;
        let roomsWithState = 0;
        
        for (const room of this.rooms.values()) {
            totalDrawings += room.drawings.length;
            totalHistory += room.history.length;
            if (room.canvasState) roomsWithState++;
        }
        
        return {
            roomCount: this.rooms.size,
            totalDrawings,
            totalHistory,
            roomsWithState,
            avgDrawingsPerRoom: this.rooms.size > 0 ? (totalDrawings / this.rooms.size).toFixed(2) : 0,
            avgHistoryPerRoom: this.rooms.size > 0 ? (totalHistory / this.rooms.size).toFixed(2) : 0
        };
    }
}

module.exports = DrawingStateManager;
