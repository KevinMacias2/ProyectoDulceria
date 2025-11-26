import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap, throwError } from 'rxjs';
import { Product } from '../models/product.model';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

interface ProductResponse {
  products: any[];
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly apiUrl = environment.apiUrl;
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private readonly productsSubject = new BehaviorSubject<Product[]>([]);
  readonly products$ = this.productsSubject.asObservable();

  getAllProducts(limit = 100): Observable<Product[]> {
    return this.http.get<ProductResponse>(`${this.apiUrl}/products?limit=${limit}`).pipe(
      map((res) => {
        if (!Array.isArray(res?.products)) {
          throw new Error('Respuesta inválida del backend');
        }
        return res.products.map((p) => this.normalizeProduct(p));
      }),
      tap((products) => this.productsSubject.next(products))
    );
  }

  getProductById(id: string | number): Observable<Product> {
    const productId = id.toString();
    return this.http.get<Product>(`${this.apiUrl}/products/${productId}`).pipe(
      map((product) => this.normalizeProduct(product))
    );
  }

  deleteProductById(id: string | number): Observable<void> {
    const productId = id.toString();
    return this.http.delete<void>(`${this.apiUrl}/products/${productId}`).pipe(
      tap(() => {
        const filtered = this.productsSubject.value.filter((product) => {
          const currentId = product._id ?? product.id?.toString();
          return currentId !== productId;
        });
        this.productsSubject.next(filtered);
      })
    );
  }

  updateProduct(updated: Product): Observable<Product> {
    const productId = updated._id ?? updated.id?.toString();
    if (!productId) {
      return throwError(() => new Error('ID de producto requerido'));
    }

    const headers = this.authService.getAuthHeaders();
    return this.http.put<Product>(`${this.apiUrl}/products/${productId}`, updated, { headers }).pipe(
      tap((product) => {
        const cloned = this.productsSubject.value.map((p) => ({ ...p }));
        const idx = cloned.findIndex((p) => (p._id ?? p.id?.toString()) === productId);
        if (idx > -1) {
          cloned[idx] = this.normalizeProduct(product);
          this.productsSubject.next(cloned);
        }
      })
    );
  }

  addProduct(newProduct: Product): Observable<Product> {
    const headers = this.authService.getAuthHeaders();
    return this.http.post<Product>(`${this.apiUrl}/products`, newProduct, { headers }).pipe(
      map((product) => this.normalizeProduct(product)),
      tap((product) => {
        this.productsSubject.next([product, ...this.productsSubject.value]);
      })
    );
  }

  private normalizeProduct(p: any): Product {
    return {
      _id: p._id ?? p.id?.toString(),
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      imageUrl: Array.isArray(p.imagesUrl) && p.imagesUrl.length ? p.imagesUrl[0] : p.imageUrl,
      imagesUrl: p.imagesUrl,
      category: p.category,
      stock: p.stock
    };
  }
}