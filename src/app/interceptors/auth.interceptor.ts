import { HttpInterceptorFn } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Obtener el token del localStorage
  const token = auth.getAuthToken();

  // Si hay token, clonar la petición y agregar el header de autorización
  const requestToSend = token
    ? req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) })
    : req;

  return next(requestToSend).pipe(
    catchError((err: any) => {
      // Si el servidor responde 401 -> token inválido/expirado, cerrar sesión y redirigir al login
      if (err && err.status === 401) {
        try {
          auth.logout();
        } catch (e) {
          // ignore
        }
        try {
          router.navigate(['/login']);
        } catch (e) {
          // ignore
        }
      }
      return throwError(() => err);
    })
  );
};
