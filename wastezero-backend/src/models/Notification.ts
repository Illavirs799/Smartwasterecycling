import mongoose, { Schema, Document, Types } from 'mongoose';

export interface INotification extends Document {
  recipient_id: Types.ObjectId;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  timestamp: Date;
}

const NotificationSchema: Schema = new Schema({
  recipient_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['info', 'success', 'warning', 'error'], 
    default: 'info' 
  },
  is_read: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
}, {
  toJSON: {
    transform: (doc, ret: any) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

export default mongoose.model<INotification>('Notification', NotificationSchema);
