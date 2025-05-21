const Message = require('../models/Message');
const socket = require('../socket/socketHandler');
const Chat = require("../models/Chat");

// Send a message
const sendMessage = async (req, res) => {
    try {
        const { content, chatId } = req.body;

        if (!content || !chatId) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Create the new message
        const newMessage = await Message.create({
            sender: req.user._id,
            content,
            chat: chatId,
        });


        // Fetch the message again with population
        const populatedMessage = await Message.findById(newMessage._id)
            .populate('sender', 'name email')
            .populate('chat');

        res.status(201).json(populatedMessage);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get messages by chatId
const getMessagesByChatId = async (req, res) => {
    try {
        const chatId = req.query.id;
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;

        if (!chatId) return res.status(400).json({ error: "Chat ID is required" });

        // 🟢 2. Fetch paginated messages
        const messages = await Message.find({ chat: chatId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('sender', 'name email')
            .populate('chat')
            .populate('readBy', 'name email');

            await Chat.findByIdAndUpdate(chatId, { unreadCount:0 })

        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



// Mark message as read
const markMessageAsRead = async (req, res) => {
    try {

        const message = req.query.messageId ? await Message.findByIdAndUpdate(
            req.query.messageId,
            { $addToSet: { readBy: req.user._id } }, // avoids duplicates
            { new: true }
        ) : {}

        res.status(200).json(message);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    sendMessage,
    getMessagesByChatId,
    markMessageAsRead,
};
