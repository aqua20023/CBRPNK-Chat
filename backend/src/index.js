require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');

const app = require('./app');
const connectDB = require('./config/db');
const { initFirebase } = require('./config/firebase');
const registerChatSocket = require('./sockets/chat.socket');

const port = Number(process.env.PORT || 5000);
const server = http.createServer(app);

const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const io = new Server(server, {
  cors: {
    origin(origin, callback) {
      if (!origin || !allowedOrigins.length || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Socket origin not allowed by CORS'));
    },
    credentials: true,
  },
});

app.set('io', io);
registerChatSocket(io);

async function startServer() {
  try {
    await connectDB();
    initFirebase();

    server.listen(port, () => {
      console.log(`CBRPNK backend listening on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start backend:', error.message);
    process.exit(1);
  }
}

startServer();
