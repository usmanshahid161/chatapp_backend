const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    getUserProfile,
    getUsers,
    updateUserStatus,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.get('/', protect, getUsers);
router.put('/status', protect, updateUserStatus);

module.exports = router;