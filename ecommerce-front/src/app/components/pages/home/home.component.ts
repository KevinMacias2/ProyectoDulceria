import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { Product } from '../../../core/models/product.model';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  featuredProducts: Product[] = [];
  productChunks: Product[][] = [];
  loading = true;

  private router = inject(Router);
  private toastService = inject(ToastService);

  constructor(
    private productService: ProductService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.loadFeaturedProducts();
  }

  private loadFeaturedProducts(): void {
    this.productService.getAllProducts().subscribe({
      next: (products: Product[]) => {
        this.featuredProducts = products
          .sort((a: Product, b: Product) => a.price - b.price)
          .slice(0, 10);
        
        this.productChunks = this.chunkArray(this.featuredProducts, 4);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar productos destacados:', error);
        this.loading = false;
      }
    });
  }

  private chunkArray(array: any[], size: number): any[][] {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  addToCart(product: Product): void {
    try {
      this.cartService.addToCart(product);
      const updatedProduct = this.featuredProducts.find(p => 
        (p.id && p.id === product.id) || (p._id && p._id === product._id)
      );
      if (updatedProduct && updatedProduct.stock > 0) {
        updatedProduct.stock -= 1;
      }
      this.toastService.success(`${product.name} agregado al carrito`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo agregar el producto';
      this.toastService.error(message);
      if (message.toLowerCase().includes('iniciar sesión')) {
        this.router.navigate(['/auth/login'], { queryParams: { returnUrl: this.router.url } });
      }
    }
  }

  navigateToCategory(categoryName: string): void {
    this.router.navigate(['/productos'], { 
      queryParams: { categoria: categoryName } 
    });
  }
}
