import { Injectable } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { AlertController, Platform } from '@ionic/angular';

@Injectable({ providedIn: 'root' })
export class UpdateService {
  private readonly CHECK_INTERVAL = 1000 * 60 * 15; // 15 minutos (más frecuente)

  constructor(
    private swUpdate: SwUpdate,
    private alertCtrl: AlertController,
    private platform: Platform
  ) {
    if (!this.swUpdate.isEnabled) {
      console.log('Service Worker no habilitado');
      return;
    }

    console.log('✅ UpdateService inicializado - Chequeos automáticos activos');

    // ✅ Nueva API Angular 16–20
    this.swUpdate.versionUpdates.subscribe(async (event) => {
      console.log('SW Event:', event);

      if (event.type === 'VERSION_READY') {
        console.log('🔄 Nueva versión detectada');
        await this.promptUserToUpdate();
      }
    });

    // Chequeo cuando la app vuelve de estar oculta (cambio de pestaña, lock screen, etc)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        console.log('👀 App visible, chequeando actualizaciones...');
        this.checkForUpdate();
      }
    });

    // Opcional: al volver del background en móvil
    try {
      (this.platform as any).resume?.subscribe(() => {
        console.log('📱 App resumed, chequeando actualizaciones...');
        this.checkForUpdate();
      });
    } catch (_) {}

    // Chequeos periódicos cada 15 minutos
    setInterval(() => {
      console.log('⏰ Chequeo periódico de actualizaciones...');
      this.checkForUpdate();
    }, this.CHECK_INTERVAL);

    // Chequeo inicial al cargar
    setTimeout(() => {
      console.log('🚀 Chequeo inicial de actualizaciones...');
      this.checkForUpdate();
    }, 5000); // Esperar 5 segundos después de cargar
  }

  // Revisa si existe una nueva versión
  async checkForUpdate() {
    try {
      await this.swUpdate.checkForUpdate();
    } catch (e) {
      console.warn('checkForUpdate failed', e);
    }
  }

  // Alerta para actualizar
  private async promptUserToUpdate() {
    const alert = await this.alertCtrl.create({
      header: 'Nueva versión disponible',
      message: 'Hay una nueva versión lista para instalar.',
      buttons: [
        { text: 'Ahora no', role: 'cancel' },
        {
          text: 'Actualizar',
          handler: () => this.doUpdate()
        }
      ]
    });

    await alert.present();
  }

  // Instalar update y recargar
  async doUpdate() {
    try {
      await this.swUpdate.activateUpdate();
      document.location.reload();
    } catch (e) {
      console.error('Error activating update', e);
      document.location.reload();
    }
  }
}
