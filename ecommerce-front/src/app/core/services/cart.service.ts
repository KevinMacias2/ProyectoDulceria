import { Injectable, inject, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ComponentStore } from '@ngrx/component-store';
import { Observable, of, switchMap } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CartItem } from '../models/cart-item';
import { Product } from '../models/product.model';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

interface CartState {
  items: CartItem[];
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class CartService extends ComponentStore<CartState> {
  private readonly apiUrl = environment.apiUrl;
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  constructor() {
    super({
      items: [],
      loading: false,
      error: null
    });

    effect(() => {
      const authState = this.authService.authStateSignal();
      if (authState.isAuthenticated) {
        this.loadCartFromBackend();
      } else {
        this.patchState({ items: [], loading: false, error: null });
      }
    });
  }

  readonly cart$ = this.select((state) => state.items);
  readonly total$ = this.select(this.cart$, (items) =>
    items.reduce((total, item) => total + (item.product.price || 0) * item.quantity, 0)
  );
  readonly count$ = this.select(this.cart$, (items) =>
    items.reduce((count, item) => count + item.quantity, 0)
  );
  readonly loading$ = this.select((state) => state.loading);

  getCart(): Observable<CartItem[]> {
    return this.cart$;
  }

  loadCartFromBackend(): void {
    if (!this.authService.isAuthenticated) {
      this.patchState({ items: [], loading: false, error: null });
      return;
    }

    const headers = this.authService.getAuthHeaders();
    const userId = this.authService.currentUser?._id || this.authService.currentUser?.id;
    if (!userId) {
      this.patchState({ error: 'Usuario inválido' });
      return;
    }

    this.patchState({ loading: true, error: null });
    this.http.get<any>(`${this.apiUrl}/cart/user/${userId}`, { headers }).subscribe({
      next: (cartData) => {
        const items = this.normalizeCartItems(cartData?.products ?? []);
        this.patchState({ items, loading: false });
      },
      error: (error) => {
        console.error('Error al cargar el carrito', error);
        this.patchState({
          items: [],
          loading: false,
          error: error.error?.message || 'No se pudo cargar el carrito'
        });
      }
    });
  }

  addToCart(product: Product, quantity: number = 1): void {
    if (!this.authService.isAuthenticated) {
      throw new Error('Debes iniciar sesión para agregar productos al carrito');
    }

    const productId = product._id ?? product.id?.toString();
    if (!productId) {
      throw new Error('Producto inválido');
    }

    if (!this.validateStock(productId, quantity, product.stock)) {
      throw new Error('No hay stock suficiente para este producto');
    }

    const headers = this.authService.getAuthHeaders();
    const payload = { productId, quantity };

    this.patchState({ loading: true, error: null });
    this.http.post<any>(`${this.apiUrl}/cart/add-product`, payload, { headers }).subscribe({
      next: (response) => {
        const items = this.normalizeCartItems(response?.products ?? []);
        this.patchState({ items, loading: false });
      },
      error: (error) => this.handleRequestError(error)
    });
  }

  updateQuantity(productId: string | number, quantity: number): void {
    if (!this.authService.isAuthenticated) {
      throw new Error('Debes iniciar sesión para actualizar el carrito');
    }

    const normalizedId = productId.toString();
    const headers = this.authService.getAuthHeaders();
    const userId = this.authService.currentUser?._id || this.authService.currentUser?.id;
    if (!userId) return;

    this.patchState({ loading: true, error: null });
    this.http.get<any>(`${this.apiUrl}/cart/user/${userId}`, { headers }).pipe(
      switchMap((cartData) => {
        if (!cartData?._id) {
          return of(null);
        }
        const products = (cartData.products ?? []).map((item: any) => {
          const itemId = this.extractProductId(item);
          if (itemId === normalizedId) {
            return { product: itemId, quantity };
          }
          return {
            product: itemId,
            quantity: item.quantity || 1
          };
        });
        return this.http.put<any>(`${this.apiUrl}/cart/${cartData._id}`, { products }, { headers });
      })
    ).subscribe({
      next: (updatedCart) => {
        const items = this.normalizeCartItems(updatedCart?.products ?? []);
        this.patchState({ items, loading: false });
      },
      error: (error) => this.handleRequestError(error)
    });
  }

  removeFromCart(productId: string | number): void {
    if (!this.authService.isAuthenticated) {
      throw new Error('Debes iniciar sesión para actualizar el carrito');
    }

    const normalizedId = productId.toString();
    const headers = this.authService.getAuthHeaders();
    const userId = this.authService.currentUser?._id || this.authService.currentUser?.id;
    if (!userId) return;

    this.patchState({ loading: true, error: null });
    this.http.get<any>(`${this.apiUrl}/cart/user/${userId}`, { headers }).pipe(
      switchMap((cartData) => {
        if (!cartData?._id) {
          return of(null);
        }
        const filtered = (cartData.products ?? [])
          .map((item: any) => ({
            product: this.extractProductId(item),
            quantity: item.quantity || 1
          }))
          .filter((item: { product: string; quantity: number }) => item.product !== normalizedId);

        return this.http.put<any>(`${this.apiUrl}/cart/${cartData._id}`, { products: filtered }, { headers });
      })
    ).subscribe({
      next: (response) => {
        const items = this.normalizeCartItems(response?.products ?? []);
        this.patchState({ items, loading: false });
      },
      error: (error) => this.handleRequestError(error)
    });
  }

  clearCart(): void {
    if (!this.authService.isAuthenticated) {
      this.patchState({ items: [] });
      return;
    }

    const headers = this.authService.getAuthHeaders();
    const userId = this.authService.currentUser?._id || this.authService.currentUser?.id;
    if (!userId) return;

    this.patchState({ loading: true, error: null, items: [] });
    this.http.get<any>(`${this.apiUrl}/cart/user/${userId}`, { headers }).pipe(
      switchMap((cartData) => {
        if (!cartData?._id) {
          return of(null);
        }
        return this.http.put<any>(`${this.apiUrl}/cart/${cartData._id}`, { products: [] }, { headers });
      })
    ).subscribe({
      next: () => {
        this.patchState({ loading: false });
      },
      error: (error) => this.handleRequestError(error)
    });
  }

  getTotal(): number {
    const state = this.get();
    return state.items.reduce((total, item) => total + (item.product.price || 0) * item.quantity, 0);
  }

  getItemCount(): number {
    const state = this.get();
    return state.items.reduce((count, item) => count + item.quantity, 0);
  }

  syncCartFromBackend(): void {
    this.loadCartFromBackend();
  }

  syncCartToBackend(): Observable<any> {
    if (!this.authService.isAuthenticated || this.get().items.length === 0) {
      return of(null);
    }

    const headers = this.authService.getAuthHeaders();
    const userId = this.authService.currentUser?._id || this.authService.currentUser?.id;
    if (!userId) {
      return of(null);
    }

    const formattedProducts = this.get().items
      .map((item) => ({
        product: (item.product._id ?? item.product.id)?.toString(),
        quantity: item.quantity
      }))
      .filter((item): item is { product: string; quantity: number } => !!item.product);

    return this.http.get<any>(`${this.apiUrl}/cart/user/${userId}`, { headers }).pipe(
      switchMap((cartData: any) => {
        if (cartData && cartData._id) {
          return this.http.put<any>(`${this.apiUrl}/cart/${cartData._id}`, { products: formattedProducts }, { headers });
        }
        return of(null);
      }),
      tap(() => this.loadCartFromBackend())
    );
  }

  private normalizeCartItems(items: any[]): CartItem[] {
    return items
      .filter((item) => item?.product && (item.product._id || item.product.id))
      .map((item) => ({
        product: item.product,
        quantity: item.quantity || 1
      }));
  }

  private extractProductId(item: any): string {
    if (item?.product && typeof item.product === 'object') {
      return item.product._id?.toString() || item.product.id?.toString();
    }
    return item?.product?.toString();
  }

  private validateStock(productId: string, quantity: number, stock?: number): boolean {
    if (typeof stock !== 'number') {
      return true;
    }
    const currentItem = this.get().items.find(
      (item) => (item.product._id ?? item.product.id?.toString()) === productId
    );
    const currentQuantity = currentItem?.quantity ?? 0;
    return quantity + currentQuantity <= stock;
  }

  private handleRequestError(error: any): void {
    console.error('Error en petición del carrito', error);
    const message = error?.error?.message || 'No se pudo actualizar el carrito';
    this.patchState({ loading: false, error: message });
  }
}

