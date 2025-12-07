import { Component, OnInit } from '@angular/core';
import { IonButton } from '@ionic/angular/standalone';
import { IonInput, IonItem, IonList, IonText, IonIcon, IonContent, AlertController, ToastController } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { BiometricAuthService } from '../services/biometric-auth.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [IonButton, IonInput, IonItem, IonList, IonText, IonIcon, IonContent, CommonModule, FormsModule, RouterLink],
})
export class LoginComponent implements OnInit {
  email: string = '';
  password: string = '';

  biometricAvailable: boolean = false;
  hasBiometricCredentials: boolean = false;
  isLoading: boolean = false;

  constructor(
    private biometricService: BiometricAuthService,
    private authService: AuthService,
    private alertController: AlertController,
    private toastController: ToastController,
    private router: Router
  ) { }

  async ngOnInit() {
    // Verificar si la biometría está disponible
    this.biometricAvailable = await this.biometricService.isPlatformAuthenticatorAvailable();
    this.hasBiometricCredentials = this.biometricService.hasRegisteredCredentials();

    console.log('Biometric available:', this.biometricAvailable);
    console.log('Has credentials:', this.hasBiometricCredentials);
    console.log('Is Android:', this.biometricService.isAndroid());
    console.log('Protocol:', window.location.protocol);
  }

  /**
   * Login tradicional con email y contraseña
   */
  async login() {
    if (!this.email || !this.password) {
      await this.showToast('Por favor completa todos los campos', 'warning');
      return;
    }

    this.isLoading = true;

    try {
      const response = await this.authService.login({
        email: this.email,
        password: this.password
      }).toPromise();

      // 🔥 GUARDAR token + userId de manera segura
      localStorage.setItem('authToken', response?.token ?? '');
      localStorage.setItem('userId', String(response?.data?.id ?? ''));


      await this.showToast(`¡Bienvenido ${response?.data.firstName}! 👋`, 'success');

      // Determinar destino según rol: admin -> /dashboard, usuario -> /tabs/encuestas
      const target = this.authService.isAdmin() ? '/dashboard' : '/tabs/encuestas';

      if (this.biometricAvailable && !this.hasBiometricCredentials) {
        await this.promptBiometricRegistration(target);
      } else {
        this.router.navigate([target]);
      }

    } catch (error: any) {
      console.error('Error al iniciar sesión:', error);
      const errorMessage = error.error?.error || error.error?.message || 'Credenciales incorrectas';
      await this.showToast(errorMessage, 'danger');
    } finally {
      this.isLoading = false;
    }
  }


  /**
   * Preguntar al usuario si quiere registrar biometría
   */
  async promptBiometricRegistration(target: string) {
    const alert = await this.alertController.create({
      header: '¿Habilitar inicio rápido?',
      message: '¿Quieres usar Face ID / Touch ID / Huella digital para iniciar sesión más rápido?',
      buttons: [
        {
          text: 'No, gracias',
          role: 'cancel',
          handler: () => {
            this.router.navigate([target]);
          }
        },
        {
          text: 'Sí, habilitar',
          handler: async () => {
            await this.registerBiometric(target);
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Registrar credencial biométrica
   */
  async registerBiometric(target: string) {
    this.isLoading = true;

    try {
      // Usar el email como username y generar un userId único
      const userId = this.generateUserId(this.email);

      const success = await this.biometricService.registerBiometric(this.email, userId);

      if (success) {
        this.hasBiometricCredentials = true;
        await this.showToast('¡Autenticación biométrica activada! 🎉', 'success');
        this.router.navigate([target]);
      }
    } catch (error: any) {
      console.error('Error registrando biometría:', error);
      await this.showToast(error.message || 'Error al configurar biometría', 'danger');
      this.router.navigate([target]);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Autenticar usando biometría
   */
  async loginWithBiometric() {
    this.isLoading = true;

    try {
      const result = await this.biometricService.authenticateBiometric();

      if (result.success) {
        await this.showToast(`¡Bienvenido ${result.username}! 👋`, 'success');
        // Aquí puedes validar con tu backend si es necesario
        // Si el usuario ya está cargado en AuthService, redirigir según rol; si no, ir a encuestas
        const target = this.authService.isAuthenticated() && this.authService.isAdmin() ? '/dashboard' : '/tabs/encuestas';
        this.router.navigate([target]);
      } else {
        await this.showToast('No se pudo autenticar', 'danger');
      }
    } catch (error: any) {
      console.error('Error en autenticación biométrica:', error);
      await this.showToast(error.message || 'Error al autenticar', 'warning');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Eliminar credenciales biométricas
   */
  async removeBiometric() {
    const alert = await this.alertController.create({
      header: 'Desactivar biometría',
      message: '¿Estás seguro que quieres desactivar el inicio con biometría?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Desactivar',
          role: 'destructive',
          handler: () => {
            this.biometricService.clearCredentials();
            this.hasBiometricCredentials = false;
            this.showToast('Biometría desactivada', 'success');
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Genera un userId único basado en el email
   */
  private generateUserId(email: string): string {
    return btoa(email + Date.now());
  }

  /**
   * Muestra un toast message
   */
  private async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }
}
