import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { Message } from '../models/message.model';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private socket: Socket | null = null;
  private messagesSubject = new BehaviorSubject<Message[]>([]);
  public messages$ = this.messagesSubject.asObservable();
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();
  private apiUrl = `${environment.apiUrl}/messages`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    this.initSocket();
    this.updateUnreadCountFromConversations();
  }

  private updateUnreadCountFromConversations(): void {
    const user = this.authService.currentUserValue;
    if (!user) return;

    this.getConversations().subscribe({
      next: (conversations) => {
        const totalUnread = conversations.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0);
        this.unreadCountSubject.next(totalUnread);
      },
      error: (err) => console.error('Error fetching unread counts:', err)
    });
  }

  private initSocket(): void {
    const user = this.authService.currentUserValue;
    if (!user) return;

    this.socket = io(environment.socketUrl);

    this.socket.on('connect', () => {
      console.log('Connected to socket server');
      this.socket?.emit('join', user.id);
    });

    this.socket.on('new_message', (msg: any) => {
      console.log('New message received via socket:', msg);
      const formattedMsg = this.formatMessage(msg);
      const currentMessages = this.messagesSubject.value;
      
      // Check if message is already in list (for sender)
      if (!currentMessages.some(m => m.id === formattedMsg.id)) {
        this.messagesSubject.next([...currentMessages, formattedMsg]);
        
        // Notify if it's a message for the user
        if (formattedMsg.receiverId === user.id) {
            this.unreadCountSubject.next(this.unreadCountSubject.value + 1);
            this.notificationService.addNotification(
                'New Message',
                `Real-time message from ${formattedMsg.senderId}`,
                'info'
            );
        }
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
    });
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('wastezero_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  private formatMessage(msg: any): Message {
    return {
      id: msg._id || msg.id,
      senderId: msg.sender_id || msg.senderId,
      senderName: msg.senderName || 'User',
      receiverId: msg.receiver_id || msg.receiverId,
      content: msg.content,
      messageType: msg.messageType || 'text',
      mediaUrl: msg.mediaUrl,
      timestamp: new Date(msg.timestamp),
      isAdmin: msg.isAdmin || false,
      isRead: msg.isRead || false
    };
  }


  getChatMessages(currentUserId: string, partnerId: string): Observable<Message[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${partnerId}`, { headers: this.getHeaders() }).pipe(
        map(msgs => msgs.map(m => this.formatMessage(m))),
        tap(msgs => this.messagesSubject.next(msgs))
    );
  }

  getConversations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/list`, { headers: this.getHeaders() });
  }

  markMessagesAsRead(senderId: string): void {
    // Optional: Implement mark as read API route if needed
  }

  sendMessage(receiverId: string, content: string, messageType: string = 'text', mediaUrl?: string): void {
    const body = { receiver_id: receiverId, content, messageType, mediaUrl };
    this.http.post<any>(this.apiUrl, body, { headers: this.getHeaders() }).subscribe({
        next: (msg) => {
            const formatted = this.formatMessage(msg);
            const currentMessages = this.messagesSubject.value;
            this.messagesSubject.next([...currentMessages, formatted]);
        },
        error: (err) => {
            console.error('Error sending message:', err);
        }
    });
  }
}
