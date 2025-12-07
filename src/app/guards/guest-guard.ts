import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const auth = inject(AuthService);

  // Si está autenticado y token válido, redirigir: admin -> dashboard, usuario -> tabs/encuestas
  if (auth.isAuthenticated() && auth.isTokenValid()) {
    if (auth.isAdmin()) {
      router.navigate(['/dashboard']);
    } else {
      router.navigate(['/tabs/encuestas']);
    }
    return false;
  }

  // Permitir acceso a rutas de invitado (login/register)
  return true;
};
