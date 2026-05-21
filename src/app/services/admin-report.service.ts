import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';
import { OpportunityService } from './opportunity.service';
import { environment } from '../../environments/environment';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminReportService {
  private apiUrl = `${environment.apiUrl}/admin`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private opportunityService: OpportunityService
  ) { }

  private getHeaders(): HttpHeaders {
    let token = '';
    if (typeof localStorage !== 'undefined') {
      token = localStorage.getItem('wastezero_token') || '';
    }
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getEngagementAnalytics(range: string = '1week'): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/analytics?range=${range}`, { headers: this.getHeaders() });
  }

  getUsersActivity(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/users`, { headers: this.getHeaders() });
  }

  suspendUser(userId: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/users/${userId}/suspend`, {}, { headers: this.getHeaders() });
  }

  broadcastSystemAlert(message: string, targetRole: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/alerts`, { message, targetRole }, { headers: this.getHeaders() });
  }

  getAdminLogs(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/logs`, { headers: this.getHeaders() });
  }


  getUserStats() {
    const users = this.authService.getAllUsers();
    return {
      total: users.length,
      volunteers: users.filter((u: any) => u.role === 'Volunteer').length,
      regularUsers: users.filter((u: any) => u.role === 'User').length,
      admins: users.filter((u: any) => u.role === 'Admin').length,
      suspended: users.filter((u: any) => u.suspended).length
    };
  }

  getOpportunityStats() {
    return this.opportunityService.getOpportunities().pipe(
      map((res: any) => {
        const opportunities = res.opportunities || res;

        const statsByType: { [key: string]: number } = {};

        opportunities.forEach((opp: any) => {
          statsByType[opp.wasteType || 'Other'] = (statsByType[opp.wasteType || 'Other'] || 0) + 1;
        });

        return {
          total: opportunities.length,
          byType: statsByType,
          recent: opportunities.filter((o: any) => {
            if (!o.createdAt) return false;
            const diff = new Date().getTime() - new Date(o.createdAt).getTime();
            return diff < (7 * 24 * 60 * 60 * 1000); // Last 7 days
          }).length
        };
      })
    );
  }

  exportUsersToCSV(): void {
    const users = this.authService.getAllUsers();
    const headers = ['ID', 'Name', 'Username', 'Email', 'Role', 'Location', 'Status'];
    const rows = users.map((u: any) => [
      u.id,
      u.name,
      u.username,
      u.email,
      u.role,
      u.location || '',
      u.suspended ? 'Suspended' : 'Active'
    ]);


    this.downloadCSV(headers, rows, 'wastezero_users_report.csv');
  }

  exportOpportunitiesToCSV(): void {
    this.opportunityService.getOpportunities().subscribe((res: any) => {
      const opportunities = res.opportunities || res;

      const headers = ['ID', 'Title', 'Waste Type', 'Location', 'Duration', 'Organization', 'Posted Date'];
      const rows = opportunities.map((o: any) => [
        o._id || o.id,
        o.title,
        o.wasteType || 'Other',
        o.location || '',
        o.duration || '',
        o.organizationName || '',
        o.createdAt ? new Date(o.createdAt).toLocaleDateString() : ''
      ]);

      this.downloadCSV(headers, rows, 'wastezero_opportunities_report.csv');
    });
  }

  private downloadCSV(headers: string[], rows: any[][], filename: string): void {
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}
