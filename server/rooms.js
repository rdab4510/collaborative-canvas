/**
 * Room Manager
 * Handles multiple isolated drawing rooms and user management
 */

class RoomManager {
    constructor() {
        this.rooms = new Map();
    }
    
    /**
     * Create a new room
     * @param {string} roomId - Unique room identifier
     */
    createRoom(roomId) {
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, {
                id: roomId,
                users: new Map(),
                createdAt: Date.now()
            });
            console.log(`Room created: ${roomId}`);
        }
        return this.rooms.get(roomId);
    }
    
    /**
     * Get a room by ID, create if doesn't exist
     * @param {string} roomId 
     */
    getRoom(roomId) {
        if (!this.rooms.has(roomId)) {
            return this.createRoom(roomId);
        }
        return this.rooms.get(roomId);
    }
    
    /**
     * Add a user to a room
     * @param {string} roomId 
     * @param {object} user - User object with id, username, color
     */
    addUser(roomId, user) {
        const room = this.getRoom(roomId);
        room.users.set(user.id, user);
        console.log(`User ${user.username} joined room ${roomId}`);
        return true;
    }
    
    /**
     * Remove a user from a room
     * @param {string} roomId 
     * @param {string} userId 
     */
    removeUser(roomId, userId) {
        const room = this.rooms.get(roomId);
        if (!room) return false;
        
        const user = room.users.get(userId);
        if (user) {
            room.users.delete(userId);
            console.log(`User ${user.username} left room ${roomId}`);
            
            // Clean up empty rooms (optional)
            if (room.users.size === 0) {
                // Keep room for a while in case someone rejoins
                // Could implement automatic cleanup after timeout
            }
            
            return true;
        }
        return false;
    }
    
    /**
     * Get all users in a room
     * @param {string} roomId 
     */
    getUsers(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return [];
        
        return Array.from(room.users.values());
    }
    
    /**
     * Get a specific user in a room
     * @param {string} roomId 
     * @param {string} userId 
     */
    getUser(roomId, userId) {
        const room = this.rooms.get(roomId);
        if (!room) return null;
        
        return room.users.get(userId);
    }
    
    /**
     * Get number of users in a room
     * @param {string} roomId 
     */
    getUserCount(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return 0;
        
        return room.users.size;
    }
    
    /**
     * Check if a user is in a room
     * @param {string} roomId 
     * @param {string} userId 
     */
    hasUser(roomId, userId) {
        const room = this.rooms.get(roomId);
        if (!room) return false;
        
        return room.users.has(userId);
    }
    
    /**
     * Get all rooms
     */
    getAllRooms() {
        return Array.from(this.rooms.values()).map(room => ({
            id: room.id,
            userCount: room.users.size,
            createdAt: room.createdAt
        }));
    }
    
    /**
     * Delete a room
     * @param {string} roomId 
     */
    deleteRoom(roomId) {
        const deleted = this.rooms.delete(roomId);
        if (deleted) {
            console.log(`Room deleted: ${roomId}`);
        }
        return deleted;
    }
    
    /**
     * Clean up empty rooms older than specified time
     * @param {number} maxAge - Maximum age in milliseconds
     */
    cleanupEmptyRooms(maxAge = 3600000) { // Default 1 hour
        const now = Date.now();
        let cleaned = 0;
        
        for (const [roomId, room] of this.rooms.entries()) {
            if (room.users.size === 0 && (now - room.createdAt) > maxAge) {
                this.deleteRoom(roomId);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            console.log(`Cleaned up ${cleaned} empty rooms`);
        }
        
        return cleaned;
    }
}

module.exports = RoomManager;
