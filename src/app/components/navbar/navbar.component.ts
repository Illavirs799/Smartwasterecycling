import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../../services/auth.service';
import { Router } from '@angular/router';
import { NotificationService, Notification } from '../../services/notification.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  currentUser: User | null = null;
  unreadNotifications$: Observable<number>;
  notifications$: Observable<Notification[]>;

  constructor(
    private authService: AuthService, 
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.unreadNotifications$ = this.notificationService.getUnreadCount();
    this.notifications$ = this.notificationService.notifications$;
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  markAsRead(id: string): void {
    this.notificationService.markAsRead(id);
  }

  getDashboardLink(): string {
    if (!this.currentUser) return '/';
    if (this.currentUser.role === 'Admin') return '/admin';
    if (this.currentUser.role === 'Volunteer') return '/volunteer/dashboard';
    if (this.currentUser.role === 'Citizen' || this.currentUser.role === 'User') return '/citizen/dashboard';
    return '/dashboard';
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
