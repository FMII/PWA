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
  verificationCode: string = '';
  
  // Control de flujo 2FA
  userId: number | null = null;
  showVerificationStep: boolean = false;

  // Cloudflare Turnstile
  turnstileToken: string = '';
  turnstileTokenVerify: string = '';

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

    // Renderizar Turnstile del paso 1
    setTimeout(() => {
      this.renderLoginTurnstile();
    }, 500);
  }

  /**
   * Callback cuando Turnstile se completa exitosamente (Paso 1: Login)
   */
  onTurnstileSuccess(token: string) {
    this.turnstileToken = token;
    console.log('✅ Turnstile token (login) obtenido');
  }

  /**
   * Callback cuando Turnstile se completa exitosamente (Paso 2: Verificación)
   */
  onTurnstileSuccessVerify(token: string) {
    this.turnstileTokenVerify = token;
    console.log('✅ Turnstile token (verify) obtenido');
  }

  /**
   * PASO 1: Iniciar login con 2FA (enviar código al correo)
   */
  async login() {
    if (!this.email || !this.password) {
      await this.showToast('Por favor completa todos los campos', 'warning');
      return;
    }

    this.isLoading = true;

    try {
      const response = await this.authService.loginInitiate({
        email: this.email,
        password: this.password,
        turnstileToken: this.turnstileToken
      }).toPromise();

      if (response?.success) {
        this.userId = response.userId;
        this.showVerificationStep = true;
        this.turnstileToken = ''; // Reset token
        
        // Renderizar el Turnstile del paso 2 después de que el DOM se actualice
        setTimeout(() => {
          this.renderVerifyTurnstile();
        }, 100);
        
        await this.showToast(response.message || 'Código enviado a tu correo', 'success');
      }

    } catch (error: any) {
      console.error('Error al iniciar sesión:', error);
      const errorMessage = error.error?.error || error.error?.message || 'Credenciales incorrectas';
      await this.showToast(errorMessage, 'danger');
      
      // Reset token y re-renderizar Turnstile
      this.turnstileToken = '';
      setTimeout(() => {
        this.renderLoginTurnstile();
      }, 100);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * PASO 2: Verificar código 2FA y completar login
   */
  async verifyCode() {
    if (!this.verificationCode || this.verificationCode.length !== 6) {
      await this.showToast('Por favor ingresa el código de 6 dígitos', 'warning');
      return;
    }

    if (!this.userId) {
      await this.showToast('Error: sesión inválida', 'danger');
      return;
    }

    this.isLoading = true;

    try {
      const response = await this.authService.loginVerify({
        userId: this.userId,
        code: this.verificationCode,
        turnstileToken: this.turnstileTokenVerify
      }).toPromise();

      if (response?.success || response?.data) {
        // Guardar token + userId
        localStorage.setItem('authToken', response?.token ?? '');
        localStorage.setItem('userId', String(response?.data?.id ?? ''));

        await this.showToast(`¡Bienvenido ${response?.data.firstName}! 👋`, 'success');

        // Determinar destino según rol
        const target = this.authService.isAdmin() ? '/dashboard' : '/tabs/encuestas';

        if (this.biometricAvailable && !this.hasBiometricCredentials) {
          await this.promptBiometricRegistration(target);
        } else {
          this.router.navigate([target]);
        }
      }

    } catch (error: any) {
      console.error('Error al verificar código:', error);
      const errorMessage = error.error?.error || error.error?.message || 'Código incorrecto';
      await this.showToast(errorMessage, 'danger');
      
      // Reset token y re-renderizar Turnstile
      this.turnstileTokenVerify = '';
      setTimeout(() => {
        this.renderVerifyTurnstile();
      }, 100);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Volver a la pantalla de login (cancelar verificación)
   */
  backToLogin() {
    this.showVerificationStep = false;
    this.verificationCode = '';
    this.userId = null;
    this.turnstileTokenVerify = '';
    this.turnstileToken = '';
    
    // Re-renderizar el primer widget de Turnstile
    setTimeout(() => {
      this.renderLoginTurnstile();
    }, 100);
  }

  /**
   * Renderizar widget de Turnstile para el paso de login
   */
  renderLoginTurnstile() {
    const widgets = document.querySelectorAll('.cf-turnstile');
    if (widgets.length > 0) {
      const container = widgets[0] as HTMLElement;
      container.innerHTML = '';
      
      if ((window as any).turnstile) {
        try {
          (window as any).turnstile.render(container, {
            sitekey: '0x4AAAAAACFTGe-2VlmzzEzV',
            callback: (token: string) => {
              this.turnstileToken = token;
              console.log('✅ Turnstile token (login) obtenido');
            },
            theme: 'light'
          });
        } catch (error) {
          console.error('❌ Error al re-renderizar Turnstile login:', error);
        }
      }
    }
  }

  /**
   * Renderizar widget de Turnstile para el paso de verificación
   */
  renderVerifyTurnstile() {
    const container = document.getElementById('turnstile-verify-container');
    
    if (!container) {
      console.error('❌ Contenedor de Turnstile no encontrado');
      return;
    }

    // Verificar si Turnstile está disponible
    if (!(window as any).turnstile) {
      console.error('❌ Script de Turnstile no cargado');
      setTimeout(() => this.renderVerifyTurnstile(), 500);
      return;
    }

    // Limpiar contenedor
    container.innerHTML = '';

    // Renderizar widget
    try {
      (window as any).turnstile.render('#turnstile-verify-container', {
        sitekey: '0x4AAAAAACFTGe-2VlmzzEzV',
        callback: (token: string) => {
          this.turnstileTokenVerify = token;
          console.log('✅ Turnstile token (verify) obtenido');
        },
        theme: 'light'
      });
      console.log('✅ Widget de verificación renderizado');
    } catch (error) {
      console.error('❌ Error al renderizar Turnstile:', error);
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
        
        // Guardar contraseña para uso con biometría (encriptada con btoa)
        localStorage.setItem('biometric_temp_pass', btoa(this.password));
        
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

      if (result.success && result.username) {
        // Biometría exitosa - obtener email del username
        this.email = result.username;
        
        // Necesitamos la contraseña guardada para hacer login/initiate
        const savedPassword = localStorage.getItem('biometric_temp_pass');
        
        if (!savedPassword) {
          await this.showToast('Por favor inicia sesión una vez con tu contraseña', 'warning');
          this.isLoading = false;
          return;
        }

        // Desencriptar contraseña
        const password = atob(savedPassword);

        // Hacer login/initiate con las credenciales
        try {
          const response = await this.authService.loginInitiate({
            email: this.email,
            password: password,
            turnstileToken: this.turnstileToken || 'biometric_bypass'
          }).toPromise();

          if (response?.success) {
            this.userId = response.userId;
            this.showVerificationStep = true;
            this.turnstileToken = '';
            
            // Renderizar Turnstile del paso 2
            setTimeout(() => {
              this.renderVerifyTurnstile();
            }, 100);
            
            await this.showToast('¡Hola! 👋 Código enviado a tu correo', 'success');
          }
        } catch (error: any) {
          console.error('Error en login biométrico:', error);
          await this.showToast('Error al iniciar sesión. Intenta con tu contraseña', 'danger');
        }
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
            localStorage.removeItem('biometric_temp_pass');
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
