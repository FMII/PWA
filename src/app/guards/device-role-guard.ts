import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { DeviceDetectorService } from '../services/device-detector.service';

/**
 * Guard para validar que:
 * - Admins solo accedan desde escritorio (web)
 * - Usuarios normales solo accedan desde móvil/tablet (app)
 */
export const deviceRoleGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const auth = inject(AuthService);
  const device = inject(DeviceDetectorService);

  // Solo validar si está autenticado
  if (!auth.isAuthenticated()) {
    return true; // Dejar que authGuard se encargue
  }

  const isAdmin = auth.isAdmin();
  const isMobile = device.isMobile() || device.isTablet();
  const isDesktop = device.isDesktop();

  // ADMIN debe estar en escritorio (web)
  if (isAdmin && isMobile) {
    // Mostrar página de advertencia
    router.navigate(['/admin-mobile-warning']);
    return false;
  }

  // USUARIO NORMAL debe estar en móvil/tablet (app)
  if (!isAdmin && isDesktop) {
    // Mostrar página de advertencia para descargar app
    router.navigate(['/download-app']);
    return false;
  }

  return true;
};
