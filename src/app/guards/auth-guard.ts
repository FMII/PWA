import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const auth = inject(AuthService);

  // Si no está autenticado, enviar a /login
  if (!auth.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  // Si la ruta requiere admin (marca con data.requiresAdmin) y el usuario no es admin,
  // redirigir a '/tabs/encuestas'
  const requiresAdmin = route.data && (route.data as any).requiresAdmin;
  if (requiresAdmin && !auth.isAdmin()) {
    router.navigate(['/tabs/encuestas']);
    return false;
  }

  return true;
};
