import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(ToastService);

  if (authService.isAuthenticated) {
    return true;
  }

  toastService.warning('Debes iniciar sesión para acceder a esta sección');
  router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

