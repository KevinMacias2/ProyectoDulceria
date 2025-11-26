import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface UpdateProfileRequest {
  displayName?: string;
  email?: string;
  phone?: string;
  avatar?: string;
}

export interface UpdateProfileResponse {
  message: string;
  user: any;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = environment.apiUrl;
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  /**
   * Actualiza el perfil del usuario autenticado
   */
  updateProfile(profileData: UpdateProfileRequest): Observable<UpdateProfileResponse> {
    const headers = this.authService.getAuthHeaders();
    
    return this.http.put<UpdateProfileResponse>(
      `${this.apiUrl}/users/profile`, 
      profileData,
      { headers }
    ).pipe(
      map(response => {
        // Actualizar el usuario en el AuthService con los datos del servidor
        if (response.user) {
          this.authService.updateCurrentUser({
            name: response.user.displayName || response.user.name,
            email: response.user.email,
            profileImage: response.user.avatar || response.user.profileImage,
            phone: response.user.phone
          });
        }
        return response;
      }),
      catchError(error => {
        console.error('Error updating profile:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtiene el perfil del usuario autenticado
   */
  getProfile(): Observable<any> {
    const headers = this.authService.getAuthHeaders();
    
    return this.http.get<any>(
      `${this.apiUrl}/users/profile`,
      { headers }
    ).pipe(
      catchError(error => {
        console.error('Error getting profile:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Cambia la contraseña del usuario
   */
  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    const headers = this.authService.getAuthHeaders();
    
    return this.http.put<any>(
      `${this.apiUrl}/users/change-password`,
      {
        currentPassword,
        newPassword,
        confirmPassword: newPassword
      },
      { headers }
    ).pipe(
      catchError(error => {
        console.error('Error changing password:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtiene todos los usuarios (solo admin)
   */
  getAllUsers(page: number = 1, limit: number = 10, role?: string, isActive?: boolean): Observable<any> {
    const headers = this.authService.getAuthHeaders();
    let httpParams = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (role) {
      httpParams = httpParams.set('role', role);
    }
    if (isActive !== undefined) {
      httpParams = httpParams.set('isActive', isActive.toString());
    }
    
    return this.http.get<any>(
      `${this.apiUrl}/users/`,
      { headers, params: httpParams }
    ).pipe(
      catchError(error => {
        console.error('Error getting users:', error);
        return throwError(() => error);
      })
    );
  }

  getUserById(userId: string): Observable<any> {
    const headers = this.authService.getAuthHeaders();
    
    return this.http.get<any>(
      `${this.apiUrl}/users/${userId}`,
      { headers }
    ).pipe(
      catchError(error => {
        console.error('Error getting user:', error);
        return throwError(() => error);
      })
    );
  }

  createUser(userData: {
    displayName: string;
    email: string;
    password: string;
    phone?: string;
    role?: string;
    avatar?: string;
  }): Observable<any> {
    // El endpoint de registro no requiere autenticación, pero mantenemos los headers por si acaso
    const headers = this.authService.getAuthHeaders();
    
    // Limpiar datos: eliminar campos vacíos y asegurar que phone tenga el formato correcto
    const cleanData: any = {
      displayName: userData.displayName.trim(),
      email: userData.email.trim(),
      password: userData.password,
      role: userData.role || 'customer'
    };
    
    if (userData.phone && userData.phone.trim()) {
      cleanData.phone = userData.phone.trim();
    }
    
    if (userData.avatar && userData.avatar.trim()) {
      cleanData.avatar = userData.avatar.trim();
    }
    
    return this.http.post<any>(
      `${this.apiUrl}/auth/register`,
      cleanData,
      { headers }
    ).pipe(
      catchError(error => {
        console.error('Error creating user:', error);
        return throwError(() => error);
      })
    );
  }


  updateUser(userId: string, userData: {
    displayName?: string;
    email?: string;
    phone?: string;
    role?: string;
    avatar?: string;
    isActive?: boolean;
  }): Observable<any> {
    const headers = this.authService.getAuthHeaders();
    
    return this.http.put<any>(
      `${this.apiUrl}/users/${userId}`,
      userData,
      { headers }
    ).pipe(
      catchError(error => {
        console.error('Error updating user:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Elimina un usuario (solo admin)
   */
  deleteUser(userId: string): Observable<any> {
    const headers = this.authService.getAuthHeaders();
    
    return this.http.delete<any>(
      `${this.apiUrl}/users/${userId}`,
      { headers }
    ).pipe(
      catchError(error => {
        console.error('Error deleting user:', error);
        return throwError(() => error);
      })
    );
  }
}
