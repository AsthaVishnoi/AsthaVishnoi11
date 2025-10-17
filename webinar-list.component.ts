import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { WebinarService, WebinarData } from './webinar.service';

@Component({
  selector: 'app-webinar-list',
  templateUrl: './webinar-list.component.html',
  styleUrls: ['./webinar-list.component.css']
})
export class WebinarListComponent implements OnInit, OnDestroy {
  webinars: WebinarData[] = [];
  loading = false;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(private webinarService: WebinarService) {}

  ngOnInit(): void {
    this.loadWebinars();
    
    // Subscribe to loading state
    this.webinarService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => this.loading = loading);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadWebinars(): void {
    this.error = null;
    
    this.webinarService.getUpcomingWebinars()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (webinars) => {
          this.webinars = webinars;
          this.error = null;
        },
        error: (error) => {
          this.error = error.message;
          this.webinars = [];
        }
      });
  }

  refreshWebinars(): void {
    this.error = null;
    
    this.webinarService.refreshWebinars()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (webinars) => {
          this.webinars = webinars;
          this.error = null;
        },
        error: (error) => {
          this.error = error.message;
        }
      });
  }

  formatDate(dateString: string | null): string {
    return this.webinarService.formatDate(dateString);
  }

  isHappeningSoon(dateString: string | null): boolean {
    return this.webinarService.isHappeningSoon(dateString);
  }

  openRegistration(url: string): void {
    if (url) {
      window.open(url, '_blank');
    }
  }

  trackByWebinarId(index: number, webinar: WebinarData): number {
    return webinar.id;
  }
}