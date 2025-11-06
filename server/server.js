/**
 * Main Server - Express + Socket.io
 * Handles WebSocket connections, user management, and canvas state
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const RoomManager = require('./rooms');
const DrawingStateManager = require('./drawing-state');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Serve static files from client directory
app.use(express.static(path.join(__dirname, '../client')));

// Initialize managers
const roomManager = new RoomManager();
const drawingStateManager = new DrawingStateManager();

// Available colors for users
const USER_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788'
];

let colorIndex = 0;

// Generate random username
function generateUsername() {
    const adjectives = ['Happy', 'Creative', 'Artistic', 'Clever', 'Bright', 'Swift', 'Bold', 'Calm'];
    const nouns = ['Panda', 'Fox', 'Eagle', 'Wolf', 'Bear', 'Lion', 'Tiger', 'Dragon'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${adj}${noun}${Math.floor(Math.random() * 100)}`;
}

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);
    
    // Initialize user
    const userId = socket.id;
    const username = generateUsername();
    const userColor = USER_COLORS[colorIndex % USER_COLORS.length];
    colorIndex++;
    
    const user = {
        id: userId,
        username: username,
        color: userColor,
        socketId: socket.id
    };
    
    // Add user to default room
    const roomId = 'default';
    roomManager.addUser(roomId, user);
    socket.join(roomId);
    
    // Send initialization data to the new user
    socket.emit('init', {
        userId: userId,
        username: username,
        color: userColor,
        canvasState: drawingStateManager.getCanvasState(roomId)
    });
    
    // Send current users list to the new user
    const users = roomManager.getUsers(roomId);
    socket.emit('users', users);
    
    // Notify other users about the new user
    socket.to(roomId).emit('user-joined', user);
    
    // Handle drawing start
    socket.on('draw-start', (data) => {
        const event = {
            userId: userId,
            point: data.point,
            timestamp: Date.now()
        };
        
        // Broadcast to other users in the room
        socket.to(roomId).emit('draw-start', event);
    });
    
    // Handle drawing move
    socket.on('draw-move', (data) => {
        const event = {
            userId: userId,
            points: data.points,
            timestamp: Date.now()
        };
        
        // Broadcast to other users in the room
        socket.to(roomId).emit('draw-move', event);
    });
    
    // Handle drawing end
    socket.on('draw-end', (data) => {
        const event = {
            userId: userId,
            path: data.path,
            timestamp: Date.now()
        };
        
        // Add to drawing history
        drawingStateManager.addDrawing(roomId, {
            userId: userId,
            path: data.path,
            timestamp: Date.now()
        });
        
        // Broadcast to other users in the room
        socket.to(roomId).emit('draw-end', event);
    });
    
    // Handle cursor movement
    socket.on('cursor-move', (data) => {
        socket.to(roomId).emit('cursor-move', {
            userId: userId,
            x: data.x,
            y: data.y
        });
    });
    
    // Handle undo
    socket.on('undo', (data) => {
        // Update canvas state
        if (data.canvasState) {
            drawingStateManager.setCanvasState(roomId, data.canvasState);
        }
        
        // Broadcast undo to all users
        io.to(roomId).emit('undo', {
            userId: userId,
            canvasState: data.canvasState
        });
        
        console.log(`User ${username} performed undo`);
    });
    
    // Handle redo
    socket.on('redo', (data) => {
        // Update canvas state
        if (data.canvasState) {
            drawingStateManager.setCanvasState(roomId, data.canvasState);
        }
        
        // Broadcast redo to all users
        io.to(roomId).emit('redo', {
            userId: userId,
            canvasState: data.canvasState
        });
        
        console.log(`User ${username} performed redo`);
    });
    
    // Handle clear canvas
    socket.on('clear-canvas', () => {
        // Clear drawing history
        drawingStateManager.clearCanvas(roomId);
        
        // Broadcast to all users
        io.to(roomId).emit('clear-canvas');
        
        console.log(`User ${username} cleared canvas`);
    });
    
    // Handle ping for latency measurement
    socket.on('ping', () => {
        socket.emit('pong');
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        
        // Remove user from room
        roomManager.removeUser(roomId, userId);
        
        // Notify other users
        socket.to(roomId).emit('user-left', userId);
        
        // Update users list for remaining users
        const remainingUsers = roomManager.getUsers(roomId);
        io.to(roomId).emit('users', remainingUsers);
    });
});

// API endpoints
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        connections: io.sockets.sockets.size
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`
    ╔════════════════════════════════════════════╗
    ║   🎨 Collaborative Canvas Server          ║
    ║                                            ║
    ║   Server running on port ${PORT}            ║
    ║   Local: http://localhost:${PORT}          ║
    ║                                            ║
    ║   Ready to accept connections!            ║
    ╚════════════════════════════════════════════╝
    `);
});

// Handle server errors
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
        process.exit(1);
    } else {
        console.error('Server error:', error);
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});

module.exports = { app, server, io };
