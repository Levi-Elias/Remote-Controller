const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Generate 6-letter game code
let gameCode = generateGameCode();

function generateGameCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// HTTP server to serve static files
const server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, '../public', req.url === '/' ? 'index.html' : req.url);
    if (req.url === '/mobile') {
        filePath = path.join(__dirname, '../public/mobile.html');
    }
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('File not found');
            return;
        }
        res.writeHead(200, { 'Content-Type': getContentType(filePath) });
        res.end(data);
    });
});

function getContentType(filePath) {
    const ext = path.extname(filePath);
    switch (ext) {
        case '.html': return 'text/html';
        case '.css': return 'text/css';
        case '.js': return 'text/javascript';
        default: return 'text/plain';
    }
}

server.listen(3002, () => {
    console.log('HTTP server started on port 3002');
});

// WebSocket server
const wss = new WebSocket.Server({ server });

wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
});

let gameState = {
    players: [],
    powerUps: [],
    gameRunning: false,
    canvasWidth: 800,
    canvasHeight: 600,
    currentRound: 1,
    maxRounds: 5
};

let playerIdCounter = 0;

wss.on('connection', ws => {
    console.log('Client connected');
    const playerId = playerIdCounter++;
    ws.playerId = playerId;

    // Send initial state
    ws.send(JSON.stringify({ type: 'init', playerId, gameCode, gameState }));

    ws.on('message', message => {
        try {
            const data = JSON.parse(message);
            handleMessage(ws, data);
        } catch (error) {
            console.error('Error parsing or handling message:', error);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        // Remove player
        gameState.players = gameState.players.filter(p => p.id !== ws.playerId);
        broadcastGameState();
    });
});

function handleMessage(ws, data) {
    switch (data.type) {
        case 'join':
            if (data.code === gameCode && data.name) {
                // Add player
                const newPlayer = {
                    id: ws.playerId,
                    name: data.name,
                    x: Math.random() * (gameState.canvasWidth - 20) + 10,
                    y: Math.random() * (gameState.canvasHeight - 20) + 10,
                    direction: Math.random() * 2 * Math.PI,
                    speed: 2,
                    color: getRandomColor(),
                    trail: [],
                    score: 0,
                    alive: true,
                    input: { left: false, right: false },
                    holeTimer: 0
                };
                gameState.players.push(newPlayer);
                broadcastGameState();
            } else {
                ws.send(JSON.stringify({ type: 'error', message: 'Invalid game code or missing name' }));
            }
            break;
        case 'input':
            const player = gameState.players.find(p => p.id === ws.playerId);
            if (player && player.alive) {
                player.input = data.input;
            }
            break;
        case 'startGame':
            if (!gameState.gameRunning) {
                gameState.gameRunning = true;
                gameLoop();
            }
            break;
        case 'reset':
            console.log('Reset message received');
            // Generate new game code
            gameCode = generateGameCode();
            console.log('New game code:', gameCode);
            // Clear all players
            gameState.players = [];
            gameState.powerUps = [];
            gameState.gameRunning = false;
            gameState.currentRound = 1;
            // Broadcast reset to all clients
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    try {
                        client.send(JSON.stringify({ type: 'reset', gameCode, gameState }));
                        console.log('Reset sent to client');
                    } catch (error) {
                        console.error('Error sending reset to client:', error);
                    }
                }
            });
            break;
        case 'nextRound':
            console.log('nextRound received, currentRound:', gameState.currentRound, 'maxRounds:', gameState.maxRounds, 'gameRunning:', gameState.gameRunning);
            if (!gameState.gameRunning && gameState.currentRound < gameState.maxRounds) {
                gameState.currentRound++;
                console.log('Starting round', gameState.currentRound);
                gameState.players.forEach(player => {
                    player.x = Math.random() * (gameState.canvasWidth - 20) + 10;
                    player.y = Math.random() * (gameState.canvasHeight - 20) + 10;
                    player.direction = Math.random() * 2 * Math.PI;
                    player.speed = 2;
                    player.trail = [];
                    player.alive = true;
                    player.input = { left: false, right: false };
                    player.holeTimer = 0;
                });
                gameState.powerUps = [];
                gameState.gameRunning = true;
                broadcastGameState();
                gameLoop();
            } else {
                console.log('nextRound rejected - gameRunning:', gameState.gameRunning, 'round check:', gameState.currentRound < gameState.maxRounds);
            }
            break;
    }
}

function gameLoop() {
    if (!gameState.gameRunning) return;

    // Spawn power-ups occasionally
    if (Math.random() < 0.01) { // 1% chance per frame
        const powerUp = {
            x: Math.random() * gameState.canvasWidth,
            y: Math.random() * gameState.canvasHeight,
            type: Math.random() < 0.5 ? 'speed' : 'clear'
        };
        gameState.powerUps.push(powerUp);
    }

    // Update positions
    gameState.players.forEach(player => {
        if (!player.alive) return;

        if (player.input && player.input.left) {
            player.direction -= 0.08;
        }
        if (player.input && player.input.right) {
            player.direction += 0.08;
        }

        player.x += Math.cos(player.direction) * player.speed;
        player.y += Math.sin(player.direction) * player.speed;

        // Random holes
        if (player.holeTimer > 0) {
            player.holeTimer--;
        } else {
            if (Math.random() < 0.01) { // 1% chance to start a hole per frame
                player.holeTimer = 15; // 15 frames duration for the hole
                player.trail.push(null);
            } else {
                player.trail.push({ x: player.x, y: player.y });
            }
        }

        // Check power-up collision
        gameState.powerUps = gameState.powerUps.filter(powerUp => {
            if (Math.abs(player.x - powerUp.x) < 10 && Math.abs(player.y - powerUp.y) < 10) {
                applyPowerUp(player, powerUp.type);
                return false; // Remove power-up
            }
            return true;
        });

        // Check boundaries
        if (player.x < 0 || player.x > gameState.canvasWidth || player.y < 0 || player.y > gameState.canvasHeight) {
            player.alive = false;
        }

        // Check collisions with trails
        gameState.players.forEach(otherPlayer => {
            const isSelf = player.id === otherPlayer.id;
            const safeDistance = isSelf ? 20 : 0; // Number of recent trail points to ignore if self

            for (let i = 0; i < otherPlayer.trail.length - safeDistance; i++) {
                const point = otherPlayer.trail[i];
                if (!point) continue; // Skip hole markers

                const dx = player.x - point.x;
                const dy = player.y - point.y;
                const distSquared = dx * dx + dy * dy;

                if (distSquared < 25) { // Radius * Radius = 5 * 5 = 25
                    player.alive = false;
                }
            }
        });
    });

    // Check if game over
    const alivePlayers = gameState.players.filter(p => p.alive);
    if (alivePlayers.length <= 1) {
        gameState.gameRunning = false;
        if (alivePlayers.length === 1) {
            alivePlayers[0].score += 10;
        }
    }

    broadcastGameState();

    if (gameState.gameRunning) {
        setTimeout(gameLoop, 1000 / 60); // 60 FPS
    }
}

function applyPowerUp(player, type) {
    switch (type) {
        case 'speed':
            player.speed *= 1.5;
            setTimeout(() => player.speed /= 1.5, 5000); // 5 seconds
            break;
        case 'clear':
            // Clear a portion of trail or something, but for simplicity, just boost score
            player.score += 5;
            break;
    }
}

function broadcastGameState() {
    const state = JSON.stringify({ type: 'state', gameState });
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            try {
                client.send(state);
            } catch (error) {
                console.error('Error sending to client:', error);
            }
        }
    });
}

function getRandomColor() {
    const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
    return colors[Math.floor(Math.random() * colors.length)];
}

console.log('WebSocket server started on port 8080');
