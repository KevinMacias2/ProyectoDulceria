import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastService } from '../services/toast.service';
import { AuthService } from '../services/auth.service';
import { catchError, throwError } from 'rxjs';

const FRIENDLY_MESSAGES: Record<number, string> = {
  0: 'No se pudo contactar al servidor. Verifica tu conexión.',
  400: 'Verifica los datos enviados y vuelve a intentarlo.',
  401: 'Tu sesión expiró. Inicia sesión nuevamente.',
  403: 'No tienes permisos para realizar esta acción.',
  404: 'No encontramos el recurso solicitado.',
  500: 'El servidor tuvo un problema inesperado.'
};

export const globalErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const message =
        error.error?.message ||
        FRIENDLY_MESSAGES[error.status] ||
        'Ocurrió un error inesperado.';

      toastService.error(message);

      if (error.status === 401) {
        authService.logout();
        router.navigate(['/auth/login'], { queryParams: { returnUrl: router.url } });
      }

      return throwError(() => error);
    })
  );
};

