import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthResponse, LoginRequest, SignupRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = 'http://localhost:8080/api/auth';

  constructor(private http: HttpClient) {}

  login(req: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api}/login`, req);
  }

  signup(req: SignupRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api}/signup`, req);
  }

  saveSession(res: AuthResponse): void {
    sessionStorage.setItem('userId',   String(res.userId));
    sessionStorage.setItem('username', res.username ?? '');
    sessionStorage.setItem('fullName', res.fullName ?? res.username ?? '');
  }

  getSession() {
    return {
      userId:   sessionStorage.getItem('userId'),
      username: sessionStorage.getItem('username'),
      fullName: sessionStorage.getItem('fullName') ?? 'OPERATOR',
    };
  }

  isLoggedIn(): boolean {
    return !!sessionStorage.getItem('userId');
  }

  logout(): void {
    sessionStorage.clear();
  }
}
