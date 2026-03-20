import express from 'express';
import {
    sendMessage,
    getConversation,
    getConversationsList
} from '../controllers/messageController';
import { authProtect } from '../middleware/authMiddleware';

const router = express.Router();

router.use(authProtect);

// @route   GET /api/messages/conversations
router.get('/conversations', getConversationsList);

// @route   GET /api/messages/:partnerId
router.get('/:partnerId', getConversation);

// @route   POST /api/messages
router.post('/', sendMessage);

export default router;
