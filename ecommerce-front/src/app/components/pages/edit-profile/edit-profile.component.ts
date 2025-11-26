import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { UserService, UpdateProfileRequest } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';
import { HasUnsavedChanges } from '../../../core/guards/pending-changes.guard';

const PERFIL_KEY = 'perfil-usuario';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.css']
})
export class EditProfileComponent implements OnInit, HasUnsavedChanges {
  profileForm: FormGroup;
  imagenPreview: string | null = null;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  loading = false;
  private formSubmitted = false;

  private toastService = inject(ToastService);

  constructor(
    private fb: FormBuilder, 
    private authService: AuthService,
    private userService: UserService
  ) {
    this.profileForm = this.fb.group({
      displayName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      avatar: ['']
    });
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.loading = true;
    
    // Primero intentar cargar desde el backend
    this.userService.getProfile().subscribe({
      next: (response) => {
        const user = response.user || response;
        if (user) {
          this.profileForm.patchValue({
            displayName: user.displayName || user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            avatar: user.avatar || ''
          });
          this.imagenPreview = user.avatar || null;
        }
        this.loading = false;
      },
      error: (error) => {
        console.warn('No se pudo cargar el perfil desde el backend, usando datos locales:', error);
        // Fallback a datos locales si falla el backend
        const authUser = this.authService.currentUser;
        if (authUser) {
          this.profileForm.patchValue({
            displayName: authUser.name ?? '',
            email: authUser.email ?? '',
            phone: authUser.phone ?? '',
            avatar: authUser.profileImage ?? ''
          });
          this.imagenPreview = authUser.profileImage ?? null;
        }

        // Merge with any locally saved extended profile fields
        const perfilGuardado = localStorage.getItem(PERFIL_KEY);
        if (perfilGuardado) {
          const perfil = JSON.parse(perfilGuardado);
          this.profileForm.patchValue(perfil);
          this.imagenPreview = perfil.avatar ?? this.imagenPreview;
        }
        this.loading = false;
      }
    });
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.imagenPreview = reader.result as string;
        this.profileForm.patchValue({ avatar: this.imagenPreview });
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
    this.successMessage = null;
    this.errorMessage = null;
    this.formSubmitted = false;
    
    if (this.profileForm.valid) {
      this.loading = true;
      
      const profileData: UpdateProfileRequest = {
        displayName: this.profileForm.value.displayName,
        email: this.profileForm.value.email,
        phone: this.profileForm.value.phone,
        avatar: this.profileForm.value.avatar
      };

      this.userService.updateProfile(profileData).subscribe({
        next: (response) => {
          // Persist extended profile locally
          localStorage.setItem(PERFIL_KEY, JSON.stringify(this.profileForm.value));
          
          this.successMessage = '¡Perfil actualizado correctamente!';
          this.toastService.success('¡Perfil actualizado correctamente!');
          console.log('Perfil actualizado exitosamente:', response);
          this.formSubmitted = true;
          
          // Actualizar también los datos del usuario en el auth service
          if (response.user) {
            this.authService.updateCurrentUser({
              name: response.user.displayName || response.user.name,
              email: response.user.email,
              profileImage: response.user.avatar || response.user.profileImage,
              phone: response.user.phone
            });
          }
          
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al actualizar el perfil:', error);
          const errorMsg = error.error?.message || 'Error al actualizar el perfil. Inténtalo de nuevo.';
          this.errorMessage = errorMsg;
          this.toastService.error(errorMsg);
          this.loading = false;
        }
      });
    } else {
      this.errorMessage = 'No se pudo actualizar el perfil. Revisa los campos.';
      this.toastService.error('Por favor, completa todos los campos correctamente.');
      this.profileForm.markAllAsTouched();
    }
  }

  hasUnsavedChanges(): boolean {
    return this.profileForm.dirty && !this.formSubmitted;
  }
}
