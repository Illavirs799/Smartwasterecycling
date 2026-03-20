import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import Message from '../models/Message';
import User from '../models/User';
import Notification from '../models/Notification';
import mongoose from 'mongoose';

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { receiver_id, content } = req.body;
        const sender_id = req.user.id;

        if (!receiver_id || !content) {
            res.status(400).json({ message: 'Receiver and content are required' });
            return;
        }

        const newMessage = new Message({
            sender_id,
            receiver_id,
            content
        });

        await newMessage.save();

        // Create a notification for the receiver
        const sender = await User.findById(sender_id);
        const notification = new Notification({
            recipient_id: receiver_id,
            title: 'New Message',
            message: `You have a new message from ${sender?.name || 'someone'}`,
            type: 'info'
        });
        await notification.save();

        res.status(201).json(newMessage);
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get conversation history between two users
// @route   GET /api/messages/:partnerId
// @access  Private
export const getConversation = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { partnerId } = req.params;
        const userId = req.user.id;

        const messages = await Message.find({
            $or: [
                { sender_id: userId, receiver_id: partnerId },
                { sender_id: partnerId, receiver_id: userId }
            ]
        }).sort({ timestamp: 1 });

        res.status(200).json(messages);
    } catch (error) {
        console.error('Get conversation error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get list of active conversations
// @route   GET /api/messages/conversations
// @access  Private
export const getConversationsList = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);

        // Aggregate to find unique conversation partners and their last message
        const conversations = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { sender_id: userId },
                        { receiver_id: userId }
                    ]
                }
            },
            {
                $sort: { timestamp: -1 }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ["$sender_id", userId] },
                            "$receiver_id",
                            "$sender_id"
                        ]
                    },
                    lastMessage: { $first: "$content" },
                    lastMessageTime: { $first: "$timestamp" },
                    messageId: { $first: "$_id" }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'partner'
                }
            },
            {
                $unwind: '$partner'
            },
            {
                $project: {
                    partnerId: '$_id',
                    partnerName: '$partner.name',
                    lastMessage: 1,
                    lastMessageTime: 1,
                    _id: 0
                }
            },
            {
                $sort: { lastMessageTime: -1 }
            }
        ]);

        res.status(200).json(conversations);
    } catch (error) {
        console.error('Get conversations list error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
