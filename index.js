const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const userRoutes = require('./routes/user');
const chatRoutes = require('./routes/chat');
const messagesRoutes = require('./routes/messages');
const { createServer } = require('http');
const { Server: Index } = require('socket.io');

// Load environment variables
dotenv.config();

// Connect to database
// connectDB();

// Initialize Express
const app = express();
const httpServer = createServer(app);

// Middleware
// app.use(cors());
app.use(express.json());  // To parse JSON request body

app.get('/webhook', (req, res) => {
    const VERIFY_TOKEN = '123123123'; // you defined this in Meta UI

    console.log("567891", req.query)

    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('Webhook verified');
        res.status(200).send(challenge); // Must return the challenge
    } else {
        res.sendStatus(403); // Meta expects 403 on failure
    }
});

app.get('/', (req, res) => {
    res.send('Hello World!');
})

// Routes
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messagesRoutes);

// Basic route
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Initialize Socket.io
const io = new Index(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});


// Setup Socket.io handlers
require('./socket/socketHandler')(io);

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});