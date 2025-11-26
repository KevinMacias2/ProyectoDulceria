import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../core/services/product.service';
import { AuthService } from '../../../core/services/auth.service';
import { Product } from '../../../core/models/product.model';
import { HasUnsavedChanges } from '../../../core/guards/pending-changes.guard';

@Component({
  selector: 'app-edit-product',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-product.component.html',
  styleUrls: ['./edit-product.component.css']
})
export class EditProductComponent implements OnInit, HasUnsavedChanges {
  productForm: FormGroup;
  categorias = [
    'Gomitas', 'Dulce Suave', 'Dulce Masizo', 'Chocolates', 'Paletas', 'Chicles', 'Botanas', 'Galletas'
  ];
  imagenPreview: string | null = null;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  productId: string | number | null = null;
  private formSubmitted = false;

  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private authService = inject(AuthService);

  constructor() {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0.01)]],
      imagesUrl: ['', Validators.required],
      category: ['', Validators.required],
      stock: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    // Check if user is admin, redirect if not
    if (!this.authService.currentUser || this.authService.currentUser.role !== 'admin') {
      this.router.navigate(['/productos']);
      return;
    }

    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) return;
    
    this.productId = idParam;
    const isMongoId = idParam.length === 24;
    
    if (isMongoId) {
      this.productService.getProductById(idParam).subscribe((product: Product | undefined) => {
        if (product) {
          this.productForm.patchValue(product);
          this.imagenPreview = product.imageUrl || null;
        }
      });
    } else {
      this.productService.getAllProducts().subscribe((list: Product[]) => {
        const product = list.find((p: Product) => p.id === Number(idParam));
        if (product) {
          this.productForm.patchValue(product);
          this.imagenPreview = product.imageUrl || null;
        }
      });
    }
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.imagenPreview = reader.result as string;
        this.productForm.patchValue({ imagesUrl: this.imagenPreview });
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
    this.successMessage = null;
    this.errorMessage = null;
    this.formSubmitted = false;
    if (this.productForm.valid) {
      const payload: Product = { ...this.productForm.value };
      
      // Set the correct ID based on whether it's a MongoDB ID or local ID
      if (typeof this.productId === 'string' && this.productId.length === 24) {
        payload._id = this.productId;
      } else if (this.productId !== null) {
        payload.id = Number(this.productId);
      }
      
      this.productService.updateProduct(payload).subscribe({
        next: () => {
          this.successMessage = '¡Producto actualizado correctamente!';
          this.formSubmitted = true;
          const idToGo = (payload._id ?? payload.id)!;
          setTimeout(() => this.router.navigate(["/producto", idToGo]), 1200);
        },
        error: (error) => {
          this.errorMessage = 'Error al actualizar el producto. Verifica que tengas permisos de administrador.';
          console.error('Error updating product:', error);
        }
      });
    } else {
      this.errorMessage = 'No se pudo actualizar el producto. Revisa los campos.';
      this.productForm.markAllAsTouched();
    }
  }

  hasUnsavedChanges(): boolean {
    return this.productForm.dirty && !this.formSubmitted;
  }
}
