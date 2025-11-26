import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { User, LoginRequest, RegisterRequest, AuthResponse, AuthState } from '../../types/auth.types';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = environment.apiUrl;
  private http = inject(HttpClient);
  private router = inject(Router);
  
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'user_data';

  private authState = signal<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    loading: false,
    error: null
  });

  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();

  constructor() {
    this.loadStoredAuth();
  }

  get isAuthenticated(): boolean {
    return this.authState().isAuthenticated;
  }

  get currentUser(): User | null {
    return this.authState().user;
  }

  get token(): string | null {
    return this.authState().token;
  }

  get authStateSignal() {
    return this.authState.asReadonly();
  }

  private loadStoredAuth(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const userData = localStorage.getItem(this.USER_KEY);

    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        this.updateAuthState({
          isAuthenticated: true,
          user,
          token,
          loading: false,
          error: null
        });
        this.userSubject.next(user);
      } catch (error) {
        this.clearAuth();
      }
    }
  }

  private updateAuthState(newState: Partial<AuthState>): void {
    this.authState.update(current => ({ ...current, ...newState }));
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    console.log('🔐 Intentando iniciar sesión con:', credentials);
    console.log('🌐 URL de la API:', `${this.apiUrl}/auth/login`);
    this.updateAuthState({ loading: true, error: null });

    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials).pipe(
      map(response => {
        console.log('✅ Respuesta de inicio de sesión recibida:', response);
        if (response.success && response.user && response.token) {
          this.setAuthData(response.user, response.token);
          this.updateAuthState({ loading: false });
          return response;
        }
        throw new Error(response.message || 'Login failed');
      }),
      catchError(error => {
        console.error('❌ Error al iniciar sesión:', error);
        const errorMessage = error.error?.message || error.message || 'Login failed';
        this.updateAuthState({ loading: false, error: errorMessage });
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    console.log('📝 Intentando registrar con:', userData);
    console.log('🌐 URL de la API:', `${this.apiUrl}/auth/register`);
    this.updateAuthState({ loading: true, error: null });

    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, userData).pipe(
      map(response => {
        console.log('✅ Respuesta de registro recibida:', response);
        if (response.success && response.user && response.token) {
          this.setAuthData(response.user, response.token);
          this.updateAuthState({ loading: false });
          return response;
        }
        throw new Error(response.message || 'Registration failed');
      }),
      catchError(error => {
        console.error('❌ Error al registrar:', error);
        const errorMessage = error.error?.message || error.message || 'Registration failed';
        this.updateAuthState({ loading: false, error: errorMessage });
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  logout(): void {
    this.clearAuth();
    this.router.navigate(['/auth/login']);
  }

  private setAuthData(user: User, token: string): void {
    console.log('Estableciendo datos de autenticación - usuario:', user);
    console.log('Estableciendo datos de autenticación - token:', token);
    
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    
    this.updateAuthState({
      isAuthenticated: true,
      user,
      token,
      loading: false,
      error: null
    });
    
    this.userSubject.next(user);
  }

  // Public helper to update current user fields and persist them
  updateCurrentUser(partial: Partial<User>): void {
    const existing = this.currentUser;
    if (!existing) return;
    const updated: User = { ...existing, ...partial } as User;
    const currentToken = this.token ?? '';
    this.setAuthData(updated, currentToken);
  }

  private clearAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    
    this.updateAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false,
      error: null
    });
    
    this.userSubject.next(null);
  }

  getAuthHeaders(): { [key: string]: string } {
    const token = this.token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated && !!this.token;
  }

  refreshUserData(): Observable<User> {
    return this.http.get<{message: string, user: User}>(`${this.apiUrl}/users/profile`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => response.user),
      tap(user => {
        this.setAuthData(user, this.token!);
      }),
      catchError(error => {
        this.logout();
        return throwError(() => error);
      })
    );
  }
}
