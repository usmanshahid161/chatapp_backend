const express = require('express');
const router = express.Router();
const {
    sendMessage,
    getMessagesByChatId,
    markMessageAsRead,
} = require('../controllers/messagesController');
const { protect } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protect);

// Routes
router.post('/', sendMessage);
router.get('/', getMessagesByChatId);
router.post('/read', markMessageAsRead);

module.exports = router;