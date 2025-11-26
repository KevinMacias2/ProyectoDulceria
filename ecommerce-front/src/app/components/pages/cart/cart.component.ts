import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CartItem } from '../../../core/models/cart-item';
import { CartService } from '../../../core/services/cart.service';
import { Product } from '../../../core/models/product.model';
import { ToastService } from '../../../core/services/toast.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-cart',
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent implements OnInit, OnDestroy {
  cartItems: CartItem[] = [];
  total = signal(0);
  itemCount = signal(0);
  private destroy$ = new Subject<void>();

  private toastService = inject(ToastService);

  constructor(private cartService: CartService, private router: Router) {}

  ngOnInit(): void {
    this.loadCart();
  }

  private loadCart(): void {
    // Suscribirse a cambios en el carrito primero
    this.cartService.getCart()
      .pipe(takeUntil(this.destroy$))
      .subscribe(items => {
        this.cartItems = (items || []).filter(item => 
          item && 
          item.product && 
          (item.product.id || item.product._id) &&
          item.product.name
        );
        this.updateTotals();
      });
    
    // Luego cargar carrito desde el backend si está autenticado
    // Esto actualizará el BehaviorSubject y disparará la suscripción de arriba
    this.cartService.loadCartFromBackend();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateTotals(): void {
    // Calcular el total basado en los items actuales del componente
    const total = this.cartItems.reduce((sum, item) => {
      const price = item.product?.price || 0;
      const quantity = item.quantity || 0;
      return sum + (price * quantity);
    }, 0);
    
    // Calcular el contador basado en los items actuales del componente
    const count = this.cartItems.reduce((sum, item) => {
      return sum + (item.quantity || 0);
    }, 0);
    
    this.total.set(total);
    this.itemCount.set(count);
  }

  increaseQuantity(item: CartItem): void {
    const productId = item.product.id || item.product._id;
    if (productId) {
      this.cartService.updateQuantity(productId, item.quantity + 1);
      this.updateTotals();
      this.toastService.success(`Cantidad de ${item.product.name} actualizada`);
    }
  }

  decreaseQuantity(item: CartItem): void {
    if (item.quantity > 1) {
      const productId = item.product.id || item.product._id;
      if (productId) {
        this.cartService.updateQuantity(productId, item.quantity - 1);
        this.updateTotals();
        this.toastService.info(`Cantidad de ${item.product.name} actualizada`);
      }
    }
  }

  removeItem(item: CartItem): void {
    const productId = item.product.id || item.product._id;
    if (productId) {
      this.cartService.removeFromCart(productId);
      this.updateTotals();
      this.toastService.success(`${item.product.name} eliminado del carrito`);
    }
  }

  clearCart(): void {
    this.cartService.clearCart();
    this.cartItems = [];
    this.updateTotals();
    this.toastService.info('Carrito vaciado');
  }

  getProductImage(product: Product): string {
    return product.imageUrl || (product.imagesUrl && product.imagesUrl[0]) || 'assets/placeholder.jpg';
  }

  getProductId(product: Product): string | number {
    return product.id || product._id || 0;
  }

  getCategoryName(category: any): string {
    if (typeof category === 'string') {
      return category;
    } else if (category && typeof category === 'object' && category.name) {
      return category.name;
    }
    return 'Sin categoría';
  }

  proceedToCheckout(): void {
    if (this.cartItems.length > 0) {
      this.router.navigate(['/checkout']);
    }
  }
}
