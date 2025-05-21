const Chat = require('../models/Chat');
const User = require('../models/User');
const Message = require('../models/Message');

// Create or fetch One-to-One Chat
const accessChat = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: 'userId parameter not sent with request' });
        }

        // Check if chat exists with current user and requested userId
        let chat = await Chat.find({
            isGroupChat: false,
            $and: [
                { users: { $elemMatch: { $eq: req.user._id } } },
                { users: { $elemMatch: { $eq: userId } } },
            ],
        })
            .populate('users', '-password')
            .populate('latestMessage');

        chat = await User.populate(chat, {
            path: 'latestMessage.sender',
            select: 'name avatar email',
        });

        if (chat.length > 0) {
            res.json(chat[0]);
        } else {
            // Create a new chat
            const chatData = {
                name: 'sender',
                isGroupChat: false,
                users: [req.user._id, userId],
            };

            const createdChat = await Chat.create(chatData);
            const fullChat = await Chat.findById(createdChat._id).populate(
                'users',
                '-password'
            );

            res.status(201).json(fullChat);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all chats for a user
const fetchChats = async (req, res) => {
    try {
        // Find all chats that the user is part of
        let chats = await Chat.find({
            users: { $elemMatch: { $eq: req.user._id } },
        })
            .populate('users', '-password')
            .populate('groupAdmin', '-password')
            .populate('latestMessage')
            .sort({ updatedAt: -1 });

        chats = await User.populate(chats, {
            path: 'latestMessage.sender',
            select: 'name avatar email',
        });

        res.json(chats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create Group Chat
const createGroupChat = async (req, res) => {
    try {
        const { users, name } = req.body;

        if (!users || !name) {
            return res.status(400).json({ message: 'Please fill all the fields' });
        }

        // Parse users if it's a string
        let parsedUsers = users;
        if (typeof users === 'string') {
            parsedUsers = JSON.parse(users);
        }

        // Check if there are at least 2 users
        if (parsedUsers.length < 2) {
            return res.status(400).json({ message: 'More than 2 users are required to form a group chat' });
        }

        // Add current user to group
        parsedUsers.push(req.user._id);

        // Create a new group chat
        const groupChat = await Chat.create({
            name,
            users: parsedUsers,
            isGroupChat: true,
            groupAdmin: req.user._id,
        });

        const fullGroupChat = await Chat.findById(groupChat._id)
            .populate('users', '-password')
            .populate('groupAdmin', '-password');

        res.status(201).json(fullGroupChat);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Rename Group
const renameGroup = async (req, res) => {
    try {
        const { chatId, name } = req.body;

        const updatedChat = await Chat.findByIdAndUpdate(
            chatId,
            { name },
            { new: true }
        )
            .populate('users', '-password')
            .populate('groupAdmin', '-password');

        if (!updatedChat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        res.json(updatedChat);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add user to Group
const addToGroup = async (req, res) => {
    try {
        const { chatId, userId } = req.body;

        const added = await Chat.findByIdAndUpdate(
            chatId,
            {
                $push: { users: userId },
            },
            { new: true }
        )
            .populate('users', '-password')
            .populate('groupAdmin', '-password');

        if (!added) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        res.json(added);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Remove user from Group
const removeFromGroup = async (req, res) => {
    try {
        const { chatId, userId } = req.body;

        const removed = await Chat.findByIdAndUpdate(
            chatId,
            {
                $pull: { users: userId },
            },
            { new: true }
        )
            .populate('users', '-password')
            .populate('groupAdmin', '-password');

        if (!removed) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        res.json(removed);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    accessChat,
    fetchChats,
    createGroupChat,
    renameGroup,
    addToGroup,
    removeFromGroup,
};