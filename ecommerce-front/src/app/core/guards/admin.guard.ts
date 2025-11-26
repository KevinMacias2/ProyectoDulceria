import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const adminGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(ToastService);

  const isAdmin = authService.isAuthenticated && authService.currentUser?.role === 'admin';
  if (isAdmin) {
    return true;
  }

  toastService.error('Esta sección es exclusiva para administradores');
  router.navigate(['/'], { queryParams: { returnUrl: state.url } });
  return false;
};

