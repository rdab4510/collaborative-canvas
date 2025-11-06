# 🎨 Real-Time Collaborative Drawing Canvas

A multi-user drawing application where multiple people can draw simultaneously on the same canvas with real-time synchronization.

## ✨ Features

- **Real-time Drawing**: See other users' drawings as they draw in real-time
- **Multiple Tools**: Brush and eraser with adjustable sizes and colors
- **User Presence**: See who's online and where they're drawing (cursor indicators)
- **Global Undo/Redo**: Works across all connected users
- **Performance Metrics**: FPS counter and latency display
- **Mobile Support**: Touch-enabled drawing for mobile devices
- **Canvas Persistence**: Automatically syncs canvas state to new users

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start the server
npm start
```

The application will be available at `http://localhost:3000`

### Development Mode

```bash
# Run with auto-reload on file changes
npm run dev
```

## 📱 Testing with Multiple Users

To test the collaborative features:

1. **Local Testing**: 
   - Open multiple browser tabs/windows at `http://localhost:3000`
   - Each tab represents a different user

2. **Network Testing**:
   - Find your local IP address (use `ipconfig` on Windows or `ifconfig` on Mac/Linux)
   - Other devices on the same network can access: `http://<your-ip>:3000`

3. **Remote Testing**:
   - Deploy to a hosting service (see Deployment section)
   - Share the URL with others

## 🎮 How to Use

### Drawing Tools

- **Brush (B)**: Draw freehand with selected color
- **Eraser (E)**: Erase parts of the drawing
- **Color Picker**: Choose any color or use presets
- **Stroke Width**: Adjust brush/eraser size (1-50px)

### Actions

- **Undo (Ctrl+Z / Cmd+Z)**: Undo last action (affects all users)
- **Redo (Ctrl+Y / Cmd+Shift+Z)**: Redo last undone action
- **Clear**: Clear entire canvas (requires confirmation)
- **Save (Ctrl+S / Cmd+S)**: Download canvas as PNG image

### Keyboard Shortcuts

- `B` - Switch to Brush tool
- `E` - Switch to Eraser tool
- `Ctrl+Z` / `Cmd+Z` - Undo
- `Ctrl+Y` / `Cmd+Shift+Z` - Redo
- `Ctrl+S` / `Cmd+S` - Save canvas

## 🏗️ Project Structure

```
collaborative-canvas/
├── client/                 # Frontend files
│   ├── index.html         # Main HTML structure
│   ├── style.css          # Styling and layout
│   ├── canvas.js          # Canvas drawing logic
│   ├── websocket.js       # WebSocket client management
│   └── main.js            # Application initialization
├── server/                # Backend files
│   ├── server.js          # Express + Socket.io server
│   ├── rooms.js           # Room management
│   └── drawing-state.js   # Canvas state management
├── package.json           # Dependencies and scripts
├── README.md             # This file
└── ARCHITECTURE.md       # Technical architecture details
```

## 🔧 Configuration

### Port Configuration

Default port is 3000. To change it, set the `PORT` environment variable:

```bash
PORT=8080 npm start
```

### Canvas Size

Canvas size is fixed at 1200x700px for consistency across all users. To modify, edit the `initCanvas()` method in `client/canvas.js`:

```javascript
this.canvas.width = 1200;  // Change width
this.canvas.height = 700;  // Change height
```

## 🚀 Deployment

### Heroku

```bash
# Login to Heroku
heroku login

# Create new app
heroku create your-app-name

# Deploy
git push heroku main

# Open app
heroku open
```

### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Render

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set build command: `npm install`
4. Set start command: `npm start`

### Deployed Links
```bash
https://collaborative-canvas-s23v.onrender.com/ # Render

```

## 🐛 Known Limitations

1. **Canvas State Size**: Canvas states are stored in memory. With many users and long sessions, memory usage can increase. Consider implementing periodic cleanup or database storage for production.

2. **No Authentication**: Currently uses randomly generated usernames. Add authentication for production use.

3. **Single Room**: All users join the same default room. Room selection UI could be added.

4. **Undo/Redo Conflicts**: When multiple users undo/redo simultaneously, the last operation wins. This is a known trade-off for simplicity.

5. **No Drawing Persistence**: Drawings are lost when all users disconnect. Implement database storage for persistence.

## ⏱️ Time Spent

**Total Development Time**: ~8-10 hours

- Planning & Architecture: 1 hour
- Canvas Implementation: 2 hours
- WebSocket Communication: 2 hours
- Real-time Synchronization: 2 hours
- UI/UX & Styling: 1.5 hours
- Testing & Bug Fixes: 1.5 hours
- Documentation: 1 hour

## 🔍 Technical Highlights

1. **Efficient Path Rendering**: Uses quadratic curves for smooth lines
2. **Event Batching**: Groups drawing points to reduce network traffic
3. **Request Animation Frame**: Ensures smooth 60 FPS rendering
4. **Client-side Prediction**: Draws locally before server confirmation
5. **Cursor Throttling**: Limits cursor updates to 50ms intervals

## 📊 Performance

- **FPS**: Maintains 60 FPS with multiple concurrent users
- **Latency**: Typically <50ms on local network
- **Network Usage**: ~10-20 KB/s per active user
- **Memory**: ~50-100 MB for client, scales with user count on server

## 🤝 Contributing

Contributions are welcome! Areas for improvement:

- Add more drawing tools (rectangle, circle, line, text)
- Implement drawing layers
- Add room selection/creation UI
- Implement user authentication
- Add database persistence
- Optimize for 100+ concurrent users
- Add voice/text chat
- Implement drawing permissions

## 📝 License

MIT License - feel free to use this project for learning or commercial purposes.

## 🙏 Acknowledgments

Built as part of a technical assignment to demonstrate:
- Canvas API mastery
- Real-time WebSocket communication
- State management across multiple clients
- Performance optimization
- Clean code architecture

---

**Need Help?** Check out [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed technical documentation.
