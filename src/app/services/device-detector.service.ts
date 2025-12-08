import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DeviceDetectorService {

  constructor() { }

  /**
   * Detectar si el usuario está en un dispositivo móvil
   */
  isMobile(): boolean {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    
    // Detectar iOS
    if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
      return true;
    }
    
    // Detectar Android
    if (/android/i.test(userAgent)) {
      return true;
    }
    
    // Detectar Windows Phone
    if (/windows phone/i.test(userAgent)) {
      return true;
    }
    
    // Detectar por viewport (tablet/móvil por tamaño de pantalla)
    if (window.innerWidth <= 768) {
      return true;
    }
    
    return false;
  }

  /**
   * Detectar si el usuario está en una tablet
   */
  isTablet(): boolean {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    return /iPad|Android(?!.*Mobile)/i.test(userAgent) && window.innerWidth >= 768;
  }

  /**
   * Detectar si está en un navegador de escritorio
   */
  isDesktop(): boolean {
    return !this.isMobile() && !this.isTablet();
  }

  /**
   * Obtener el tipo de dispositivo
   */
  getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    if (this.isMobile()) return 'mobile';
    if (this.isTablet()) return 'tablet';
    return 'desktop';
  }
}
