import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterRequest } from '../../../types/auth.types';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="register-card">
      <div class="text-center mb-4">
        <h2 class="register-title">Crear Cuenta</h2>
        <p class="text-muted">Únete a Dulces Yankee y descubre los mejores dulces</p>
      </div>

        @if (errorMessage) {
          <div class="alert alert-danger" role="alert">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            {{ errorMessage }}
          </div>
        }

        @if (successMessage) {
          <div class="alert alert-success" role="alert">
            <i class="bi bi-check-circle-fill me-2"></i>
            {{ successMessage }}
          </div>
        }

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" novalidate>
          <div class="mb-3">
            <label for="name" class="form-label">Nombre Completo</label>
            <input 
              type="text" 
              class="form-control" 
              [class.is-invalid]="isFieldInvalid('name')"
              id="name" 
              formControlName="name"
              placeholder="Ingresa tu nombre completo">
            @if (isFieldInvalid('name')) {
              <div class="invalid-feedback">
                @if (registerForm.get('name')?.errors?.['required']) {
                  El nombre es obligatorio
                }
                @if (registerForm.get('name')?.errors?.['minlength']) {
                  El nombre debe tener al menos 2 caracteres
                }
              </div>
            }
          </div>

          <div class="mb-3">
            <label for="email" class="form-label">Correo Electrónico</label>
            <input 
              type="email" 
              class="form-control" 
              [class.is-invalid]="isFieldInvalid('email')"
              id="email" 
              formControlName="email"
              placeholder="tu@email.com">
            @if (isFieldInvalid('email')) {
              <div class="invalid-feedback">
                @if (registerForm.get('email')?.errors?.['required']) {
                  El correo electrónico es obligatorio
                }
                @if (registerForm.get('email')?.errors?.['email']) {
                  Por favor ingresa un correo electrónico válido
                }
              </div>
            }
          </div>

          <div class="mb-3">
            <label for="password" class="form-label">Contraseña</label>
            <div class="input-group">
              <input 
                [type]="showPassword ? 'text' : 'password'" 
                class="form-control" 
                [class.is-invalid]="isFieldInvalid('password')"
                id="password" 
                formControlName="password"
                placeholder="Mínimo 6 caracteres">
              <button 
                class="btn btn-outline-secondary" 
                type="button" 
                (click)="togglePasswordVisibility()">
                <i class="bi" [class.bi-eye]="!showPassword" [class.bi-eye-slash]="showPassword"></i>
              </button>
            </div>
            @if (isFieldInvalid('password')) {
              <div class="invalid-feedback">
                @if (registerForm.get('password')?.errors?.['required']) {
                  La contraseña es obligatoria
                }
                @if (registerForm.get('password')?.errors?.['minlength']) {
                  La contraseña debe tener al menos 6 caracteres
                }
              </div>
            }
          </div>

          <div class="mb-4">
            <label for="confirmPassword" class="form-label">Confirmar Contraseña</label>
            <div class="input-group">
              <input 
                [type]="showConfirmPassword ? 'text' : 'password'" 
                class="form-control" 
                [class.is-invalid]="isFieldInvalid('confirmPassword')"
                id="confirmPassword" 
                formControlName="confirmPassword"
                placeholder="Repite tu contraseña">
              <button 
                class="btn btn-outline-secondary" 
                type="button" 
                (click)="toggleConfirmPasswordVisibility()">
                <i class="bi" [class.bi-eye]="!showConfirmPassword" [class.bi-eye-slash]="showConfirmPassword"></i>
              </button>
            </div>
            @if (isFieldInvalid('confirmPassword')) {
              <div class="invalid-feedback">
                @if (registerForm.get('confirmPassword')?.errors?.['required']) {
                  Confirmar contraseña es obligatorio
                }
                @if (registerForm.get('confirmPassword')?.errors?.['mismatch']) {
                  Las contraseñas no coinciden
                }
              </div>
            }
          </div>

          <button 
            type="submit" 
            class="btn btn-primary w-100 mb-3"
            [disabled]="registerForm.invalid || loading">
            @if (loading) {
              <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Creando cuenta...
            } @else {
              Crear Cuenta
            }
          </button>

          <div class="text-center">
            <p class="mb-0">
              ¿Ya tienes cuenta? 
              <a routerLink="/login" class="text-decoration-none">Inicia sesión aquí</a>
            </p>
          </div>
        </form>
    </div>
  `,
  styles: [`
    .register-card {
      width: 100%;
      max-width: 400px;
      background: white;
      border-radius: 15px;
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
      padding: 2rem;
      margin-top: 2rem;
      margin-bottom: 2rem;
    }

    .register-title {
      color: #333;
      font-weight: bold;
      margin-bottom: 0.5rem;
    }

    .form-label {
      font-weight: 600;
      color: #555;
      margin-bottom: 0.5rem;
    }

    .form-control {
      border-radius: 10px;
      border: 2px solid #e9ecef;
      padding: 0.75rem;
      transition: all 0.3s ease;
    }

    .form-control:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      border-radius: 10px;
      padding: 0.75rem;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .alert {
      border-radius: 10px;
      border: none;
    }

    .invalid-feedback {
      display: block;
      font-size: 0.875rem;
    }

    .is-invalid {
      border-color: #dc3545;
    }

    .input-group .btn {
      border-radius: 0 10px 10px 0;
    }

    .input-group .form-control {
      border-radius: 10px 0 0 10px;
    }
  `]
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  showConfirmPassword = false;

  private toastService = inject(ToastService);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    
    return null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.loading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const registerData: RegisterRequest = {
        displayName: this.registerForm.value.name,
        email: this.registerForm.value.email,
        password: this.registerForm.value.password,
        confirmPassword: this.registerForm.value.confirmPassword,
        phone: '1234567890' // Valor temporal, se puede hacer opcional después
      };

      this.authService.register(registerData).subscribe({
        next: (response) => {
          this.loading = false;
          this.successMessage = '¡Cuenta creada exitosamente! Redirigiendo...';
          this.toastService.success('¡Cuenta creada exitosamente! Bienvenido');
          
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 2000);
        },
        error: (error) => {
          this.loading = false;
          const errorMsg = error.message || 'Error al crear la cuenta. Por favor intenta de nuevo.';
          this.errorMessage = errorMsg;
          this.toastService.error(errorMsg);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }
}
