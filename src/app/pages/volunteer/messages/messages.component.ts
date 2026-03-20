import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable, of, map } from 'rxjs';
import { AuthService, User } from '../../../services/auth.service';
import { ChatService } from '../../../services/chat.service';
import { Message } from '../../../models/message.model';

export interface ChatConversation {
  partnerId: string;
  partnerName: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
}

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css']
})
export class MessagesComponent implements OnInit {
  currentUser: User | null = null;
  conversations$: Observable<ChatConversation[]> = of([]);

  constructor(
    private authService: AuthService,
    private chatService: ChatService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.conversations$ = this.chatService.messages$.pipe(
          map(msgs => {
            const userMsgs = msgs.filter(m => m.receiverId === user.id || m.senderId === user.id);
            const convMap = new Map<string, ChatConversation>();
            
            userMsgs.forEach(m => {
              const isSender = m.senderId === user.id;
              const partnerId = isSender ? m.receiverId : m.senderId;
              
              const existing = convMap.get(partnerId);
              let partnerName = 'User';
              if (!isSender) partnerName = m.senderName;
              else if (existing && existing.partnerName !== 'User') partnerName = existing.partnerName;

              convMap.set(partnerId, {
                partnerId,
                partnerName,
                lastMessage: m.content,
                lastMessageTime: new Date(m.timestamp),
                unreadCount: (existing?.unreadCount || 0) + (!isSender && !m.isRead ? 1 : 0)
              });
            });
            
            return Array.from(convMap.values()).sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime());
          })
        );
      }
    });
  }
}
