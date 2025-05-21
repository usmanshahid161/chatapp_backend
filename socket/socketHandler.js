const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');

module.exports = (io) => {
    // Store active users
    const activeUsers = new Map();

    io.on('connection', (socket) => {
        console.log(`User Connected: ${socket.id}`);

        // User joins with their user ID
        socket.on('setup', (userData) => {
            socket.join(userData._id);
            socket.emit('connected');

            // Update user's online status in DB
            updateUserStatus(userData._id, true);

            // Add user to active users map
            activeUsers.set(userData._id, socket.id);

            // Broadcast updated online users list
            io.emit('online-users', Array.from(activeUsers.keys()));
        });

        // User joins a chat room
        socket.on('join-chat', (chatId) => {
            socket.join(chatId)
            console.log(`User joined chat: ${chatId}`);
        });

        socket.on('read-all', async ({chatId, userData}) => {
            // 🟡 1. Mark all unseen messages as read for this user
            await Message.updateMany(
                { chat: chatId, readBy: { $ne: userData } },
                { $addToSet: { readBy: userData } }
            )
            io.emit('read-all', "");
        })

        socket.on("message-read", async ({ messageId, chatId, userId }) => {
            await Message.findByIdAndUpdate(messageId, {
                $addToSet: { readBy: userId }
            });

            await Chat.findByIdAndUpdate(chatId, {
                unreadCount: 0
            });

            // Emit update back to sender
            io.to(chatId).emit("message-read-update", { messageId, userId });
        });

        // User sends a message
        socket.on('new-message', async (messageData) => {
            const { sender, content, chatId } = messageData;

            try {
                // Create message in database
                let message = await Message.create({
                    sender,
                    content,
                    chat: chatId,
                });

                await Chat.findByIdAndUpdate(chatId, {
                    $inc: {
                        messagesLength: 1,
                        unreadCount: 1
                    },
                });

                // Populate message with sender info
                message = await message.populate('sender', 'name avatar');
                message = await message.populate('chat');
                message = await User.populate(message, {
                    path: 'chat.users',
                    select: 'name avatar email online',
                });

                // Update latest message in the chat
                await Chat.findByIdAndUpdate(chatId, { latestMessage: message });

                // Send message to all users in the chat room
                io.to(chatId).emit('message-received', message);
            } catch (error) {
                console.error('Error handling new message:', error);
            }
        });

        // User is typing
        socket.on('typing', (chatId) => {
            socket.to(chatId).emit('typing', chatId);
        });

        // User stopped typing
        socket.on('stop-typing', (chatId) => {
            socket.to(chatId).emit('stop-typing');
        });

        // User disconnects
        socket.on('logout', () => {
            console.log(`User Disconnected: ${socket.id}`);

            // Find user ID by socket ID and update status
            let userId = null;
            for (const [key, value] of activeUsers.entries()) {
                if (value === socket.id) {
                    userId = key;
                    break;
                }
            }

            if (userId) {
                // Update user's online status in DB
                updateUserStatus(userId, false);

                // Remove user from active users map
                activeUsers.delete(userId);

                // Broadcast updated online users list
                io.emit('online-users', Array.from(activeUsers.keys()));
            }
        });
    });

    // Helper function to update user's online status
    const updateUserStatus = async (userId, status) => {
        try {
            await User.findByIdAndUpdate(userId, { online: status });
        } catch (error) {
            console.error(`Error updating user status: ${error.message}`);
        }
    };
};