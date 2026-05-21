import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable, map } from 'rxjs';
import { WasteRequest } from '../../../models/waste-request.model';
import { AuthService, User } from '../../../services/auth.service';
import { WasteRequestService } from '../../../services/waste-request.service';
import { OpportunityService } from '../../../services/opportunity.service';
import { ApplicationService } from '../../../services/application.service';
import { NotificationService } from '../../../services/notification.service';
import { Opportunity } from '../../../models/opportunity.model';
import { Application } from '../../../models/application.model';

@Component({
  selector: 'app-opportunities',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './opportunities.component.html',
  styleUrls: ['./opportunities.component.css']
})
export class OpportunitiesComponent implements OnInit {
  currentUser: User | null = null;
  activeTab: 'pickups' | 'projects' = 'pickups';
  pickupOpportunities$: Observable<WasteRequest[]> = new Observable();
  ngoOpportunities$: Observable<Opportunity[]> = new Observable();
  volunteerApplications: Application[] = [];

  constructor(
    private authService: AuthService,
    private wasteService: WasteRequestService,
    private opportunityService: OpportunityService,
    private applicationService: ApplicationService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadVolunteerApplications();
      }
    });

    this.pickupOpportunities$ = this.wasteService.requests$.pipe(
      map(reqs => reqs.filter(r => r.status === 'Pending'))
    );

    this.ngoOpportunities$ = this.opportunityService.getOpportunities().pipe(
      map(res => {
        const opps = res.opportunities || res;
        return opps.filter((o: any) => o.status === 'open');
      })
    );
  }

  loadVolunteerApplications() {
    this.applicationService.getVolunteerApplications().subscribe({
      next: (apps) => this.volunteerApplications = apps,
      error: (err) => console.error('Failed to load volunteer applications:', err)
    });
  }

  hasApplied(oppId: string | undefined): boolean {
    if (!oppId) return false;
    return this.volunteerApplications.some(app => {
      const oid = app.opportunity_id?._id || app.opportunity_id;
      return oid === oppId;
    });
  }



  acceptPickup(request: WasteRequest) {
    if (!this.currentUser) return;
    
    this.wasteService.updateRequest(request.id, {
      status: 'Scheduled',
      volunteerId: this.currentUser.id,
      volunteerName: this.currentUser.name,
      scheduledDate: new Date()
    }).subscribe({
      next: () => this.notificationService.addNotification('Success', 'Pickup accepted successfully! Check "My Pickups".', 'success'),
      error: (err: any) => this.notificationService.addNotification('Failed', 'Failed to accept pickup: ' + (err.error?.message || err.message), 'danger')
    });
  }

  applyForProject(project: Opportunity): void {
    if (!this.currentUser) return;

    this.applicationService.applyForOpportunity(project._id || project.id!).subscribe({
      next: () => {
        this.notificationService.addNotification('Applied', `Successfully applied for: ${project.title}`, 'success');
        this.loadVolunteerApplications();
      },
      error: (err) => this.notificationService.addNotification('Failed', 'Application failed: ' + (err.error?.message || err.message), 'danger')
    });
  }


  setTab(tab: 'pickups' | 'projects'): void {
    this.activeTab = tab;
  }


  getCategoryIcon(cat: string): string {
    const icons: Record<string, string> = {
      'Plastic': '🧴', 'Organic': '🌿', 'E-Waste': '💻', 'Metal': '🔩',
      'Glass': '🥃', 'Paper': '📄', 'Hazardous': '☢️', 'Other': '📦'
    };
    return icons[cat] || '📦';
  }
}
