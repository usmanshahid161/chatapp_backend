const express = require('express');
const router = express.Router();
const {
    accessChat,
    fetchChats,
    createGroupChat,
    renameGroup,
    addToGroup,
    removeFromGroup,
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protect);

// Routes
router.post('/', accessChat);
router.get('/', fetchChats);
router.post('/group', createGroupChat);
router.put('/rename', renameGroup);
router.put('/groupadd', addToGroup);
router.put('/groupremove', removeFromGroup);

module.exports = router;