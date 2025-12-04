import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SwPush } from '@angular/service-worker';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {
  private readonly API_URL = environment.apiUrl + '/push';

  constructor(
    private http: HttpClient,
    private swPush: SwPush,
    private platform: Platform
  ) {}

  async initialize() {
    if (!this.swPush.isEnabled) {
      console.warn('Service Worker is not enabled');
      return;
    }
  }

  async subscribeUser(userId: number): Promise<boolean> {
    if (!this.swPush.isEnabled) {
      console.warn('Push notifications not enabled (SW disabled)');
      // En desarrollo, si el SW no está activo, podríamos simular éxito o fallar.
      // Pero como forzamos enabled: true en main.ts, debería funcionar si se sirve correctamente.
      return false; 
    }

    try {
      const publicKey = await this.getPublicKey();
      if (!publicKey) {
        console.error('❌ No se recibió una clave pública válida del servidor.');
        return false;
      }

      const subscription = await this.swPush.requestSubscription({
        serverPublicKey: publicKey
      });

      await this.sendSubscriptionToBackend(subscription, userId);
      return true;
    } catch (err) {
      console.error('Could not subscribe to notifications', err);
      return false;
    }
  }

  private async getPublicKey(): Promise<string> {
    try {
      const response: any = await firstValueFrom(this.http.get(`${this.API_URL}/public-key`));
      console.log('🔑 Public Key Response:', response);
      
      // Adaptar a la estructura que devuelve el backend: { msg: '...', data: { publicKey: '...' } }
      if (response?.data?.publicKey) {
        return response.data.publicKey;
      }
      // Soporte para estructura simple { publicKey: '...' }
      if (response?.publicKey) {
        return response.publicKey;
      }

      return '';
    } catch (error) {
      console.error('❌ Error obteniendo public key:', error);
      return '';
    }
  }

  private async sendSubscriptionToBackend(subscription: PushSubscription, userId: number) {
    const payload = {
      subscription,
      userId
    };
    console.log('📤 Enviando suscripción al backend:', payload);
    
    await firstValueFrom(this.http.post(`${this.API_URL}/subscribe`, payload));
  }
}
