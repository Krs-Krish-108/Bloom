import mongoose from "mongoose";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
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
