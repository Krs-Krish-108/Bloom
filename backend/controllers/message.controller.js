import mongoose from "mongoose";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

// Send Message Controller
export const sendMessage = async (req, res) => {
    try {
        const senderId = req.id;
        const receiverId = req.params.id;
        const { message, text } = req.body;

        // Receiver ID validation
        if (!receiverId || !mongoose.Types.ObjectId.isValid(receiverId)) {
            return res.status(400).json({
                message: "Invalid receiver ID",
                success: false
            });
        }

        // Prevent self-messaging
        if (senderId === receiverId) {
            return res.status(400).json({
                message: "You cannot message yourself",
                success: false
            });
        }

        const rawContent = message || text;

        // Content validation: non-empty trimmed string
        if (typeof rawContent !== "string" || !rawContent.trim()) {
            return res.status(400).json({
                message: "Message content cannot be empty",
                success: false
            });
        }

        const trimmedContent = rawContent.trim();

        // Check if conversation already exists between sender and receiver
        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] }
        });

        // Establish the conversation if not started yet
        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId]
            });
        }

        // Create new message
        const newMessage = await Message.create({
            senderId,
            receiverId,
            message: trimmedContent
        });

        if (newMessage) {
            conversation.messages.push(newMessage._id);
        }

        // Save conversation with the new message reference
        await conversation.save();

        // Socket.io real-time logic
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
            try {
                const sender = await User.findById(senderId).select("username profilePicture");
                io.to(receiverSocketId).emit("notification", {
                    type: "message",
                    userId: senderId,
                    userDetails: sender,
                    messageText: trimmedContent,
                    message: `sent you a message: "${trimmedContent.length > 50 ? trimmedContent.slice(0, 50) + '...' : trimmedContent}"`,
                    createdAt: new Date().toISOString()
                });
            } catch (notifErr) {
                console.error("Error emitting message notification:", notifErr);
            }
        }

        return res.status(201).json({
            success: true,
            newMessage
        });
    } catch (error) {
        console.error("Error in sendMessage:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Get Messages Controller
export const getMessage = async (req, res) => {
    try {
        const senderId = req.id;
        const receiverId = req.params.id;

        // Receiver ID validation
        if (!receiverId || !mongoose.Types.ObjectId.isValid(receiverId)) {
            return res.status(400).json({
                message: "Invalid receiver ID",
                success: false
            });
        }

        const conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] }
        }).populate("messages");

        if (!conversation) {
            return res.status(200).json({
                success: true,
                messages: []
            });
        }

        return res.status(200).json({
            success: true,
            messages: conversation?.messages
        });
    } catch (error) {
        console.error("Error in getMessage:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Get All Conversations for current user
export const getConversations = async (req, res) => {
    try {
        const userId = req.id;
        if (!userId) {
            return res.status(401).json({
                message: "User not authenticated",
                success: false
            });
        }

        const conversations = await Conversation.find({
            participants: userId
        })
        .sort({ updatedAt: -1 })
        .populate("participants", "username profilePicture bio")
        .populate({
            path: "messages",
            options: { sort: { createdAt: -1 }, limit: 1 }
        });

        const chatList = conversations
            .map(conv => {
                const partner = conv.participants.find(
                    p => p._id && p._id.toString() !== userId.toString()
                );
                return {
                    conversationId: conv._id,
                    user: partner,
                    lastMessage: conv.messages?.[0] || null,
                    updatedAt: conv.updatedAt
                };
            })
            .filter(item => Boolean(item.user));

        return res.status(200).json({
            success: true,
            conversations: chatList
        });
    } catch (error) {
        console.error("Error in getConversations:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

