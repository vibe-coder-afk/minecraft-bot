import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { BotManager } from './bot-manager.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// Configure CORS for local development port 5173
const corsOptions = {
  origin: '*', // Allow all origins for local control
  methods: ['GET', 'POST'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Socket.io initialization
const io = new Server(httpServer, {
  cors: corsOptions
});

const botManager = new BotManager(io);

// Express Routes
app.post('/api/connect', (req, res) => {
  const { host, port, username, version, auth, owner } = req.body;
  if (!host || !username) {
    return res.status(400).json({ error: 'Host and username are required.' });
  }

  botManager.connect({
    host,
    port: port || 25565,
    username,
    version: version || '',
    auth: auth || 'offline',
    owner: owner || ''
  });

  res.json({ success: true, message: 'Connection sequence started.' });
});

app.post('/api/disconnect', (req, res) => {
  botManager.disconnect();
  res.json({ success: true, message: 'Bot disconnected.' });
});

app.post('/api/chat', (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }
  botManager.sendChat(message);
  res.json({ success: true });
});

app.post('/api/loop/start', (req, res) => {
  const { steps } = req.body;
  if (!steps || !Array.isArray(steps)) {
    return res.status(400).json({ error: 'Steps array is required.' });
  }
  botManager.startCustomLoop(steps);
  res.json({ success: true, message: 'Custom routine started.' });
});

app.post('/api/loop/stop', (req, res) => {
  botManager.stopCustomLoop();
  res.json({ success: true, message: 'Custom routine stopped.' });
});

app.get('/api/status', (req, res) => {
  res.json({
    status: botManager.status,
    isLoopRunning: botManager.isLoopRunning,
    currentLoopIndex: botManager.currentLoopIndex,
    config: botManager.config,
    reconnectAttempts: botManager.reconnectAttempts
  });
});

app.get('/api/logs', (req, res) => {
  res.json({
    consoleLogs: botManager.consoleLogs,
    chatLogs: botManager.chatLogs
  });
});

// Serve frontend assets in production
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  // If dist/index.html doesn't exist, provide a message (useful in local dev)
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('Vite Dev Server is running. Please open http://localhost:5173');
    }
  });
});

// Socket.io Connection Logic
io.on('connection', (socket) => {
  console.log(`Web Client connected: ${socket.id}`);
  
  // Send initial data to client
  socket.emit('initial_data', {
    status: botManager.status,
    config: botManager.config,
    consoleLogs: botManager.consoleLogs,
    chatLogs: botManager.chatLogs,
    isLoopRunning: botManager.isLoopRunning,
    currentLoopIndex: botManager.currentLoopIndex,
    loopSteps: botManager.loopSteps,
    bot: botManager.bot && botManager.status === 'spawned' ? {
      username: botManager.bot.username,
      health: botManager.bot.health,
      food: botManager.bot.food,
      position: botManager.bot.entity?.position || { x: 0, y: 0, z: 0 },
      players: Object.keys(botManager.bot.players).map(name => ({
        name,
        ping: botManager.bot.players[name].ping
      }))
    } : null
  });

  socket.on('disconnect', () => {
    console.log(`Web Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`Backend Server running on port ${PORT}`);
  console.log(`========================================`);
});
