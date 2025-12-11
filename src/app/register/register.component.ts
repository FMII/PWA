import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonButton,
  IonInput,
  IonItem,
  IonList,
  IonText,
  IonIcon,
  AlertController,
  ToastController
} from '@ionic/angular/standalone';
import { BiometricAuthService } from '../services/biometric-auth.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonButton,
    IonInput,
    IonItem,
    IonList,
    IonText,
    IonIcon
  ],
})
export class RegisterComponent implements OnInit {
  firstName: string = '';
  lastName: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  roleId: number = 2; // Rol por defecto (ajusta según tu sistema)
  
  // Cloudflare Turnstile
  turnstileToken: string = '';
  
  biometricAvailable: boolean = false;
  isLoading: boolean = false;
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  constructor(
    private biometricService: BiometricAuthService,
    private authService: AuthService,
    private alertController: AlertController,
    private toastController: ToastController,
    private router: Router
  ) { }

  async ngOnInit() {
    this.biometricAvailable = await this.biometricService.isPlatformAuthenticatorAvailable();
    console.log('Biometric available in register:', this.biometricAvailable);
    console.log('Is Android:', this.biometricService.isAndroid());
    console.log('Is HTTPS:', window.location.protocol === 'https:');
    
    // Renderizar Turnstile después de que el DOM cargue
    setTimeout(() => {
      this.renderTurnstile();
    }, 500);
  }

  /**
   * Callback cuando Turnstile se completa exitosamente
   */
  onTurnstileSuccess(token: string) {
    this.turnstileToken = token;
    console.log('✅ Turnstile token (register) obtenido');
  }

  /**
   * Renderizar widget de Turnstile
   */
  renderTurnstile() {
    const container = document.getElementById('turnstile-register-container');
    
    if (!container) {
      console.error('❌ Contenedor de Turnstile no encontrado');
      return;
    }

    if (!(window as any).turnstile) {
      console.log('⏳ Esperando script de Turnstile...');
      setTimeout(() => this.renderTurnstile(), 500);
      return;
    }

    container.innerHTML = '';

    try {
      (window as any).turnstile.render('#turnstile-register-container', {
        sitekey: '0x4AAAAAACFTGe-2VlmzzEzV',
        callback: (token: string) => {
          this.turnstileToken = token;
          console.log('✅ Turnstile token (register) obtenido');
        },
        theme: 'light'
      });
      console.log('✅ Widget de Turnstile renderizado');
    } catch (error) {
      console.error('❌ Error al renderizar Turnstile:', error);
    }
  }

  /**
   * Validar el formulario
   */
  validateForm(): { valid: boolean; message?: string } {
    if (!this.firstName || !this.lastName || !this.email || !this.password || !this.confirmPassword) {
      return { valid: false, message: 'Por favor completa todos los campos' };
    }

    if (this.firstName.length < 2) {
      return { valid: false, message: 'El nombre debe tener al menos 2 caracteres' };
    }

    if (this.lastName.length < 2) {
      return { valid: false, message: 'El apellido debe tener al menos 2 caracteres' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      return { valid: false, message: 'Por favor ingresa un email válido' };
    }

    if (this.password.length < 6) {
      return { valid: false, message: 'La contraseña debe tener al menos 6 caracteres' };
    }

    if (this.password !== this.confirmPassword) {
      return { valid: false, message: 'Las contraseñas no coinciden' };
    }

    return { valid: true };
  }

  /**
   * Registrar nuevo usuario
   */
  async register() {
    const validation = this.validateForm();
    if (!validation.valid) {
      await this.showToast(validation.message || 'Por favor completa todos los campos', 'warning');
      return;
    }

    this.isLoading = true;

    try {
      const response = await this.authService.register({
        email: this.email,
        firstName: this.firstName,
        lastName: this.lastName,
        password: this.password,
        roleId: this.roleId,
        turnstileToken: this.turnstileToken
      }).toPromise();

      if (response?.data) {
        await this.showToast(`¡Bienvenido ${response.data.firstName}! Cuenta creada exitosamente 🎉`, 'success');

        // Si biometría está disponible, preguntar si quiere habilitarla
        if (this.biometricAvailable) {
          await this.promptBiometricRegistration();
        } else {
          this.router.navigate(['/tabs/encuestas']);
        }
      }

    } catch (error: any) {
      console.error('Error al registrar usuario:', error);
      
      // Intentar extraer el mensaje de error en diferentes formatos
      let errorMessage = 'Error al crear la cuenta';
      
      if (error.error) {
        // Si hay un array de errores de validación (express-validator)
        if (Array.isArray(error.error.errors) && error.error.errors.length > 0) {
          errorMessage = error.error.errors.map((e: any) => e.msg).join(', ');
        }
        // Si hay un mensaje de error directo
        else if (error.error.error) {
          errorMessage = error.error.error;
        }
        // Si hay un mensaje simple
        else if (error.error.message) {
          errorMessage = error.error.message;
        }
        // Si error.error es un string directamente
        else if (typeof error.error === 'string') {
          errorMessage = error.error;
        }
      }
      // Si error.message existe
      else if (error.message) {
        errorMessage = error.message;
      }
      
      console.log('📝 Mensaje de error capturado:', errorMessage);
      await this.showToast(errorMessage, 'danger');
      
      // Reset Turnstile y re-renderizar widget
      this.turnstileToken = '';
      setTimeout(() => {
        this.renderTurnstile();
      }, 100);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Preguntar si quiere habilitar biometría
   */
  async promptBiometricRegistration() {
    const biometricName = this.biometricService.getBiometricName();
    
    const alert = await this.alertController.create({
      header: '¿Habilitar inicio rápido?',
      message: `¿Quieres usar ${biometricName} para iniciar sesión más rápido la próxima vez?`,
      buttons: [
        {
          text: 'Ahora no',
          role: 'cancel',
          handler: () => {
            this.router.navigate(['/tabs']);
          }
        },
        {
          text: 'Sí, habilitar',
          handler: async () => {
            await this.registerBiometric();
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Registrar credencial biométrica
   */
  async registerBiometric() {
    try {
      console.log('Intentando registrar biometría...');
      const userId = this.generateUserId(this.email);
      const success = await this.biometricService.registerBiometric(this.email, userId);
      
      if (success) {
        console.log('Biometría registrada exitosamente');
        await this.showToast('¡Autenticación biométrica activada! 🎉', 'success');
      }
    } catch (error: any) {
      console.error('Error registrando biometría:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      
      let errorMsg = 'Biometría no configurada, puedes hacerlo después';
      
      if (error.name === 'NotAllowedError') {
        errorMsg = 'Permiso denegado. Asegúrate de tener configurada la huella o Face ID en tu dispositivo';
      } else if (error.name === 'NotSupportedError') {
        errorMsg = 'Tu dispositivo no soporta esta función o necesita HTTPS';
      }
      
      await this.showToast(errorMsg, 'warning');
    } finally {
      this.router.navigate(['/tabs']);
    }
  }

  /**
   * Genera un userId único
   */
  private generateUserId(email: string): string {
    return btoa(email + Date.now());
  }

  /**
   * Ir al login
   */
  goToLogin() {
    this.router.navigate(['/login']);
  }

  /**
   * Toggle visibilidad de contraseña
   */
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
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
