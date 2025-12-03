import { Injectable } from '@angular/core';

export interface BiometricCredential {
  id: string;
  publicKey: string;
  userId: string;
  username: string;
}

@Injectable({
  providedIn: 'root'
})
export class BiometricAuthService {
  private readonly CREDENTIALS_KEY = 'biometric_credentials';

  constructor() { }

  /**
   * Verifica si el navegador soporta WebAuthn
   */
  isAvailable(): boolean {
    return !!(window.PublicKeyCredential && 
              navigator.credentials && 
              navigator.credentials.create);
  }

  /**
   * Verifica si el dispositivo tiene autenticación de plataforma (Face ID, Touch ID, Windows Hello)
   */
  async isPlatformAuthenticatorAvailable(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }
    
    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      console.log('Platform authenticator available:', available);
      console.log('User agent:', navigator.userAgent);
      return available;
    } catch (error) {
      console.error('Error checking platform authenticator:', error);
      return false;
    }
  }

  /**
   * Detecta si es Android
   */
  isAndroid(): boolean {
    return /Android/i.test(navigator.userAgent);
  }

  /**
   * Detecta si es iOS
   */
  isIOS(): boolean {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

  /**
   * Obtiene el nombre del tipo de biometría según el dispositivo
   */
  getBiometricName(): string {
    if (this.isAndroid()) {
      return 'Huella digital';
    } else if (this.isIOS()) {
      return 'Face ID / Touch ID';
    } else {
      return 'Windows Hello';
    }
  }

  /**
   * Registra una nueva credencial biométrica
   */
  async registerBiometric(username: string, userId: string): Promise<boolean> {
    if (!this.isAvailable()) {
      throw new Error('WebAuthn no está disponible en este navegador');
    }

    try {
      // Generar un challenge aleatorio
      const challenge = this.generateChallenge();
      
      // Configuración para crear la credencial
      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge: challenge,
        rp: {
          name: "Encuestas App",
          id: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
        },
        user: {
          id: this.stringToArrayBuffer(userId),
          name: username,
          displayName: username,
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" },  // ES256
          { alg: -257, type: "public-key" } // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform", // Face ID, Touch ID, Windows Hello
          userVerification: "required",
          requireResidentKey: false, // Cambiado para mejor compatibilidad
          residentKey: "preferred"
        },
        timeout: 60000,
        attestation: "none",
        extensions: {
          credProps: true // Ayuda en algunos navegadores
        }
      };

      // Crear la credencial
      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
      }) as PublicKeyCredential;

      if (credential) {
        // Guardar la credencial localmente
        const storedCredential: BiometricCredential = {
          id: this.arrayBufferToBase64(credential.rawId),
          publicKey: this.arrayBufferToBase64((credential.response as any).getPublicKey()),
          userId: userId,
          username: username
        };

        this.saveCredential(storedCredential);
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('Error registrando biométrica:', error);
      if (error.name === 'NotAllowedError') {
        throw new Error('Permiso denegado para usar biometría');
      }
      throw new Error('Error al registrar la biometría: ' + error.message);
    }
  }

  /**
   * Autentica usando biometría
   */
  async authenticateBiometric(): Promise<{ success: boolean; userId?: string; username?: string }> {
    if (!this.isAvailable()) {
      throw new Error('WebAuthn no está disponible en este navegador');
    }

    const savedCredentials = this.getSavedCredentials();
    if (savedCredentials.length === 0) {
      throw new Error('No hay credenciales biométricas registradas');
    }

    try {
      const challenge = this.generateChallenge();

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge: challenge,
        allowCredentials: savedCredentials.map(cred => ({
          id: this.base64ToArrayBuffer(cred.id),
          type: 'public-key' as const,
          transports: ['internal'] as AuthenticatorTransport[]
        })),
        timeout: 60000,
        userVerification: "required"
      };

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
      }) as PublicKeyCredential;

      if (assertion) {
        // Buscar la credencial correspondiente
        const credentialId = this.arrayBufferToBase64(assertion.rawId);
        const credential = savedCredentials.find(c => c.id === credentialId);

        if (credential) {
          return {
            success: true,
            userId: credential.userId,
            username: credential.username
          };
        }
      }

      return { success: false };
    } catch (error: any) {
      console.error('Error en autenticación biométrica:', error);
      if (error.name === 'NotAllowedError') {
        throw new Error('Autenticación cancelada');
      }
      throw new Error('Error en la autenticación: ' + error.message);
    }
  }

  /**
   * Verifica si hay credenciales biométricas guardadas
   */
  hasRegisteredCredentials(): boolean {
    return this.getSavedCredentials().length > 0;
  }

  /**
   * Obtiene las credenciales guardadas
   */
  getSavedCredentials(): BiometricCredential[] {
    const stored = localStorage.getItem(this.CREDENTIALS_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * Guarda una credencial
   */
  private saveCredential(credential: BiometricCredential): void {
    const credentials = this.getSavedCredentials();
    // Eliminar credenciales anteriores del mismo usuario
    const filtered = credentials.filter(c => c.userId !== credential.userId);
    filtered.push(credential);
    localStorage.setItem(this.CREDENTIALS_KEY, JSON.stringify(filtered));
  }

  /**
   * Elimina todas las credenciales biométricas
   */
  clearCredentials(): void {
    localStorage.removeItem(this.CREDENTIALS_KEY);
  }

  /**
   * Genera un challenge aleatorio
   */
  private generateChallenge(): Uint8Array {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    return challenge;
  }

  /**
   * Convierte string a ArrayBuffer
   */
  private stringToArrayBuffer(str: string): Uint8Array {
    return new TextEncoder().encode(str);
  }

  /**
   * Convierte ArrayBuffer a Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convierte Base64 a ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
