/**
 * Main Application Entry Point
 * Initializes canvas, websocket, and UI event handlers
 */

// Global managers
let canvasManager;
let websocketManager;

// Performance tracking
let fps = 0;
let lastFrameTime = Date.now();
let frameCount = 0;

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    console.log('Initializing Collaborative Canvas...');
    
    // Initialize canvas manager
    canvasManager = new CanvasManager('drawing-canvas');
    
    // Initialize websocket manager
    websocketManager = new WebSocketManager(canvasManager);
    
    // Make websocketManager available to canvasManager
    window.websocketManager = websocketManager;
    
    // Setup UI event handlers
    setupToolbar();
    setupKeyboardShortcuts();
    
    // Start FPS counter
    startFPSCounter();
    
    console.log('Application initialized successfully');
}

function setupToolbar() {
    // Tool selection (brush/eraser)
    const toolButtons = document.querySelectorAll('.tool-btn');
    toolButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            toolButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const tool = btn.getAttribute('data-tool');
            canvasManager.setTool(tool);
        });
    });
    
    // Color picker
    const colorPicker = document.getElementById('color-picker');
    colorPicker.addEventListener('input', (e) => {
        canvasManager.setColor(e.target.value);
    });
    
    // Color presets
    const colorPresets = document.querySelectorAll('.color-preset');
    colorPresets.forEach(preset => {
        preset.addEventListener('click', () => {
            const color = preset.getAttribute('data-color');
            canvasManager.setColor(color);
            colorPicker.value = color;
        });
    });
    
    // Stroke width
    const strokeWidth = document.getElementById('stroke-width');
    const strokeWidthValue = document.getElementById('stroke-width-value');
    
    strokeWidth.addEventListener('input', (e) => {
        const width = parseInt(e.target.value);
        canvasManager.setStrokeWidth(width);
        strokeWidthValue.textContent = width;
    });
    
    // Undo button
    const undoBtn = document.getElementById('undo-btn');
    undoBtn.addEventListener('click', () => {
        const success = canvasManager.undo();
        if (success && websocketManager) {
            websocketManager.sendUndo();
        }
    });
    
    // Redo button
    const redoBtn = document.getElementById('redo-btn');
    redoBtn.addEventListener('click', () => {
        const success = canvasManager.redo();
        if (success && websocketManager) {
            websocketManager.sendRedo();
        }
    });
    
    // Clear button
    const clearBtn = document.getElementById('clear-btn');
    clearBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear the canvas? This will affect all users.')) {
            canvasManager.clear();
            if (websocketManager) {
                websocketManager.sendClearCanvas();
            }
        }
    });
    
    // Save button
    const saveBtn = document.getElementById('save-btn');
    saveBtn.addEventListener('click', () => {
        saveCanvas();
    });
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Undo: Ctrl+Z or Cmd+Z
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            const success = canvasManager.undo();
            if (success && websocketManager) {
                websocketManager.sendUndo();
            }
        }
        
        // Redo: Ctrl+Y or Cmd+Shift+Z
        if (((e.ctrlKey || e.metaKey) && e.key === 'y') || 
            ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')) {
            e.preventDefault();
            const success = canvasManager.redo();
            if (success && websocketManager) {
                websocketManager.sendRedo();
            }
        }
        
        // Tool shortcuts
        if (e.key === 'b' || e.key === 'B') {
            e.preventDefault();
            selectTool('brush');
        }
        
        if (e.key === 'e' || e.key === 'E') {
            e.preventDefault();
            selectTool('eraser');
        }
        
        // Save: Ctrl+S or Cmd+S
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveCanvas();
        }
    });
}

function selectTool(tool) {
    const toolButtons = document.querySelectorAll('.tool-btn');
    toolButtons.forEach(btn => {
        if (btn.getAttribute('data-tool') === tool) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    canvasManager.setTool(tool);
}

function saveCanvas() {
    const dataURL = canvasManager.getCanvasDataURL();
    const link = document.createElement('a');
    link.download = `canvas_${Date.now()}.png`;
    link.href = dataURL;
    link.click();
    
    showTemporaryMessage('Canvas saved!');
}

function showTemporaryMessage(message) {
    // Create a temporary notification
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

function startFPSCounter() {
    function updateFPS() {
        frameCount++;
        const now = Date.now();
        const elapsed = now - lastFrameTime;
        
        if (elapsed >= 1000) {
            fps = Math.round((frameCount * 1000) / elapsed);
            document.getElementById('fps').textContent = fps;
            
            frameCount = 0;
            lastFrameTime = now;
        }
        
        requestAnimationFrame(updateFPS);
    }
    
    updateFPS();
}

// Add slide animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Handle window resize
window.addEventListener('resize', () => {
    // Canvas size is fixed, but we need to update cursor positions
    // This is handled automatically by the CSS
});

// Warn before leaving if there are active users
window.addEventListener('beforeunload', (e) => {
    if (websocketManager && websocketManager.users.size > 1) {
        e.preventDefault();
        e.returnValue = '';
    }
});
