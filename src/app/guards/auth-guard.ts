import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = new Router();

  const token = localStorage.getItem('authToken');

  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  return true;
};
