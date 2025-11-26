import { CommonModule } from '@angular/common';
import { Component, OnInit, AfterViewInit, signal, inject } from '@angular/core';
import { Product } from '../../../core/models/product.model';
import { CartService } from '../../../core/services/cart.service';
import { ProductService } from '../../../core/services/product.service';
import { AuthService } from '../../../core/services/auth.service';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import { SkeletonComponent } from '../../../components/shared/skeleton/skeleton.component';

@Component({
  selector: 'app-product-list',
  imports: [CommonModule, RouterLink, SkeletonComponent],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css'
})
export class ProductListComponent implements OnInit, AfterViewInit {
  products: Product[] = [];
  loading = signal(true);
  currentPage = 1;
  itemsPerPage = 8;
  totalItems = 0;
  totalPages = 0;
  searchTerm = '';
  selectedCategory = '';
  categories: string[] = [];
  skeletonPlaceholders = Array.from({ length: 8 }, (_, index) => index);

  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);
  private router = inject(Router);

  constructor(
    private productService: ProductService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    // Leer queryParams para obtener la categoría
    this.route.queryParams.subscribe(params => {
      if (params['categoria']) {
        this.selectedCategory = params['categoria'];
      }
      this.loadProducts();
    });
  }

  ngAfterViewInit(): void {
    // Recargar productos cuando se navega de vuelta a esta página
    this.loadProducts();
  }

  private loadProducts(): void {
    this.loading.set(true);
    
    this.productService.getAllProducts().subscribe({
      next: (prods) => {
        this.products = prods;
        this.totalItems = prods.length;
        this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
        this.extractCategories();
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
        this.loading.set(false);
      }
    });
  }

  private extractCategories(): void {
    const categorySet = new Set<string>();
    this.products.forEach(product => {
      if (typeof product.category === 'string') {
        categorySet.add(product.category);
      } else if (product.category && typeof product.category === 'object') {
        categorySet.add(product.category.name);
      }
    });
    this.categories = Array.from(categorySet).sort();
  }

  get filteredProducts(): Product[] {
    let filtered = this.products;

    // Filter by search term
    if (this.searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (this.selectedCategory) {
      filtered = filtered.filter(product => {
        if (typeof product.category === 'string') {
          return product.category === this.selectedCategory;
        } else if (product.category && typeof product.category === 'object') {
          return product.category.name === this.selectedCategory;
        }
        return false;
      });
    }

    return filtered;
  }

  get filteredProductsWithPagination(): Product[] {
    const filtered = this.filteredProducts;
    this.totalItems = filtered.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    
    // Ensure current page is valid
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    } else if (this.currentPage < 1) {
      this.currentPage = 1;
    }

    return filtered;
  }

  get paginatedProducts(): Product[] {
    const filtered = this.filteredProductsWithPagination;
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  }

  get pageNumbers(): number[] {
    const pages = [];
    const maxPagesToShow = 5;
    const startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
    // Reset to first page only if we're not on page 1
    if (this.currentPage !== 1) {
      this.currentPage = 1;
    }
  }

  onCategoryChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedCategory = target.value;
    // Reset to first page only if we're not on page 1
    if (this.currentPage !== 1) {
      this.currentPage = 1;
    }
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.currentPage = 1;
  }

  clearSearch(): void {
    if (this.searchTerm) {
      this.searchTerm = '';
      if (this.currentPage !== 1) this.currentPage = 1;
    }
  }

  clearCategory(): void {
    if (this.selectedCategory) {
      this.selectedCategory = '';
      if (this.currentPage !== 1) this.currentPage = 1;
    }
  }

  addToCart(product: Product): void {
    try {
      this.cartService.addToCart(product);
      
      const updatedProduct = this.products.find(p => 
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

  deleteProduct(product: Product): void {
    const productId = product.id || product._id;
    if (!productId) return;

    if (confirm(`¿Estás seguro de que quieres eliminar el producto "${product.name}"?`)) {
      this.productService.deleteProductById(productId).subscribe({
        next: (response: any) => {
          // Remove from local array
          this.products = this.products.filter(p => 
            (p.id && p.id !== productId) || (p._id && p._id !== productId)
          );
          this.totalItems = this.products.length;
          this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
          
          // Adjust current page if necessary
          if (this.currentPage > this.totalPages && this.totalPages > 0) {
            this.currentPage = this.totalPages;
          }
          
          this.toastService.success(`Producto "${product.name}" eliminado exitosamente`);
          console.log('Producto eliminado exitosamente');
        },
        error: (error: any) => {
          console.error('Error al eliminar el producto:', error);
          const errorMsg = 'Error al eliminar el producto. Inténtalo de nuevo.';
          this.toastService.error(errorMsg);
        }
      });
    }
  }

  getMin(a: number, b: number): number {
    return Math.min(a, b);
  }

  isAdmin(): boolean {
    return this.authService.currentUser?.role === 'admin';
  }
}
