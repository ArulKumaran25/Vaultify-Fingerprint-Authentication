import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FingerprintService {
  private readonly baseUrl = 'http://localhost:5000';  // Replace with your Flask server URL

  constructor(private readonly http: HttpClient) {}

  registerFingerprint(location: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, { location });
  }

  authenticateFingerprint(email : string): Observable<any> {
    return this.http.post(`${this.baseUrl}/authenticate`, {email});
  }
}
