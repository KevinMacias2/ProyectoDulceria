import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { AuthService } from '../../../core/services/auth.service';
import { Product } from '../../../core/models/product.model';
import { HasUnsavedChanges } from '../../../core/guards/pending-changes.guard';

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-product.component.html',
  styleUrls: ['./add-product.component.css']
})
export class AddProductComponent implements OnInit, HasUnsavedChanges {
  productForm: FormGroup;
  categorias = [
    'Gomitas', 'Dulce Suave', 'Dulce Masizo', 'Chocolates', 'Paletas', 'Chicles', 'Botanas', 'Galletas'
  ];
  imagenPreview: string | null = null;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  private formSubmitted = false;

  private authService = inject(AuthService);
  private router = inject(Router);

  constructor(private fb: FormBuilder, private productService: ProductService) {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0.01)]],
      imageUrl: ['', Validators.required], // Guardará base64
      category: ['', Validators.required],
      stock: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    if (!this.authService.currentUser || this.authService.currentUser.role !== 'admin') {
      this.router.navigate(['/productos']);
      return;
    }
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.imagenPreview = reader.result as string;
        this.productForm.patchValue({ imageUrl: this.imagenPreview });
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
    this.successMessage = null;
    this.errorMessage = null;
    this.formSubmitted = false;
    if (this.productForm.valid) {
      const formValue = this.productForm.value;
      const newProduct: Product = {
        ...formValue,
        // No asignar ID manualmente, el backend lo generará
        // Transformar imageUrl a imagesUrl para que coincida con el backend
        imagesUrl: [formValue.imageUrl],
        imageUrl: formValue.imageUrl // Mantener para compatibilidad local
      };
      this.productService.addProduct(newProduct).subscribe({
        next: (response) => {
          console.log('Producto agregado exitosamente:', response);
          this.successMessage = '¡Producto agregado correctamente!';
          this.formSubmitted = true;
          this.productForm.reset();
          this.imagenPreview = null;
          
          // Navegar a la lista de productos después de 2 segundos
          setTimeout(() => {
            this.router.navigate(['/productos']);
          }, 2000);
        },
        error: (error) => {
          console.error('Error al agregar producto:', error);
          console.error('Detalles del error:', error.error);
          console.error('Estado del error:', error.status);
          this.errorMessage = `Error al agregar el producto: ${error.error?.message || error.message || 'Error desconocido'}`;
        }
      });
    } else {
      this.errorMessage = 'No se pudo agregar el producto. Por favor, revisa los campos.';
      this.productForm.markAllAsTouched();
    }
  }

  hasUnsavedChanges(): boolean {
    return this.productForm.dirty && !this.formSubmitted;
  }
}
