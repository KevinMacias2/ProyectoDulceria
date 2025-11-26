import { Component, OnInit, signal, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { Product } from '../../../core/models/product.model';
import { SkeletonComponent } from '../../../components/shared/skeleton/skeleton.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, SkeletonComponent],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit {
  product: Product | undefined;
  loading = signal(true);
  quantity = 1;
  successMessage = '';
  errorMessage = '';
  relatedProducts: Product[] = [];

  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProduct();
  }

  private loadProduct(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    
    if (!idParam) {
      this.router.navigate(['/productos']);
      return;
    }

    this.loading.set(true);

    this.productService.getProductById(idParam).subscribe({
      next: (product) => {
        if (product) {
          this.product = product;
          this.loadRelatedProducts();
        } else {
          this.errorMessage = 'Producto no encontrado';
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar el producto:', error);
        this.errorMessage = 'Error al cargar el producto';
        this.loading.set(false);
      }
    });
  }

  private loadRelatedProducts(): void {
    if (!this.product) return;

    this.productService.getAllProducts().subscribe((products: Product[]) => {
      this.relatedProducts = products
        .filter((p: Product) => {
          const productId = p.id || p._id;
          const currentId = this.product?.id || this.product?._id;
          return productId !== currentId;
        })
        .slice(0, 4);
    });
  }

  increaseQuantity(): void {
    if (this.product && this.quantity < this.product.stock) {
      this.quantity++;
    }
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart(): void {
    if (!this.product) return;

    try {
      this.cartService.addToCart(this.product, this.quantity);
      this.successMessage = `¡${this.quantity} ${this.quantity === 1 ? 'producto' : 'productos'} agregado${this.quantity === 1 ? '' : 's'} al carrito!`;
      
      if (this.product.stock > 0) {
        this.product.stock = Math.max(this.product.stock - this.quantity, 0);
      }

      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo agregar el producto al carrito';
      this.errorMessage = message;
      this.toastService.error(message);
      if (message.toLowerCase().includes('iniciar sesión')) {
        this.router.navigate(['/auth/login'], { queryParams: { returnUrl: this.router.url } });
      }
    }
  }

  goBack(): void {
    this.router.navigate(['/productos']);
  }

  getCategoryName(): string {
    if (!this.product) return '';
    
    if (typeof this.product.category === 'string') {
      return this.product.category;
    } else if (this.product.category && typeof this.product.category === 'object') {
      return this.product.category.name;
    }
    
    return 'Sin categoría';
  }

  getImageUrl(): string {
    if (!this.product) return '';

    if (this.product.imageUrl) {
      return this.product.imageUrl;
    } else if (this.product.imagesUrl && this.product.imagesUrl.length > 0) {
      return this.product.imagesUrl[0];
    }

    return 'assets/placeholder.jpg';
  }

  isAdmin(): boolean {
    return this.authService.currentUser?.role === 'admin';
  }
}
