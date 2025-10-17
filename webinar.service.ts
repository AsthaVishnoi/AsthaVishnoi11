import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';

export interface WebinarData {
  id: number;
  title: string;
  description: string;
  date: string | null;
  slug: string;
  url: string;
  registrationUrl: string;
  isUpcoming: boolean;
  imageUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class WebinarService {
  private readonly apiUrl = 'https://your-api-domain.com/api/webinar'; // Replace with your actual API URL
  private webinarsSubject = new BehaviorSubject<WebinarData[]>([]);
  public webinars$ = this.webinarsSubject.asObservable();
  
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get upcoming webinars from the backend
   */
  getUpcomingWebinars(): Observable<WebinarData[]> {
    this.loadingSubject.next(true);
    
    return this.http.get<WebinarData[]>(`${this.apiUrl}/upcoming`)
      .pipe(
        retry(2), // Retry failed requests up to 2 times
        map(webinars => {
          // Sort by date
          const sortedWebinars = webinars.sort((a, b) => {
            if (!a.date || !b.date) return 0;
            return new Date(a.date).getTime() - new Date(b.date).getTime();
          });
          
          this.webinarsSubject.next(sortedWebinars);
          this.loadingSubject.next(false);
          return sortedWebinars;
        }),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Refresh webinars (clears cache and gets fresh data)
   */
  refreshWebinars(): Observable<WebinarData[]> {
    this.loadingSubject.next(true);
    
    return this.http.get<WebinarData[]>(`${this.apiUrl}/fresh`)
      .pipe(
        retry(1),
        map(webinars => {
          const sortedWebinars = webinars.sort((a, b) => {
            if (!a.date || !b.date) return 0;
            return new Date(a.date).getTime() - new Date(b.date).getTime();
          });
          
          this.webinarsSubject.next(sortedWebinars);
          this.loadingSubject.next(false);
          return sortedWebinars;
        }),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Clear cache on backend
   */
  clearCache(): Observable<any> {
    return this.http.post(`${this.apiUrl}/refresh`, {})
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string | null): string {
    if (!dateString) return 'Date TBD';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Date TBD';
    }
  }

  /**
   * Check if webinar is happening soon (within 7 days)
   */
  isHappeningSoon(dateString: string | null): boolean {
    if (!dateString) return false;
    
    try {
      const webinarDate = new Date(dateString);
      const today = new Date();
      const daysDifference = Math.ceil((webinarDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
      
      return daysDifference >= 0 && daysDifference <= 7;
    } catch {
      return false;
    }
  }

  /**
   * Get current webinars from the subject
   */
  getCurrentWebinars(): WebinarData[] {
    return this.webinarsSubject.value;
  }

  private handleError(error: HttpErrorResponse) {
    this.loadingSubject.next(false);
    
    let errorMessage = 'An error occurred while fetching webinar data.';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 404:
          errorMessage = 'No webinars found.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        case 0:
          errorMessage = 'Unable to connect to server. Please check your internet connection.';
          break;
        default:
          errorMessage = `Server returned code: ${error.status}, error message is: ${error.message}`;
      }
    }
    
    console.error('WebinarService Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}