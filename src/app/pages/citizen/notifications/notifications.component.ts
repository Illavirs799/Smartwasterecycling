import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { NotificationService, Notification } from '../../../services/notification.service';

@Component({
  selector: 'app-citizen-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit {
  notifications$: Observable<Notification[]> = new Observable();

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notifications$ = this.notificationService.notifications$;
  }

  markAsRead(id: string): void {
    this.notificationService.markAsRead(id);
  }

  getIconForType(type: string): string {
    switch(type) {
      case 'success': return 'check-circle-fill';
      case 'danger': return 'exclamation-circle-fill';
      case 'warning': return 'exclamation-triangle-fill';
      default: return 'info-circle-fill';
    }
  }
}
