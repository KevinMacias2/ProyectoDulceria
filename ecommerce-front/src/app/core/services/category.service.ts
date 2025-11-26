import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category } from '../models/category.model';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly apiUrl = environment.apiUrl;
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  getAllCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categories`);
  }

  getCategoryById(id: string): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/categories/${id}`);
  }

  createCategory(category: Category): Observable<Category> {
    const headers = this.authService.getAuthHeaders();
    return this.http.post<Category>(`${this.apiUrl}/categories`, category, { headers });
  }

  updateCategory(id: string, category: Category): Observable<Category> {
    const headers = this.authService.getAuthHeaders();
    return this.http.put<Category>(`${this.apiUrl}/categories/${id}`, category, { headers });
  }

  deleteCategory(id: string): Observable<any> {
    const headers = this.authService.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/categories/${id}`, { headers });
  }
}
