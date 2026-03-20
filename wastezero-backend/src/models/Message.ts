import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMessage extends Document {
  sender_id: Types.ObjectId;
  receiver_id: Types.ObjectId;
  content: string;
  messageType: 'text' | 'image' | 'audio' | 'location' | 'link';
  mediaUrl?: string;
  timestamp: Date;
  isRead: boolean;
}

const MessageSchema: Schema = new Schema({
  sender_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  receiver_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  messageType: { 
    type: String, 
    enum: ['text', 'image', 'audio', 'location', 'link'], 
    default: 'text' 
  },
  mediaUrl: { type: String },
  isRead: { type: Boolean, default: false },
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

export default mongoose.model<IMessage>('Message', MessageSchema);
