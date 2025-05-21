const mongoose = require('mongoose');

const chatSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        messagesLength: {
            type: Number,
            required: true,
            default: 0
        },
        isGroupChat: {
            type: Boolean,
            default: false,
        },
        unreadCount: {
            type: Number,
            default: 0,
        },
        users: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        latestMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message',
        },
        groupAdmin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    { timestamps: true }
);

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;