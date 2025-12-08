import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonButton, IonIcon, IonText } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { DeviceDetectorService } from '../services/device-detector.service';

@Component({
  selector: 'app-download-app',
  templateUrl: './download-app.component.html',
  styleUrls: ['./download-app.component.scss'],
  standalone: true,
  imports: [IonContent, IonButton, IonIcon, IonText, CommonModule]
})
export class DownloadAppComponent {
  isIOS: boolean = false;
  isAndroid: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private device: DeviceDetectorService
  ) {
    const userAgent = navigator.userAgent;
    this.isIOS = /iPad|iPhone|iPod/.test(userAgent);
    this.isAndroid = /android/i.test(userAgent);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  installPWA() {
    // Mostrar instrucciones según dispositivo
    if (this.isIOS) {
      alert('Para instalar:\n1. Toca el ícono de compartir\n2. Selecciona "Agregar a pantalla de inicio"');
    } else if (this.isAndroid) {
      alert('Para instalar:\n1. Toca el menú (⋮)\n2. Selecciona "Instalar aplicación"');
    } else {
      alert('Abre esta página desde tu dispositivo móvil para instalar la aplicación');
    }
  }
}
