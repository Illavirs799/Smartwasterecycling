import Notification from '../models/Notification';
import { emitToUser } from './socketService';

export const createNotification = async (
    recipientId: string,
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info'
): Promise<any> => {
    try {
        const notification = new Notification({
            recipient_id: recipientId,
            title,
            message,
            type
        });

        const savedNotification = await notification.save();

        // Emit real-time notification to the user
        emitToUser(recipientId, 'new_notification', savedNotification);

        return savedNotification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};
