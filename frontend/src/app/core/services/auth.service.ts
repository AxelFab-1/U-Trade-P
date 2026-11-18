import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuthResponse {
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private tokenKey = 'umarket_token';

  readonly isLoggedIn = signal<boolean>(this.isAuthenticated());
  readonly currentUserEmail = signal<string | null>(this.getCorreoUsuario());
  readonly userRole = signal<string | null>(this.getRolUsuario());
  readonly isAdmin = signal<boolean>(this.getRolUsuario() === 'ADMIN');

  constructor(private http: HttpClient) {}

  login(credentials: { correo: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (response && response.token) {
          this.setToken(response.token);
        }
      })
    );
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    this.isLoggedIn.set(true);
    this.currentUserEmail.set(this.getCorreoUsuario());
    const rol = this.getRolUsuario();
    this.userRole.set(rol);
    this.isAdmin.set(rol === 'ADMIN');
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.isLoggedIn.set(false);
    this.currentUserEmail.set(null);
    this.userRole.set(null);
    this.isAdmin.set(false);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  getCorreoUsuario(): string | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || null;
    } catch {
      return null;
    }
  }

  getRolUsuario(): string | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.rol || null;
    } catch {
      return null;
    }
  }
}
