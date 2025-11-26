import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../../types/auth.types';
import { Observable, catchError, tap, throwError } from 'rxjs';

interface AuthStoreState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly authService = inject(AuthService);

  private readonly state = signal<AuthStoreState>({
    isAuthenticated: this.authService.isAuthenticated,
    user: this.authService.currentUser,
    loading: false,
    error: null
  });

  readonly isAuthenticated = computed(() => this.state().isAuthenticated);
  readonly currentUser = computed(() => this.state().user);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);

  constructor() {
    effect(() => {
      const authState = this.authService.authStateSignal();
      this.state.set({
        isAuthenticated: authState.isAuthenticated,
        user: authState.user,
        loading: authState.loading,
        error: authState.error
      });
    });
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    this.state.update((state) => ({ ...state, loading: true, error: null }));
    return this.authService.login(credentials).pipe(
      tap(() => this.state.update((state) => ({ ...state, loading: false }))),
      catchError((error) => {
        this.state.update((state) => ({ ...state, loading: false, error: error.message || 'Error al iniciar sesión' }));
        return throwError(() => error);
      })
    );
  }

  register(payload: RegisterRequest): Observable<AuthResponse> {
    this.state.update((state) => ({ ...state, loading: true, error: null }));
    return this.authService.register(payload).pipe(
      tap(() => this.state.update((state) => ({ ...state, loading: false }))),
      catchError((error) => {
        this.state.update((state) => ({ ...state, loading: false, error: error.message || 'Error al registrar' }));
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    this.authService.logout();
  }
}



