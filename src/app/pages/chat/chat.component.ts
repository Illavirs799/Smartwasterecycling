import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, NgIf, NgFor, NgClass, DatePipe, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ChatService } from '../../services/chat.service';
import { AuthService, User } from '../../services/auth.service';
import { Message } from '../../models/message.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NgIf, NgFor, NgClass, DatePipe],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {
  messages: Message[] = [];
  newMessage = '';
  receiverId: string | null = null;
  receiverName = 'Organization';
  currentUser: User | null = null;
  showOptions = false;
  private chatSub: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private chatService: ChatService,
    private authService: AuthService,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    
    this.route.paramMap.subscribe(params => {
      this.receiverId = params.get('userId');
      const name = params.get('name');
      if (name) this.receiverName = name;

      if (this.currentUser && this.receiverId) {
        // Mark as read when opening chat
        this.chatService.markMessagesAsRead(this.receiverId);

        if (this.chatSub) this.chatSub.unsubscribe();
        
        // Subscribe to real-time messages from the service
        this.chatSub = this.chatService.messages$.subscribe(msgs => {
          this.messages = msgs;
          this.scrollToBottom();
        });

        // Trigger initial load of history
        this.chatService.getChatMessages(this.currentUser.id, this.receiverId).subscribe();
      }
    });
  }

  goBack(): void {
    this.location.back();
  }

  ngOnDestroy(): void {
    if (this.chatSub) this.chatSub.unsubscribe();
  }

  onSendMessage(): void {
    if (this.newMessage.trim() && this.receiverId) {
      this.chatService.sendMessage(this.receiverId, this.newMessage, 'text');
      this.newMessage = '';
      this.showOptions = false;
    }
  }

  toggleOptions(): void {
    this.showOptions = !this.showOptions;
  }

  handleFileUpload(event: any, type: 'image' | 'audio'): void {
    const file = event.target.files[0];
    if (file && this.receiverId) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const mediaUrl = e.target.result;
        const displayName = type === 'image' ? 'Photo' : 'Audio';
        this.chatService.sendMessage(this.receiverId!, `Shared a ${displayName}`, type, mediaUrl);
        this.showOptions = false;
      };
      reader.readAsDataURL(file);
    }
  }

  onSharePhoto(): void {
    // Obsolete: replaced by handleFileUpload for direct device/camera access
  }

  onShareAudio(): void {
    const audioUrl = prompt('Enter audio URL (for demo):', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
    if (audioUrl && this.receiverId) {
      this.chatService.sendMessage(this.receiverId, 'Shared an audio message', 'audio', audioUrl);
      this.showOptions = false;
    }
  }

  onShareLiveLink(): void {
    const locationName = prompt('Enter location/link label:', 'Current Location');
    const mapLink = prompt('Enter location/map URL:', 'https://www.google.com/maps?q=12.9716,77.5946');
    if (mapLink && this.receiverId) {
      this.chatService.sendMessage(this.receiverId, locationName || 'Shared a location', 'location', mapLink);
      this.showOptions = false;
    }
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const chatContainer = document.querySelector('.chat-messages');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  }
}
